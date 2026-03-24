import { Link, useNavigate, useLocation } from 'react-router';
import { useAuth } from '../contexts/AuthContext';
import { Button } from './ui/button';
import { ShieldAlert, User, LogOut, LayoutDashboard, ChevronDown } from 'lucide-react';
import { useState } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from './ui/alert-dialog';

export function Header() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
    setShowLogoutDialog(false);
  };

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-[#D1D5DC] bg-[#E7A6A6]/30 backdrop-blur-sm">
      <div className="flex h-[70px] items-center px-8 gap-[71px]">
        <Link to="/" className="flex items-center">
          <span className="text-[#E01515] text-[30px] leading-[45px]" style={{ fontFamily: "'Krona One', sans-serif" }}>
            ScamAlert VN
          </span>
        </Link>

        <nav className="flex items-center gap-6">
          <Link 
            to="/" 
            className={`text-base transition-colors ${
              isActive('/') 
                ? 'text-[#E01515] font-bold' 
                : 'text-black font-medium hover:text-[#E01515]'
            }`}
          >
            Trang chủ
          </Link>
          {user && (
            <Link 
              to="/my-posts" 
              className={`text-base transition-colors ${
                isActive('/my-posts') 
                  ? 'text-[#E01515] font-bold' 
                  : 'text-black font-medium hover:text-[#E01515]'
              }`}
            >
              Bài viết của tôi
            </Link>
          )}
          <Link 
            to="/about" 
            className={`text-base transition-colors ${
              isActive('/about') 
                ? 'text-[#E01515] font-bold' 
                : 'text-black font-medium hover:text-[#E01515]'
            }`}
          >
            Về chúng tôi
          </Link>
        </nav>

        <div className="ml-auto flex items-center gap-3">
          {!user ? (
            <>
              <Link to="/login">
                <Button className="bg-[#E01515] hover:bg-[#C10007] text-white rounded-[10px] px-4 py-2">
                  Đăng nhập
                </Button>
              </Link>
              <Link to="/register">
                <Button className="bg-[#E01515] hover:bg-[#C10007] text-white rounded-[10px] px-4 py-2">
                  Đăng ký
                </Button>
              </Link>
            </>
          ) : (
            <>
              {user.role === 'admin' && (
                <Link to="/admin/users">
                  <Button variant="outline" className="rounded-[10px]">
                    <LayoutDashboard className="h-4 w-4 mr-2" />
                    Quản trị
                  </Button>
                </Link>
              )}
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-3 px-[16.8px] py-[8.8px] bg-white rounded-[10px] border border-[#D1D5DC] hover:bg-gray-50 transition-colors">
                    <div className="w-10 h-10 bg-[#E01515] rounded-full flex items-center justify-center">
                      <User className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex flex-col items-start">
                      <div className="text-sm font-semibold text-black">{user.name}</div>
                      <div className="text-xs text-[#4A5565]">{user.email}</div>
                    </div>
                    <ChevronDown className="h-5 w-5 text-[#4A5565]" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem asChild>
                    <Link to="/profile">Tài khoản của tôi</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/my-posts">Bài viết của tôi</Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setShowLogoutDialog(true)}>
                    <LogOut className="h-4 w-4 mr-2" />
                    Đăng xuất
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          )}
        </div>
      </div>

      <AlertDialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Đăng xuất</AlertDialogTitle>
            <AlertDialogDescription>Bạn có chắc chắn muốn đăng xuất không?</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction onClick={handleLogout}>Đăng xuất</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </header>
  );
}