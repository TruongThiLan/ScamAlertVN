from django.contrib.auth import get_user_model
from rest_framework import serializers
import re

from api.models import Comment, Post, ScamCategory


User = get_user_model()

# NOTE VAN DAP:
# public_serializers.py chi tra cac truong an toan cho khach chua dang nhap.
# Khac voi PostSerializer chinh, serializer public khong tra field quan tri
# va van mask tac gia neu bai/comment dang o che do an danh.


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(
        write_only=True,
        min_length=6,
        error_messages={
            'blank': 'Mật khẩu không được để trống.',
            'required': 'Mật khẩu không được để trống.',
            'min_length': 'Mật khẩu phải có ít nhất 6 ký tự.',
        },
    )

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'password']
        read_only_fields = ['id']
        extra_kwargs = {
            'username': {
                'validators': [],
                'error_messages': {
                    'blank': 'Tên đăng nhập không được để trống.',
                    'required': 'Tên đăng nhập không được để trống.',
                }
            },
            'email': {
                'validators': [],
                'error_messages': {
                    'blank': 'Email không được để trống.',
                    'required': 'Email không được để trống.',
                    'invalid': 'Email phải đúng định dạng chuẩn.',
                }
            },
        }

    def validate_username(self, value):
        value = value.strip()
        if not value:
            raise serializers.ValidationError('Tên đăng nhập không được để trống.')
        if len(value) < 6 or len(value) > 20:
            raise serializers.ValidationError('Tên đăng nhập phải có độ dài từ 6 đến 20 ký tự.')
        if re.search(r'\s', value):
            raise serializers.ValidationError('Tên đăng nhập không được chứa khoảng trắng.')
        if not re.fullmatch(r'[A-Za-z0-9]+', value):
            raise serializers.ValidationError('Tên đăng nhập chỉ được bao gồm chữ cái và chữ số.')
        if User.objects.filter(username__iexact=value).exists():
            raise serializers.ValidationError('Tên đăng nhập đã tồn tại.')
        return value

    def validate_email(self, value):
        value = value.strip()
        if not value:
            raise serializers.ValidationError('Email không được để trống.')
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError('Email đã tồn tại.')
        return value

    def create(self, validated_data):
        # create_user tu hash password; khong bao gio luu password plain text.
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

    def to_representation(self, instance):
        # Bao ve danh tinh tac gia tren API public neu bai viet an danh.
        data = super().to_representation(instance)
        if instance.is_anonymous:
            data['user_detail'] = {
                'id': None,
                'username': 'Người dùng ẩn danh',
                'reputation_score': 0,
            }
        return data


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

    def to_representation(self, instance):
        data = super().to_representation(instance)
        if instance.is_anonymous:
            data['user_detail'] = {
                'id': None,
                'username': 'Người dùng ẩn danh',
                'reputation_score': 0,
            }
        return data
