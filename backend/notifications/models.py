"""
Notification model for user updates and system alerts.
"""
from django.db import models
from django.conf import settings


class Notification(models.Model):
    """User notification model."""

    class NotificationType(models.TextChoices):
        STATUS_CHANGE = 'status_change', 'Status Change'
        APPLICATION_RECEIVED = 'application_received', 'Application Received'
        JOB_ALERT = 'job_alert', 'Job Alert'
        SYSTEM = 'system', 'System Notification'

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='notifications',
    )
    application = models.ForeignKey(
        'applications.Application',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='notifications',
    )
    title = models.CharField(max_length=255)
    message = models.TextField()
    notification_type = models.CharField(
        max_length=30,
        choices=NotificationType.choices,
        default=NotificationType.STATUS_CHANGE,
    )
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'notification'
        verbose_name_plural = 'notifications'
        indexes = [
            models.Index(fields=['user', 'is_read']),
            models.Index(fields=['created_at']),
        ]

    def __str__(self):
        return f"Notification for {self.user.email}: {self.title}"
