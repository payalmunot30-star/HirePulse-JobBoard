"""
Tests for dashboard endpoints.
"""
from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status

from accounts.models import RecruiterProfile, CandidateProfile
from jobs.models import Job

User = get_user_model()


class DashboardTests(TestCase):
    def setUp(self):
        self.client = APIClient()

        self.admin = User.objects.create_superuser(
            email='admin@portal.com', password='Password123!', role=User.Role.ADMIN
        )
        self.recruiter_user = User.objects.create_user(
            email='rec@portal.com', password='Password123!', role=User.Role.RECRUITER
        )
        self.recruiter_profile, _ = RecruiterProfile.objects.get_or_create(
            user=self.recruiter_user, defaults={'company_name': 'Meta'}
        )
        self.recruiter_profile.company_name = 'Meta'
        self.recruiter_profile.save()

        Job.objects.create(
            recruiter=self.recruiter_profile,
            title='Backend Engineer',
            location='Remote',
            status=Job.Status.ACTIVE,
        )

    def test_recruiter_dashboard_stats(self):
        self.client.force_authenticate(user=self.recruiter_user)
        response = self.client.get('/api/dashboard/recruiter/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['overview']['total_jobs'], 1)

    def test_admin_dashboard_stats(self):
        self.client.force_authenticate(user=self.admin)
        response = self.client.get('/api/dashboard/admin/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('overview', response.data)
        self.assertEqual(response.data['overview']['total_users'], 2)
