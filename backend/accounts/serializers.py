"""
Serializers for authentication, registration, and profile management.
"""
import re
from django.contrib.auth import authenticate
from django.contrib.auth.password_validation import validate_password
from django.contrib.auth.tokens import default_token_generator
from django.utils.encoding import force_bytes, force_str
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from rest_framework import serializers

from django.db import transaction
from .models import User, CandidateProfile, RecruiterProfile
from .validators import validate_pdf_resume
from .services import AccountService


def validate_indian_phone(value):
    """
    Validate Indian 10-digit mobile number and format as +91XXXXXXXXXX.
    Ensures standard Indian mobile prefix (starts with 6, 7, 8, or 9).
    """
    if not value or not str(value).strip():
        return ""

    cleaned = re.sub(r'[\s\-\(\)]', '', str(value).strip())
    if cleaned.startswith('+91'):
        digits = cleaned[3:]
    elif cleaned.startswith('91') and len(cleaned) == 12:
        digits = cleaned[2:]
    else:
        digits = cleaned

    if not re.match(r'^[6-9]\d{9}$', digits):
        raise serializers.ValidationError(
            'Please enter a valid 10-digit Indian mobile number starting with 6, 7, 8, or 9.'
        )
    return f"+91{digits}"


class RegisterSerializer(serializers.ModelSerializer):
    """
    Registration serializer supporting separate candidate and recruiter workflows.
    Recruiter registration accepts and stores company branding attributes atomically.
    """
    password = serializers.CharField(
        write_only=True,
        min_length=8,
        validators=[validate_password],
        style={'input_type': 'password'},
    )
    password_confirm = serializers.CharField(
        write_only=True,
        style={'input_type': 'password'},
    )
    role = serializers.ChoiceField(
        choices=[(User.Role.CANDIDATE, 'Candidate'), (User.Role.RECRUITER, 'Recruiter')],
        default=User.Role.CANDIDATE,
    )
    phone = serializers.CharField(
        max_length=20,
        required=False,
        allow_blank=True,
    )
    company_name = serializers.CharField(
        max_length=255,
        required=False,
        allow_blank=True,
        trim_whitespace=True,
    )
    company_website = serializers.URLField(
        max_length=500,
        required=False,
        allow_blank=True,
    )
    position = serializers.CharField(
        max_length=255,
        required=False,
        allow_blank=True,
        trim_whitespace=True,
    )
    company_location = serializers.CharField(
        max_length=255,
        required=False,
        allow_blank=True,
        trim_whitespace=True,
    )

    class Meta:
        model = User
        fields = [
            'id', 'email', 'first_name', 'last_name',
            'role', 'password', 'password_confirm',
            'phone', 'company_name', 'company_website',
            'position', 'company_location',
        ]
        read_only_fields = ['id']

    def validate_first_name(self, value):
        val = value.strip()
        if len(val) < 2:
            raise serializers.ValidationError('First name must be at least 2 characters long.')
        if not re.match(r"^[a-zA-Z\s\-']+$", val):
            raise serializers.ValidationError('First name should contain only alphabetical characters.')
        return val

    def validate_last_name(self, value):
        val = value.strip()
        if len(val) < 1:
            raise serializers.ValidationError('Last name cannot be empty.')
        if not re.match(r"^[a-zA-Z\s\-']+$", val):
            raise serializers.ValidationError('Last name should contain only alphabetical characters.')
        return val

    def validate_email(self, value):
        email = value.lower().strip()
        if User.objects.filter(email=email).exists():
            raise serializers.ValidationError('An account with this email address already exists.')
        return email

    def validate_phone(self, value):
        return validate_indian_phone(value)

    def validate_role(self, value):
        if value not in (User.Role.CANDIDATE, User.Role.RECRUITER):
            raise serializers.ValidationError('Public registration is only available for Candidates and Recruiters.')
        return value

    def validate(self, attrs):
        if attrs.get('password') != attrs.get('password_confirm'):
            raise serializers.ValidationError({'password_confirm': 'Passwords do not match.'})

        role = attrs.get('role', User.Role.CANDIDATE)
        if role == User.Role.RECRUITER:
            company_name = attrs.get('company_name', '').strip()
            if not company_name:
                raise serializers.ValidationError({
                    'company_name': 'Company name is required for recruiter registration.'
                })
            if len(company_name) < 2:
                raise serializers.ValidationError({
                    'company_name': 'Company name must be at least 2 characters long.'
                })

        return attrs

    def create(self, validated_data):
        validated_data.pop('password_confirm', None)
        return AccountService.register_user(validated_data)


class LoginSerializer(serializers.Serializer):
    """Serializer for user login."""
    email = serializers.EmailField()
    password = serializers.CharField(
        write_only=True,
        style={'input_type': 'password'},
    )

    def validate(self, attrs):
        email = attrs.get('email', '').lower().strip()
        password = attrs.get('password')

        if not email or not password:
            raise serializers.ValidationError('Email and password are required.')

        user = authenticate(
            request=self.context.get('request'),
            username=email,
            password=password,
        )

        if not user:
            raise serializers.ValidationError(
                'Invalid email or password.'
            )

        if not user.is_active:
            raise serializers.ValidationError(
                'This account has been deactivated.'
            )

        attrs['user'] = user
        return attrs


class PasswordResetRequestSerializer(serializers.Serializer):
    """Serializer for requesting a password reset email."""
    email = serializers.EmailField()

    def validate_email(self, value):
        return value.lower().strip()


class PasswordResetConfirmSerializer(serializers.Serializer):
    """Serializer for confirming a password reset with token."""
    uid = serializers.CharField()
    token = serializers.CharField()
    new_password = serializers.CharField(
        min_length=8,
        validators=[validate_password],
        write_only=True,
    )
    new_password_confirm = serializers.CharField(write_only=True)

    def validate(self, attrs):
        if attrs['new_password'] != attrs['new_password_confirm']:
            raise serializers.ValidationError(
                {'new_password_confirm': 'Passwords do not match.'}
            )

        try:
            uid = force_str(urlsafe_base64_decode(attrs['uid']))
            user = User.objects.get(pk=uid)
        except (TypeError, ValueError, OverflowError, User.DoesNotExist):
            raise serializers.ValidationError({'uid': 'Invalid reset link.'})

        if not default_token_generator.check_token(user, attrs['token']):
            raise serializers.ValidationError(
                {'token': 'Invalid or expired reset token.'}
            )

        attrs['user'] = user
        return attrs

    def save(self):
        user = self.validated_data['user']
        user.set_password(self.validated_data['new_password'])
        user.save()
        return user


class ChangePasswordSerializer(serializers.Serializer):
    """Serializer for changing password while authenticated."""
    old_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(
        write_only=True,
        min_length=8,
        validators=[validate_password],
    )
    new_password_confirm = serializers.CharField(write_only=True)

    def validate_old_password(self, value):
        user = self.context['request'].user
        if not user.check_password(value):
            raise serializers.ValidationError('Current password is incorrect.')
        return value

    def validate(self, attrs):
        if attrs['new_password'] != attrs['new_password_confirm']:
            raise serializers.ValidationError(
                {'new_password_confirm': 'Passwords do not match.'}
            )
        return attrs

    def save(self):
        user = self.context['request'].user
        user.set_password(self.validated_data['new_password'])
        user.save()
        return user


class UserSerializer(serializers.ModelSerializer):
    """Core serializer for authenticated user profiles and basic metadata."""
    full_name = serializers.CharField(source='get_full_name', read_only=True)
    company_name = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            'id', 'email', 'first_name', 'last_name', 'full_name',
            'role', 'company_name', 'is_active', 'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'email', 'role', 'created_at', 'updated_at']

    def get_company_name(self, obj):
        if obj.role == User.Role.RECRUITER and hasattr(obj, 'recruiter_profile'):
            return obj.recruiter_profile.company_name or ''
        return ''


class UserUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating user basic info."""

    class Meta:
        model = User
        fields = ['first_name', 'last_name']


class AdminUserSerializer(serializers.ModelSerializer):
    """Serializer for admin viewing/managing users."""
    full_name = serializers.CharField(source='get_full_name', read_only=True)

    class Meta:
        model = User
        fields = [
            'id', 'email', 'first_name', 'last_name', 'full_name',
            'role', 'is_active', 'is_staff', 'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'email', 'role', 'created_at', 'updated_at']

    def validate(self, attrs):
        if 'role' in self.initial_data and self.instance and self.initial_data['role'] != self.instance.role:
            raise serializers.ValidationError({"role": "User roles cannot be modified after account creation."})
        if self.instance and self.instance.role == User.Role.ADMIN and attrs.get('is_active') is False:
            raise serializers.ValidationError({"is_active": "Admin accounts cannot be deactivated."})
        return attrs


class AdminRecruiterSerializer(serializers.ModelSerializer):
    """Serializer for admin viewing recruiters."""
    full_name = serializers.CharField(source='get_full_name', read_only=True)
    company_name = serializers.CharField(source='recruiter_profile.company_name', read_only=True, default='')

    class Meta:
        model = User
        fields = [
            'id', 'email', 'first_name', 'last_name', 'full_name',
            'role', 'is_active', 'company_name', 'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'role', 'created_at', 'updated_at']


# ==============================================================================
# PROFILE SERIALIZERS
# ==============================================================================

class CandidateProfileSerializer(serializers.ModelSerializer):
    """Serializer for candidate profile."""
    user = UserSerializer(read_only=True)
    resume_url = serializers.SerializerMethodField()
    profile_picture_url = serializers.SerializerMethodField()

    class Meta:
        model = CandidateProfile
        fields = [
            'id', 'user', 'phone', 'bio', 'skills', 'education',
            'experience', 'resume', 'resume_url', 'profile_picture',
            'profile_picture_url', 'location',
            'linkedin_url', 'portfolio_url', 'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'user', 'resume_url', 'profile_picture_url', 'created_at', 'updated_at']

    def get_resume_url(self, obj):
        if obj.resume:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.resume.url)
            return obj.resume.url
        return None

    def get_profile_picture_url(self, obj):
        if obj.profile_picture:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.profile_picture.url)
            return obj.profile_picture.url
        return None


class CandidateProfileUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating candidate profile."""
    first_name = serializers.CharField(source='user.first_name', required=False)
    last_name = serializers.CharField(source='user.last_name', required=False)

    class Meta:
        model = CandidateProfile
        fields = [
            'first_name', 'last_name', 'phone', 'bio', 'skills',
            'education', 'experience', 'resume', 'profile_picture', 'location',
            'linkedin_url', 'portfolio_url',
        ]

    def validate_phone(self, value):
        return validate_indian_phone(value)

    def validate_resume(self, value):
        return validate_pdf_resume(value)

    def update(self, instance, validated_data):
        user_data = validated_data.pop('user', {})
        if user_data:
            for attr, value in user_data.items():
                setattr(instance.user, attr, value)
            instance.user.save()

        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        return instance


class RecruiterProfileSerializer(serializers.ModelSerializer):
    """Serializer for recruiter profile."""
    user = UserSerializer(read_only=True)
    logo_url = serializers.SerializerMethodField()
    banner_url = serializers.SerializerMethodField()

    class Meta:
        model = RecruiterProfile
        fields = [
            'id', 'user', 'company_name', 'company_description',
            'company_website', 'company_location', 'company_logo',
            'company_banner', 'brand_color',
            'logo_url', 'banner_url', 'phone', 'position', 'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'user', 'logo_url', 'banner_url', 'created_at', 'updated_at']

    def get_logo_url(self, obj):
        if obj.company_logo:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.company_logo.url)
            return obj.company_logo.url
        return None

    def get_banner_url(self, obj):
        if obj.company_banner:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.company_banner.url)
            return obj.company_banner.url
        return None


class RecruiterProfileUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating recruiter profile."""
    first_name = serializers.CharField(source='user.first_name', required=False)
    last_name = serializers.CharField(source='user.last_name', required=False)

    class Meta:
        model = RecruiterProfile
        fields = [
            'first_name', 'last_name', 'company_name', 'company_description',
            'company_website', 'company_location', 'company_logo',
            'company_banner', 'brand_color',
            'phone', 'position',
        ]

    def validate_phone(self, value):
        return validate_indian_phone(value)

    def update(self, instance, validated_data):
        user_data = validated_data.pop('user', {})
        if user_data:
            for attr, value in user_data.items():
                setattr(instance.user, attr, value)
            instance.user.save()

        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        return instance

