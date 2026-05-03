from rest_framework import serializers

# Cac serializer nay khong gan voi Model, chi validate input cho admin action.
# Vi du reject/hide/lock/delete bat buoc co reason de luu ly do xu ly.

class ApprovePostSerializer(serializers.Serializer):
    notes = serializers.CharField(required=False, allow_blank=True, max_length=500)


class RejectPostSerializer(serializers.Serializer):
    reason = serializers.CharField(required=True, min_length=10, max_length=500)


class HidePostSerializer(serializers.Serializer):
    reason = serializers.CharField(required=True, min_length=10, max_length=500)


class LockPostSerializer(serializers.Serializer):
    reason = serializers.CharField(required=True, min_length=10, max_length=500)


class AdminDeletePostSerializer(serializers.Serializer):
    reason = serializers.CharField(required=True, min_length=10, max_length=500)
    confirm = serializers.BooleanField(required=True)

    def validate_confirm(self, value):
        if not value:
            raise serializers.ValidationError('Phải xác nhận xóa bài (confirm=true).')
        return value
