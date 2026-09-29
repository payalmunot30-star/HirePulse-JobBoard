"""
Application model with status workflow and duplicate prevention.
"""
from django.db import models

from accounts.models import CandidateProfile
from jobs.models import Job


class Application(models.Model):
    """Job application model."""

    class Status(models.TextChoices):
        APPLIED = 'applied', 'Applied'
        SHORTLISTED = 'shortlisted', 'Shortlisted'
        INTERVIEW = 'interview', 'Interview'
        REJECTED = 'rejected', 'Rejected'
        HIRED = 'hired', 'Hired'

    candidate = models.ForeignKey(
        CandidateProfile,
        on_delete=models.CASCADE,
        related_name='applications',
    )
    job = models.ForeignKey(
        Job,
        on_delete=models.CASCADE,
        related_name='applications',
    )
    resume = models.FileField(
        upload_to='resumes/applications/',
        blank=True,
        null=True,
    )
    cover_letter = models.TextField(blank=True, default='')
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.APPLIED,
        db_index=True,
    )
    applied_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-applied_at']
        verbose_name = 'application'
        verbose_name_plural = 'applications'
        # Prevent duplicate applications
        constraints = [
            models.UniqueConstraint(
                fields=['candidate', 'job'],
                name='unique_candidate_job_application',
            ),
        ]
        indexes = [
            models.Index(fields=['status', 'applied_at']),
            models.Index(fields=['candidate', 'status']),
            models.Index(fields=['job', 'status']),
        ]

    def __str__(self):
        return f"{self.candidate.user.get_full_name()} → {self.job.title} ({self.status})"
