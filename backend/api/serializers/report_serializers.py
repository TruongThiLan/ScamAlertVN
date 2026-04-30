from rest_framework import serializers
from ..models import Post, ScamCategory
from .user_serializers import UserSerializer

class ScamCategorySerializer(serializers.ModelSerializer):
    """Serializer cho các danh mục lừa đảo."""
    class Meta:
        model = ScamCategory
        fields = ['id', 'category_name']

class PostSerializer(serializers.ModelSerializer):
    """
    Serializer cho bài viết tố cáo.
    Bao gồm thông tin chi tiết của người đăng và danh mục.
    """
    user_detail = UserSerializer(source='user', read_only=True)
    category_detail = ScamCategorySerializer(source='category', read_only=True)

    class Meta:
        model = Post
        fields = [
            'id', 'title', 'content', 'created_time', 'status',
            'user', 'user_detail', 'category', 'category_detail'
        ]
