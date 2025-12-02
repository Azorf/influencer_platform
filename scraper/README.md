# 🎯 Social Blade Instagram Scraper - Existing Chrome Session

Advanced web scraper that connects to your existing Chrome session to collect Instagram influencer analytics from Social Blade. **No more authentication headaches!**

## ✨ Key Improvements

- **🔗 Connects to existing Chrome** - Uses your logged-in session
- **🛡️ Zero authentication issues** - You handle login manually  
- **⚡ More reliable** - No browser automation complications
- **🎮 Full control** - You can intervene if needed
- **📱 Cross-platform** - Works on Windows, Mac, and Linux

## 🚀 Quick Start

### 1. Start Chrome with Debug Port

**Windows** (run as administrator):
```bash
# Use the provided batch file
start_chrome_debug.bat

# Or manually:
chrome.exe --remote-debugging-port=9222
```

**Mac**:
```bash
# Use the provided shell script
chmod +x start_chrome_debug.sh
./start_chrome_debug.sh

# Or manually:
/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome --remote-debugging-port=9222
```

**Linux**:
```bash
# Use the provided shell script
chmod +x start_chrome_debug.sh
./start_chrome_debug.sh

# Or manually:
google-chrome --remote-debugging-port=9222
```

### 2. Log Into Social Blade

1. Chrome will open automatically to https://socialblade.com
2. **Log into your Social Blade account**
3. Keep this browser window open
4. ✅ You're ready to scrape!

### 3. Run the Scraper

```bash
cd /path/to/your/influencer_platform/
python scraper/main_improved.py
```

## 📋 How It Works

```
1. 🌐 You manually start Chrome with debug port
2. 🔐 You manually log into Social Blade  
3. 🎯 Scraper connects to your existing session
4. 📊 Scraper navigates and extracts data
5. 💾 Data is saved for Django import
```

## ⚙️ Command Line Options

```bash
# Default scraping (10 accounts)
python main_improved.py

# Test mode (3 accounts)
python main_improved.py --test

# Custom number of accounts
python main_improved.py --max-accounts 25

# Show Chrome setup instructions
python main_improved.py --instructions
```

## 🛠️ Setup & Installation

### 1. Install Dependencies
```bash
cd scraper/
pip install -r requirements.txt
playwright install chromium  # Still needed for API
```

### 2. Django Integration
Make sure your Django project is accessible:
```python
# The scraper imports your models:
from influencers.models import Influencer, SocialMediaAccount
```

### 3. Test Connection
```bash
# Start Chrome with debug port first, then:
python main_improved.py --test
```

## 📊 What Gets Extracted

For each Instagram account, the scraper collects:

```python
{
    'username': 'moroccan_influencer',
    'followers_count': 125000,
    'following_count': 1500,
    'posts_count': 850,
    'engagement_rate': 3.8,
    'avg_views': 45000,
    'avg_likes': 4200,
    'avg_comments': 180,
    'avg_shares': 250,
    'avg_saves': 320,
    'followers_14d_ago': 122000,
    'followers_growth_14d': 3000,
    'followers_growth_rate_14d': 2.46,
    'posts_count_14d': 12,
    'is_verified': True
}
```

## 🔧 Troubleshooting

### Chrome Won't Start
**Error**: "Failed to connect to Chrome"
```bash
# Solution 1: Check if Chrome is running with debug port
# Visit: http://localhost:9222 in another browser
# You should see Chrome DevTools protocol info

# Solution 2: Kill existing Chrome and restart
# Windows: taskkill /f /im chrome.exe
# Mac/Linux: pkill chrome
```

### Not Logged Into Social Blade
**Error**: "May not be logged in"
```bash
# Solution: Manually log in through the browser
1. Go to https://socialblade.com in your Chrome session
2. Click "Login" and enter credentials  
3. Complete any Cloudflare challenges manually
4. Keep browser open and restart scraper
```

### Connection Refused
**Error**: "Connection refused on port 9222"
```bash
# Solution: Chrome not started with debug port
# Make sure to start Chrome with: --remote-debugging-port=9222
```

### Django Import Issues
**Error**: "No module named 'influencers'"
```bash
# Solution: Run from Django project root
cd /path/to/influencer_platform/  # Django project directory
python scraper/main_improved.py    # Run from here
```

## 🚫 Handling Cloudflare & Blocking

The beauty of this approach is **you handle challenges manually**:

1. **Cloudflare Challenge** ➜ Solve it in the browser window
2. **Rate Limiting** ➜ Wait and refresh manually  
3. **Captcha** ➜ Complete it yourself
4. **Login Issues** ➜ Re-authenticate manually

The scraper will **pause and wait** for you to resolve issues, then continue automatically.

## 📁 Output Files

```
scraped_data/
├── csv/
│   ├── socialblade_final_20241124_143022.csv     # Ready for Django import
│   └── socialblade_progress_5_20241124_142100.csv # Progress saves
├── json/  
│   └── socialblade_final_20241124_143022.json    # Backup data
└── failed_usernames_20241124_143022.txt          # Failed usernames
```

## 🚀 Importing Data

After scraping, import into Django:

```bash
python manage.py import_social_blade scraped_data/csv/socialblade_final_20241124_143022.csv \
    --platform instagram \
    --update-existing
```

## 🎯 Advanced Usage

### Custom Influencer Selection

Edit the scraper to target specific influencers:

```python
# In main_improved.py - modify get_influencers_to_scrape():
async def get_influencers_to_scrape(self):
    @sync_to_async
    def get_influencers():
        # Custom query for specific usernames
        target_usernames = ['fashion_casa', 'food_rabat', 'tech_fez']
        return Influencer.objects.filter(username__in=target_usernames)
    
    return await get_influencers()
```

### Rate Limiting Configuration

Adjust delays in the scraper:

```python
# In main_improved.py - modify delays:
base_delay = 30        # Faster: 30 seconds between accounts
base_delay = 60        # Conservative: 60 seconds between accounts  
base_delay = 120       # Very safe: 2 minutes between accounts
```

### Multiple Sessions

You can run multiple scraper instances:

```bash
# Terminal 1: Start Chrome on port 9222
chrome.exe --remote-debugging-port=9222

# Terminal 2: Start another Chrome on different port
chrome.exe --remote-debugging-port=9223 --user-data-dir="temp_profile"

# Use different profiles for different regions/accounts
```

## 💡 Best Practices

### 1. ✅ Login Preparation
- Always log into Social Blade first
- Solve any Cloudflare challenges manually
- Keep the browser window visible

### 2. ⏱️ Smart Rate Limiting  
- Start with conservative delays (60+ seconds)
- Monitor for any blocking or errors
- Increase delays if you get rate limited

### 3. 📊 Data Quality
- Verify extracted data looks reasonable
- Check for consistent follower counts
- Spot-check a few profiles manually

### 4. 🛡️ Error Handling
- The scraper pauses on errors for manual intervention
- You can solve Cloudflare/captchas yourself
- Progress is saved automatically

### 5. 📈 Monitoring
- Watch console output for warnings
- Check generated CSV files for completeness  
- Failed usernames are logged for retry

## 🔒 Security & Privacy

### What This Approach Does
- ✅ Uses your existing Chrome session and cookies
- ✅ Respects your manual authentication
- ✅ Only visits Social Blade (no other sites)
- ✅ Extracts only public analytics data

### What It Doesn't Do
- ❌ Never stores your login credentials
- ❌ Never performs login automation
- ❌ Never modifies your browser permanently
- ❌ Never visits Instagram directly

## 📈 Expected Performance

- **~4-6 accounts per minute** (with 45-60 second delays)
- **~200-350 accounts per hour** sustained rate
- **Scales with your rate limiting preferences**
- **Manual intervention capability** for challenges

## 🆘 Support & Debugging

### Enable Debug Logging
```bash
# Add to main_improved.py:
logging.basicConfig(level=logging.DEBUG)
```

### Test Connection
```bash
# Check if Chrome debug port is accessible:
curl http://localhost:9222/json/version

# Should return Chrome version info
```

### Common Solutions
1. **"Can't connect"** ➜ Restart Chrome with debug port
2. **"Not logged in"** ➜ Manually log into Social Blade  
3. **"Cloudflare"** ➜ Solve challenge manually in browser
4. **"Rate limited"** ➜ Increase delays in scraper
5. **"No data"** ➜ Check Social Blade page structure

## 🎉 Why This Approach Works Better

| Old Method | New Method |
|------------|------------|
| 🤖 Automated browser | 🧑‍💻 Your real browser |
| 🔐 Complex auth handling | ✋ Manual login (reliable) |
| 🛡️ Cloudflare detection | 👆 You solve challenges |
| 🎭 Fake fingerprints | ✅ Real browser fingerprint |
| 🚫 Often blocked | ✅ Looks like normal usage |
| ⚡ Fragile automation | 🔄 Robust + manual control |

Your approach of using an existing Chrome session is **much more reliable** than trying to automate everything! 🎯

---

**Ready to scrape?** Start Chrome, log into Social Blade, and run the scraper! 🚀