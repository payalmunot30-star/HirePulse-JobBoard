"""
Signals for automatic profile creation on user registration.
"""
from django.db.models.signals import post_save
from django.dispatch import receiver

from .models import User, CandidateProfile, RecruiterProfile


@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    """Automatically create a role-specific profile when a new user is created."""
    if created:
        if instance.role == User.Role.CANDIDATE:
            CandidateProfile.objects.get_or_create(user=instance)
        elif instance.role == User.Role.RECRUITER:
            RecruiterProfile.objects.get_or_create(user=instance)
