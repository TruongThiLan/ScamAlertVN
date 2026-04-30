from rest_framework import serializers

from django.db import models
from django.utils import timezone
from datetime import timedelta
from ..models import User, ActivityLog, ContentReport, Post, Comment, Notification

class UserSerializer(serializers.ModelSerializer):
    """
    Serializer cho model User, bao gồm các trường thông tin cơ bản
    và các trường tính toán (SerializerMethodField) cho admin.
    """
    remaining_lock_time = serializers.SerializerMethodField()
    password = serializers.CharField(write_only=True)
    report_count = serializers.SerializerMethodField()
    role_name = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'password', 'reputation_score', 
            'status', 'created_date', 'remaining_lock_time', 'report_count', 'role_name'
        ]
        extra_kwargs = {'password': {'write_only': True}}

    def get_role_name(self, obj):
        """Lấy tên vai trò từ quan hệ ForeignKey Role hoặc kiểm tra superuser."""
        if obj.is_superuser:
            return "Admin"
        return obj.role.role_name if obj.role else "User"

    def create(self, validated_data):
        """Ghi đè phương thức create để sử dụng create_user (mã hóa mật khẩu)."""
        return User.objects.create_user(**validated_data)

    def get_report_count(self, obj):
        """
        Tính tổng số lượt bị báo cáo vi phạm của người dùng này
        (bao gồm báo cáo trên bài viết và báo cáo trên bình luận).
        """
        post_reports = ContentReport.objects.filter(
            target_type='POST', 
            target_id__in=Post.objects.filter(user=obj).values_list('id', flat=True)
        ).count()
        
        comment_reports = ContentReport.objects.filter(
            target_type='COMMENT',
            target_id__in=Comment.objects.filter(user=obj).values_list('id', flat=True)
        ).count()
        
        return post_reports + comment_reports

    def get_remaining_lock_time(self, obj):
        """
        Tính toán thời gian còn lại trước khi tài khoản được mở khóa (UC 2.1).
        Hệ thống quét ActivityLog để tìm lần khóa gần nhất.
        """
        if obj.status != 'banned':
            return None
        
        # Tìm log khóa/mở khóa mới nhất của user này
        latest_log = ActivityLog.objects.filter(
            action__contains=f"target={obj.username}"
        ).filter(
            models.Q(action__contains="LOCK_INFO") | models.Q(action__contains="UNLOCK_INFO")
        ).order_by('-created_time').first()

        if not latest_log or "UNLOCK_INFO" in latest_log.action:
            return None

        try:
            import re
            # Lấy giá trị duration từ chuỗi log ghi trong DB
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
class UserBriefSerializer(serializers.ModelSerializer):
    """Thông tin tóm tắt user, dùng lồng vào Post/Comment."""
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'reputation_score']
