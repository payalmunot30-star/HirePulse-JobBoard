"""
Serializers for job applications.
"""
from rest_framework import serializers

from accounts.serializers import CandidateProfileSerializer, UserSerializer
from accounts.validators import validate_pdf_resume
from jobs.serializers import JobListSerializer
from jobs.models import Job
from notifications.services import send_application_status_notification
from .models import Application


class ApplicationCreateSerializer(serializers.ModelSerializer):
    """Serializer for submitting a job application."""

    job = serializers.PrimaryKeyRelatedField(queryset=Job.objects.all())

    class Meta:
        model = Application
        fields = ['id', 'job', 'resume', 'cover_letter', 'status', 'applied_at']
        read_only_fields = ['id', 'status', 'applied_at']

    def validate_job(self, value):
        """Ensure job is active."""
        if value.status != Job.Status.ACTIVE:
            raise serializers.ValidationError("Cannot apply to a closed or inactive job.")
        return value

    def validate(self, attrs):
        request = self.context.get('request')
        if not request or not hasattr(request.user, 'candidate_profile'):
            raise serializers.ValidationError("Only users with a candidate profile can submit applications.")

        candidate = request.user.candidate_profile
        job = attrs.get('job')

        # Check duplicate application
        if Application.objects.filter(candidate=candidate, job=job).exists():
            raise serializers.ValidationError({"detail": "You have already applied to this job posting."})

        # Validate resume file: must be PDF, <5MB, valid MIME type
        resume = attrs.get('resume')
        if not resume and candidate.resume:
            attrs['resume'] = candidate.resume
        elif not resume and not candidate.resume:
            raise serializers.ValidationError({"resume": "Please upload a resume or add one to your candidate profile."})

        if resume and hasattr(resume, 'size'):
            try:
                validate_pdf_resume(resume)
            except serializers.ValidationError as err:
                msg = err.detail[0] if isinstance(err.detail, list) else str(err.detail)
                raise serializers.ValidationError({"resume": msg})

        attrs['candidate'] = candidate
        return attrs


class ApplicationListSerializer(serializers.ModelSerializer):
    """Serializer for listing applications with related job details."""

    job = JobListSerializer(read_only=True)
    candidate_name = serializers.CharField(source='candidate.user.get_full_name', read_only=True)
    candidate_email = serializers.CharField(source='candidate.user.email', read_only=True)
    resume_url = serializers.SerializerMethodField()

    class Meta:
        model = Application
        fields = [
            'id',
            'job',
            'candidate_name',
            'candidate_email',
            'resume',
            'resume_url',
            'cover_letter',
            'status',
            'applied_at',
            'updated_at',
        ]

    def get_resume_url(self, obj):
        if obj.resume:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.resume.url)
            return obj.resume.url
        return None


class ApplicationDetailSerializer(serializers.ModelSerializer):
    """Detailed serializer for application review."""

    job = JobListSerializer(read_only=True)
    candidate = CandidateProfileSerializer(read_only=True)
    resume_url = serializers.SerializerMethodField()

    class Meta:
        model = Application
        fields = [
            'id',
            'job',
            'candidate',
            'resume',
            'resume_url',
            'cover_letter',
            'status',
            'applied_at',
            'updated_at',
        ]

    def get_resume_url(self, obj):
        if obj.resume:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.resume.url)
            return obj.resume.url
        return None


class ApplicationStatusUpdateSerializer(serializers.ModelSerializer):
    """Serializer for recruiters to update application status adhering to stage workflow rules."""

    class Meta:
        model = Application
        fields = ['status']

    def validate_status(self, value):
        instance = self.instance
        if instance:
            from .services import ApplicationService
            ApplicationService.validate_transition(instance.status, value)
        return value

    def update(self, instance, validated_data):
        from .services import ApplicationService
        request = self.context.get('request')
        new_status = validated_data.get('status', instance.status)
        actor = request.user if request else instance.job.recruiter.user
        return ApplicationService.update_status(instance, new_status, actor)
