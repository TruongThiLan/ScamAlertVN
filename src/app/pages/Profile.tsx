import { useState } from 'react';
import { Link } from 'react-router';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { User, Mail, Phone, Lock, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import { ReputationBadge } from '../components/ReputationBadge';

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

  const handleUpdateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateUser({ name, email });
    toast.success('Đã cập nhật thông tin cá nhân');
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      toast.error('Mật khẩu mới không khớp');
      return;
    }

    if (newPassword.length < 8) {
      toast.error('Mật khẩu phải có ít nhất 8 ký tự');
      return;
    }

    toast.success('Đã đổi mật khẩu thành công');
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
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
              <form onSubmit={handleUpdateProfile} className="space-y-6">
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
                Mật khẩu của bạn phải có tối thiểu 8 ký tự, đồng thời bao gồm cả chữ số, chữ cái và ký tự đặc biệt (!$@%).
              </p>

              <form onSubmit={handleChangePassword} className="space-y-6">
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
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="pl-10 pr-10 bg-white border-[#D1D5DC] rounded-[10px] h-12"
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
                  >
                    Đổi mật khẩu
                  </Button>
                </div>
              </form>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}