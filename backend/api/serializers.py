from rest_framework import serializers
from django.db import models
from django.utils import timezone
from datetime import timedelta
from .models import User, Post, ScamCategory, ActivityLog, ContentReport, Comment

# Serializer cho danh mục (để khi lấy bài viết hiện luôn tên danh mục)
class ScamCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = ScamCategory
        fields = ['id', 'category_name']

# Serializer cho Người dùng
class UserSerializer(serializers.ModelSerializer):
    remaining_lock_time = serializers.SerializerMethodField()
    password = serializers.CharField(write_only=True)
    report_count = serializers.SerializerMethodField()

    class Meta:
        model = User
        # Chọn các trường muốn gửi lên Frontend (không nên gửi password ở đây)
        fields = ['id', 'username', 'email', 'password', 'reputation_score', 'status', 'created_date', 'remaining_lock_time', 'report_count']
        extra_kwargs = {'password': {'write_only': True}}

    def create(self, validated_data):
        # Sử dụng create_user để mật khẩu được mã hóa tự động
        return User.objects.create_user(**validated_data)

    def get_report_count(self, obj):
        # Đếm báo cáo từ các bài viết của user
        post_reports = ContentReport.objects.filter(
            target_type='POST', 
            target_id__in=Post.objects.filter(user=obj).values_list('id', flat=True)
        ).count()
        
        # Đếm báo cáo từ các bình luận của user
        comment_reports = ContentReport.objects.filter(
            target_type='COMMENT',
            target_id__in=Comment.objects.filter(user=obj).values_list('id', flat=True)
        ).count()
        
        return post_reports + comment_reports

    def get_remaining_lock_time(self, obj):
        if obj.status != 'banned':
            return None
        
        # Tìm log mới nhất liên quan đến việc Khóa hoặc Mở khóa của user này
        latest_log = ActivityLog.objects.filter(
            action__contains=f"target={obj.username}"
        ).filter(
            models.Q(action__contains="LOCK_INFO") | models.Q(action__contains="UNLOCK_INFO")
        ).order_by('-created_time').first()

        if not latest_log or "UNLOCK_INFO" in latest_log.action:
            return None

        try:
            # Parse duration từ log: [LOCK_INFO:target=username,duration=X]
            import re
            match = re.search(r"duration=([^ \],]+)", latest_log.action)
            if not match:
                return "Không rõ"
            
            duration_str = match.group(1)
            if duration_str == 'forever':
                return "Vĩnh viễn"
            
            duration_days = int(duration_str)
            expiry_date = latest_log.created_time + timedelta(days=duration_days)
            remaining = expiry_date - timezone.now()

            if remaining.total_seconds() <= 0:
                return "Đã hết hạn"
            
            days = remaining.days
            hours = remaining.seconds // 3600
            
            result = []
            if days > 0:
                result.append(f"{days} ngày")
            if hours > 0:
                result.append(f"{hours} giờ")
            
            return " ".join(result) if result else "Dưới 1 giờ"
            
        except Exception:
            return "Lỗi tính toán"

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