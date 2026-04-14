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
          setUser(res.data);
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

        // 3. Tạm thời tạo một object user giả từ cái username mình vừa nhập
        // để React không bị crash khi Backend chưa kịp trả về user_data
        const mockUser = { id: '1', username: username, role: 'admin' };
        setUser(mockUser as any);

        toast.success('Đăng nhập thành công!');
        return true;

      } catch (error: any) {
        console.error("Lỗi đăng nhập:", error);
        // Chỉ báo lỗi nếu thực sự là lỗi từ Server (401, 404, ...)
        const errorMsg = error.response?.data?.detail || "Đã có lỗi xảy ra khi xử lý dữ liệu";
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