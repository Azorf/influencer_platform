# Use Python 3.11 slim image
FROM python:3.11-slim

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV DEBIAN_FRONTEND=noninteractive

# Set work directory
WORKDIR /app

# Install system dependencies
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        postgresql-client \
        build-essential \
        libpq-dev \
        curl \
        git \
        # Dependencies for Playwright (for Social Blade scraping)
        libnss3 \
        libatk-bridge2.0-0 \
        libdrm2 \
        libxkbcommon0 \
        libgtk-3-0 \
        libgbm1 \
        libasound2 \
        # Cleanup
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Install Playwright browsers (for Social Blade scraping)
RUN playwright install chromium
RUN playwright install-deps chromium

# Copy project files
COPY . /app/

# Copy and make executable the entrypoint script
COPY scripts/entrypoint.sh /entrypoint.sh
COPY scripts/wait-for-it.sh /wait-for-it.sh
RUN chmod +x /entrypoint.sh /wait-for-it.sh

# Create directories for static files and media
RUN mkdir -p /app/staticfiles /app/media /app/logs

# Collect static files (will be done in entrypoint for better flexibility)
# RUN python manage.py collectstatic --noinput

# Create non-root user for security
RUN addgroup --system django \
    && adduser --system --group django

# Change ownership of the app directory
RUN chown -R django:django /app
USER django

# Expose port
EXPOSE 8000

# Set the entrypoint
ENTRYPOINT ["/entrypoint.sh"]
CMD ["gunicorn", "--bind", "0.0.0.0:8000", "--workers", "4", "--timeout", "120", "influencer_platform.wsgi:application"]