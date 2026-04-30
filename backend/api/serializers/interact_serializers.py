from rest_framework import serializers
from api.models import (
    Comment, ContentReport, TargetType, Post
)
from api.serializers.user_serializers import UserBriefSerializer

class CommentSerializer(serializers.ModelSerializer):
    user_detail = UserBriefSerializer(source='user', read_only=True)
    replies_count = serializers.SerializerMethodField()
    images = serializers.SerializerMethodField()

    class Meta:
        model = Comment
        fields = [
            'id', 'content', 'created_time', 'status',
            'user', 'user_detail',
            'post', 'parent_comment',
            'replies_count',
            'replies',
            'images',
        ]
        read_only_fields = ['status']

    def get_images(self, obj):
        from api.models import TargetMedia, TargetType
        return list(TargetMedia.objects.filter(
            target_type=TargetType.COMMENT,
            target_id=obj.id
        ).values_list('media__url', flat=True))


    def get_replies_count(self, obj):
        return obj.replies.count()

    def get_replies(self, obj):
        if obj.parent_comment is None:
            serializer = CommentSerializer(obj.replies.all(), many=True)
            return serializer.data
        return []


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
