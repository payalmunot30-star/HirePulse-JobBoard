"""
Tests for Application creation, duplicate prevention, and status update notifications.
"""
from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status
from django.core.files.uploadedfile import SimpleUploadedFile

from accounts.models import RecruiterProfile, CandidateProfile
from jobs.models import Job
from applications.models import Application
from notifications.models import Notification

User = get_user_model()


class ApplicationTests(TestCase):
    def setUp(self):
        self.client = APIClient()

        # Recruiter
        self.recruiter_user = User.objects.create_user(
            email='rec@company.com', password='Password123!', role=User.Role.RECRUITER
        )
        self.recruiter_profile, _ = RecruiterProfile.objects.get_or_create(
            user=self.recruiter_user, defaults={'company_name': 'Tech Solutions'}
        )
        self.recruiter_profile.company_name = 'Tech Solutions'
        self.recruiter_profile.save()

        # Candidate
        self.candidate_user = User.objects.create_user(
            email='cand@email.com', password='Password123!', role=User.Role.CANDIDATE
        )
        self.candidate_profile, _ = CandidateProfile.objects.get_or_create(
            user=self.candidate_user, defaults={'phone': '1234567890'}
        )
        self.candidate_profile.phone = '1234567890'
        self.candidate_profile.save()

        # Active Job
        self.job = Job.objects.create(
            recruiter=self.recruiter_profile,
            title='Full Stack Developer',
            description='Django and React dev needed.',
            location='Remote',
            status=Job.Status.ACTIVE,
        )

        # Resume file (must have %PDF magic header)
        self.resume_file = SimpleUploadedFile(
            "resume.pdf", b"%PDF-1.4 test resume content for application", content_type="application/pdf"
        )

    def test_apply_for_job_success(self):
        self.client.force_authenticate(user=self.candidate_user)
        payload = {
            'job': self.job.id,
            'cover_letter': 'Excited to join!',
            'resume': self.resume_file,
        }
        response = self.client.post('/api/applications/', payload, format='multipart')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Application.objects.count(), 1)

    def test_prevent_duplicate_applications(self):
        Application.objects.create(
            candidate=self.candidate_profile,
            job=self.job,
            cover_letter='First application',
        )
        self.client.force_authenticate(user=self.candidate_user)
        payload = {
            'job': self.job.id,
            'cover_letter': 'Second attempt',
            'resume': self.resume_file,
        }
        response = self.client.post('/api/applications/', payload, format='multipart')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_status_update_creates_notification(self):
        app = Application.objects.create(
            candidate=self.candidate_profile,
            job=self.job,
            status=Application.Status.APPLIED,
        )
        self.client.force_authenticate(user=self.recruiter_user)
        response = self.client.patch(
            f'/api/applications/{app.id}/status/',
            {'status': 'shortlisted'},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        app.refresh_from_db()
        self.assertEqual(app.status, Application.Status.SHORTLISTED)
        self.assertTrue(
            Notification.objects.filter(
                user=self.candidate_user, application=app
            ).exists()
        )
