from django.db import models
from django.contrib.auth.models import AbstractUser
from django.core.validators import MinValueValidator

# ==========================================
# CORE TABLES
# ==========================================

class Role(models.Model):
    role_name = models.CharField(max_length=50, unique=True)
    description = models.TextField(null=True, blank=True)

    def __str__(self):
        return self.role_name


class User(AbstractUser):
    class UserStatus(models.TextChoices):
        ACTIVE = 'active', 'Active'
        INACTIVE = 'inactive', 'Inactive'
        BANNED = 'banned', 'Banned'
        WARNING = 'warning', 'Warning'

    email = models.EmailField(unique=True)

    status = models.CharField(
        max_length=20,
        choices=UserStatus.choices,
        default=UserStatus.ACTIVE
    )

    role = models.ForeignKey(
        Role,
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name='users'
    )

    reputation_score = models.IntegerField(
        default=0,
        validators=[MinValueValidator(0)]
    )

    created_date = models.DateTimeField(auto_now_add=True)
    updated_date = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.username


class ScamCategory(models.Model):
    category_name = models.CharField(max_length=100, unique=True)
    description = models.TextField(null=True, blank=True)

    class Meta:
        verbose_name_plural = 'Scam Categories'

    def __str__(self):
        return self.category_name


# ==========================================
# POST & COMMENT
# ==========================================

class Post(models.Model):
    class PostStatus(models.TextChoices):
        PENDING = 'PENDING', 'Pending'
        APPROVED = 'APPROVED', 'Approved'
        REJECTED = 'REJECTED', 'Rejected'

    title = models.CharField(max_length=255)
    content = models.TextField()

    created_time = models.DateTimeField(auto_now_add=True)
    updated_time = models.DateTimeField(auto_now=True)
    published_time = models.DateTimeField(null=True, blank=True)

    status = models.CharField(
        max_length=20,
        choices=PostStatus.choices,
        default=PostStatus.PENDING
    )

    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='posts'
    )

    category = models.ForeignKey(
        ScamCategory,
        on_delete=models.SET_NULL,
        null=True,
        related_name='posts'
    )

    class Meta:
        ordering = ['-created_time']
        # Đánh index tường minh cho ForeignKey theo yêu cầu
        indexes = [
            models.Index(fields=['user']),
            models.Index(fields=['category']),
        ]

    def __str__(self):
        return self.title


class Comment(models.Model):
    class CommentStatus(models.TextChoices):
        ACTIVE = 'ACTIVE', 'Active'
        HIDDEN = 'HIDDEN', 'Hidden'

    content = models.TextField()
    created_time = models.DateTimeField(auto_now_add=True)

    status = models.CharField(
        max_length=20,
        choices=CommentStatus.choices,
        default=CommentStatus.ACTIVE
    )

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='comments')
    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name='comments')

    # Đổi sang CASCADE để giống logic Facebook (Xóa cha mất con)
    parent_comment = models.ForeignKey(
        'self',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='replies'
    )

    class Meta:
        ordering = ['-created_time']
        # Đánh index tường minh cho ForeignKey theo yêu cầu
        indexes = [
            models.Index(fields=['user']),
            models.Index(fields=['post']),
        ]

    def __str__(self):
        return f"Comment {self.id}"


# ==========================================
# BOOKMARK
# ==========================================

class Bookmark(models.Model):
    created_time = models.DateTimeField(auto_now_add=True)

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='bookmarks')
    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name='bookmarked_by')

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=['user', 'post'], name='unique_user_bookmark')
        ]
        # Đánh index tường minh cho ForeignKey theo yêu cầu
        indexes = [
            models.Index(fields=['user']),
            models.Index(fields=['post']),
        ]

    def __str__(self):
        return f"{self.user} - {self.post}"


# ==========================================
# POLYMORPHIC BASE & MODELS
# ==========================================

class TargetType(models.TextChoices):
    POST = 'POST', 'Post'
    COMMENT = 'COMMENT', 'Comment'


class Reaction(models.Model):
    class ReactionType(models.TextChoices):
        UPVOTE = 'UPVOTE', 'Upvote'
        DOWNVOTE = 'DOWNVOTE', 'Downvote'

    reaction_type = models.CharField(max_length=20, choices=ReactionType.choices)
    target_type = models.CharField(max_length=20, choices=TargetType.choices)
    target_id = models.IntegerField()

    created_time = models.DateTimeField(auto_now_add=True)

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='reactions')

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=['user', 'target_type', 'target_id'],
                name='unique_user_reaction'
            )
        ]
        indexes = [
            models.Index(fields=['target_type', 'target_id'])
        ]


class ContentReport(models.Model):
    class ProcessStatus(models.TextChoices):
        PENDING = 'PENDING', 'Pending'
        PROCESSED = 'PROCESSED', 'Processed'
        DISMISSED = 'DISMISSED', 'Dismissed'

    reason = models.CharField(max_length=255)
    reported_time = models.DateTimeField(auto_now_add=True)

    processing_status = models.CharField(
        max_length=20,
        choices=ProcessStatus.choices,
        default=ProcessStatus.PENDING
    )

    target_type = models.CharField(max_length=20, choices=TargetType.choices)
    target_id = models.IntegerField()

    reporter_user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='reports_submitted'
    )

    class Meta:
        indexes = [
            models.Index(fields=['target_type', 'target_id'])
        ]


class Media(models.Model):
    class MediaType(models.TextChoices):
        IMAGE = 'IMAGE', 'Image'
        VIDEO = 'VIDEO', 'Video'
        DOCUMENT = 'DOCUMENT', 'Document'

    url = models.URLField()
    media_type = models.CharField(max_length=20, choices=MediaType.choices)

    created_time = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.url


class TargetMedia(models.Model):
    media = models.ForeignKey(Media, on_delete=models.CASCADE, related_name='targets')

    target_type = models.CharField(max_length=20, choices=TargetType.choices)
    target_id = models.IntegerField()

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=['media', 'target_type', 'target_id'],
                name='unique_media_target'
            )
        ]
        indexes = [
            models.Index(fields=['target_type', 'target_id'])
        ]


# ==========================================
# NOTIFICATION, LOGS & REPUTATION
# ==========================================

class Notification(models.Model):
    content = models.CharField(max_length=255)
    is_read = models.BooleanField(default=False)

    created_time = models.DateTimeField(auto_now_add=True)

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')

    class Meta:
        ordering = ['-created_time']
        indexes = [models.Index(fields=['user'])]


class ActivityLog(models.Model):
    action = models.CharField(max_length=255)
    created_time = models.DateTimeField(auto_now_add=True)

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='activity_logs')

    class Meta:
        ordering = ['-created_time']
        indexes = [models.Index(fields=['user'])]


class ReputationHistory(models.Model):
    action_type = models.CharField(max_length=255)
    score_change = models.IntegerField()

    created_time = models.DateTimeField(auto_now_add=True)

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='reputation_histories')

    class Meta:
        verbose_name_plural = 'Reputation Histories'
        ordering = ['-created_time']
        indexes = [models.Index(fields=['user'])]