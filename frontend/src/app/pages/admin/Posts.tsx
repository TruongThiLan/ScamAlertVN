import { useState } from 'react';
import {
  Search,
  Eye,
  Trash2,
  Lock,
  EyeOff,
  Check,
  X,
  AlertTriangle,
  Loader2,
  Sparkles,
  ShieldAlert,
  RefreshCw,
} from 'lucide-react';
import { useSearchParams } from 'react-router';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/dialog';
import { Button } from '../../components/ui/button';
import { Textarea } from '../../components/ui/textarea';
import { ScrollArea } from '../../components/ui/scroll-area';

import { useOutletContext } from 'react-router';
import api from '../../../api/axiosInstance';
import type { Post, Category } from './AdminLayout';

// NOTE VAN DAP:
// AdminPosts la man hinh kiem duyet bai.
// Du lieu posts den tu AdminLayout qua useOutletContext.
// Admin co the xem chi tiet, goi AI analysis, approve/reject/hide/lock/delete.
// Moi nut action tuong ung voi custom endpoint trong backend PostViewSet.

const UNCATEGORIZED_CATEGORY_ID = 'uncategorized';

// Re-export để AdminLayout không bị lỗi import cũ
export type { Post };

type ActionType = 'approve' | 'reject' | 'hide' | 'lock' | 'delete' | null;

type AIAnalysis = Post['aiAnalysis'];

function mapAIAnalysis(raw: any): AIAnalysis {
  // Backend luu ket qua AI bang snake_case, FE map ve object aiAnalysis.
  return {
    status: raw.ai_analysis_status ?? 'NOT_ANALYZED',
    provider: raw.ai_analysis_provider ?? '',
    result: raw.ai_analysis_result ?? null,
    error: raw.ai_analysis_error ?? '',
    analyzedAt: raw.ai_analyzed_at ?? null,
  };
}

function formatProvider(provider: string) {
  if (provider === 'openai') return 'OpenAI GPT';
  if (provider === 'gemini') return 'Google Gemini';
  if (provider === 'local') return 'Local AI';
  return 'AI';
}

interface OutletCtx {
  posts: Post[];
  setPosts: React.Dispatch<React.SetStateAction<Post[]>>;
  fetchPosts: () => Promise<void>;
  categories: Category[];
  loadingPosts: boolean;
}

export function AdminPosts() {
  const [searchParams] = useSearchParams();
  const categoryFilter = searchParams.get('category');

  const { posts, setPosts, fetchPosts, loadingPosts } = useOutletContext<OutletCtx>();

  const [searchQuery, setSearchQuery] = useState(''); // tu khoa tim bai trong admin.
  const [statusFilter, setStatusFilter] = useState('all'); // loc theo trang thai bai.
  const [selectedPost, setSelectedPost] = useState<Post | null>(null); // bai dang xem/xu ly.
  const [actionType, setActionType] = useState<ActionType>(null); // hanh dong admin sap xac nhan.
  const [actionReason, setActionReason] = useState(''); // ly do reject/hide/lock/delete.
  const [showDetailDialog, setShowDetailDialog] = useState(false); // popup xem chi tiet bai.
  const [submitting, setSubmitting] = useState(false); // dang goi API action.
  const [analyzingPostId, setAnalyzingPostId] = useState<string | null>(null); // bai dang chay AI.

  // ─── Lọc bài hiển thị ────────────────────────────────────────────────────
  const filteredPosts = posts.filter((post) => {
    // Loc tai frontend de admin doi filter/search nhanh, khong can goi API moi.
    const matchesSearch =
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.author.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter
      ? categoryFilter === UNCATEGORIZED_CATEGORY_ID
        ? !post.category
        : post.category?.id === categoryFilter
      : true;
    const matchesStatus =
      statusFilter === 'all' || post.status === statusFilter;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  // ─── Mở dialog hành động ─────────────────────────────────────────────────
  const handleAction = (post: Post, type: ActionType) => {
    setSelectedPost(post);
    setActionType(type);
    setActionReason('');
  };

  const cancelAction = () => {
    setActionType(null);
    setSelectedPost(null);
    setActionReason('');
  };

  const handleAnalyzePost = async (post: Post) => {
    setAnalyzingPostId(post.id);
    try {
      // Goi backend phan tich AI thu cong; bai moi dang PENDING khong tu chay AI.
      const res = await api.post(`posts/${post.id}/ai-analyze/`);
      const rawPost = res.data?.post;
      const aiAnalysis = mapAIAnalysis(rawPost ?? {});

      setPosts((prev) =>
        prev.map((item) =>
          item.id === post.id ? { ...item, aiAnalysis } : item
        )
      );
      setSelectedPost((current) =>
        current?.id === post.id ? { ...current, aiAnalysis } : current
      );
      toast.success('Đã cập nhật gợi ý AI');
    } catch (err: any) {
      const msg =
        err?.response?.data?.detail ||
        Object.values(err?.response?.data ?? {}).flat().join(' ') ||
        'Không thể phân tích nội dung lúc này.';
      toast.error(String(msg));
    } finally {
      setAnalyzingPostId(null);
    }
  };

  // ─── Gọi API & cập nhật state ────────────────────────────────────────────
  const confirmAction = async () => {
    if (!selectedPost || !actionType) return;

    // Mot so action can reason de backend luu ly do va gui thong bao cho user.
    // Validate reason
    const needsReason = ['reject', 'hide', 'lock', 'delete'].includes(actionType);
    if (needsReason && actionReason.trim().length < 10) {
      toast.error('Vui lòng nhập lý do ít nhất 10 ký tự.');
      return;
    }

    setSubmitting(true);
    try {
      const id = selectedPost.id;

      if (actionType === 'approve') { // nut "Duyet bai".
        await api.post(`posts/${id}/approve/`, {});
        setPosts((prev) =>
          prev.map((p) => (p.id === id ? { ...p, status: 'APPROVED' } : p))
        );
        toast.success('Đã duyệt bài viết');

      } else if (actionType === 'reject') { // nut "Tu choi".
        await api.post(`posts/${id}/reject/`, { reason: actionReason });
        setPosts((prev) =>
          prev.map((p) =>
            p.id === id ? { ...p, status: 'REJECTED', rejectionReason: actionReason } : p
          )
        );
        toast.success('Đã từ chối bài viết');

      } else if (actionType === 'hide') { // nut "An".
        await api.post(`posts/${id}/hide/`, { reason: actionReason });
        setPosts((prev) =>
          prev.map((p) => (p.id === id ? { ...p, status: 'HIDDEN' } : p))
        );
        toast.success('Đã ẩn bài viết');

      } else if (actionType === 'lock') { // nut "Khoa".
        await api.post(`posts/${id}/lock/`, { reason: actionReason });
        setPosts((prev) =>
          prev.map((p) => (p.id === id ? { ...p, status: 'LOCKED' } : p))
        );
        toast.success('Đã khóa bài viết');

      } else if (actionType === 'delete') { // nut "Xoa".
        await api.delete(`posts/${id}/admin-delete/`, {
          data: { reason: actionReason, confirm: true },
        });
        setPosts((prev) => prev.filter((p) => p.id !== id));
        toast.success('Đã xóa bài viết khỏi hệ thống');
      }

      cancelAction();
    } catch (err: any) {
      const msg =
        err?.response?.data?.detail ||
        Object.values(err?.response?.data ?? {}).flat().join(' ') ||
        'Đã xảy ra lỗi, vui lòng thử lại.';
      toast.error(String(msg));
    } finally {
      setSubmitting(false);
    }
  };

  // ─── Badge trạng thái ─────────────────────────────────────────────────────
  const getStatusBadge = (post: Post) => {
    switch (post.status) {
      case 'PENDING':
        return <span className="px-3 py-1 rounded-lg bg-[#FEF3C7] text-[#92400E] text-xs font-medium">Chờ duyệt</span>;
      case 'APPROVED':
        return <span className="px-3 py-1 rounded-lg bg-[#D1FAE5] text-[#065F46] text-xs font-medium">Đã duyệt</span>;
      case 'REJECTED':
        return <span className="px-3 py-1 rounded-lg bg-[#FEE2E2] text-[#991B1B] text-xs font-medium">Đã từ chối</span>;
      case 'HIDDEN':
        return <span className="px-3 py-1 rounded-lg bg-gray-100 text-gray-600 text-xs font-medium border border-gray-200">Đã ẩn</span>;
      case 'LOCKED':
        return <span className="px-3 py-1 rounded-lg bg-[#FEE2E2] text-[#991B1B] text-xs font-medium">Đã khóa</span>;
      default:
        return null;
    }
  };

  const renderAIAnalysis = (post: Post, compact = false) => {
    const analysis = post.aiAnalysis ?? {
      status: 'NOT_ANALYZED',
      provider: '',
      result: null,
      error: '',
      analyzedAt: null,
    } as AIAnalysis;
    const result = analysis?.result;
    const isAnalyzing = analyzingPostId === post.id || analysis?.status === 'PROCESSING';
    const confidence = Math.max(0, Math.min(100, Number(result?.confidence ?? 0)));
    const signals = Array.isArray(result?.signals) ? result.signals : [];
    const isScam = Boolean(result?.is_scam);
    const confidenceClass =
      confidence >= 80
        ? 'bg-[#DC2626]'
        : confidence >= 55
          ? 'bg-[#F59E0B]'
          : 'bg-[#10B981]';

    if (post.status !== 'PENDING' && !result) return null;

    return (
      <div className={`mt-4 rounded-[8px] border p-4 ${
        isScam
          ? 'border-[#FECACA] bg-[#FFF7F7]'
          : 'border-[#BFDBFE] bg-[#F8FBFF]'
      }`}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0">
            <div className={`h-9 w-9 rounded-[8px] flex items-center justify-center shrink-0 ${
              isScam ? 'bg-[#FEE2E2] text-[#DC2626]' : 'bg-[#DBEAFE] text-[#2563EB]'
            }`}>
              {isScam ? <ShieldAlert className="h-5 w-5" /> : <Sparkles className="h-5 w-5" />}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-sm font-semibold text-[#1E293B]">Gợi ý AI</p>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-white border border-[#D1D5DC] text-[#64748B]">
                  {formatProvider(analysis?.provider ?? '')}
                </span>
                {result?.recommended_action && (
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#F1F5F9] text-[#475569]">
                    {result.recommended_action === 'approve'
                      ? 'Có thể duyệt'
                      : result.recommended_action === 'reject'
                        ? 'Nên từ chối'
                        : 'Cần xem kỹ'}
                  </span>
                )}
              </div>

              {isAnalyzing ? (
                <p className="mt-1 text-sm text-[#64748B] flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Đang phân tích nội dung...
                </p>
              ) : analysis.status === 'FAILED' ? (
                <p className="mt-1 text-sm text-[#991B1B]">
                  Phân tích thất bại{analysis.error ? `: ${analysis.error}` : '.'}
                </p>
              ) : result ? (
                <>
                  <p className="mt-1 text-sm text-[#475569]">
                    Độ tin cậy là lừa đảo: <strong>{confidence}%</strong>
                    {result.category ? <> · Đề xuất: <strong>{result.category}</strong></> : null}
                  </p>
                  <div className="mt-2 h-2 w-full max-w-[420px] rounded-full bg-white border border-[#E2E8F0] overflow-hidden">
                    <div className={`h-full ${confidenceClass}`} style={{ width: `${confidence}%` }} />
                  </div>
                  {!compact && result.summary && (
                    <p className="mt-3 text-sm text-[#334155]">{result.summary}</p>
                  )}
                  {signals.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {signals.slice(0, compact ? 3 : 5).map((signal, idx) => (
                        <span key={idx} className="text-xs px-2.5 py-1 rounded-full bg-white border border-[#E2E8F0] text-[#475569]">
                          {signal}
                        </span>
                      ))}
                    </div>
                  )}
                  {analysis?.error && !compact && (
                    <p className="mt-2 text-xs text-[#92400E]">{analysis.error}</p>
                  )}
                </>
              ) : (
                <p className="mt-1 text-sm text-[#64748B]">Chưa có gợi ý cho bài viết này.</p>
              )}
            </div>
          </div>

          {post.status === 'PENDING' && (
            <Button
              onClick={() => handleAnalyzePost(post)}
              disabled={isAnalyzing}
              variant="outline"
              size="sm"
              className="shrink-0 bg-white border-[#BFDBFE] text-[#2563EB] hover:bg-[#EFF6FF] rounded-[8px]"
            >
              {isAnalyzing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              Phân tích
            </Button>
          )}
        </div>
      </div>
    );
  };

  // ─── Cấu hình dialog ──────────────────────────────────────────────────────
  const getDialogConfig = () => {
    switch (actionType) {
      case 'approve':
        return { title: 'Duyệt bài viết', needsReason: false, confirmText: 'Duyệt bài', confirmClass: 'bg-green-600 hover:bg-green-700', reasonLabel: null };
      case 'reject':
        return { title: 'Từ chối bài viết', needsReason: true, confirmText: 'Xác nhận từ chối', confirmClass: 'bg-[#E01515] hover:bg-[#C10007]', reasonLabel: 'Lý do từ chối' };
      case 'hide':
        return { title: 'Ẩn bài viết', needsReason: true, confirmText: 'Xác nhận ẩn', confirmClass: 'bg-[#E01515] hover:bg-[#C10007]', reasonLabel: 'Lý do ẩn bài' };
      case 'lock':
        return { title: 'Khóa bài viết', needsReason: true, confirmText: 'Xác nhận khóa', confirmClass: 'bg-[#E01515] hover:bg-[#C10007]', reasonLabel: 'Lý do khóa bài' };
      case 'delete':
        return { title: 'Xóa bài viết', needsReason: true, confirmText: 'Xóa vĩnh viễn', confirmClass: 'bg-[#E01515] hover:bg-[#C10007]', reasonLabel: 'Lý do xóa' };
      default:
        return null;
    }
  };

  const dialogConfig = getDialogConfig();

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-[#1E293B] mb-6">Kiểm duyệt và quản lý nội dung</h1>

      {/* Thanh tim kiem va bo loc trang thai bai viet */}
      <div className="mb-6 flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[#99A1AF]" />
          <input
            type="text"
            placeholder="Tìm kiếm bài viết..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 rounded-[10px] border border-[#D1D5DC] focus:outline-none focus:border-[#E01515] transition-colors"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2.5 rounded-[10px] border border-[#D1D5DC] bg-white text-[#4A5565] outline-none focus:border-[#E01515] cursor-pointer min-w-[180px]"
        >
          <option value="all">Tất cả trạng thái</option>
          <option value="PENDING">Chờ duyệt</option>
          <option value="APPROVED">Đã duyệt</option>
          <option value="REJECTED">Đã từ chối</option>
          <option value="HIDDEN">Đã ẩn</option>
          <option value="LOCKED">Đã khóa</option>
        </select>
      </div>

      {/* Loading state */}
      {loadingPosts ? (
        <div className="flex items-center justify-center py-20 text-[#99A1AF]">
          <Loader2 className="h-6 w-6 animate-spin mr-2" />
          Đang tải dữ liệu...
        </div>
      ) : filteredPosts.length === 0 ? (
        <div className="text-center py-20 text-[#99A1AF]">Không tìm thấy bài viết nào.</div>
      ) : (
        /* Danh sach bai viet trong admin */
        <div className="space-y-4">
          {filteredPosts.map((post) => (
            <div
              key={post.id}
              className="bg-white rounded-[10px] border border-[#D1D5DC] p-6 hover:shadow-sm transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-start gap-3 mb-2">
                    <h3 className="text-base font-semibold text-[#1E293B] flex-1">{post.title}</h3>
                    {getStatusBadge(post)}
                  </div>
                  <div className="flex items-center gap-4 text-sm text-[#99A1AF]">
                    <span>Tác giả: {post.author.name}</span>
                    <span>•</span>
                    <span>{post.category?.name ?? '(chưa phân loại)'}</span>
                    <span>•</span>
                    <span>{new Date(post.createdAt).toLocaleString('vi-VN')}</span>
                  </div>
                  <p className="mt-2 text-sm text-[#4A5565] line-clamp-1">{post.content}</p>
                  {post.rejectionReason && (
                    <p className="mt-1 text-xs text-[#991B1B] italic">
                      Lý do: {post.rejectionReason}
                    </p>
                  )}
                  {renderAIAnalysis(post, true)}
                </div>
              </div>

              {/* Cac nut thao tac kiem duyet tren tung bai */}
              <div className="flex items-center gap-2 pt-4 border-t border-[#D1D5DC] flex-wrap">
                <Button
                  onClick={() => { setSelectedPost(post); setShowDetailDialog(true); }}
                  className="flex items-center gap-1.5 h-9 px-4 bg-[#3B82F6] hover:bg-[#2563EB] text-white rounded-[8px]"
                >
                  <Eye className="h-4 w-4" />
                  Xem chi tiết
                </Button>

                {post.status === 'PENDING' && (
                  <>
                    <Button
                      onClick={() => handleAction(post, 'approve')}
                      className="flex items-center gap-1.5 h-9 px-4 bg-green-600 hover:bg-green-700 text-white rounded-[8px]"
                    >
                      <Check className="h-4 w-4" />
                      Duyệt bài
                    </Button>
                    <Button
                      onClick={() => handleAction(post, 'reject')}
                      variant="outline"
                      className="flex items-center gap-1.5 h-9 px-4 border-[#E01515] text-[#E01515] hover:bg-[#FFF5F5] rounded-[8px]"
                    >
                      <X className="h-4 w-4" />
                      Từ chối
                    </Button>
                  </>
                )}

                {post.status !== 'HIDDEN' && post.status !== 'REJECTED' && (
                  <Button
                    onClick={() => handleAction(post, 'hide')}
                    variant="outline"
                    className="flex items-center gap-1.5 h-9 px-4 border-gray-300 text-gray-700 hover:bg-gray-50 rounded-[8px]"
                  >
                    <EyeOff className="h-4 w-4" />
                    Ẩn
                  </Button>
                )}

                {post.status !== 'LOCKED' && post.status !== 'REJECTED' && post.status !== 'HIDDEN' && (
                  <Button
                    onClick={() => handleAction(post, 'lock')}
                    variant="outline"
                    className="flex items-center gap-1.5 h-9 px-4 border-gray-300 text-gray-700 hover:bg-gray-50 rounded-[8px]"
                  >
                    <Lock className="h-4 w-4" />
                    Khóa
                  </Button>
                )}

                <Button
                  onClick={() => handleAction(post, 'delete')}
                  variant="outline"
                  className="flex items-center gap-1.5 h-9 px-4 border-[#E01515] text-[#E01515] hover:bg-[#FFF5F5] rounded-[8px] ml-auto"
                >
                  <Trash2 className="h-4 w-4" />
                  Xóa
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Popup xac nhan hanh dong approve/reject/hide/lock/delete */}
      {actionType && dialogConfig && (
        <Dialog open={!!actionType} onOpenChange={cancelAction}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{dialogConfig.title}</DialogTitle>
            </DialogHeader>

            {actionType !== 'approve' && (
              <div className="bg-[#FFF5F5] border border-[#FEE2E2] rounded-lg p-4 flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-[#E01515] shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-sm text-[#1E293B]">Hành động không thể hoàn tác!</p>
                  <p className="text-sm text-[#4A5565] mt-1">
                    Bạn đang thực hiện <strong>{dialogConfig.title.toLowerCase()}</strong> đối với bài viết của{' '}
                    <strong>{selectedPost?.author.name}</strong>.
                  </p>
                </div>
              </div>
            )}

            {actionType === 'approve' && (
              <p className="text-sm text-[#4A5565]">
                Bạn đang duyệt bài viết của <strong>{selectedPost?.author.name}</strong>. Bài sẽ xuất bản ngay lập tức.
              </p>
            )}

            {dialogConfig.needsReason && (
              <div className="mt-2">
                <label className="block text-sm font-medium text-[#1E293B] mb-2">
                  {dialogConfig.reasonLabel} <span className="text-[#E01515]">*</span>
                  <span className="font-normal text-[#99A1AF] ml-1">(tối thiểu 10 ký tự)</span>
                </label>
                <Textarea
                  placeholder="Nhập lý do chi tiết..."
                  value={actionReason}
                  onChange={(e) => setActionReason(e.target.value)}
                  className="min-h-[100px] resize-none"
                />
                <p className="text-xs text-[#99A1AF] mt-1">{actionReason.length} ký tự</p>
              </div>
            )}

            <DialogFooter className="mt-4">
              <Button variant="outline" onClick={cancelAction} disabled={submitting}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 border-0"
              >
                Hủy
              </Button>
              <Button onClick={confirmAction} disabled={submitting} className={dialogConfig.confirmClass}>
                {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                {dialogConfig.confirmText}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Popup xem chi tiet bai viet cho admin */}
      {showDetailDialog && selectedPost && (
        <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
          <DialogContent className="sm:max-w-[950px] w-[95vw] p-8 gap-6">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold">{selectedPost.title}</DialogTitle>
            </DialogHeader>

            <ScrollArea className="max-h-[min(600px,calc(90vh-250px))] pr-4">
              <div className="flex items-center gap-4 text-sm text-[#4A5565] mb-4">
                <span>Tác giả: {selectedPost.author.name}</span>
                <span>•</span>
                <span>{selectedPost.category?.name ?? '(chưa phân loại)'}</span>
                <span>•</span>
                <span>{new Date(selectedPost.createdAt).toLocaleString('vi-VN')}</span>
                <span>•</span>
                {getStatusBadge(selectedPost)}
              </div>

              <div className="border-t border-[#E2E8F0] mb-6" />

              <div className="text-[15px] text-[#1E293B] leading-relaxed whitespace-pre-wrap">
                {selectedPost.content}
              </div>

              {renderAIAnalysis(selectedPost)}

              {/* Post Images */}
              {selectedPost.images && selectedPost.images.length > 0 && (
                <div className="mt-6 max-w-3xl mx-auto">
                  <div className={`grid gap-3 ${
                    selectedPost.images.length === 1 ? 'grid-cols-1 max-w-md mx-auto' :
                    selectedPost.images.length === 2 ? 'grid-cols-2' :
                    'grid-cols-2 md:grid-cols-3'
                  }`}>
                    {selectedPost.images.map((img, idx) => {
                      const src = img.startsWith('http') ? img : `http://127.0.0.1:8000${img}`;
                      return (
                        <div key={idx} className="relative aspect-video rounded-xl overflow-hidden border border-[#E2E8F0] bg-gray-50 shadow-sm group">
                          <img 
                            src={src} 
                            alt={`Hình ${idx + 1}`} 
                            className="w-full h-full object-contain bg-white transition-all duration-300 group-hover:scale-105" 
                            style={{ maxHeight: '300px' }}
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {selectedPost.rejectionReason && (
                <div className="mt-4 p-3 bg-[#FFF5F5] border border-[#FEE2E2] rounded-lg text-sm text-[#991B1B]">
                  <strong>Lý do xử lý:</strong> {selectedPost.rejectionReason}
                </div>
              )}
            </ScrollArea>

            <div className="flex items-center justify-between mt-2 pt-6 border-t border-[#E2E8F0] flex-wrap gap-2">
              <div className="flex items-center gap-3 flex-wrap">
                {selectedPost.status === 'PENDING' && (
                  <>
                    <Button onClick={() => { setShowDetailDialog(false); handleAction(selectedPost, 'approve'); }}
                      className="bg-[#00B14F] hover:bg-[#009241] h-10 text-white px-5 rounded-[8px]">
                      <Check className="h-4 w-4 mr-2" />Duyệt bài
                    </Button>
                    <Button onClick={() => { setShowDetailDialog(false); handleAction(selectedPost, 'reject'); }}
                      className="bg-[#E01515] hover:bg-[#C10007] h-10 text-white px-5 rounded-[8px]">
                      <X className="h-4 w-4 mr-2" />Từ chối
                    </Button>
                  </>
                )}
                {selectedPost.status !== 'HIDDEN' && selectedPost.status !== 'REJECTED' && (
                  <Button onClick={() => { setShowDetailDialog(false); handleAction(selectedPost, 'hide'); }}
                    variant="outline" className="px-5 h-10 bg-white border-[#D1D5DC] text-[#475569] hover:bg-gray-50 rounded-[8px]">
                    <EyeOff className="h-4 w-4 mr-2" />Ẩn
                  </Button>
                )}
                {selectedPost.status !== 'LOCKED' && selectedPost.status !== 'REJECTED' && selectedPost.status !== 'HIDDEN' && (
                  <Button onClick={() => { setShowDetailDialog(false); handleAction(selectedPost, 'lock'); }}
                    variant="outline" className="px-5 h-10 bg-white border-[#D1D5DC] text-[#475569] hover:bg-gray-50 rounded-[8px]">
                    <Lock className="h-4 w-4 mr-2" />Khóa
                  </Button>
                )}
              </div>

              <div className="flex items-center gap-3">
                <Button onClick={() => { setShowDetailDialog(false); handleAction(selectedPost, 'delete'); }}
                  variant="outline" className="border-[#E01515] text-[#E01515] hover:bg-[#FFF5F5] h-10 px-5 rounded-[8px]">
                  <Trash2 className="h-4 w-4 mr-2" />Xóa bài viết
                </Button>
                <Button onClick={() => setShowDetailDialog(false)}
                  variant="outline" className="px-6 h-10 bg-white border-[#D1D5DC] text-[#475569] hover:bg-gray-50 rounded-[8px]">
                  Đóng
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
