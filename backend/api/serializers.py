from rest_framework import serializers
from django.utils import timezone
from django.contrib.auth import get_user_model
from .models import (
    User, Post, ScamCategory, Comment,
    ContentReport, Notification, TargetType
)


# =============================================================
# CORE SERIALIZERS
# =============================================================

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True)

    class Meta:
        model = get_user_model()
        fields = ['username', 'email', 'password']

    def create(self, validated_data):
        user = get_user_model().objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password']
        )
        return user


# =============================================================
# CORE SERIALIZERS
# =============================================================

class ScamCategorySerializer(serializers.ModelSerializer):
    """Dùng cho cả đọc lẫn ghi danh mục."""
    post_count = serializers.SerializerMethodField()

    class Meta:
        model = ScamCategory
        fields = ['id', 'category_name', 'description', 'post_count']

    def get_post_count(self, obj):
        return obj.posts.count()

    def validate_category_name(self, value):
        # Kiểm tra unique (trừ trường hợp update chính nó)
        qs = ScamCategory.objects.filter(category_name__iexact=value)
        if self.instance:
            qs = qs.exclude(pk=self.instance.pk)
        if qs.exists():
            raise serializers.ValidationError('Tên danh mục này đã tồn tại.')
        return value


class UserSerializer(serializers.ModelSerializer):
    role_name = serializers.CharField(source='role.role_name', read_only=True, default='')

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'reputation_score', 'status', 'role', 'role_name']


class UserBriefSerializer(serializers.ModelSerializer):
    """Thông tin tóm tắt user, dùng lồng vào Post/Comment."""
    class Meta:
        model = User
        fields = ['id', 'username', 'email']


# =============================================================
# POST SERIALIZERS
# =============================================================

class PostSerializer(serializers.ModelSerializer):
    """Serializer dùng cho trang chủ — chỉ hiện bài APPROVED."""
    user_detail = UserBriefSerializer(source='user', read_only=True)
    category_detail = ScamCategorySerializer(source='category', read_only=True)
    likes_count = serializers.SerializerMethodField()
    comments_count = serializers.SerializerMethodField()

    class Meta:
        model = Post
        fields = [
            'id', 'title', 'content', 'created_time', 'published_time', 'status',
            'user', 'user_detail',
            'category', 'category_detail',
            'likes_count', 'comments_count',
        ]
        read_only_fields = ['status', 'published_time']

    def get_likes_count(self, obj):
        return obj.reactions.filter(
            target_type=TargetType.POST,
            reaction_type='UPVOTE'
        ).count()

    def get_comments_count(self, obj):
        return obj.comments.count()


class PostModerationSerializer(serializers.ModelSerializer):
    """
    Serializer đầy đủ cho trang kiểm duyệt của Admin.
    Hiển thị thêm rejection_reason, reviewed_by, reviewed_at.
    """
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
        read_only_fields = fields  # Tất cả read-only trên serializer này


# =============================================================
# ACTION SERIALIZERS (dùng cho request body của custom actions)
# =============================================================

class ApprovePostSerializer(serializers.Serializer):
    """Body tùy chọn khi duyệt bài — không bắt buộc."""
    notes = serializers.CharField(required=False, allow_blank=True, max_length=500)


class RejectPostSerializer(serializers.Serializer):
    """Body bắt buộc khi từ chối bài."""
    reason = serializers.CharField(
        required=True,
        min_length=10,
        max_length=500,
        error_messages={
            'required': 'Phải nhập lý do từ chối.',
            'min_length': 'Lý do từ chối phải có ít nhất 10 ký tự.',
        }
    )


class HidePostSerializer(serializers.Serializer):
    """Body bắt buộc khi ẩn bài."""
    reason = serializers.CharField(
        required=True,
        min_length=10,
        max_length=500,
        error_messages={
            'required': 'Phải nhập lý do ẩn bài.',
            'min_length': 'Lý do ẩn bài phải có ít nhất 10 ký tự.',
        }
    )


class LockPostSerializer(serializers.Serializer):
    """Body bắt buộc khi khóa bài."""
    reason = serializers.CharField(
        required=True,
        min_length=10,
        max_length=500,
        error_messages={
            'required': 'Phải nhập lý do khóa bài.',
            'min_length': 'Lý do khóa bài phải có ít nhất 10 ký tự.',
        }
    )


class AdminDeletePostSerializer(serializers.Serializer):
    """Body bắt buộc khi Admin xóa bài vi phạm."""
    reason = serializers.CharField(
        required=True,
        min_length=10,
        max_length=500,
        error_messages={
            'required': 'Phải nhập lý do xóa bài.',
            'min_length': 'Lý do xóa bài phải có ít nhất 10 ký tự.',
        }
    )
    confirm = serializers.BooleanField(
        required=True,
        error_messages={'required': 'Phải xác nhận xóa bài (confirm=true).'}
    )

    def validate_confirm(self, value):
        if not value:
            raise serializers.ValidationError('Phải xác nhận xóa bài (confirm=true).')
        return value


# =============================================================
# COMMENT SERIALIZER
# =============================================================

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


# =============================================================
# CONTENT REPORT SERIALIZER
# =============================================================

class ContentReportSerializer(serializers.ModelSerializer):
    reporter_detail = UserBriefSerializer(source='reporter_user', read_only=True)
    # Thêm link tới post/comment nếu cần
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
        """Trả preview nội dung bị báo cáo (title của Post hoặc content của Comment)."""
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
    """Dùng khi User tạo báo cáo mới."""
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