from rest_framework import serializers
from api.models import Post
from api.serializers.user_serializers import UserBriefSerializer
from api.serializers.scam_serializers import ScamCategorySerializer

# NOTE VAN DAP:
# Serializer la lop chuyen doi Model <-> JSON cho frontend.
# File nay co 3 serializer quan trong:
# - PostSerializer: user/public xem bai viet, co like/bookmark/comment count.
# - PostModerationSerializer: admin xem day du trang thai kiem duyet va AI.
# - PostCreateSerializer: user tao/sua bai, server tu gan user/status.

class PostSerializer(serializers.ModelSerializer):
    """Serializer dùng cho trang chủ — chỉ hiện bài APPROVED."""
    # Cac field *_detail la du lieu long vao de FE hien ten user/danh muc, khong chi hien id.
    user_detail = UserBriefSerializer(source='user', read_only=True)  # thong tin tac gia.
    category_detail = ScamCategorySerializer(source='category', read_only=True)  # thong tin danh muc.
    likes_count = serializers.SerializerMethodField()  # goi ham get_likes_count().
    comments_count = serializers.SerializerMethodField()  # goi ham get_comments_count().
    is_liked = serializers.SerializerMethodField()  # user hien tai da like bai nay chua.
    is_bookmarked = serializers.SerializerMethodField()  # user hien tai da luu bai nay chua.
    images = serializers.SerializerMethodField()  # danh sach URL anh dinh kem.


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
        # Flow an danh:
        # 1. Serialize data goc.
        # 2. Kiem tra request.user co phai admin hoac chu bai khong.
        # 3. Neu khong co quyen xem danh tinh, mask user_detail.
        data = super().to_representation(instance)
        request = self.context.get('request')  # lay request de biet ai dang xem bai.
        is_admin = False
        is_owner = False
        if request and request.user.is_authenticated:
            is_admin = request.user.is_staff or (
                hasattr(request.user, 'role') and 
                request.user.role and 
                request.user.role.role_name == 'Admin'
            )
            is_owner = instance.user_id == request.user.id  # chu bai duoc xem tac gia that.
        
        if instance.is_anonymous and not (is_admin or is_owner):  # nguoi khac se bi mask tac gia.
            data['user_detail'] = {
                "id": None,
                "username": "Người dùng ẩn danh",
                "reputation_score": 0
            }
            data['user'] = None
        return data

    def get_likes_count(self, obj):
        # Dem so reaction UPVOTE dang tro vao bai viet nay.
        from api.models import Reaction
        return Reaction.objects.filter(
            target_type='POST',
            target_id=obj.id,
            reaction_type='UPVOTE'
        ).count()

    def get_comments_count(self, obj):
        # Chi dem comment ACTIVE, khong dem comment bi an.
        return obj.comments.filter(status='ACTIVE').count()

    def _get_user(self):
        # Helper lay user dang dang nhap tu context serializer.
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return request.user
        return None

    def get_is_liked(self, obj):
        # Tra ve true de FE to mau nut like.
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
        # Tra ve true/false de FE doi icon bookmark theo user dang dang nhap.
        user = self._get_user()
        if not user:
            return False
        from api.models import Bookmark
        return Bookmark.objects.filter(user=user, post=obj).exists()

    def get_images(self, obj):
        # Lay anh cua bai tu bang lien ket TargetMedia.
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
    user_detail = UserBriefSerializer(source='user', read_only=True)  # admin can xem tac gia that.
    category_detail = ScamCategorySerializer(source='category', read_only=True)  # hien danh muc trong bang admin.
    reviewed_by_detail = UserBriefSerializer(source='reviewed_by', read_only=True)  # admin nao da xu ly.
    images = serializers.SerializerMethodField()  # anh minh chung cua bai.


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
        # Admin cung can xem anh minh chung khi kiem duyet.
        from api.models import TargetMedia, TargetType
        return list(TargetMedia.objects.filter(
            target_type=TargetType.POST,
            target_id=obj.id
        ).values_list('media__url', flat=True))



class PostCreateSerializer(serializers.ModelSerializer):
    """
    Serializer dùng khi User đăng bài mới (POST /api/posts/).
    """
    user_detail = UserBriefSerializer(source='user', read_only=True)  # tra lai tac gia sau khi tao.
    category_detail = ScamCategorySerializer(source='category', read_only=True)  # tra lai danh muc sau khi tao.
    images = serializers.SerializerMethodField()  # tra anh neu co upload.


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
        # Validate o serializer de chan du lieu sai truoc khi save vao DB.
        if len(value.strip()) < 10:
            raise serializers.ValidationError('Tiêu đề bài viết phải có ít nhất 10 ký tự.')
        return value.strip()

    def validate_content(self, value):
        # Noi dung qua ngan thi khong du thong tin canh bao lua dao.
        if len(value.strip()) < 30:
            raise serializers.ValidationError('Nội dung bài viết phải có ít nhất 30 ký tự.')
        return value.strip()

    def get_images(self, obj):
        # Dung lai logic lay anh tu TargetMedia cho bai vua tao/sua.
        from api.models import TargetMedia, TargetType
        return list(TargetMedia.objects.filter(
            target_type=TargetType.POST,
            target_id=obj.id
        ).values_list('media__url', flat=True))

