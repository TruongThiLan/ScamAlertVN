import re
from rest_framework import serializers

from django.db import models
from django.utils import timezone
from datetime import timedelta
from ..models import User, ActivityLog, ContentReport, Post, Comment, Notification, ReputationHistory

# NOTE VAN DAP:
# UserSerializer phuc vu admin xem/loc user. UserProfileSerializer va
# ChangePasswordSerializer phuc vu tai khoan dang dang nhap. Cac field tinh toan
# nhu report_count/remaining_lock_time khong co trong DB ma duoc tinh luc serialize.

class UserSerializer(serializers.ModelSerializer):
    """
    Serializer cho model User, bao gồm các trường thông tin cơ bản
    và các trường tính toán (SerializerMethodField) cho admin.
    """
    remaining_lock_time = serializers.SerializerMethodField()  # thoi gian khoa con lai, tinh tu ActivityLog.
    password = serializers.CharField(write_only=True)  # chi nhan luc tao user, khong tra password ve FE.
    report_count = serializers.SerializerMethodField()  # tong so lan user bi bao cao.
    role_name = serializers.SerializerMethodField()  # ten role de FE biet admin/user.

    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'password', 'reputation_score', 
            'status', 'created_date', 'remaining_lock_time', 'report_count', 'role_name', 'is_staff'
        ]
        extra_kwargs = {'password': {'write_only': True}}

    def get_role_name(self, obj):
        """Lấy tên vai trò từ quan hệ ForeignKey Role hoặc kiểm tra superuser."""
        if obj.is_superuser:  # superuser Django duoc xem nhu Admin.
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
        # Dem report tren cac bai viet cua user nay.
        post_reports = ContentReport.objects.filter(
            target_type='POST', 
            target_id__in=Post.objects.filter(user=obj).values_list('id', flat=True)
        ).count()
        
        # Dem report tren cac binh luan cua user nay.
        comment_reports = ContentReport.objects.filter(
            target_type='COMMENT',
            target_id__in=Comment.objects.filter(user=obj).values_list('id', flat=True)
        ).count()

        # Dem report truc tiep vao chinh tai khoan user.
        user_reports = ContentReport.objects.filter(
            target_type='USER',
            target_id=obj.id,
        ).count()
        
        return post_reports + comment_reports + user_reports

    def get_remaining_lock_time(self, obj):
        """
        Tính toán thời gian còn lại trước khi tài khoản được mở khóa (UC 2.1).
        Hệ thống quét ActivityLog để tìm lần khóa gần nhất.
        """
        if obj.status != 'banned':
            return None
        
        # Tìm log khóa/mở khóa mới nhất của user này
        # Flow tinh thoi gian khoa:
        # 1. Tim ActivityLog khoa/mo khoa gan nhat cua user.
        # 2. Parse duration tu chuoi action.
        # 3. Lay created_time + duration de tinh con bao lau.
        latest_log = ActivityLog.objects.filter(
            action__contains=f"target={obj.username}"
        ).filter(
            models.Q(action__contains="LOCK_INFO") | models.Q(action__contains="UNLOCK_INFO")
        ).order_by('-created_time').first()

        if not latest_log or "UNLOCK_INFO" in latest_log.action:  # neu da mo khoa thi khong con thoi gian khoa.
            return None

        try:
            import re
            # Lấy giá trị duration từ chuỗi log ghi trong DB
            match = re.search(r"duration=([^ \],]+)", latest_log.action)
            if not match:
                return "Không rõ"
            
            duration_str = match.group(1)  # so ngay khoa hoac "forever".
            if duration_str == 'forever':
                return "Vĩnh viễn"
            
            duration_days = int(duration_str)
            expiry_date = latest_log.created_time + timedelta(days=duration_days)  # ngay het han khoa.
            remaining = expiry_date - timezone.now()  # khoang thoi gian con lai.

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


class UserPublicProfileSerializer(serializers.ModelSerializer):
    """Thong tin cong khai cho trang ho so tac gia."""

    class Meta:
        model = User
        fields = ['id', 'username', 'status', 'reputation_score', 'created_date']
        read_only_fields = fields


class ReputationHistorySerializer(serializers.ModelSerializer):
    """Lich su thay doi diem uy tin cua mot user."""

    class Meta:
        model = ReputationHistory
        fields = ['id', 'action_type', 'score_change', 'created_time', 'user']
        read_only_fields = fields


class UserProfileSerializer(serializers.ModelSerializer):
    """Cap nhat thong tin ca nhan cua user dang dang nhap."""

    class Meta:
        model = User
        fields = ['id', 'username', 'email']
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
        value = value.strip()  # bo khoang trang dau/cuoi truoc khi kiem tra.
        if not value:
            raise serializers.ValidationError('Tên đăng nhập không được để trống.')
        if len(value) < 6 or len(value) > 20:
            raise serializers.ValidationError('Tên đăng nhập phải có độ dài từ 6 đến 20 ký tự.')
        if re.search(r'\s', value):
            raise serializers.ValidationError('Tên đăng nhập không được chứa khoảng trắng.')
        if not re.fullmatch(r'[A-Za-z0-9]+', value):
            raise serializers.ValidationError('Tên đăng nhập chỉ được bao gồm chữ cái và chữ số.')

        queryset = User.objects.filter(username__iexact=value)  # kiem tra trung username khong phan biet hoa thuong.
        if self.instance:
            queryset = queryset.exclude(pk=self.instance.pk)
        if queryset.exists():
            raise serializers.ValidationError('Tên đăng nhập đã tồn tại.')
        return value

    def validate_email(self, value):
        value = value.strip()
        if not value:
            raise serializers.ValidationError('Email không được để trống.')

        queryset = User.objects.filter(email__iexact=value)  # kiem tra trung email.
        if self.instance:
            queryset = queryset.exclude(pk=self.instance.pk)
        if queryset.exists():
            raise serializers.ValidationError('Email đã tồn tại.')
        return value


class ChangePasswordSerializer(serializers.Serializer):
    """Validate doi mat khau theo dung thong diep loi frontend can hien thi."""

    old_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(write_only=True)
    confirm_password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        user = self.context['request'].user  # user dang dang nhap doi mat khau.
        old_password = attrs.get('old_password', '')
        new_password = attrs.get('new_password', '')
        confirm_password = attrs.get('confirm_password', '')

        if not user.check_password(old_password):  # mat khau cu phai dung moi cho doi.
            raise serializers.ValidationError('Mật khẩu cũ không đúng. Vui lòng nhập lại.')

        has_letter = re.search(r'[A-Za-z]', new_password)  # co chu cai.
        has_number = re.search(r'\d', new_password)  # co chu so.
        has_special = re.search(r'[^A-Za-z0-9]', new_password)  # co ky tu dac biet.
        if len(new_password) < 8 or not has_letter or not has_number or not has_special:
            raise serializers.ValidationError(
                'Vui lòng nhập mật khẩu có tối thiểu 8 ký tự, bao gồm chữ, số và ký tự đặc biệt.'
            )

        if old_password == new_password:
            raise serializers.ValidationError('Mật khẩu mới không được trùng mật khẩu cũ.')

        if new_password != confirm_password:
            raise serializers.ValidationError('Mật khẩu mới không khớp. Vui lòng nhập lại.')

        return attrs
