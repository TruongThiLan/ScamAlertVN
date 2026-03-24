import { useState } from 'react';
import { Link } from 'react-router';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
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
import { User, Mail, Phone, Lock, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';

export function Profile() {
  const { user, updateUser } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState('0123456789');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [passwordError, setPasswordError] = useState('');

  const [isUpdateProfileAlertOpen, setIsUpdateProfileAlertOpen] = useState(false);
  const [isChangePasswordAlertOpen, setIsChangePasswordAlertOpen] = useState(false);

  if (!user) {
    return (
      <div className="min-h-screen bg-[#F9FAFB] flex items-center justify-center px-4">
        <div className="bg-white rounded-[10px] p-8 text-center max-w-md">
          <p className="text-gray-500 mb-4">Bạn cần đăng nhập để xem trang này</p>
          <Button className="bg-[#E01515] hover:bg-[#C10007]" asChild>
            <Link to="/login">Đăng nhập</Link>
          </Button>
        </div>
      </div>
    );
  }

  const handleUpdateProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdateProfileAlertOpen(true);
  };

  const confirmUpdateProfile = async () => {
    try {
      const result = await updateUser({ name, email });
      if (result.success) {
        toast.success('Đã cập nhật thông tin cá nhân');
      } else {
        toast.error(result.message || 'Cập nhật không thành công. Vui lòng thử lại.');
      }
    } catch (error) {
      toast.error('Có lỗi xảy ra khi cập nhật thông tin.');
    } finally {
      setIsUpdateProfileAlertOpen(false);
    }
  };

  const validatePassword = (pass: string) => {
    const minLength = pass.length >= 6;
    const hasLetter = /[a-zA-Z]/.test(pass);
    const hasNumber = /[0-9]/.test(pass);
    const hasSpecialChar = /[!@#$%]/.test(pass);
    
    return minLength && hasLetter && hasNumber && hasSpecialChar;
  };

  const handleNewPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setNewPassword(value);
    
    if (value.length > 0) {
      if (!validatePassword(value)) {
        setPasswordError('Mật khẩu không hợp lệ');
      } else {
        setPasswordError(''); 
      }
    } else {
      setPasswordError('');
    }
  };

  const handleChangePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      toast.error('Mật khẩu mới không khớp');
      return;
    }

    if (!validatePassword(newPassword)) {
      toast.error('Mật khẩu chưa đúng định dạng yêu cầu');
      return;
    }

    setIsChangePasswordAlertOpen(true);
  };

  const confirmChangePassword = async () => {
    try {
      await new Promise((resolve) => setTimeout(resolve, 500));
      
      toast.success('Đã đổi mật khẩu thành công');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setPasswordError('');
    } catch (error) {
      toast.error('Đổi mật khẩu không thành công. Vui lòng thử lại sau.');
    } finally {
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
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="pl-10 bg-white border-[#D1D5DC] rounded-[10px] h-12"
                      required
                    />
                  </div>
                  <p className="text-[#6A7282] text-sm mt-2">
                    Tên đăng nhập phải có độ dài từ 6-20 ký tự và duy nhất trong hệ thống
                  </p>
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
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10 bg-white border-[#D1D5DC] rounded-[10px] h-12"
                      required
                    />
                  </div>
                  <p className="text-[#6A7282] text-sm mt-2">
                    Email phải đúng định dạng và không trùng với email đã tồn tại
                  </p>
                </div>

                <div>
                  <label className="block text-[#364153] font-medium mb-2">
                    Số điện thoại <span className="text-[#E01515]">*</span>
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-[#99A1AF]" />
                    <Input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="pl-10 bg-white border-[#D1D5DC] rounded-[10px] h-12"
                    />
                  </div>
                  <p className="text-[#6A7282] text-sm mt-2">
                    Số điện thoại phải gồm 10 chữ số và bắt đầu từ số 0
                  </p>
                </div>

                <div className="flex justify-center pt-4">
                  <Button 
                    type="submit" 
                    className="bg-[#E01515] hover:bg-[#C10007] text-white rounded-[5px] px-16 py-6 h-auto text-2xl"
                  >
                    Lưu
                  </Button>
                </div>
              </form>
            </TabsContent>

            <TabsContent value="password" className="p-6">
              <p className="text-[#4A5565] italic mb-6">
                Mật khẩu của bạn phải có tối thiểu 6 ký tự, bao gồm chữ cái, số và ký tự đặc biệt (!@#$%).
              </p>

              <form onSubmit={handleChangePasswordSubmit} className="space-y-6">
                <div>
                  <label className="block text-[#364153] font-medium mb-2">
                    Mật khẩu cũ <span className="text-[#E01515]">*</span>
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-[#99A1AF]" />
                    <Input
                      type={showCurrentPassword ? 'text' : 'password'}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="pl-10 pr-10 bg-white border-[#D1D5DC] rounded-[10px] h-12"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#99A1AF] hover:text-[#4A5565]"
                    >
                      {showCurrentPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-[#364153] font-medium mb-2">
                    Mật khẩu mới <span className="text-[#E01515]">*</span>
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-[#99A1AF]" />
                    <Input
                      type={showNewPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={handleNewPasswordChange} // Sử dụng hàm bắt lỗi ở đây
                      className={`pl-10 pr-10 bg-white rounded-[10px] h-12 ${passwordError ? 'border-[#E01515] focus:ring-[#E01515]' : 'border-[#D1D5DC]'}`}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#99A1AF] hover:text-[#4A5565]"
                    >
                      {showNewPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                  {/* Hiển thị lỗi màu đỏ nếu có */}
                  {passwordError && (
                    <p className="text-[#E01515] text-sm mt-2 font-medium">
                      {passwordError}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-[#364153] font-medium mb-2">
                    Xác nhận mật khẩu <span className="text-[#E01515]">*</span>
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-[#99A1AF]" />
                    <Input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="pl-10 pr-10 bg-white border-[#D1D5DC] rounded-[10px] h-12"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#99A1AF] hover:text-[#4A5565]"
                    >
                      {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>

                <div className="flex justify-center pt-4">
                  <Button 
                    type="submit" 
                    className="bg-[#E01515] hover:bg-[#C10007] text-white rounded-[5px] px-12 py-6 h-auto text-2xl"
                    disabled={!!passwordError} 
                  >
                    Đổi mật khẩu
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
              Bạn có chắc chắn muốn cập nhật thông tin cá nhân? Các thay đổi sẽ được lưu vào hệ thống.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction onClick={confirmUpdateProfile} className="bg-[#E01515] hover:bg-[#C10007] text-white">
              Đồng ý
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={isChangePasswordAlertOpen} onOpenChange={setIsChangePasswordAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận đổi mật khẩu</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn đổi mật khẩu? Bạn sẽ cần sử dụng mật khẩu mới cho lần đăng nhập tiếp theo.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction onClick={confirmChangePassword} className="bg-[#E01515] hover:bg-[#C10007] text-white">
              Đồng ý
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}