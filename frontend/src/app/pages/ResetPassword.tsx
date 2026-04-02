import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { ShieldAlert, Lock, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

export function ResetPassword() {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      toast.error('Mật khẩu xác nhận không khớp');
      return;
    }

    if (newPassword.length < 8) {
      toast.error('Mật khẩu phải có ít nhất 8 ký tự');
      return;
    }

    setLoading(true);

    // Simulate password reset
    setTimeout(() => {
      toast.success('Đặt lại mật khẩu thành công!');
      setLoading(false);
      navigate('/login');
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-[#F9FAFB] flex flex-col items-center justify-center px-4">
      {/* Logo */}
      <div className="mb-8 flex flex-col items-center">
        <div className="w-16 h-16 rounded-full bg-[#FFE8E8] flex items-center justify-center mb-4">
          <ShieldAlert className="h-8 w-8 text-[#E01515]" />
        </div>
        <h1 className="text-[#E01515] text-[30px] leading-[45px] mb-2" style={{ fontFamily: "'Krona One', sans-serif" }}>
          ScamAlert VN
        </h1>
        <p className="text-[#4A5565] text-sm">Diễn đàn chống lừa đảo</p>
      </div>

      <div className="w-full max-w-md">
        <Link to="/login" className="flex items-center gap-2 text-[#4A5565] hover:text-[#E01515] mb-4 transition-colors">
          <ArrowLeft className="h-5 w-5" />
          <span className="font-medium">Quay lại</span>
        </Link>

        {/* Reset Password Card */}
        <div className="w-full bg-white rounded-[10px] shadow-sm p-8">
          <div className="mb-6">
            <h2 className="text-[#101828] text-[28px] font-bold mb-2">Đặt lại mật khẩu</h2>
          <p className="text-[#4A5565] text-sm">Vui lòng thiết lập mật khẩu mới cho tài khoản</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="newPassword" className="block text-[#364153] font-medium mb-2">
              Mật khẩu mới
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-[#99A1AF]" />
              <Input
                id="newPassword"
                type={showNewPassword ? 'text' : 'password'}
                placeholder="Tối thiểu 8 ký tự, bao gồm chữ hoa, chữ thường và số"
                className="pl-10 pr-10 bg-white border-[#D1D5DC] rounded-[10px] h-12"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
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
            <label htmlFor="confirmPassword" className="block text-[#364153] font-medium mb-2">
              Xác nhận mật khẩu mới
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-[#99A1AF]" />
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="Nhập lại mật khẩu mới"
                className="pl-10 pr-10 bg-white border-[#D1D5DC] rounded-[10px] h-12"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
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

          <Button 
            type="submit" 
            className="w-full bg-[#E01515] hover:bg-[#C10007] text-white rounded-[10px] h-12 text-base font-medium" 
            disabled={loading}
          >
            {loading ? 'Đang cập nhật...' : 'Cập nhật mật khẩu'}
          </Button>
        </form>
      </div>
    </div>

      {/* Footer */}
      <p className="mt-8 text-[#99A1AF] text-xs">
        © 2028 ScamAlert VN. Diễn đàn chống lừa đảo
      </p>
    </div>
  );
}
