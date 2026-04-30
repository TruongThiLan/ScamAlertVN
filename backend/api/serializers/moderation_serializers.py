from rest_framework import serializers

class ApprovePostSerializer(serializers.Serializer):
    """Body tùy chọn khi duyệt bài — không bắt buộc."""
    notes = serializers.CharField(required=False, allow_blank=True, max_length=500)


class RejectPostSerializer(serializers.Serializer):
    """Body bắt buộc khi từ chối bài."""
    reason = serializers.CharField(
        required=True,
        min_length=10,
        max_length=500,
        error_messages={
            'required': 'Phải nhập lý do từ chối.',
            'min_length': 'Lý do từ chối phải có ít nhất 10 ký tự.',
        }
    )


class HidePostSerializer(serializers.Serializer):
    """Body bắt buộc khi ẩn bài."""
    reason = serializers.CharField(
        required=True,
        min_length=10,
        max_length=500,
        error_messages={
            'required': 'Phải nhập lý do ẩn bài.',
            'min_length': 'Lý do ẩn bài phải có ít nhất 10 ký tự.',
        }
    )


class LockPostSerializer(serializers.Serializer):
    """Body bắt buộc khi khóa bài."""
    reason = serializers.CharField(
        required=True,
        min_length=10,
        max_length=500,
        error_messages={
            'required': 'Phải nhập lý do khóa bài.',
            'min_length': 'Lý do khóa bài phải có ít nhất 10 ký tự.',
        }
    )


class AdminDeletePostSerializer(serializers.Serializer):
    """Body bắt buộc khi Admin xóa bài vi phạm."""
    reason = serializers.CharField(
        required=True,
        min_length=10,
        max_length=500,
        error_messages={
            'required': 'Phải nhập lý do xóa bài.',
            'min_length': 'Lý do xóa bài phải có ít nhất 10 ký tự.',
        }
    )
    confirm = serializers.BooleanField(
        required=True,
        error_messages={'required': 'Phải xác nhận xóa bài (confirm=true).'}
    )

    def validate_confirm(self, value):
        if not value:
            raise serializers.ValidationError('Phải xác nhận xóa bài (confirm=true).')
        return value