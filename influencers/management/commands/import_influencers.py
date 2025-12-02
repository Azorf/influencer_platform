from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from influencers.models import Influencer, InfluencerDataImport
from django.contrib.auth import get_user_model
from django.utils import timezone
import os

User = get_user_model()


class Command(BaseCommand):
    help = 'Import influencer usernames from a text file'
    
    def add_arguments(self, parser):
        parser.add_argument('file_path', type=str, help='Path to the text file containing usernames')
        parser.add_argument(
            '--country',
            type=str,
            default='Morocco',
            help='Country for the influencers (default: Morocco)'
        )
        parser.add_argument(
            '--category',
            type=str,
            default='lifestyle',
            help='Default category for influencers (default: lifestyle)'
        )
        parser.add_argument(
            '--language',
            type=str,
            default='Arabic',
            help='Default language for influencers (default: Arabic)'
        )
        parser.add_argument(
            '--skip-existing',
            action='store_true',
            help='Skip usernames that already exist in database (default: update existing)'
        )
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Perform a dry run without actually creating records'
        )

    def handle(self, *args, **options):
        file_path = options['file_path']
        country = options['country']
        category = options['category']
        language = options['language']
        skip_existing = options['skip_existing']
        dry_run = options['dry_run']
        
        if not os.path.exists(file_path):
            raise CommandError(f'File "{file_path}" does not exist.')
        
        # Get or create admin user for import tracking
        try:
            admin_user = User.objects.filter(is_superuser=True).first()
            if not admin_user:
                admin_user = User.objects.create_user(
                    username='system',
                    email='system@example.com',
                    is_superuser=True,
                    is_staff=True
                )
        except Exception as e:
            raise CommandError(f'Could not find or create admin user: {e}')
        
        # Create import record
        data_import = InfluencerDataImport.objects.create(
            import_type='username_list',
            status='processing',
            started_by=admin_user,
            import_data={
                'file_path': file_path,
                'country': country,
                'category': category,
                'language': language,
                'skip_existing': skip_existing,
                'dry_run': dry_run
            }
        )
        
        successful_count = 0
        failed_count = 0
        skipped_count = 0
        updated_count = 0
        errors = []
        
        try:
            with open(file_path, 'r', encoding='utf-8') as file:
                lines = [line.rstrip('\n\r') for line in file]  # Keep empty lines
            
            # Simple parsing: alternating username/fullname pairs
            influencer_data = []

            for i in range(0, len(lines), 2):
                if i + 1 >= len(lines):  # Need both username and fullname
                    break
                    
                username = lines[i].strip()
                fullname = lines[i + 1].strip()
                
                if username:  # Only process if username exists
                    influencer_data.append({
                        'username': username,
                        'full_name': fullname
                    })

            if not influencer_data:
                raise CommandError('No valid influencer data found in file')
            
            data_import.total_records = len(influencer_data)
            data_import.save()
            
            if dry_run:
                self.stdout.write(f'DRY RUN: Would process {len(influencer_data)} influencers')
                self.stdout.write(f'Skip existing: {skip_existing}')
                self.stdout.write('File format: username/full_name pairs detected')
            
            with transaction.atomic():
                for data in influencer_data:
                    try:
                        # Clean username (remove @ if present)
                        clean_username = data['username'].lstrip('@').lower()
                        clean_full_name = data['full_name']  # Already processed, can be None
                        
                        # Check if username already exists
                        existing_influencer = None
                        try:
                            existing_influencer = Influencer.objects.get(username=clean_username)
                        except Influencer.DoesNotExist:
                            pass
                        
                        if existing_influencer:
                            if skip_existing:
                                # Skip existing usernames
                                skipped_count += 1
                                if dry_run:
                                    self.stdout.write(f'  SKIP: {clean_username} ({clean_full_name}) - already exists')
                                else:
                                    self.stdout.write(
                                        self.style.HTTP_INFO(f'⭐ Skipped: {clean_username} ({clean_full_name}) - already exists')
                                    )
                                continue
                            else:
                                # Update existing influencer
                                if not dry_run:
                                    existing_influencer.country = country
                                    existing_influencer.is_influencer = True
                                    # Update full name if it's more complete than the current one
                                    if clean_full_name and (not existing_influencer.full_name or len(clean_full_name) > len(existing_influencer.full_name) or existing_influencer.full_name == existing_influencer.username.title()):
                                        existing_influencer.full_name = clean_full_name
                                    if existing_influencer.data_source == 'manual':
                                        existing_influencer.save()
                                
                                updated_count += 1
                                if dry_run:
                                    self.stdout.write(f'  UPDATE: {clean_username} ({clean_full_name}) - exists, would update')
                                else:
                                    self.stdout.write(
                                        self.style.WARNING(f'⚠️  Updated existing: {clean_username} ({clean_full_name})')
                                    )
                        else:
                            # Create new influencer
                            if not dry_run:
                                Influencer.objects.create(
                                    username=clean_username,
                                    full_name=clean_full_name,
                                    country=country,
                                    primary_category=category,
                                    language=language,
                                    is_influencer=True,  # Manually verified
                                    data_source='manual'
                                )
                            
                            successful_count += 1
                            if dry_run:
                                self.stdout.write(f'  NEW: {clean_username} ({clean_full_name})')
                            else:
                                self.stdout.write(
                                    self.style.SUCCESS(f'✅ Created: {clean_username} ({clean_full_name})')
                                )
                    
                    except Exception as e:
                        failed_count += 1
                        error_msg = f'Failed to process {data.get("username", "unknown")}: {str(e)}'
                        errors.append(error_msg)
                        self.stdout.write(
                            self.style.ERROR(f'❌ {error_msg}')
                        )
                
                if dry_run:
                    # Don't save the import record for dry run
                    data_import.delete()
                else:
                    # Update import record
                    data_import.status = 'completed' if failed_count == 0 else 'partial'
                    data_import.successful_records = successful_count + updated_count + skipped_count
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
                                   f'Total influencers: {len(influencer_data)}\n'
                                   f'Would create: {successful_count}\n'
                                   f'Would update: {updated_count}\n'
                                   f'Would skip: {skipped_count}\n'
                                   f'Errors: {failed_count}')
            )
        else:
            self.stdout.write(
                self.style.SUCCESS(f'\nIMPORT COMPLETE:\n'
                                   f'Total processed: {len(influencer_data)}\n'
                                   f'Created: {successful_count}\n'
                                   f'Updated: {updated_count}\n'
                                   f'Skipped: {skipped_count}\n'
                                   f'Failed: {failed_count}\n'
                                   f'Import ID: {data_import.id}')
            )
        
        if errors:
            self.stdout.write(
                self.style.ERROR(f'\nErrors encountered:\n' + '\n'.join(errors))
            )