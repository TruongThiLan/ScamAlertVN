from rest_framework import viewsets, status
from rest_framework.response import Response
from api.models import ScamCategory
from api.serializers import ScamCategorySerializer
from api.permissions import IsAdminOrReadOnly

# NOTE VAN DAP:
# ScamCategoryViewSet quan ly danh muc lua dao.
# User/khach duoc GET de hien sidebar; admin moi duoc them/sua/xoa.

class ScamCategoryViewSet(viewsets.ModelViewSet):
    """
    UC 4.1 — Quản lý danh mục lừa đảo.
    - GET (list/retrieve): Mọi người xem được.
    - POST/PUT/PATCH/DELETE: Chỉ Admin.
    """
    queryset = ScamCategory.objects.all()
    serializer_class = ScamCategorySerializer
    permission_classes = [IsAdminOrReadOnly]

    def destroy(self, request, *args, **kwargs):
        """Không cho xóa danh mục nếu đang có bài viết liên kết."""
        instance = self.get_object()
        if instance.posts.exists():
            return Response(
                {
                    'detail': (
                        f'Không thể xóa danh mục "{instance.category_name}" '
                        f'vì đang có {instance.posts.count()} bài viết sử dụng.'
                    )
                },
                status=status.HTTP_400_BAD_REQUEST
            )
        return super().destroy(request, *args, **kwargs)
