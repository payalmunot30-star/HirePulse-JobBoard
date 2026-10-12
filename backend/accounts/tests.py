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

    def test_recruiter_registration_success(self):
        """Public registration can successfully create recruiter accounts with company info."""
        payload = {
            'email': 'recruiter.new@company.com',
            'password': 'Password123!',
            'password_confirm': 'Password123!',
            'first_name': 'Rachel',
            'last_name': 'Green',
            'role': 'recruiter',
            'company_name': 'Ralph Lauren Corp',
            'company_website': 'https://ralphlauren.com',
            'position': 'Head of Talent Acquisition',
            'phone': '9876543210',
            'company_location': 'Mumbai, Maharashtra',
        }
        response = self.client.post('/api/auth/register/', payload)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(User.objects.filter(email='recruiter.new@company.com').exists())
        user = User.objects.get(email='recruiter.new@company.com')
        self.assertEqual(user.role, User.Role.RECRUITER)
        self.assertTrue(hasattr(user, 'recruiter_profile'))
        self.assertEqual(user.recruiter_profile.company_name, 'Ralph Lauren Corp')
        self.assertEqual(user.recruiter_profile.position, 'Head of Talent Acquisition')
        self.assertEqual(user.recruiter_profile.phone, '+919876543210')

    def test_recruiter_registration_requires_company_name(self):
        """Recruiter registration must fail if company name is not provided."""
        payload = {
            'email': 'recruiter.nocompany@company.com',
            'password': 'Password123!',
            'password_confirm': 'Password123!',
            'first_name': 'Rachel',
            'last_name': 'Green',
            'role': 'recruiter',
            'company_name': '',
        }
        response = self.client.post('/api/auth/register/', payload)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('company_name', response.data)
        self.assertFalse(User.objects.filter(email='recruiter.nocompany@company.com').exists())

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

    def test_admin_recruiter_creation_endpoint_is_disabled(self):
        """Admin cannot create recruiter accounts via POST /api/users/recruiters/ (endpoint disabled)."""
        self.client.force_authenticate(user=self.admin_user)
        payload = {
            'full_name': 'Sarah Connor',
            'email': 'sarah.connor@cyberdyne.com',
            'company_name': 'Cyberdyne Systems',
            'password': 'Password123!',
            'password_confirm': 'Password123!',
        }
        response = self.client.post('/api/users/recruiters/', payload)
        self.assertEqual(response.status_code, status.HTTP_405_METHOD_NOT_ALLOWED)
        self.assertFalse(User.objects.filter(email='sarah.connor@cyberdyne.com').exists())

    def test_admin_can_list_recruiters(self):
        """Admin can list existing recruiters."""
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.get('/api/users/recruiters/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        emails = [r['email'] for r in (response.data.get('results') or response.data)]
        self.assertIn('existing.recruiter@test.com', emails)

    def test_non_admin_cannot_post_to_recruiters_endpoint(self):
        """Candidate, recruiter, and unauthenticated users cannot POST to /api/users/recruiters/."""
        payload = {
            'full_name': 'Unauthorized Recruiter',
            'email': 'unauth@test.com',
            'password': 'Password123!',
            'password_confirm': 'Password123!',
        }
        # Candidate attempt
        self.client.force_authenticate(user=self.regular_candidate)
        response = self.client.post('/api/users/recruiters/', payload)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

        # Recruiter attempt
        self.client.force_authenticate(user=self.regular_recruiter)
        response = self.client.post('/api/users/recruiters/', payload)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

        # Unauthenticated attempt
        self.client.logout()
        response = self.client.post('/api/users/recruiters/', payload)
        self.assertIn(response.status_code, (status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN))
        self.assertFalse(User.objects.filter(email='unauth@test.com').exists())

    def test_newly_registered_recruiter_can_login(self):
        """Recruiter registered through public registration can log in and access system."""
        reg_payload = {
            'email': 'alice.recruiter@test.com',
            'first_name': 'Alice',
            'last_name': 'Recruiter',
            'company_name': 'Global Tech',
            'password': 'Password123!',
            'password_confirm': 'Password123!',
            'role': 'recruiter',
        }
        reg_response = self.client.post('/api/auth/register/', reg_payload)
        self.assertEqual(reg_response.status_code, status.HTTP_201_CREATED)

        # Log in as newly created recruiter
        login_res = self.client.post('/api/auth/login/', {
            'email': 'alice.recruiter@test.com',
            'password': 'Password123!',
        })
        self.assertEqual(login_res.status_code, status.HTTP_200_OK)
        self.assertEqual(login_res.data['user']['role'], 'recruiter')
        self.assertIn('access', login_res.data['tokens'])

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


class ProfileCreationDedupTests(TestCase):
    """
    Regression and verification tests for DUP-02:
    Ensures single authoritative profile creation without duplicate queries,
    verifies transactional atomicity on failures, and confirms that fallback/direct
    user creation paths using post_save signals remain functional.
    """

    def setUp(self):
        self.client = APIClient()

    def test_candidate_registration_creates_exactly_one_profile_with_initial_data(self):
        """Candidate registration creates exactly one CandidateProfile with provided data."""
        payload = {
            'email': 'candidate.dedup@example.com',
            'password': 'Password123!',
            'password_confirm': 'Password123!',
            'first_name': 'Jane',
            'last_name': 'Candidate',
            'role': 'candidate',
            'phone': '9876543210',
        }
        response = self.client.post('/api/auth/register/', payload)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        user = User.objects.get(email='candidate.dedup@example.com')
        profiles = CandidateProfile.objects.filter(user=user)
        self.assertEqual(profiles.count(), 1)
        self.assertEqual(profiles.first().phone, '+919876543210')

    def test_recruiter_registration_creates_exactly_one_profile_with_company_details(self):
        """Recruiter registration creates exactly one RecruiterProfile with complete company attributes."""
        payload = {
            'email': 'recruiter.dedup@example.com',
            'password': 'Password123!',
            'password_confirm': 'Password123!',
            'first_name': 'Robert',
            'last_name': 'Recruiter',
            'role': 'recruiter',
            'company_name': 'Tech Innovators Inc',
            'company_website': 'https://techinnovators.io',
            'position': 'Head of Talent',
            'phone': '9876543210',
            'company_location': 'Bengaluru, Karnataka',
        }
        response = self.client.post('/api/auth/register/', payload)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        user = User.objects.get(email='recruiter.dedup@example.com')
        profiles = RecruiterProfile.objects.filter(user=user)
        self.assertEqual(profiles.count(), 1)
        profile = profiles.first()
        self.assertEqual(profile.company_name, 'Tech Innovators Inc')
        self.assertEqual(profile.company_website, 'https://techinnovators.io')
        self.assertEqual(profile.position, 'Head of Talent')
        self.assertEqual(profile.phone, '+919876543210')
        self.assertEqual(profile.company_location, 'Bengaluru, Karnataka')

    def test_failed_candidate_registration_rolls_back_cleanly(self):
        """Failed candidate registration leaves no orphaned User or CandidateProfile."""
        from unittest.mock import patch
        from accounts.services import AccountService

        target_email = 'failed.candidate@example.com'
        with patch('accounts.services.CandidateProfile.objects.create', side_effect=RuntimeError('Database explosion')):
            with self.assertRaises(RuntimeError):
                AccountService.register_user({
                    'email': target_email,
                    'password': 'Password123!',
                    'first_name': 'Fail',
                    'last_name': 'Candidate',
                    'role': User.Role.CANDIDATE,
                    'phone': '9876543210',
                })

        self.assertFalse(User.objects.filter(email=target_email).exists())
        self.assertFalse(CandidateProfile.objects.filter(user__email=target_email).exists())

    def test_failed_recruiter_registration_rolls_back_cleanly(self):
        """Failed recruiter registration leaves no orphaned User or RecruiterProfile."""
        from unittest.mock import patch
        from accounts.services import AccountService

        target_email = 'failed.recruiter@example.com'
        with patch('accounts.services.RecruiterProfile.objects.create', side_effect=RuntimeError('Database explosion')):
            with self.assertRaises(RuntimeError):
                AccountService.register_user({
                    'email': target_email,
                    'password': 'Password123!',
                    'first_name': 'Fail',
                    'last_name': 'Recruiter',
                    'role': User.Role.RECRUITER,
                    'company_name': 'Orphaned Company',
                })

        self.assertFalse(User.objects.filter(email=target_email).exists())
        self.assertFalse(RecruiterProfile.objects.filter(company_name='Orphaned Company').exists())

    def test_direct_user_creation_triggers_signal_profile(self):
        """Direct creation of candidate/recruiter without AccountService still creates profile via post_save signal."""
        # Candidate direct creation
        cand_user = User.objects.create_user(
            email='direct.cand@example.com',
            password='Password123!',
            first_name='Direct',
            last_name='Candidate',
            role=User.Role.CANDIDATE,
        )
        self.assertEqual(CandidateProfile.objects.filter(user=cand_user).count(), 1)

        # Recruiter direct creation
        rec_user = User.objects.create_user(
            email='direct.rec@example.com',
            password='Password123!',
            first_name='Direct',
            last_name='Recruiter',
            role=User.Role.RECRUITER,
        )
        self.assertEqual(RecruiterProfile.objects.filter(user=rec_user).count(), 1)

        # Admin direct creation does not create profiles
        admin_user = User.objects.create_superuser(
            email='direct.adm@example.com',
            password='Password123!',
            first_name='Direct',
            last_name='Admin',
        )
        self.assertFalse(CandidateProfile.objects.filter(user=admin_user).exists())
        self.assertFalse(RecruiterProfile.objects.filter(user=admin_user).exists())

    def test_registration_does_not_invoke_signal_profile_creation(self):
        """Verifies that during AccountService.register_user, the signal suppresses duplicate creation."""
        from unittest.mock import patch
        from accounts.services import AccountService

        with patch('accounts.signals.CandidateProfile.objects.get_or_create') as mock_signal_create:
            user = AccountService.register_user({
                'email': 'signal.bypass@example.com',
                'password': 'Password123!',
                'first_name': 'Bypass',
                'last_name': 'Tester',
                'role': User.Role.CANDIDATE,
            })
            # The signal receiver should have skipped get_or_create entirely
            mock_signal_create.assert_not_called()
            # Exactly one profile should exist in DB, created by the service
            self.assertEqual(CandidateProfile.objects.filter(user=user).count(), 1)


class CrossRoleProfileAccessTests(TestCase):
    """
    Focused tests for role segregation on profile endpoints:
    - Candidate can access their candidate profile.
    - Candidate receives HTTP 403 on recruiter profile endpoint.
    - Recruiter can access their recruiter profile.
    - Recruiter receives HTTP 403 on candidate profile endpoint.
    - Admin receives HTTP 403 from both profile endpoints.
    - Rejected cross-role requests do not create profile records.
    - Existing authorized profile retrieval and update behavior still works.
    """

    def setUp(self):
        self.client = APIClient()

        # Candidate account
        self.candidate_user = User.objects.create_user(
            email='cand.role@test.com',
            password='Password123!',
            first_name='Candidate',
            last_name='User',
            role=User.Role.CANDIDATE,
        )

        # Recruiter account
        self.recruiter_user = User.objects.create_user(
            email='rec.role@test.com',
            password='Password123!',
            first_name='Recruiter',
            last_name='User',
            role=User.Role.RECRUITER,
        )

        # Admin account
        self.admin_user = User.objects.create_superuser(
            email='admin.role@test.com',
            password='Password123!',
            first_name='Admin',
            last_name='User',
        )

    def test_candidate_can_access_candidate_profile(self):
        """Candidate can access their candidate profile."""
        self.client.force_authenticate(user=self.candidate_user)
        response = self.client.get('/api/users/profile/candidate/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['user']['email'], self.candidate_user.email)

    def test_candidate_receives_403_on_recruiter_profile_endpoint(self):
        """Candidate receives HTTP 403 when requesting the recruiter profile endpoint."""
        self.client.force_authenticate(user=self.candidate_user)
        response = self.client.get('/api/users/profile/recruiter/')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_recruiter_can_access_recruiter_profile(self):
        """Recruiter can access their recruiter profile."""
        self.client.force_authenticate(user=self.recruiter_user)
        response = self.client.get('/api/users/profile/recruiter/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['user']['email'], self.recruiter_user.email)

    def test_recruiter_receives_403_on_candidate_profile_endpoint(self):
        """Recruiter receives HTTP 403 when requesting the candidate profile endpoint."""
        self.client.force_authenticate(user=self.recruiter_user)
        response = self.client.get('/api/users/profile/candidate/')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_admin_receives_403_from_both_profile_endpoints(self):
        """Admin receives HTTP 403 from both profile endpoints."""
        self.client.force_authenticate(user=self.admin_user)

        cand_response = self.client.get('/api/users/profile/candidate/')
        self.assertEqual(cand_response.status_code, status.HTTP_403_FORBIDDEN)

        rec_response = self.client.get('/api/users/profile/recruiter/')
        self.assertEqual(rec_response.status_code, status.HTTP_403_FORBIDDEN)

    def test_rejected_cross_role_requests_do_not_create_profile_records(self):
        """Rejected cross-role requests do not create profile records."""
        # Ensure no cross-role profiles exist initially
        RecruiterProfile.objects.filter(user=self.candidate_user).delete()
        CandidateProfile.objects.filter(user=self.recruiter_user).delete()
        CandidateProfile.objects.filter(user=self.admin_user).delete()
        RecruiterProfile.objects.filter(user=self.admin_user).delete()

        # 1. Candidate attempts GET and PATCH on recruiter profile
        self.client.force_authenticate(user=self.candidate_user)
        get_res = self.client.get('/api/users/profile/recruiter/')
        self.assertEqual(get_res.status_code, status.HTTP_403_FORBIDDEN)
        patch_res = self.client.patch('/api/users/profile/recruiter/', {'company_name': 'Unauthorized Co'})
        self.assertEqual(patch_res.status_code, status.HTTP_403_FORBIDDEN)
        self.assertFalse(RecruiterProfile.objects.filter(user=self.candidate_user).exists())

        # 2. Recruiter attempts GET and PATCH on candidate profile
        self.client.force_authenticate(user=self.recruiter_user)
        get_res2 = self.client.get('/api/users/profile/candidate/')
        self.assertEqual(get_res2.status_code, status.HTTP_403_FORBIDDEN)
        patch_res2 = self.client.patch('/api/users/profile/candidate/', {'bio': 'Unauthorized Candidate Bio'})
        self.assertEqual(patch_res2.status_code, status.HTTP_403_FORBIDDEN)
        self.assertFalse(CandidateProfile.objects.filter(user=self.recruiter_user).exists())

        # 3. Admin attempts GET on candidate and recruiter profiles
        self.client.force_authenticate(user=self.admin_user)
        admin_cand = self.client.get('/api/users/profile/candidate/')
        self.assertEqual(admin_cand.status_code, status.HTTP_403_FORBIDDEN)
        admin_rec = self.client.get('/api/users/profile/recruiter/')
        self.assertEqual(admin_rec.status_code, status.HTTP_403_FORBIDDEN)
        self.assertFalse(CandidateProfile.objects.filter(user=self.admin_user).exists())
        self.assertFalse(RecruiterProfile.objects.filter(user=self.admin_user).exists())

    def test_authorized_profile_retrieval_and_update(self):
        """Existing authorized profile retrieval and update behavior still works."""
        # Candidate profile update
        self.client.force_authenticate(user=self.candidate_user)
        cand_update = self.client.patch('/api/users/profile/candidate/', {
            'bio': 'Passionate Full Stack Developer',
            'location': 'Bengaluru, Karnataka',
        })
        self.assertEqual(cand_update.status_code, status.HTTP_200_OK)
        self.assertEqual(cand_update.data['bio'], 'Passionate Full Stack Developer')
        self.assertEqual(cand_update.data['location'], 'Bengaluru, Karnataka')

        # Recruiter profile update
        self.client.force_authenticate(user=self.recruiter_user)
        rec_update = self.client.patch('/api/users/profile/recruiter/', {
            'company_name': 'Apex Technologies Pvt Ltd',
            'position': 'Head of People Operations',
            'company_location': 'Mumbai, Maharashtra',
        })
        self.assertEqual(rec_update.status_code, status.HTTP_200_OK)
        self.assertEqual(rec_update.data['company_name'], 'Apex Technologies Pvt Ltd')
        self.assertEqual(rec_update.data['position'], 'Head of People Operations')
        self.assertEqual(rec_update.data['company_location'], 'Mumbai, Maharashtra')


class DjangoAdminRecruiterRestrictionTests(TestCase):
    """
    Focused tests for Finding C:
    Enforcing recruiter creation exclusively through the public registration flow.
    1. The Django Admin user-creation form excludes the recruiter role.
    2. A forged form submission specifying role='recruiter' is rejected.
    3. Candidate creation through Django Admin remains supported.
    4. Admin creation through Django Admin remains supported.
    5. The role field is read-only when editing an existing user.
    6. Public recruiter registration still works and saves the submitted company information.
    7. Public candidate registration still works.
    8. The admin recruiter API endpoint continues returning HTTP 405 for POST requests.
    """

    def setUp(self):
        from accounts.admin import UserAdmin
        from django.contrib.admin.sites import AdminSite

        self.client = APIClient()
        self.site = AdminSite()
        self.user_admin = UserAdmin(User, self.site)
        self.admin_user = User.objects.create_superuser(
            email='admin.guard@test.com',
            password='Password123!',
            first_name='Admin',
            last_name='Guard',
        )

    def test_admin_user_creation_form_excludes_recruiter_role(self):
        """1. The Django Admin user-creation form excludes the recruiter role from choices."""
        from accounts.admin import AdminUserCreationForm

        form = AdminUserCreationForm()
        role_choices = [c[0] for c in form.fields['role'].choices]
        self.assertNotIn(User.Role.RECRUITER, role_choices)
        self.assertIn(User.Role.CANDIDATE, role_choices)
        self.assertIn(User.Role.ADMIN, role_choices)

    def test_forged_form_submission_specifying_recruiter_is_rejected(self):
        """2. A forged form submission specifying role='recruiter' is rejected server-side."""
        from accounts.admin import AdminUserCreationForm
        from django.core.exceptions import ValidationError

        forged_data = {
            'email': 'forged.recruiter@example.com',
            'first_name': 'Forged',
            'last_name': 'Recruiter',
            'role': User.Role.RECRUITER,
            'password1': 'SecurePassword123!',
            'password2': 'SecurePassword123!',
        }
        form = AdminUserCreationForm(data=forged_data)
        self.assertFalse(form.is_valid())
        self.assertIn('role', form.errors)
        self.assertIn(
            'Recruiter accounts must be created through the public registration flow',
            form.errors['role'][0],
        )

        # Also test UserAdmin.save_model blocks recruiter creation
        unverified_recruiter = User(
            email='bypass.rec@example.com',
            first_name='Bypass',
            last_name='Recruiter',
            role=User.Role.RECRUITER,
        )
        with self.assertRaises(ValidationError):
            self.user_admin.save_model(None, unverified_recruiter, None, change=False)
        self.assertFalse(User.objects.filter(email='bypass.rec@example.com').exists())

    def test_candidate_creation_through_django_admin_remains_supported(self):
        """3. Candidate creation through Django Admin remains supported."""
        from accounts.admin import AdminUserCreationForm

        candidate_data = {
            'email': 'admin.candidate@example.com',
            'first_name': 'AdminCreated',
            'last_name': 'Candidate',
            'role': User.Role.CANDIDATE,
            'password1': 'SecurePassword123!',
            'password2': 'SecurePassword123!',
        }
        form = AdminUserCreationForm(data=candidate_data)
        self.assertTrue(form.is_valid(), form.errors)
        user = form.save()
        self.assertEqual(user.role, User.Role.CANDIDATE)
        self.assertTrue(user.check_password('SecurePassword123!'))
        self.assertTrue(CandidateProfile.objects.filter(user=user).exists())

    def test_admin_creation_through_django_admin_remains_supported(self):
        """4. Admin creation through Django Admin remains supported."""
        from accounts.admin import AdminUserCreationForm

        admin_data = {
            'email': 'admin.created@example.com',
            'first_name': 'AdminCreated',
            'last_name': 'Admin',
            'role': User.Role.ADMIN,
            'password1': 'SecurePassword123!',
            'password2': 'SecurePassword123!',
        }
        form = AdminUserCreationForm(data=admin_data)
        self.assertTrue(form.is_valid(), form.errors)
        user = form.save()
        self.assertEqual(user.role, User.Role.ADMIN)
        self.assertTrue(user.check_password('SecurePassword123!'))

    def test_role_field_is_readonly_when_editing_existing_user(self):
        """5. The role field is read-only when editing an existing user."""
        existing_candidate = User.objects.create_user(
            email='existing.cand@example.com',
            password='Password123!',
            role=User.Role.CANDIDATE,
        )

        # On creation (obj=None), role is editable in form
        self.assertNotIn('role', self.user_admin.get_readonly_fields(None, obj=None))

        # On editing (obj=existing_candidate), role is read-only
        readonly_fields = self.user_admin.get_readonly_fields(None, obj=existing_candidate)
        self.assertIn('role', readonly_fields)

        # Verify save_model preserves original role even if modified on instance
        existing_candidate.role = User.Role.RECRUITER
        self.user_admin.save_model(None, existing_candidate, None, change=True)
        existing_candidate.refresh_from_db()
        self.assertEqual(existing_candidate.role, User.Role.CANDIDATE)

    def test_public_recruiter_registration_saves_company_information(self):
        """6. Public recruiter registration still works and saves the submitted company information."""
        payload = {
            'email': 'public.recruiter@innovate.com',
            'password': 'Password123!',
            'password_confirm': 'Password123!',
            'first_name': 'Diana',
            'last_name': 'Prince',
            'role': 'recruiter',
            'company_name': 'Themyscira Global Inc',
            'company_website': 'https://themyscira.io',
            'position': 'Head of Talent',
            'phone': '9876543210',
            'company_location': 'Mumbai, Maharashtra',
        }
        response = self.client.post('/api/auth/register/', payload)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        user = User.objects.get(email='public.recruiter@innovate.com')
        self.assertEqual(user.role, User.Role.RECRUITER)
        self.assertTrue(hasattr(user, 'recruiter_profile'))
        self.assertEqual(user.recruiter_profile.company_name, 'Themyscira Global Inc')
        self.assertEqual(user.recruiter_profile.company_website, 'https://themyscira.io')
        self.assertEqual(user.recruiter_profile.position, 'Head of Talent')

    def test_public_candidate_registration_still_works(self):
        """7. Public candidate registration still works."""
        payload = {
            'email': 'public.candidate@talent.com',
            'password': 'Password123!',
            'password_confirm': 'Password123!',
            'first_name': 'Barry',
            'last_name': 'Allen',
            'role': 'candidate',
            'phone': '9876543210',
        }
        response = self.client.post('/api/auth/register/', payload)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        user = User.objects.get(email='public.candidate@talent.com')
        self.assertEqual(user.role, User.Role.CANDIDATE)
        self.assertTrue(hasattr(user, 'candidate_profile'))
        self.assertEqual(user.candidate_profile.phone, '+919876543210')

    def test_admin_recruiter_api_endpoint_continues_returning_405_for_post(self):
        """8. The admin recruiter API endpoint continues returning HTTP 405 for POST requests."""
        self.client.force_authenticate(user=self.admin_user)
        payload = {
            'email': 'blocked.recruiter@test.com',
            'password': 'Password123!',
            'company_name': 'Blocked Corp',
        }
        response = self.client.post('/api/users/recruiters/', payload)
        self.assertEqual(response.status_code, status.HTTP_405_METHOD_NOT_ALLOWED)
        self.assertFalse(User.objects.filter(email='blocked.recruiter@test.com').exists())




