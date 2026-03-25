import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { ShieldAlert, Mail, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

export function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    setTimeout(() => {
      toast.success('Đã gửi email khôi phục mật khẩu!');
      setLoading(false);
      navigate('/reset-password');
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

      {/* Forgot Password Card */}
      <div className="w-full max-w-md bg-white rounded-[10px] shadow-sm p-8">
        <Link to="/login" className="flex items-center gap-2 text-[#4A5565] hover:text-[#E01515] mb-6">
          <ArrowLeft className="h-4 w-4" />
          <span className="text-sm">Quay lại</span>
        </Link>

        <div className="mb-6">
          <h2 className="text-[#101828] text-[28px] font-bold mb-2">Quên mật khẩu</h2>
          <p className="text-[#4A5565] text-sm">Nhập email của bạn để nhận liên kết đặt lại mật khẩu</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-[#364153] font-medium mb-2">
              Email đã đăng ký
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-[#99A1AF]" />
              <Input
                id="email"
                type="email"
                placeholder="example@email.com"
                className="pl-10 bg-white border-[#D1D5DC] rounded-[10px] h-12"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <Button
            type="submit"
            className="w-full bg-[#E01515] hover:bg-[#C10007] text-white rounded-[10px] h-12 text-base font-medium"
            disabled={loading}
          >
            {loading ? 'Đang gửi...' : 'Gửi yêu cầu'}
          </Button>
        </form>
      </div>

      {/* Footer */}
      <p className="mt-8 text-[#99A1AF] text-xs">
        © 2026 ScamAlert VN. Diễn đàn chống lừa đảo
      </p>
    </div>
  );
}
