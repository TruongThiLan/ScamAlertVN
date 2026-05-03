import { useEffect, useState } from 'react';
import { Search, Lock, AlertTriangle, Trash2, LockOpen } from 'lucide-react';
import { toast } from 'sonner';
import api from '../../../api/axiosInstance';
import { useAuth } from '../../contexts/AuthContext';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import { Button } from '../../components/ui/button';

// NOTE VAN DAP:
// AdminUsers la man hinh quan ly tai khoan.
// Flow:
// 1. FE gui search/status/role/page len /api/users/.
// 2. Backend tra results + count + status_summary.
// 3. Admin bam lock/unlock/warn/delete thi FE goi custom action cua UserViewSet.

interface User {
  id: string;
  username: string;
  email: string;
  created_date: string;
  reputation_score: number;
  report_count: number;
  status: 'active' | 'banned' | 'warning' | 'inactive';
  remaining_lock_time?: string;
  avatar?: string;
  role_name?: string;
}


type DialogType = 'lock' | 'unlock' | 'warning' | 'delete' | null;

export function AdminUsers() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]); // danh sach user dang hien trong bang/list.
  const [searchQuery, setSearchQuery] = useState(''); // tu khoa tim username/email.
  const [filterStatus, setFilterStatus] = useState('all'); // loc theo trang thai user.
  const [selectedUser, setSelectedUser] = useState<User | null>(null); // user dang duoc admin thao tac.
  const [dialogType, setDialogType] = useState<DialogType>(null); // popup dang mo: lock/unlock/warning/delete.
  
  // Dialog states
  const [lockAction, setLockAction] = useState('');
  const [lockReason, setLockReason] = useState('');
  const [lockDetails, setLockDetails] = useState('');
  const [lockDuration, setLockDuration] = useState('3');
  
  const [unlockAction, setUnlockAction] = useState('');
  const [unlockReason, setUnlockReason] = useState('');
  const [unlockDetails, setUnlockDetails] = useState('');
  
  const [warningType, setWarningType] = useState('');
  const [warningDetails, setWarningDetails] = useState('');
  
  const [deleteReason, setDeleteReason] = useState('');
  const [deleteDetails, setDeleteDetails] = useState('');
  const [isFormSubmitted, setIsFormSubmitted] = useState(false);

  // Các state mới cho phân trang và lọc server-side
  const [currentPage, setCurrentPage] = useState(1); // trang hien tai cua phan trang.
  const [filterRole, setFilterRole] = useState('all'); // loc Admin/User.
  const [totalCount, setTotalCount] = useState(0); // tong user backend tra ve.
  const [globalStats, setGlobalStats] = useState({
    active: 0,
    banned: 0,
    inactive: 0
  });

  // Reset về trang 1 khi thay đổi bộ lọc hoặc tìm kiếm
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterStatus, filterRole]);

  const fetchUsers = async () => {
    try {
      // Gửi các tham số lọc lên server
      // Loc/phan trang lam o backend de danh sach user lon van chay on.
      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);
      if (filterStatus !== 'all') {
        const backendStatus = filterStatus === 'locked' ? 'banned' : filterStatus;
        params.append('status', backendStatus);
      }
      if (filterRole !== 'all') params.append('role', filterRole);
      params.append('page', currentPage.toString());

      const response = await api.get(`users/?${params.toString()}`);
      
      // Cập nhật dữ liệu từ kết quả phân trang
      setUsers(response.data.results || []);
      setTotalCount(response.data.count || 0);
      
      // Cập nhật thống kê tổng quát từ metadata
      if (response.data.status_summary) {
        setGlobalStats(response.data.status_summary);
      }
    } catch (error) {
      toast.error('Không thể tải danh sách người dùng');
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [currentPage, searchQuery, filterStatus, filterRole]);

  // Vì đã lọc từ Server, filteredUsers chỉ đơn giản là danh sách users hiện tại
  const filteredUsers = users;

  const openDialog = (type: DialogType, user: User) => {
    setSelectedUser(user);
    setDialogType(type);
  };

  const closeDialog = () => {
    setDialogType(null);
    setSelectedUser(null);
    // Reset form states
    setLockAction('');
    setLockReason('');
    setLockDetails('');
    setLockDuration('3');
    setUnlockAction('');
    setUnlockReason('');
    setUnlockDetails('');
    setWarningType('');
    setWarningDetails('');
    setDeleteReason('');
    setDeleteDetails('');
    setIsFormSubmitted(false);
  };

  const handleAction = async () => {
    if (!selectedUser) return;
    setIsFormSubmitted(true);

    try {
      // Moi dialogType map voi mot endpoint admin rieng trong user_views.py.
      if (dialogType === 'lock') {
        if (!lockReason) {
          toast.error('Vui lòng điền đầy đủ các thông tin bắt buộc');
          return;
        }
        await api.post(`users/${selectedUser.id}/lock/`, {
          action: lockAction,
          reason: lockReason,
          details: lockDetails,
          duration: lockDuration
        });
        toast.success('Đã khóa tài khoản thành công');
      } else if (dialogType === 'unlock') {
        if (!unlockReason) {
          toast.error('Vui lòng điền đầy đủ các thông tin bắt buộc');
          return;
        }
        await api.post(`users/${selectedUser.id}/unlock/`, {
          action: unlockAction,
          reason: unlockReason,
          details: unlockDetails
        });
        toast.success('Đã mở khóa tài khoản thành công');
      } else if (dialogType === 'warning') {
        if (!warningType) {
          toast.error('Vui lòng chọn loại hình cảnh báo');
          return;
        }
        await api.post(`users/${selectedUser.id}/warn/`, {
          warning_type: warningType,
          details: warningDetails
        });
        toast.success('Đã gửi nhắc nhở tới người dùng');
      } else if (dialogType === 'delete') {
        if (!deleteReason) {
          toast.error('Vui lòng chọn lý do xóa');
          return;
        }
        await api.delete(`users/${selectedUser.id}/`, {
          data: {
            reason: deleteReason,
            details: deleteDetails
          }
        });
        toast.success('Đã xóa người dùng khỏi hệ thống');
      }
      
      // Refresh list
      fetchUsers();
    } catch (error) {
      toast.error('Thực hiện thao tác thất bại');
    }
    
    closeDialog();
  };

  const getStatusBadge = (statusParam: string) => {
    const status = (statusParam || '').toLowerCase();
    switch (status) {
      case 'active':
        return <span className="text-xs font-medium text-[#22C55E]">ĐANG HOẠT ĐỘNG</span>;
      case 'banned':
        return <span className="text-xs font-medium text-[#4A5565]">BỊ KHÓA</span>;
      case 'warning':
        return <span className="text-xs font-medium text-[#F59E0B]">CẢNH BÁO</span>;
      case 'inactive':
        return <span className="text-xs font-medium text-[#99A1AF]">ĐÃ XÓA</span>;
      default:
        return <span className="text-xs font-medium text-[#99A1AF] italic uppercase">{status}</span>;
    }
  };

  const getReputationColor = (score: number) => {
    if (score >= 100) return '#22C55E';
    if (score >= 50) return '#F59E0B';
    return '#E01515';
  };

  const getReportColor = (count: number) => {
    if (count >= 20) return '#E01515';
    if (count >= 10) return '#F9B939';
    return '#12B76A';
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-[#1E293B] mb-6">Quản lý người dùng</h1>

      {/* Thanh tim kiem va bo loc user */}
      <div className="flex items-center gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[#99A1AF]" />
          <input
            type="text"
            placeholder="Tìm kiếm người dùng..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 rounded-[10px] border border-[#D1D5DC] focus:outline-none focus:border-[#E01515] transition-colors"
          />
        </div>
        <div className="w-[180px]">
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="px-5 py-3 h-[50px] rounded-[10px] border border-[#D1D5DC] focus:border-[#E01515] bg-white text-[#1E293B]">
              <SelectValue placeholder="Trạng thái" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả trạng thái</SelectItem>
              <SelectItem value="active">Đang hoạt động</SelectItem>
              <SelectItem value="locked">Bị khóa</SelectItem>
              <SelectItem value="warning">Cảnh báo</SelectItem>
              <SelectItem value="inactive">Đã xóa</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="w-[180px]">
          <Select value={filterRole} onValueChange={setFilterRole}>
            <SelectTrigger className="px-5 py-3 h-[50px] rounded-[10px] border border-[#D1D5DC] focus:border-[#E01515] bg-white text-[#1E293B]">
              <SelectValue placeholder="Vai trò" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả vai trò</SelectItem>
              <SelectItem value="User">User</SelectItem>
              <SelectItem value="Admin">Admin</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Thanh thong ke nhanh: tong user, active, bi khoa, da xoa */}
      <div className="bg-[#F8FAFC] border border-[#D1D5DC] rounded-[10px] p-4 mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <span className="font-medium text-[#1E293B]">
            Tổng: <span className="text-[#E01515] font-bold">{totalCount}</span> người dùng
          </span>
          <span className="text-[#D1D5DC]">|</span>
          <span className="text-[#22C55E] font-medium">Hoạt động: {globalStats.active}</span>
          <span className="text-[#4A5565] font-medium">Bị khóa: {globalStats.banned}</span>
          <span className="text-[#94A3B8] font-medium">Đã xóa: {globalStats.inactive}</span>
        </div>
        <div className="text-sm text-[#99A1AF]">
          Trang hiện tại: {users.length} người dùng
        </div>
      </div>

      {/* Danh sach user: moi card la mot tai khoan */}
      <div className="space-y-4">
        {filteredUsers.map((user) => (
          <div
            key={user.id}
            className="bg-white rounded-[10px] border border-[#D1D5DC] p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 flex-1">
                {/* Avatar chu cai dau cua username */}
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#E01515] to-[#F59E0B] flex items-center justify-center text-white font-semibold text-lg">
                  {user.username.charAt(0)}
                </div>

                {/* Thong tin user: ten, email, ngay tham gia, diem uy tin, so bao cao */}
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="font-semibold text-[#1E293B] flex items-center gap-2">
                      {user.username}
                      {user.role_name === 'Admin' && (
                        <span className="px-2 py-0.5 rounded bg-[#E01515]/10 text-[#E01515] text-[10px] font-bold uppercase tracking-wider">
                          Admin
                        </span>
                      )}
                    </h3>
                    {getStatusBadge(user.status)}
                  </div>
                  <div className="flex items-center gap-4 text-sm text-[#99A1AF]">
                    <span>📧 {user.email}</span>
                    <span>Ngày tham gia: {user.created_date ? new Date(user.created_date).toLocaleDateString('vi-VN') : 'N/A'}</span>
                    <div
                      className="px-1.5 py-0.5 rounded flex items-center gap-1"
                      style={{ backgroundColor: `${getReputationColor(user.reputation_score)}15` }}
                    >
                      <span
                        className="text-xs font-semibold"
                        style={{ color: getReputationColor(user.reputation_score) }}
                      >
                        ⭐ {user.reputation_score}
                      </span>
                    </div>

                    <span className="text-sm" style={{ color: getReportColor(user.report_count) }}>
                      Báo cáo: {user.report_count}
                    </span>
                  </div>
                </div>
              </div>

              {/* Cac nut admin thao tac voi user */}
              <div className="flex items-center gap-2">
                {String(user.id) === String(currentUser?.id) ? (
                  <span className="text-sm text-[#94A3B8] italic font-medium">Tài khoản của bạn</span>
                ) : user.status === 'inactive' ? (
                  <span className="text-sm text-[#94A3B8] italic">Tài khoản đã bị xóa</span>
                ) : (
                  <>
                    {user.status === 'banned' || user.status === 'warning' ? (
                      <button
                        onClick={() => openDialog('unlock', user)}
                        className="flex items-center gap-2 px-4 py-2 rounded-[8px] border border-[#22C55E] text-[#22C55E] hover:bg-[#F0FDF4] transition-colors"
                      >
                        <LockOpen className="h-4 w-4" />
                        Mở khóa
                      </button>
                    ) : (
                      <button
                        onClick={() => openDialog('lock', user)}
                        className="flex items-center gap-2 px-4 py-2 rounded-[8px] border border-[#4A5565] text-[#4A5565] hover:bg-[#F9FAFB] transition-colors"
                      >
                        <Lock className="h-4 w-4" />
                        Khóa
                      </button>
                    )}
                    <button
                      onClick={() => openDialog('warning', user)}
                      className="flex items-center gap-2 px-4 py-2 rounded-[8px] border border-[#F59E0B] text-[#F59E0B] hover:bg-[#FFFBEB] transition-colors"
                    >
                      <AlertTriangle className="h-4 w-4" />
                      Cảnh báo
                    </button>
                    <button
                      onClick={() => openDialog('delete', user)}
                      className="flex items-center gap-2 px-4 py-2 rounded-[8px] border border-[#E01515] text-[#E01515] hover:bg-[#FFF5F5] transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                      Xóa
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        ))}

        {filteredUsers.length === 0 && (
          <div className="text-center py-12 bg-white rounded-[10px] border border-[#D1D5DC] text-[#99A1AF]">
            Không tìm thấy người dùng nào phù hợp.
          </div>
        )}

        {/* Nut phan trang danh sach user */}
        {totalCount > 10 && (
          <div className="flex items-center justify-center gap-2 mt-8">
            <Button
              variant="outline"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              className="border-[#D1D5DC] text-[#1E293B]"
            >
              Trước
            </Button>
            <div className="flex items-center gap-1 mx-2">
              <span className="text-sm font-medium text-[#1E293B]">Trang {currentPage}</span>
              <span className="text-sm text-[#99A1AF]">/ {Math.ceil(totalCount / 10)}</span>
            </div>
            <Button
              variant="outline"
              disabled={currentPage >= Math.ceil(totalCount / 10)}
              onClick={() => setCurrentPage(prev => prev + 1)}
              className="border-[#D1D5DC] text-[#1E293B]"
            >
              Sau
            </Button>
          </div>
        )}
      </div>

      {/* Popup khoa tai khoan */}
      <Dialog open={dialogType === 'lock'} onOpenChange={closeDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Khóa tài khoản</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Loại hình <span className="text-[#E01515]">*</span>
              </label>
              <Select value={lockAction} onValueChange={setLockAction}>
                <SelectTrigger>
                  <SelectValue placeholder="Khóa tài khoản" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="lock">Khóa tài khoản</SelectItem>
                  <SelectItem value="temp-lock">Khóa tạm thời</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">
                Lý do <span className="text-[#E01515]">*</span>
              </label>
              <Select value={lockReason} onValueChange={setLockReason}>
                <SelectTrigger className={isFormSubmitted && !lockReason ? 'border-[#E01515]' : ''}>
                  <SelectValue placeholder="Chọn lý do" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="spam-content">Spam nội dung</SelectItem>
                  <SelectItem value="fake-info">Thông tin giả mạo</SelectItem>
                  <SelectItem value="scam">Lừa đảo</SelectItem>
                  <SelectItem value="system-abuse">Lạm dụng hệ thống</SelectItem>
                  <SelectItem value="rule-violation">Vi phạm quy định</SelectItem>
                  <SelectItem value="malicious-links">Chia sẻ liên kết độc hại</SelectItem>
                  <SelectItem value="unusual-behavior">Hành vi bất thường</SelectItem>
                  <SelectItem value="other">Khác</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Chi tiết lý do</label>
              <textarea
                value={lockDetails}
                onChange={(e) => setLockDetails(e.target.value)}
                placeholder="Nhập lý do chi tiết..."
                className="w-full min-h-[100px] px-4 py-3 rounded-[8px] border border-[#D1D5DC] focus:outline-none focus:border-[#E01515] resize-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Thời hạn</label>
              <Select value={lockDuration} onValueChange={setLockDuration}>
                <SelectTrigger>
                  <SelectValue placeholder="3 ngày" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="3">3 ngày</SelectItem>
                  <SelectItem value="7">7 ngày</SelectItem>
                  <SelectItem value="30">30 ngày</SelectItem>
                  <SelectItem value="forever">Vĩnh viễn</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog} className="bg-[#99A1AF] text-white hover:bg-[#4A5565]">
              Hủy
            </Button>
            <Button onClick={handleAction} className="bg-[#E01515] text-white hover:bg-[#C10007]">
              Xác nhận
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Popup mo khoa tai khoan */}
      <Dialog open={dialogType === 'unlock'} onOpenChange={closeDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Mở khóa tài khoản</DialogTitle>
            <DialogDescription className="text-sm text-[#99A1AF]">
              Thời hạn bị khóa còn lại: {selectedUser?.remaining_lock_time || 'N/A'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Loại hình</label>
              <Select value={unlockAction} onValueChange={setUnlockAction}>
                <SelectTrigger>
                  <SelectValue placeholder="Mở khóa tài khoản" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unlock">Mở khóa tài khoản</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">
                Lý do <span className="text-[#E01515]">*</span>
              </label>
              <Select value={unlockReason} onValueChange={setUnlockReason}>
                <SelectTrigger className={isFormSubmitted && !unlockReason ? 'border-[#E01515]' : ''}>
                  <SelectValue placeholder="Chọn lý do" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mistake">Khóa nhầm tài khoản</SelectItem>
                  <SelectItem value="valid-appeal">Khiếu nại và cung cấp bằng chứng hợp lệ</SelectItem>
                  <SelectItem value="expired">Đã hết thời hạn khóa</SelectItem>
                  <SelectItem value="secured">Tài khoản đã bảo mật lại</SelectItem>
                  <SelectItem value="committed">Cam kết tuân thủ quy định</SelectItem>
                  <SelectItem value="other">Khác</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Chi tiết lý do</label>
              <textarea
                value={unlockDetails}
                onChange={(e) => setUnlockDetails(e.target.value)}
                placeholder="Nhập lý do chi tiết..."
                className="w-full min-h-[100px] px-4 py-3 rounded-[8px] border border-[#D1D5DC] focus:outline-none focus:border-[#E01515] resize-none"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog} className="bg-[#99A1AF] text-white hover:bg-[#4A5565]">
              Hủy
            </Button>
            <Button onClick={handleAction} className="bg-[#E01515] text-white hover:bg-[#C10007]">
              Xác nhận
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Popup gui canh bao user */}
      <Dialog open={dialogType === 'warning'} onOpenChange={closeDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Gửi thông báo vi phạm</DialogTitle>
          </DialogHeader>
          <div className="bg-[#FFF5F5] border border-[#E01515] rounded-[8px] p-4 mb-4">
            <p className="text-sm text-[#E01515]">
              Thông báo sẽ được gửi trực tiếp đến hộp thư của người dùng{' '}
              <span className="font-semibold">{selectedUser?.username}</span>.
            </p>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Loại vi phạm <span className="text-[#E01515]">*</span>
              </label>
              <Select value={warningType} onValueChange={setWarningType}>
                <SelectTrigger className={isFormSubmitted && !warningType ? 'border-[#E01515]' : ''}>
                  <SelectValue placeholder="Chọn loại vi phạm" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="spam">Spam</SelectItem>
                  <SelectItem value="misinformation">Thông tin sai lệch</SelectItem>
                  <SelectItem value="inappropriate-content">Nội dung không phù hợp</SelectItem>
                  <SelectItem value="harassment">Quấy rối người dùng</SelectItem>
                  <SelectItem value="suspected-scam">Nghi ngờ lừa đảo</SelectItem>
                  <SelectItem value="wrong-category">Sai danh mục / nội dung</SelectItem>
                  <SelectItem value="inappropriate-language">Ngôn từ không phù hợp</SelectItem>
                  <SelectItem value="other">Khác</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Nội dung chi tiết</label>
              <textarea
                value={warningDetails}
                onChange={(e) => setWarningDetails(e.target.value)}
                placeholder="Nhập nội dung cảnh báo chi tiết cho người dùng..."
                className="w-full min-h-[120px] px-4 py-3 rounded-[8px] border border-[#D1D5DC] focus:outline-none focus:border-[#E01515] resize-none"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog} className="bg-[#99A1AF] text-white hover:bg-[#4A5565]">
              Hủy
            </Button>
            <Button onClick={handleAction} className="bg-[#E01515] text-white hover:bg-[#C10007]">
              Gửi
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Popup xoa mem tai khoan user */}
      <Dialog open={dialogType === 'delete'} onOpenChange={closeDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Xóa tài khoản người dùng</DialogTitle>
          </DialogHeader>
          <div className="bg-[#FFF5F5] border border-[#E01515] rounded-[8px] p-4 mb-4 flex items-start gap-3">
            <AlertTriangle className="h-6 w-6 text-[#E01515] flex-shrink-0 mt-1" />
            <div>
              <p className="font-semibold text-[#E01515] mb-1">Hành động không thể hoàn tác!</p>
              <p className="text-sm text-[#E01515]">
                Bạn đang thực hiện xóa tài khoản <span className="font-semibold">{selectedUser?.username}</span>.
              </p>
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Lý do xóa <span className="text-[#E01515]">*</span>
              </label>
              <Select value={deleteReason} onValueChange={setDeleteReason}>
                <SelectTrigger className={isFormSubmitted && !deleteReason ? 'border-[#E01515]' : ''}>
                  <SelectValue placeholder="Chọn lý do" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="serious-violation">Vi phạm nghiêm trọng</SelectItem>
                  <SelectItem value="fake-account">Tài khoản giả mạo</SelectItem>
                  <SelectItem value="repeated-violation">Tái phạm nhiều lần</SelectItem>
                  <SelectItem value="legal-request">Yêu cầu pháp lý</SelectItem>
                  <SelectItem value="user-request">Người dùng yêu cầu</SelectItem>
                  <SelectItem value="inactive-long-time">Không hoạt động lâu ngày</SelectItem>
                  <SelectItem value="other">Khác</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Nội dung chi tiết</label>
              <textarea
                value={deleteDetails}
                onChange={(e) => setDeleteDetails(e.target.value)}
                placeholder="Nhập lý do chi tiết để lưu vào nhật ký hệ thống..."
                className="w-full min-h-[100px] px-4 py-3 rounded-[8px] border border-[#D1D5DC] focus:outline-none focus:border-[#E01515] resize-none"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog} className="bg-[#99A1AF] text-white hover:bg-[#4A5565]">
              Hủy
            </Button>
            <Button onClick={handleAction} className="bg-[#E01515] text-white hover:bg-[#C10007]">
              Xác nhận
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
