from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import CustomUser, UserProfile

User = get_user_model()


class UserProfileSerializer(serializers.ModelSerializer):
    """Serializer for UserProfile model"""
    
    class Meta:
        model = UserProfile
        fields = [
            'id',
            'bio',
            'avatar',
            'location',
            'website',
            'date_of_birth',
            'instagram_url',
            'youtube_url',
            'tiktok_url',
            'twitter_url',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class UserSerializer(serializers.ModelSerializer):
    """Serializer for CustomUser model"""
    
    profile = UserProfileSerializer(read_only=True)
    full_name = serializers.SerializerMethodField()
    has_agency = serializers.SerializerMethodField()
    agency_id = serializers.SerializerMethodField()
    
    class Meta:
        model = CustomUser
        fields = [
            'id',
            'email',
            'username',
            'first_name',
            'last_name',
            'full_name',
            'user_type',
            'is_verified',
            'phone_number',
            'profile',
            'has_agency',
            'agency_id',
            'date_joined',
            'last_login',
            'created_at',
            'updated_at',
        ]
        read_only_fields = [
            'id', 
            'email', 
            'date_joined', 
            'last_login', 
            'created_at', 
            'updated_at',
            'has_agency',
            'agency_id',
        ]
    
    def get_full_name(self, obj) -> str:
        if obj.first_name and obj.last_name:
            return f"{obj.first_name} {obj.last_name}"
        elif obj.first_name:
            return obj.first_name
        return obj.email.split('@')[0]
    
    def get_has_agency(self, obj) -> bool:
        return hasattr(obj, 'agency') and obj.agency is not None
    
    def get_agency_id(self, obj) -> int | None:
        if hasattr(obj, 'agency') and obj.agency:
            return obj.agency.id
        return None


class UserUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating user information"""
    
    class Meta:
        model = CustomUser
        fields = [
            'first_name',
            'last_name',
            'phone_number',
            'user_type',
        ]


class UserProfileUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating user profile"""
    
    class Meta:
        model = UserProfile
        fields = [
            'bio',
            'avatar',
            'location',
            'website',
            'date_of_birth',
            'instagram_url',
            'youtube_url',
            'tiktok_url',
            'twitter_url',
        ]


class ChangePasswordSerializer(serializers.Serializer):
    """Serializer for password change"""
    
    current_password = serializers.CharField(required=True, write_only=True)
    new_password = serializers.CharField(required=True, write_only=True, min_length=8)
    confirm_password = serializers.CharField(required=True, write_only=True)
    
    def validate(self, data):
        if data['new_password'] != data['confirm_password']:
            raise serializers.ValidationError({
                'confirm_password': 'New passwords do not match.'
            })
        return data
    
    def validate_current_password(self, value):
        user = self.context['request'].user
        if not user.check_password(value):
            raise serializers.ValidationError('Current password is incorrect.')
        return value


class TokenSerializer(serializers.Serializer):
    """Serializer for token response"""
    
    token = serializers.CharField()
    user = UserSerializer()


class GoogleAuthSerializer(serializers.Serializer):
    """Serializer for Google OAuth callback"""
    
    code = serializers.CharField(required=False)
    access_token = serializers.CharField(required=False)
    
    def validate(self, data):
        if not data.get('code') and not data.get('access_token'):
            raise serializers.ValidationError(
                'Either code or access_token is required.'
            )
        return data
