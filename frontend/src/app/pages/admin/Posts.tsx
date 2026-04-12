import { useState } from 'react';
import { Search, Eye, Trash2, Lock, EyeOff, Check, X, AlertTriangle } from 'lucide-react';
import { Link, useSearchParams } from 'react-router';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/dialog';
import { Button } from '../../components/ui/button';
import { Textarea } from '../../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';

import { useOutletContext } from 'react-router';

export interface Post {
  id: string;
  title: string;
  author: {
    id: string;
    name: string;
  };
  category: {
    id: string;
    name: string;
  };
  content: string;
  createdAt: string;
  status: 'pending' | 'approved' | 'rejected';
  isHidden?: boolean;
  isLocked?: boolean;
}

export const mockPosts: Post[] = [
  {
    id: '1',
    title: 'Cảnh báo: Lừa đảo giả danh ngân hàng Vietcombank',
    author: { id: '1', name: 'Nguyễn Văn A' },
    category: { id: '1', name: 'Lừa đảo qua điện thoại' },
    content: 'Tôi vừa nhận được cuộc gọi từ số 0123456789 tự xưng là nhân viên Vietcombank...',
    createdAt: '2026-01-30 14:30',
    status: 'pending',
  },
  {
    id: '2',
    title: 'Chiêu trò lừa đảo đầu tư tiền ảo mới',
    author: { id: '2', name: 'Trần Thị B' },
    category: { id: '3', name: 'Lừa đảo đầu tư' },
    content: 'Một trang web giả mạo sàn giao dịch tiền ảo đang lừa đảo nhiều người...',
    createdAt: '2026-01-30 13:15',
    status: 'pending',
  },
  {
    id: '3',
    title: 'Lừa đảo việc làm với lương cao bất thường',
    author: { id: '3', name: 'Lê Văn C' },
    category: { id: '5', name: 'Lừa đảo việc làm' },
    content: 'Cảnh báo về tin tuyển dụng lương 20-30 triệu nhưng yêu cầu đặt cọc...',
    createdAt: '2026-01-30 11:45',
    status: 'approved',
  },
  {
    id: '4',
    title: 'Shop online bán hàng nhận tiền không giao hàng',
    author: { id: '4', name: 'Phạm Thị D' },
    category: { id: '6', name: 'Lừa đảo mua sắm' },
    content: 'Tôi đã chuyển khoản 5 triệu cho shop không giao hàng và chặn liên lạc...',
    createdAt: '2026-01-30 10:20',
    status: 'pending',
  },
];

type ActionType = 'approve' | 'reject' | 'hide' | 'unhide' | 'lock' | 'unlock' | 'delete' | null;

export function AdminPosts() {
  const [searchParams] = useSearchParams();
  const categoryFilter = searchParams.get('category');
  
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const { posts, setPosts } = useOutletContext<{ posts: Post[], setPosts: React.Dispatch<React.SetStateAction<Post[]>> }>();
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [actionType, setActionType] = useState<ActionType>(null);
  const [actionReason, setActionReason] = useState('');
  const [selectedReasonType, setSelectedReasonType] = useState('');
  const [showDetailDialog, setShowDetailDialog] = useState(false);

  const filteredPosts = posts.filter((post) => {
    const matchesSearch =
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.author.name.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory = categoryFilter ? post.category.id === categoryFilter : true;
    const matchesStatus = statusFilter === 'all' || post.status === statusFilter;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const handleAction = (post: Post, type: ActionType) => {
    setSelectedPost(post);
    setActionType(type);
    setActionReason('');
    setSelectedReasonType('');
  };

  const handleViewDetail = (post: Post) => {
    setSelectedPost(post);
    setShowDetailDialog(true);
  };

  const confirmAction = () => {
    if (!selectedPost || !actionType) return;
    
    if (actionType === 'delete') {
      setPosts(posts.filter(p => p.id !== selectedPost.id));
      toast.success('Đã xóa bài viết khỏi hệ thống');
    } else {
      setPosts(posts.map(p => {
        if (p.id === selectedPost.id) {
          if (actionType === 'approve') return { ...p, status: 'approved' };
          if (actionType === 'reject') return { ...p, status: 'rejected' };
          if (actionType === 'hide') return { ...p, isHidden: true };
          if (actionType === 'unhide') return { ...p, isHidden: false };
          if (actionType === 'lock') return { ...p, isLocked: true };
          if (actionType === 'unlock') return { ...p, isLocked: false };
        }
        return p;
      }));

      if (actionType === 'approve') toast.success('Đã duyệt bài viết');
      if (actionType === 'reject') toast.success('Đã từ chối bài viết');
      if (actionType === 'hide') toast.success('Đã ẩn bài viết');
      if (actionType === 'unhide') toast.success('Đã hiển thị lại bài viết');
      if (actionType === 'lock') toast.success('Đã khóa bài viết');
      if (actionType === 'unlock') toast.success('Đã mở khóa bài viết');
    }

    setActionType(null);
    setSelectedPost(null);
    setActionReason('');
    setSelectedReasonType('');
  };

  const cancelAction = () => {
    setActionType(null);
    setSelectedPost(null);
    setActionReason('');
    setSelectedReasonType('');
  };

  const getStatusBadge = (post: Post) => {
    if (post.isHidden) {
      return <span className="px-3 py-1 rounded-lg bg-gray-100 text-gray-600 text-xs font-medium border border-gray-200">Đã ẩn</span>;
    }
    if (post.isLocked) {
      return <span className="px-3 py-1 rounded-lg bg-[#FEE2E2] text-[#991B1B] text-xs font-medium">Đã khóa</span>;
    }
    switch (post.status) {
      case 'pending':
        return <span className="px-3 py-1 rounded-lg bg-[#FEF3C7] text-[#92400E] text-xs font-medium">Chờ duyệt</span>;
      case 'approved':
        return <span className="px-3 py-1 rounded-lg bg-[#D1FAE5] text-[#065F46] text-xs font-medium">Đã duyệt</span>;
      case 'rejected':
        return <span className="px-3 py-1 rounded-lg bg-[#FEE2E2] text-[#991B1B] text-xs font-medium">Đã từ chối</span>;
      default:
        return null;
    }
  };

  const getDialogConfig = () => {
    switch (actionType) {
      case 'approve':
        return {
          title: 'Duyệt bài viết',
          description: `Bạn đang thực hiện duyệt bài viết của ${selectedPost?.author.name}.`,
          reasonLabel: null,
          confirmText: 'Duyệt bài',
          confirmClass: 'bg-green-600 hover:bg-green-700',
        };
      case 'reject':
        return {
          title: 'Từ chối bài viết',
          description: `Bạn đang thực hiện từ chối bài viết của ${selectedPost?.author.name}.`,
          reasonLabel: 'Lý do từ chối',
          reasonOptions: ['Chọn lý do từ chối'],
          confirmText: 'Xác nhận',
          confirmClass: 'bg-[#E01515] hover:bg-[#C10007]',
        };
      case 'hide':
        return {
          title: 'Ẩn bài viết',
          description: `Bạn đang thực hiện ẩn bài viết của ${selectedPost?.author.name}.`,
          reasonLabel: 'Lý do ẩn',
          reasonOptions: ['Chọn lý do ẩn'],
          confirmText: 'Xác nhận',
          confirmClass: 'bg-[#E01515] hover:bg-[#C10007]',
        };
      case 'unhide':
        return {
          title: 'Hiển thị lại bài viết',
          description: `Bạn đang thực hiện hiển thị lại bài viết của ${selectedPost?.author.name}.`,
          reasonLabel: null,
          confirmText: 'Xác nhận',
          confirmClass: 'bg-green-600 hover:bg-green-700',
        };
      case 'lock':
        return {
          title: 'Khóa bài viết',
          description: `Bạn đang thực hiện khóa bài viết của ${selectedPost?.author.name}.`,
          reasonLabel: 'Lý do khóa',
          reasonOptions: ['Chọn lý do khóa'],
          confirmText: 'Xác nhận',
          confirmClass: 'bg-[#E01515] hover:bg-[#C10007]',
        };
      case 'unlock':
        return {
          title: 'Mở khóa bài viết',
          description: `Bạn đang thực hiện mở khóa bài viết của ${selectedPost?.author.name}.`,
          reasonLabel: null,
          confirmText: 'Xác nhận',
          confirmClass: 'bg-green-600 hover:bg-green-700',
        };
      case 'delete':
        return {
          title: 'Xóa bài viết',
          description: `Bạn đang thực hiện xóa bài viết của ${selectedPost?.author.name}.`,
          reasonLabel: 'Lý do xóa',
          reasonOptions: ['Chọn lý do xóa'],
          confirmText: 'Xác nhận',
          confirmClass: 'bg-[#E01515] hover:bg-[#C10007]',
        };
      default:
        return null;
    }
  };

  const dialogConfig = getDialogConfig();

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-[#1E293B] mb-6">Kiểm duyệt và quản lý nội dung</h1>

      {/* Search and Filter */}
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
          <option value="approved">Đã duyệt</option>
          <option value="pending">Chờ duyệt</option>
        </select>
      </div>

      {/* Posts List */}
      <div className="space-y-4">
        {filteredPosts.map((post) => (
          <div
            key={post.id}
            className="bg-white rounded-[10px] border border-[#D1D5DC] p-6 hover:shadow-sm transition-shadow"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-start gap-3 mb-2">
                  <h3 className="text-base font-semibold text-[#1E293B] flex-1">
                    {post.title}
                  </h3>
                  {getStatusBadge(post)}
                </div>
                <div className="flex items-center gap-4 text-sm text-[#99A1AF]">
                  <span>Tác giả: {post.author.name}</span>
                  <span>•</span>
                  <span>{post.category.name}</span>
                  <span>•</span>
                  <span>{post.createdAt}</span>
                </div>
                <p className="mt-2 text-sm text-[#4A5565] line-clamp-1">
                  {post.content}
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 pt-4 border-t border-[#D1D5DC]">
              <Button
                onClick={() => handleViewDetail(post)}
                className="flex items-center gap-1.5 h-9 px-4 bg-[#3B82F6] hover:bg-[#2563EB] text-white rounded-[8px]"
              >
                <Eye className="h-4 w-4" />
                Xem chi tiết
              </Button>

              {post.status === 'pending' && (
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

              {post.isHidden ? (
                <Button
                  onClick={() => handleAction(post, 'unhide')}
                  variant="outline"
                  className="flex items-center gap-1.5 h-9 px-4 border-[#3B82F6] text-[#3B82F6] hover:bg-[#EFF6FF] rounded-[8px]"
                >
                  <Eye className="h-4 w-4" />
                  Hiển thị
                </Button>
              ) : (
                <Button
                  onClick={() => handleAction(post, 'hide')}
                  variant="outline"
                  className="flex items-center gap-1.5 h-9 px-4 border-gray-300 text-gray-700 hover:bg-gray-50 rounded-[8px]"
                >
                  <EyeOff className="h-4 w-4" />
                  Ẩn
                </Button>
              )}

              {post.isLocked ? (
                <Button
                  onClick={() => handleAction(post, 'unlock')}
                  variant="outline"
                  className="flex items-center gap-1.5 h-9 px-4 border-[#10B981] text-[#10B981] hover:bg-[#ECFDF5] rounded-[8px]"
                >
                  <Lock className="h-4 w-4" />
                  Mở khóa
                </Button>
              ) : (
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

      {/* Action Dialog */}
      {actionType && dialogConfig && (
        <Dialog open={!!actionType} onOpenChange={cancelAction}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{dialogConfig.title}</DialogTitle>
            </DialogHeader>

            {actionType !== 'approve' && actionType !== 'unhide' && actionType !== 'unlock' && (
              <div className="bg-[#FFF5F5] border border-[#FEE2E2] rounded-lg p-4 flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-[#E01515] shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-sm text-[#1E293B]">Hành động không thể hoàn tác!</p>
                  <p className="text-sm text-[#4A5565] mt-1">{dialogConfig.description}</p>
                </div>
              </div>
            )}

            {(actionType === 'approve' || actionType === 'unhide' || actionType === 'unlock') && (
              <p className="text-sm text-[#4A5565]">{dialogConfig.description}</p>
            )}

            {dialogConfig.reasonLabel && (
              <div className="space-y-3 mt-4">
                <div>
                  <label className="block text-sm font-medium text-[#1E293B] mb-2">
                    {dialogConfig.reasonLabel} <span className="text-[#E01515]">*</span>
                  </label>
                  <Select value={selectedReasonType} onValueChange={setSelectedReasonType}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder={dialogConfig.reasonOptions?.[0]} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="option1">Lý do 1</SelectItem>
                      <SelectItem value="option2">Lý do 2</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#1E293B] mb-2">
                    Nội dung chi tiết
                  </label>
                  <Textarea
                    placeholder="Nhập lý do chi tiết để lưu vào nhật ký hệ thống..."
                    value={actionReason}
                    onChange={(e) => setActionReason(e.target.value)}
                    className="min-h-[100px] resize-none"
                  />
                </div>
              </div>
            )}

            <DialogFooter className="mt-6">
              <Button
                variant="outline"
                onClick={cancelAction}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 border-0"
              >
                Hủy
              </Button>
              <Button
                onClick={confirmAction}
                className={dialogConfig.confirmClass}
              >
                {dialogConfig.confirmText}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Detail Dialog */}
      {showDetailDialog && selectedPost && (
        <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
          <DialogContent className="sm:max-w-[950px] w-[95vw] p-8 gap-6">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold">{selectedPost.title}</DialogTitle>
            </DialogHeader>

            <div>
              <div className="flex items-center gap-4 text-sm text-[#4A5565] mb-4">
                <span>Tác giả: {selectedPost.author.name}</span>
                <span>•</span>
                <span>{selectedPost.category.name}</span>
                <span>•</span>
                <span>{selectedPost.createdAt}</span>
              </div>

              <div className="flex gap-2 mb-6">
                <span className="px-3 py-1 rounded-[16px] bg-[#F1F5F9] text-[#475569] text-xs font-medium">Ngân hàng</span>
                <span className="px-3 py-1 rounded-[16px] bg-[#F1F5F9] text-[#475569] text-xs font-medium">OTP</span>
                <span className="px-3 py-1 rounded-[16px] bg-[#F1F5F9] text-[#475569] text-xs font-medium">Vietcombank</span>
              </div>

              <div className="border-t border-[#E2E8F0] mb-6"></div>

              <div className="text-[15px] text-[#1E293B] leading-relaxed space-y-6">
                <p>
                  Tôi vừa nhận được cuộc gọi từ số 0123456789 tự xưng là nhân viên Vietcombank. Họ nói rằng tài khoản của tôi có giao dịch khả nghi và yêu cầu tôi cung cấp mã OTP để xác minh. May mắn là tôi đã biết về thủ đoạn này nên không cung cấp thông tin.
                </p>

                <div>
                  <p className="font-semibold mb-2">Đây là những dấu hiệu nhận biết:</p>
                  <ul className="space-y-1.5 text-[#475569]">
                    <li>- Gọi từ số điện thoại lạ, không phải hotline chính thức</li>
                    <li>- Yêu cầu cung cấp mã OTP, mật khẩu</li>
                    <li>- Tạo áp lực thời gian, đe dọa khóa tài khoản</li>
                    <li>- Giọng nói có thể là người Việt nhưng có giọng địa phương lạ</li>
                  </ul>
                </div>

                <p>
                  <span className="font-semibold">Lời khuyên:</span> Luôn kiểm tra thông tin qua hotline chính thức của ngân hàng. Không bao giờ cung cấp OTP cho bất kỳ ai.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between mt-2 pt-6 border-t border-[#E2E8F0]">
              <div className="flex items-center gap-3">
                {selectedPost.status === 'pending' && (
                  <>
                    <Button
                      onClick={() => {
                        setShowDetailDialog(false);
                        handleAction(selectedPost, 'approve');
                      }}
                      className="bg-[#00B14F] hover:bg-[#009241] h-10 text-white px-5 rounded-[8px]"
                    >
                      <Check className="h-4 w-4 mr-2" />
                      Duyệt bài
                    </Button>
                    <Button
                      onClick={() => {
                        setShowDetailDialog(false);
                        handleAction(selectedPost, 'reject');
                      }}
                      className="bg-[#E01515] hover:bg-[#C10007] h-10 text-white px-5 rounded-[8px]"
                    >
                      <X className="h-4 w-4 mr-2" />
                      Từ chối
                    </Button>
                  </>
                )}
                {selectedPost.isHidden ? (
                  <Button
                    onClick={() => {
                      setShowDetailDialog(false);
                      handleAction(selectedPost, 'unhide');
                    }}
                    variant="outline"
                    className="px-5 h-10 bg-white border-[#3B82F6] text-[#3B82F6] hover:bg-[#EFF6FF] rounded-[8px]"
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Hiển thị
                  </Button>
                ) : (
                  <Button
                    onClick={() => {
                      setShowDetailDialog(false);
                      handleAction(selectedPost, 'hide');
                    }}
                    variant="outline"
                    className="px-5 h-10 bg-white border-[#D1D5DC] text-[#475569] hover:bg-gray-50 rounded-[8px]"
                  >
                    <EyeOff className="h-4 w-4 mr-2" />
                    Ẩn
                  </Button>
                )}
                {selectedPost.isLocked ? (
                  <Button
                    onClick={() => {
                      setShowDetailDialog(false);
                      handleAction(selectedPost, 'unlock');
                    }}
                    variant="outline"
                    className="px-5 h-10 bg-white border-[#10B981] text-[#10B981] hover:bg-[#ECFDF5] rounded-[8px]"
                  >
                    <Lock className="h-4 w-4 mr-2" />
                    Mở khóa
                  </Button>
                ) : (
                  <Button
                    onClick={() => {
                      setShowDetailDialog(false);
                      handleAction(selectedPost, 'lock');
                    }}
                    variant="outline"
                    className="px-5 h-10 bg-white border-[#D1D5DC] text-[#475569] hover:bg-gray-50 rounded-[8px]"
                  >
                    <Lock className="h-4 w-4 mr-2" />
                    Khóa
                  </Button>
                )}
              </div>

              <div className="flex items-center gap-3">
                <Button
                  onClick={() => {
                    setShowDetailDialog(false);
                    handleAction(selectedPost, 'delete');
                  }}
                  variant="outline"
                  className="border-[#E01515] text-[#E01515] hover:bg-[#FFF5F5] h-10 px-5 rounded-[8px]"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Xóa bài viết
                </Button>
                <Button
                  onClick={() => setShowDetailDialog(false)}
                  variant="outline"
                  className="px-6 h-10 bg-white border-[#D1D5DC] text-[#475569] hover:bg-gray-50 rounded-[8px]"
                >
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
