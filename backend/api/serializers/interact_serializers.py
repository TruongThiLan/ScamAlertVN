
# ============================================================
# interact_serializers.py
# Chức năng: Tương tác & Phản hồi (UC 10.1 – 10.4)
# Author   : Thảo B
# ============================================================

from rest_framework import serializers
from api.models import Comment, ContentReport, TargetType, Post
from api.serializers.user_serializers import UserBriefSerializer


# ------------------------------------------------------------------
# UC 10.2 – Bình luận bài viết / UC 10.2b – Phản hồi bình luận
# ------------------------------------------------------------------

class CommentSerializer(serializers.ModelSerializer):
    """
    Serializer cho Comment (cấp 1) và Reply (cấp 2 trở đi).
    - user_detail  : thông tin tóm tắt người bình luận (read-only, lồng vào).
    - replies      : danh sách reply lồng đệ quy (chỉ hiển thị khi là comment gốc).
    - replies_count: số lượng reply.
    - images       : danh sách URL ảnh đính kèm (lưu qua TargetMedia).
    """
    user_detail     = UserBriefSerializer(source='user', read_only=True)
    replies_count   = serializers.SerializerMethodField()
    images          = serializers.SerializerMethodField()
    # "replies" field được nest đệ quy – khai báo tường minh để Swagger hiểu
    replies         = serializers.SerializerMethodField()

    class Meta:
        model  = Comment
        fields = [
            'id', 'content', 'created_time', 'status',
            # Ghi: chỉ gửi 'user' (int FK) / 'post' (int FK) / 'parent_comment' (int FK)
            'user', 'user_detail',
            'post', 'parent_comment',
            'is_anonymous',
            'replies_count', 'replies',
            'images',
        ]
        # 'user' & 'status' do server tự set, không cho phép FE ghi
        read_only_fields = ['user', 'status', 'is_anonymous']

    # ----------------------------------------------------------------
    # to_representation – Mask thông tin user nếu is_anonymous = True
    # ----------------------------------------------------------------

    def to_representation(self, instance):
        """
        Xử lý logic ẩn danh khi serialize ra JSON trả về FE.

        Quy tắc:
          1. Nếu comment KHÔNG ẩn danh → trả bình thường.
          2. Nếu comment ẩn danh:
             - Admin hoặc chính chủ → vẫn thấy user_detail thật.
             - Người khác → mask thành "Người dùng ẩn danh".
        """
        #thêm tạm
        #print(f"[DEBUG] comment_id={instance.id} is_anonymous={instance.is_anonymous}")
        #print(f"[DEBUG] request={self.context.get('request')}")

        data = super().to_representation(instance)
        request = self.context.get('request')

        if not instance.is_anonymous:
            return data  # không ẩn danh → giữ nguyên

        # Kiểm tra xem requester có được xem danh tính thật không
        is_admin = False
        if request and request.user.is_authenticated:
            is_admin = request.user.is_staff or (
                    hasattr(request.user, 'role')
                    and request.user.role
                    and request.user.role.role_name == 'Admin'
            )

        if not is_admin:
            data['user'] = None
            data['user_detail'] = {
                'id': None,
                'username': 'Người dùng ẩn danh',
                'email': '',
                'reputation_score': 0,
            }

        return data

    # ---- helpers ----
    def get_images(self, obj):
        """Trả về list URL ảnh đính kèm của comment này (qua bảng TargetMedia)."""
        from api.models import TargetMedia
        return list(
            TargetMedia.objects.filter(
                target_type=TargetType.COMMENT,
                target_id=obj.id
            ).values_list('media__url', flat=True)
        )

    def get_replies_count(self, obj):
        """Đếm số reply trực tiếp của comment."""
        return obj.replies.count()

    def get_replies(self, obj):
        """
        Trả về danh sách reply lồng vào comment gốc.
        - Nếu đây là comment gốc (parent_comment=None) → serialize tất cả replies.
        - Nếu đây đã là reply → trả [] để tránh đệ quy vô tận.
        NOTE: Để tối ưu DB, prefetch_related('replies') nên được gọi ở View.
        """
        if obj.replies.exists():
            serializer = CommentSerializer(
                obj.replies.all(), many=True, context=self.context
            )
            return serializer.data
        return []

    def validate_content(self, value):
        """Nội dung bình luận không được rỗng."""
        if not value or not value.strip():
            raise serializers.ValidationError('Nội dung bình luận không được để trống.')
        return value.strip()


# ------------------------------------------------------------------
# UC 10.4 – Báo cáo bài viết / bình luận
# ------------------------------------------------------------------

class ContentReportSerializer(serializers.ModelSerializer):
    """
    Serializer đọc báo cáo — dành cho Admin xem danh sách.
    - reporter_detail : thông tin người báo cáo.
    - target_preview  : preview ngắn nội dung bị báo cáo (Post title hoặc Comment excerpt).
    """
    reporter_detail = UserBriefSerializer(source='reporter_user', read_only=True)
    target_preview  = serializers.SerializerMethodField()

    class Meta:
        model  = ContentReport
        fields = [
            'id', 'reason', 'reported_time', 'processing_status',
            'target_type', 'target_id',
            'reporter_user', 'reporter_detail',
            'target_preview',
        ]
        read_only_fields = ['reported_time', 'processing_status']

    def get_target_preview(self, obj):
        """Trả về preview ngắn của nội dung bị báo cáo."""
        try:
            if obj.target_type == TargetType.POST:
                post = Post.objects.get(pk=obj.target_id)
                return {'type': 'post', 'title': post.title, 'id': post.id}
            elif obj.target_type == TargetType.COMMENT:
                comment = Comment.objects.get(pk=obj.target_id)
                return {
                    'type'   : 'comment',
                    'content': comment.content[:100],
                    'id'     : comment.id,
                }
        except Exception:
            return None


class ContentReportCreateSerializer(serializers.ModelSerializer):
    """
    Serializer tạo báo cáo mới — dành cho User gửi form báo cáo.
    FE cần gửi: { reason, target_type, target_id }
    """
    class Meta:
        model  = ContentReport
        fields = ['reason', 'target_type', 'target_id']

    def validate(self, data):
        """Kiểm tra target tồn tại trước khi lưu báo cáo."""
        target_type = data.get('target_type')
        target_id   = data.get('target_id')

        if target_type == TargetType.POST:
            if not Post.objects.filter(pk=target_id).exists():
                raise serializers.ValidationError({'target_id': 'Bài viết không tồn tại.'})
        elif target_type == TargetType.COMMENT:
            if not Comment.objects.filter(pk=target_id).exists():
                raise serializers.ValidationError({'target_id': 'Bình luận không tồn tại.'})
        else:
            raise serializers.ValidationError({'target_type': 'Loại nội dung không hợp lệ.'})

        return data


# ------------------------------------------------------------------
# UC 10.3 – Thả cảm xúc (Reaction)
# ------------------------------------------------------------------

class ReactionToggleSerializer(serializers.Serializer):
    """
    Serializer validate input khi user nhấn Like / Unlike.
    FE cần gửi: { target_type, target_id, reaction_type (optional, default UPVOTE) }
    """
    target_type   = serializers.ChoiceField(choices=TargetType.choices)
    target_id     = serializers.IntegerField(min_value=1)
    reaction_type = serializers.ChoiceField(
        choices=[('UPVOTE', 'Upvote'), ('DOWNVOTE', 'Downvote')],
        default='UPVOTE'
    )

    def validate(self, data):
        """Kiểm tra target_id thực sự tồn tại."""
        target_type = data['target_type']
        target_id   = data['target_id']
        if target_type == TargetType.POST:
            if not Post.objects.filter(pk=target_id).exists():
                raise serializers.ValidationError('Bài viết không tồn tại.')
        elif target_type == TargetType.COMMENT:
            if not Comment.objects.filter(pk=target_id).exists():
                raise serializers.ValidationError('Bình luận không tồn tại.')
        return data


# ------------------------------------------------------------------
# UC 10.1 – Chia sẻ bài viết
# ------------------------------------------------------------------

class PostShareSerializer(serializers.Serializer):
    """
    Serializer trả về link chia sẻ bài viết.
    Chỉ cần post_id, server tự tạo shareable URL.
    """
    post_id    = serializers.IntegerField(read_only=True)
    share_url  = serializers.CharField(read_only=True)
    post_title = serializers.CharField(read_only=True)
