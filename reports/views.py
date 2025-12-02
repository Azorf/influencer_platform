from django.shortcuts import render, get_object_or_404, redirect
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from django.utils.translation import gettext as _
from django.http import JsonResponse, HttpResponse
from django.core.paginator import Paginator
from django.db import models
import json

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
    
    # Pagination
    paginator = Paginator(reports, 12)
    page_number = request.GET.get('page')
    page_obj = paginator.get_page(page_number)
    
    context = {
        'page_obj': page_obj,
        'report_types': Report.REPORT_TYPES,
        'current_type': report_type,
    }
    
    return render(request, 'reports/list.html', context)


@login_required
def report_create_view(request):
    """Create a new report"""
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
            report.save()
            messages.success(request, _('Report created successfully!'))
            return redirect('reports:report_detail', pk=report.pk)
    else:
        form = ReportForm()
    
    return render(request, 'reports/create.html', {'form': form})


@login_required
def report_detail_view(request, pk):
    """Report detail view"""
    report = get_object_or_404(Report, pk=pk)
    
    # Check permissions
    if request.user != report.agency.user and not request.user.agency_memberships.filter(agency=report.agency, is_active=True).exists():
        messages.error(request, _('You do not have permission to view this report.'))
        return redirect('reports:report_list')
    
    context = {
        'report': report,
    }
    
    return render(request, 'reports/detail.html', context)


@login_required
def report_download_view(request, pk):
    """Download report file"""
    report = get_object_or_404(Report, pk=pk)
    
    # Check permissions
    if request.user != report.agency.user and not request.user.agency_memberships.filter(agency=report.agency, is_active=True).exists():
        messages.error(request, _('You do not have permission to download this report.'))
        return redirect('reports:report_list')
    
    if not report.file_path:
        messages.error(request, _('Report file not found.'))
        return redirect('reports:report_detail', pk=pk)
    
    # TODO: Implement secure file download
    return HttpResponse('Download not implemented yet')


@login_required
def report_share_view(request, pk):
    """Share report"""
    report = get_object_or_404(Report, pk=pk)
    
    # Check permissions
    if request.user != report.agency.user:
        messages.error(request, _('Only the report creator can share reports.'))
        return redirect('reports:report_detail', pk=pk)
    
    # TODO: Implement report sharing
    context = {
        'report': report,
    }
    
    return render(request, 'reports/share.html', context)


@login_required
def template_list_view(request):
    """List report templates"""
    templates = ReportTemplate.objects.filter(
        models.Q(is_public=True) |
        models.Q(created_by=request.user)
    ).order_by('name')
    
    context = {
        'templates': templates,
    }
    
    return render(request, 'reports/templates.html', context)


@login_required
def template_detail_view(request, pk):
    """Template detail view"""
    template = get_object_or_404(ReportTemplate, pk=pk)
    
    context = {
        'template': template,
    }
    
    return render(request, 'reports/template_detail.html', context)


@login_required
def dashboard_list_view(request):
    """List dashboards"""
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
    """Create dashboard"""
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
    
    return render(request, 'reports/dashboard_create.html', {'form': form})


@login_required
def dashboard_view(request, pk):
    """View dashboard"""
    dashboard = get_object_or_404(Dashboard, pk=pk)
    
    # Check permissions
    if (request.user != dashboard.agency.user and 
        not request.user.agency_memberships.filter(agency=dashboard.agency, is_active=True).exists() and
        not dashboard.shared_with.filter(id=request.user.id).exists()):
        messages.error(request, _('You do not have permission to view this dashboard.'))
        return redirect('reports:dashboard_list')
    
    context = {
        'dashboard': dashboard,
    }
    
    return render(request, 'reports/dashboard_view.html', context)


@login_required
def dashboard_edit_view(request, pk):
    """Edit dashboard"""
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
    
    return render(request, 'reports/dashboard_edit.html', {'form': form, 'dashboard': dashboard})


@login_required
def snapshot_list_view(request):
    """List analytics snapshots"""
    try:
        agency = Agency.objects.get(user=request.user)
        snapshots = AnalyticsSnapshot.objects.filter(agency=agency).order_by('-snapshot_date')
    except Agency.DoesNotExist:
        snapshots = []
    
    context = {
        'snapshots': snapshots,
    }
    
    return render(request, 'reports/snapshots.html', context)


@login_required
def create_snapshot_view(request):
    """Create analytics snapshot"""
    # TODO: Implement snapshot creation
    messages.info(request, _('Snapshot creation is not implemented yet.'))
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
    """Create report subscription"""
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
            messages.success(request, _('Subscription created successfully!'))
            return redirect('reports:subscription_list')
    else:
        form = ReportSubscriptionForm()
    
    return render(request, 'reports/subscription_create.html', {'form': form})