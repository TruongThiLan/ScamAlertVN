from rest_framework import serializers
from api.models import ScamCategory

class ScamCategorySerializer(serializers.ModelSerializer):
    """Dùng cho cả đọc lẫn ghi danh mục."""
    post_count = serializers.SerializerMethodField()

    class Meta:
        model = ScamCategory
        fields = ['id', 'category_name', 'description', 'post_count']

    def get_post_count(self, obj):
        return obj.posts.count()

    def validate_category_name(self, value):
        # Kiểm tra unique (trừ trường hợp update chính nó)
        qs = ScamCategory.objects.filter(category_name__iexact=value)
        if self.instance:
            qs = qs.exclude(pk=self.instance.pk)
        if qs.exists():
            raise serializers.ValidationError('Tên danh mục này đã tồn tại.')
        return value
