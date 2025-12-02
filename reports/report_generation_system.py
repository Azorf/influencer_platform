"""
Report Generation System for Influencer Platform
Handles manual, scheduled, and real-time report creation
"""

from django.shortcuts import get_object_or_404
from django.http import JsonResponse, HttpResponse
from django.contrib.auth.decorators import login_required
from django.utils import timezone
from django.template.loader import render_to_string
from django.conf import settings
import json
import os
from datetime import datetime, timedelta
import matplotlib.pyplot as plt
import pandas as pd
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter
from io import BytesIO

from .models import Report, ReportTemplate, Campaign, CampaignAnalytics
from campaigns.models import Campaign, InfluencerCollaboration, CampaignContent


class ReportGenerator:
    """Main report generation class"""
    
    def __init__(self, report):
        self.report = report
        self.data = {}
        
    def generate_report(self):
        """Main report generation method"""
        try:
            # Set status to generating
            self.report.status = 'generating'
            self.report.generation_started_at = timezone.now()
            self.report.save()
            
            # Collect data based on report type
            self.collect_data()
            
            # Generate the actual report file
            if self.report.file_format == 'pdf':
                file_path = self.generate_pdf_report()
            elif self.report.file_format == 'excel':
                file_path = self.generate_excel_report()
            elif self.report.file_format == 'csv':
                file_path = self.generate_csv_report()
            elif self.report.file_format == 'json':
                file_path = self.generate_json_report()
            else:
                file_path = self.generate_pdf_report()  # Default
            
            # Update report record
            self.report.file_path = file_path
            self.report.report_data = self.data
            self.report.status = 'completed'
            self.report.generation_completed_at = timezone.now()
            self.report.save()
            
            return file_path
            
        except Exception as e:
            self.report.status = 'failed'
            self.report.error_message = str(e)
            self.report.save()
            raise e
    
    def collect_data(self):
        """Collect data based on report type"""
        
        if self.report.report_type == 'campaign_performance':
            self.collect_campaign_performance_data()
        elif self.report.report_type == 'influencer_analytics':
            self.collect_influencer_analytics_data()
        elif self.report.report_type == 'roi_analysis':
            self.collect_roi_analysis_data()
        elif self.report.report_type == 'agency_dashboard':
            self.collect_agency_dashboard_data()
        else:
            self.collect_custom_report_data()
    
    def collect_campaign_performance_data(self):
        """Collect campaign performance data"""
        campaign_id = self.report.parameters.get('campaign_id')
        date_range = self.report.parameters.get('date_range', '30d')
        
        if campaign_id:
            campaigns = [Campaign.objects.get(id=campaign_id)]
        else:
            # All agency campaigns
            campaigns = Campaign.objects.filter(agency=self.report.agency)
        
        campaign_data = []
        
        for campaign in campaigns:
            # Update analytics first
            from campaigns.views import update_campaign_analytics
            analytics = update_campaign_analytics(campaign)
            
            collaborations = campaign.collaborations.all()
            content_items = CampaignContent.objects.filter(collaboration__campaign=campaign)
            
            campaign_stats = {
                'campaign_id': campaign.id,
                'campaign_name': campaign.name,
                'campaign_type': campaign.campaign_type,
                'status': campaign.status,
                'start_date': campaign.start_date.isoformat() if campaign.start_date else None,
                'end_date': campaign.end_date.isoformat() if campaign.end_date else None,
                'total_budget': float(campaign.total_budget),
                'total_spent': float(campaign.get_total_spent()),
                'remaining_budget': float(campaign.get_remaining_budget()),
                
                # Analytics
                'total_reach': analytics.total_reach,
                'total_impressions': analytics.total_impressions,
                'total_likes': analytics.total_likes,
                'total_comments': analytics.total_comments,
                'total_shares': analytics.total_shares,
                'total_engagement': analytics.total_likes + analytics.total_comments + analytics.total_shares,
                'avg_engagement_rate': float(analytics.avg_engagement_rate),
                'cost_per_engagement': float(analytics.cost_per_engagement) if analytics.cost_per_engagement else 0,
                'roi_percentage': float(analytics.roi_percentage),
                
                # Collaboration stats
                'total_collaborations': collaborations.count(),
                'active_collaborations': collaborations.filter(status__in=['accepted', 'in_progress', 'published']).count(),
                'completed_collaborations': collaborations.filter(status='completed').count(),
                'content_pieces': content_items.count(),
                'approved_content': content_items.filter(status='approved').count(),
                
                # Top performers
                'top_content': self.get_top_content(content_items),
                'top_influencers': self.get_top_influencers(collaborations),
            }
            
            campaign_data.append(campaign_stats)
        
        self.data = {
            'report_type': 'campaign_performance',
            'generated_at': timezone.now().isoformat(),
            'date_range': date_range,
            'campaigns': campaign_data,
            'summary': self.calculate_summary_stats(campaign_data)
        }
    
    def get_top_content(self, content_items):
        """Get top performing content"""
        top_content = []
        
        for content in content_items:
            total_engagement = content.likes_count + content.comments_count + content.shares_count
            engagement_rate = (total_engagement / max(content.views_count, 1)) * 100
            
            top_content.append({
                'content_id': content.id,
                'post_url': content.post_url,
                'likes': content.likes_count,
                'comments': content.comments_count,
                'shares': content.shares_count,
                'views': content.views_count,
                'total_engagement': total_engagement,
                'engagement_rate': engagement_rate,
                'influencer': content.collaboration.influencer.full_name,
                'status': content.status,
            })
        
        # Sort by engagement rate
        top_content.sort(key=lambda x: x['engagement_rate'], reverse=True)
        return top_content[:10]  # Top 10
    
    def get_top_influencers(self, collaborations):
        """Get top performing influencers"""
        influencer_stats = []
        
        for collaboration in collaborations:
            content_items = collaboration.content.all()
            total_engagement = sum(
                content.likes_count + content.comments_count + content.shares_count 
                for content in content_items
            )
            total_views = sum(content.views_count for content in content_items)
            
            influencer_stats.append({
                'influencer_id': collaboration.influencer.id,
                'influencer_name': collaboration.influencer.full_name,
                'username': collaboration.influencer.username,
                'agreed_rate': float(collaboration.agreed_rate),
                'total_engagement': total_engagement,
                'total_views': total_views,
                'engagement_rate': (total_engagement / max(total_views, 1)) * 100,
                'cost_per_engagement': float(collaboration.agreed_rate) / max(total_engagement, 1),
                'content_count': content_items.count(),
                'status': collaboration.status,
            })
        
        influencer_stats.sort(key=lambda x: x['engagement_rate'], reverse=True)
        return influencer_stats[:10]  # Top 10
    
    def calculate_summary_stats(self, campaign_data):
        """Calculate summary statistics"""
        if not campaign_data:
            return {}
        
        total_budget = sum(c['total_budget'] for c in campaign_data)
        total_spent = sum(c['total_spent'] for c in campaign_data)
        total_engagement = sum(c['total_engagement'] for c in campaign_data)
        total_reach = sum(c['total_reach'] for c in campaign_data)
        
        return {
            'total_campaigns': len(campaign_data),
            'total_budget': total_budget,
            'total_spent': total_spent,
            'budget_utilization': (total_spent / total_budget * 100) if total_budget > 0 else 0,
            'total_engagement': total_engagement,
            'total_reach': total_reach,
            'avg_cost_per_engagement': total_spent / total_engagement if total_engagement > 0 else 0,
            'avg_engagement_rate': sum(c['avg_engagement_rate'] for c in campaign_data) / len(campaign_data),
            'avg_roi': sum(c['roi_percentage'] for c in campaign_data) / len(campaign_data),
        }
    
    def generate_pdf_report(self):
        """Generate PDF report using ReportLab"""
        buffer = BytesIO()
        
        # Create PDF canvas
        p = canvas.Canvas(buffer, pagesize=letter)
        width, height = letter
        
        # Title
        p.setFont("Helvetica-Bold", 24)
        p.drawString(50, height - 50, self.report.title)
        
        # Subtitle
        p.setFont("Helvetica", 12)
        p.drawString(50, height - 80, f"Generated on {timezone.now().strftime('%B %d, %Y')}")
        p.drawString(50, height - 100, f"Agency: {self.report.agency.name}")
        
        y_position = height - 140
        
        # Summary section
        p.setFont("Helvetica-Bold", 16)
        p.drawString(50, y_position, "Executive Summary")
        y_position -= 30
        
        summary = self.data.get('summary', {})
        p.setFont("Helvetica", 12)
        
        summary_items = [
            f"Total Campaigns: {summary.get('total_campaigns', 0)}",
            f"Total Budget: ${summary.get('total_budget', 0):,.2f}",
            f"Total Spent: ${summary.get('total_spent', 0):,.2f}",
            f"Budget Utilization: {summary.get('budget_utilization', 0):.1f}%",
            f"Total Engagement: {summary.get('total_engagement', 0):,}",
            f"Average ROI: {summary.get('avg_roi', 0):.1f}%",
        ]
        
        for item in summary_items:
            p.drawString(70, y_position, item)
            y_position -= 20
        
        # Campaign details section
        y_position -= 20
        p.setFont("Helvetica-Bold", 16)
        p.drawString(50, y_position, "Campaign Performance Details")
        y_position -= 30
        
        for campaign in self.data.get('campaigns', []):
            if y_position < 100:  # Start new page
                p.showPage()
                y_position = height - 50
            
            p.setFont("Helvetica-Bold", 14)
            p.drawString(50, y_position, campaign['campaign_name'])
            y_position -= 20
            
            p.setFont("Helvetica", 10)
            campaign_items = [
                f"Type: {campaign['campaign_type']} | Status: {campaign['status']}",
                f"Budget: ${campaign['total_budget']:,.2f} | Spent: ${campaign['total_spent']:,.2f}",
                f"Reach: {campaign['total_reach']:,} | Engagement: {campaign['total_engagement']:,}",
                f"Engagement Rate: {campaign['avg_engagement_rate']:.2f}% | ROI: {campaign['roi_percentage']:.1f}%",
                f"Collaborations: {campaign['total_collaborations']} | Content Pieces: {campaign['content_pieces']}",
            ]
            
            for item in campaign_items:
                p.drawString(70, y_position, item)
                y_position -= 15
            
            y_position -= 10
        
        p.save()
        
        # Save file
        filename = f"report_{self.report.id}_{timezone.now().strftime('%Y%m%d_%H%M%S')}.pdf"
        file_path = os.path.join('reports', filename)
        full_path = os.path.join(settings.MEDIA_ROOT, file_path)
        
        os.makedirs(os.path.dirname(full_path), exist_ok=True)
        
        with open(full_path, 'wb') as f:
            f.write(buffer.getvalue())
        
        buffer.close()
        return file_path
    
    def generate_excel_report(self):
        """Generate Excel report using pandas"""
        filename = f"report_{self.report.id}_{timezone.now().strftime('%Y%m%d_%H%M%S')}.xlsx"
        file_path = os.path.join('reports', filename)
        full_path = os.path.join(settings.MEDIA_ROOT, file_path)
        
        os.makedirs(os.path.dirname(full_path), exist_ok=True)
        
        # Create Excel writer
        with pd.ExcelWriter(full_path, engine='openpyxl') as writer:
            
            # Summary sheet
            summary_data = [self.data.get('summary', {})]
            summary_df = pd.DataFrame(summary_data)
            summary_df.to_excel(writer, sheet_name='Summary', index=False)
            
            # Campaign details sheet
            campaigns_data = self.data.get('campaigns', [])
            if campaigns_data:
                campaigns_df = pd.DataFrame(campaigns_data)
                campaigns_df.to_excel(writer, sheet_name='Campaign Details', index=False)
            
            # Top content sheet
            all_top_content = []
            for campaign in campaigns_data:
                for content in campaign.get('top_content', []):
                    content['campaign_name'] = campaign['campaign_name']
                    all_top_content.append(content)
            
            if all_top_content:
                content_df = pd.DataFrame(all_top_content)
                content_df.to_excel(writer, sheet_name='Top Content', index=False)
            
            # Top influencers sheet
            all_top_influencers = []
            for campaign in campaigns_data:
                for influencer in campaign.get('top_influencers', []):
                    influencer['campaign_name'] = campaign['campaign_name']
                    all_top_influencers.append(influencer)
            
            if all_top_influencers:
                influencers_df = pd.DataFrame(all_top_influencers)
                influencers_df.to_excel(writer, sheet_name='Top Influencers', index=False)
        
        return file_path
    
    def generate_csv_report(self):
        """Generate CSV report"""
        filename = f"report_{self.report.id}_{timezone.now().strftime('%Y%m%d_%H%M%S')}.csv"
        file_path = os.path.join('reports', filename)
        full_path = os.path.join(settings.MEDIA_ROOT, file_path)
        
        os.makedirs(os.path.dirname(full_path), exist_ok=True)
        
        # Convert campaign data to DataFrame
        campaigns_data = self.data.get('campaigns', [])
        if campaigns_data:
            df = pd.DataFrame(campaigns_data)
            df.to_csv(full_path, index=False)
        
        return file_path
    
    def generate_json_report(self):
        """Generate JSON report"""
        filename = f"report_{self.report.id}_{timezone.now().strftime('%Y%m%d_%H%M%S')}.json"
        file_path = os.path.join('reports', filename)
        full_path = os.path.join(settings.MEDIA_ROOT, file_path)
        
        os.makedirs(os.path.dirname(full_path), exist_ok=True)
        
        with open(full_path, 'w') as f:
            json.dump(self.data, f, indent=2)
        
        return file_path


# Celery tasks for background report generation
from celery import shared_task

@shared_task
def generate_report_task(report_id):
    """Background task to generate reports"""
    try:
        report = Report.objects.get(id=report_id)
        generator = ReportGenerator(report)
        file_path = generator.generate_report()
        
        # Send notification email if configured
        send_report_notification(report)
        
        return f"Report {report_id} generated successfully: {file_path}"
        
    except Exception as e:
        return f"Report generation failed: {str(e)}"


@shared_task
def generate_scheduled_reports():
    """Task to generate all scheduled reports"""
    from .models import ReportSubscription
    
    # Get all active subscriptions that are due
    due_subscriptions = ReportSubscription.objects.filter(
        is_active=True,
        next_delivery__lte=timezone.now()
    )
    
    for subscription in due_subscriptions:
        # Create report from template
        report = Report.objects.create(
            title=f"{subscription.name} - {timezone.now().strftime('%Y-%m-%d')}",
            description=f"Scheduled report: {subscription.name}",
            report_type=subscription.report_template.report_type,
            parameters=subscription.report_parameters,
            agency=subscription.agency,
            created_by=subscription.created_by,
            file_format='pdf',  # Default format for scheduled reports
        )
        
        # Generate report
        generate_report_task.delay(report.id)
        
        # Update next delivery date
        subscription.last_delivered = timezone.now()
        subscription.calculate_next_delivery()
        subscription.save()


def send_report_notification(report):
    """Send email notification when report is ready"""
    from django.core.mail import send_mail
    from django.template.loader import render_to_string
    
    subject = f"Report Ready: {report.title}"
    
    # Get download URL
    download_url = f"/api/reports/{report.id}/download/"
    
    message = render_to_string('reports/report_ready_email.html', {
        'report': report,
        'download_url': download_url,
    })
    
    send_mail(
        subject=subject,
        message=message,
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[report.created_by.email],
        html_message=message,
    )