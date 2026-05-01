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

# ========================================================
# CONTENT REPORT VIEW (Giữ tại đây vì là logic kiểm duyệt)
# ========================================================

class ContentReportViewSet(viewsets.ModelViewSet):
    """
    Quản lý báo cáo vi phạm nội dung (UC 3.x).
    """
    queryset = ContentReport.objects.all().select_related('reporter_user').order_by('-reported_time')
    http_method_names = ['get', 'post', 'head', 'options']

    def get_serializer_class(self):
        if self.action == 'create':
            return ContentReportCreateSerializer
        return ContentReportSerializer

    def get_permissions(self):
        if self.action == 'create':
            return [permissions.IsAuthenticated()]
        return [IsAdminRole()]

    def get_queryset(self):
        qs = ContentReport.objects.all().select_related('reporter_user').order_by('-reported_time')
        status_filter = self.request.query_params.get('status', None)
        if status_filter:
            qs = qs.filter(processing_status=status_filter.upper())
        target_type = self.request.query_params.get('target_type', None)
        if target_type:
            qs = qs.filter(target_type=target_type.upper())
        return qs

    def perform_create(self, serializer):
        serializer.save(reporter_user=self.request.user)

    @action(detail=True, methods=['post'], permission_classes=[IsAdminRole], url_path='dismiss')
    def dismiss(self, request, pk=None):
        report = self.get_object()
        report.processing_status = ContentReport.ProcessStatus.DISMISSED
        report.save()
        return Response({'detail': 'Báo cáo đã bị bác bỏ.', 'report': ContentReportSerializer(report).data})

    @action(detail=True, methods=['post'], permission_classes=[IsAdminRole], url_path='process')
    def process(self, request, pk=None):
        report = self.get_object()
        report.processing_status = ContentReport.ProcessStatus.PROCESSED
        report.save()
        return Response({'detail': 'Đánh dấu đã xử lý.', 'report': ContentReportSerializer(report).data})
