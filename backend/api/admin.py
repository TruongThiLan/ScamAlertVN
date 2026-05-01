from django.contrib import admin
from .models import (
    User, Role, ScamCategory, Post, Comment, Bookmark, Reaction, 
    ContentReport, Media, TargetMedia, Notification, ActivityLog, ReputationHistory
)

# [Chương 3] Tùy chỉnh các thuộc tính toàn cục của app Admin
admin.site.site_header = "Hệ Thống Quản Trị ScamAlert VN"
admin.site.site_title = "Admin Portal - ScamAlert"
admin.site.index_title = "Chào mừng đến với hệ thống quản lý ScamAlert VN"

# [Chương 3] Tùy chỉnh chức năng của các trang danh sách và form nhập
@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ('username', 'email', 'status', 'role', 'reputation_score', 'created_date')
    list_filter = ('status', 'role', 'is_staff', 'is_superuser')
    search_fields = ('username', 'email')
    readonly_fields = ('created_date', 'updated_date')
    ordering = ('-created_date',)

@admin.register(Post)
class PostAdmin(admin.ModelAdmin):
    list_display = ('title', 'user', 'status', 'ai_analysis_status', 'ai_analysis_provider', 'created_time')
    list_filter = ('status', 'ai_analysis_status', 'ai_analysis_provider', 'is_anonymous', 'created_time')
    search_fields = ('title', 'content', 'user__username')
    readonly_fields = ('created_time', 'updated_time', 'ai_analysis_result', 'ai_analysis_error', 'ai_analyzed_at')
    ordering = ('-created_time',)
    # [Chương 2] Tối ưu hóa truy vấn cho giao diện admin bằng select_related
    list_select_related = ('user',)

@admin.register(ScamCategory)
class ScamCategoryAdmin(admin.ModelAdmin):
    list_display = ('category_name',)
    search_fields = ('category_name', 'description')

@admin.register(ContentReport)
class ContentReportAdmin(admin.ModelAdmin):
    list_display = ('reporter_user', 'target_type', 'target_id', 'processing_status', 'reported_time')
    list_filter = ('processing_status', 'target_type', 'reported_time')
    search_fields = ('reason', 'reporter_user__username')
    readonly_fields = ('reported_time',)

# Đăng ký các model còn lại một cách cơ bản
admin.site.register([Role, Comment, Bookmark, Reaction, Media, TargetMedia, Notification, ActivityLog, ReputationHistory])
