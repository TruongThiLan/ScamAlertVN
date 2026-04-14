from django.utils import timezone
from django.db import models
from datetime import timedelta
import re

from rest_framework import viewsets, permissions, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import (
    User, Post, ScamCategory, Comment,
    ContentReport, Notification, TargetType, ActivityLog
)

from .serializers import (
    UserSerializer, UserBriefSerializer,
    PostSerializer, PostModerationSerializer,
    ApprovePostSerializer, RejectPostSerializer,
    HidePostSerializer, LockPostSerializer, AdminDeletePostSerializer,
    ScamCategorySerializer,
    CommentSerializer,
    ContentReportSerializer, ContentReportCreateSerializer,
)

from .permissions import IsAdminRole, IsAdminOrReadOnly


# ========================================================
# HELPER
# ========================================================

def _send_notification(user: User, message: str):
    Notification.objects.create(user=user, content=message)


def _mark_reviewed(post: Post, admin_user: User, reason: str = None):
    post.reviewed_by = admin_user
    post.reviewed_at = timezone.now()
    if reason:
        post.rejection_reason = reason


# ========================================================
# USER VIEW
# ========================================================

class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all().select_related('role')
    serializer_class = UserSerializer
    permission_classes = [permissions.AllowAny]

    def list(self, request, *args, **kwargs):
        self._auto_unlock_expired_users()
        return super().list(request, *args, **kwargs)

    def _auto_unlock_expired_users(self):
        banned_users = User.objects.filter(status=User.UserStatus.BANNED)
        for user in banned_users:
            latest_log = ActivityLog.objects.filter(
                action__contains=f"target={user.username}"
            ).filter(
                models.Q(action__contains="LOCK_INFO") |
                models.Q(action__contains="UNLOCK_INFO")
            ).order_by('-created_time').first()

            if not latest_log or "UNLOCK_INFO" in latest_log.action:
                continue

            match = re.search(r"duration=([^ \],]+)", latest_log.action)
            if not match:
                continue

            duration_str = match.group(1)
            if duration_str == 'forever':
                continue

            try:
                duration_days = int(duration_str)
                expiry_date = latest_log.created_time + timedelta(days=duration_days)
                if timezone.now() >= expiry_date:
                    user.status = User.UserStatus.ACTIVE
                    user.save(update_fields=['status'])
            except:
                continue

    @action(detail=False, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def me(self, request):
        serializer = self.get_serializer(request.user)
        return Response(serializer.data)

    # ===== giữ logic của bạn =====
    @action(detail=True, methods=['post'])
    def lock(self, request, pk=None):
        user = self.get_object()
        user.status = User.UserStatus.BANNED
        user.save()

        admin_user = request.user if request.user.is_authenticated else User.objects.get(pk=1)
        reason = request.data.get('reason', 'Không có lý do')
        duration = request.data.get('duration', '3')

        ActivityLog.objects.create(
            user=admin_user,
            action=f"[LOCK_INFO:target={user.username},duration={duration}]"
        )
        return Response({'status': 'user locked'})

    @action(detail=True, methods=['post'])
    def unlock(self, request, pk=None):
        user = self.get_object()
        user.status = User.UserStatus.ACTIVE
        user.save()

        admin_user = request.user if request.user.is_authenticated else User.objects.get(pk=1)

        ActivityLog.objects.create(
            user=admin_user,
            action=f"[UNLOCK_INFO:target={user.username}]"
        )
        return Response({'status': 'user unlocked'})

    @action(detail=True, methods=['post'])
    def warn(self, request, pk=None):
        user = self.get_object()
        user.status = User.UserStatus.WARNING
        user.save()

        admin_user = request.user if request.user.is_authenticated else User.objects.get(pk=1)

        ActivityLog.objects.create(
            user=admin_user,
            action=f"Cảnh báo {user.username}"
        )
        return Response({'status': 'user warned'})


# ========================================================
# SCAM CATEGORY VIEW
# ========================================================

class ScamCategoryViewSet(viewsets.ModelViewSet):
    queryset = ScamCategory.objects.all()
    serializer_class = ScamCategorySerializer
    permission_classes = [IsAdminOrReadOnly]


# ========================================================
# POST VIEW (GIỮ NGUYÊN CODE MAIN)
# ========================================================

class PostViewSet(viewsets.ModelViewSet):
    queryset = Post.objects.all().select_related('user', 'category', 'reviewed_by')
    serializer_class = PostSerializer
    permission_classes = [permissions.AllowAny]

    def _is_admin(self):
        user = self.request.user
        return user and user.is_authenticated and (
            user.is_staff or (user.role and user.role.role_name == 'Admin')
        )

    @action(detail=False, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def mine(self, request):
        posts = Post.objects.filter(user=request.user)
        serializer = PostSerializer(posts, many=True)
        return Response(serializer.data)