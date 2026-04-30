
# # ============================================================
# # interact_urls.py
# # Chức năng: URL routing cho Tương tác & Phản hồi (UC 10.1 – 10.4)
# # Author   : Thảo B
# #
# # Include file này vào urls.py chính (moderation_urls.py hoặc urls.py gốc):
# #   path('api/', include('api.interact_urls')),
# # ============================================================
#
# from django.urls import path, include
# from rest_framework.routers import DefaultRouter
# from api.views.interact_views import (
#     CommentViewSet,
#     ContentReportViewSet,
#     ReactionViewSet,
#     BookmarkViewSet,
#     PostShareViewSet,
# )
#
# router = DefaultRouter()
#
# # UC 10.2 – Bình luận bài viết & Phản hồi bình luận
# # → GET    /api/comments/?post=<id>       : lấy comment của bài viết (kèm replies lồng)
# # → POST   /api/comments/                 : tạo comment mới (gốc hoặc reply)
# # → GET    /api/comments/<id>/replies/    : lấy danh sách reply của 1 comment
# # → PUT    /api/comments/<id>/            : sửa comment
# # → DELETE /api/comments/<id>/            : xóa comment
# router.register(r'comments', CommentViewSet, basename='comment')
#
# # UC 10.4 – Báo cáo bài viết / bình luận
# # → POST   /api/reports/                  : User gửi báo cáo mới
# # → GET    /api/reports/                  : Admin xem tất cả báo cáo
# # → POST   /api/reports/<id>/dismiss/     : Admin bác bỏ báo cáo
# # → POST   /api/reports/<id>/process/     : Admin xác nhận báo cáo có căn cứ (cộng/trừ điểm)
# router.register(r'reports', ContentReportViewSet, basename='report')
#
# # UC 10.3 – Like / Unlike bài viết và bình luận
# # → POST   /api/reactions/toggle/         : Toggle like/unlike
# # → GET    /api/reactions/my-reactions/   : Lấy list id đã like (để FE render trạng thái nút)
# router.register(r'reactions', ReactionViewSet, basename='reaction')
#
# # Bookmark (lưu bài viết)
# # → POST   /api/bookmarks/toggle/         : Toggle bookmark
# # → GET    /api/bookmarks/mine/           : Danh sách bài viết đã bookmark
# router.register(r'bookmarks', BookmarkViewSet, basename='bookmark')
#
# # UC 10.1 – Chia sẻ bài viết
# # → GET    /api/shares/<id>/share/        : Lấy share URL của bài viết
# router.register(r'shares', PostShareViewSet, basename='share')
#
# urlpatterns = [
#     path('', include(router.urls)),
# ]
