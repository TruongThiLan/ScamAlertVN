from rest_framework import serializers

# NOTE VAN DAP:
# moderation_serializers.py chứa các Serializer cho luồng kiểm duyệt bài viết.
#
# Mỗi action kiểm duyệt yêu cầu khác nhau:
#   - approve : không bắt buộc nhập gì, chỉ có field notes tuỳ chọn.
#   - reject  : bắt buộc reason (≥ 10 ký tự) để user biết tại sao bị từ chối.
#   - hide    : bắt buộc reason vì bài có thể đã public, cần lưu vết xử lý.
#   - lock    : bắt buộc reason để giải thích tại sao bài không được tương tác thêm.
#   - delete  : bắt buộc reason + confirm=true (double-check tránh bấm nhầm).


class ApprovePostSerializer(serializers.Serializer):
    """
    Body request cho action duyệt bài (POST /api/posts/<id>/approve/).
    Duyệt bài không bắt buộc lý do; field notes chỉ để admin ghi chú thêm nếu muốn.
    """
    notes = serializers.CharField(
        required=False,
        allow_blank=True,
        max_length=500  # giới hạn độ dài để tránh lưu dữ liệu quá lớn.
    )


class RejectPostSerializer(serializers.Serializer):
    """
    Body request cho action từ chối bài (POST /api/posts/<id>/reject/).
    Bắt buộc phải có reason để:
      1. Lưu vào Post.rejection_reason cho user biết nguyên nhân.
      2. Ghi vào AuditLog để admin trace lại lịch sử.
      3. Gửi Notification kèm lý do cho tác giả.
    min_length=10 để tránh reason kiểu "xấu", "sai" không rõ ràng.
    """
    reason = serializers.CharField(required=True, min_length=10, max_length=500)


class HidePostSerializer(serializers.Serializer):
    """
    Body request cho action ẩn bài (POST /api/posts/<id>/hide/).
    Ẩn bài (HIDDEN) khác từ chối (REJECTED):
      - HIDDEN: bài đã được duyệt nhưng bị admin ẩn sau đó, vẫn còn trong DB.
      - REJECTED: bài mới gửi bị từ chối trước khi public.
    Bắt buộc reason vì hành động này ảnh hưởng tới bài đã/đang public.
    """
    reason = serializers.CharField(required=True, min_length=10, max_length=500)


class LockPostSerializer(serializers.Serializer):
    """
    Body request cho action khóa bài (POST /api/posts/<id>/lock/).
    LOCKED: bài vẫn hiển thị nhưng không cho bình luận thêm / chỉnh sửa.
    Bắt buộc reason để giải thích tại sao bài bị đóng băng tương tác.
    """
    reason = serializers.CharField(required=True, min_length=10, max_length=500)


class AdminDeletePostSerializer(serializers.Serializer):
    """
    Body request cho action xóa vĩnh viễn (DELETE /api/posts/<id>/admin-delete/).
      - reason: lý do xóa (lưu vào AuditLog trước khi xóa bản ghi Post).
      - confirm=true: frontend phải gửi tường minh, tránh bấm nhầm.

    Nếu confirm=false, validate_confirm() sẽ raise ValidationError ngay,
    view sẽ không thực thi lệnh xóa.
    """
    reason = serializers.CharField(required=True, min_length=10, max_length=500)
    confirm = serializers.BooleanField(required=True)

    def validate_confirm(self, value):
        """
        Field-level validator cho field 'confirm'.
        DRF tự động gọi hàm validate_<field_name> trước khi trả validated_data.
        Nếu value=False thi báo lỗi ngay, không tiến đến view.
        """
        if not value:
            raise serializers.ValidationError('Phải xác nhận xóa bài (confirm=true).')
        return value
