"""
User, CandidateProfile, and RecruiterProfile models.
"""
from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin
from django.db import models

from .managers import UserManager


class User(AbstractBaseUser, PermissionsMixin):
    """Custom user model using email as the primary identifier."""

    class Role(models.TextChoices):
        ADMIN = 'admin', 'Admin'
        RECRUITER = 'recruiter', 'Recruiter'
        CANDIDATE = 'candidate', 'Candidate'

    email = models.EmailField(
        unique=True,
        max_length=255,
        db_index=True,
        error_messages={'unique': 'A user with this email already exists.'},
    )
    first_name = models.CharField(max_length=150)
    last_name = models.CharField(max_length=150)
    role = models.CharField(
        max_length=20,
        choices=Role.choices,
        default=Role.CANDIDATE,
        db_index=True,
    )
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    objects = UserManager()

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['first_name', 'last_name']

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'user'
        verbose_name_plural = 'users'

    def __str__(self):
        return f"{self.get_full_name()} ({self.email})"

    def get_full_name(self):
        return f"{self.first_name} {self.last_name}".strip()

    def get_short_name(self):
        return self.first_name

    @property
    def is_admin(self):
        return self.role == self.Role.ADMIN

    @property
    def is_recruiter(self):
        return self.role == self.Role.RECRUITER

    @property
    def is_candidate(self):
        return self.role == self.Role.CANDIDATE


class CandidateProfile(models.Model):
    """Extended profile for candidates."""

    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name='candidate_profile',
    )
    phone = models.CharField(max_length=20, blank=True, default='')
    bio = models.TextField(blank=True, default='')
    profile_picture = models.ImageField(
        upload_to='profile_pictures/candidates/',
        blank=True,
        null=True,
    )
    skills = models.JSONField(default=list, blank=True)
    education = models.JSONField(default=list, blank=True)
    experience = models.JSONField(default=list, blank=True)
    resume = models.FileField(
        upload_to='resumes/candidates/',
        blank=True,
        null=True,
    )
    location = models.CharField(max_length=255, blank=True, default='')
    linkedin_url = models.URLField(max_length=500, blank=True, default='')
    portfolio_url = models.URLField(max_length=500, blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'candidate profile'
        verbose_name_plural = 'candidate profiles'

    def __str__(self):
        return f"Candidate: {self.user.get_full_name()}"


class RecruiterProfile(models.Model):
    """Extended profile for recruiters with company information."""

    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name='recruiter_profile',
    )
    company_name = models.CharField(max_length=255, blank=True, default='')
    company_description = models.TextField(blank=True, default='')
    company_website = models.URLField(max_length=500, blank=True, default='')
    company_location = models.CharField(max_length=255, blank=True, default='')
    company_logo = models.ImageField(
        upload_to='logos/',
        blank=True,
        null=True,
    )
    company_banner = models.ImageField(
        upload_to='banners/',
        blank=True,
        null=True,
    )
    brand_color = models.CharField(
        max_length=50,
        blank=True,
        default='',
        help_text='Company brand theme hex color, e.g. #2563EB',
    )
    phone = models.CharField(max_length=20, blank=True, default='')
    position = models.CharField(
        max_length=255,
        blank=True,
        default='',
        help_text='Recruiter job title/position within the company',
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'recruiter profile'
        verbose_name_plural = 'recruiter profiles'

    def __str__(self):
        return f"Recruiter: {self.user.get_full_name()} @ {self.company_name}"
