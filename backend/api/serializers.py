from rest_framework import serializers
from .models import User, Post, ScamCategory

# Serializer cho danh mục (để khi lấy bài viết hiện luôn tên danh mục)
class ScamCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = ScamCategory
        fields = ['id', 'category_name']

# Serializer cho Người dùng
class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        # Chọn các trường muốn gửi lên Frontend (không nên gửi password ở đây)
        fields = ['id', 'username', 'email', 'reputation_score', 'status']

# Serializer cho Bài viết
class PostSerializer(serializers.ModelSerializer):
    # Kỹ thuật đổ dữ liệu liên kết: Hiện tên thay vì hiện ID số
    user_detail = UserSerializer(source='user', read_only=True)
    category_detail = ScamCategorySerializer(source='category', read_only=True)

    likes_count = serializers.SerializerMethodField()
    comments_count = serializers.SerializerMethodField()

    class Meta:
        model = Post
        fields = [
            'id', 'title', 'content', 'created_time', 'status',
            'user', 'user_detail', 'category', 'category_detail'
        ]