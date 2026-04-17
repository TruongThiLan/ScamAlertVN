from rest_framework import serializers
from django.utils import timezone
from api.models import (
    User, Post, ScamCategory, Comment,
    ContentReport, Notification, TargetType
)

# Import các serializer từ các file modular
from .user_serializers import UserSerializer
from .report_serializers import PostSerializer, ScamCategorySerializer
from .notification_serializers import NotificationSerializer

# =============================================================
# MODERATION & HELPER SERIALIZERS
# =============================================================

class UserBriefSerializer(serializers.ModelSerializer):
    """Thông tin tóm tắt user, dùng lồng vào Post/Comment."""
    class Meta:
        model = User
        fields = ['id', 'username', 'email']


class PostModerationSerializer(serializers.ModelSerializer):
    """Serializer đầy đủ cho trang kiểm duyệt của Admin."""
    user_detail = UserBriefSerializer(source='user', read_only=True)
    category_detail = ScamCategorySerializer(source='category', read_only=True)
    reviewed_by_detail = UserBriefSerializer(source='reviewed_by', read_only=True)

    class Meta:
        model = Post
        fields = [
            'id', 'title', 'content',
            'created_time', 'updated_time', 'published_time',
            'status',
            'user', 'user_detail',
            'category', 'category_detail',
            'rejection_reason',
            'reviewed_by', 'reviewed_by_detail',
            'reviewed_at',
        ]
        read_only_fields = fields


class ApprovePostSerializer(serializers.Serializer):
    notes = serializers.CharField(required=False, allow_blank=True, max_length=500)


class RejectPostSerializer(serializers.Serializer):
    reason = serializers.CharField(required=True, min_length=10, max_length=500)


class HidePostSerializer(serializers.Serializer):
    reason = serializers.CharField(required=True, min_length=10, max_length=500)


class LockPostSerializer(serializers.Serializer):
    reason = serializers.CharField(required=True, min_length=10, max_length=500)


class AdminDeletePostSerializer(serializers.Serializer):
    reason = serializers.CharField(required=True, min_length=10, max_length=500)
    confirm = serializers.BooleanField(required=True)

    def validate_confirm(self, value):
        if not value:
            raise serializers.ValidationError('Phải xác nhận xóa bài (confirm=true).')
        return value


class CommentSerializer(serializers.ModelSerializer):
    user_detail = UserBriefSerializer(source='user', read_only=True)
    replies_count = serializers.SerializerMethodField()

    class Meta:
        model = Comment
        fields = [
            'id', 'content', 'created_time', 'status',
            'user', 'user_detail',
            'post', 'parent_comment',
            'replies_count',
        ]
        read_only_fields = ['status']

    def get_replies_count(self, obj):
        return obj.replies.count()


class ContentReportSerializer(serializers.ModelSerializer):
    reporter_detail = UserBriefSerializer(source='reporter_user', read_only=True)
    target_preview = serializers.SerializerMethodField()

    class Meta:
        model = ContentReport
        fields = [
            'id', 'reason', 'reported_time', 'processing_status',
            'target_type', 'target_id',
            'reporter_user', 'reporter_detail',
            'target_preview',
        ]
        read_only_fields = ['reported_time', 'processing_status']

    def get_target_preview(self, obj):
        try:
            if obj.target_type == TargetType.POST:
                post = Post.objects.get(pk=obj.target_id)
                return {'type': 'post', 'title': post.title, 'id': post.id}
            elif obj.target_type == TargetType.COMMENT:
                comment = Comment.objects.get(pk=obj.target_id)
                return {'type': 'comment', 'content': comment.content[:100], 'id': comment.id}
        except Exception:
            return None


class ContentReportCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = ContentReport
        fields = ['reason', 'target_type', 'target_id']

    def validate(self, data):
        target_type = data.get('target_type')
        target_id = data.get('target_id')
        if target_type == TargetType.POST:
            if not Post.objects.filter(pk=target_id).exists():
                raise serializers.ValidationError({'target_id': 'Bài viết không tồn tại.'})
        elif target_type == TargetType.COMMENT:
            if not Comment.objects.filter(pk=target_id).exists():
                raise serializers.ValidationError({'target_id': 'Bình luận không tồn tại.'})
        return data
