from django.utils import timezone
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response

# Import các ViewSet từ các file modular mà chúng ta đã tách
from .user_views import UserViewSet
from .report_views import PostViewSet, ScamCategoryViewSet
from .notification_views import NotificationViewSet

from api.models import (
    ContentReport, Notification, TargetType, Post, Comment
)
from api.serializers.interact_serializers import (
    ContentReportSerializer, ContentReportCreateSerializer
)
from api.permissions import IsAdminRole

# NOTE VAN DAP:
# moderation_views.py chứa ContentReportViewSet xử lý báo cáo vi phạm.
# Báo cáo (ContentReport) có 3 trạng thái:
#   - PENDING   : vừa được gửi, chưa admin xử lý.
#   - PROCESSED : admin đã xác nhận và xử lý.
#   - DISMISSED : admin bác bỏ, không xử lý.
# User thường chỉ được gửi báo cáo (POST); Admin mới xem list và xử lý.

# ========================================================
# CONTENT REPORT VIEW
# ========================================================

class ContentReportViewSet(viewsets.ModelViewSet):
    """
    Quản lý báo cáo vi phạm nội dung (UC 3.x).
    URL: /api/reports/
    - POST   : user gửi báo cáo (IsAuthenticated).
    - GET/action: chỉ Admin xem và xử lý (IsAdminRole).
    """
    queryset = ContentReport.objects.all().select_related('reporter_user').order_by('-reported_time')
    http_method_names = ['get', 'post', 'head', 'options']  # chặn PUT/PATCH/DELETE trực tiếp.

    def get_serializer_class(self):
        # User gửi báo cáo dùng CreateSerializer (chỉ cần target_type, target_id, reason).
        # Admin xem list dùng Serializer đầy đủ có thông tin reporter, processing_status.
        if self.action == 'create':
            return ContentReportCreateSerializer
        return ContentReportSerializer

    def get_permissions(self):
        # Tách quyền theo action: gửi báo cáo chỉ cần đăng nhập; xem/xử lý phải là Admin.
        if self.action == 'create':
            return [permissions.IsAuthenticated()]
        return [IsAdminRole()]

    def get_queryset(self):
        """
        Hỗ trợ lọc báo cáo theo:
        - ?status=PENDING|PROCESSED|DISMISSED
        - ?target_type=POST|COMMENT|USER
        """
        qs = ContentReport.objects.all().select_related('reporter_user').order_by('-reported_time')
        status_filter = self.request.query_params.get('status', None)
        if status_filter:
            qs = qs.filter(processing_status=status_filter.upper())  # match với enum ProcessStatus.
        target_type = self.request.query_params.get('target_type', None)
        if target_type:
            qs = qs.filter(target_type=target_type.upper())  # lọc theo loại đối tượng bị báo cáo.
        return qs

    def perform_create(self, serializer):
        # Tự động gán reporter_user = user đang đăng nhập.
        serializer.save(reporter_user=self.request.user)

    @action(detail=True, methods=['post'], permission_classes=[IsAdminRole], url_path='dismiss')
    def dismiss(self, request, pk=None):
        """Bác bỏ báo cáo: PENDING → DISMISSED. Admin không xử lý báo cáo này."""
        report = self.get_object()
        report.processing_status = ContentReport.ProcessStatus.DISMISSED
        report.save()
        return Response({'detail': 'Báo cáo đã bị bác bỏ.', 'report': ContentReportSerializer(report).data})

    @action(detail=True, methods=['post'], permission_classes=[IsAdminRole], url_path='process')
    def process(self, request, pk=None):
        """Xác nhận đã xử lý: PENDING → PROCESSED. Admin đã kiểm tra và thực hiện hành động tương ứng."""
        report = self.get_object()
        report.processing_status = ContentReport.ProcessStatus.PROCESSED
        report.save()
        return Response({'detail': 'Đánh dấu đã xử lý.', 'report': ContentReportSerializer(report).data})
