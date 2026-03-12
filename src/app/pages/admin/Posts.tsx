import { useState } from 'react';
import { Search, Eye, Trash2, Lock, EyeOff, Check, X, AlertTriangle } from 'lucide-react';
import { Link } from 'react-router';
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

interface Post {
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

const mockPosts: Post[] = [
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

type ActionType = 'approve' | 'reject' | 'hide' | 'lock' | 'delete' | null;

export function AdminPosts() {
  const [searchQuery, setSearchQuery] = useState('');
  const [posts] = useState<Post[]>(mockPosts);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [actionType, setActionType] = useState<ActionType>(null);
  const [actionReason, setActionReason] = useState('');
  const [selectedReasonType, setSelectedReasonType] = useState('');
  const [showDetailDialog, setShowDetailDialog] = useState(false);

  const filteredPosts = posts.filter((post) =>
    post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    post.author.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
    console.log(`${actionType} post:`, selectedPost.id, 'Reason:', actionReason);
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <span className="px-3 py-1 rounded-lg bg-[#FEF3C7] text-[#92400E] text-xs font-medium">Chờ duyệt</span>;
      case 'approved':
        return <span className="px-3 py-1 rounded-lg bg-[#D1FAE5] text-[#065F46] text-xs font-medium">Đã duyệt</span>;
      case 'rejected':
        return <span className="px-3 py-1 rounded-lg bg-[#FEE2E2] text-[#991B1B] text-xs font-medium">Từ chối</span>;
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
      case 'lock':
        return {
          title: 'Khóa bài viết',
          description: `Bạn đang thực hiện khóa bài viết của ${selectedPost?.author.name}.`,
          reasonLabel: 'Lý do khóa',
          reasonOptions: ['Chọn lý do khóa'],
          confirmText: 'Xác nhận',
          confirmClass: 'bg-[#E01515] hover:bg-[#C10007]',
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

      {/* Search */}
      <div className="mb-6">
        <div className="relative max-w-2xl">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[#99A1AF]" />
          <input
            type="text"
            placeholder="Tìm kiếm bài viết..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-2.5 rounded-[10px] border border-[#D1D5DC] focus:outline-none focus:border-[#E01515] transition-colors"
          />
        </div>
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
                  {getStatusBadge(post.status)}
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

              <Button
                onClick={() => handleAction(post, 'hide')}
                variant="outline"
                className="flex items-center gap-1.5 h-9 px-4 border-gray-300 text-gray-700 hover:bg-gray-50 rounded-[8px]"
              >
                <EyeOff className="h-4 w-4" />
                Ẩn
              </Button>

              <Button
                onClick={() => handleAction(post, 'lock')}
                variant="outline"
                className="flex items-center gap-1.5 h-9 px-4 border-gray-300 text-gray-700 hover:bg-gray-50 rounded-[8px]"
              >
                <Lock className="h-4 w-4" />
                Khóa
              </Button>

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
            
            {actionType !== 'approve' && (
              <div className="bg-[#FFF5F5] border border-[#FEE2E2] rounded-lg p-4 flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-[#E01515] shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-sm text-[#1E293B]">Hành động không thể hoàn tác!</p>
                  <p className="text-sm text-[#4A5565] mt-1">{dialogConfig.description}</p>
                </div>
              </div>
            )}

            {actionType === 'approve' && (
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
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{selectedPost.title}</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="flex items-center gap-4 text-sm text-[#99A1AF]">
                <span>Tác giả: {selectedPost.author.name}</span>
                <span>•</span>
                <span>{selectedPost.category.name}</span>
                <span>•</span>
                <span>{selectedPost.createdAt}</span>
              </div>

              <div className="flex gap-2">
                <span className="px-3 py-1 rounded-lg bg-gray-100 text-gray-700 text-xs">Ngân hàng</span>
                <span className="px-3 py-1 rounded-lg bg-gray-100 text-gray-700 text-xs">OTP</span>
                <span className="px-3 py-1 rounded-lg bg-gray-100 text-gray-700 text-xs">Vietcombank</span>
              </div>

              <div className="bg-[#F9FAFB] rounded-lg p-4">
                <p className="text-sm text-[#1E293B] whitespace-pre-wrap">{selectedPost.content}</p>
              </div>

              <div className="space-y-2 text-sm">
                <p className="font-semibold text-[#1E293B]">Đây là những dấu hiệu nhận biết:</p>
                <ul className="list-disc list-inside space-y-1 text-[#4A5565]">
                  <li>Gọi từ số điện thoại lạ, không phải hotline chính thức</li>
                  <li>Yêu cầu cung cấp mã OTP, mật khẩu</li>
                  <li>Tạo áp lực thời gian, đe dọa khóa tài khoản</li>
                  <li>Giọng nói có thể là người Việt nhưng có giọng địa phương lạ</li>
                </ul>
              </div>

              <div className="bg-[#FFF5F5] border border-[#FEE2E2] rounded-lg p-4">
                <p className="text-sm font-semibold text-[#1E293B]">Lời khuyên:</p>
                <p className="text-sm text-[#4A5565] mt-1">
                  Luôn kiểm tra thông tin qua hotline chính thức của ngân hàng. Không bao giờ cung cấp OTP cho bất kỳ ai.
                </p>
              </div>
            </div>

            <DialogFooter className="flex items-center justify-between mt-6">
              <div className="flex gap-2">
                {selectedPost.status === 'pending' && (
                  <>
                    <Button
                      onClick={() => {
                        setShowDetailDialog(false);
                        handleAction(selectedPost, 'approve');
                      }}
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      <Check className="h-4 w-4 mr-2" />
                      Duyệt bài
                    </Button>
                    <Button
                      onClick={() => {
                        setShowDetailDialog(false);
                        handleAction(selectedPost, 'reject');
                      }}
                      variant="outline"
                      className="border-[#E01515] text-[#E01515] hover:bg-[#FFF5F5]"
                    >
                      <X className="h-4 w-4 mr-2" />
                      Từ chối
                    </Button>
                  </>
                )}
                <Button
                  onClick={() => {
                    setShowDetailDialog(false);
                    handleAction(selectedPost, 'hide');
                  }}
                  variant="outline"
                >
                  <EyeOff className="h-4 w-4 mr-2" />
                  Ẩn
                </Button>
                <Button
                  onClick={() => {
                    setShowDetailDialog(false);
                    handleAction(selectedPost, 'lock');
                  }}
                  variant="outline"
                >
                  <Lock className="h-4 w-4 mr-2" />
                  Khóa
                </Button>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => {
                    setShowDetailDialog(false);
                    handleAction(selectedPost, 'delete');
                  }}
                  variant="outline"
                  className="border-[#E01515] text-[#E01515] hover:bg-[#FFF5F5]"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Xóa bài viết
                </Button>
                <Button
                  onClick={() => setShowDetailDialog(false)}
                  variant="outline"
                >
                  Đóng
                </Button>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
