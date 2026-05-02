# -*- coding: utf-8 -*-
import random
import unicodedata
from datetime import timedelta

from django.core.management.base import BaseCommand
from django.db import IntegrityError, transaction
from django.utils import timezone

from api.models import (
    ActivityLog,
    AuditLog,
    Blacklist,
    Bookmark,
    Comment,
    ContentReport,
    Notification,
    Post,
    Reaction,
    ReputationHistory,
    Role,
    ScamCategory,
    TargetType,
    User,
)


DEMO_USERNAMES = [
    "demo_anhminh",
    "demo_baongoc",
    "demo_hoangnam",
    "demo_linhchi",
    "demo_quanghuy",
    "demo_thaovy",
    "demo_tuananh",
    "demo_maiphuong",
    "demo_khanhduy",
    "demo_thanhtruc",
    "demo_vietanh",
    "demo_ngocanh",
]

CATEGORIES = [
    (
        "Lừa đảo qua điện thoại",
        "Các cuộc gọi giả danh công an, ngân hàng, bưu điện hoặc người thân để chiếm đoạt tiền.",
    ),
    (
        "Lừa đảo đầu tư",
        "Chiêu trò kêu gọi góp vốn, chứng khoán, tiền ảo, nhiệm vụ nhận hoa hồng bất thường.",
    ),
    (
        "Lừa đảo trực tuyến",
        "Website, fanpage, ứng dụng hoặc đường link giả mạo nhằm lấy thông tin cá nhân.",
    ),
    (
        "Lừa đảo chuyển khoản",
        "Mạo danh người quen, shop hoặc đơn vị vận chuyển để yêu cầu chuyển khoản trước.",
    ),
    (
        "Giả mạo công an",
        "Đối tượng tự xưng cơ quan chức năng, dọa liên quan vụ án để yêu cầu cung cấp OTP.",
    ),
    (
        "Tuyển dụng ảo",
        "Tin tuyển cộng tác viên, việc nhẹ lương cao, yêu cầu nạp tiền hoặc mua đơn hàng.",
    ),
    (
        "Mua bán online",
        "Shop ảo, hàng không đúng mô tả, yêu cầu đặt cọc rồi chặn liên lạc.",
    ),
    (
        "Giả mạo ngân hàng",
        "Tin nhắn, cuộc gọi, website giả ngân hàng để đánh cắp tài khoản và mã OTP.",
    ),
]

POST_BLUEPRINTS = [
    (
        "Cảnh báo cuộc gọi giả danh nhân viên ngân hàng yêu cầu đọc OTP",
        "Lừa đảo qua điện thoại",
        "Mình nhận được cuộc gọi tự xưng là bộ phận hỗ trợ thẻ. Họ nói tài khoản có giao dịch treo và yêu cầu đọc mã OTP để hủy. Khi mình hỏi chi nhánh xử lý thì họ chuyển giọng hối thúc, dọa khóa tài khoản. Mọi người tuyệt đối không đọc OTP cho bất kỳ ai qua điện thoại.",
        18,
        False,
    ),
    (
        "Fanpage bán vé concert yêu cầu cọc 70 phần trăm rồi biến mất",
        "Mua bán online",
        "Fanpage chạy quảng cáo nhìn rất giống trang chính thức, có ảnh feedback và số tài khoản cá nhân. Sau khi mình chuyển cọc, người bán nói hệ thống lỗi rồi chặn tin nhắn. Ai mua vé nên kiểm tra tick xác minh, lịch sử đổi tên trang và chỉ giao dịch qua kênh chính thức.",
        11,
        False,
    ),
    (
        "Nhóm đầu tư tiền ảo cam kết lãi 15 phần trăm mỗi tuần",
        "Lừa đảo đầu tư",
        "Một nhóm Telegram mời mình vào sàn đầu tư mới, ban đầu cho rút thử số nhỏ để tạo lòng tin. Sau đó họ yêu cầu nạp thêm để mở khóa gói VIP. Dấu hiệu rõ nhất là cam kết lợi nhuận cố định, thúc ép quyết định nhanh và chỉ hỗ trợ qua tài khoản cá nhân.",
        27,
        True,
    ),
    (
        "Website tra cứu phạt nguội giả yêu cầu nhập thông tin thẻ",
        "Lừa đảo trực tuyến",
        "Trang web có giao diện gần giống cơ quan nhà nước, yêu cầu nhập biển số rồi hiện khoản phạt. Bước tiếp theo lại đòi nhập số thẻ, ngày hết hạn và OTP để thanh toán. Đây là quy trình rất bất thường, mọi người nên kiểm tra tên miền chính thống trước khi nhập dữ liệu.",
        7,
        False,
    ),
    (
        "Tin nhắn giả ngân hàng báo tài khoản bị khóa",
        "Giả mạo ngân hàng",
        "SMS gửi kèm link rút gọn, nội dung báo tài khoản bị khóa do đăng nhập lạ. Link dẫn tới trang đăng nhập giống ngân hàng nhưng tên miền sai một ký tự. Nếu đã nhập thông tin, cần đổi mật khẩu ngay, khóa thẻ tạm thời và gọi tổng đài trên thẻ.",
        22,
        False,
    ),
    (
        "Đơn hàng COD lạ yêu cầu chuyển phí hoàn kho",
        "Lừa đảo chuyển khoản",
        "Shipper giả gọi báo có đơn hàng đã giao thất bại, yêu cầu chuyển phí hoàn kho 35 nghìn để không bị phạt. Sau đó họ gửi mã QR cá nhân. Mình kiểm tra lại thì không có đơn hàng nào trên app. Mọi người nên đối chiếu trực tiếp trong ứng dụng mua hàng.",
        13,
        False,
    ),
    (
        "Tuyển cộng tác viên chốt đơn yêu cầu nạp tiền giữ nhiệm vụ",
        "Tuyển dụng ảo",
        "Bài tuyển dụng ghi làm tại nhà, mỗi ngày nhận 300 đến 500 nghìn. Khi vào nhóm, họ giao nhiệm vụ mua đơn hàng ảo và hứa hoàn tiền kèm hoa hồng. Đến nhiệm vụ lớn thì bắt nạp thêm để rút tiền. Đây là mô hình rất phổ biến.",
        30,
        True,
    ),
    (
        "Cuộc gọi tự xưng công an yêu cầu kết bạn Zalo để làm việc",
        "Giả mạo công an",
        "Đối tượng đọc đúng họ tên và địa chỉ, nói mình liên quan đường dây rửa tiền. Họ yêu cầu kết bạn Zalo, bật camera và chuyển tiền vào tài khoản an toàn để xác minh. Cơ quan chức năng không làm việc theo cách này, không chuyển tiền theo yêu cầu qua điện thoại.",
        5,
        False,
    ),
    (
        "Shop điện thoại giá rẻ yêu cầu đặt cọc trước khi xem hàng",
        "Mua bán online",
        "Shop đăng iPhone thấp hơn thị trường vài triệu, nói đang thanh lý nên cần cọc giữ máy. Sau khi nhận tiền, shop gửi bill vận chuyển giả và yêu cầu thêm phí bảo hiểm. Mọi người nên chọn nơi có địa chỉ rõ ràng và kiểm tra hàng trước khi thanh toán.",
        16,
        False,
    ),
    (
        "Sàn nhiệm vụ like video không cho rút tiền sau khi nâng cấp tài khoản",
        "Lừa đảo đầu tư",
        "Ban đầu nhiệm vụ like video được trả vài nghìn để tạo lòng tin. Khi số dư tăng, hệ thống yêu cầu nâng cấp tài khoản bằng cách nạp thêm tiền. Nếu không nạp thì không rút được. Đây là dấu hiệu chiếm dụng tiền theo từng cấp nhiệm vụ.",
        24,
        True,
    ),
    (
        "Email giả mạo ví điện tử yêu cầu xác minh danh tính",
        "Lừa đảo trực tuyến",
        "Email dùng logo ví điện tử và tiêu đề khẩn cấp. Link dẫn tới form yêu cầu ảnh CCCD hai mặt, mật khẩu và mã xác thực. Các dịch vụ thật không bao giờ hỏi mật khẩu qua form ngoài. Nên mở app chính thức để kiểm tra thông báo.",
        9,
        False,
    ),
    (
        "Người quen bị chiếm Facebook nhắn mượn tiền gấp",
        "Lừa đảo chuyển khoản",
        "Tài khoản Facebook của bạn mình bị chiếm, nhắn hỏi vay tiền với lý do cấp cứu. Cách nhắn khá giống bình thường nhưng né gọi video. Mọi người nên xác minh qua số điện thoại hoặc gặp trực tiếp trước khi chuyển tiền cho bất kỳ ai.",
        3,
        False,
    ),
    (
        "Trang đặt phòng homestay mạo danh chủ nhà ở Đà Lạt",
        "Mua bán online",
        "Đối tượng lấy ảnh homestay thật, đăng giá rẻ vào cuối tuần và yêu cầu chuyển cọc 50 phần trăm. Khi gần đến ngày nhận phòng thì không liên lạc được. Nên kiểm tra review nhiều nền tảng, gọi số trên Google Maps và tránh tài khoản cá nhân mới tạo.",
        19,
        False,
    ),
    (
        "Ứng dụng vay tiền giả truy cập danh bạ rồi đe dọa người thân",
        "Lừa đảo trực tuyến",
        "App quảng cáo vay nhanh không cần chứng minh thu nhập. Sau khi cài, app xin quyền danh bạ và ảnh. Khi người dùng không vay hoặc chậm trả phí vô lý, đối tượng gọi điện đe dọa người thân. Không nên cài app ngoài kho chính thức.",
        21,
        True,
    ),
    (
        "Tin nhắn nhận quà tri ân yêu cầu trả phí vận chuyển",
        "Lừa đảo qua điện thoại",
        "Người gọi nói mình trúng quà tri ân từ siêu thị, chỉ cần thanh toán phí vận chuyển để nhận. Họ liên tục tạo cảm giác khẩn cấp và không cung cấp được mã chương trình hợp lệ. Đây là dạng lừa phí nhỏ nhưng số lượng nạn nhân lớn.",
        12,
        False,
    ),
    (
        "Tài khoản giả nhân viên tuyển dụng gửi file hợp đồng chứa mã độc",
        "Tuyển dụng ảo",
        "Sau khi trao đổi qua chat, người tuyển dụng gửi file nén yêu cầu mở để xem hợp đồng. File có đuôi lạ và yêu cầu tắt antivirus. Không nên mở file từ nguồn chưa xác minh, đặc biệt khi quy trình tuyển dụng quá nhanh và thiếu thông tin công ty.",
        29,
        False,
    ),
    (
        "Mạo danh tổng đài báo nâng hạn mức thẻ tín dụng",
        "Giả mạo ngân hàng",
        "Cuộc gọi nói ngân hàng đang nâng hạn mức miễn phí, yêu cầu cung cấp số thẻ và mã OTP. Khi mình từ chối, họ nói hồ sơ sẽ bị hủy và ảnh hưởng điểm tín dụng. Ngân hàng thật không yêu cầu OTP để tư vấn qua điện thoại.",
        8,
        False,
    ),
    (
        "Nhóm đặt vé máy bay yêu cầu chuyển khoản vào tài khoản cá nhân",
        "Mua bán online",
        "Một tài khoản nhận đặt vé rẻ hơn website hãng, gửi mã giữ chỗ nhưng không xuất vé điện tử. Sau khi nhận đủ tiền, họ báo phụ thu hành lý rồi chặn. Nên kiểm tra mã vé trực tiếp trên website hãng trước khi thanh toán toàn bộ.",
        15,
        False,
    ),
    (
        "Đường link bình chọn cuộc thi lấy tài khoản mạng xã hội",
        "Lừa đảo trực tuyến",
        "Bạn bè gửi link nhờ bình chọn, trang yêu cầu đăng nhập Facebook để tiếp tục. Sau khi nhập, tài khoản bị đổi mật khẩu và tiếp tục gửi link cho người khác. Nếu gặp tình huống này, hãy đổi mật khẩu và bật xác thực hai lớp ngay.",
        6,
        False,
    ),
    (
        "Cảnh báo số điện thoại giả bưu điện đòi phí nhận hồ sơ",
        "Lừa đảo qua điện thoại",
        "Người gọi báo có hồ sơ từ tòa án đang chờ phát, yêu cầu chuyển phí để giữ hồ sơ. Khi hỏi mã vận đơn, họ không trả lời rõ và chuyển sang dọa nạt. Bưu điện không yêu cầu chuyển tiền vào tài khoản cá nhân kiểu này.",
        17,
        False,
    ),
    (
        "Dự án bất động sản mini cam kết mua lại sau ba tháng",
        "Lừa đảo đầu tư",
        "Nhân viên tư vấn nói chỉ cần góp vốn nhỏ, sau ba tháng công ty mua lại với lợi nhuận cao. Hợp đồng sơ sài, không có pháp lý dự án và chỉ ghi nhận bằng phiếu thu. Cam kết lợi nhuận quá cao là điểm cần cảnh giác.",
        32,
        True,
    ),
    (
        "QR thanh toán giả dán đè tại quầy nước",
        "Lừa đảo chuyển khoản",
        "Một quầy nước phát hiện mã QR bị dán đè bằng tài khoản lạ. Khách chuyển tiền nhưng chủ quán không nhận được. Khi quét QR ở nơi công cộng, nên kiểm tra tên người nhận trước khi xác nhận giao dịch.",
        4,
        False,
    ),
    (
        "Tài khoản giả mạo giáo viên chủ nhiệm thu quỹ lớp",
        "Lừa đảo chuyển khoản",
        "Đối tượng lấy ảnh đại diện giáo viên rồi nhắn phụ huynh đóng quỹ gấp. Nội dung có lỗi chính tả nhẹ và số tài khoản không trùng với thông báo trước đó. Phụ huynh nên xác nhận qua nhóm chính thức hoặc gọi trực tiếp giáo viên.",
        2,
        False,
    ),
    (
        "Khóa học online cam kết hoàn tiền nhưng không có hợp đồng rõ ràng",
        "Lừa đảo trực tuyến",
        "Trung tâm quảng cáo khóa học kiếm tiền online, cam kết hoàn tiền nếu không có thu nhập. Sau khi đóng phí, nội dung chỉ là video cũ và điều kiện hoàn tiền rất mập mờ. Cần đọc kỹ điều khoản và xem phản hồi độc lập.",
        20,
        False,
    ),
]

COMMENT_TEXTS = [
    "Mình cũng từng gặp trường hợp này, họ nói chuyện rất chuyên nghiệp nên dễ mất cảnh giác.",
    "Cảm ơn bạn đã cảnh báo, mình sẽ gửi cho người nhà đọc thêm.",
    "Dấu hiệu rõ nhất là yêu cầu chuyển tiền hoặc đọc OTP ngay lập tức.",
    "Nên lưu lại số điện thoại và nội dung để báo cáo cho nhà mạng hoặc cơ quan chức năng.",
    "Mình kiểm tra tên miền thì thấy mới đăng ký gần đây, rất đáng nghi.",
    "Ai gặp tình huống tương tự nên gọi tổng đài chính thức để xác minh trước.",
    "Bài viết hữu ích, nhất là phần nhắc không mở link lạ.",
    "Mình thấy các nhóm tuyển dụng kiểu này xuất hiện rất nhiều trên Facebook.",
    "Nếu đã lỡ chuyển tiền thì nên liên hệ ngân hàng càng sớm càng tốt.",
    "Thông tin này nên được ghim ở trang chủ để nhiều người nhìn thấy hơn.",
]

REPORT_REASONS = [
    "Nội dung có dấu hiệu lừa đảo rõ ràng",
    "Tài khoản đăng bài dùng thông tin giả",
    "Có yêu cầu chuyển khoản đáng ngờ",
    "Đường link dẫn tới website giả mạo",
    "Bài viết chứa số điện thoại cần kiểm tra",
]

BLACKLIST_KEYWORDS = [
    "cam kết lãi",
    "đọc mã OTP",
    "nạp tiền mở khóa",
    "việc nhẹ lương cao",
    "chuyển khoản giữ chỗ",
    "link xác minh tài khoản",
]


def _fold_text(value: str) -> str:
    normalized = unicodedata.normalize("NFD", value)
    without_marks = "".join(char for char in normalized if unicodedata.category(char) != "Mn")
    without_marks = without_marks.replace("đ", "d").replace("Đ", "D")
    return " ".join(without_marks.lower().split())


class Command(BaseCommand):
    help = "Seed realistic demo data for the ScamAlertVN development database."

    def add_arguments(self, parser):
        parser.add_argument(
            "--reset",
            action="store_true",
            help="Remove previously generated demo users/posts before seeding.",
        )

    @transaction.atomic
    def handle(self, *args, **options):
        random.seed(20260502)

        if options["reset"]:
            self._reset_demo_data()

        admin_role, _ = Role.objects.get_or_create(
            role_name="Admin",
            defaults={"description": "Quản trị viên hệ thống"},
        )
        user_role, _ = Role.objects.get_or_create(
            role_name="User",
            defaults={"description": "Người dùng cộng đồng"},
        )
        admin = (
            User.objects.filter(is_staff=True).first()
            or User.objects.filter(role=admin_role).first()
            or self._create_user("demo_admin", admin_role, is_staff=True)
        )

        categories = self._seed_categories()
        users = [self._create_user(username, user_role) for username in DEMO_USERNAMES]
        posts = self._seed_posts(users, categories, admin)
        comments = self._seed_comments(users, posts)
        reactions = self._seed_reactions(users, posts, comments)
        bookmarks = self._seed_bookmarks(users, posts)
        reports = self._seed_reports(users, posts, comments)
        notifications = self._seed_notifications(users, posts)
        histories = self._seed_reputation(users, posts)
        self._seed_blacklist()
        self._seed_activity(admin, posts)

        self.stdout.write(self.style.SUCCESS("Demo data is ready."))
        self.stdout.write(
            "Created or updated: "
            f"{len(users)} users, {len(categories)} categories, {len(posts)} posts, "
            f"{len(comments)} comments, {reactions} reactions, {bookmarks} bookmarks, "
            f"{reports} reports, {notifications} notifications, {histories} reputation records."
        )

    def _reset_demo_data(self):
        demo_users = User.objects.filter(username__in=DEMO_USERNAMES + ["demo_admin"])
        demo_posts = Post.objects.filter(title__in=[item[0] for item in POST_BLUEPRINTS])
        ContentReport.objects.filter(reporter_user__in=demo_users).delete()
        ContentReport.objects.filter(target_type=TargetType.POST, target_id__in=demo_posts.values_list("id", flat=True)).delete()
        ContentReport.objects.filter(target_type=TargetType.COMMENT, target_id__in=Comment.objects.filter(post__in=demo_posts).values_list("id", flat=True)).delete()
        Reaction.objects.filter(user__in=demo_users).delete()
        Reaction.objects.filter(target_type=TargetType.POST, target_id__in=demo_posts.values_list("id", flat=True)).delete()
        Bookmark.objects.filter(user__in=demo_users).delete()
        Notification.objects.filter(user__in=demo_users).delete()
        ReputationHistory.objects.filter(user__in=demo_users).delete()
        Comment.objects.filter(user__in=demo_users).delete()
        demo_posts.delete()
        demo_users.delete()

    def _create_user(self, username, role, is_staff=False):
        user, created = User.objects.get_or_create(
            username=username,
            defaults={
                "email": f"{username}@example.com",
                "role": role,
                "status": User.UserStatus.ACTIVE,
                "is_staff": is_staff,
                "reputation_score": random.randint(8, 75),
                "first_name": username.split("_")[-1].title(),
            },
        )
        if created:
            user.set_password("Demo@123456")
            user.save()
        else:
            changed = False
            if user.role_id is None:
                user.role = role
                changed = True
            if user.status != User.UserStatus.ACTIVE:
                user.status = User.UserStatus.ACTIVE
                changed = True
            if changed:
                user.save()
        return user

    def _seed_categories(self):
        categories = {}
        for name, description in CATEGORIES:
            folded_name = _fold_text(name)
            matches = [
                category
                for category in ScamCategory.objects.all()
                if _fold_text(category.category_name) == folded_name
            ]

            category = next((item for item in matches if item.category_name == name), None)
            category = category or (matches[0] if matches else None)

            if category is None:
                category = ScamCategory.objects.create(
                    category_name=name,
                    description=description,
                )
            else:
                for duplicate in matches:
                    if duplicate.pk == category.pk:
                        continue
                    Post.objects.filter(category=duplicate).update(category=category)
                    duplicate.delete()

                category.category_name = name
                category.description = description
                category.save(update_fields=["category_name", "description"])

            categories[name] = category
        return categories

    def _seed_posts(self, users, categories, admin):
        now = timezone.now()
        posts = []
        for index, (title, category_name, content, days_ago, anonymous) in enumerate(POST_BLUEPRINTS):
            author = users[index % len(users)]
            status = Post.PostStatus.APPROVED
            if index in {5, 14}:
                status = Post.PostStatus.PENDING
            elif index == 10:
                status = Post.PostStatus.REJECTED
            elif index == 20:
                status = Post.PostStatus.HIDDEN

            post, _ = Post.objects.update_or_create(
                title=title,
                defaults={
                    "content": content,
                    "category": categories[category_name],
                    "user": author,
                    "status": status,
                    "is_anonymous": anonymous,
                    "published_time": now - timedelta(days=days_ago, hours=index % 6) if status == Post.PostStatus.APPROVED else None,
                    "reviewed_by": admin if status != Post.PostStatus.PENDING else None,
                    "reviewed_at": now - timedelta(days=max(days_ago - 1, 0)) if status != Post.PostStatus.PENDING else None,
                    "rejection_reason": "Nội dung cần bổ sung bằng chứng rõ hơn." if status == Post.PostStatus.REJECTED else "",
                    "ai_analysis_status": Post.AIAnalysisStatus.NOT_ANALYZED,
                    "ai_analysis_provider": "",
                    "ai_analysis_result": None,
                    "ai_analysis_error": "",
                    "ai_analyzed_at": None,
                },
            )
            created_time = now - timedelta(days=days_ago, hours=index % 8, minutes=index * 3)
            Post.objects.filter(pk=post.pk).update(created_time=created_time, updated_time=created_time)
            posts.append(post)

            if status == Post.PostStatus.APPROVED:
                Notification.objects.get_or_create(
                    user=author,
                    content=f'Bài viết "{title[:80]}" của bạn đã được phê duyệt.',
                )

        return posts

    def _seed_comments(self, users, posts):
        now = timezone.now()
        comments = []
        approved_posts = [post for post in posts if post.status == Post.PostStatus.APPROVED]
        for post_index, post in enumerate(approved_posts):
            for offset in range(random.randint(3, 7)):
                user = users[(post_index + offset + 1) % len(users)]
                comment, _ = Comment.objects.get_or_create(
                    post=post,
                    user=user,
                    parent_comment=None,
                    content=COMMENT_TEXTS[(post_index + offset) % len(COMMENT_TEXTS)],
                    defaults={"status": Comment.CommentStatus.ACTIVE},
                )
                Comment.objects.filter(pk=comment.pk).update(
                    created_time=now - timedelta(days=random.randint(0, 25), minutes=random.randint(10, 900))
                )
                comments.append(comment)

                if offset in {1, 4}:
                    reply_user = post.user if not post.is_anonymous else user
                    reply, _ = Comment.objects.get_or_create(
                        post=post,
                        user=reply_user,
                        parent_comment=comment,
                        content="Mình đã bổ sung thêm chi tiết trong bài, cảm ơn bạn đã nhắc.",
                        defaults={"status": Comment.CommentStatus.ACTIVE, "is_anonymous": post.is_anonymous and reply_user == post.user},
                    )
                    Comment.objects.filter(pk=reply.pk).update(
                        created_time=now - timedelta(days=random.randint(0, 20), minutes=random.randint(5, 600))
                    )
                    comments.append(reply)
        return comments

    def _seed_reactions(self, users, posts, comments):
        created = 0
        targets = [(TargetType.POST, post.id) for post in posts if post.status == Post.PostStatus.APPROVED]
        targets += [(TargetType.COMMENT, comment.id) for comment in comments[:60]]

        for target_type, target_id in targets:
            sample_size = random.randint(3, min(10, len(users)))
            for user in random.sample(users, sample_size):
                try:
                    _, was_created = Reaction.objects.get_or_create(
                        user=user,
                        target_type=target_type,
                        target_id=target_id,
                        defaults={"reaction_type": Reaction.ReactionType.UPVOTE},
                    )
                    created += int(was_created)
                except IntegrityError:
                    continue
        return created

    def _seed_bookmarks(self, users, posts):
        created = 0
        approved_posts = [post for post in posts if post.status == Post.PostStatus.APPROVED]
        for user in users:
            for post in random.sample(approved_posts, min(6, len(approved_posts))):
                bookmark, was_created = Bookmark.objects.get_or_create(user=user, post=post)
                created += int(was_created)
        return created

    def _seed_reports(self, users, posts, comments):
        created = 0
        questionable_posts = [post for post in posts if post.status in {Post.PostStatus.PENDING, Post.PostStatus.HIDDEN, Post.PostStatus.REJECTED}]
        report_targets = [(TargetType.POST, post.id) for post in questionable_posts]
        report_targets += [(TargetType.COMMENT, comment.id) for comment in comments[::9][:8]]

        for index, (target_type, target_id) in enumerate(report_targets):
            reporter = users[index % len(users)]
            report, was_created = ContentReport.objects.get_or_create(
                reporter_user=reporter,
                target_type=target_type,
                target_id=target_id,
                defaults={
                    "reason": REPORT_REASONS[index % len(REPORT_REASONS)],
                    "processing_status": random.choice([
                        ContentReport.ProcessStatus.PENDING,
                        ContentReport.ProcessStatus.PROCESSED,
                        ContentReport.ProcessStatus.DISMISSED,
                    ]),
                },
            )
            created += int(was_created)
        return created

    def _seed_notifications(self, users, posts):
        created = 0
        messages = [
            "Có người vừa bình luận trong bài cảnh báo của bạn.",
            "Bài viết của bạn đang nhận được nhiều lượt quan tâm.",
            "Hệ thống nhắc bạn cập nhật thêm bằng chứng nếu có.",
            "Một báo cáo của bạn đã được ghi nhận để quản trị viên xem xét.",
        ]
        for index, user in enumerate(users):
            for offset in range(2):
                _, was_created = Notification.objects.get_or_create(
                    user=user,
                    content=messages[(index + offset) % len(messages)],
                    defaults={"is_read": offset == 0},
                )
                created += int(was_created)
        return created

    def _seed_reputation(self, users, posts):
        created = 0
        for index, user in enumerate(users):
            post_title = posts[index % len(posts)].title
            records = [
                (f'Bài viết "{post_title[:60]}" được phê duyệt', 10),
                ("Báo cáo lừa đảo có căn cứ", 5),
                ("Bình luận hữu ích được cộng đồng tương tác", 2),
            ]
            for action_type, score_change in records:
                _, was_created = ReputationHistory.objects.get_or_create(
                    user=user,
                    action_type=action_type,
                    defaults={"score_change": score_change},
                )
                created += int(was_created)
        return created

    def _seed_blacklist(self):
        for keyword in BLACKLIST_KEYWORDS:
            Blacklist.objects.get_or_create(keyword=keyword)

    def _seed_activity(self, admin, posts):
        for post in posts[:12]:
            ActivityLog.objects.get_or_create(
                user=admin,
                action=f"[DEMO_SEED] Kiểm duyệt dữ liệu demo cho bài viết: {post.title[:120]}",
            )
            if post.reviewed_by:
                AuditLog.objects.get_or_create(
                    action="APPROVE" if post.status == Post.PostStatus.APPROVED else post.status,
                    admin_user=admin,
                    target_post=post,
                    defaults={"reason": post.rejection_reason or ""},
                )
