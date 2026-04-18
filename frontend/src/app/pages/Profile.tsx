import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { Eye, EyeOff, Lock, Mail, User } from 'lucide-react';
import { toast } from 'sonner';
import api from '../../api/axiosInstance';
import { useAuth } from '../contexts/AuthContext';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../components/ui/alert-dialog';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';

const get_api_error_message = (error: any) => {
  const data = error.response?.data;
  if (typeof data === 'string') return data;
  if (data?.detail) return data.detail;
  if (data && typeof data === 'object') {
    const firstValue = Object.values(data)[0];
    if (Array.isArray(firstValue)) return String(firstValue[0]);
    if (firstValue) return String(firstValue);
  }
  return 'Có lỗi xảy ra. Vui lòng thử lại.';
};

export function Profile() {
  const { user, updateUser } = useAuth();
  const [username, setUsername] = useState(user?.username || user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isUpdateProfileAlertOpen, setIsUpdateProfileAlertOpen] = useState(false);
  const [isChangePasswordAlertOpen, setIsChangePasswordAlertOpen] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  useEffect(() => {
    setUsername(user?.username || user?.name || '');
    setEmail(user?.email || '');
  }, [user]);

  if (!user) {
    return (
      <div className="min-h-screen bg-[#F9FAFB] flex items-center justify-center px-4">
        <div className="bg-white rounded-[10px] p-8 text-center max-w-md border border-[#D1D5DC]">
          <p className="text-gray-500 mb-4">Bạn cần đăng nhập để xem trang này</p>
          <Button className="bg-[#E01515] hover:bg-[#C10007]" asChild>
            <Link to="/login">Đăng nhập</Link>
          </Button>
        </div>
      </div>
    );
  }

  const handleUpdateProfileSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setIsUpdateProfileAlertOpen(true);
  };

  const confirmUpdateProfile = async () => {
    setIsSavingProfile(true);
    try {
      // API tra ve user moi nhat; updateUser se set lai AuthContext de Header doi ngay.
      const result = await updateUser({ username, email });
      if (result.success) {
        toast.success('Cập nhật thông tin thành công');
      } else {
        toast.error(result.message || 'Cập nhật thông tin không thành công');
      }
    } finally {
      setIsSavingProfile(false);
      setIsUpdateProfileAlertOpen(false);
    }
  };

  const handleChangePasswordSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setIsChangePasswordAlertOpen(true);
  };

  const confirmChangePassword = async () => {
    setIsChangingPassword(true);
    try {
      // Frontend chi gui du lieu; backend chiu trach nhiem validate va tra text loi.
      await api.put('users/change-password/', {
        old_password: oldPassword,
        new_password: newPassword,
        confirm_password: confirmPassword,
      });

      toast.success('Đổi mật khẩu thành công');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      toast.error(get_api_error_message(error));
    } finally {
      setIsChangingPassword(false);
      setIsChangePasswordAlertOpen(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F9FAFB] py-8">
      <div className="max-w-[896px] mx-auto px-8">
        <div className="mb-8">
          <h1 className="text-[30px] font-bold text-[#101828] mb-2">Quản lý thông tin cá nhân</h1>
          <p className="text-[#4A5565]">Cập nhật thông tin tài khoản và bảo mật của bạn</p>
        </div>

        <div className="bg-white rounded-[10px] border border-[#D1D5DC] overflow-hidden">
          <Tabs defaultValue="profile">
            <TabsList className="w-full justify-start rounded-none border-b border-[#D1D5DC] bg-transparent p-0">
              <TabsTrigger
                value="profile"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#E01515] data-[state=active]:bg-[#E01515] data-[state=active]:text-white px-6 py-4 gap-2"
              >
                <User className="h-5 w-5" />
                Thông tin cá nhân
              </TabsTrigger>
              <TabsTrigger
                value="password"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#E01515] data-[state=active]:bg-[#E01515] data-[state=active]:text-white px-6 py-4 gap-2"
              >
                <Lock className="h-5 w-5" />
                Đổi mật khẩu
              </TabsTrigger>
            </TabsList>

            <TabsContent value="profile" className="p-6">
              <form onSubmit={handleUpdateProfileSubmit} className="space-y-6">
                <div>
                  <label className="block text-[#364153] font-medium mb-2">
                    Tên đăng nhập <span className="text-[#E01515]">*</span>
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-[#99A1AF]" />
                    <Input
                      value={username}
                      onChange={(event) => setUsername(event.target.value)}
                      className="pl-10 bg-white rounded-[10px] h-12 border-[#D1D5DC]"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[#364153] font-medium mb-2">
                    Email <span className="text-[#E01515]">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-[#99A1AF]" />
                    <Input
                      type="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      className="pl-10 bg-white rounded-[10px] h-12 border-[#D1D5DC]"
                      required
                    />
                  </div>
                </div>

                <div className="flex justify-center pt-4">
                  <Button
                    type="submit"
                    className="bg-[#E01515] hover:bg-[#C10007] text-white rounded-[8px] px-8 py-2 h-11 text-base font-medium shadow-sm transition-all"
                    disabled={isSavingProfile}
                  >
                    Lưu thay đổi
                  </Button>
                </div>
              </form>
            </TabsContent>

            <TabsContent value="password" className="p-6">
              <p className="text-[#4A5565] italic mb-6">
                Mật khẩu mới cần tối thiểu 8 ký tự, bao gồm chữ, số và ký tự đặc biệt.
              </p>

              <form onSubmit={handleChangePasswordSubmit} className="space-y-6">
                <PasswordInput
                  label="Mật khẩu cũ"
                  value={oldPassword}
                  visible={showOldPassword}
                  onVisibleChange={() => setShowOldPassword((current) => !current)}
                  onChange={setOldPassword}
                />
                <PasswordInput
                  label="Mật khẩu mới"
                  value={newPassword}
                  visible={showNewPassword}
                  onVisibleChange={() => setShowNewPassword((current) => !current)}
                  onChange={setNewPassword}
                />
                <PasswordInput
                  label="Xác nhận mật khẩu"
                  value={confirmPassword}
                  visible={showConfirmPassword}
                  onVisibleChange={() => setShowConfirmPassword((current) => !current)}
                  onChange={setConfirmPassword}
                />

                <div className="flex justify-center pt-4">
                  <Button
                    type="submit"
                    className="bg-[#E01515] hover:bg-[#C10007] text-white rounded-[8px] px-8 py-2 h-11 text-base font-medium shadow-sm transition-all"
                    disabled={isChangingPassword}
                  >
                    Xác nhận
                  </Button>
                </div>
              </form>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <AlertDialog open={isUpdateProfileAlertOpen} onOpenChange={setIsUpdateProfileAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận cập nhật</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn chắc chắn muốn cập nhật thông tin cá nhân đã chỉnh sửa?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction onClick={confirmUpdateProfile} className="bg-[#E01515] hover:bg-[#C10007] text-white">
              Xác nhận
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={isChangePasswordAlertOpen} onOpenChange={setIsChangePasswordAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận đổi mật khẩu</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn chắc chắn muốn đổi mật khẩu. Sau khi đổi bạn cần sử dụng mật khẩu mới để đăng nhập.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction onClick={confirmChangePassword} className="bg-[#E01515] hover:bg-[#C10007] text-white">
              Xác nhận
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

type PasswordInputProps = {
  label: string;
  value: string;
  visible: boolean;
  onVisibleChange: () => void;
  onChange: (value: string) => void;
};

function PasswordInput({ label, value, visible, onVisibleChange, onChange }: PasswordInputProps) {
  return (
    <div>
      <label className="block text-[#364153] font-medium mb-2">
        {label} <span className="text-[#E01515]">*</span>
      </label>
      <div className="relative">
        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-[#99A1AF]" />
        <Input
          type={visible ? 'text' : 'password'}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="pl-10 pr-10 bg-white border-[#D1D5DC] rounded-[10px] h-12"
          required
        />
        <button
          type="button"
          onClick={onVisibleChange}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-[#99A1AF] hover:text-[#4A5565]"
        >
          {visible ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
        </button>
      </div>
    </div>
  );
}
