#!/usr/bin/env python3
"""
Social Blade Scraper - Fresh Chrome Profile (Fixed)
Production-ready scraper using fresh Chrome profile approach
"""

import asyncio
import os
import sys
import subprocess
import time
from pathlib import Path
from datetime import datetime
from urllib.parse import quote
import logging
import argparse

# Django setup
sys.path.append(str(Path(__file__).parent.parent))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'influencer_platform.settings')
import django
django.setup()

from influencers.models import Influencer
from playwright.async_api import async_playwright
from asgiref.sync import sync_to_async
from human import HumanBehavior
from extractors import SocialBladeExtractor
from storage import DataStorage

# Clean logging without emoji issues
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler('scraper.log', encoding='utf-8')
    ],
    force=True  # Override any existing handlers
)
logger = logging.getLogger(__name__)

# Disable emoji characters in log messages to prevent Windows console errors
import logging
class EmojiFilter(logging.Filter):
    def filter(self, record):
        # Remove emoji characters from log messages
        if hasattr(record, 'msg'):
            record.msg = str(record.msg).encode('ascii', 'ignore').decode('ascii')
        return True

# Apply the filter to all handlers
for handler in logging.root.handlers:
    handler.addFilter(EmojiFilter())


class FreshChromeScraper:
    """Production scraper using fresh Chrome profile with fixed extractor"""
    
    def __init__(self, max_accounts=None):
        self.human = HumanBehavior()
        self.extractor = SocialBladeExtractor()
        self.storage = DataStorage()
        self.browser = None
        self.page = None
        self.max_accounts = max_accounts
        self.playwright = None
        self.chrome_process = None
        
    def start_fresh_chrome(self):
        """Start Chrome with fresh profile - based on working test1.py approach"""
        print("\nSTARTING FRESH CHROME FOR SOCIAL BLADE")
        print("=" * 50)
        
        # Chrome executable paths
        chrome_paths = [
            r"C:\Program Files\Google\Chrome\Application\chrome.exe",
            r"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe"
        ]
        
        chrome_path = None
        for path in chrome_paths:
            if os.path.exists(path):
                chrome_path = path
                break
                
        if not chrome_path:
            raise Exception("Chrome not found. Please install Chrome.")
        
        # Fresh profile directory
        profile_path = r"C:\chrome-debug-profile"
        
        # Create the directory if it doesn't exist
        os.makedirs(profile_path, exist_ok=True)
        
        logger.info(f"Chrome path: {chrome_path}")
        logger.info(f"Profile path: {profile_path}")
        
        # Start Chrome with fresh profile
        self.chrome_process = subprocess.Popen([
            chrome_path,
            "--remote-debugging-port=9222",
            f"--user-data-dir={profile_path}",
            "--disable-blink-features=AutomationControlled",
            "https://socialblade.com"
        ])
        
        print("Chrome launched with fresh profile!")
        print("Please complete these steps:")
        print("1. Log into your Social Blade account in the new Chrome window")
        print("2. Complete any Cloudflare challenges")
        print("3. Make sure you can navigate to influencer pages")
        print("4. Keep Chrome open!")
        print("=" * 50)
        
        # Wait for Chrome to start
        logger.info("Waiting 8 seconds for Chrome to fully start...")
        time.sleep(8)
        
    async def connect_to_fresh_chrome(self):
        """Connect to the fresh Chrome session"""
        print("\nCONNECTING TO FRESH CHROME SESSION")
        print("=" * 40)
        
        # Wait for user to complete login
        input("Press Enter after you've logged into Social Blade...")
        
        try:
            # Connect using Playwright
            self.playwright = await async_playwright().start()
            self.browser = await self.playwright.chromium.connect_over_cdp("http://localhost:9222")
            
            # Use the default context
            context = self.browser.contexts[0]
            
            pages = context.pages
            if not pages:
                print("No pages open. Creating new page...")
                self.page = await context.new_page()
                await self.page.goto("https://socialblade.com")
            else:
                # Find Social Blade tab or use first page
                social_blade_page = None
                for page in pages:
                    url = page.url
                    if "socialblade.com" in url:
                        social_blade_page = page
                        break
                
                if social_blade_page:
                    self.page = social_blade_page
                    logger.info(f"Connected to existing Social Blade tab: {self.page.url}")
                else:
                    # Use first page
                    self.page = pages[0]
                    current_url = self.page.url
                    if "socialblade.com" not in current_url:
                        logger.info("Navigating to Social Blade...")
                        await self.page.goto("https://socialblade.com")
                        await asyncio.sleep(2)
                    else:
                        logger.info(f"Using existing page: {self.page.url}")
            
            logger.info("Successfully connected to fresh Chrome session!")
            return True
            
        except Exception as e:
            logger.error(f"Failed to connect to Chrome: {str(e)}")
            return False
    
    async def get_influencers_to_scrape(self):
        """Get influencers needing Social Blade data"""
        @sync_to_async
        def get_influencers():
            from django.utils import timezone
            from datetime import timedelta
            
            week_ago = timezone.now() - timedelta(days=7)
            influencers = Influencer.objects.filter(
                is_influencer=True,
                is_active=True,
                country="Morocco"
            ).exclude(
                social_accounts__platform="instagram",
                social_accounts__social_blade_updated__gt=week_ago
            ).distinct()
            
            return list(influencers)
        
        all_influencers = await get_influencers()
        
        if self.max_accounts:
            influencers = all_influencers[:self.max_accounts]
        else:
            influencers = all_influencers[:10]  # Conservative default
            
        logger.info(f"Found {len(influencers)} influencers to scrape")
        return influencers
    
    async def scrape_influencer(self, influencer):
        """Scrape one influencer using the fixed extractor"""
        username = influencer.username
        logger.info(f"Scraping: @{username}")
        
        try:
            # Build Social Blade URL
            clean_username = username.lstrip('@').lower()
            url = f"https://socialblade.com/instagram/user/{quote(clean_username)}"
            
            # Navigate to the page
            logger.debug(f"Navigating to: {url}")
            response = await self.page.goto(url, wait_until="domcontentloaded", timeout=30000)
            
            # Allow 404s to proceed - Social Blade returns 404 for non-existent users
            if not response:
                logger.warning(f"No response for @{username}")
                return None
            elif response.status >= 500:
                # Server errors should be treated as failures
                logger.warning(f"Server error for @{username}: {response.status}")
                return None
            elif response.status == 404:
                # 404 is expected for accounts not on Social Blade - let extractor handle it
                logger.debug(f"HTTP 404 for @{username} - will check if Social Blade shows not found")
            elif response.status >= 400:
                # Other client errors
                logger.warning(f"Client error for @{username}: {response.status}")
                return None
            
            # Wait for page to load
            await asyncio.sleep(3)
            
            # Check for Cloudflare challenges
            title = await self.page.title()
            if any(indicator in title.lower() for indicator in ["cloudflare", "just a moment", "verify"]):
                logger.error(f"Cloudflare challenge detected for @{username}")
                print(f"\nCLOUDFLARE CHALLENGE DETECTED")
                print("Please solve the challenge in the Chrome window")
                input("Press Enter after solving the challenge...")
                
                # Refresh and continue
                await self.page.reload(wait_until="domcontentloaded")
                await asyncio.sleep(5)
            
            # Simulate human reading behavior
            await self.human.simulate_page_reading(self.page)
            await asyncio.sleep(2)
            
            # Extract the data using fixed extractor
            logger.debug(f"Extracting data for @{username}")
            data = await self.extractor.extract_instagram_data(self.page, username)
            
            if data:
                if data.get('not_found_on_social_blade'):
                    # NOT FOUND case - still save the record to prevent re-scraping
                    logger.info(f"NOT FOUND @{username}: Account not on Social Blade (too few followers)")
                    return data
                elif data.get('followers_count', 0) > 0:
                    # SUCCESS case
                    followers = data.get('followers_count', 0)
                    engagement = data.get('engagement_rate', 0)
                    logger.info(f"SUCCESS @{username}: {followers:,} followers, {engagement}% engagement")
                    return data
                else:
                    # No followers but data exists - still valid
                    logger.info(f"SUCCESS @{username}: 0 followers (new account)")
                    return data
            else:
                logger.warning(f"No data extracted for @{username}")
                return None
                
        except Exception as e:
            logger.error(f"Error scraping @{username}: {str(e)}")
            return None
    
    async def run_scraper(self):
        """Main scraper execution"""
        try:
            print("\nSOCIAL BLADE SCRAPER - PRODUCTION VERSION")
            print("=" * 55)
            print("Features:")
            print("- Uses fresh Chrome profile (no conflicts)")
            print("- Fixed error detection (no false positives)")
            print("- Standardized number parsing (K/M/B conversion)")
            print("- Proper integer/float types for database")
            print("- Human behavior simulation")
            print("- Progress saving and error handling")
            print("=" * 55)
            
            # Step 1: Start fresh Chrome
            self.start_fresh_chrome()
            
            # Step 2: Connect to Chrome
            if not await self.connect_to_fresh_chrome():
                logger.error("Failed to connect to Chrome session")
                return
            
            # Step 3: Get influencers to scrape
            influencers = await self.get_influencers_to_scrape()
            if not influencers:
                logger.info("No influencers need updating")
                return
            
            logger.info(f"Starting scraping session: {len(influencers)} accounts")
            
            # Results tracking
            results = {
                'scraped': [],
                'failed': [],
                'not_found': []
            }
            
            # Process each influencer
            for i, influencer in enumerate(influencers, 1):
                logger.info(f"\nProgress: {i}/{len(influencers)} - @{influencer.username}")
                
                result = await self.scrape_influencer(influencer)
                
                if result:
                    if result.get('not_found_on_social_blade'):
                        results['not_found'].append(result)  # Save the NOT FOUND record
                    else:
                        results['scraped'].append(result)  # Save successful data
                else:
                    results['failed'].append(influencer.username)  # True failures
                
                # Progress save every 5 accounts
                if i % 5 == 0 and results['scraped']:
                    await self.save_progress(results['scraped'], f"progress_{i}")
                
                # Smart delay between requests
                if i < len(influencers):
                    # Longer delays for larger batches to avoid rate limiting
                    base_delay = 45
                    batch_factor = min(i // 10, 5)
                    delay = base_delay + (batch_factor * 10) + (i * 2)
                    
                    logger.info(f"Waiting {delay} seconds before next account...")
                    await asyncio.sleep(delay)
            
            # Save final results
            await self.save_final_results(results)
            
        except KeyboardInterrupt:
            logger.info("\nScraping interrupted by user")
            if results.get('scraped'):
                await self.save_progress(results['scraped'], "interrupted")
        except Exception as e:
            logger.error(f"Fatal error: {str(e)}")
        finally:
            # Close playwright but keep Chrome open
            if self.playwright:
                await self.playwright.stop()
            
            logger.info("\nScraping complete")
            logger.info("Chrome will remain open - you can close it manually when ready")
    
    async def save_progress(self, data, suffix):
        """Save progress data"""
        if data:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"socialblade_{suffix}_{timestamp}.csv"
            saved_path = self.storage.save_csv(data, filename)
            if saved_path:
                logger.info(f"Progress saved: {filename}")
    
    async def save_final_results(self, results):
        """Save final results and show summary"""
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        
        logger.info("\n" + "=" * 55)
        logger.info("SCRAPING RESULTS SUMMARY")
        logger.info("=" * 55)
        logger.info(f"Successfully scraped: {len(results['scraped'])} accounts")
        logger.info(f"Not found on Social Blade: {len(results['not_found'])} accounts")
        logger.info(f"Failed (connection errors): {len(results['failed'])} accounts")
        logger.info("=" * 55)
        
        # Save all data (successful + not found) together
        all_data = results['scraped'] + results['not_found']
        
        if all_data:
            csv_file = self.storage.save_csv(all_data, f"socialblade_final_{timestamp}.csv")
            json_file = self.storage.save_json(all_data, f"socialblade_final_{timestamp}.json")
            
            logger.info(f"Data saved to: {csv_file}")
            logger.info(f"Backup saved to: {json_file}")
            
            # Django import command
            logger.info(f"\nTO IMPORT INTO DJANGO:")
            logger.info(f"python manage.py import_social_blade {csv_file} --platform instagram --update-existing")
            logger.info(f"\nThis CSV includes:")
            logger.info(f"- {len(results['scraped'])} accounts with Social Blade data")
            logger.info(f"- {len(results['not_found'])} accounts NOT FOUND (with 0/null values)")
            logger.info(f"Both types will prevent re-scraping for 7 days after import")
        
        # Save failed list for debugging (only true failures)
        if results['failed']:
            failed_file = self.storage.save_failed_usernames(results['failed'], f"failed_{timestamp}.txt")
            logger.info(f"Failed usernames: {failed_file}")
            logger.info(f"These {len(results['failed'])} accounts had connection/server errors")
            
        logger.info(f"\nIMPORTANT: After importing the CSV, both successful and NOT FOUND")
        logger.info(f"accounts will be skipped for 7 days to prevent endless re-scraping.")


def parse_args():
    parser = argparse.ArgumentParser(description="Social Blade scraper using fresh Chrome profile")
    parser.add_argument('--max-accounts', type=int, default=10, help='Maximum accounts to scrape (default: 10)')
    parser.add_argument('--test', action='store_true', help='Test mode with 3 accounts')
    return parser.parse_args()


async def main():
    args = parse_args()
    max_accounts = 3 if args.test else args.max_accounts
    
    print(f"Social Blade Scraper - Fresh Chrome Profile (Fixed)")
    print(f"Max accounts: {max_accounts}")
    print(f"Based on working test1.py + test2.py approach")
    print(f"Uses fresh profile: C:\\chrome-debug-profile")
    
    scraper = FreshChromeScraper(max_accounts=max_accounts)
    await scraper.run_scraper()


if __name__ == "__main__":
    asyncio.run(main())