from rest_framework import serializers
from api.models import Post
from api.serializers.user_serializers import UserBriefSerializer
from api.serializers.scam_serializers import ScamCategorySerializer

class PostSerializer(serializers.ModelSerializer):
    """Serializer dùng cho trang chủ — chỉ hiện bài APPROVED."""
    user_detail = UserBriefSerializer(source='user', read_only=True)
    category_detail = ScamCategorySerializer(source='category', read_only=True)
    likes_count = serializers.SerializerMethodField()
    comments_count = serializers.SerializerMethodField()
    is_liked = serializers.SerializerMethodField()
    is_bookmarked = serializers.SerializerMethodField()
    images = serializers.SerializerMethodField()


    class Meta:
        model = Post
        fields = [
            'id', 'title', 'content', 'created_time', 'published_time', 'status',
            'user', 'user_detail',
            'category', 'category_detail',
            'likes_count', 'comments_count',
            'is_liked', 'is_bookmarked',
            'is_anonymous', 'images',
        ]
        read_only_fields = ['status', 'published_time']

    def to_representation(self, instance):
        """Xử lý logic ẩn danh: Mask thông tin user nếu is_anonymous=True (trừ Admin)."""
        data = super().to_representation(instance)
        request = self.context.get('request')
        is_admin = False
        if request and request.user.is_authenticated:
            is_admin = request.user.is_staff or (
                hasattr(request.user, 'role') and 
                request.user.role and 
                request.user.role.role_name == 'Admin'
            )
        
        if instance.is_anonymous and not is_admin:
            data['user_detail'] = {
                "id": None,
                "username": "Người dùng ẩn danh",
                "reputation_score": 0
            }
            data['user'] = None
        return data

    def get_likes_count(self, obj):
        from api.models import Reaction
        return Reaction.objects.filter(
            target_type='POST',
            target_id=obj.id,
            reaction_type='UPVOTE'
        ).count()

    def get_comments_count(self, obj):
        return obj.comments.count()

    def _get_user(self):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return request.user
        return None

    def get_is_liked(self, obj):
        user = self._get_user()
        if not user:
            return False
        from api.models import Reaction
        return Reaction.objects.filter(
            user=user,
            target_type='POST',
            target_id=obj.id,
            reaction_type='UPVOTE'
        ).exists()

    def get_is_bookmarked(self, obj):
        user = self._get_user()
        if not user:
            return False
        from api.models import Bookmark
        return Bookmark.objects.filter(user=user, post=obj).exists()

    def get_images(self, obj):
        from api.models import TargetMedia, TargetType
        return list(TargetMedia.objects.filter(
            target_type=TargetType.POST,
            target_id=obj.id
        ).values_list('media__url', flat=True))



class PostModerationSerializer(serializers.ModelSerializer):
    """
    Serializer đầy đủ cho trang kiểm duyệt của Admin.
    Hiển thị thêm rejection_reason, reviewed_by, reviewed_at.
    """
    user_detail = UserBriefSerializer(source='user', read_only=True)
    category_detail = ScamCategorySerializer(source='category', read_only=True)
    reviewed_by_detail = UserBriefSerializer(source='reviewed_by', read_only=True)
    images = serializers.SerializerMethodField()


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
            'ai_analysis_status', 'ai_analysis_result',
            'ai_analysis_provider', 'ai_analysis_error',
            'ai_analyzed_at',
            'is_anonymous', 'images',
        ]
        read_only_fields = fields

    def get_images(self, obj):
        from api.models import TargetMedia, TargetType
        return list(TargetMedia.objects.filter(
            target_type=TargetType.POST,
            target_id=obj.id
        ).values_list('media__url', flat=True))



class PostCreateSerializer(serializers.ModelSerializer):
    """
    Serializer dùng khi User đăng bài mới (POST /api/posts/).
    """
    user_detail = UserBriefSerializer(source='user', read_only=True)
    category_detail = ScamCategorySerializer(source='category', read_only=True)
    images = serializers.SerializerMethodField()


    class Meta:
        model = Post
        fields = [
            'id', 'title', 'content',
            'created_time', 'status',
            'user', 'user_detail',
            'category', 'category_detail',
            'is_anonymous', 'images',
        ]
        read_only_fields = ['status', 'created_time', 'user', 'user_detail', 'category_detail']

    def validate_title(self, value):
        if len(value.strip()) < 10:
            raise serializers.ValidationError('Tiêu đề bài viết phải có ít nhất 10 ký tự.')
        return value.strip()

    def validate_content(self, value):
        if len(value.strip()) < 30:
            raise serializers.ValidationError('Nội dung bài viết phải có ít nhất 30 ký tự.')
        return value.strip()

    def get_images(self, obj):
        from api.models import TargetMedia, TargetType
        return list(TargetMedia.objects.filter(
            target_type=TargetType.POST,
            target_id=obj.id
        ).values_list('media__url', flat=True))

