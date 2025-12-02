#!/bin/sh

set -e

# Function to check if database is ready
postgres_ready() {
python << END
import sys
import psycopg2
import os

try:
    dbname = os.environ['DATABASE_URL'].split('/')[-1]
    user = os.environ['DATABASE_URL'].split('//')[1].split(':')[0]
    password = os.environ['DATABASE_URL'].split('//')[1].split(':')[1].split('@')[0]
    host = os.environ['DATABASE_URL'].split('@')[1].split(':')[0]
    port = os.environ['DATABASE_URL'].split('@')[1].split(':')[1].split('/')[0]
    
    psycopg2.connect(
        dbname=dbname,
        user=user,
        password=password,
        host=host,
        port=port,
    )
except psycopg2.OperationalError:
    sys.exit(-1)
sys.exit(0)
END
}

# Wait for database
until postgres_ready; do
  >&2 echo "PostgreSQL is unavailable - sleeping"
  sleep 1
done

>&2 echo "PostgreSQL is up - executing command"

# Check if this is a celery container (skip migrations and static files for workers)
if echo "$@" | grep -q "celery"; then
    >&2 echo "Celery container detected - skipping migrations and static files"
    exec "$@"
else
    # Run migrations (only for web container)
    python manage.py migrate --noinput

    # Create superuser if it doesn't exist (only for web container)
    python manage.py shell << END
import os
from django.contrib.auth import get_user_model
User = get_user_model()
if not User.objects.filter(is_superuser=True).exists():
    User.objects.create_superuser(
        email=os.environ.get('DJANGO_SUPERUSER_EMAIL', 'admin@example.com'),
        username=os.environ.get('DJANGO_SUPERUSER_USERNAME', 'admin'),
        password=os.environ.get('DJANGO_SUPERUSER_PASSWORD', 'admin123')
    )
    print("Superuser created")
else:
    print("Superuser already exists")
END

    # Collect static files (only for web container)
    python manage.py collectstatic --noinput

    # Execute the main command
    exec "$@"
fi