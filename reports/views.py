# reports/views.py
"""
REST API views for reports app
Returns JSON for frontend consumption
"""
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.db.models import Q
from django.utils import timezone
from django.http import FileResponse, HttpResponse
from django.conf import settings
import os

from .models import Report, ReportTemplate, Dashboard, AnalyticsSnapshot, ReportSubscription
from .serializers import (
    ReportListSerializer,
    ReportDetailSerializer,
    ReportCreateSerializer,
    ReportTemplateSerializer,
    DashboardListSerializer,
    DashboardDetailSerializer,
    DashboardCreateSerializer,
    AnalyticsSnapshotSerializer,
    ReportSubscriptionSerializer,
)
from agencies.models import Agency


def get_user_agency(user):
    """Helper to get agency for current user"""
    # Try as agency owner
    try:
        return Agency.objects.get(user=user)
    except Agency.DoesNotExist:
        pass
    
    # Try as team member
    membership = user.agency_memberships.filter(is_active=True).first()
    if membership:
        return membership.agency
    
    return None


# =============================================================================
# Reports
# =============================================================================

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def report_list(request):
    """List or create reports"""
    agency = get_user_agency(request.user)
    if not agency:
        return Response({'error': 'Agency not found'}, status=status.HTTP_404_NOT_FOUND)
    
    if request.method == 'GET':
        reports = Report.objects.filter(agency=agency)
        
        # Filters
        report_type = request.query_params.get('type')
        if report_type:
            reports = reports.filter(report_type=report_type)
        
        status_filter = request.query_params.get('status')
        if status_filter:
            reports = reports.filter(status=status_filter)
        
        search = request.query_params.get('search')
        if search:
            reports = reports.filter(title__icontains=search)
        
        serializer = ReportListSerializer(reports.order_by('-created_at'), many=True)
        return Response(serializer.data)
    
    elif request.method == 'POST':
        serializer = ReportCreateSerializer(data=request.data)
        if serializer.is_valid():
            report = serializer.save(
                agency=agency,
                created_by=request.user,
                status='generating',
                generation_started_at=timezone.now()
            )
            
            # Trigger background report generation
            try:
                from .tasks import generate_report_task
                generate_report_task.delay(report.id)
            except Exception:
                pass  # Task queue may not be set up
            
            return Response(
                ReportDetailSerializer(report).data,
                status=status.HTTP_201_CREATED
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'DELETE'])
@permission_classes([IsAuthenticated])
def report_detail(request, pk):
    """Get or delete report"""
    agency = get_user_agency(request.user)
    if not agency:
        return Response({'error': 'Agency not found'}, status=status.HTTP_404_NOT_FOUND)
    
    report = get_object_or_404(Report, pk=pk, agency=agency)
    
    if request.method == 'GET':
        serializer = ReportDetailSerializer(report)
        return Response(serializer.data)
    
    elif request.method == 'DELETE':
        # Check permissions
        if request.user != report.created_by and request.user != agency.user:
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
        
        # Delete file if exists
        if report.file_path:
            try:
                file_path = report.file_path.path if hasattr(report.file_path, 'path') else os.path.join(settings.MEDIA_ROOT, str(report.file_path))
                if os.path.exists(file_path):
                    os.remove(file_path)
            except Exception:
                pass
        
        report.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def report_download(request, pk):
    """Download report file"""
    agency = get_user_agency(request.user)
    if not agency:
        return Response({'error': 'Agency not found'}, status=status.HTTP_404_NOT_FOUND)
    
    report = get_object_or_404(Report, pk=pk, agency=agency)
    
    if report.status != 'completed' or not report.file_path:
        return Response({'error': 'Report not ready for download'}, status=status.HTTP_400_BAD_REQUEST)
    
    file_path = report.file_path.path if hasattr(report.file_path, 'path') else os.path.join(settings.MEDIA_ROOT, str(report.file_path))
    if not os.path.exists(file_path):
        return Response({'error': 'Report file not found'}, status=status.HTTP_404_NOT_FOUND)
    
    content_types = {
        'pdf': 'application/pdf',
        'excel': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'csv': 'text/csv',
        'json': 'application/json',
    }
    
    content_type = content_types.get(report.file_format, 'application/octet-stream')
    filename = f"{report.title}_{report.created_at.strftime('%Y%m%d')}.{report.file_format}"
    
    response = FileResponse(open(file_path, 'rb'), content_type=content_type)
    response['Content-Disposition'] = f'attachment; filename="{filename}"'
    return response


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def report_status(request, pk):
    """Check report generation status"""
    agency = get_user_agency(request.user)
    if not agency:
        return Response({'error': 'Agency not found'}, status=status.HTTP_404_NOT_FOUND)
    
    report = get_object_or_404(Report, pk=pk, agency=agency)
    
    progress = 0
    if report.status == 'completed':
        progress = 100
    elif report.status == 'generating':
        progress = 50
    
    generation_time = None
    if report.generation_completed_at and report.generation_started_at:
        generation_time = (report.generation_completed_at - report.generation_started_at).total_seconds()
    
    return Response({
        'id': report.id,
        'status': report.status,
        'statusDisplay': report.get_status_display(),
        'progress': progress,
        'errorMessage': report.error_message,
        'downloadUrl': f"/api/reports/{report.id}/download/" if report.status == 'completed' else None,
        'fileFormat': report.file_format,
        'generationTime': generation_time,
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def report_regenerate(request, pk):
    """Regenerate a failed or completed report"""
    agency = get_user_agency(request.user)
    if not agency:
        return Response({'error': 'Agency not found'}, status=status.HTTP_404_NOT_FOUND)
    
    report = get_object_or_404(Report, pk=pk, agency=agency)
    
    if report.status not in ['failed', 'completed']:
        return Response(
            {'error': 'Report can only be regenerated if failed or completed'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    report.status = 'generating'
    report.generation_started_at = timezone.now()
    report.generation_completed_at = None
    report.error_message = None
    report.save()
    
    try:
        from .tasks import generate_report_task
        generate_report_task.delay(report.id)
    except Exception:
        pass
    
    return Response({'status': 'success', 'message': 'Report regeneration started'})


# =============================================================================
# Report Templates
# =============================================================================

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def template_list(request):
    """List available report templates"""
    agency = get_user_agency(request.user)
    
    # Get templates accessible to this user/agency
    templates = ReportTemplate.objects.filter(
        Q(is_public=True) |
        Q(created_by=request.user)
    )
    
    if agency:
        templates = templates | ReportTemplate.objects.filter(allowed_agencies=agency)
    
    templates = templates.distinct()
    
    serializer = ReportTemplateSerializer(templates, many=True)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def template_detail(request, pk):
    """Get template detail"""
    agency = get_user_agency(request.user)
    
    template = get_object_or_404(ReportTemplate, pk=pk)
    
    # Check access
    has_access = (
        template.is_public or
        template.created_by == request.user or
        (agency and template.allowed_agencies.filter(id=agency.id).exists())
    )
    
    if not has_access:
        return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
    
    serializer = ReportTemplateSerializer(template)
    return Response(serializer.data)


# =============================================================================
# Dashboards
# =============================================================================

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def dashboard_list(request):
    """List or create dashboards"""
    agency = get_user_agency(request.user)
    if not agency:
        return Response({'error': 'Agency not found'}, status=status.HTTP_404_NOT_FOUND)
    
    if request.method == 'GET':
        # Get dashboards owned by agency or shared with user
        dashboards = Dashboard.objects.filter(
            Q(agency=agency) | Q(shared_with=request.user)
        ).distinct()
        
        serializer = DashboardListSerializer(dashboards, many=True)
        return Response(serializer.data)
    
    elif request.method == 'POST':
        serializer = DashboardCreateSerializer(data=request.data)
        if serializer.is_valid():
            # If setting as default, unset other defaults
            if serializer.validated_data.get('is_default'):
                Dashboard.objects.filter(agency=agency, is_default=True).update(is_default=False)
            
            dashboard = serializer.save(agency=agency, created_by=request.user)
            return Response(
                DashboardDetailSerializer(dashboard).data,
                status=status.HTTP_201_CREATED
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'PUT', 'DELETE'])
@permission_classes([IsAuthenticated])
def dashboard_detail(request, pk):
    """Get, update or delete dashboard"""
    agency = get_user_agency(request.user)
    if not agency:
        return Response({'error': 'Agency not found'}, status=status.HTTP_404_NOT_FOUND)
    
    dashboard = get_object_or_404(
        Dashboard,
        Q(pk=pk) & (Q(agency=agency) | Q(shared_with=request.user))
    )
    
    if request.method == 'GET':
        serializer = DashboardDetailSerializer(dashboard)
        return Response(serializer.data)
    
    elif request.method == 'PUT':
        # Only owner/creator can edit
        if dashboard.agency != agency:
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
        
        serializer = DashboardCreateSerializer(dashboard, data=request.data, partial=True)
        if serializer.is_valid():
            if serializer.validated_data.get('is_default'):
                Dashboard.objects.filter(agency=agency, is_default=True).exclude(pk=pk).update(is_default=False)
            serializer.save()
            return Response(DashboardDetailSerializer(dashboard).data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    elif request.method == 'DELETE':
        if dashboard.agency != agency:
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
        dashboard.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


# =============================================================================
# Analytics Snapshots
# =============================================================================

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def snapshot_list(request):
    """List or create analytics snapshots"""
    agency = get_user_agency(request.user)
    if not agency:
        return Response({'error': 'Agency not found'}, status=status.HTTP_404_NOT_FOUND)
    
    if request.method == 'GET':
        snapshots = AnalyticsSnapshot.objects.filter(agency=agency)
        
        # Filter by type
        snapshot_type = request.query_params.get('type')
        if snapshot_type:
            snapshots = snapshots.filter(snapshot_type=snapshot_type)
        
        serializer = AnalyticsSnapshotSerializer(snapshots.order_by('-snapshot_date')[:100], many=True)
        return Response(serializer.data)
    
    elif request.method == 'POST':
        snapshot_type = request.data.get('snapshotType', 'agency')
        
        if snapshot_type == 'agency':
            try:
                from .tasks import create_agency_snapshot
                create_agency_snapshot.delay(agency.id)
                return Response({'status': 'success', 'message': 'Snapshot creation started'})
            except Exception:
                # Create synchronously if Celery not available
                snapshot = AnalyticsSnapshot.objects.create(
                    snapshot_type='agency',
                    agency=agency,
                    snapshot_date=timezone.now(),
                    metrics={}
                )
                return Response(AnalyticsSnapshotSerializer(snapshot).data, status=status.HTTP_201_CREATED)
        
        return Response({'error': 'Invalid snapshot type'}, status=status.HTTP_400_BAD_REQUEST)


# =============================================================================
# Report Subscriptions
# =============================================================================

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def subscription_list(request):
    """List or create report subscriptions"""
    agency = get_user_agency(request.user)
    if not agency:
        return Response({'error': 'Agency not found'}, status=status.HTTP_404_NOT_FOUND)
    
    if request.method == 'GET':
        subscriptions = ReportSubscription.objects.filter(agency=agency)
        serializer = ReportSubscriptionSerializer(subscriptions, many=True)
        return Response(serializer.data)
    
    elif request.method == 'POST':
        serializer = ReportSubscriptionSerializer(data=request.data)
        if serializer.is_valid():
            subscription = serializer.save(agency=agency, created_by=request.user)
            
            # Calculate next delivery
            # subscription.calculate_next_delivery()
            # subscription.save()
            
            return Response(
                ReportSubscriptionSerializer(subscription).data,
                status=status.HTTP_201_CREATED
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'PUT', 'DELETE'])
@permission_classes([IsAuthenticated])
def subscription_detail(request, pk):
    """Get, update or delete subscription"""
    agency = get_user_agency(request.user)
    if not agency:
        return Response({'error': 'Agency not found'}, status=status.HTTP_404_NOT_FOUND)
    
    subscription = get_object_or_404(ReportSubscription, pk=pk, agency=agency)
    
    if request.method == 'GET':
        serializer = ReportSubscriptionSerializer(subscription)
        return Response(serializer.data)
    
    elif request.method == 'PUT':
        serializer = ReportSubscriptionSerializer(subscription, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(ReportSubscriptionSerializer(subscription).data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    elif request.method == 'DELETE':
        subscription.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def subscription_toggle(request, pk):
    """Toggle subscription active status"""
    agency = get_user_agency(request.user)
    if not agency:
        return Response({'error': 'Agency not found'}, status=status.HTTP_404_NOT_FOUND)
    
    subscription = get_object_or_404(ReportSubscription, pk=pk, agency=agency)
    subscription.is_active = not subscription.is_active
    subscription.save()
    
    return Response({
        'id': subscription.id,
        'isActive': subscription.is_active,
        'message': f"Subscription {'activated' if subscription.is_active else 'deactivated'}"
    })


# =============================================================================
# Report Types & Formats (for dropdowns)
# =============================================================================

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def report_options(request):
    """Get available report types and formats for forms"""
    return Response({
        'reportTypes': [
            {'value': value, 'label': str(label)}
            for value, label in Report.REPORT_TYPES
        ],
        'formats': [
            {'value': value, 'label': str(label)}
            for value, label in Report.FORMAT_CHOICES
        ],
        'frequencies': [
            {'value': 'daily', 'label': 'Daily'},
            {'value': 'weekly', 'label': 'Weekly'},
            {'value': 'monthly', 'label': 'Monthly'},
            {'value': 'quarterly', 'label': 'Quarterly'},
        ],
        'dashboardTypes': [
            {'value': value, 'label': str(label)}
            for value, label in Dashboard.DASHBOARD_TYPES
        ],
    })
