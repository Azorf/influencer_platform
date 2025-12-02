# reports/tasks.py
# Celery tasks for background report generation

from celery import shared_task
from django.utils import timezone
from django.core.mail import send_mail
from django.conf import settings
import logging

logger = logging.getLogger(__name__)


@shared_task
def generate_report_task(report_id):
    """
    Background task to generate report files
    """
    try:
        from .models import Report
        from .report_generation_system import ReportGenerator
        
        # Get the report
        report = Report.objects.get(id=report_id)
        
        # Update status
        report.status = 'generating'
        report.generation_started_at = timezone.now()
        report.save()
        
        # Generate the report
        generator = ReportGenerator(report)
        file_path = generator.generate_report()
        
        logger.info(f"Report {report_id} generated successfully: {file_path}")
        
        # Send notification email
        send_report_ready_notification(report)
        
        return f"Report {report_id} generated successfully"
        
    except Report.DoesNotExist:
        logger.error(f"Report {report_id} not found")
        return f"Report {report_id} not found"
    except Exception as e:
        logger.error(f"Report generation failed for {report_id}: {str(e)}")
        
        # Update report with error
        try:
            report = Report.objects.get(id=report_id)
            report.status = 'failed'
            report.error_message = str(e)
            report.save()
        except:
            pass
        
        return f"Report generation failed: {str(e)}"


@shared_task
def generate_scheduled_reports():
    """
    Task to generate all scheduled reports that are due
    """
    from .models import ReportSubscription, Report
    
    # Get all active subscriptions that are due
    due_subscriptions = ReportSubscription.objects.filter(
        is_active=True,
        next_delivery__lte=timezone.now()
    )
    
    generated_count = 0
    
    for subscription in due_subscriptions:
        try:
            # Create report from subscription
            report = Report.objects.create(
                title=f"{subscription.name} - {timezone.now().strftime('%Y-%m-%d')}",
                description=f"Scheduled report: {subscription.name}",
                report_type=subscription.report_template.report_type,
                parameters=subscription.report_parameters,
                filters=subscription.report_template.default_filters,
                file_format='pdf',  # Default format for scheduled reports
                agency=subscription.agency,
                created_by=subscription.created_by,
                status='generating',
                is_scheduled=True,
            )
            
            # Generate report
            generate_report_task.delay(report.id)
            
            # Update subscription
            subscription.last_delivered = timezone.now()
            subscription.calculate_next_delivery()
            subscription.save()
            
            generated_count += 1
            logger.info(f"Scheduled report created for subscription {subscription.id}")
            
        except Exception as e:
            logger.error(f"Failed to create scheduled report for subscription {subscription.id}: {str(e)}")
    
    return f"Generated {generated_count} scheduled reports"


@shared_task
def create_agency_snapshot(agency_id):
    """
    Create analytics snapshot for an agency
    """
    try:
        from agencies.models import Agency
        from .models import AnalyticsSnapshot
        from campaigns.models import Campaign, CampaignAnalytics
        
        agency = Agency.objects.get(id=agency_id)
        
        # Collect agency-wide metrics
        campaigns = Campaign.objects.filter(agency=agency)
        
        total_campaigns = campaigns.count()
        active_campaigns = campaigns.filter(status='active').count()
        total_budget = sum(campaign.total_budget for campaign in campaigns)
        total_spent = sum(campaign.get_total_spent() for campaign in campaigns)
        
        # Calculate aggregated analytics
        total_reach = 0
        total_engagement = 0
        
        for campaign in campaigns:
            try:
                analytics = campaign.analytics
                total_reach += analytics.total_reach
                total_engagement += (analytics.total_likes + analytics.total_comments + analytics.total_shares)
            except CampaignAnalytics.DoesNotExist:
                continue
        
        # Create snapshot
        snapshot = AnalyticsSnapshot.objects.create(
            snapshot_type='agency',
            agency=agency,
            snapshot_date=timezone.now(),
            metrics={
                'total_campaigns': total_campaigns,
                'active_campaigns': active_campaigns,
                'total_budget': float(total_budget),
                'total_spent': float(total_spent),
                'budget_utilization': (float(total_spent) / float(total_budget) * 100) if total_budget > 0 else 0,
                'total_reach': total_reach,
                'total_engagement': total_engagement,
                'avg_engagement_rate': (total_engagement / total_reach * 100) if total_reach > 0 else 0,
                'snapshot_date': timezone.now().isoformat(),
            }
        )
        
        logger.info(f"Agency snapshot created for agency {agency_id}")
        return f"Agency snapshot created for {agency.name}"
        
    except Exception as e:
        logger.error(f"Failed to create agency snapshot for {agency_id}: {str(e)}")
        return f"Failed to create agency snapshot: {str(e)}"


@shared_task 
def cleanup_old_reports():
    """
    Clean up old report files to save disk space
    """
    from .models import Report
    from datetime import timedelta
    import os
    
    # Delete reports older than 90 days
    cutoff_date = timezone.now() - timedelta(days=90)
    old_reports = Report.objects.filter(
        created_at__lt=cutoff_date,
        status='completed'
    )
    
    deleted_count = 0
    
    for report in old_reports:
        try:
            # Delete file if exists
            if report.file_path:
                file_path = report.file_path.path if hasattr(report.file_path, 'path') else os.path.join(settings.MEDIA_ROOT, str(report.file_path))
                if os.path.exists(file_path):
                    os.remove(file_path)
            
            # Delete report record
            report.delete()
            deleted_count += 1
            
        except Exception as e:
            logger.error(f"Failed to delete old report {report.id}: {str(e)}")
    
    logger.info(f"Cleaned up {deleted_count} old reports")
    return f"Cleaned up {deleted_count} old reports"


def send_report_ready_notification(report):
    """
    Send email notification when report is ready
    """
    try:
        subject = f"Report Ready: {report.title}"
        
        # Get download URL (you'll need to adjust domain)
        download_url = f"https://yourplatform.com/reports/{report.id}/download/"
        
        message = f"""
Your report "{report.title}" has been generated and is ready for download.

Report Details:
- Type: {report.get_report_type_display()}
- Format: {report.get_file_format_display()}
- Generated: {report.generation_completed_at.strftime('%B %d, %Y at %I:%M %p')}

Download your report: {download_url}

This link will remain active for 90 days.

Best regards,
{report.agency.name} Analytics Team
        """
        
        # Send email
        send_mail(
            subject=subject,
            message=message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[report.created_by.email],
            fail_silently=True,  # Don't fail if email fails
        )
        
        # If it's a scheduled report, also send to subscription recipients
        if report.is_scheduled:
            try:
                subscription = report.agency.report_subscriptions.filter(
                    report_template__report_type=report.report_type
                ).first()
                
                if subscription and subscription.email_recipients:
                    email_list = [email.strip() for email in subscription.email_recipients.split(',')]
                    
                    send_mail(
                        subject=f"Scheduled Report: {report.title}",
                        message=message,
                        from_email=settings.DEFAULT_FROM_EMAIL,
                        recipient_list=email_list,
                        fail_silently=True,
                    )
            except Exception as e:
                logger.error(f"Failed to send scheduled report notification: {str(e)}")
        
        logger.info(f"Report ready notification sent for report {report.id}")
        
    except Exception as e:
        logger.error(f"Failed to send report notification for {report.id}: {str(e)}")
