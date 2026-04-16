import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { ShieldAlert, User, Mail, Lock, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';

export function Register() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [usernameError, setUsernameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');

  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const validatePassword = (pass: string) => {
    const minLength = pass.length >= 6;
    const hasLetter = /[a-zA-Z]/.test(pass);
    const hasNumber = /[0-9]/.test(pass);
    const hasSpecialChar = /[!@#$%]/.test(pass);
    return minLength && hasLetter && hasNumber && hasSpecialChar;
  };

  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.trim();
    setUsername(val);
    if (val.length > 0 && (val.length < 6 || val.length > 20)) {
      setUsernameError('Tên đăng nhập phải có độ dài từ 6-20 ký tự và duy nhất trong hệ thống');
    } else {
      setUsernameError('');
    }
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.trim();
    setEmail(val);
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (val.length > 0 && !emailRegex.test(val)) {
      setEmailError('Email phải đúng định dạng và không trùng với email đã tồn tại');
    } else {
      setEmailError('');
    }
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setPassword(val);
    if (val.length > 0 && !validatePassword(val)) {
      setPasswordError('Mật khẩu tối thiểu 6 ký tự, bao gồm chữ cái, số và ký tự đặc biệt (!@#$%)');
    } else {
      setPasswordError('');
    }
    
    if (confirmPassword && val !== confirmPassword) {
      setConfirmPasswordError('Mật khẩu xác nhận không khớp');
    } else if (val === confirmPassword) {
      setConfirmPasswordError('');
    }
  };

  const handleConfirmPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setConfirmPassword(val);
    if (val.length > 0 && password !== val) {
      setConfirmPasswordError('Mật khẩu xác nhận không khớp');
    } else {
      setConfirmPasswordError('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (usernameError || emailError || passwordError || confirmPasswordError || !username || !email || !password || !confirmPassword) {
      toast.error('Vui lòng kiểm tra lại thông tin nhập vào');
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post('http://localhost:8000/api/register/', {
        username: username.trim(),
        email: email.trim(),
        password,
      });
      toast.success('Đăng ký thành công!');
      navigate('/');
    } catch (error: any) {
      const errorMessage = error.response?.data?.username?.[0] || error.response?.data?.email?.[0] || 'Đã có lỗi xảy ra';
      toast.error(errorMessage);
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
            <label htmlFor="username" className="block text-[#364153] font-medium mb-2">
              Tên đăng nhập <span className="text-[#E01515]">*</span>
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-[#99A1AF]" />
              <Input
                id="username"
                type="text"
                placeholder="Nhập tên đăng nhập (6-20 kí tự)"
                className={`pl-10 bg-white rounded-[10px] h-12 ${usernameError ? 'border-[#E01515] focus:ring-[#E01515]' : 'border-[#D1D5DC]'}`}
                value={username}
                onChange={handleUsernameChange}
                required
              />
            </div>
            {usernameError && <p className="text-[#E01515] text-sm mt-2 font-medium">{usernameError}</p>}
          </div>

          <div>
            <label htmlFor="email" className="block text-[#364153] font-medium mb-2">
              Email <span className="text-[#E01515]">*</span>
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-[#99A1AF]" />
              <Input
                id="email"
                type="email"
                placeholder="Nhập email phải đúng định dạng và không trùng với email đã tồn tại"
                className={`pl-10 bg-white rounded-[10px] h-12 ${emailError ? 'border-[#E01515] focus:ring-[#E01515]' : 'border-[#D1D5DC]'}`}
                value={email}
                onChange={handleEmailChange}
                required
              />
            </div>
            {emailError && <p className="text-[#E01515] text-sm mt-2 font-medium">{emailError}</p>}
          </div>

          <div>
            <label htmlFor="password" className="block text-[#364153] font-medium mb-2">
              Mật khẩu <span className="text-[#E01515]">*</span>
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-[#99A1AF]" />
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Nhập mật khẩu tối thiểu 6 ký tự, bao gồm chữ cái, số và ký tự đặc biệt"
                className={`pl-10 pr-10 bg-white rounded-[10px] h-12 ${passwordError ? 'border-[#E01515] focus:ring-[#E01515]' : 'border-[#D1D5DC]'}`}
                value={password}
                onChange={handlePasswordChange}
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
            {passwordError && <p className="text-[#E01515] text-sm mt-2 font-medium">{passwordError}</p>}
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-[#364153] font-medium mb-2">
              Xác nhận mật khẩu <span className="text-[#E01515]">*</span>
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-[#99A1AF]" />
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="Nhập lại mật khẩu mới"
                className={`pl-10 pr-10 bg-white rounded-[10px] h-12 ${confirmPasswordError ? 'border-[#E01515] focus:ring-[#E01515]' : 'border-[#D1D5DC]'}`}
                value={confirmPassword}
                onChange={handleConfirmPasswordChange}
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
            {confirmPasswordError && <p className="text-[#E01515] text-sm mt-2 font-medium">{confirmPasswordError}</p>}
          </div>

          <div className="flex flex-col gap-4 pt-2">
            <Button 
              type="submit" 
              className="w-full bg-[#E01515] hover:bg-[#C10007] text-white rounded-[10px] h-12 text-base font-medium" 
              disabled={loading || !!usernameError || !!emailError || !!passwordError || !!confirmPasswordError}
            >
              {loading ? 'Đang xử lý...' : 'Đăng ký'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/')}
              className="w-full bg-white border-[#D1D5DC] text-[#101828] h-12 rounded-[10px] hover:bg-gray-50 text-base font-medium"
            >
              Hủy
            </Button>
          </div>

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