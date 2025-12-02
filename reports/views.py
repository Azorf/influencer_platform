from django.shortcuts import render, get_object_or_404, redirect
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from django.utils.translation import gettext as _
from django.http import JsonResponse, HttpResponse, FileResponse
from django.core.paginator import Paginator
from django.views.decorators.http import require_http_methods
from django.views.decorators.csrf import csrf_exempt
from django.db import models
from django.utils import timezone
from django.core.mail import send_mail
from django.conf import settings
import json
import os

from .models import Report, ReportTemplate, Dashboard, AnalyticsSnapshot, ReportSubscription
from .forms import ReportForm, DashboardForm, ReportSubscriptionForm
from agencies.models import Agency


@login_required
def report_list_view(request):
    """List reports for the current agency"""
    try:
        agency = Agency.objects.get(user=request.user)
    except Agency.DoesNotExist:
        messages.error(request, _('Agency profile not found.'))
        return redirect('accounts:dashboard')
    
    reports = Report.objects.filter(agency=agency).order_by('-created_at')
    
    # Filter by type
    report_type = request.GET.get('type')
    if report_type:
        reports = reports.filter(report_type=report_type)
    
    # Filter by status
    status_filter = request.GET.get('status')
    if status_filter:
        reports = reports.filter(status=status_filter)
    
    # Search
    search_query = request.GET.get('search')
    if search_query:
        reports = reports.filter(title__icontains=search_query)
    
    # Pagination
    paginator = Paginator(reports, 12)
    page_number = request.GET.get('page')
    page_obj = paginator.get_page(page_number)
    
    context = {
        'page_obj': page_obj,
        'report_types': Report.REPORT_TYPES,
        'status_choices': Report.STATUS_CHOICES,
        'current_type': report_type,
        'current_status': status_filter,
        'search_query': search_query,
    }
    
    return render(request, 'reports/list.html', context)


@login_required
def report_create_view(request):
    """Create a new report with background generation"""
    try:
        agency = Agency.objects.get(user=request.user)
    except Agency.DoesNotExist:
        messages.error(request, _('Agency profile not found.'))
        return redirect('accounts:dashboard')
    
    if request.method == 'POST':
        form = ReportForm(request.POST)
        if form.is_valid():
            report = form.save(commit=False)
            report.agency = agency
            report.created_by = request.user
            report.status = 'generating'  # Set to generating status
            report.generation_started_at = timezone.now()
            report.save()
            
            # Trigger background report generation
            from .tasks import generate_report_task
            generate_report_task.delay(report.id)
            
            messages.success(request, _(
                'Report generation started! You will receive an email notification when the report is ready.'
            ))
            return redirect('reports:report_detail', pk=report.pk)
    else:
        form = ReportForm()
    
    # Get available campaigns for parameter configuration
    from campaigns.models import Campaign
    campaigns = Campaign.objects.filter(agency=agency)
    
    context = {
        'form': form,
        'campaigns': campaigns,
        'report_types': Report.REPORT_TYPES,
        'format_choices': Report.FORMAT_CHOICES,
    }
    
    return render(request, 'reports/create.html', context)


@login_required
def report_detail_view(request, pk):
    """Enhanced report detail view with generation status"""
    report = get_object_or_404(Report, pk=pk)
    
    # Check permissions
    if request.user != report.agency.user and not request.user.agency_memberships.filter(agency=report.agency, is_active=True).exists():
        messages.error(request, _('You do not have permission to view this report.'))
        return redirect('reports:report_list')
    
    # Calculate generation time if completed
    generation_time = None
    if report.generation_completed_at and report.generation_started_at:
        generation_time = (report.generation_completed_at - report.generation_started_at).total_seconds()
    
    context = {
        'report': report,
        'can_download': report.status == 'completed' and report.file_path,
        'can_regenerate': report.status == 'failed',
        'generation_time': generation_time,
    }
    
    return render(request, 'reports/detail.html', context)


@login_required
def report_download_view(request, pk):
    """Secure report file download with proper permissions"""
    report = get_object_or_404(Report, pk=pk)
    
    # Check permissions
    if request.user != report.agency.user and not request.user.agency_memberships.filter(agency=report.agency, is_active=True).exists():
        messages.error(request, _('You do not have permission to download this report.'))
        return redirect('reports:report_list')
    
    # Check if report is ready
    if report.status != 'completed' or not report.file_path:
        messages.error(request, _('Report is not ready for download.'))
        return redirect('reports:report_detail', pk=pk)
    
    # Check if file exists
    file_path = report.file_path.path if hasattr(report.file_path, 'path') else os.path.join(settings.MEDIA_ROOT, str(report.file_path))
    if not os.path.exists(file_path):
        messages.error(request, _('Report file not found.'))
        return redirect('reports:report_detail', pk=pk)
    
    # Determine content type
    content_types = {
        'pdf': 'application/pdf',
        'excel': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'csv': 'text/csv',
        'json': 'application/json',
    }
    
    content_type = content_types.get(report.file_format, 'application/octet-stream')
    filename = f"{report.title}_{report.created_at.strftime('%Y%m%d')}.{report.file_format}"
    
    # Serve file
    response = FileResponse(
        open(file_path, 'rb'),
        content_type=content_type
    )
    response['Content-Disposition'] = f'attachment; filename="{filename}"'
    
    return response


@login_required
def report_share_view(request, pk):
    """Enhanced report sharing with email functionality"""
    report = get_object_or_404(Report, pk=pk)
    
    # Check permissions
    if request.user != report.agency.user:
        messages.error(request, _('Only the report creator can share reports.'))
        return redirect('reports:report_detail', pk=pk)
    
    if request.method == 'POST':
        email = request.POST.get('email')
        message = request.POST.get('message', '')
        
        if email:
            try:
                # Send sharing email
                download_url = request.build_absolute_uri(
                    f"/reports/{report.id}/download/"
                )
                
                subject = f"Report Shared: {report.title}"
                email_body = f"""
{request.user.get_full_name() or request.user.username} has shared a report with you.

Report: {report.title}
Type: {report.get_report_type_display()}
Generated: {report.created_at.strftime('%B %d, %Y')}

{message}

Download Report: {download_url}
                """
                
                send_mail(
                    subject=subject,
                    message=email_body,
                    from_email=settings.DEFAULT_FROM_EMAIL,
                    recipient_list=[email],
                    fail_silently=False,
                )
                
                messages.success(request, f'Report shared successfully with {email}')
                return redirect('reports:report_detail', pk=pk)
                
            except Exception as e:
                messages.error(request, f'Failed to send email: {str(e)}')
    
    context = {
        'report': report,
    }
    
    return render(request, 'reports/share.html', context)


@login_required
def template_list_view(request):
    """List available report templates"""
    try:
        agency = Agency.objects.get(user=request.user)
    except Agency.DoesNotExist:
        agency = None
    
    templates = ReportTemplate.objects.filter(
        models.Q(is_public=True) |
        models.Q(created_by=request.user)
    )
    
    if agency:
        templates = templates.filter(
            models.Q(is_public=True) |
            models.Q(created_by=request.user) |
            models.Q(allowed_agencies=agency)
        )
    
    templates = templates.distinct().order_by('name')
    
    context = {
        'templates': templates,
    }
    
    return render(request, 'reports/templates.html', context)


@login_required
def template_detail_view(request, pk):
    """Template detail view with usage options"""
    template = get_object_or_404(ReportTemplate, pk=pk)
    
    # Check access permissions
    try:
        agency = Agency.objects.get(user=request.user)
        has_access = (
            template.is_public or 
            template.created_by == request.user or 
            agency in template.allowed_agencies.all()
        )
    except Agency.DoesNotExist:
        has_access = template.is_public or template.created_by == request.user
    
    if not has_access:
        messages.error(request, _('You do not have access to this template.'))
        return redirect('reports:template_list')
    
    context = {
        'template': template,
    }
    
    return render(request, 'reports/template_detail.html', context)


@login_required
def dashboard_list_view(request):
    """List dashboards for agency"""
    try:
        agency = Agency.objects.get(user=request.user)
        dashboards = agency.dashboards.all().order_by('name')
    except Agency.DoesNotExist:
        dashboards = []
    
    context = {
        'dashboards': dashboards,
    }
    
    return render(request, 'reports/dashboards.html', context)


@login_required
def dashboard_create_view(request):
    """Create new dashboard"""
    try:
        agency = Agency.objects.get(user=request.user)
    except Agency.DoesNotExist:
        messages.error(request, _('Agency profile not found.'))
        return redirect('accounts:dashboard')
    
    if request.method == 'POST':
        form = DashboardForm(request.POST)
        if form.is_valid():
            dashboard = form.save(commit=False)
            dashboard.agency = agency
            dashboard.created_by = request.user
            dashboard.save()
            messages.success(request, _('Dashboard created successfully!'))
            return redirect('reports:dashboard_view', pk=dashboard.pk)
    else:
        form = DashboardForm()
    
    context = {
        'form': form,
    }
    
    return render(request, 'reports/dashboard_create.html', context)


@login_required
def dashboard_view(request, pk):
    """View dashboard with real-time data"""
    dashboard = get_object_or_404(Dashboard, pk=pk)
    
    # Check permissions
    if (request.user != dashboard.agency.user and 
        not request.user.agency_memberships.filter(agency=dashboard.agency, is_active=True).exists() and
        not dashboard.shared_with.filter(id=request.user.id).exists()):
        messages.error(request, _('You do not have permission to view this dashboard.'))
        return redirect('reports:dashboard_list')
    
    # Get dashboard data based on widgets configuration
    dashboard_data = get_dashboard_data(dashboard)
    
    context = {
        'dashboard': dashboard,
        'dashboard_data': dashboard_data,
    }
    
    return render(request, 'reports/dashboard_view.html', context)


@login_required
def dashboard_edit_view(request, pk):
    """Edit dashboard configuration"""
    dashboard = get_object_or_404(Dashboard, pk=pk)
    
    # Check permissions
    if request.user != dashboard.created_by:
        messages.error(request, _('Only the dashboard creator can edit it.'))
        return redirect('reports:dashboard_view', pk=pk)
    
    if request.method == 'POST':
        form = DashboardForm(request.POST, instance=dashboard)
        if form.is_valid():
            form.save()
            messages.success(request, _('Dashboard updated successfully!'))
            return redirect('reports:dashboard_view', pk=pk)
    else:
        form = DashboardForm(instance=dashboard)
    
    context = {
        'form': form,
        'dashboard': dashboard,
    }
    
    return render(request, 'reports/dashboard_edit.html', context)


@login_required
def snapshot_list_view(request):
    """List analytics snapshots"""
    try:
        agency = Agency.objects.get(user=request.user)
        snapshots = AnalyticsSnapshot.objects.filter(agency=agency).order_by('-snapshot_date')
    except Agency.DoesNotExist:
        snapshots = []
    
    # Pagination
    paginator = Paginator(snapshots, 20)
    page_number = request.GET.get('page')
    page_obj = paginator.get_page(page_number)
    
    context = {
        'page_obj': page_obj,
        'snapshot_types': AnalyticsSnapshot.SNAPSHOT_TYPES,
    }
    
    return render(request, 'reports/snapshots.html', context)


@login_required
def create_snapshot_view(request):
    """Create analytics snapshot manually"""
    try:
        agency = Agency.objects.get(user=request.user)
    except Agency.DoesNotExist:
        messages.error(request, _('Agency profile not found.'))
        return redirect('accounts:dashboard')
    
    if request.method == 'POST':
        snapshot_type = request.POST.get('snapshot_type')
        
        if snapshot_type == 'agency':
            # Create agency-wide snapshot
            from .tasks import create_agency_snapshot
            create_agency_snapshot.delay(agency.id)
            messages.success(request, _('Agency snapshot creation started.'))
        else:
            messages.error(request, _('Invalid snapshot type.'))
    
    return redirect('reports:snapshot_list')


@login_required
def subscription_list_view(request):
    """List report subscriptions"""
    try:
        agency = Agency.objects.get(user=request.user)
        subscriptions = agency.report_subscriptions.all().order_by('name')
    except Agency.DoesNotExist:
        subscriptions = []
    
    context = {
        'subscriptions': subscriptions,
    }
    
    return render(request, 'reports/subscriptions.html', context)


@login_required
def subscription_create_view(request):
    """Create automated report subscription"""
    try:
        agency = Agency.objects.get(user=request.user)
    except Agency.DoesNotExist:
        messages.error(request, _('Agency profile not found.'))
        return redirect('accounts:dashboard')
    
    if request.method == 'POST':
        form = ReportSubscriptionForm(request.POST)
        if form.is_valid():
            subscription = form.save(commit=False)
            subscription.agency = agency
            subscription.created_by = request.user
            subscription.save()
            
            # Calculate next delivery date
            subscription.calculate_next_delivery()
            subscription.save()
            
            messages.success(request, _('Subscription created successfully!'))
            return redirect('reports:subscription_list')
    else:
        form = ReportSubscriptionForm()
        # Filter templates by agency access
        form.fields['report_template'].queryset = ReportTemplate.objects.filter(
            models.Q(is_public=True) |
            models.Q(created_by=request.user) |
            models.Q(allowed_agencies=agency)
        )
    
    context = {
        'form': form,
    }
    
    return render(request, 'reports/subscription_create.html', context)


# API Endpoints for AJAX operations

@csrf_exempt
@require_http_methods(["GET"])
@login_required
def api_report_status(request, pk):
    """API endpoint to check report generation status"""
    try:
        agency = Agency.objects.get(user=request.user)
        report = get_object_or_404(Report, pk=pk, agency=agency)
        
        progress = 0
        if report.status == 'completed':
            progress = 100
        elif report.status == 'generating':
            progress = 50
        elif report.status == 'failed':
            progress = 0
        
        return JsonResponse({
            'report_id': report.id,
            'status': report.status,
            'status_display': report.get_status_display(),
            'progress': progress,
            'error_message': report.error_message,
            'download_url': f"/reports/{report.id}/download/" if report.status == 'completed' else None,
            'file_format': report.file_format,
            'generation_time': str(report.generation_completed_at - report.generation_started_at) if report.generation_completed_at and report.generation_started_at else None,
            'created_at': report.created_at.isoformat(),
        })
        
    except Agency.DoesNotExist:
        return JsonResponse({'error': 'Agency not found'}, status=404)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)


@csrf_exempt
@require_http_methods(["POST"])
@login_required
def api_regenerate_report(request, pk):
    """API endpoint to regenerate a failed report"""
    try:
        agency = Agency.objects.get(user=request.user)
        report = get_object_or_404(Report, pk=pk, agency=agency)
        
        # Only allow regeneration of failed reports
        if report.status not in ['failed', 'completed']:
            return JsonResponse({
                'success': False, 
                'error': 'Report can only be regenerated if failed or completed'
            })
        
        # Reset status and regenerate
        report.status = 'generating'
        report.generation_started_at = timezone.now()
        report.generation_completed_at = None
        report.error_message = None
        report.save()
        
        # Trigger regeneration
        from .tasks import generate_report_task
        generate_report_task.delay(report.id)
        
        return JsonResponse({
            'success': True,
            'message': 'Report regeneration started'
        })
        
    except Exception as e:
        return JsonResponse({'success': False, 'error': str(e)})


@csrf_exempt
@require_http_methods(["DELETE"])
@login_required
def api_delete_report(request, pk):
    """API endpoint to delete a report"""
    try:
        agency = Agency.objects.get(user=request.user)
        report = get_object_or_404(Report, pk=pk, agency=agency)
        
        # Check if user can delete (owner or agency admin)
        if request.user != report.created_by and request.user != report.agency.user:
            return JsonResponse({'error': 'Permission denied'}, status=403)
        
        # Delete file if exists
        if report.file_path:
            try:
                file_path = report.file_path.path if hasattr(report.file_path, 'path') else os.path.join(settings.MEDIA_ROOT, str(report.file_path))
                if os.path.exists(file_path):
                    os.remove(file_path)
            except Exception:
                pass  # Don't fail if file deletion fails
        
        # Delete report record
        report.delete()
        
        return JsonResponse({
            'success': True,
            'message': 'Report deleted successfully'
        })
        
    except Exception as e:
        return JsonResponse({'success': False, 'error': str(e)})


# Utility Functions

def get_dashboard_data(dashboard):
    """Get data for dashboard widgets"""
    # This would collect data based on dashboard.widgets configuration
    # For now, return empty dict - implement based on your specific widgets
    return {
        'widgets': dashboard.widgets,
        'layout': dashboard.layout,
        'last_updated': timezone.now(),
    }
