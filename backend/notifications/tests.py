"""
Tests for notification API endpoints and user isolation.
"""
from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status

from notifications.models import Notification

User = get_user_model()


class NotificationTests(TestCase):
    def setUp(self):
        self.client = APIClient()

        self.user1 = User.objects.create_user(
            email='user1@test.com', password='Password123!', role=User.Role.CANDIDATE
        )
        self.user2 = User.objects.create_user(
            email='user2@test.com', password='Password123!', role=User.Role.CANDIDATE
        )

        self.notif1 = Notification.objects.create(
            user=self.user1,
            title='Test Notification 1',
            message='First test message',
            notification_type=Notification.NotificationType.APPLICATION_RECEIVED,
            is_read=False,
        )
        self.notif2 = Notification.objects.create(
            user=self.user1,
            title='Test Notification 2',
            message='Second test message',
            notification_type=Notification.NotificationType.STATUS_CHANGE,
            is_read=False,
        )
        self.notif_other = Notification.objects.create(
            user=self.user2,
            title='Other User Notification',
            message='Secret message',
            notification_type=Notification.NotificationType.SYSTEM,
            is_read=False,
        )

    def test_list_notifications_scoped_to_user(self):
        self.client.force_authenticate(user=self.user1)
        response = self.client.get('/api/notifications/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data.get('results', response.data)
        self.assertEqual(len(results), 2)
        notif_ids = [n['id'] for n in results]
        self.assertIn(self.notif1.id, notif_ids)
        self.assertIn(self.notif2.id, notif_ids)
        self.assertNotIn(self.notif_other.id, notif_ids)

    def test_retrieve_own_notification(self):
        self.client.force_authenticate(user=self.user1)
        response = self.client.get(f'/api/notifications/{self.notif1.id}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['id'], self.notif1.id)

    def test_cannot_retrieve_other_user_notification(self):
        self.client.force_authenticate(user=self.user1)
        response = self.client.get(f'/api/notifications/{self.notif_other.id}/')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_mark_notification_as_read(self):
        self.client.force_authenticate(user=self.user1)
        response = self.client.post(f'/api/notifications/{self.notif1.id}/read/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.notif1.refresh_from_db()
        self.assertTrue(self.notif1.is_read)

    def test_cannot_mark_other_user_notification_read(self):
        self.client.force_authenticate(user=self.user1)
        response = self.client.post(f'/api/notifications/{self.notif_other.id}/read/')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.notif_other.refresh_from_db()
        self.assertFalse(self.notif_other.is_read)

    def test_mark_all_notifications_read(self):
        self.client.force_authenticate(user=self.user1)
        response = self.client.post('/api/notifications/read-all/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.notif1.refresh_from_db()
        self.notif2.refresh_from_db()
        self.assertTrue(self.notif1.is_read)
        self.assertTrue(self.notif2.is_read)
        # Verify user2 notification was not affected
        self.notif_other.refresh_from_db()
        self.assertFalse(self.notif_other.is_read)

    def test_unauthenticated_cannot_access_notifications(self):
        response = self.client.get('/api/notifications/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
