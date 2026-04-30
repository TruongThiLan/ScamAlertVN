from rest_framework import serializers
from ..models import Notification

class NotificationSerializer(serializers.ModelSerializer):
    """Serializer cho model Notification."""
    class Meta:
        model = Notification
        fields = ['id', 'content', 'is_read', 'created_time']
