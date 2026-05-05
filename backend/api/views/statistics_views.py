from django.db.models import Count
from django.utils import timezone
from rest_framework.response import Response
from rest_framework.views import APIView

from api.models import ContentReport, Post, ReputationHistory, ScamCategory, User
from api.permissions import IsAdminRole

# Chỉ có một class view: SystemStatisticsView, gom tất cả số liệu vào một
# Gồm 5 nhóm dữ liệu:
#   - overview   : tổng số bài viết, user active, bài chờ duyệt, báo cáo.
#   - monthly_activity  : hoạt động theo từng tháng (6 tháng gần nhất).
#   - growth_trend      : bài viết & user tích lũy theo tháng (line chart).
#   - category_distribution : % bài theo từng danh mục (pie chart).
#   - reputation        : điểm uy tín từng user (bảng xếp hạng).
# Tất cả endpoint đều dùng permission IsAdminRole, user thường không vào được.


# Bảng màu tuần tự cấp cho từng danh mục trong pie chart frontend.
CHART_COLORS = [
    '#E01515',  # đỏ chủ đạo
    '#F59E0B',  # vàng cam
    '#3B82F6',  # xanh dương
    '#22C55E',  # xanh lá
    '#8B5CF6',  # tím
    '#EC4899',  # hồng
    '#14B8A6',  # xanh ngọc
    '#F97316',  # cam
    '#64748B',  # xám
]


class SystemStatisticsView(APIView):
    """
    Endpoint dashboard thống kê dành cho Admin.
    GET /api/statistics/ sẽ trả về JSON tổng hợp gồm overview, biểu đồ và bảng danh mục.
    """
    permission_classes = [IsAdminRole]  # chỉ admin mới được xem dashboard.

    def get(self, request):
        """
        Tổng hợp tất cả số liệu vào một JSON duy nhất.
        Frontend (Statistics.tsx) gọi một lần duy nhất rồi render nhiều chart từ dữ liệu trả về.
        """
        # Lấy danh sách 6 tháng gần nhất để làm trục X cho biểu đồ.
        months = _last_months(6)

        # Tính hoạt động theo tháng: số bài, số user mới, số báo cáo.
        monthly_activity = _monthly_activity(months)

        # Tính phân bố bài viết theo từng danh mục lừa đảo.
        category_rows = _category_rows()

        # Lấy tất cả user, sắp xếp điểm uy tín giảm dần để lập bảng xếp hạng.
        users = list(User.objects.all().order_by('-reputation_score', 'username'))

        return Response({
            # ── Nhóm 1: Tổng quan ────────────────────────────────────────────────
            'overview': {
                'total_posts': Post.objects.count(),           # tổng số bài viết mọi trạng thái.
                'active_users': User.objects.filter(status__iexact=User.UserStatus.ACTIVE).count(),  # user chưa bị khóa/xóa.
                'pending_posts': Post.objects.filter(status=Post.PostStatus.PENDING).count(),         # bài chờ admin duyệt.
                'total_reports': ContentReport.objects.count(),  # tổng báo cáo vi phạm.
            },

            # ── Nhóm 2: Hoạt động theo tháng (Bar chart) ─────────────────────────
            'monthly_activity': monthly_activity,

            # ── Nhóm 3: Xu hướng tích lũy (Line chart) ───────────────────────────
            # growth_trend là tổng cộng dồn qua từng tháng (running total),
            # khác với monthly_activity là số mới trong tháng đó.
            'growth_trend': _growth_trend(monthly_activity),

            # ── Nhóm 4: Pie chart phân bố theo danh mục ──────────────────────────
            'category_distribution': [
                {
                    'name': row['category'],
                    'value': row['posts'],
                    'color': CHART_COLORS[index % len(CHART_COLORS)],  # gán màu xoay vòng.
                }
                for index, row in enumerate(category_rows)
                if row['posts'] > 0  # bỏ qua danh mục chưa có bài nào.
            ],

            # ── Nhóm 5: Bảng chi tiết từng danh mục ──────────────────────────────
            # Gồm cả danh mục "Chưa phân loại" nếu có bài không có danh mục.
            'category_table': category_rows,

            # ── Nhóm 6: Bảng điểm uy tín user ────────────────────────────────────
            'reputation': _reputation_stats(users),
        })


# ============================================================
# CÁC HÀM HELPER NỘI BỘ
# ============================================================

def _last_months(count):
    """
    Trả về danh sách `count` tháng gần nhất (bao gồm tháng hiện tại),
    mỗi phần tử là datetime đầu tháng.
    """
    # Lấy thời điểm đầu tháng hiện tại theo múi giờ địa phương.
    current = timezone.localtime(timezone.now()).replace(
        day=1,
        hour=0,
        minute=0,
        second=0,
        microsecond=0,
    )
    months = []
    # Duyệt ngược từ (count-1) tháng trước về 0 (tháng hiện tại).
    for offset in range(count - 1, -1, -1):
        months.append(_add_months(current, -offset))
    return months


def _add_months(value, months):
    """
    Cộng/trừ `months` tháng vào datetime `value`.
    """
    month_index = value.month - 1 + months   # chuyển month (1-based) sang index (0-based) để cộng trừ.
    year = value.year + month_index // 12     # số năm tăng lên khi vượt qua tháng 12.
    month = month_index % 12 + 1             # đưa về 1-12.
    return value.replace(year=year, month=month)


def _month_key(value):
    """
    Tạo chuỗi key dạng 'YYYY-MM' từ datetime để dùng làm key dict rows.
    Cần chuyển về múi giờ địa phương để tránh lệch tháng khi server chạy UTC.
    """
    local_value = timezone.localtime(value)
    return f'{local_value.year}-{local_value.month:02d}'


def _month_label(value):
    """
    Tạo nhãn hiển thị 'T{tháng}/{năm 2 chữ số}' cho trục X biểu đồ.
    Ví dụ: T5/25 (tháng 5 năm 2025).
    """
    return f'T{value.month}/{str(value.year)[-2:]}'


def _monthly_activity(months):
    """
    Tính số bài viết mới, user mới và báo cáo vi phạm mới trong từng tháng.

    Cách thực hiện:
    1. Khởi tạo dict rows với key là 'YYYY-MM', giá trị mặc định = 0.
    2. Lặp qua bảng Post/User/ContentReport một lần mỗi bảng, cộng dồn vào dict.
    3. Trả về list các dict theo thứ tự tháng.

    Không dùng GROUP BY trực tiếp vì cần xử lý múi giờ địa phương trên từng bản ghi.
    """
    start = months[0]                      # ngày đầu tháng xa nhất (6 tháng trước).
    end = _add_months(months[-1], 1)       # ngày đầu tháng tiếp theo (để lọc < end).

    # Tạo sẵn dict kết quả với tất cả tháng, mặc định posts/users/reports = 0.
    rows = {
        f'{month.year}-{month.month:02d}': {
            'month': _month_label(month),
            'posts': 0,
            'users': 0,
            'reports': 0,
        }
        for month in months
    }

    # Đếm số bài viết mới từng tháng.
    for created_time in Post.objects.filter(created_time__gte=start, created_time__lt=end).values_list('created_time', flat=True):
        rows[_month_key(created_time)]['posts'] += 1

    # Đếm số user mới đăng ký từng tháng.
    for created_date in User.objects.filter(created_date__gte=start, created_date__lt=end).values_list('created_date', flat=True):
        rows[_month_key(created_date)]['users'] += 1

    # Đếm số báo cáo vi phạm mới từng tháng.
    for reported_time in ContentReport.objects.filter(reported_time__gte=start, reported_time__lt=end).values_list('reported_time', flat=True):
        rows[_month_key(reported_time)]['reports'] += 1

    return list(rows.values())  # trả về list theo thứ tự tháng để recharts vẽ đúng.


def _growth_trend(monthly_activity):
    """
    Tính tổng cộng dồn (running total) bài viết và user theo từng tháng.
    Dùng cho Line chart 'Xu hướng tăng trưởng': trục Y không bao giờ giảm,
    giúp admin thấy tốc độ tăng trưởng tổng thể của hệ thống.
    """
    running_posts = 0
    running_users = 0
    trend = []

    for row in monthly_activity:
        running_posts += row['posts']    # cộng dồn số bài tháng này vào tổng.
        running_users += row['users']    # cộng dồn số user tháng này vào tổng.
        trend.append({
            'month': row['month'],
            'posts': running_posts,
            'users': running_users,
        })

    return trend


def _category_rows():
    """
    Tính bảng thống kê chi tiết từng danh mục:
    - Tổng số bài viết (mọi thời gian).
    - Số bài tháng này và tháng trước để tính tăng trưởng.
    - Tỷ lệ phần trăm so với tổng bài toàn hệ thống.

    Bao gồm cả hàng 'Chưa phân loại' nếu có bài không có category.
    """
    total_posts = Post.objects.count()   # mẫu số để tính %.

    # Xác định khoảng thời gian tháng này và tháng trước.
    current_month = timezone.localtime(timezone.now()).replace(
        day=1, hour=0, minute=0, second=0, microsecond=0,
    )
    previous_month = _add_months(current_month, -1)
    next_month = _add_months(current_month, 1)

    # Lấy tất cả danh mục, annotate kèm tổng số bài viết, sắp xếp nhiều bài lên trước.
    categories = ScamCategory.objects.annotate(posts_count=Count('posts')).order_by('-posts_count', 'category_name')

    rows = []
    for category in categories:
        # Tính số bài tháng hiện tại của danh mục này.
        current_count = Post.objects.filter(
            category=category,
            created_time__gte=current_month,
            created_time__lt=next_month
        ).count()
        # Tính số bài tháng trước của danh mục này.
        previous_count = Post.objects.filter(
            category=category,
            created_time__gte=previous_month,
            created_time__lt=current_month
        ).count()

        rows.append(_build_category_row(
            row_id=f'cat-{category.id}',
            category=category.category_name,
            posts=category.posts_count,
            current_count=current_count,
            previous_count=previous_count,
            total_posts=total_posts,
        ))

    # Xử lý bài không có danh mục (category=NULL) thành hàng "Chưa phân loại".
    uncategorized_count = Post.objects.filter(category__isnull=True).count()
    if uncategorized_count:
        current_count = Post.objects.filter(category__isnull=True, created_time__gte=current_month, created_time__lt=next_month).count()
        previous_count = Post.objects.filter(category__isnull=True, created_time__gte=previous_month, created_time__lt=current_month).count()
        rows.append(_build_category_row(
            row_id='uncategorized',
            category='Chưa phân loại',
            posts=uncategorized_count,
            current_count=current_count,
            previous_count=previous_count,
            total_posts=total_posts,
        ))

    return rows


def _build_category_row(row_id, category, posts, current_count, previous_count, total_posts):
    """
    Tính toán tỷ lệ tăng trưởng tháng này so với tháng trước.

    Công thức tăng trưởng:
    - Nếu tháng trước = 0 và tháng này > 0 → tăng 100% (hoàn toàn mới).
    - Nếu cả hai = 0 → 0%.
    - Còn lại: (current - previous) / previous * 100, làm tròn số nguyên.
    """
    if previous_count == 0:
        growth_value = 100 if current_count > 0 else 0  # tránh chia cho 0.
    else:
        growth_value = round(((current_count - previous_count) / previous_count) * 100)

    # Tỷ lệ bài danh mục này trên tổng, làm tròn 1 chữ số thập phân.
    percentage = round((posts / total_posts) * 100, 1) if total_posts else 0

    return {
        'id': row_id,
        'category': category,
        'posts': posts,
        'growth': f'{growth_value:+d}%',   # +d tự thêm dấu + nếu dương.
        'growth_value': growth_value,        # giá trị số để FE đổi màu xanh/đỏ.
        'percentage': f'{percentage}%',
    }


def _reputation_stats(users):
    """
    Tổng hợp điểm uy tín của tất cả user từ bảng ReputationHistory.

    Mỗi user có:
    - current_score  : điểm hiện tại trên bảng User.
    - total_gained   : tổng điểm đã cộng qua các lần được thưởng.
    - total_lost     : tổng điểm đã bị trừ qua các lần vi phạm.

    Cách đọc dữ liệu:
    - Lấy tất cả bản ghi ReputationHistory một lần (tránh N+1 query).
    - Dùng dict score_changes để gom theo user_id.
    """
    # Lấy toàn bộ lịch sử thay đổi điểm, không kèm quan hệ (chỉ cần user_id và score_change).
    histories = ReputationHistory.objects.values('user_id', 'score_change')

    # Gom điểm vào dict {user_id: {total_gained, total_lost}}.
    score_changes = {}
    for item in histories:
        bucket = score_changes.setdefault(item['user_id'], {'total_gained': 0, 'total_lost': 0})
        score_change = item['score_change']
        if score_change >= 0:
            bucket['total_gained'] += score_change   # được thưởng điểm.
        else:
            bucket['total_lost'] += abs(score_change)  # bị trừ điểm, lưu dương.

    # Xây bảng user kết hợp điểm hiện tại và lịch sử.
    table = []
    for user in users:
        changes = score_changes.get(user.id, {'total_gained': 0, 'total_lost': 0})
        table.append({
            'user_id': user.id,
            'user_name': user.username,
            'user_email': user.email,
            'current_score': user.reputation_score,   # điểm hiện tại trong bảng User.
            'total_gained': changes['total_gained'],   # tổng điểm thưởng cộng dồn.
            'total_lost': changes['total_lost'],       # tổng điểm phạt cộng dồn.
        })

    total_users = len(users)
    # Điểm trung bình toàn hệ thống, làm tròn số nguyên.
    avg_score = round(sum(user.reputation_score for user in users) / total_users) if total_users else 0
    # Người dùng có điểm cao nhất; default=0 nếu chưa có user nào.
    highest_score = max((user.reputation_score for user in users), default=0)

    return {
        'summary': {
            'total_users': total_users,    # tổng số user để tính trung bình.
            'avg_score': avg_score,        # điểm trung bình toàn hệ thống.
            'highest_score': highest_score, # điểm cao nhất trong hệ thống.
        },
        'users': table,  # bảng chi tiết từng user, FE hiển thị dạng bảng xếp hạng.
    }
