import { Link, useLocation, useNavigate } from 'react-router';
import { useAuth } from '../contexts/AuthContext';
import { User, ChevronDown, LogOut, Home } from 'lucide-react';
import { useState } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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

export function AdminHeader() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
    setShowLogoutDialog(false);
  };

  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  return (
    <>
      <header className="bg-[#E7A5A5]/30 border-b border-[#D1D5DC]" style={{ height: '70px' }}>
        <div className="px-8 h-full flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center">
            <h1 className="text-[30px] text-[#E01515] leading-[45px]" style={{ fontFamily: 'Krona One, sans-serif' }}>
              ScamAlert VN
            </h1>
          </Link>

          {/* Navigation Links */}
          <nav className="flex items-center gap-6">
            <Link
              to="/admin/users"
              className={`text-base transition-colors ${isActive('/admin/users')
                  ? 'text-[#E01515] font-bold'
                  : 'text-black font-medium hover:text-[#E01515]'
                }`}
            >
              Quản lý người dùng
            </Link>
            <Link
              to="/admin/posts"
              className={`text-base transition-colors ${isActive('/admin/posts')
                  ? 'text-[#E01515] font-bold'
                  : 'text-black font-medium hover:text-[#E01515]'
                }`}
            >
              Quản lý bài viết
            </Link>
            <Link
              to="/admin/categories"
              className={`text-base transition-colors ${isActive('/admin/categories')
                  ? 'text-[#E01515] font-bold'
                  : 'text-black font-medium hover:text-[#E01515]'
                }`}
            >
              Quản lý danh mục
            </Link>
            <Link
              to="/admin/statistics"
              className={`text-base transition-colors ${isActive('/admin/statistics')
                  ? 'text-[#E01515] font-bold'
                  : 'text-black font-medium hover:text-[#E01515]'
                }`}
            >
              Báo cáo thống kê
            </Link>
          </nav>

          <div className="flex items-center gap-3">
            <Link to="/">
              <button className="flex items-center gap-2 px-3 py-2 bg-white rounded-[10px] border border-[#D1D5DC] hover:bg-gray-50 transition-colors">
                <Home className="h-4 w-4 text-[#4A5565]" />
                <span className="text-sm font-medium text-[#4A5565]">Xem trang người dùng</span>
              </button>
            </Link>

            {/* User Menu */}
            {user && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-3 px-4 h-[58px] bg-white rounded-[10px] border border-[#D1D5DC] hover:bg-gray-50 transition-colors">
                    <div className="w-10 h-10 bg-[#E01515] rounded-full flex items-center justify-center">
                      <User className="h-6 w-6 text-white" strokeWidth={2} />
                    </div>
                    <div className="flex flex-col items-start">
                      <div className="text-sm font-semibold text-black leading-[21px]">Admin</div>
                      <div className="text-xs text-[#4A5565] leading-[18px]">admin@scamalert.vn</div>
                    </div>
                    <ChevronDown className="h-5 w-5 text-[#4A5565]" strokeWidth={1.67} />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="px-2 py-1.5">
                    <p className="text-sm font-semibold text-[#1E293B]">Admin</p>
                    <p className="text-xs text-[#99A1AF]">admin@scamalert.vn</p>
                  </div>
                  <DropdownMenuSeparator />

                  <DropdownMenuItem onClick={() => setShowLogoutDialog(true)} className="text-[#E01515] cursor-pointer">
                    <LogOut className="h-4 w-4 mr-2" />
                    Đăng xuất
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </header>

      <AlertDialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Đăng xuất</AlertDialogTitle>
            <AlertDialogDescription>Bạn có chắc chắn muốn đăng xuất không?</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction onClick={handleLogout} className="bg-[#E01515] hover:bg-[#C10007]">
              Đăng xuất
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}