import logging
from django.core.exceptions import ValidationError
from django.db import transaction
from .models import Application
from jobs.models import Job
from notifications.services import send_application_status_notification

logger = logging.getLogger('applications.services')


class ApplicationService:
    """
    Domain service for candidate job applications and recruitment status workflows.
    Enforces business logic, duplicate prevention, and state machine transition rules.
    """

    ALLOWED_TRANSITIONS = {
        Application.Status.APPLIED: [Application.Status.SHORTLISTED, Application.Status.REJECTED],
        Application.Status.SHORTLISTED: [Application.Status.INTERVIEW, Application.Status.REJECTED],
        Application.Status.INTERVIEW: [Application.Status.HIRED, Application.Status.REJECTED],
        Application.Status.HIRED: [],  # Terminal state
        Application.Status.REJECTED: [Application.Status.SHORTLISTED],  # Allow reconsideration to shortlisted only
    }

    @staticmethod
    def validate_transition(current_status: str, next_status: str) -> None:
        """Enforce strict status workflow transitions to maintain audit trail integrity."""
        if current_status == next_status:
            return

        valid_next = ApplicationService.ALLOWED_TRANSITIONS.get(current_status, [])
        if next_status not in valid_next:
            raise ValidationError({
                'status': f"Invalid status transition from '{current_status}' to '{next_status}'. "
                          f"Allowed next states: {', '.join(valid_next) if valid_next else 'None (Terminal state)'}."
            })

    @staticmethod
    @transaction.atomic
    def update_status(application: Application, new_status: str, actor_user) -> Application:
        """
        Transition application to a new recruitment stage and notify candidate.
        """
        if not actor_user.is_admin and application.job.recruiter.user != actor_user:
            raise ValidationError({'detail': 'You do not have permission to manage this application.'})

        ApplicationService.validate_transition(application.status, new_status)

        old_status = application.status
        application.status = new_status
        application.save(update_fields=['status', 'updated_at'])

        logger.info(
            "Application %s (Candidate: %s, Job: %s) transitioned from '%s' to '%s' by %s",
            application.id,
            application.candidate.user.email,
            application.job.title,
            old_status,
            new_status,
            actor_user.email,
        )

        # Dispatch candidate notification
        try:
            send_application_status_notification(application)
        except Exception as err:
            logger.warning("Failed to dispatch status notification for application %s: %s", application.id, err)

        return application
