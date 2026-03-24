import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { ShieldAlert, User, Lock, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';

export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const success = await login(email, password);
      if (success) {
        toast.success('Đăng nhập thành công!');
        navigate('/');
      } else {
        toast.error('Email hoặc mật khẩu không đúng');
      }
    } catch (error) {
      toast.error('Đã có lỗi xảy ra');
    } finally {
      setLoading(false);
    }
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

      {/* Login Card */}
      <div className="w-full max-w-md bg-white rounded-[10px] shadow-sm p-8">
        <div className="mb-6">
          <h2 className="text-[#101828] text-[28px] font-bold mb-2">Chào mừng trở lại</h2>
          <p className="text-[#4A5565] text-sm">Đăng nhập để tiếp tục cập nhật các thông tin</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-[#364153] font-medium mb-2">
              Tên đăng nhập / Email
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-[#99A1AF]" />
              <Input
                id="email"
                type="email"
                placeholder="Tên đăng nhập hoặc email của bạn"
                className="pl-10 bg-white border-[#D1D5DC] rounded-[10px] h-12"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label htmlFor="password" className="block text-[#364153] font-medium">
                Mật khẩu
              </label>
              <Link to="/forgot-password" className="text-[#E01515] text-sm hover:underline">
                Quên mật khẩu?
              </Link>
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-[#99A1AF]" />
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                className="pl-10 pr-10 bg-white border-[#D1D5DC] rounded-[10px] h-12"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#99A1AF] hover:text-[#4A5565]"
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>

          <Button 
            type="submit" 
            className="w-full bg-[#E01515] hover:bg-[#C10007] text-white rounded-[10px] h-12 text-base font-medium" 
            disabled={loading}
          >
            {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
          </Button>

          <div className="text-center">
            <Link to="/register" className="text-[#E01515] text-sm hover:underline">
              Đăng ký tài khoản?
            </Link>
          </div>
        </form>
      </div>

      {/* Footer */}
      <p className="mt-8 text-[#99A1AF] text-xs">
        © 2026 ScamAlert VN. Diễn đàn chống lừa đảo.
      </p>
    </div>
  );
}