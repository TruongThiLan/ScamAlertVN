import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { ShieldAlert, User, Lock, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

// NOTE VAN DAP:
// Login goi ham login() tu AuthContext.
// AuthContext se POST /api/login/, luu JWT, goi /api/users/me/,
// roi tra user ve de trang nay dieu huong admin vao dashboard, user ve trang chu.

export function Login() {
  // Nguyệt giữ tên biến là email cũng được, nhưng nó sẽ đại diện cho Username/Email gửi sang Django
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Gửi identifier (username adscamalert) sang hàm login của AuthContext
      const loggedInUser = await login(identifier, password);
      if (loggedInUser) {
        // Thông báo sẽ được hiện bởi toast.success bên trong AuthContext hoặc ở đây
        const canOpenAdmin = loggedInUser.role_name === 'Admin' && loggedInUser.is_staff;
        navigate(canOpenAdmin ? '/admin/dashboard' : '/');
      }
      // Lỗi 401 đã được xử lý bằng toast.error bên trong AuthContext rồi Nguyệt nhé
    } catch (error) {
      toast.error('Máy chủ Backend đang gặp sự cố');
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

      <div className="w-full max-w-md">
        <Link to="/" className="flex items-center gap-2 text-[#4A5565] hover:text-[#E01515] mb-4 transition-colors">
          <ArrowLeft className="h-5 w-5" />
          <span className="font-medium">Quay lại</span>
        </Link>

        {/* Login Card */}
        <div className="w-full bg-white rounded-[10px] shadow-sm p-8">
          <div className="mb-6">
            <h2 className="text-[#101828] text-[28px] font-bold mb-2">Chào mừng trở lại</h2>
            <p className="text-[#4A5565] text-sm">Đăng nhập bằng tài khoản hệ thống của bạn</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="identifier" className="block text-[#364153] font-medium mb-2">
                Tên đăng nhập / Email
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-[#99A1AF]" />
                <Input
                  id="identifier"
                  type="text" // ĐÃ SỬA: Để "text" để Nguyệt nhập được "adscamalert"
                  placeholder="Nhập username hoặc email..."
                  className="pl-10 bg-white border-[#D1D5DC] rounded-[10px] h-12"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
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
              {loading ? 'Đang xác thực...' : 'Đăng nhập'}
            </Button>

            <div className="text-center">
              <Link to="/register" className="text-[#E01515] text-sm hover:underline">
                Chưa có tài khoản? Đăng ký ngay
              </Link>
            </div>
          </form>
        </div>
      </div>

      {/* Footer */}
      <p className="mt-8 text-[#99A1AF] text-xs">
        © 2026 ScamAlert VN
      </p>
    </div>
  );
}
