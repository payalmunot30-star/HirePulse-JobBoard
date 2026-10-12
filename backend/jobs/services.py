import logging
from django.utils import timezone
from django.core.exceptions import ValidationError
from .models import Job

logger = logging.getLogger('jobs.services')


class JobService:
    """Domain service managing job vacancy workflows, validations, and status transitions."""

    @staticmethod
    def validate_salary_range(salary_min, salary_max):
        """
        Validate business constraints on salary bounds.
        Enforces positive numbers, reasonable upper limits (100 Cr INR), and min <= max.
        """
        MAX_SALARY_LIMIT = 1_000_000_000  # 100 Crore INR

        if salary_min is not None:
            if salary_min < 0:
                raise ValidationError({'salary_min': 'Minimum salary cannot be negative.'})
            if salary_min > MAX_SALARY_LIMIT:
                raise ValidationError({'salary_min': 'Minimum salary exceeds realistic ceiling limit.'})

        if salary_max is not None:
            if salary_max < 0:
                raise ValidationError({'salary_max': 'Maximum salary cannot be negative.'})
            if salary_max > MAX_SALARY_LIMIT:
                raise ValidationError({'salary_max': 'Maximum salary exceeds realistic ceiling limit.'})

        if salary_min is not None and salary_max is not None:
            if salary_min > salary_max:
                raise ValidationError({'salary_max': 'Maximum salary must be greater than or equal to minimum salary.'})

    @staticmethod
    def validate_closing_date(closing_date):
        """Ensure closing date is not set in the past."""
        if closing_date and closing_date < timezone.now().date():
            raise ValidationError({'closing_date': 'Job application closing date cannot be in the past.'})

    @staticmethod
    def create_job(recruiter_profile, validated_data):
        """Create a new job posting for the given recruiter."""
        salary_min = validated_data.get('salary_min')
        salary_max = validated_data.get('salary_max')
        closing_date = validated_data.get('closing_date')

        JobService.validate_salary_range(salary_min, salary_max)
        JobService.validate_closing_date(closing_date)

        job = Job.objects.create(
            recruiter=recruiter_profile,
            **validated_data
        )
        logger.info("Created job '%s' (ID: %s) for recruiter '%s'", job.title, job.id, recruiter_profile.company_name)
        return job

    @staticmethod
    def close_job(job):
        """Close an active job posting."""
        job.status = Job.Status.CLOSED
        job.save(update_fields=['status', 'updated_at'])
        logger.info("Closed job posting '%s' (ID: %s)", job.title, job.id)
        return job
