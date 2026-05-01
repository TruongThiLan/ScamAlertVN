import json
import re
import unicodedata
import urllib.error
import urllib.request
from typing import Any

from django.conf import settings
from django.utils import timezone

from api.models import Post, ScamCategory


def analyze_and_store_post(post: Post) -> Post:
    """Run AI-assisted analysis and persist the normalized suggestion on the post."""
    post.ai_analysis_status = Post.AIAnalysisStatus.PROCESSING
    post.ai_analysis_error = ''
    post.save(update_fields=['ai_analysis_status', 'ai_analysis_error'])

    try:
        result, provider, error = analyze_post_content(post)
        post.ai_analysis_status = Post.AIAnalysisStatus.COMPLETED
        post.ai_analysis_result = result
        post.ai_analysis_provider = provider
        post.ai_analysis_error = error[:1000] if error else ''
        post.ai_analyzed_at = timezone.now()
        post.save(update_fields=[
            'ai_analysis_status',
            'ai_analysis_result',
            'ai_analysis_provider',
            'ai_analysis_error',
            'ai_analyzed_at',
        ])
    except Exception as exc:
        post.ai_analysis_status = Post.AIAnalysisStatus.FAILED
        post.ai_analysis_error = str(exc)[:1000]
        post.ai_analyzed_at = timezone.now()
        post.save(update_fields=[
            'ai_analysis_status',
            'ai_analysis_error',
            'ai_analyzed_at',
        ])

    return post


def analyze_post_content(post: Post) -> tuple[dict[str, Any], str, str]:
    categories = list(ScamCategory.objects.order_by('category_name').values_list('category_name', flat=True))
    provider = _select_provider()

    if provider == 'local':
        return _local_analysis(post, categories), 'local', ''

    prompt = _build_prompt(post, categories)
    try:
        if provider == 'openai':
            raw = _call_openai(prompt)
        elif provider == 'gemini':
            raw = _call_gemini(prompt)
        else:
            raw = _local_analysis(post, categories)
            return raw, 'local', ''

        parsed = _parse_json_text(raw)
        return _normalize_result(parsed, categories), provider, ''
    except Exception as exc:
        fallback = _local_analysis(post, categories)
        return fallback, 'local', f'{provider} API unavailable, used local fallback: {exc}'


def _select_provider() -> str:
    configured = getattr(settings, 'AI_ANALYSIS_PROVIDER', 'auto')
    if configured in {'openai', 'gemini', 'local'}:
        return configured
    if getattr(settings, 'GEMINI_API_KEY', ''):
        return 'gemini'
    if getattr(settings, 'OPENAI_API_KEY', ''):
        return 'openai'
    return 'local'


def _build_prompt(post: Post, categories: list[str]) -> str:
    category_text = ', '.join(categories) if categories else 'Chưa có danh mục trong hệ thống'
    return f"""
Bạn là trợ lý kiểm duyệt của ScamAlertVN.
Hãy phân tích bài viết người dùng gửi lên và chỉ trả lời một JSON hợp lệ, không markdown.

Cần trả lời theo schema:
{{
  "is_scam": true,
  "confidence": 0-100,
  "category": "tên danh mục phù hợp hoặc null",
  "summary": "tóm tắt ngắn về nhận định",
  "signals": ["2-3 dấu hiệu nhận biết chính"],
  "recommended_action": "approve/reject/review"
}}

Danh mục hợp lệ: [{category_text}]

Bài viết:
Tiêu đề: {post.title}
Nội dung: {post.content}
""".strip()


def _call_openai(prompt: str) -> str:
    api_key = getattr(settings, 'OPENAI_API_KEY', '')
    if not api_key:
        raise RuntimeError('OPENAI_API_KEY is not configured')

    payload = {
        'model': getattr(settings, 'OPENAI_MODEL', 'gpt-4.1-mini'),
        'input': prompt,
    }
    data = _post_json(
        'https://api.openai.com/v1/responses',
        payload,
        {
            'Authorization': f'Bearer {api_key}',
            'Content-Type': 'application/json',
        },
    )
    text = data.get('output_text')
    if text:
        return text

    for item in data.get('output', []):
        for content in item.get('content', []):
            if content.get('type') in {'output_text', 'text'} and content.get('text'):
                return content['text']

    raise RuntimeError('OpenAI response did not contain output text')


def _call_gemini(prompt: str) -> str:
    api_key = getattr(settings, 'GEMINI_API_KEY', '')
    if not api_key:
        raise RuntimeError('GEMINI_API_KEY is not configured')

    model = getattr(settings, 'GEMINI_MODEL', 'gemini-2.5-flash')
    payload = {
        'contents': [
            {
                'parts': [{'text': prompt}],
            }
        ],
        'generationConfig': {
            'temperature': 0.2,
            'responseMimeType': 'application/json',
        },
    }
    data = _post_json(
        f'https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent',
        payload,
        {
            'x-goog-api-key': api_key,
            'Content-Type': 'application/json',
        },
    )

    candidates = data.get('candidates') or []
    parts = (candidates[0].get('content', {}).get('parts') if candidates else []) or []
    for part in parts:
        if part.get('text'):
            return part['text']

    raise RuntimeError('Gemini response did not contain output text')


def _post_json(url: str, payload: dict[str, Any], headers: dict[str, str]) -> dict[str, Any]:
    body = json.dumps(payload, ensure_ascii=False).encode('utf-8')
    request = urllib.request.Request(url, data=body, headers=headers, method='POST')
    timeout = getattr(settings, 'AI_ANALYSIS_TIMEOUT_SECONDS', 15)

    try:
        with urllib.request.urlopen(request, timeout=timeout) as response:
            return json.loads(response.read().decode('utf-8'))
    except urllib.error.HTTPError as exc:
        detail = exc.read().decode('utf-8', errors='ignore')
        raise RuntimeError(f'HTTP {exc.code}: {detail[:300]}') from exc


def _parse_json_text(text: str) -> dict[str, Any]:
    cleaned = text.strip()
    fenced = re.search(r'```(?:json)?\s*(.*?)```', cleaned, flags=re.IGNORECASE | re.DOTALL)
    if fenced:
        cleaned = fenced.group(1).strip()

    try:
        data = json.loads(cleaned)
    except json.JSONDecodeError:
        start = cleaned.find('{')
        end = cleaned.rfind('}')
        if start == -1 or end == -1 or end <= start:
            raise
        data = json.loads(cleaned[start:end + 1])

    if isinstance(data, list):
        data = data[0] if data else {}
    if not isinstance(data, dict):
        raise ValueError('AI response JSON must be an object')
    return data


def _normalize_result(data: dict[str, Any], categories: list[str]) -> dict[str, Any]:
    is_scam = _as_bool(
        _pick(data, 'is_scam', 'isScam', 'la_lua_dao', 'is_fraud', 'isSuspicious')
    )
    confidence = _as_confidence(
        _pick(data, 'confidence', 'confidence_score', 'scam_confidence', 'score')
    )
    category = _match_category(
        _pick(data, 'category', 'suggested_category', 'danh_muc', 'classification'),
        categories,
    )
    signals = _as_list(_pick(data, 'signals', 'red_flags', 'dau_hieu', 'key_signs'))[:5]
    summary = str(_pick(data, 'summary', 'tom_tat', 'analysis', default='')).strip()
    recommended_action = str(_pick(data, 'recommended_action', 'action', default='review')).lower()

    if recommended_action not in {'approve', 'reject', 'review'}:
        recommended_action = 'review'
    if not summary:
        summary = 'Nội dung cần được Admin đối chiếu thêm với bằng chứng trong bài.'
    if not signals:
        signals = ['Chưa có dấu hiệu nổi bật được AI trích xuất.']

    return {
        'is_scam': is_scam,
        'confidence': confidence,
        'category': category if is_scam else None,
        'summary': summary,
        'signals': signals,
        'recommended_action': recommended_action,
    }


def _local_analysis(post: Post, categories: list[str]) -> dict[str, Any]:
    text = _fold(f'{post.title} {post.content}')
    matched_signals: list[str] = []
    confidence = 15

    signal_rules = [
        (['cong an', 'toa an', 'vien kiem sat', 'co quan nha nuoc', 'dieu tra'], 'Giả danh cơ quan chức năng', 25),
        (['chuyen tien', 'stk', 'tai khoan ngan hang', 'dat coc', 'phi xu ly'], 'Có yêu cầu chuyển tiền hoặc đặt cọc', 25),
        (['otp', 'ma xac minh', 'mat khau', 'dang nhap', 'cccd', 'can cuoc'], 'Yêu cầu thông tin xác minh nhạy cảm', 20),
        (['gap', 'ngay lap tuc', 'khong se bi', 'khoa tai khoan', 'bat giu'], 'Tạo áp lực thời gian hoặc đe dọa', 20),
        (['lai suat', 'loi nhuan', 'tien ao', 'crypto', 'san dau tu', 'hoa hong'], 'Hứa hẹn lợi nhuận bất thường', 20),
        (['viec lam', 'tuyen dung', 'nhiem vu', 'luong cao'], 'Dấu hiệu việc làm/nhiệm vụ có thu phí', 15),
        (['khong giao hang', 'shop', 'mua hang', 'chot don', 'ship'], 'Liên quan giao dịch mua bán online', 15),
        (['hen ho', 'tinh cam', 'qua tang', 'nguoi yeu'], 'Khai thác mối quan hệ tình cảm', 15),
    ]

    for keywords, signal, weight in signal_rules:
        if any(keyword in text for keyword in keywords):
            matched_signals.append(signal)
            confidence += weight

    category_hint = _local_category_hint(text)
    category = _match_category(category_hint, categories)
    confidence = min(confidence, 95)
    is_scam = confidence >= 45

    if not matched_signals:
        matched_signals = ['Chưa phát hiện dấu hiệu lừa đảo rõ ràng từ bộ từ khóa nội bộ.']

    return {
        'is_scam': is_scam,
        'confidence': confidence,
        'category': category if is_scam else None,
        'summary': (
            'Nội dung có nhiều dấu hiệu cảnh báo, nên ưu tiên kiểm tra bằng chứng trước khi duyệt.'
            if is_scam
            else 'Nội dung chưa đủ dấu hiệu để kết luận là mô tả hành vi lừa đảo.'
        ),
        'signals': matched_signals[:3],
        'recommended_action': 'review' if is_scam else 'approve',
    }


def _local_category_hint(text: str) -> str | None:
    if any(keyword in text for keyword in ['cong an', 'toa an', 'vien kiem sat', 'co quan nha nuoc']):
        return 'Gia mao co quan nha nuoc'
    if any(keyword in text for keyword in ['dau tu', 'tien ao', 'crypto', 'san dau tu', 'loi nhuan']):
        return 'Lua dao dau tu'
    if any(keyword in text for keyword in ['hen ho', 'tinh cam', 'nguoi yeu', 'qua tang']):
        return 'Lua dao tinh cam'
    if any(keyword in text for keyword in ['shop', 'mua hang', 'khong giao hang', 'dat coc', 'ship']):
        return 'Lua dao mua sam online'
    if any(keyword in text for keyword in ['viec lam', 'tuyen dung', 'nhiem vu', 'luong cao']):
        return 'Viec lam lua dao'
    return None


def _pick(data: dict[str, Any], *keys: str, default: Any = None) -> Any:
    for key in keys:
        if key not in data:
            continue
        value = data[key]
        if value is None or value == '':
            continue
        return value
    return default


def _as_bool(value: Any) -> bool:
    if isinstance(value, bool):
        return value
    if isinstance(value, (int, float)):
        return value > 0
    if isinstance(value, str):
        return value.strip().lower() in {'true', 'yes', '1', 'co', 'lua dao', 'scam'}
    return False


def _as_confidence(value: Any) -> int:
    if value is None:
        return 50
    if isinstance(value, str):
        value = value.strip().replace('%', '')
    try:
        number = float(value)
    except (TypeError, ValueError):
        return 50
    if 0 <= number <= 1:
        number *= 100
    return max(0, min(100, int(round(number))))


def _as_list(value: Any) -> list[str]:
    if isinstance(value, list):
        return [str(item).strip() for item in value if str(item).strip()]
    if isinstance(value, str):
        parts = re.split(r'[\n;]+', value)
        return [part.strip(' -') for part in parts if part.strip(' -')]
    return []


def _match_category(value: Any, categories: list[str]) -> str | None:
    if not value:
        return None
    folded_value = _fold(str(value))
    for category in categories:
        folded_category = _fold(category)
        if folded_value == folded_category or folded_value in folded_category or folded_category in folded_value:
            return category
    return str(value).strip() or None


def _fold(value: str) -> str:
    normalized = unicodedata.normalize('NFD', value)
    without_marks = ''.join(char for char in normalized if unicodedata.category(char) != 'Mn')
    return without_marks.lower()
