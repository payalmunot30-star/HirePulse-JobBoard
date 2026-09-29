"""
Serializers for job postings.
"""
from rest_framework import serializers
from accounts.serializers import RecruiterProfileSerializer
from .models import Job


def serialize_company_profile(recruiter, request=None):
    """Format recruiter company profile branding for job responses."""
    if not recruiter:
        return None
    logo_url = None
    if recruiter.company_logo:
        logo_url = request.build_absolute_uri(recruiter.company_logo.url) if request else recruiter.company_logo.url
    banner_url = None
    if recruiter.company_banner:
        banner_url = request.build_absolute_uri(recruiter.company_banner.url) if request else recruiter.company_banner.url

    return {
        'id': recruiter.id,
        'name': recruiter.company_name or 'Hiring Company',
        'logo': logo_url,
        'banner': banner_url,
        'location': recruiter.company_location or '',
        'website': recruiter.company_website or '',
        'description': recruiter.company_description or '',
        'brand_color': getattr(recruiter, 'brand_color', '') or '',
    }


class JobListSerializer(serializers.ModelSerializer):
    """Serializer for job listings (compact)."""
    recruiter_name = serializers.CharField(
        source='recruiter.company_name', read_only=True,
    )
    company_name = serializers.CharField(
        source='recruiter.company_name', read_only=True,
    )
    recruiter_logo = serializers.SerializerMethodField()
    company = serializers.SerializerMethodField()
    application_count = serializers.IntegerField(read_only=True, default=0)
    salary_display = serializers.CharField(read_only=True)
    job_type_display = serializers.CharField(source='get_job_type_display', read_only=True)
    experience_level_display = serializers.CharField(source='get_experience_level_display', read_only=True)
    category_display = serializers.CharField(source='get_category_display', read_only=True)

    class Meta:
        model = Job
        fields = [
            'id', 'title', 'description', 'company',
            'recruiter_name', 'company_name', 'recruiter_logo',
            'category', 'category_display', 'location',
            'salary_min', 'salary_max', 'salary_display',
            'experience_level', 'experience_level_display',
            'job_type', 'job_type_display',
            'status', 'skills_required', 'application_count',
            'closing_date', 'created_at',
        ]

    def get_recruiter_logo(self, obj):
        if obj.recruiter and obj.recruiter.company_logo:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.recruiter.company_logo.url)
            return obj.recruiter.company_logo.url
        return None

    def get_company(self, obj):
        return serialize_company_profile(obj.recruiter, self.context.get('request'))


class JobDetailSerializer(serializers.ModelSerializer):
    """Serializer for full job details."""
    recruiter = RecruiterProfileSerializer(read_only=True)
    company = serializers.SerializerMethodField()
    company_name = serializers.CharField(source='recruiter.company_name', read_only=True)
    application_count = serializers.IntegerField(read_only=True, default=0)
    salary_display = serializers.CharField(read_only=True)
    job_type_display = serializers.CharField(source='get_job_type_display', read_only=True)
    experience_level_display = serializers.CharField(source='get_experience_level_display', read_only=True)
    category_display = serializers.CharField(source='get_category_display', read_only=True)
    has_applied = serializers.BooleanField(read_only=True, default=False)

    class Meta:
        model = Job
        fields = [
            'id', 'title', 'description', 'recruiter', 'company', 'company_name',
            'category', 'category_display', 'location',
            'salary_min', 'salary_max', 'salary_display',
            'experience_level', 'experience_level_display',
            'job_type', 'job_type_display',
            'status', 'skills_required', 'application_count',
            'has_applied', 'closing_date', 'created_at', 'updated_at',
        ]

    def get_company(self, obj):
        return serialize_company_profile(obj.recruiter, self.context.get('request'))


class JobCreateUpdateSerializer(serializers.ModelSerializer):
    """Serializer for creating/updating jobs."""

    class Meta:
        model = Job
        fields = [
            'id', 'title', 'description', 'category', 'location',
            'salary_min', 'salary_max', 'experience_level',
            'job_type', 'skills_required', 'closing_date',
            'status', 'created_at',
        ]
        read_only_fields = ['id', 'created_at']

    def validate_salary_min(self, value):
        if value is not None and value < 0:
            raise serializers.ValidationError('Minimum salary cannot be negative.')
        return value

    def validate_salary_max(self, value):
        if value is not None and value < 0:
            raise serializers.ValidationError('Maximum salary cannot be negative.')
        return value

    def validate(self, attrs):
        salary_min = attrs.get('salary_min')
        salary_max = attrs.get('salary_max')
        if salary_min is not None and salary_min < 0:
            raise serializers.ValidationError({
                'salary_min': 'Minimum salary cannot be negative.',
            })
        if salary_max is not None and salary_max < 0:
            raise serializers.ValidationError({
                'salary_max': 'Maximum salary cannot be negative.',
            })
        if salary_min is not None and salary_max is not None and salary_min > salary_max:
            raise serializers.ValidationError({
                'salary_max': 'Maximum salary must be greater than or equal to minimum salary.',
            })
        return attrs

    def create(self, validated_data):
        request = self.context['request']
        validated_data['recruiter'] = request.user.recruiter_profile
        return super().create(validated_data)
