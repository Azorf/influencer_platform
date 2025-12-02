#!/bin/bash

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SCRAPER_LOG_FILE="/app/logs/scraper.log"
MAX_ACCOUNTS=${MAX_ACCOUNTS:-10}
SCRAPER_MODE=${SCRAPER_MODE:-"production"}

# Functions
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running in Docker
check_docker_environment() {
    if [ ! -f /.dockerenv ]; then
        warning "This script is designed to run inside a Docker container"
        warning "Make sure you're running: docker-compose exec web /app/scripts/start-scraper.sh"
    fi
}

# Wait for dependencies
wait_for_dependencies() {
    log "Checking dependencies..."
    
    # Wait for database
    until python -c "
import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'influencer_platform.settings')
django.setup()
from django.db import connection
try:
    connection.ensure_connection()
    print('Database connection: OK')
except Exception as e:
    print(f'Database connection failed: {e}')
    exit(1)
" 2>/dev/null; do
        log "Waiting for database connection..."
        sleep 2
    done
    
    # Wait for Redis
    until python -c "
import redis
import os
try:
    r = redis.from_url(os.environ.get('REDIS_URL', 'redis://redis:6379/0'))
    r.ping()
    print('Redis connection: OK')
except Exception as e:
    print(f'Redis connection failed: {e}')
    exit(1)
" 2>/dev/null; do
        log "Waiting for Redis connection..."
        sleep 2
    done
    
    success "All dependencies ready"
}

# Setup logging
setup_logging() {
    log "Setting up logging..."
    
    # Create logs directory if it doesn't exist
    mkdir -p /app/logs
    
    # Create or clear the scraper log file
    touch "$SCRAPER_LOG_FILE"
    
    log "Logs will be written to: $SCRAPER_LOG_FILE"
}

# Check Social Blade scraper setup
check_scraper_setup() {
    log "Checking Social Blade scraper setup..."
    
    # Check if scraper files exist
    local scraper_files=(
        "/app/scraper/main.py"
        "/app/scraper/extractors.py"
        "/app/scraper/storage.py"
        "/app/scraper/human.py"
    )
    
    for file in "${scraper_files[@]}"; do
        if [ ! -f "$file" ]; then
            error "Required scraper file missing: $file"
            exit 1
        fi
    done
    
    # Check if scraped data directory exists
    mkdir -p /app/scraped_data/csv
    mkdir -p /app/scraped_data/json
    
    success "Scraper setup verified"
}

# Run Django migrations
run_migrations() {
    log "Running Django migrations..."
    python manage.py migrate --noinput
    success "Migrations completed"
}

# Start Chrome for scraping (if needed)
start_chrome() {
    log "Checking Chrome setup for scraping..."
    
    # In Docker, we'll use Playwright's bundled Chromium
    # Check if Playwright browsers are installed
    python -c "
from playwright.sync_api import sync_playwright
try:
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        browser.close()
    print('Playwright Chromium: OK')
except Exception as e:
    print(f'Playwright setup issue: {e}')
    exit(1)
" || {
        error "Playwright Chromium not available. Installing..."
        playwright install chromium
        playwright install-deps chromium
    }
    
    success "Chrome/Chromium ready for scraping"
}

# Run the Social Blade scraper
run_scraper() {
    log "Starting Social Blade scraper..."
    log "Mode: $SCRAPER_MODE"
    log "Max accounts: $MAX_ACCOUNTS"
    
    cd /app
    
    # Set environment variables for the scraper
    export DJANGO_SETTINGS_MODULE="influencer_platform.settings"
    export PYTHONPATH="/app:$PYTHONPATH"
    
    # Choose scraper command based on mode
    case "$SCRAPER_MODE" in
        "test")
            log "Running in test mode (3 accounts)"
            python scraper/main.py --test 2>&1 | tee -a "$SCRAPER_LOG_FILE"
            ;;
        "small")
            log "Running small batch (5 accounts)"
            python scraper/main.py --max-accounts 5 2>&1 | tee -a "$SCRAPER_LOG_FILE"
            ;;
        "production")
            log "Running production scraper ($MAX_ACCOUNTS accounts)"
            python scraper/main.py --max-accounts "$MAX_ACCOUNTS" 2>&1 | tee -a "$SCRAPER_LOG_FILE"
            ;;
        "headless")
            log "Running headless scraper (no Chrome GUI)"
            HEADLESS=1 python scraper/main_headless.py --max-accounts "$MAX_ACCOUNTS" 2>&1 | tee -a "$SCRAPER_LOG_FILE"
            ;;
        *)
            error "Unknown scraper mode: $SCRAPER_MODE"
            error "Valid modes: test, small, production, headless"
            exit 1
            ;;
    esac
    
    local exit_code=$?
    
    if [ $exit_code -eq 0 ]; then
        success "Scraper completed successfully"
    else
        error "Scraper failed with exit code: $exit_code"
        error "Check logs at: $SCRAPER_LOG_FILE"
        exit $exit_code
    fi
}

# Import scraped data into Django
import_data() {
    log "Looking for scraped data to import..."
    
    # Find the most recent CSV file
    local latest_csv=$(find /app/scraped_data/csv -name "socialblade_final_*.csv" -type f -printf '%T@ %p\n' | sort -n | tail -1 | cut -d' ' -f2-)
    
    if [ -n "$latest_csv" ] && [ -f "$latest_csv" ]; then
        log "Found CSV file: $latest_csv"
        log "Importing data into Django..."
        
        python manage.py import_social_blade "$latest_csv" --platform instagram --update-existing
        
        if [ $? -eq 0 ]; then
            success "Data imported successfully"
        else
            error "Data import failed"
            exit 1
        fi
    else
        warning "No CSV files found to import"
        warning "Scraper may not have generated any output"
    fi
}

# Cleanup old data
cleanup() {
    log "Cleaning up old files..."
    
    # Remove CSV files older than 30 days
    find /app/scraped_data -name "*.csv" -type f -mtime +30 -delete
    
    # Remove log files older than 7 days
    find /app/logs -name "*.log" -type f -mtime +7 -delete
    
    success "Cleanup completed"
}

# Print usage information
usage() {
    cat << EOF
Social Blade Scraper - Docker Edition

Usage: $0 [OPTIONS]

Options:
    -m, --mode MODE         Scraper mode (test|small|production|headless)
    -a, --accounts NUMBER   Maximum accounts to scrape (default: 10)
    -h, --help             Show this help message
    --no-import            Skip data import after scraping
    --no-cleanup           Skip cleanup of old files

Environment Variables:
    MAX_ACCOUNTS           Maximum accounts to scrape (default: 10)
    SCRAPER_MODE           Scraper mode (default: production)

Examples:
    $0                                  # Run with defaults
    $0 -m test                         # Run test mode (3 accounts)
    $0 -m production -a 50             # Run 50 accounts
    $0 --no-import                     # Scrape but don't import

EOF
}

# Parse command line arguments
IMPORT_DATA=true
CLEANUP_FILES=true

while [[ $# -gt 0 ]]; do
    case $1 in
        -m|--mode)
            SCRAPER_MODE="$2"
            shift 2
            ;;
        -a|--accounts)
            MAX_ACCOUNTS="$2"
            shift 2
            ;;
        --no-import)
            IMPORT_DATA=false
            shift
            ;;
        --no-cleanup)
            CLEANUP_FILES=false
            shift
            ;;
        -h|--help)
            usage
            exit 0
            ;;
        *)
            error "Unknown option: $1"
            usage
            exit 1
            ;;
    esac
done

# Main execution
main() {
    log "========================================"
    log "Social Blade Scraper - Docker Edition"
    log "========================================"
    
    check_docker_environment
    setup_logging
    wait_for_dependencies
    check_scraper_setup
    run_migrations
    start_chrome
    run_scraper
    
    if [ "$IMPORT_DATA" = true ]; then
        import_data
    fi
    
    if [ "$CLEANUP_FILES" = true ]; then
        cleanup
    fi
    
    success "========================================"
    success "Scraper execution completed!"
    success "========================================"
    
    # Show summary
    log "Summary:"
    log "- Mode: $SCRAPER_MODE"
    log "- Max accounts: $MAX_ACCOUNTS"
    log "- Log file: $SCRAPER_LOG_FILE"
    
    if [ -d "/app/scraped_data/csv" ]; then
        local csv_count=$(find /app/scraped_data/csv -name "*.csv" -type f | wc -l)
        log "- CSV files available: $csv_count"
    fi
}

# Run main function
main "$@"