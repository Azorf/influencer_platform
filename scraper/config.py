"""
Scraper Configuration
Central configuration for the Social Blade scraper
"""

import os
from pathlib import Path
from typing import List


class ScraperConfig:
    """Configuration settings for the Social Blade scraper"""
    
    def __init__(self):
        # Browser Configuration
        self.CHROME_PROFILE_PATH = self._get_chrome_profile_path()
        self.HEADLESS = False  # Always run in non-headless mode
        self.VIEWPORT_WIDTH = 1920
        self.VIEWPORT_HEIGHT = 1080
        
        # Allowed browser extensions (add your extension IDs here)
        self.ALLOWED_EXTENSIONS = [
            # Add your trusted extension paths here
            # Example: "C:/Users/YourName/AppData/Local/Google/Chrome/User Data/Default/Extensions/extension_id"
        ]
        
        # Scraping Behavior
        self.MIN_WAIT_TIME = 0.8  # Minimum wait between actions (seconds)
        self.MAX_WAIT_TIME = 4.2  # Maximum wait between actions (seconds)
        self.PAGE_LOAD_TIMEOUT = 30000  # Page load timeout (milliseconds)
        self.ELEMENT_TIMEOUT = 10000  # Element wait timeout (milliseconds)
        
        # Human Behavior Simulation
        self.SCROLL_PAUSE_MIN = 0.5  # Minimum pause between scrolls
        self.SCROLL_PAUSE_MAX = 2.5  # Maximum pause between scrolls
        self.READING_PAUSE_MIN = 1.0  # Minimum reading pause
        self.READING_PAUSE_MAX = 4.0  # Maximum reading pause
        self.DISTRACTION_CHANCE = 0.05  # Chance of longer pause (5%)
        self.TYPO_CHANCE = 0.02  # Chance of typing mistake (2%)
        
        # Request Limits
        self.REQUESTS_PER_MINUTE = 10  # Maximum requests per minute
        self.MAX_RETRIES = 3  # Maximum retries per request
        self.RETRY_DELAY = 5  # Delay between retries (seconds)
        self.BATCH_SIZE = 10  # Save progress every X influencers
        
        # Social Blade Specific
        self.SOCIALBLADE_BASE_URL = "https://socialblade.com"
        self.INSTAGRAM_URL_TEMPLATE = "https://socialblade.com/instagram/user/{username}"
        self.TIKTOK_URL_TEMPLATE = "https://socialblade.com/tiktok/user/{username}"
        self.YOUTUBE_URL_TEMPLATE = "https://socialblade.com/youtube/user/{username}"
        
        # Data Validation
        self.MIN_FOLLOWERS = 0
        self.MAX_FOLLOWERS = 1000000000  # 1 billion
        self.MIN_FOLLOWING = 0
        self.MAX_FOLLOWING = 100000
        self.MIN_POSTS = 0
        self.MAX_POSTS = 50000
        self.MIN_ENGAGEMENT_RATE = 0.0
        self.MAX_ENGAGEMENT_RATE = 50.0
        
        # File Storage
        self.OUTPUT_DIR = "scraped_data"
        self.CSV_DIR = "csv"
        self.JSON_DIR = "json"
        self.BACKUP_DIR = "backups"
        self.LOG_DIR = "logs"
        
        # Database Settings (from Django)
        self.DJANGO_SETTINGS_MODULE = "influencer_platform.settings"
        
        # Anti-Detection Settings
        self.USER_AGENTS = [
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36",
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.0.0 Safari/537.36"
        ]
        
        # GPU Options for WebGL spoofing
        self.FAKE_GPUS = [
            "ANGLE (Intel, Intel(R) UHD Graphics 620 Direct3D11 vs_5_0 ps_5_0, D3D11-27.20.100.8280)",
            "ANGLE (AMD, AMD Radeon RX 580 Direct3D11 vs_5_0 ps_5_0, D3D11)",
            "ANGLE (NVIDIA, NVIDIA GeForce GTX 1060 Direct3D11 vs_5_0 ps_5_0, D3D11-27.21.14.5671)"
        ]
        
        # Timezone and Locale
        self.TIMEZONE = "Africa/Casablanca"  # Morocco timezone
        self.LOCALE = "en-US"
        self.LANGUAGES = ["en-US", "en", "fr", "ar"]  # Morocco languages
        
        # Error Handling
        self.LOG_LEVEL = "INFO"
        self.LOG_FORMAT = "%(asctime)s - %(levelname)s - %(message)s"
        self.MAX_LOG_SIZE = 10 * 1024 * 1024  # 10 MB
        self.LOG_BACKUP_COUNT = 5
        
    def _get_chrome_profile_path(self) -> str:
        """Get Chrome profile path based on OS"""
        system = os.name
        
        if system == 'nt':  # Windows
            # Default Chrome profile path on Windows
            base_path = os.path.expanduser("~")
            chrome_path = os.path.join(
                base_path, 
                "AppData", "Local", "Google", "Chrome", "User Data", "Default"
            )
            
            # Check if profile exists
            if os.path.exists(chrome_path):
                return chrome_path
            else:
                # Alternative Chrome paths on Windows
                alternatives = [
                    os.path.join(base_path, "AppData", "Local", "Google", "Chrome", "User Data"),
                    os.path.join(base_path, "AppData", "Local", "Chromium", "User Data", "Default"),
                ]
                
                for alt_path in alternatives:
                    if os.path.exists(alt_path):
                        return alt_path
                        
        elif system == 'posix':  # macOS/Linux
            base_path = os.path.expanduser("~")
            
            # macOS Chrome profile path
            mac_path = os.path.join(
                base_path, 
                "Library", "Application Support", "Google", "Chrome", "Default"
            )
            
            # Linux Chrome profile path
            linux_path = os.path.join(
                base_path,
                ".config", "google-chrome", "Default"
            )
            
            if os.path.exists(mac_path):
                return mac_path
            elif os.path.exists(linux_path):
                return linux_path
                
        # Fallback - create a custom profile directory
        fallback_path = os.path.join(os.getcwd(), "chrome_profile")
        os.makedirs(fallback_path, exist_ok=True)
        
        print(f"⚠️ Using fallback Chrome profile: {fallback_path}")
        print("   For better stealth, update CHROME_PROFILE_PATH in config.py to your real Chrome profile")
        
        return fallback_path
        
    def get_instagram_url(self, username: str) -> str:
        """Get Social Blade Instagram URL for username"""
        clean_username = username.lstrip('@').lower()
        return self.INSTAGRAM_URL_TEMPLATE.format(username=clean_username)
        
    def get_tiktok_url(self, username: str) -> str:
        """Get Social Blade TikTok URL for username"""
        clean_username = username.lstrip('@').lower()
        return self.TIKTOK_URL_TEMPLATE.format(username=clean_username)
        
    def get_youtube_url(self, username: str) -> str:
        """Get Social Blade YouTube URL for username"""
        clean_username = username.lstrip('@').lower()
        return self.YOUTUBE_URL_TEMPLATE.format(username=clean_username)
        
    def validate_followers_count(self, count: int) -> bool:
        """Validate if follower count is within expected range"""
        return self.MIN_FOLLOWERS <= count <= self.MAX_FOLLOWERS
        
    def validate_engagement_rate(self, rate: float) -> bool:
        """Validate if engagement rate is within expected range"""
        return self.MIN_ENGAGEMENT_RATE <= rate <= self.MAX_ENGAGEMENT_RATE
        
    def get_browser_args(self) -> List[str]:
        """Get browser launch arguments"""
        args = [
            "--start-maximized",
            "--disable-blink-features=AutomationControlled",
            "--disable-dev-shm-usage",
            "--disable-web-security",
            "--no-first-run",
            "--no-default-browser-check",
            "--password-store=basic",
            "--use-mock-keychain",
            f"--lang={self.LOCALE}",
            "--disable-features=VizDisplayCompositor",
            "--disable-background-timer-throttling",
            "--disable-backgrounding-occluded-windows",
            "--disable-renderer-backgrounding",
            "--disable-field-trial-config"
        ]
        
        # Add extension arguments if extensions are configured
        if self.ALLOWED_EXTENSIONS:
            extension_paths = ",".join(self.ALLOWED_EXTENSIONS)
            args.extend([
                f"--disable-extensions-except={extension_paths}",
                f"--load-extension={extension_paths}"
            ])
        else:
            args.append("--disable-extensions")
            
        return args
        
    def create_directories(self) -> None:
        """Create necessary directories for scraping"""
        directories = [
            self.OUTPUT_DIR,
            os.path.join(self.OUTPUT_DIR, self.CSV_DIR),
            os.path.join(self.OUTPUT_DIR, self.JSON_DIR),
            os.path.join(self.OUTPUT_DIR, self.BACKUP_DIR),
            self.LOG_DIR
        ]
        
        for directory in directories:
            os.makedirs(directory, exist_ok=True)
            
    def __str__(self) -> str:
        """String representation of config"""
        return f"""ScraperConfig:
  Chrome Profile: {self.CHROME_PROFILE_PATH}
  Output Directory: {self.OUTPUT_DIR}
  Headless Mode: {self.HEADLESS}
  Requests/Minute: {self.REQUESTS_PER_MINUTE}
  Timezone: {self.TIMEZONE}
  Languages: {', '.join(self.LANGUAGES)}
"""


# Global config instance
config = ScraperConfig()

# Environment-specific overrides
if os.getenv('SCRAPER_ENV') == 'development':
    config.LOG_LEVEL = "DEBUG"
    config.MIN_WAIT_TIME = 0.5
    config.MAX_WAIT_TIME = 2.0
    
elif os.getenv('SCRAPER_ENV') == 'production':
    config.LOG_LEVEL = "WARNING"
    config.MIN_WAIT_TIME = 2.0
    config.MAX_WAIT_TIME = 8.0
    config.REQUESTS_PER_MINUTE = 5  # More conservative in production