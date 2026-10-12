"""
Job posting model with full-text search support.
"""
from django.contrib.postgres.indexes import GinIndex
from django.contrib.postgres.search import SearchVectorField
from django.db import models

from accounts.models import RecruiterProfile


def format_inr(amount):
    """
    Format numeric value using the Indian Numbering System (Lakhs and Crores).
    e.g. 400000 -> "₹4,00,000", 600000 -> "₹6,00,000"
    """
    if amount is None or amount == '':
        return ''
    try:
        val = int(round(float(amount)))
    except (ValueError, TypeError):
        return str(amount)

    is_negative = val < 0
    s = str(abs(val))
    if len(s) <= 3:
        res = s
    else:
        last3 = s[-3:]
        remaining = s[:-3]
        groups = []
        while len(remaining) > 2:
            groups.insert(0, remaining[-2:])
            remaining = remaining[:-2]
        if remaining:
            groups.insert(0, remaining)
        res = f"{','.join(groups)},{last3}"

    return f"-₹{res}" if is_negative else f"₹{res}"


class Job(models.Model):
    """Job posting model."""

    class JobType(models.TextChoices):
        FULL_TIME = 'full-time', 'Full-time'
        PART_TIME = 'part-time', 'Part-time'
        REMOTE = 'remote', 'Remote'

    class ExperienceLevel(models.TextChoices):
        FRESHER = 'fresher', 'Fresher / Entry Level'
        EXP_0_2 = '0-2', '0–2 Years'
        EXP_2_5 = '2-5', '2–5 Years'
        EXP_5_8 = '5-8', '5–8 Years'
        EXP_8_PLUS = '8+', '8+ Years'

    class Status(models.TextChoices):
        ACTIVE = 'active', 'Active'
        CLOSED = 'closed', 'Closed'

    class Category(models.TextChoices):
        ENGINEERING = 'engineering', 'Engineering'
        DESIGN = 'design', 'Design'
        MARKETING = 'marketing', 'Marketing'
        SALES = 'sales', 'Sales'
        FINANCE = 'finance', 'Finance'
        HR = 'hr', 'Human Resources'
        OPERATIONS = 'operations', 'Operations'
        IT = 'it', 'Information Technology'
        PRODUCT = 'product', 'Product Management'
        DATA = 'data', 'Data Science'
        LEGAL = 'legal', 'Legal'
        CUSTOMER_SERVICE = 'customer-service', 'Customer Service'
        OTHER = 'other', 'Other'

    recruiter = models.ForeignKey(
        RecruiterProfile,
        on_delete=models.CASCADE,
        related_name='jobs',
    )
    title = models.CharField(max_length=255, db_index=True)
    description = models.TextField()
    skills_required = models.JSONField(
        default=list,
        blank=True,
        help_text='List of required skills',
    )
    category = models.CharField(
        max_length=50,
        choices=Category.choices,
        default=Category.OTHER,
        db_index=True,
    )
    location = models.CharField(max_length=255, db_index=True)
    salary_min = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        null=True,
        blank=True,
    )
    salary_max = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        null=True,
        blank=True,
    )
    experience_level = models.CharField(
        max_length=20,
        choices=ExperienceLevel.choices,
        default=ExperienceLevel.FRESHER,
        db_index=True,
    )
    job_type = models.CharField(
        max_length=20,
        choices=JobType.choices,
        default=JobType.FULL_TIME,
        db_index=True,
    )
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.ACTIVE,
        db_index=True,
    )
    closing_date = models.DateField(null=True, blank=True)
    search_vector = SearchVectorField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'job'
        verbose_name_plural = 'jobs'
        indexes = [
            GinIndex(fields=['search_vector']),
            models.Index(fields=['status', 'created_at']),
            models.Index(fields=['category', 'status']),
            models.Index(fields=['job_type', 'status']),
            models.Index(fields=['experience_level', 'status']),
        ]

    def clean(self):
        super().clean()
        from django.core.exceptions import ValidationError
        from django.utils import timezone

        if self.salary_min is not None and self.salary_min < 0:
            raise ValidationError({'salary_min': 'Minimum salary cannot be negative.'})
        if self.salary_max is not None and self.salary_max < 0:
            raise ValidationError({'salary_max': 'Maximum salary cannot be negative.'})
        if self.salary_min is not None and self.salary_max is not None and self.salary_min > self.salary_max:
            raise ValidationError({'salary_max': 'Maximum salary cannot be less than minimum salary.'})
        if self.closing_date and self.closing_date < timezone.now().date():
            raise ValidationError({'closing_date': 'Closing date cannot be set in the past.'})

    def __str__(self):
        return f"{self.title} at {self.recruiter.company_name}"

    @property
    def is_active(self):
        return self.status == self.Status.ACTIVE
    @property
    def salary_display(self):
        if self.salary_min is not None and self.salary_max is not None:
            return f"{format_inr(self.salary_min)} – {format_inr(self.salary_max)}"
        elif self.salary_min is not None:
            return f"From {format_inr(self.salary_min)}"
        elif self.salary_max is not None:
            return f"Up to {format_inr(self.salary_max)}"
        return "Not specified"


