import { Link, useNavigate, useLocation } from 'react-router';
import { useAuth } from '../contexts/AuthContext';
import { Button } from './ui/button';
import { ShieldAlert, User, LogOut, LayoutDashboard, ChevronDown, Bell, Check } from 'lucide-react';
import { useState, useEffect } from 'react';
import { mockNotifications } from '../data/mockData';
import { Notification } from '../types';
import { Avatar } from './Avatar';
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
  const { user, is_admin, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);

  const [notifications, setNotifications] = useState<Notification[]>(mockNotifications);

  // If user changes, reset notifications list based on user (Mocked here)
  useEffect(() => {
    if (user) {
      setNotifications(mockNotifications.filter(n => n.userId === user.id));
    }
  }, [user]);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const handleLogout = () => {
    logout();
    navigate('/');
    setShowLogoutDialog(false);
  };

  const markAllAsRead = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setNotifications(notifications.map(n => ({ ...n, isRead: true })));
  };

  const markAsRead = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setNotifications(notifications.map(n => n.id === id ? { ...n, isRead: true } : n));
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
              {is_admin && (
                <Link to="/admin/dashboard">
                  <Button variant="outline" className="rounded-[10px] border-[#E01515] text-[#E01515] hover:bg-[#FFF1F1]">
                    <LayoutDashboard className="h-4 w-4 mr-2" />
                    Trang Quản Trị
                  </Button>
                </Link>
              )}
              
              {/* Notification Bell */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="relative p-2 rounded-full hover:bg-gray-100 transition-colors mr-2 outline-none">
                    <Bell className="h-6 w-6 text-[#4A5565]" />
                    {unreadCount > 0 && (
                      <span className="absolute top-1 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-[#E01515] text-[10px] font-bold text-white shadow-sm border border-white">
                        {unreadCount}
                      </span>
                    )}
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-80 p-0 border border-[#D1D5DC] shadow-lg rounded-[10px] bg-white overflow-hidden">
                  <div className="flex justify-between items-center px-4 py-3 bg-gray-50 border-b border-[#D1D5DC]">
                    <span className="font-semibold text-[#1E293B]">Thông báo</span>
                    {unreadCount > 0 && (
                      <button 
                        onClick={markAllAsRead} 
                        className="text-xs text-blue-600 hover:text-blue-800 transition-colors font-medium flex items-center gap-1"
                      >
                        <Check className="h-3 w-3" />
                        Đánh dấu đã đọc
                      </button>
                    )}
                  </div>
                  <div className="max-h-[300px] overflow-y-auto">
                    {notifications.length > 0 ? (
                      <div className="flex flex-col">
                        {notifications.map(notif => (
                          <div
                            key={notif.id}
                            onClick={(e) => markAsRead(notif.id, e)}
                            // We use a div instead of DropdownMenuItem to prevent the menu from closing unconditionally when clicked,
                            // or we can allow it to close. Usually clicking a notification navigates somewhere and closes the menu.
                            // If we want it to close, we can just let it navigate. For now, it just marks as read.
                            className={`flex flex-col items-start px-4 py-3 border-b border-[#E2E8F0] cursor-pointer hover:bg-gray-50 transition-colors ${
                              !notif.isRead ? 'bg-blue-50/40' : ''
                            }`}
                          >
                            <div className="flex justify-between w-full items-start gap-2">
                              <span className={`text-sm leading-snug ${!notif.isRead ? 'font-semibold text-gray-900' : 'text-[#4A5565]'}`}>
                                {notif.content}
                              </span>
                              {!notif.isRead && (
                                <span className="h-2 w-2 rounded-full bg-[#E01515] mt-1 shrink-0 relative top-0.5 shadow-sm" />
                              )}
                            </div>
                            <span className="text-xs text-[#99A1AF] mt-1.5 flex items-center gap-1 font-medium">
                              {new Date(notif.createdTime).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' })}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-6 text-center flex flex-col items-center gap-2">
                        <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center mb-1">
                          <Bell className="h-6 w-6 text-gray-300" />
                        </div>
                        <span className="text-sm text-[#99A1AF] font-medium">Chưa có thông báo nào</span>
                      </div>
                    )}
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-3 px-[16.8px] py-[8.8px] bg-white rounded-[10px] border border-[#D1D5DC] hover:bg-gray-50 transition-colors">
                    <Avatar name={user.name || user.username} size="md" />
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
                  <DropdownMenuItem asChild>
                    <Link to="/saved-posts">Bài viết đã lưu</Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setShowLogoutDialog(true)} className="text-[#E01515] cursor-pointer focus:text-[#E01515] focus:bg-red-50">
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
            <AlertDialogAction onClick={handleLogout} className="bg-[#E01515] hover:bg-[#C10007]">Đăng xuất</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </header>
  );
}
