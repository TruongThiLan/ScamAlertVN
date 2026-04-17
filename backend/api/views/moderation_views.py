# moderation views
from rest_framework import viewsets, permissions

class ContentReportViewSet(viewsets.ModelViewSet):
    """ViewSet để kiểm duyệt các báo cáo nội dung (Nguyệt thực hiện)."""
    # queryset = ...
    # serializer_class = ...
    permission_classes = [permissions.IsAuthenticated]
    pass
