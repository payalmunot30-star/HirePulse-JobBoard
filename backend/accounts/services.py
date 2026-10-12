import logging
from django.db import transaction
from django.core.exceptions import ValidationError
from .models import User, CandidateProfile, RecruiterProfile
from .signals import disable_profile_signal

logger = logging.getLogger('accounts.services')


class AccountService:
    """Domain service managing user lifecycle, role-based registration, and profile synchronization."""

    @staticmethod
    @transaction.atomic
    def register_user(validated_data: dict) -> User:
        """
        Register a new user account with role-specific profile configuration.
        Ensures atomic creation and profile initialization.
        """
        role = validated_data.get('role', User.Role.CANDIDATE)
        if role not in (User.Role.CANDIDATE, User.Role.RECRUITER):
            raise ValidationError({'role': 'Public registration is restricted to Candidate and Recruiter accounts.'})

        # Separate user credentials from profile attributes
        email = (validated_data.get('email') or '').lower().strip()
        first_name = (validated_data.get('first_name') or '').strip()
        last_name = (validated_data.get('last_name') or '').strip()
        password = validated_data.get('password')

        phone = (validated_data.get('phone') or '').strip()
        company_name = (validated_data.get('company_name') or '').strip()
        company_website = (validated_data.get('company_website') or '').strip()
        position = (validated_data.get('position') or '').strip()
        company_location = (validated_data.get('company_location') or '').strip()

        with disable_profile_signal():
            user = User.objects.create_user(
                email=email,
                password=password,
                first_name=first_name,
                last_name=last_name,
                role=role,
            )

        if role == User.Role.RECRUITER:
            recruiter_profile = RecruiterProfile.objects.create(
                user=user,
                company_name=company_name or f"{user.get_full_name()}'s Company",
                company_website=company_website,
                position=position,
                company_location=company_location,
                phone=phone,
            )
            logger.info("Successfully registered Recruiter %s (%s) for company %s", user.email, user.id, recruiter_profile.company_name)

        elif role == User.Role.CANDIDATE:
            candidate_profile = CandidateProfile.objects.create(
                user=user,
                phone=phone,
            )
            logger.info("Successfully registered Candidate %s (%s)", user.email, user.id)

        return user

