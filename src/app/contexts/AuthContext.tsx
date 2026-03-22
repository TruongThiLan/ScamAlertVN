import React, { createContext, useContext, useState, ReactNode } from 'react';
import { User, UserRole } from '../types';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  register: (email: string, password: string, name: string) => Promise<boolean>;
  logout: () => void;
  updateUser: (userData: Partial<User>) => Promise<{ success: boolean; message?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mock users for demonstration
const mockUsers: User[] = [
  {
    id: '1',
    email: 'admin@scamalert.vn',
    name: 'Admin',
    role: 'admin',
    createdAt: new Date().toISOString(),
    reputationScore: 100,
    violationCount: 0,
  },
  {
    id: '2',
    email: 'user@example.com',
    name: 'Nguyễn Văn A',
    role: 'user',
    createdAt: new Date().toISOString(),
    reputationScore: 15,
    violationCount: 0,
  },
];

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(mockUsers[1]); // Tài khoản user mặc định

  const login = async (email: string, password: string): Promise<boolean> => {
    // Mock login logic
    const normalizedEmail = email.trim().toLowerCase();
    const foundUser = mockUsers.find(u => u.email.toLowerCase() === normalizedEmail);
    if (foundUser) {
      setUser(foundUser);
      return true;
    }
    return false;
  };

  const register = async (email: string, password: string, name: string): Promise<boolean> => {
    // Mock registration logic
    const newUser: User = {
      id: Date.now().toString(),
      email,
      name,
      role: 'user',
      createdAt: new Date().toISOString(),
      reputationScore: 15,
      violationCount: 0,
    };
    mockUsers.push(newUser);
    setUser(newUser);
    return true;
  };

  const logout = () => {
    setUser(null);
  };

  const updateUser = async (userData: Partial<User>): Promise<{ success: boolean; message?: string }> => {
    try {
      // Mock API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      if (!userData.name || userData.name.length < 3) {
        return { success: false, message: 'Tên phải có ít nhất 3 ký tự' };
      }

      if (user) {
        setUser({ ...user, ...userData });
        return { success: true };
      }
      return { success: false, message: 'Người dùng không tồn tại' };
    } catch (error) {
      return { success: false, message: 'Lỗi hệ thống khi cập nhật' };
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, updateUser }}>
      {children}
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