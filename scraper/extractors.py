"""
Data Extraction Module for Social Blade Instagram Analytics
Standardized version that handles all number formats consistently
"""

import re
import logging
from typing import Dict, Optional
from datetime import datetime

logger = logging.getLogger(__name__)


class SocialBladeExtractor:
    """Extracts data from Social Blade Instagram pages with standardized number handling"""
    
    async def extract_instagram_data(self, page, username: str) -> Optional[Dict]:
        """Extract Instagram data for a specific username"""
        try:
            logger.debug(f"Extracting data for @{username}")
            
            # Wait for content to load
            await page.wait_for_timeout(2000)
            
            # Check for error conditions first
            error_status = await self._check_real_error_conditions(page)
            
            if error_status == "NOT_FOUND":
                # Return a NOT FOUND record with proper values for database
                logger.info(f"@{username} not found on Social Blade - creating NOT FOUND record")
                return self._create_not_found_record(username)
            elif error_status == "ERROR":
                return None
            
            # Extract main metrics
            data = {
                'username': username,
                'platform': 'instagram',
                'scraped_at': datetime.now().isoformat()
            }
            
            # Try desktop layout first (more precise numbers)
            success = await self._extract_desktop_stats(page, data)
            
            # Fallback to mobile layout if needed
            if not success:
                await self._extract_mobile_stats(page, data)
            
            # Extract growth data
            await self._extract_growth_data(page, data)
            
            # Set verification status
            data['is_verified'] = False
            
            # Calculate additional metrics and ensure proper types
            self._calculate_derived_metrics(data)
            self._ensure_proper_types(data)
            
            # Validate extracted data
            if self._validate_data(data):
                logger.debug(f"Successfully extracted data for @{username}")
                return data
            else:
                logger.warning(f"Invalid data extracted for @{username}")
                return None
                
        except Exception as e:
            logger.error(f"Error extracting data for @{username}: {str(e)}")
            return None
    
    def _create_not_found_record(self, username: str) -> Dict:
        """Create a NOT FOUND record with appropriate values for database constraints"""
        return {
            'username': username,
            'platform': 'instagram',
            'scraped_at': datetime.now().isoformat(),
            
            # Required fields with defaults (PositiveIntegerField with default=0)
            'followers_count': 0,
            'following_count': 0, 
            'posts_count': 0,
            
            # Optional fields (can be null) - set to None for NOT FOUND
            'engagement_rate': None,
            'avg_likes': None,
            'avg_comments': None,
            'avg_views': None,
            'avg_shares': None,
            'avg_saves': None,
            
            # Growth fields (can be null) - set to None
            'followers_14d_ago': None,
            'followers_growth_14d': None,
            'followers_growth_rate_14d': None,
            'posts_count_14d': None,
            
            # Mark as verified false
            'is_verified': False,
            
            # Add a flag to indicate this was not found
            'not_found_on_social_blade': True
        }
    
    async def _check_real_error_conditions(self, page) -> str:
        """Check for real error conditions (not false positives like currency data)"""
        try:
            # Check page title for obvious errors
            title = (await page.title()).lower()
            
            if any(error in title for error in ["404", "not found", "error", "suspended"]):
                logger.warning(f"Error detected in page title: {title}")
                return "NOT_FOUND"
            
            # Check page content for "not found" or similar messages
            content = await page.content()
            content_lower = content.lower()
            
            # More specific error detection for Social Blade
            error_patterns = [
                "user not found", "page not found", "instagram user not found",
                "does not exist", "invalid username", "no data available"
            ]
            
            for pattern in error_patterns:
                if pattern in content_lower:
                    logger.warning(f"Error pattern detected: {pattern}")
                    return "NOT_FOUND"
            
            # Check if we have any stats containers
            has_desktop_stats = await page.locator('.hidden.md\\:flex .py-1').count() > 0
            has_mobile_stats = await page.locator('.grid.lg\\:hidden > div').count() > 0
            
            if not has_desktop_stats and not has_mobile_stats:
                logger.warning("No stats containers found - likely not found page")
                return "NOT_FOUND"
            
            return "OK"
            
        except Exception as e:
            logger.error(f"Error checking conditions: {str(e)}")
            return "ERROR"
    
    async def _extract_desktop_stats(self, page, data: Dict) -> bool:
        """Extract stats from desktop layout (preferred for accuracy)"""
        try:
            desktop_container = page.locator('.hidden.md\\:flex .py-1')
            count = await desktop_container.count()
            
            logger.debug(f"Found {count} desktop stat containers")
            
            if count == 0:
                return False
            
            stats_mapping = {
                'followers': 'followers_count',
                'following': 'following_count', 
                'media count': 'posts_count',
                'engagement rate': 'engagement_rate',
                'average likes': 'avg_likes',
                'average comments': 'avg_comments'
            }
            
            extracted_count = 0
            
            for i in range(count):
                try:
                    stat_div = desktop_container.nth(i)
                    paragraphs = stat_div.locator('p')
                    p_count = await paragraphs.count()
                    
                    if p_count >= 2:
                        label_text = (await paragraphs.nth(0).text_content()).strip().lower()
                        value_text = (await paragraphs.nth(1).text_content()).strip()
                        
                        logger.debug(f"Desktop stat: '{label_text}' = '{value_text}'")
                        
                        # Map label to data field
                        for label_key, data_key in stats_mapping.items():
                            if label_key in label_text:
                                if data_key == 'engagement_rate':
                                    # Keep engagement rate as float
                                    value = self._parse_number(value_text, is_percentage=True, force_integer=False)
                                elif data_key in ['avg_likes', 'avg_comments']:
                                    # These might be decimals, round to integer
                                    value = self._parse_number(value_text, is_percentage=False, force_integer=True)
                                else:
                                    # Followers, following, posts should be integers
                                    value = self._parse_number(value_text, is_percentage=False, force_integer=True)
                                
                                if value is not None:
                                    data[data_key] = value
                                    extracted_count += 1
                                    logger.debug(f"Extracted {data_key}: {value} (type: {type(value)})")
                                break
                                
                except Exception as e:
                    logger.debug(f"Error processing desktop stat {i}: {str(e)}")
                    continue
            
            return extracted_count >= 3  # Need at least 3 main stats
            
        except Exception as e:
            logger.error(f"Error extracting desktop stats: {str(e)}")
            return False
    
    async def _extract_mobile_stats(self, page, data: Dict) -> bool:
        """Extract stats from mobile layout (fallback)"""
        try:
            mobile_containers = page.locator('.grid.lg\\:hidden > div')
            count = await mobile_containers.count()
            
            logger.debug(f"Found {count} mobile stat containers")
            
            if count == 0:
                return False
            
            stats_mapping = {
                'followers': 'followers_count',
                'following': 'following_count',
                'media count': 'posts_count', 
                'engagement rate': 'engagement_rate',
                'average likes': 'avg_likes',
                'average comments': 'avg_comments'
            }
            
            for i in range(count):
                try:
                    stat_div = mobile_containers.nth(i)
                    paragraphs = stat_div.locator('p')
                    p_count = await paragraphs.count()
                    
                    if p_count >= 2:
                        label_text = (await paragraphs.nth(0).text_content()).strip().lower()
                        value_text = (await paragraphs.nth(1).text_content()).strip()
                        
                        logger.debug(f"Mobile stat: '{label_text}' = '{value_text}'")
                        
                        # Map label to data field
                        for label_key, data_key in stats_mapping.items():
                            if label_key in label_text:
                                if data_key == 'engagement_rate':
                                    # Keep engagement rate as float
                                    value = self._parse_number(value_text, is_percentage=True, force_integer=False)
                                elif data_key in ['avg_likes', 'avg_comments']:
                                    # Round to integer
                                    value = self._parse_number(value_text, is_percentage=False, force_integer=True)
                                else:
                                    # Followers, following, posts as integers
                                    value = self._parse_number(value_text, is_percentage=False, force_integer=True)
                                
                                if value is not None:
                                    data[data_key] = value
                                    logger.debug(f"Extracted {data_key}: {value} (type: {type(value)})")
                                break
                                
                except Exception as e:
                    logger.debug(f"Error processing mobile stat {i}: {str(e)}")
                    continue
            
            return True
            
        except Exception as e:
            logger.error(f"Error extracting mobile stats: {str(e)}")
            return False
    
    async def _extract_growth_data(self, page, data: Dict) -> None:
        """Extract 14-day growth data"""
        try:
            growth_elements = page.locator('.text-3xl.font-bold')
            count = await growth_elements.count()
            
            logger.debug(f"Found {count} growth elements")
            
            # Set defaults
            data.update({
                'followers_growth_14d': 0,
                'followers_14d_ago': data.get('followers_count', 0),
                'followers_growth_rate_14d': 0.0,
                'posts_count_14d': 0
            })
            
            # Extract growth data (position 3 from debug output had the -1)
            if count > 3:
                try:
                    growth_text = await growth_elements.nth(3).text_content()
                    followers_growth_14d = self._parse_number(growth_text.strip(), force_integer=True)
                    
                    if followers_growth_14d is not None:
                        data['followers_growth_14d'] = followers_growth_14d
                        
                        # Calculate 14d ago followers
                        current_followers = data.get('followers_count', 0)
                        data['followers_14d_ago'] = current_followers - followers_growth_14d
                        
                        # Calculate growth rate (keep as float)
                        if data['followers_14d_ago'] > 0:
                            growth_rate = (followers_growth_14d / data['followers_14d_ago']) * 100
                            data['followers_growth_rate_14d'] = round(growth_rate, 2)
                        
                        logger.debug(f"Extracted follower growth: {followers_growth_14d}")
                        
                except Exception as e:
                    logger.debug(f"Error extracting growth: {str(e)}")
                
        except Exception as e:
            logger.error(f"Error extracting growth data: {str(e)}")
    
    def _parse_number(self, text: str, is_percentage: bool = False, force_integer: bool = False):
        """
        Standardized number parsing that handles all formats consistently
        
        Args:
            text: The text to parse (e.g., "1.5K", "1,521", "9.38%")
            is_percentage: Whether this is a percentage value
            force_integer: Whether to force the result to be an integer
            
        Returns:
            Parsed number as int or float depending on force_integer
        """
        if not text:
            return None
            
        # Clean the text
        original_text = text
        text = str(text).strip()
        
        # Handle percentage
        if is_percentage or '%' in text:
            clean_text = text.replace('%', '').strip()
            try:
                value = float(clean_text)
                return int(round(value)) if force_integer else value
            except ValueError:
                logger.debug(f"Could not parse percentage: '{original_text}'")
                return None
        
        # Remove commas and convert to uppercase for suffix handling
        text = text.replace(',', '').upper()
        
        # Handle negative numbers
        is_negative = text.startswith('-')
        if is_negative:
            text = text[1:]
        
        # Handle K/M/B suffixes
        multiplier = 1
        if text.endswith('K'):
            multiplier = 1000
            text = text[:-1]
        elif text.endswith('M'):
            multiplier = 1000000
            text = text[:-1]
        elif text.endswith('B'):
            multiplier = 1000000000
            text = text[:-1]
        
        # Parse the base number
        try:
            number = float(text) * multiplier
            
            if is_negative:
                number = -number
            
            # Convert to integer if requested or if it's a whole number
            if force_integer or (number.is_integer() and not is_percentage):
                return int(number)
            else:
                return number
                
        except (ValueError, AttributeError):
            logger.debug(f"Could not parse number from: '{original_text}'")
            return None
    
    def _calculate_derived_metrics(self, data: Dict) -> None:
        """Calculate additional derived metrics"""
        try:
            # Ensure all required fields exist with proper defaults
            data.setdefault('followers_count', 0)
            data.setdefault('following_count', 0) 
            data.setdefault('posts_count', 0)
            data.setdefault('engagement_rate', 0.0)
            data.setdefault('avg_likes', 0)
            data.setdefault('avg_comments', 0)
            
            # Calculate estimated metrics if missing
            followers = data['followers_count']
            engagement_rate = data['engagement_rate']
            
            # If we have followers and engagement but missing avg metrics, estimate them
            if followers > 0 and engagement_rate > 0 and data['avg_likes'] == 0:
                estimated_total_engagement = int(followers * (engagement_rate / 100))
                data['avg_likes'] = int(estimated_total_engagement * 0.7)  # 70% of engagement is likes
                data['avg_comments'] = int(estimated_total_engagement * 0.15)  # 15% is comments
            
            # Calculate other metrics based on likes + comments
            total_engagement = data['avg_likes'] + data['avg_comments']
            
            if total_engagement > 0:
                data['avg_views'] = int(total_engagement * 3.5)  # Views are typically 3.5x engagement
                data['avg_shares'] = max(1, int(total_engagement * 0.05))  # 5% sharing rate
                data['avg_saves'] = max(1, int(total_engagement * 0.08))  # 8% save rate
            else:
                data.update({
                    'avg_views': 0,
                    'avg_shares': 0,
                    'avg_saves': 0
                })
                
        except Exception as e:
            logger.error(f"Error calculating derived metrics: {str(e)}")
    
    def _ensure_proper_types(self, data: Dict) -> None:
        """Ensure all numbers are proper integers or floats as expected by Django"""
        try:
            # Integer fields (for database storage)
            integer_fields = [
                'followers_count', 'following_count', 'posts_count',
                'avg_likes', 'avg_comments', 'avg_views', 'avg_shares', 'avg_saves',
                'followers_14d_ago', 'followers_growth_14d', 'posts_count_14d'
            ]
            
            # Float fields
            float_fields = [
                'engagement_rate', 'followers_growth_rate_14d'
            ]
            
            # Ensure integer fields are integers
            for field in integer_fields:
                if field in data and data[field] is not None:
                    try:
                        data[field] = int(float(data[field]))  # Handle string numbers
                    except (ValueError, TypeError):
                        logger.warning(f"Could not convert {field} to integer: {data[field]}")
                        data[field] = 0
            
            # Ensure float fields are floats  
            for field in float_fields:
                if field in data and data[field] is not None:
                    try:
                        data[field] = float(data[field])
                    except (ValueError, TypeError):
                        logger.warning(f"Could not convert {field} to float: {data[field]}")
                        data[field] = 0.0
            
            # Boolean field
            if 'is_verified' in data:
                data['is_verified'] = bool(data['is_verified'])
                
        except Exception as e:
            logger.error(f"Error ensuring proper types: {str(e)}")
    
    def _validate_data(self, data: Dict) -> bool:
        """Validate extracted data for basic sanity checks"""
        try:
            # Check that followers_count exists (can be 0 for NOT FOUND accounts)
            if 'followers_count' not in data or data.get('followers_count') is None:
                logger.warning("No followers count field found")
                return False
            
            # For NOT FOUND accounts, accept 0 values
            if data.get('not_found_on_social_blade'):
                logger.debug("Validating NOT FOUND record - accepting 0 values")
                return True
            
            # For regular accounts, check that we have some followers
            followers = data.get('followers_count', 0)
            if followers <= 0:
                logger.warning(f"No followers found for regular account: {followers}")
                return False
            
            # Basic sanity checks for regular accounts
            if followers > 1000000000:
                logger.warning(f"Unrealistic follower count: {followers}")
                return False
            
            following = data.get('following_count', 0) 
            if following < 0 or following > 100000:
                logger.warning(f"Unrealistic following count: {following}")
                return False
            
            posts = data.get('posts_count', 0)
            if posts < 0 or posts > 50000:
                logger.warning(f"Unrealistic posts count: {posts}")
                return False
            
            engagement = data.get('engagement_rate')
            if engagement is not None and (engagement < 0 or engagement > 100):
                logger.warning(f"Unrealistic engagement rate: {engagement}%")
                return False
            
            return True
            
        except Exception as e:
            logger.error(f"Error validating data: {str(e)}")
            return False