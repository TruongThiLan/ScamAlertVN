from rest_framework import serializers
from api.models import User

class UserSerializer(serializers.ModelSerializer):
    role_name = serializers.CharField(source='role.role_name', read_only=True, default='')

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'reputation_score', 'status', 'role', 'role_name']


class UserBriefSerializer(serializers.ModelSerializer):
    """Thông tin tóm tắt user, dùng lồng vào Post/Comment."""
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'reputation_score']
