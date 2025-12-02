#!/usr/bin/env python3
"""
Simple Chrome Launcher for Social Blade
Exact same approach as your working test1.py
"""

import subprocess
import os
import sys

def launch_fresh_chrome():
    """Launch Chrome with fresh profile - exactly like your test1.py"""
    
    print("🚀 LAUNCHING FRESH CHROME FOR SOCIAL BLADE")
    print("=" * 45)
    
    # Chrome path
    chrome_path = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
    if not os.path.exists(chrome_path):
        chrome_path = r"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe"
        
    if not os.path.exists(chrome_path):
        print("❌ Chrome not found!")
        return False
    
    # Fresh profile path - exactly like yours
    profile_path = r"C:\chrome-debug-profile"
    
    # Create the directory if it doesn't exist
    os.makedirs(profile_path, exist_ok=True)
    print(f"✅ Using profile: {profile_path}")
    
    # Launch Chrome - exactly your command
    try:
        subprocess.Popen([
            chrome_path,
            "--remote-debugging-port=9222",
            f"--user-data-dir={profile_path}",
            "--disable-blink-features=AutomationControlled",
            "https://socialblade.com"
        ])
        
        print("✅ Chrome launched successfully!")
        print("\n📋 Next steps:")
        print("1. Log into Social Blade in the new Chrome window")
        print("2. Complete any challenges/captchas")
        print("3. Make sure you can browse influencer pages")
        print("4. Keep Chrome open")
        print("\n🚀 Then run:")
        print("   python scraper/main_fresh_chrome.py --test")
        print("\n⚠️ Do NOT close Chrome until scraping is complete!")
        
        return True
        
    except Exception as e:
        print(f"❌ Failed to launch Chrome: {e}")
        return False

if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "--help":
        print("Fresh Chrome Launcher for Social Blade Scraping")
        print("Based on your working test1.py approach")
        print("\nUsage:")
        print("  python launch_fresh_chrome.py")
        print("\nThis will:")
        print("  1. Create fresh Chrome profile at C:\\chrome-debug-profile")
        print("  2. Launch Chrome with debugging enabled")
        print("  3. Open Social Blade for manual login")
        print("  4. Set up environment for scraping")
    else:
        launch_fresh_chrome()