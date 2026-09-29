"""Notification serializers."""
from rest_framework import serializers
from .models import Notification


class NotificationSerializer(serializers.ModelSerializer):
    """Serializer for notification list and detail."""

    class Meta:
        model = Notification
        fields = [
            'id',
            'user',
            'application',
            'title',
            'message',
            'notification_type',
            'is_read',
            'created_at',
        ]
        read_only_fields = ['id', 'user', 'application', 'title', 'message', 'notification_type', 'created_at']
