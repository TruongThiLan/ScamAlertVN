import { useState } from 'react';
import { Search, Lock, AlertTriangle, Trash2, LockOpen } from 'lucide-react';
import { toast } from 'sonner';
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

interface User {
  id: string;
  name: string;
  email: string;
  joinDate: string;
  reputation: number;
  status: 'active' | 'locked' | 'warning';
  avatar?: string;
}

const mockUsers: User[] = [
  {
    id: '1',
    name: 'Nguyễn Văn A',
    email: 'vana.nguyen@example.com',
    joinDate: '2024-01-15',
    reputation: 2,
    status: 'active',
  },
  {
    id: '2',
    name: 'Trần Thị B',
    email: 'thib.tran@example.com',
    joinDate: '2023-11-20',
    reputation: 15,
    status: 'warning',
  },
  {
    id: '3',
    name: 'Lê Văn C',
    email: 'vanc.le@example.com',
    joinDate: '2024-02-01',
    reputation: 0,
    status: 'active',
  },
  {
    id: '4',
    name: 'Phạm Thị D',
    email: 'thid.pham@example.com',
    joinDate: '2023-05-12',
    reputation: 5,
    status: 'active',
  },
  {
    id: '5',
    name: 'Nguyễn Thị E',
    email: 'thie.nguyen@example.com',
    joinDate: '2023-10-12',
    reputation: 0,
    status: 'active',
  },
];

type DialogType = 'lock' | 'unlock' | 'warning' | 'delete' | null;

export function AdminUsers() {
  const [users, setUsers] = useState<User[]>(mockUsers);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [dialogType, setDialogType] = useState<DialogType>(null);
  
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

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === 'all' || user.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

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
  };

  const handleAction = () => {
    if (selectedUser) {
      setUsers(users.map((u): User => {
        if (u.id === selectedUser.id) {
          if (dialogType === 'lock') return { ...u, status: 'locked' };
          if (dialogType === 'unlock') return { ...u, status: 'active' };
          if (dialogType === 'warning') return { ...u, status: 'warning' };
          return u;
        }
        return u;
      }).filter(u => !(dialogType === 'delete' && u.id === selectedUser.id)));

      // Show toast
      if (dialogType === 'lock') toast.success('Đã khóa tài khoản thành công');
      else if (dialogType === 'unlock') toast.success('Đã mở khóa tài khoản thành công');
      else if (dialogType === 'warning') toast.success('Đã gửi nhắc nhở tới người dùng');
      else if (dialogType === 'delete') toast.success('Đã xóa người dùng khỏi hệ thống');
    }
    
    closeDialog();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <span className="text-xs font-medium text-[#22C55E]">ĐANG HOẠT ĐỘNG</span>;
      case 'locked':
        return <span className="text-xs font-medium text-[#4A5565]">TẠM KHÓA BỊ KHÓA</span>;
      case 'warning':
        return <span className="text-xs font-medium text-[#F59E0B]">TẠM KHÓA BỊ KHÓA</span>;
      default:
        return null;
    }
  };

  const getReputationColor = (score: number) => {
    if (score >= 10) return '#22C55E';
    if (score >= 5) return '#F59E0B';
    return '#E01515';
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-[#1E293B] mb-6">Quản lý người dùng</h1>

      {/* Search and Filter */}
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
              <SelectValue placeholder="Tất cả trạng thái" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả trạng thái</SelectItem>
              <SelectItem value="active">Đang hoạt động</SelectItem>
              <SelectItem value="locked">Tạm khóa bị khóa</SelectItem>
              <SelectItem value="warning">Cảnh báo</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Users List */}
      <div className="space-y-4">
        {filteredUsers.map((user) => (
          <div
            key={user.id}
            className="bg-white rounded-[10px] border border-[#D1D5DC] p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 flex-1">
                {/* Avatar */}
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#E01515] to-[#F59E0B] flex items-center justify-center text-white font-semibold text-lg">
                  {user.name.charAt(0)}
                </div>

                {/* User Info */}
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="font-semibold text-[#1E293B]">{user.name}</h3>
                    {getStatusBadge(user.status)}
                  </div>
                  <div className="flex items-center gap-4 text-sm text-[#99A1AF]">
                    <span>📧 {user.email}</span>
                    <span>Ngày tham gia: {user.joinDate}</span>
                    <span style={{ color: getReputationColor(user.reputation) }}>
                      Báo cáo: {user.reputation}
                    </span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                {user.status === 'locked' || user.status === 'warning' ? (
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
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Lock Account Dialog */}
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
                <SelectTrigger>
                  <SelectValue placeholder="Chọn lý do" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="spam">Spam</SelectItem>
                  <SelectItem value="fake-info">Thông tin giả mạo</SelectItem>
                  <SelectItem value="violation">Vi phạm quy định</SelectItem>
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

      {/* Unlock Account Dialog */}
      <Dialog open={dialogType === 'unlock'} onOpenChange={closeDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Mở khóa tài khoản</DialogTitle>
            <DialogDescription className="text-sm text-[#99A1AF]">
              Thời hạn bị khóa còn lại: 5 ngày 3 giờ
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
                <SelectTrigger>
                  <SelectValue placeholder="Chọn lý do" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="appeal">Khiếu nại thành công</SelectItem>
                  <SelectItem value="mistake">Khóa nhầm</SelectItem>
                  <SelectItem value="improved">Đã cải thiện</SelectItem>
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

      {/* Warning Dialog */}
      <Dialog open={dialogType === 'warning'} onOpenChange={closeDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Gửi thông báo vi phạm</DialogTitle>
          </DialogHeader>
          <div className="bg-[#FFF5F5] border border-[#E01515] rounded-[8px] p-4 mb-4">
            <p className="text-sm text-[#E01515]">
              Thông báo sẽ được gửi trực tiếp đến hộp thư của người dùng{' '}
              <span className="font-semibold">{selectedUser?.name}</span>.
            </p>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Loại vi phạm <span className="text-[#E01515]">*</span>
              </label>
              <Select value={warningType} onValueChange={setWarningType}>
                <SelectTrigger>
                  <SelectValue placeholder="Chọn loại vi phạm" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="spam">Spam</SelectItem>
                  <SelectItem value="fake-info">Thông tin sai lệch</SelectItem>
                  <SelectItem value="inappropriate">Nội dung không phù hợp</SelectItem>
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

      {/* Delete Account Dialog */}
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
                Bạn đang thực hiện xóa tài khoản <span className="font-semibold">{selectedUser?.name}</span>.
              </p>
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Lý do xóa <span className="text-[#E01515]">*</span>
              </label>
              <Select value={deleteReason} onValueChange={setDeleteReason}>
                <SelectTrigger>
                  <SelectValue placeholder="Chọn lý do xóa" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="serious-violation">Vi phạm nghiêm trọng</SelectItem>
                  <SelectItem value="fake-account">Tài khoản giả mạo</SelectItem>
                  <SelectItem value="user-request">Yêu cầu của người dùng</SelectItem>
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
