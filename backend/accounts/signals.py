"""
Signals for automatic profile creation on user registration.
"""
from contextlib import contextmanager
from contextvars import ContextVar
from django.db.models.signals import post_save
from django.dispatch import receiver

from .models import User, CandidateProfile, RecruiterProfile

_profile_creation_disabled = ContextVar('profile_creation_disabled', default=False)


@contextmanager
def disable_profile_signal():
    """Context manager to temporarily suppress automatic profile creation signal."""
    token = _profile_creation_disabled.set(True)
    try:
        yield
    finally:
        _profile_creation_disabled.reset(token)


@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    """Automatically create a role-specific profile when a new user is created."""
    if _profile_creation_disabled.get() or getattr(instance, '_skip_profile_creation', False):
        return

    if created:
        if instance.role == User.Role.CANDIDATE:
            CandidateProfile.objects.get_or_create(user=instance)
        elif instance.role == User.Role.RECRUITER:
            RecruiterProfile.objects.get_or_create(user=instance)

