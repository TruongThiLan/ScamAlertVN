from django.db.models import Count
from django.utils import timezone
from rest_framework.response import Response
from rest_framework.views import APIView

from api.models import ContentReport, Post, ReputationHistory, ScamCategory, User
from api.permissions import IsAdminRole


CHART_COLORS = [
    '#E01515',
    '#F59E0B',
    '#3B82F6',
    '#22C55E',
    '#8B5CF6',
    '#EC4899',
    '#14B8A6',
    '#F97316',
    '#64748B',
]


class SystemStatisticsView(APIView):
    permission_classes = [IsAdminRole]

    def get(self, request):
        months = _last_months(6)
        monthly_activity = _monthly_activity(months)
        category_rows = _category_rows()
        users = list(User.objects.all().order_by('-reputation_score', 'username'))

        return Response({
            'overview': {
                'total_posts': Post.objects.count(),
                'active_users': User.objects.filter(status__iexact=User.UserStatus.ACTIVE).count(),
                'pending_posts': Post.objects.filter(status=Post.PostStatus.PENDING).count(),
                'total_reports': ContentReport.objects.count(),
            },
            'monthly_activity': monthly_activity,
            'growth_trend': _growth_trend(monthly_activity),
            'category_distribution': [
                {
                    'name': row['category'],
                    'value': row['posts'],
                    'color': CHART_COLORS[index % len(CHART_COLORS)],
                }
                for index, row in enumerate(category_rows)
                if row['posts'] > 0
            ],
            'category_table': category_rows,
            'reputation': _reputation_stats(users),
        })


def _last_months(count):
    current = timezone.localtime(timezone.now()).replace(
        day=1,
        hour=0,
        minute=0,
        second=0,
        microsecond=0,
    )
    months = []
    for offset in range(count - 1, -1, -1):
        months.append(_add_months(current, -offset))
    return months


def _add_months(value, months):
    month_index = value.month - 1 + months
    year = value.year + month_index // 12
    month = month_index % 12 + 1
    return value.replace(year=year, month=month)


def _month_key(value):
    local_value = timezone.localtime(value)
    return f'{local_value.year}-{local_value.month:02d}'


def _month_label(value):
    return f'T{value.month}/{str(value.year)[-2:]}'


def _monthly_activity(months):
    start = months[0]
    end = _add_months(months[-1], 1)
    rows = {
        f'{month.year}-{month.month:02d}': {
            'month': _month_label(month),
            'posts': 0,
            'users': 0,
            'reports': 0,
        }
        for month in months
    }

    for created_time in Post.objects.filter(created_time__gte=start, created_time__lt=end).values_list('created_time', flat=True):
        rows[_month_key(created_time)]['posts'] += 1

    for created_date in User.objects.filter(created_date__gte=start, created_date__lt=end).values_list('created_date', flat=True):
        rows[_month_key(created_date)]['users'] += 1

    for reported_time in ContentReport.objects.filter(reported_time__gte=start, reported_time__lt=end).values_list('reported_time', flat=True):
        rows[_month_key(reported_time)]['reports'] += 1

    return list(rows.values())


def _growth_trend(monthly_activity):
    running_posts = 0
    running_users = 0
    trend = []

    for row in monthly_activity:
        running_posts += row['posts']
        running_users += row['users']
        trend.append({
            'month': row['month'],
            'posts': running_posts,
            'users': running_users,
        })

    return trend


def _category_rows():
    total_posts = Post.objects.count()
    current_month = timezone.localtime(timezone.now()).replace(
        day=1,
        hour=0,
        minute=0,
        second=0,
        microsecond=0,
    )
    previous_month = _add_months(current_month, -1)
    next_month = _add_months(current_month, 1)

    categories = ScamCategory.objects.annotate(posts_count=Count('posts')).order_by('-posts_count', 'category_name')
    rows = []
    for category in categories:
        current_count = Post.objects.filter(category=category, created_time__gte=current_month, created_time__lt=next_month).count()
        previous_count = Post.objects.filter(category=category, created_time__gte=previous_month, created_time__lt=current_month).count()
        rows.append(_build_category_row(
            row_id=f'cat-{category.id}',
            category=category.category_name,
            posts=category.posts_count,
            current_count=current_count,
            previous_count=previous_count,
            total_posts=total_posts,
        ))

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
    if previous_count == 0:
        growth_value = 100 if current_count > 0 else 0
    else:
        growth_value = round(((current_count - previous_count) / previous_count) * 100)

    percentage = round((posts / total_posts) * 100, 1) if total_posts else 0
    return {
        'id': row_id,
        'category': category,
        'posts': posts,
        'growth': f'{growth_value:+d}%',
        'growth_value': growth_value,
        'percentage': f'{percentage}%',
    }


def _reputation_stats(users):
    histories = ReputationHistory.objects.values('user_id', 'score_change')
    score_changes = {}
    for item in histories:
        bucket = score_changes.setdefault(item['user_id'], {'total_gained': 0, 'total_lost': 0})
        score_change = item['score_change']
        if score_change >= 0:
            bucket['total_gained'] += score_change
        else:
            bucket['total_lost'] += abs(score_change)

    table = []
    for user in users:
        changes = score_changes.get(user.id, {'total_gained': 0, 'total_lost': 0})
        table.append({
            'user_id': user.id,
            'user_name': user.username,
            'user_email': user.email,
            'current_score': user.reputation_score,
            'total_gained': changes['total_gained'],
            'total_lost': changes['total_lost'],
        })

    total_users = len(users)
    avg_score = round(sum(user.reputation_score for user in users) / total_users) if total_users else 0
    highest_score = max((user.reputation_score for user in users), default=0)

    return {
        'summary': {
            'total_users': total_users,
            'avg_score': avg_score,
            'highest_score': highest_score,
        },
        'users': table,
    }
