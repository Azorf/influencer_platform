"""
Data Storage Module
Handles saving scraped data to CSV and JSON formats
"""

import csv
import json
import os
from datetime import datetime
from pathlib import Path
from typing import List, Dict, Any
import logging

logger = logging.getLogger(__name__)


class DataStorage:
    """Handles data storage in various formats"""
    
    def __init__(self, base_dir: str = "scraped_data"):
        self.base_dir = Path(base_dir)
        self.base_dir.mkdir(exist_ok=True)
        
        # Create subdirectories
        self.csv_dir = self.base_dir / "csv"
        self.json_dir = self.base_dir / "json"
        self.backup_dir = self.base_dir / "backups"
        
        for dir_path in [self.csv_dir, self.json_dir, self.backup_dir]:
            dir_path.mkdir(exist_ok=True)
            
    def save_csv(self, data: List[Dict], filename: str = None) -> str:
        """Save data to CSV format for import_social_blade command"""
        if not data:
            logger.warning("No data to save to CSV")
            return None
            
        if filename is None:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"socialblade_instagram_{timestamp}.csv"
            
        filepath = self.csv_dir / filename
        
        try:
            # Define column order for import_social_blade compatibility
            columns = [
                'username',
                'followers_count',
                'following_count', 
                'posts_count',
                'engagement_rate',
                'avg_views',
                'avg_likes',
                'avg_comments',
                'avg_shares',
                'avg_saves',
                'followers_14d_ago',
                'followers_growth_14d',
                'followers_growth_rate_14d',
                'posts_count_14d',
                'is_verified'
            ]
            
            with open(filepath, 'w', newline='', encoding='utf-8') as csvfile:
                writer = csv.DictWriter(csvfile, fieldnames=columns)
                
                # Write header
                writer.writeheader()
                
                # Write data rows
                for row in data:
                    # Only include columns that exist in our schema
                    filtered_row = {col: row.get(col, '') for col in columns}
                    
                    # Convert boolean values for CSV
                    if 'is_verified' in filtered_row:
                        filtered_row['is_verified'] = str(filtered_row['is_verified']).lower()
                        
                    writer.writerow(filtered_row)
                    
            logger.info(f"💾 CSV saved: {filepath} ({len(data)} records)")
            return str(filepath)
            
        except Exception as e:
            logger.error(f"❌ Error saving CSV: {str(e)}")
            return None
            
    def save_json(self, data: List[Dict], filename: str = None) -> str:
        """Save data to JSON format for backup and analysis"""
        if not data:
            logger.warning("No data to save to JSON")
            return None
            
        if filename is None:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"socialblade_instagram_{timestamp}.json"
            
        filepath = self.json_dir / filename
        
        try:
            # Add metadata
            output_data = {
                'metadata': {
                    'scraped_at': datetime.now().isoformat(),
                    'total_records': len(data),
                    'source': 'socialblade.com',
                    'platform': 'instagram'
                },
                'data': data
            }
            
            with open(filepath, 'w', encoding='utf-8') as jsonfile:
                json.dump(output_data, jsonfile, indent=2, ensure_ascii=False)
                
            logger.info(f"💾 JSON saved: {filepath} ({len(data)} records)")
            return str(filepath)
            
        except Exception as e:
            logger.error(f"❌ Error saving JSON: {str(e)}")
            return None
            
    def save_failed_usernames(self, usernames: List[str], filename: str = None) -> str:
        """Save list of failed usernames for retry"""
        if not usernames:
            return None
            
        if filename is None:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"failed_usernames_{timestamp}.txt"
            
        filepath = self.base_dir / filename
        
        try:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write('\n'.join(usernames))
                
            logger.info(f"📋 Failed usernames saved: {filepath} ({len(usernames)} usernames)")
            return str(filepath)
            
        except Exception as e:
            logger.error(f"❌ Error saving failed usernames: {str(e)}")
            return None
            
    def load_json(self, filepath: str) -> List[Dict]:
        """Load data from JSON file"""
        try:
            with open(filepath, 'r', encoding='utf-8') as jsonfile:
                data = json.load(jsonfile)
                
            if isinstance(data, dict) and 'data' in data:
                return data['data']  # Extract data from metadata wrapper
            elif isinstance(data, list):
                return data  # Direct list of records
            else:
                logger.error(f"Unexpected JSON structure in {filepath}")
                return []
                
        except Exception as e:
            logger.error(f"❌ Error loading JSON: {str(e)}")
            return []
            
    def backup_file(self, filepath: str) -> str:
        """Create backup of existing file"""
        try:
            source_path = Path(filepath)
            if not source_path.exists():
                return None
                
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            backup_name = f"{source_path.stem}_backup_{timestamp}{source_path.suffix}"
            backup_path = self.backup_dir / backup_name
            
            import shutil
            shutil.copy2(source_path, backup_path)
            
            logger.info(f"📦 Backup created: {backup_path}")
            return str(backup_path)
            
        except Exception as e:
            logger.error(f"❌ Error creating backup: {str(e)}")
            return None
            
    def merge_csv_files(self, filepaths: List[str], output_filename: str = None) -> str:
        """Merge multiple CSV files into one"""
        if not filepaths:
            return None
            
        if output_filename is None:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            output_filename = f"merged_socialblade_{timestamp}.csv"
            
        output_path = self.csv_dir / output_filename
        
        try:
            all_data = []
            
            # Read all CSV files
            for filepath in filepaths:
                with open(filepath, 'r', encoding='utf-8') as csvfile:
                    reader = csv.DictReader(csvfile)
                    all_data.extend(list(reader))
                    
            # Remove duplicates based on username
            seen_usernames = set()
            unique_data = []
            
            for row in all_data:
                username = row.get('username', '')
                if username and username not in seen_usernames:
                    seen_usernames.add(username)
                    unique_data.append(row)
                    
            # Save merged data
            if unique_data:
                saved_path = self.save_csv(unique_data, output_filename)
                logger.info(f"🔄 Merged {len(filepaths)} files into {saved_path} ({len(unique_data)} unique records)")
                return saved_path
            else:
                logger.warning("No data to merge")
                return None
                
        except Exception as e:
            logger.error(f"❌ Error merging CSV files: {str(e)}")
            return None
            
    def get_file_stats(self, filepath: str) -> Dict[str, Any]:
        """Get statistics about a data file"""
        try:
            file_path = Path(filepath)
            if not file_path.exists():
                return {}
                
            stats = {
                'filename': file_path.name,
                'size_bytes': file_path.stat().st_size,
                'modified': datetime.fromtimestamp(file_path.stat().st_mtime).isoformat(),
                'extension': file_path.suffix
            }
            
            # Count records for CSV files
            if file_path.suffix.lower() == '.csv':
                try:
                    with open(file_path, 'r', encoding='utf-8') as csvfile:
                        reader = csv.DictReader(csvfile)
                        stats['record_count'] = sum(1 for row in reader)
                except Exception as e:
                    logger.debug(f"Could not count CSV records: {str(e)}")
                    
            # Count records for JSON files
            elif file_path.suffix.lower() == '.json':
                try:
                    data = self.load_json(filepath)
                    stats['record_count'] = len(data)
                except Exception as e:
                    logger.debug(f"Could not count JSON records: {str(e)}")
                    
            return stats
            
        except Exception as e:
            logger.error(f"❌ Error getting file stats: {str(e)}")
            return {}
            
    def list_files(self, file_type: str = None) -> List[Dict[str, Any]]:
        """List all files in storage directories"""
        files = []
        
        try:
            directories = [self.csv_dir, self.json_dir, self.backup_dir]
            
            for directory in directories:
                if not directory.exists():
                    continue
                    
                for filepath in directory.iterdir():
                    if filepath.is_file():
                        if file_type and not filepath.suffix.lower() == f'.{file_type.lower()}':
                            continue
                            
                        stats = self.get_file_stats(str(filepath))
                        if stats:
                            stats['full_path'] = str(filepath)
                            stats['directory'] = directory.name
                            files.append(stats)
                            
            # Sort by modification time (newest first)
            files.sort(key=lambda x: x.get('modified', ''), reverse=True)
            
            return files
            
        except Exception as e:
            logger.error(f"❌ Error listing files: {str(e)}")
            return []
            
    def cleanup_old_files(self, days_old: int = 30) -> int:
        """Clean up files older than specified days"""
        try:
            deleted_count = 0
            cutoff_time = datetime.now().timestamp() - (days_old * 24 * 60 * 60)
            
            for directory in [self.csv_dir, self.json_dir, self.backup_dir]:
                if not directory.exists():
                    continue
                    
                for filepath in directory.iterdir():
                    if filepath.is_file() and filepath.stat().st_mtime < cutoff_time:
                        try:
                            filepath.unlink()
                            deleted_count += 1
                            logger.debug(f"Deleted old file: {filepath}")
                        except Exception as e:
                            logger.warning(f"Could not delete {filepath}: {str(e)}")
                            
            if deleted_count > 0:
                logger.info(f"🧹 Cleaned up {deleted_count} old files")
                
            return deleted_count
            
        except Exception as e:
            logger.error(f"❌ Error cleaning up files: {str(e)}")
            return 0