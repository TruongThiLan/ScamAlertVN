import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { ShieldAlert, User, Mail, Lock, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

export function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast.error('Mật khẩu xác nhận không khớp');
      return;
    }

    if (password.length < 8) {
      toast.error('Mật khẩu phải có ít nhất 8 ký tự');
      return;
    }

    setLoading(true);

    try {
      const success = await register(email, password, name);
      if (success) {
        toast.success('Đăng ký thành công!');
        navigate('/');
      } else {
        toast.error('Email đã được sử dụng');
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

      <div className="w-full max-w-md">
        <Link to="/" className="flex items-center gap-2 text-[#4A5565] hover:text-[#E01515] mb-4 transition-colors">
          <ArrowLeft className="h-5 w-5" />
          <span className="font-medium">Quay lại</span>
        </Link>

        {/* Register Card */}
        <div className="w-full bg-white rounded-[10px] shadow-sm p-8">
          <div className="mb-6">
            <h2 className="text-[#101828] text-[28px] font-bold mb-2">Tạo tài khoản mới</h2>
          <p className="text-[#4A5565] text-sm">Đăng ký để tham gia cộng đồng chống lừa đảo</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="name" className="block text-[#364153] font-medium mb-2">
              Họ và tên
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-[#99A1AF]" />
              <Input
                id="name"
                type="text"
                placeholder="Nguyễn Văn A"
                className="pl-10 bg-white border-[#D1D5DC] rounded-[10px] h-12"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
          </div>

          <div>
            <label htmlFor="email" className="block text-[#364153] font-medium mb-2">
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-[#99A1AF]" />
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                className="pl-10 bg-white border-[#D1D5DC] rounded-[10px] h-12"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div>
            <label htmlFor="password" className="block text-[#364153] font-medium mb-2">
              Mật khẩu
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-[#99A1AF]" />
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Tối thiểu 8 ký tự"
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

          <div>
            <label htmlFor="confirmPassword" className="block text-[#364153] font-medium mb-2">
              Xác nhận mật khẩu
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-[#99A1AF]" />
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="Nhập lại mật khẩu"
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
            {loading ? 'Đang đăng ký...' : 'Đăng ký'}
          </Button>

          <div className="text-center">
            <Link to="/login" className="text-[#E01515] text-sm hover:underline">
              Đã có tài khoản? Đăng nhập
            </Link>
          </div>
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