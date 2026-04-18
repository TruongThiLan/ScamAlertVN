from django.contrib.auth import get_user_model
from rest_framework import serializers

from api.models import Comment, Post, ScamCategory


User = get_user_model()


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=6)

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'password']
        read_only_fields = ['id']

    def create(self, validated_data):
        return User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password'],
            role=None,
            is_staff=False,
        )


class PublicUserSerializer(serializers.ModelSerializer):
    """Thong tin tac gia duoc phep hien thi cong khai."""

    class Meta:
        model = User
        fields = ['id', 'username', 'reputation_score']


class PublicCategorySerializer(serializers.ModelSerializer):
    """Thong tin danh muc ngan gon cho API public."""

    class Meta:
        model = ScamCategory
        fields = ['id', 'category_name', 'description']


class PublicPostSerializer(serializers.ModelSerializer):
    """Serializer chi tra cac truong an toan cho khach chua dang nhap."""

    user_detail = PublicUserSerializer(source='user', read_only=True)
    category_detail = PublicCategorySerializer(source='category', read_only=True)
    comments_count = serializers.SerializerMethodField()

    class Meta:
        model = Post
        fields = [
            'id',
            'title',
            'content',
            'created_time',
            'published_time',
            'status',
            'user_detail',
            'category_detail',
            'comments_count',
        ]
        read_only_fields = fields

    def get_comments_count(self, obj):
        return obj.comments.filter(status=Comment.CommentStatus.ACTIVE).count()


class PublicCommentSerializer(serializers.ModelSerializer):
    """Binh luan public: khach chi duoc doc, khong duoc tao/sua/xoa."""

    user_detail = PublicUserSerializer(source='user', read_only=True)

    class Meta:
        model = Comment
        fields = [
            'id',
            'content',
            'created_time',
            'post',
            'parent_comment',
            'user_detail',
        ]
        read_only_fields = fields
