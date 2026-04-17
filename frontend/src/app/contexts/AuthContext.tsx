import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { toast } from 'sonner';
import api from '../../api/axiosInstance';
import { User } from '../types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  is_admin: boolean;
  login: (username: string, password: string) => Promise<User | null>;
  register: (email: string, password: string, username: string) => Promise<boolean>;
  logout: () => void;
  updateUser: (userData: Partial<User>) => Promise<{ success: boolean; message?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const normalizeUser = (rawUser: any): User => ({
  ...rawUser,
  role_name: rawUser.role_name ?? null,
  is_staff: Boolean(rawUser.is_staff),
  name: rawUser.username,
  reputationScore: rawUser.reputation_score,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const is_admin = user?.role_name === 'Admin' && user?.is_staff === true;

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('access_token');
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const res = await api.get('users/me/');
        setUser(normalizeUser(res.data));
      } catch (error) {
        console.error('Token het han hoac khong hop le', error);
        logout();
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (username: string, password: string): Promise<User | null> => {
    try {
      const res = await api.post('login/', { username, password });
      const { access, refresh } = res.data;

      localStorage.setItem('access_token', access);
      localStorage.setItem('refresh_token', refresh);

      const userRes = await api.get('users/me/');
      const userData = normalizeUser(userRes.data);
      setUser(userData);

      toast.success('Dang nhap thanh cong!');
      return userData;
    } catch (error: any) {
      console.error('Loi dang nhap:', error);
      const errorMsg = error.response?.data?.detail || 'Sai tai khoan hoac mat khau.';
      toast.error(errorMsg);
      return null;
    }
  };

  const register = async (email: string, password: string, username: string): Promise<boolean> => {
    try {
      await api.post('register/', { username, email, password });
      toast.success('Dang ky thanh cong! Hay dang nhap nhe.');
      return true;
    } catch (error: any) {
      const data = error.response?.data;
      const errorMsg =
        data?.username?.[0] ||
        data?.email?.[0] ||
        data?.password?.[0] ||
        'Dang ky that bai. Email hoac username co the da ton tai.';
      toast.error(errorMsg);
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    setUser(null);
    toast.info('Da dang xuat khoi he thong');
  };

  const updateUser = async (userData: Partial<User>): Promise<{ success: boolean; message?: string }> => {
    try {
      if (!user) return { success: false, message: 'Ban chua dang nhap' };

      const res = await api.patch(`users/${user.id}/`, userData);
      setUser(normalizeUser(res.data));
      return { success: true };
    } catch (error: any) {
      return { success: false, message: error.response?.data?.message || 'Loi cap nhat' };
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, is_admin, login, register, logout, updateUser }}>
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
