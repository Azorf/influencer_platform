"""
Human Behavior Simulation for Web Scraping
Implements realistic human-like interactions to avoid detection
"""

import asyncio
import random
import math
from typing import List, Tuple
import logging

logger = logging.getLogger(__name__)


class HumanBehavior:
    """Simulates realistic human behavior patterns"""
    
    def __init__(self):
        self.last_action_time = 0
        self.action_count = 0
        self.mouse_position = (0, 0)
        
    async def human_wait(self, min_seconds: float = 0.8, max_seconds: float = 4.2) -> None:
        """Human-like random delay with noise"""
        # Base delay with some randomness
        base_delay = random.uniform(min_seconds, max_seconds)
        
        # Add noise to make it more organic
        noise = random.gauss(0, 0.3)
        delay = max(0.1, base_delay + noise)
        
        # Occasionally add longer pauses (human distraction)
        if random.random() < 0.05:  # 5% chance
            delay += random.uniform(2, 8)
            logger.debug("💭 Simulating human distraction...")
            
        logger.debug(f"⏱️ Human wait: {delay:.2f}s")
        await asyncio.sleep(delay)
        
    async def human_scroll(self, page, direction: str = "down") -> None:
        """Simulate human-like scrolling behavior"""
        logger.debug("SCROLL: Performing human-like scrolling...")
        
        # Number of scroll actions
        scroll_count = random.randint(3, 8)
        
        for i in range(scroll_count):
            # Variable scroll distance
            if direction == "down":
                delta_y = random.randint(200, 600)
            else:
                delta_y = -random.randint(200, 600)
                
            # Scroll with mouse wheel
            await page.mouse.wheel(0, delta_y)
            
            # Pause between scrolls (reading time)
            pause = random.uniform(0.5, 2.5)
            
            # Occasionally pause longer (reading something interesting)
            if random.random() < 0.2:
                pause += random.uniform(1, 4)
                
            await asyncio.sleep(pause)
            
            # Occasionally scroll back up slightly (re-reading)
            if random.random() < 0.15:
                await page.mouse.wheel(0, -random.randint(50, 150))
                await asyncio.sleep(random.uniform(0.3, 1.0))
                
        # Final pause
        await self.human_wait(1, 3)
        
    async def human_mouse_move(self, page, x: int, y: int, duration: float = None) -> None:
        """Move mouse in a human-like curved path"""
        current_pos = self.mouse_position
        
        # Calculate movement
        distance = math.sqrt((x - current_pos[0])**2 + (y - current_pos[1])**2)
        
        if duration is None:
            # Movement duration based on distance
            duration = max(0.2, min(2.0, distance / 500))
            
        # Number of intermediate points for smooth movement
        steps = max(5, int(distance / 20))
        
        for i in range(steps + 1):
            progress = i / steps
            
            # Bezier curve for natural movement
            control_x = (current_pos[0] + x) / 2 + random.randint(-50, 50)
            control_y = (current_pos[1] + y) / 2 + random.randint(-50, 50)
            
            # Calculate point on curve
            t = progress
            current_x = (1-t)**2 * current_pos[0] + 2*(1-t)*t * control_x + t**2 * x
            current_y = (1-t)**2 * current_pos[1] + 2*(1-t)*t * control_y + t**2 * y
            
            # Add small random noise
            current_x += random.randint(-2, 2)
            current_y += random.randint(-2, 2)
            
            await page.mouse.move(current_x, current_y)
            await asyncio.sleep(duration / steps)
            
        self.mouse_position = (x, y)
        
    async def human_click(self, page, selector: str, button: str = "left") -> None:
        """Human-like clicking with natural mouse movement"""
        logger.debug(f"CLICK: Human clicking: {selector}")
        
        try:
            # Wait for element to be visible
            await page.wait_for_selector(selector, timeout=10000)
            element = await page.locator(selector).first
            
            # Get element position
            box = await element.bounding_box()
            if not box:
                logger.warning(f"CLICK: Element not visible: {selector}")
                return
                
            # Click position with some randomness
            click_x = box['x'] + box['width'] * random.uniform(0.2, 0.8)
            click_y = box['y'] + box['height'] * random.uniform(0.2, 0.8)
            
            # Move mouse to element
            await self.human_mouse_move(page, click_x, click_y)
            
            # Pause before clicking (human hesitation)
            await self.human_wait(0.1, 0.5)
            
            # Click
            await page.mouse.click(click_x, click_y, button=button)
            
            # Brief pause after click
            await self.human_wait(0.2, 0.8)
            
        except Exception as e:
            logger.error(f"CLICK: Click failed for {selector}: {str(e)}")
            
    async def human_type(self, page, text: str, selector: str = None) -> None:
        """Human-like typing with realistic speed variation"""
        logger.debug(f"TYPE: Human typing: {text[:20]}...")
        
        if selector:
            await self.human_click(page, selector)
            
        for char in text:
            await page.keyboard.type(char)
            
            # Variable typing speed
            if char == ' ':
                delay = random.uniform(0.1, 0.3)  # Longer pause for spaces
            elif char in '.,!?;:':
                delay = random.uniform(0.15, 0.4)  # Pause after punctuation
            else:
                delay = random.uniform(0.05, 0.15)  # Normal typing
                
            # Occasionally make typing mistakes and correct them
            if random.random() < 0.02:  # 2% chance of typo
                wrong_char = random.choice('abcdefghijklmnopqrstuvwxyz')
                await page.keyboard.type(wrong_char)
                await asyncio.sleep(random.uniform(0.2, 0.5))  # Realize mistake
                await page.keyboard.press('Backspace')
                await asyncio.sleep(random.uniform(0.1, 0.3))
                
            await asyncio.sleep(delay)
            
    async def human_navigation(self, page, url: str) -> None:
        """Navigate to URL with human-like behavior"""
        logger.info(f"NAVIGATE: Going to {url}")
        
        # Random think time before navigation
        await self.human_wait(1, 3)
        
        # Navigate to page
        response = await page.goto(url, wait_until="domcontentloaded", timeout=30000)
        
        if not response or response.status >= 400:
            raise Exception(f"Navigation failed: {response.status if response else 'No response'}")
            
        # Wait for initial load
        await self.human_wait(2, 4)
        
        # Simulate reading the page
        await self.simulate_page_reading(page)
        
    async def simulate_page_reading(self, page) -> None:
        """Simulate human reading patterns on a page"""
        logger.debug("👀 Simulating page reading behavior...")
        
        # Get page dimensions
        viewport = page.viewport_size
        if not viewport:
            return
            
        # Simulate eye movement patterns
        reading_points = [
            (viewport['width'] * 0.1, viewport['height'] * 0.2),   # Top left
            (viewport['width'] * 0.5, viewport['height'] * 0.3),   # Header area
            (viewport['width'] * 0.8, viewport['height'] * 0.4),   # Top right
            (viewport['width'] * 0.2, viewport['height'] * 0.6),   # Content area
            (viewport['width'] * 0.7, viewport['height'] * 0.7),   # Lower right
        ]
        
        for point in reading_points:
            await self.human_mouse_move(page, point[0], point[1])
            await self.human_wait(0.5, 1.5)  # Reading pause
            
        # Small scroll to simulate reading
        await page.mouse.wheel(0, random.randint(100, 300))
        await self.human_wait(1, 2)
        
    async def simulate_human_session(self, page) -> None:
        """Simulate overall human browsing session behavior"""
        logger.debug("🧠 Starting human session simulation...")
        
        # Random initial activity
        actions = [
            self._check_page_title,
            self._hover_random_element,
            self._small_scroll,
            self._pause_and_read,
        ]
        
        # Perform 1-3 random actions
        for _ in range(random.randint(1, 3)):
            action = random.choice(actions)
            await action(page)
            await self.human_wait(0.5, 2.0)
            
    async def _check_page_title(self, page) -> None:
        """Simulate checking page title"""
        try:
            title = await page.title()
            logger.debug(f"📄 Page title: {title[:50]}...")
        except:
            pass
            
    async def _hover_random_element(self, page) -> None:
        """Hover over a random visible element"""
        try:
            elements = await page.locator('a, button, h1, h2, h3').all()
            if elements:
                element = random.choice(elements)
                box = await element.bounding_box()
                if box:
                    hover_x = box['x'] + box['width'] / 2
                    hover_y = box['y'] + box['height'] / 2
                    await self.human_mouse_move(page, hover_x, hover_y)
                    await self.human_wait(0.5, 1.5)
        except:
            pass
            
    async def _small_scroll(self, page) -> None:
        """Small scroll movement"""
        delta = random.randint(50, 200)
        await page.mouse.wheel(0, delta)
        await self.human_wait(0.3, 1.0)
        
    async def _pause_and_read(self, page) -> None:
        """Pause as if reading content"""
        await self.human_wait(1.5, 4.0)
        
    def reset_session(self) -> None:
        """Reset session data"""
        self.action_count = 0
        self.mouse_position = (0, 0)
        logger.debug("🔄 Human behavior session reset")