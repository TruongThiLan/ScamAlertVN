from rest_framework.pagination import PageNumberPagination
from rest_framework.response import Response
from .models import User

class UserPagination(PageNumberPagination):
    page_size = 10
    
    def get_paginated_response(self, data):
        # Tính toán thống kê cho TOÀN BỘ database (không phụ thuộc trang)
        all_users = User.objects.all()
        status_summary = {
            # Hoat dong = Active + Warning (vi Warning van dang hoat dong)
            'active': all_users.filter(status__in=[User.UserStatus.ACTIVE, User.UserStatus.WARNING]).count(),
            'banned': all_users.filter(status=User.UserStatus.BANNED).count(),
            'inactive': all_users.filter(status=User.UserStatus.INACTIVE).count(),
        }
        
        return Response({
            'count': self.page.paginator.count,
            'next': self.get_next_link(),
            'previous': self.get_previous_link(),
            'status_summary': status_summary, # Thêm thống kê tổng vào đây
            'results': data
        })
