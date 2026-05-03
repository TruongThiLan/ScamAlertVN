from django.db import models
from django.contrib.auth.models import AbstractUser
from django.core.validators import MinValueValidator

# NOTE VAN DAP:
# models.py dinh nghia schema database cua toan he thong.
# Luong chinh cua du lieu:
# User -> Post -> Comment/Reaction/Bookmark/ContentReport.
# Admin xu ly Post se tao Notification, AuditLog va co the thay doi ReputationHistory.

# ==========================================
# CORE TABLES
# ==========================================

class Role(models.Model):
    # Bang Role luu vai tro cua user, vi du: Admin hoac User.
    role_name = models.CharField(max_length=50, unique=True)
    description = models.TextField(null=True, blank=True)

    def __str__(self):
        return self.role_name


class User(AbstractUser):
    # Ke thua AbstractUser de giu san username/password/is_staff,
    # sau do mo rong them email unique, status, role va diem uy tin.
    class UserStatus(models.TextChoices):
        ACTIVE = 'active', 'Active'
        INACTIVE = 'inactive', 'Inactive'
        BANNED = 'banned', 'Banned'
        WARNING = 'warning', 'Warning'

    email = models.EmailField(unique=True)  # email unique de khong bi trung tai khoan.

    # Trang thai tai khoan: active, banned, inactive hoac warning.
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

    # Hai moc thoi gian phuc vu admin xem user tao/cap nhat luc nao.
    created_date = models.DateTimeField(auto_now_add=True)
    updated_date = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.username


class ScamCategory(models.Model):
    # Bang danh muc cac kieu lua dao de gan vao bai viet.
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
    # Post la bang trung tam: user dang bai, admin duyet, frontend public chi hien APPROVED.
    class PostStatus(models.TextChoices):
        PENDING = 'PENDING', 'Pending'
        APPROVED = 'APPROVED', 'Approved'
        REJECTED = 'REJECTED', 'Rejected'
        HIDDEN = 'HIDDEN', 'Hidden'
        LOCKED = 'LOCKED', 'Locked'

    class AIAnalysisStatus(models.TextChoices):
        NOT_ANALYZED = 'NOT_ANALYZED', 'Not analyzed'
        PROCESSING = 'PROCESSING', 'Processing'
        COMPLETED = 'COMPLETED', 'Completed'
        FAILED = 'FAILED', 'Failed'

    title = models.CharField(max_length=255)  # tieu de bai canh bao.
    content = models.TextField()  # noi dung chi tiet user viet.

    # created_time la luc user tao; published_time chi co khi admin duyet.
    created_time = models.DateTimeField(auto_now_add=True)
    updated_time = models.DateTimeField(auto_now=True)
    published_time = models.DateTimeField(null=True, blank=True)

    status = models.CharField(  # trang thai kiem duyet cua bai.
        max_length=20,
        choices=PostStatus.choices,
        default=PostStatus.PENDING
    )

    is_anonymous = models.BooleanField(  # true thi public khong thay tac gia that.
        default=False,
        help_text='Nếu true, thông tin tác giả sẽ bị ẩn trên giao diện public'
    )



    user = models.ForeignKey(  # tac gia bai viet.
        User,
        on_delete=models.CASCADE,
        related_name='posts'
    )

    category = models.ForeignKey(  # danh muc lua dao cua bai.
        ScamCategory,
        on_delete=models.SET_NULL,
        null=True,
        related_name='posts'
    )

    # --- Tracking kiểm duyệt ---
    rejection_reason = models.TextField(  # ly do admin tu choi/an/khoa/xoa.
        null=True, blank=True,
        help_text='Lý do từ chối / ẩn / khóa / xóa'
    )
    reviewed_by = models.ForeignKey(  # admin da xu ly bai nay.
        User,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='reviewed_posts',
        help_text='Admin đã xử lý bài viết này'
    )
    reviewed_at = models.DateTimeField(  # thoi diem admin xu ly.
        null=True, blank=True,
        help_text='Thời điểm Admin xử lý'
    )
    ai_analysis_status = models.CharField(  # trang thai chay AI: chua chay/dang chay/xong/loi.
        max_length=20,
        choices=AIAnalysisStatus.choices,
        default=AIAnalysisStatus.NOT_ANALYZED,
        help_text='Trang thai phan tich noi dung bang AI'
    )
    ai_analysis_result = models.JSONField(  # JSON goi y AI hien cho admin.
        null=True, blank=True,
        help_text='Ket qua goi y AI dang JSON cho Admin'
    )
    ai_analysis_provider = models.CharField(  # ten nguon AI: openai, gemini hoac local.
        max_length=30,
        blank=True,
        default='',
        help_text='Nguon phan tich: openai, gemini, local'
    )
    ai_analysis_error = models.TextField(  # luu loi neu goi AI that bai.
        blank=True,
        default='',
        help_text='Loi khi goi API AI, neu co'
    )
    ai_analyzed_at = models.DateTimeField(  # lan phan tich AI gan nhat.
        null=True, blank=True,
        help_text='Thoi diem phan tich AI gan nhat'
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
    # Comment gan voi Post, co parent_comment de tao reply long nhau.
    class CommentStatus(models.TextChoices):
        ACTIVE = 'ACTIVE', 'Active'
        HIDDEN = 'HIDDEN', 'Hidden'

    content = models.TextField()  # noi dung comment/reply.
    created_time = models.DateTimeField(auto_now_add=True)
    # Backend tu set an danh cho comment, frontend khong gui field nay.
    is_anonymous = models.BooleanField(default=False, help_text='True khi tác giả bình luận vào chính bài viết ẩn danh của mình. '
            'Server tự set — FE không gửi trường này.')

    status = models.CharField(
        max_length=20,
        choices=CommentStatus.choices,
        default=CommentStatus.ACTIVE
    )

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='comments')  # nguoi viet comment.
    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name='comments')  # comment thuoc bai nao.

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
    # Moi dong Bookmark nghia la 1 user da luu 1 bai viet.
    created_time = models.DateTimeField(auto_now_add=True)

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='bookmarks')
    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name='bookmarked_by')

    class Meta:
        constraints = [
            # Chan viec mot user luu trung cung mot bai.
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
    USER = 'USER', 'User'


class Reaction(models.Model):
    # Reaction dung cap target_type + target_id de like duoc nhieu loai doi tuong
    # (POST hoac COMMENT) ma khong can tao rieng bang PostLike/CommentLike.
    class ReactionType(models.TextChoices):
        UPVOTE = 'UPVOTE', 'Upvote'
        DOWNVOTE = 'DOWNVOTE', 'Downvote'

    reaction_type = models.CharField(
        max_length=20,
        choices=ReactionType.choices,
        default=ReactionType.DOWNVOTE
    )
    target_type = models.CharField(max_length=20, choices=TargetType.choices)  # POST/COMMENT.
    target_id = models.IntegerField()  # id cua post/comment duoc like.

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
    # ContentReport la phieu bao cao vi pham. target_type/target_id cho phep report
    # post, comment hoac user bang cung mot bang.
    class ProcessStatus(models.TextChoices):
        PENDING = 'PENDING', 'Pending'
        PROCESSED = 'PROCESSED', 'Processed'
        DISMISSED = 'DISMISSED', 'Dismissed'

    reason = models.CharField(max_length=255)  # ly do user gui bao cao.
    reported_time = models.DateTimeField(auto_now_add=True)

    processing_status = models.CharField(  # PENDING/PROCESSED/DISMISSED.
        max_length=20,
        choices=ProcessStatus.choices,
        default=ProcessStatus.PENDING
    )

    target_type = models.CharField(max_length=20, choices=TargetType.choices)  # dang bao cao POST/COMMENT/USER.
    target_id = models.IntegerField()  # id cua doi tuong bi bao cao.

    reporter_user = models.ForeignKey(  # nguoi gui bao cao.
        User,
        on_delete=models.CASCADE,
        related_name='reports_submitted'
    )

    class Meta:
        indexes = [
            models.Index(fields=['target_type', 'target_id'])
        ]


class Media(models.Model):
    # Media luu thong tin file upload, TargetMedia se gan file nay vao post/comment.
    class MediaType(models.TextChoices):
        IMAGE = 'IMAGE', 'Image'
        VIDEO = 'VIDEO', 'Video'
        DOCUMENT = 'DOCUMENT', 'Document'

    url = models.URLField()  # duong dan file de frontend hien anh/video.
    media_type = models.CharField(max_length=20, choices=MediaType.choices)  # loai file.

    created_time = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.url


class TargetMedia(models.Model):
    # TargetMedia la bang lien ket anh/video/document voi Post hoac Comment.
    # Media giu URL file, TargetMedia noi file do thuoc ve doi tuong nao.
    media = models.ForeignKey(Media, on_delete=models.CASCADE, related_name='targets')

    target_type = models.CharField(max_length=20, choices=TargetType.choices)  # file nay thuoc POST hay COMMENT.
    target_id = models.IntegerField()  # id cua post/comment.

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
    # Thong bao hien cho user khi co duyet bai, tu choi, khoa tai khoan...
    content = models.CharField(max_length=255)
    is_read = models.BooleanField(default=False)  # user doc thong bao chua.

    created_time = models.DateTimeField(auto_now_add=True)

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')

    class Meta:
        ordering = ['-created_time']
        indexes = [models.Index(fields=['user'])]


class ActivityLog(models.Model):
    action = models.CharField(max_length=255)  # mo ta hanh dong admin/he thong da lam.
    created_time = models.DateTimeField(auto_now_add=True)

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='activity_logs')

    class Meta:
        ordering = ['-created_time']
        indexes = [models.Index(fields=['user'])]


class ReputationHistory(models.Model):
    # Luu lich su cong/tru diem uy tin de user xem lai.
    action_type = models.CharField(max_length=255)
    score_change = models.IntegerField()  # so diem cong hoac tru.

    created_time = models.DateTimeField(auto_now_add=True)

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='reputation_histories')

    class Meta:
        verbose_name_plural = 'Reputation Histories'
        ordering = ['-created_time']
        indexes = [models.Index(fields=['user'])]


class AuditLog(models.Model):
    """Bảng ghi nhật ký các thao tác quan trọng của Admin (Duyệt/Khóa/Xóa)."""
    action = models.CharField(max_length=50) # APPROVE, REJECT, LOCK, HIDE, DELETE
    admin_user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='audit_logs')  # admin thuc hien.
    target_post = models.ForeignKey(Post, on_delete=models.SET_NULL, null=True, related_name='audit_logs')  # bai bi tac dong.
    reason = models.TextField(null=True, blank=True)  # ly do neu co.
    created_time = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_time']


class Blacklist(models.Model):
    """Danh sách từ khóa bị cấm trong tiêu đề/nội dung."""
    keyword = models.CharField(max_length=100, unique=True)  # tu khoa cam khi tao bai.
    created_time = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.keyword
