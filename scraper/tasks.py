"""
Celery tasks for Social Blade scraping
"""
from celery import shared_task
from django.utils import timezone
import logging

logger = logging.getLogger(__name__)

@shared_task(bind=True)
def run_social_blade_scraper(self, max_accounts=10):
    """
    Run the Social Blade scraper as a background task
    """
    try:
        logger.info(f"Starting Social Blade scraper task with max_accounts={max_accounts}")
        
        # Import here to avoid circular imports
        import subprocess
        import os
        
        # Change to app directory
        os.chdir('/app')
        
        # Run the scraper
        result = subprocess.run([
            'python', 'scraper/main.py', 
            '--max-accounts', str(max_accounts)
        ], capture_output=True, text=True, timeout=3600)  # 1 hour timeout
        
        if result.returncode == 0:
            logger.info("Social Blade scraper completed successfully")
            return {
                'status': 'success',
                'output': result.stdout,
                'scraped_at': timezone.now().isoformat()
            }
        else:
            logger.error(f"Social Blade scraper failed: {result.stderr}")
            return {
                'status': 'failed',
                'error': result.stderr,
                'output': result.stdout
            }
            
    except Exception as e:
        logger.error(f"Social Blade scraper task failed: {str(e)}")
        self.retry(countdown=300, max_retries=3)  # Retry after 5 minutes, max 3 times
        

@shared_task
def cleanup_old_scraped_data():
    """
    Clean up old scraped data files
    """
    try:
        import os
        from pathlib import Path
        from datetime import datetime, timedelta
        
        # Remove files older than 30 days
        scraped_data_dir = Path('/app/scraped_data')
        cutoff_date = datetime.now() - timedelta(days=30)
        
        if scraped_data_dir.exists():
            for file_path in scraped_data_dir.rglob('*'):
                if file_path.is_file():
                    file_time = datetime.fromtimestamp(file_path.stat().st_mtime)
                    if file_time < cutoff_date:
                        file_path.unlink()
                        logger.info(f"Deleted old file: {file_path}")
                        
        return {'status': 'success', 'cleaned_at': timezone.now().isoformat()}
        
    except Exception as e:
        logger.error(f"Cleanup task failed: {str(e)}")
        return {'status': 'failed', 'error': str(e)}


@shared_task
def send_scraping_notification(message):
    """
    Send notification about scraping results
    """
    # You can implement email, Slack, or other notifications here
    logger.info(f"Notification: {message}")
    return {'status': 'sent', 'message': message}