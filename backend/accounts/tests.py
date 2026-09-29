"""
Tests for user authentication, role permissions, public registration security,
and admin-only recruiter management.
"""
from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status

from accounts.models import CandidateProfile, RecruiterProfile

User = get_user_model()


class AuthenticationTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.candidate_data = {
            'email': 'candidate@test.com',
            'password': 'Password123!',
            'password_confirm': 'Password123!',
            'first_name': 'Jane',
            'last_name': 'Candidate',
            'role': 'candidate',
        }
        self.admin_user = User.objects.create_superuser(
            email='admin@test.com',
            password='Password123!',
            first_name='Admin',
            last_name='User',
            role=User.Role.ADMIN,
        )
        self.regular_recruiter = User.objects.create_user(
            email='existing.recruiter@test.com',
            password='Password123!',
            first_name='Existing',
            last_name='Recruiter',
            role=User.Role.RECRUITER,
        )
        self.regular_candidate = User.objects.create_user(
            email='existing.candidate@test.com',
            password='Password123!',
            first_name='Existing',
            last_name='Candidate',
            role=User.Role.CANDIDATE,
        )

    def test_candidate_registration(self):
        """Public registration can successfully create candidate accounts."""
        response = self.client.post('/api/auth/register/', self.candidate_data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(User.objects.filter(email='candidate@test.com').exists())
        user = User.objects.get(email='candidate@test.com')
        self.assertEqual(user.role, User.Role.CANDIDATE)
        self.assertTrue(hasattr(user, 'candidate_profile'))

    def test_public_registration_rejects_recruiter_role(self):
        """Public registration endpoint must reject attempts to create recruiter accounts."""
        payload = {
            'email': 'hacker.recruiter@test.com',
            'password': 'Password123!',
            'password_confirm': 'Password123!',
            'first_name': 'Sneaky',
            'last_name': 'Recruiter',
            'role': 'recruiter',
        }
        response = self.client.post('/api/auth/register/', payload)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(User.objects.filter(email='hacker.recruiter@test.com').exists())

    def test_public_registration_rejects_admin_role(self):
        """Public registration endpoint must reject attempts to create admin accounts."""
        payload = {
            'email': 'hacker.admin@test.com',
            'password': 'Password123!',
            'password_confirm': 'Password123!',
            'first_name': 'Sneaky',
            'last_name': 'Admin',
            'role': 'admin',
        }
        response = self.client.post('/api/auth/register/', payload)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(User.objects.filter(email='hacker.admin@test.com').exists())

    def test_login_success(self):
        login_data = {'email': 'existing.candidate@test.com', 'password': 'Password123!'}
        response = self.client.post('/api/auth/login/', login_data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('tokens', response.data)
        self.assertIn('access', response.data['tokens'])
        self.assertIn('refresh', response.data['tokens'])

    def test_admin_can_create_recruiter(self):
        """Authenticated Admin can create recruiter accounts via admin endpoint."""
        self.client.force_authenticate(user=self.admin_user)
        payload = {
            'full_name': 'Sarah Connor',
            'email': 'sarah.connor@cyberdyne.com',
            'company_name': 'Cyberdyne Systems',
            'password': 'Password123!',
            'password_confirm': 'Password123!',
        }
        response = self.client.post('/api/users/recruiters/', payload)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['email'], 'sarah.connor@cyberdyne.com')
        self.assertEqual(response.data['role'], 'recruiter')
        self.assertNotIn('password', response.data)

        # Check DB state
        recruiter = User.objects.get(email='sarah.connor@cyberdyne.com')
        self.assertEqual(recruiter.role, User.Role.RECRUITER)
        self.assertEqual(recruiter.first_name, 'Sarah')
        self.assertEqual(recruiter.last_name, 'Connor')
        self.assertTrue(recruiter.check_password('Password123!'))
        self.assertTrue(hasattr(recruiter, 'recruiter_profile'))
        self.assertEqual(recruiter.recruiter_profile.company_name, 'Cyberdyne Systems')

    def test_admin_can_list_recruiters(self):
        """Admin can list existing recruiters."""
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.get('/api/users/recruiters/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        emails = [r['email'] for r in (response.data.get('results') or response.data)]
        self.assertIn('existing.recruiter@test.com', emails)

    def test_candidate_cannot_create_recruiter(self):
        """Candidate is forbidden from creating recruiters."""
        self.client.force_authenticate(user=self.regular_candidate)
        payload = {
            'full_name': 'Unauthorized Recruiter',
            'email': 'unauth@test.com',
            'password': 'Password123!',
            'password_confirm': 'Password123!',
        }
        response = self.client.post('/api/users/recruiters/', payload)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertFalse(User.objects.filter(email='unauth@test.com').exists())

    def test_recruiter_cannot_create_recruiter(self):
        """Recruiter is forbidden from creating other recruiters."""
        self.client.force_authenticate(user=self.regular_recruiter)
        payload = {
            'full_name': 'Unauthorized Recruiter',
            'email': 'unauth2@test.com',
            'password': 'Password123!',
            'password_confirm': 'Password123!',
        }
        response = self.client.post('/api/users/recruiters/', payload)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertFalse(User.objects.filter(email='unauth2@test.com').exists())

    def test_unauthenticated_cannot_create_recruiter(self):
        """Unauthenticated request to create recruiter is rejected."""
        payload = {
            'full_name': 'Anon Recruiter',
            'email': 'anon@test.com',
            'password': 'Password123!',
            'password_confirm': 'Password123!',
        }
        response = self.client.post('/api/users/recruiters/', payload)
        self.assertIn(response.status_code, (status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN))
        self.assertFalse(User.objects.filter(email='anon@test.com').exists())

    def test_newly_created_recruiter_can_login(self):
        """Recruiter created by admin can log in and access system."""
        self.client.force_authenticate(user=self.admin_user)
        payload = {
            'full_name': 'Alice Recruiter',
            'email': 'alice.recruiter@test.com',
            'company_name': 'Global Tech',
            'password': 'Password123!',
            'password_confirm': 'Password123!',
        }
        response = self.client.post('/api/users/recruiters/', payload)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        # Log in as newly created recruiter
        self.client.logout()
        login_res = self.client.post('/api/auth/login/', {
            'email': 'alice.recruiter@test.com',
            'password': 'Password123!',
        })
        self.assertEqual(login_res.status_code, status.HTTP_200_OK)
        self.assertEqual(login_res.data['user']['role'], 'recruiter')
        self.assertIn('access', login_res.data['tokens'])

    def test_duplicate_recruiter_email_rejected(self):
        """Admin cannot create recruiter with an email that already exists."""
        self.client.force_authenticate(user=self.admin_user)
        payload = {
            'full_name': 'Duplicate Email',
            'email': 'existing.recruiter@test.com',
            'password': 'Password123!',
            'password_confirm': 'Password123!',
        }
        response = self.client.post('/api/users/recruiters/', payload)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_password_mismatch_rejected(self):
        """Admin creation rejects mismatched passwords."""
        self.client.force_authenticate(user=self.admin_user)
        payload = {
            'full_name': 'Mismatch Password',
            'email': 'mismatch@test.com',
            'password': 'Password123!',
            'password_confirm': 'DifferentPassword123!',
        }
        response = self.client.post('/api/users/recruiters/', payload)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_admin_cannot_change_user_role(self):
        """User roles cannot be modified after account creation."""
        self.client.force_authenticate(user=self.admin_user)
        target_user = User.objects.create_user(
            email='target.candidate@test.com',
            password='Password123!',
            role=User.Role.CANDIDATE,
        )
        response = self.client.patch(f'/api/users/{target_user.id}/', {'role': 'recruiter'})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        target_user.refresh_from_db()
        self.assertEqual(target_user.role, User.Role.CANDIDATE)

    def test_admin_can_delete_user(self):
        """Admin can permanently delete a user account from backend."""
        self.client.force_authenticate(user=self.admin_user)
        user_to_delete = User.objects.create_user(
            email='to.delete@test.com',
            password='Password123!',
            role=User.Role.CANDIDATE,
            is_active=False,
        )
        user_id = user_to_delete.id
        response = self.client.delete(f'/api/users/{user_id}/')
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(User.objects.filter(id=user_id).exists())

    def test_admin_cannot_delete_self(self):
        """Admin cannot delete their own account."""
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.delete(f'/api/users/{self.admin_user.id}/')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertTrue(User.objects.filter(id=self.admin_user.id).exists())

    def test_non_admin_cannot_delete_user(self):
        """Candidate or recruiter cannot delete user accounts."""
        self.client.force_authenticate(user=self.regular_candidate)
        response = self.client.delete(f'/api/users/{self.regular_recruiter.id}/')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_admin_cannot_be_deactivated(self):
        """Admin account cannot be deactivated."""
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.patch(f'/api/users/{self.admin_user.id}/', {'is_active': False})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.admin_user.refresh_from_db()
        self.assertTrue(self.admin_user.is_active)

