import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../../types';
import api from '../../api/axiosInstance'; // Sử dụng trạm điều khiển Axios của Nguyệt
import { toast } from 'sonner';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  register: (userData: any) => Promise<boolean>;
  logout: () => void;
  updateUser: (userData: Partial<User>) => Promise<{ success: boolean; message?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // 1. Kiểm tra "phiên làm việc" ngay khi vừa mở web
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('access_token');
      if (token) {
        try {
          // Gọi API lấy thông tin người dùng hiện tại dựa trên token
          const res = await api.get('users/me/');
          const userData = res.data;
          // Ánh xạ để tương thích với frontend cũ dùng .name và .reputationScore
          userData.name = userData.username;
          userData.reputationScore = userData.reputation_score;
          // Ánh xạ role string cho frontend (ví dụ 'Admin' -> 'admin')
          userData.role = userData.role_name ? userData.role_name.toLowerCase() : 'user';
          setUser(userData);
        } catch (error) {
          console.error("Token hết hạn hoặc không hợp lệ");
          logout(); // Xóa sạch dấu vết nếu token hỏng
        }
      }
      setLoading(false);
    };
    checkAuth();
  }, []);

  // 2. Hàm Đăng nhập thật - Kết nối Django
    const login = async (username: string, password: string): Promise<boolean> => {
      try {
        const res = await api.post('login/', { username, password });

        // 1. Lấy token ra
        const { access, refresh } = res.data;

        // 2. Lưu vào máy
        localStorage.setItem('access_token', access);
        localStorage.setItem('refresh_token', refresh);

        // 3. Gọi API lấy thông tin User thật ngay lập tức
        const userRes = await api.get('users/me/');
        const userData = userRes.data;
        userData.name = userData.username;
        userData.reputationScore = userData.reputation_score;
        // Ánh xạ role string cho frontend
        userData.role = userData.role_name ? userData.role_name.toLowerCase() : 'user';
        
        setUser(userData);

        toast.success('Đăng nhập thành công!');
        return true;

      } catch (error: any) {
        console.error("Lỗi đăng nhập:", error);
        const errorMsg = error.response?.data?.detail || "Sai tài khoản hoặc mật khẩu.";
        toast.error(errorMsg);
        return false;
      }
    };

  // 3. Hàm Đăng ký thật
  const register = async (userData: any): Promise<boolean> => {
    try {
      const res = await api.post('users/', userData);
      toast.success("Đăng ký thành công! Hãy đăng nhập nhé.");
      return true;
    } catch (error: any) {
      toast.error("Đăng ký thất bại. Email hoặc Username có thể đã tồn tại.");
      return false;
    }
  };

  // 4. Hàm Đăng xuất - Xóa sạch sành sanh
  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    setUser(null);
    toast.info("Đã đăng xuất khỏi hệ thống");
  };

  // 5. Cập nhật thông tin User thật
  const updateUser = async (userData: Partial<User>): Promise<{ success: boolean; message?: string }> => {
    try {
      if (!user) return { success: false, message: 'Bạn chưa đăng nhập' };

      const res = await api.patch(`users/${user.id}/`, userData);
      setUser(res.data);
      return { success: true };
    } catch (error: any) {
      return { success: false, message: error.response?.data?.message || 'Lỗi cập nhật' };
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateUser }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}