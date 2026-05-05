import json
import re
import unicodedata
import urllib.error
import urllib.request
from typing import Any

from django.conf import settings
from django.utils import timezone

from api.models import Post, ScamCategory

# NOTE VAN DAP:
# Service nay chi chay khi Admin bam "Phan tich" tren trang kiem duyet.
# Flow:
# 1. analyze_and_store_post doi status PROCESSING.
# 2. Chon provider: gemini/openai/local tuy settings va API key.
# 3. Chuan hoa ket qua ve schema chung: is_scam, is_spam, confidence, category, signals...
# 4. Luu ket qua JSON vao Post.ai_analysis_result de admin xem.
# Neu API ngoai loi, he thong fallback local de demo khong bi dung.


def analyze_and_store_post(post: Post) -> Post:
    """Run AI-assisted analysis and persist the normalized suggestion on the post."""
    # Khi admin bam "Phan tich", doi status sang PROCESSING de FE hien loading.
    post.ai_analysis_status = Post.AIAnalysisStatus.PROCESSING
    post.ai_analysis_error = ''  # xoa loi cu neu bai nay tung phan tich that bai.
    post.save(update_fields=['ai_analysis_status', 'ai_analysis_error'])  # chi update dung field AI.

    try:
        # analyze_post_content tra ve: ket qua da chuan hoa, provider da dung, va loi fallback neu co.
        result, provider, error = analyze_post_content(post)
        post.ai_analysis_status = Post.AIAnalysisStatus.COMPLETED  # FE biet da co ket qua.
        post.ai_analysis_result = result  # JSON hien thi trong khung "Goi y AI" cua admin.
        post.ai_analysis_provider = provider  # gemini/openai/local de admin biet nguon goi y.
        post.ai_analysis_error = error[:1000] if error else ''  # neu fallback local thi van luu canh bao ngan.
        post.ai_analyzed_at = timezone.now()  # moc thoi gian phan tich gan nhat.
        post.save(update_fields=[
            'ai_analysis_status',
            'ai_analysis_result',
            'ai_analysis_provider',
            'ai_analysis_error',
            'ai_analyzed_at',
        ])
    except Exception as exc:
        # Neu co loi khong xu ly duoc thi luu FAILED de FE hien thong bao loi thay vi treo loading.
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
    # Lay danh muc lua dao trong DB de AI chon category ton tai trong he thong.
    categories = list(ScamCategory.objects.order_by('category_name').values_list('category_name', flat=True))
    provider = _select_provider()  # uu tien settings, neu khong co API key thi chay local.

    if provider == 'local':
        # Local la bo rule tu khoa noi bo, dung duoc ca khi demo offline.
        return _local_analysis(post, categories), 'local', ''

    prompt = _build_prompt(post, categories)  # prompt gom title/content/schema JSON bat buoc.
    try:
        if provider == 'openai':
            raw = _call_openai(prompt)  # goi OpenAI va lay text JSON tra ve.
        elif provider == 'gemini':
            raw = _call_gemini(prompt)  # goi Gemini va lay text JSON tra ve.
        else:
            raw = _local_analysis(post, categories)
            return raw, 'local', ''

        parsed = _parse_json_text(raw)  # AI co the tra ve markdown, ham nay boc ra JSON that.
        return _normalize_result(parsed, categories), provider, ''
    except Exception as exc:
        # Neu API ngoai loi, van tra ket qua local de admin co goi y va buoi demo khong bi dung.
        fallback = _local_analysis(post, categories)
        return fallback, 'local', f'{provider} API unavailable, used local fallback: {exc}'


def _select_provider() -> str:
    # AI_ANALYSIS_PROVIDER co the ep chay openai/gemini/local.
    configured = getattr(settings, 'AI_ANALYSIS_PROVIDER', 'auto')
    if configured in {'openai', 'gemini', 'local'}:
        return configured
    # Che do auto: co key nao thi dung key do, khong co thi local.
    if getattr(settings, 'GEMINI_API_KEY', ''):
        return 'gemini'
    if getattr(settings, 'OPENAI_API_KEY', ''):
        return 'openai'
    return 'local'


def _build_prompt(post: Post, categories: list[str]) -> str:
    # Dua danh muc vao prompt de AI khong tu tao ten category lung tung.
    category_text = ', '.join(categories) if categories else 'Chưa có danh mục trong hệ thống'
    return f"""
Bạn là trợ lý kiểm duyệt của ScamAlertVN.
Hãy phân tích bài viết người dùng gửi lên và chỉ trả lời một JSON hợp lệ, không markdown.

Nhiệm vụ gồm 2 phần độc lập:
1. Kiểm tra bài có đang chia sẻ/cảnh báo hành vi lừa đảo hay có dấu hiệu lừa đảo không.
2. Kiểm tra bài có phải spam/rao vặt/lệch chủ đề không, ví dụ đăng cho thuê nhà đất,
   bán hàng, quảng cáo dịch vụ, tuyển người, kêu gọi inbox/zalo nhưng không chia sẻ cảnh báo lừa đảo.

Cần trả lời theo schema:
{{
  "is_scam": true,
  "confidence": 0-100,
  "category": "tên danh mục phù hợp hoặc null",
  "is_spam": false,
  "spam_confidence": 0-100,
  "spam_type": "rao vặt bất động sản/quảng cáo bán hàng/tuyển dụng/lệch chủ đề hoặc null",
  "summary": "tóm tắt ngắn về nhận định",
  "signals": ["2-3 dấu hiệu nhận biết chính"],
  "spam_signals": ["1-3 dấu hiệu spam/lệch chủ đề nếu có"],
  "recommended_action": "approve/reject/review"
}}

Nếu bài chủ yếu là rao vặt/quảng cáo/lệch chủ đề chứ không phải chia sẻ cảnh báo lừa đảo,
đặt is_spam=true và recommended_action="reject" hoặc "review".

Danh mục hợp lệ: [{category_text}]

Bài viết:
Tiêu đề: {post.title}
Nội dung: {post.content}
""".strip()


def _call_openai(prompt: str) -> str:
    api_key = getattr(settings, 'OPENAI_API_KEY', '')
    if not api_key:
        raise RuntimeError('OPENAI_API_KEY is not configured')

    # Payload theo Responses API: input la prompt, model lay tu settings de de doi model.
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

    # Du phong cho response dang nested output/content tuy phien ban API.
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
    # responseMimeType=json de tang kha nang Gemini tra dung JSON cho backend parse.
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
    # Lay text dau tien trong candidates, sau do _parse_json_text se xu ly tiep.
    for part in parts:
        if part.get('text'):
            return part['text']

    raise RuntimeError('Gemini response did not contain output text')


def _post_json(url: str, payload: dict[str, Any], headers: dict[str, str]) -> dict[str, Any]:
    # Ham goi HTTP chung cho OpenAI/Gemini, khong dung them thu vien ngoai.
    body = json.dumps(payload, ensure_ascii=False).encode('utf-8')
    request = urllib.request.Request(url, data=body, headers=headers, method='POST')
    timeout = getattr(settings, 'AI_ANALYSIS_TIMEOUT_SECONDS', 15)

    try:
        with urllib.request.urlopen(request, timeout=timeout) as response:
            return json.loads(response.read().decode('utf-8'))
    except urllib.error.HTTPError as exc:
        # Cat ngan response loi de khong luu qua dai vao ai_analysis_error.
        detail = exc.read().decode('utf-8', errors='ignore')
        raise RuntimeError(f'HTTP {exc.code}: {detail[:300]}') from exc


def _parse_json_text(text: str) -> dict[str, Any]:
    # AI doi khi boc JSON trong ```json ... ```, nen can go bo markdown truoc.
    cleaned = text.strip()
    fenced = re.search(r'```(?:json)?\s*(.*?)```', cleaned, flags=re.IGNORECASE | re.DOTALL)
    if fenced:
        cleaned = fenced.group(1).strip()

    try:
        data = json.loads(cleaned)
    except json.JSONDecodeError:
        # Neu text co chen loi giai thich, thu cat tu dau "{" den cuoi "}".
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
    # Chuan hoa nhieu ten field khac nhau ve schema FE dang doc.
    is_scam = _as_bool(
        _pick(data, 'is_scam', 'isScam', 'la_lua_dao', 'is_fraud', 'isSuspicious')
    )
    # Confidence luon ep ve so nguyen 0-100 de ve thanh progress bar.
    confidence = _as_confidence(
        _pick(data, 'confidence', 'confidence_score', 'scam_confidence', 'score')
    )
    # Category duoc match voi danh muc trong DB; neu khong match thi giu text AI goi y.
    category = _match_category(
        _pick(data, 'category', 'suggested_category', 'danh_muc', 'classification'),
        categories,
    )
    # signals la cac dau hieu canh bao, FE hien thanh chip trong khung goi y AI.
    signals = _as_list(_pick(data, 'signals', 'red_flags', 'dau_hieu', 'key_signs'))[:5]
    is_spam = _as_bool(
        _pick(data, 'is_spam', 'isSpam', 'spam', 'is_advertisement', 'is_off_topic', 'off_topic', 'irrelevant'),
        true_words={'spam', 'quang cao', 'rao vat', 'off-topic', 'off_topic', 'le chu de', 'lệch chủ đề'},
    )
    spam_confidence_raw = _pick(data, 'spam_confidence', 'spam_score', 'spamConfidence', 'off_topic_confidence')
    spam_confidence = (
        _as_confidence(spam_confidence_raw)
        if spam_confidence_raw is not None
        else (75 if is_spam else 0)
    )
    spam_type = str(_pick(data, 'spam_type', 'spam_category', 'off_topic_type', default='')).strip()
    spam_signals = _as_list(_pick(data, 'spam_signals', 'spam_red_flags', 'off_topic_signals'))[:5]
    summary = str(_pick(data, 'summary', 'tom_tat', 'analysis', default='')).strip()
    recommended_action = str(_pick(data, 'recommended_action', 'action', default='review')).lower()

    if recommended_action not in {'approve', 'reject', 'review'}:
        # Neu AI tra action la, ep ve review de admin tu quyet dinh.
        recommended_action = 'review'
    if not summary:
        summary = 'Nội dung cần được Admin đối chiếu thêm với bằng chứng trong bài.'
    if not signals:
        signals = ['Chưa có dấu hiệu nổi bật được AI trích xuất.']
    if not is_spam and spam_confidence >= 55:
        is_spam = True
    if is_spam and not spam_type:
        spam_type = 'Rao vặt/quảng cáo/lệch chủ đề'
    if is_spam and not spam_signals:
        spam_signals = ['Nội dung có dấu hiệu quảng cáo hoặc không tập trung chia sẻ cảnh báo lừa đảo.']
    if is_spam and not is_scam and recommended_action == 'approve':
        recommended_action = 'reject' if spam_confidence >= 70 else 'review'

    return {
        # Output cuoi cung chi giu cac key FE can, tranh leak response tho cua AI.
        'is_scam': is_scam,
        'confidence': confidence,
        'category': category if is_scam else None,
        'is_spam': is_spam,
        'spam_confidence': spam_confidence,
        'spam_type': spam_type if is_spam else None,
        'summary': summary,
        'signals': signals,
        'spam_signals': spam_signals,
        'recommended_action': recommended_action,
    }


def _local_analysis(post: Post, categories: list[str]) -> dict[str, Any]:
    # Bo dau + lowercase de keyword tieng Viet khong dau van match duoc noi dung.
    text = _fold(f'{post.title} {post.content}')
    matched_signals: list[str] = []
    confidence = 15  # diem nen thap, moi dau hieu nghi ngo se cong them.

    # Moi rule gom: danh sach keyword, mo ta dau hieu, diem cong vao confidence.
    signal_rules = [
        (['lua dao', 'canh bao', 'bi lua', 'mat tien', 'chiem doat'], 'Người viết đang báo cáo/cảnh báo hành vi lừa đảo', 30),
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
            matched_signals.append(signal)  # luu dau hieu de FE hien thanh chip.
            confidence += weight  # cang nhieu dau hieu thi do tin cay cang cao.

    category_hint = _local_category_hint(text)  # doan category so bo dua tren keyword.
    category = _match_category(category_hint, categories)  # doi hint ve ten category trong DB neu co.
    confidence = min(confidence, 95)  # local rule khong cho len 100 de admin van can xem.
    is_scam = confidence >= 45  # nguong noi bo: >=45 xem la co dau hieu lua dao.
    spam_result = _local_spam_analysis(text, is_scam)
    is_spam = spam_result['is_spam']
    spam_confidence = spam_result['spam_confidence']

    if not matched_signals:
        matched_signals = ['Chưa phát hiện dấu hiệu lừa đảo rõ ràng từ bộ từ khóa nội bộ.']

    return {
        'is_scam': is_scam,
        'confidence': confidence,
        'category': category if is_scam else None,
        'is_spam': is_spam,
        'spam_confidence': spam_confidence,
        'spam_type': spam_result['spam_type'] if is_spam else None,
        'summary': (
            'Nội dung vừa có dấu hiệu cảnh báo vừa có dấu hiệu rao vặt/lệch chủ đề, nên Admin xem kỹ trước khi duyệt.'
            if is_scam and is_spam
            else 'Nội dung có nhiều dấu hiệu cảnh báo, nên ưu tiên kiểm tra bằng chứng trước khi duyệt.'
            if is_scam
            else 'Nội dung giống rao vặt/quảng cáo lệch chủ đề hơn là bài chia sẻ cảnh báo lừa đảo.'
            if is_spam
            else 'Nội dung chưa đủ dấu hiệu để kết luận là mô tả hành vi lừa đảo.'
        ),
        'signals': matched_signals[:3],
        'spam_signals': spam_result['spam_signals'],
        'recommended_action': (
            'review'
            if is_scam
            else 'reject'
            if is_spam and spam_confidence >= 70
            else 'review'
            if is_spam
            else 'approve'
        ),
    }


def _local_spam_analysis(text: str, is_scam: bool) -> dict[str, Any]:
    # Spam o day la bai rao vat/quang cao/le chu de, khong phai bai canh bao lua dao that su.
    spam_signals: list[str] = []
    spam_confidence = 0

    spam_rules = [
        (
            ['cho thue', 'phong tro', 'nha tro', 'nha nguyen can', 'can ho', 'mat bang', 'van phong', 'bat dong san', 'nha dat', 'mua ban nha dat', 'dat nen', 'ban dat', 'sang nhuong', 'shophouse'],
            'Rao vặt bất động sản/cho thuê nhà đất',
            60,
        ),
        (
            ['ban hang', 'giam gia', 'khuyen mai', 'sale', 'xa kho', 'chot don', 'gia re', 'my pham', 'thoi trang', 'sim so'],
            'Quảng cáo bán hàng hoặc khuyến mãi',
            35,
        ),
        (
            ['dich vu', 'khoa hoc', 'tu van', 'bao hiem', 'vay von', 'cho vay', 'mo the', 'lam visa'],
            'Quảng cáo dịch vụ không liên quan cảnh báo lừa đảo',
            30,
        ),
        (
            ['lien he', 'inbox', 'ib', 'zalo', 'hotline', 'goi ngay', 'nhan tin rieng'],
            'Kêu gọi liên hệ riêng/inbox như nội dung quảng cáo',
            25,
        ),
        (
            ['can tuyen', 'tuyen nhan vien', 'tuyen ctv', 'lam viec tai nha'],
            'Tin tuyển dụng/rao tuyển người lệch chủ đề',
            25,
        ),
    ]
    report_terms = [
        'lua dao', 'canh bao', 'bao cao', 'bi lua', 'mat tien', 'chuyen tien',
        'khong giao', 'gia mao', 'chiem doat', 'can than', 'dau hieu', 'nghi van',
        'chan', 'block',
    ]

    for keywords, signal, weight in spam_rules:
        if any(keyword in text for keyword in keywords):
            spam_signals.append(signal)
            spam_confidence += weight

    # Neu bai co ngon ngu bao cao/canh bao ro rang thi giam diem spam de tranh bat nham
    # cac bai canh bao lua dao dat coc nha dat, mua hang, viec lam...
    if any(term in text for term in report_terms):
        spam_confidence -= 30
    if is_scam:
        spam_confidence -= 15

    spam_confidence = max(0, min(95, spam_confidence))
    is_spam = spam_confidence >= 55
    if not is_spam:
        spam_signals = []

    return {
        'is_spam': is_spam,
        'spam_confidence': spam_confidence,
        'spam_type': spam_signals[0] if spam_signals else None,
        'spam_signals': spam_signals[:3],
    }


def _local_category_hint(text: str) -> str | None:
    # Map keyword noi bo sang ten danh muc gan dung, sau do _match_category se so voi DB.
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
    # Lay field dau tien co gia tri, giup chap nhan nhieu cach AI dat ten key.
    for key in keys:
        if key not in data:
            continue
        value = data[key]
        if value is None or value == '':
            continue
        return value
    return default


def _as_bool(value: Any, true_words: set[str] | None = None) -> bool:
    # Chuyen nhieu kieu true/false cua AI ve boolean Python.
    if isinstance(value, bool):
        return value
    if isinstance(value, (int, float)):
        return value > 0
    if isinstance(value, str):
        words = {'true', 'yes', '1', 'co', 'lua dao', 'scam'}
        if true_words:
            words |= {_fold(word) for word in true_words}
        return _fold(value.strip()) in words
    return False


def _as_confidence(value: Any) -> int:
    # Chuyen score dang 0.8, "80%" hoac 80 ve so nguyen 0-100.
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
    # AI co the tra list hoac chuoi xuong dong; FE can list string.
    if isinstance(value, list):
        return [str(item).strip() for item in value if str(item).strip()]
    if isinstance(value, str):
        parts = re.split(r'[\n;]+', value)
        return [part.strip(' -') for part in parts if part.strip(' -')]
    return []


def _match_category(value: Any, categories: list[str]) -> str | None:
    # So khop khong dau de "lua dao dau tu" match voi "Lừa đảo đầu tư".
    if not value:
        return None
    folded_value = _fold(str(value))
    for category in categories:
        folded_category = _fold(category)
        if folded_value == folded_category or folded_value in folded_category or folded_category in folded_value:
            return category
    return str(value).strip() or None


def _fold(value: str) -> str:
    # Bo dau tieng Viet va lowercase phuc vu search/match keyword.
    normalized = unicodedata.normalize('NFD', value)
    without_marks = ''.join(char for char in normalized if unicodedata.category(char) != 'Mn')
    return without_marks.lower()
