from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from django.utils import timezone
from influencers.models import Influencer, SocialMediaAccount, InfluencerDataImport
from django.contrib.auth import get_user_model
import csv
import os
import pandas as pd
from datetime import datetime

User = get_user_model()


class Command(BaseCommand):
    help = 'Import Social Blade data from CSV file'
    
    def add_arguments(self, parser):
        parser.add_argument('file_path', type=str, help='Path to the CSV file with Social Blade data')
        parser.add_argument(
            '--platform',
            type=str,
            choices=['instagram', 'youtube', 'tiktok', 'twitter'],
            default='instagram',
            help='Platform for the social media data (default: instagram)'
        )
        parser.add_argument(
            '--country',
            type=str,
            default='Morocco',
            help='Default country for influencers (default: Morocco)'
        )
        parser.add_argument(
            '--update-existing',
            action='store_true',
            help='Update existing records if username matches'
        )
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Perform a dry run without actually saving data'
        )
    
    def handle(self, *args, **options):
        file_path = options['file_path']
        platform = options['platform']
        country = options['country']
        update_existing = options['update_existing']
        dry_run = options['dry_run']
        
        if not os.path.exists(file_path):
            raise CommandError(f'File "{file_path}" does not exist.')
        
        # Get admin user for import tracking
        admin_user = User.objects.filter(is_superuser=True).first()
        if not admin_user:
            raise CommandError('No admin user found. Please create a superuser first.')
        
        # Create import record
        data_import = InfluencerDataImport.objects.create(
            import_type='social_blade',
            status='processing',
            started_by=admin_user,
            import_data={
                'file_path': file_path,
                'platform': platform,
                'country': country,
                'update_existing': update_existing,
                'dry_run': dry_run
            }
        )
        
        successful_count = 0
        failed_count = 0
        errors = []
        
        try:
            # Read CSV file
            if file_path.endswith('.csv'):
                df = pd.read_csv(file_path)
            elif file_path.endswith(('.xlsx', '.xls')):
                df = pd.read_excel(file_path)
            else:
                raise CommandError('File must be CSV or Excel format')
            
            # Validate required columns
            required_columns = ['username', 'followers_count']
            missing_columns = [col for col in required_columns if col not in df.columns]
            if missing_columns:
                raise CommandError(f'Missing required columns: {missing_columns}')
            
            data_import.total_records = len(df)
            data_import.save()
            
            if dry_run:
                self.stdout.write(f'DRY RUN: Would process {len(df)} records')
            
            # Process each row
            for index, row in df.iterrows():
                try:
                    username = str(row['username']).strip().lstrip('@').lower()
                    
                    # Skip empty usernames
                    if not username or username == 'nan':
                        continue
                    
                    # Extract data from CSV
                    data = {
                        'followers_count': self.safe_int(row.get('followers_count', 0)),
                        'following_count': self.safe_int(row.get('following_count', 0)),
                        'posts_count': self.safe_int(row.get('posts_count', 0)),
                        'engagement_rate': self.safe_float(row.get('engagement_rate', 0)),
                        'avg_views': self.safe_int(row.get('avg_views', 0)),
                        'avg_likes': self.safe_int(row.get('avg_likes', 0)),
                        'avg_comments': self.safe_int(row.get('avg_comments', 0)),
                        'avg_shares': self.safe_int(row.get('avg_shares', 0)),
                        'followers_14d_ago': self.safe_int(row.get('followers_14d_ago', 0)),
                        'posts_count_14d': self.safe_int(row.get('posts_count_14d', 0)),
                        'is_verified': self.safe_bool(row.get('is_verified', False)),
                    }
                    
                    # Calculate growth metrics
                    if data['followers_14d_ago'] > 0:
                        data['followers_growth_14d'] = data['followers_count'] - data['followers_14d_ago']
                        data['followers_growth_rate_14d'] = (data['followers_growth_14d'] / data['followers_14d_ago']) * 100
                    else:
                        data['followers_growth_14d'] = 0
                        data['followers_growth_rate_14d'] = 0.0
                    
                    if dry_run:
                        self.stdout.write(f'  {username}: {data["followers_count"]:,} followers')
                        successful_count += 1
                        continue
                    
                    # Get or create influencer
                    influencer, created = Influencer.objects.get_or_create(
                        username=username,
                        defaults={
                            'full_name': username.title(),
                            'country': country,
                            'primary_category': 'lifestyle',  # Default category
                            'is_influencer': True,
                            'data_source': 'social_blade'
                        }
                    )
                    
                    # Update influencer with aggregate data
                    if data['avg_views'] > 0:
                        influencer.avg_views = data['avg_views']
                    if data['avg_likes'] > 0:
                        influencer.avg_likes = data['avg_likes']
                    if data['avg_comments'] > 0:
                        influencer.avg_comments = data['avg_comments']
                    
                    # Set growth data
                    influencer.followers_growth_14d = data['followers_growth_14d']
                    influencer.followers_growth_rate_14d = data['followers_growth_rate_14d']
                    influencer.posts_count_14d = data['posts_count_14d']
                    influencer.social_blade_data_updated = timezone.now()
                    
                    influencer.save()
                    
                    # Get or create social media account
                    social_account, account_created = SocialMediaAccount.objects.get_or_create(
                        influencer=influencer,
                        platform=platform,
                        defaults={
                            'username': username,
                            'url': self.generate_profile_url(platform, username),
                            **data,
                            'social_blade_updated': timezone.now()
                        }
                    )
                    
                    # Update existing account if requested
                    if not account_created and update_existing:
                        for key, value in data.items():
                            setattr(social_account, key, value)
                        social_account.social_blade_updated = timezone.now()
                        social_account.save()
                    
                    successful_count += 1
                    action = 'Created' if created else 'Updated' if update_existing else 'Found'
                    self.stdout.write(
                        f'✓ {action}: {username} ({data["followers_count"]:,} followers)'
                    )
                
                except Exception as e:
                    failed_count += 1
                    error_msg = f'Failed to process row {index + 1} ({username}): {str(e)}'
                    errors.append(error_msg)
                    self.stdout.write(
                        self.style.ERROR(f'✗ {error_msg}')
                    )
            
            if dry_run:
                data_import.delete()
            else:
                # Update import record
                data_import.status = 'completed' if failed_count == 0 else 'partial'
                data_import.successful_records = successful_count
                data_import.failed_records = failed_count
                data_import.error_log = '\n'.join(errors) if errors else None
                data_import.completed_at = timezone.now()
                data_import.save()
        
        except Exception as e:
            if not dry_run:
                data_import.status = 'failed'
                data_import.error_log = str(e)
                data_import.save()
            raise CommandError(f'Import failed: {e}')
        
        # Summary
        if dry_run:
            self.stdout.write(
                self.style.SUCCESS(f'\nDRY RUN COMPLETE:\n'
                                   f'Total records: {len(df)}\n'
                                   f'Would process: {successful_count}\n'
                                   f'Errors: {failed_count}')
            )
        else:
            self.stdout.write(
                self.style.SUCCESS(f'\nIMPORT COMPLETE:\n'
                                   f'Total processed: {len(df)}\n'
                                   f'Successful: {successful_count}\n'
                                   f'Failed: {failed_count}\n'
                                   f'Import ID: {data_import.id}')
            )
    
    def safe_int(self, value):
        """Safely convert value to int"""
        try:
            if pd.isna(value) or value == '':
                return 0
            return int(float(str(value).replace(',', '')))
        except (ValueError, TypeError):
            return 0
    
    def safe_float(self, value):
        """Safely convert value to float"""
        try:
            if pd.isna(value) or value == '':
                return 0.0
            return float(str(value).replace('%', '').replace(',', ''))
        except (ValueError, TypeError):
            return 0.0
    
    def safe_bool(self, value):
        """Safely convert value to bool"""
        if pd.isna(value) or value == '':
            return False
        if isinstance(value, bool):
            return value
        if isinstance(value, str):
            return value.lower() in ('true', 'yes', '1', 'verified', 'y')
        return bool(value)
    
    def generate_profile_url(self, platform, username):
        """Generate profile URL based on platform"""
        urls = {
            'instagram': f'https://instagram.com/{username}',
            'youtube': f'https://youtube.com/@{username}',
            'tiktok': f'https://tiktok.com/@{username}',
            'twitter': f'https://twitter.com/{username}',
        }
        return urls.get(platform, f'https://{platform}.com/{username}')