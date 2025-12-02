"""
Celery configuration for influencer_platform project.
"""
import os
from celery import Celery

# Set the default Django settings module for the 'celery' program.
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'influencer_platform.settings')

app = Celery('influencer_platform')

# Using a string here means the worker doesn't have to serialize
# the configuration object to child processes.
app.config_from_object('django.conf:settings', namespace='CELERY')

# Load task modules from all registered Django apps.
app.autodiscover_tasks()

# Optional: Configure task routes
app.conf.task_routes = {
    'scraper.tasks.*': {'queue': 'scraper'},
    'influencers.tasks.*': {'queue': 'influencers'},
    'campaigns.tasks.*': {'queue': 'campaigns'},
}

# Optional: Configure result expiration
app.conf.result_expires = 3600  # 1 hour

@app.task(bind=True)
def debug_task(self):
    print(f'Request: {self.request!r}')