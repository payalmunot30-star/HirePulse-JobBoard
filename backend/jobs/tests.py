"""
Tests for Job model, CRUD operations, permissions, and search/filtering.
"""
from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status

from accounts.models import RecruiterProfile, CandidateProfile
from jobs.models import Job

User = get_user_model()


class JobTests(TestCase):
    def setUp(self):
        self.client = APIClient()

        # Create Recruiter
        self.recruiter_user = User.objects.create_user(
            email='recruiter@company.com',
            password='Password123!',
            first_name='Recruiter',
            last_name='One',
            role=User.Role.RECRUITER,
        )
        self.recruiter_profile, _ = RecruiterProfile.objects.get_or_create(
            user=self.recruiter_user,
            defaults={'company_name': 'Acme Corp'},
        )
        self.recruiter_profile.company_name = 'Acme Corp'
        self.recruiter_profile.save()

        # Create Candidate
        self.candidate_user = User.objects.create_user(
            email='candidate@dev.com',
            password='Password123!',
            first_name='Dev',
            last_name='Two',
            role=User.Role.CANDIDATE,
        )
        self.candidate_profile, _ = CandidateProfile.objects.get_or_create(user=self.candidate_user)

    def test_recruiter_can_create_job(self):
        self.client.force_authenticate(user=self.recruiter_user)
        payload = {
            'title': 'Senior Python Developer',
            'description': 'Building scalable web applications.',
            'category': 'engineering',
            'location': 'Remote',
            'salary_min': 100000,
            'salary_max': 140000,
            'experience_level': '5-8',
            'job_type': 'remote',
            'skills_required': ['Python', 'Django', 'PostgreSQL'],
        }
        response = self.client.post('/api/jobs/', payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Job.objects.count(), 1)
        job = Job.objects.first()
        self.assertEqual(job.title, 'Senior Python Developer')

    def test_candidate_cannot_create_job(self):
        self.client.force_authenticate(user=self.candidate_user)
        payload = {
            'title': 'Unauthorized Job',
            'description': 'Test',
            'location': 'New York',
        }
        response = self.client.post('/api/jobs/', payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_close_job(self):
        job = Job.objects.create(
            recruiter=self.recruiter_profile,
            title='Frontend Lead',
            description='React Lead Position',
            location='San Francisco',
            status=Job.Status.ACTIVE,
        )
        self.client.force_authenticate(user=self.recruiter_user)
        response = self.client.patch(f'/api/jobs/{job.id}/close/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        job.refresh_from_db()
        self.assertEqual(job.status, Job.Status.CLOSED)
