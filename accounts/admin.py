from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from django.utils.translation import gettext_lazy as _
from .models import CustomUser, UserProfile


@admin.register(CustomUser)
class CustomUserAdmin(UserAdmin):
    """Custom user admin"""
    
    list_display = ('email', 'username', 'user_type', 'is_verified', 'is_active', 'date_joined')
    list_filter = ('user_type', 'is_verified', 'is_active', 'is_staff', 'is_superuser')
    search_fields = ('email', 'username', 'first_name', 'last_name')
    ordering = ('-date_joined',)
    
    fieldsets = UserAdmin.fieldsets + (
        (_('Additional Info'), {
            'fields': ('user_type', 'is_verified', 'phone_number')
        }),
    )
    
    add_fieldsets = UserAdmin.add_fieldsets + (
        (_('Additional Info'), {
            'fields': ('email', 'user_type', 'phone_number')
        }),
    )


@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    """User profile admin"""
    
    list_display = ('user', 'location', 'website', 'created_at')
    list_filter = ('created_at', 'updated_at')
    search_fields = ('user__email', 'user__username', 'location')
    readonly_fields = ('created_at', 'updated_at')
    
    fieldsets = (
        (_('User'), {
            'fields': ('user',)
        }),
        (_('Basic Information'), {
            'fields': ('bio', 'avatar', 'location', 'website', 'date_of_birth')
        }),
        (_('Social Media'), {
            'fields': ('instagram_url', 'youtube_url', 'tiktok_url', 'twitter_url'),
            'classes': ('collapse',)
        }),
        (_('Timestamps'), {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )