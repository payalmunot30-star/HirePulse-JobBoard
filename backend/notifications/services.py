"""
Notification services for creating notifications and sending automated emails.
"""
import logging
from django.core.mail import send_mail
from django.conf import settings
from .models import Notification

logger = logging.getLogger(__name__)


def send_application_status_notification(application, old_status, new_status):
    """
    Creates an in-app notification and sends an email notification to the candidate
    when their application status is updated by a recruiter.
    """
    candidate_user = application.candidate.user
    job_title = application.job.title
    company_name = application.job.recruiter.company_name or "the recruiting team"
    status_display = application.get_status_display()

    title = f"Application Status Updated: {job_title}"
    message = (
        f"Your application for '{job_title}' at {company_name} "
        f"has been updated to '{status_display}'."
    )

    # 1. Create In-App Notification
    notification = Notification.objects.create(
        user=candidate_user,
        application=application,
        title=title,
        message=message,
        notification_type=Notification.NotificationType.STATUS_CHANGE,
    )

    # 2. Send Email Notification
    subject = f"Update on your application for {job_title} at {company_name}"
    email_body = (
        f"Dear {candidate_user.get_full_name()},\n\n"
        f"We are writing to inform you that your job application status for the position of "
        f"'{job_title}' at {company_name} has been updated to: {status_display}.\n\n"
        f"Current Status: {status_display.upper()}\n\n"
        f"Log in to your portal account to view further details and track your application.\n\n"
        f"Best regards,\n"
        f"{company_name} Recruitment Team"
    )

    try:
        send_mail(
            subject=subject,
            message=email_body,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[candidate_user.email],
            fail_silently=True,
        )
        logger.info(f"Status update email sent to {candidate_user.email} for application {application.id}")
    except Exception as e:
        logger.error(f"Failed to send email notification to {candidate_user.email}: {e}")

    return notification
