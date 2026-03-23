import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, UserRole } from '../types';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  register: (email: string, password: string, name: string) => Promise<boolean>;
  logout: () => void;
  updateUser: (userData: Partial<User>) => Promise<{ success: boolean; message?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Danh sách user mặc định ban đầu
const defaultMockUsers: User[] = [
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
  // 1. Khởi tạo danh sách users từ localStorage (nếu chưa có thì lấy mặc định)
  const [usersList, setUsersList] = useState<User[]>(() => {
    const savedUsers = localStorage.getItem('scamalert_users');
    return savedUsers ? JSON.parse(savedUsers) : defaultMockUsers;
  });

  // 2. Khởi tạo user đang đăng nhập từ localStorage (để F5 không bị văng ra ngoài)
  const [user, setUser] = useState<User | null>(() => {
    const savedUser = localStorage.getItem('scamalert_current_user');
    // Mặc định cho "Nguyễn Văn A" đăng nhập lúc đầu giống code cũ của bạn
    return savedUser ? JSON.parse(savedUser) : defaultMockUsers[1]; 
  });

  // 3. Tự động lưu danh sách users vào localStorage mỗi khi có người đăng ký mới
  useEffect(() => {
    localStorage.setItem('scamalert_users', JSON.stringify(usersList));
  }, [usersList]);

  // 4. Tự động lưu trạng thái đăng nhập vào localStorage
  useEffect(() => {
    if (user) {
      localStorage.setItem('scamalert_current_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('scamalert_current_user');
    }
  }, [user]);

  const login = async (email: string, password: string): Promise<boolean> => {
    // Tìm user trong danh sách đã lưu
    const normalizedEmail = email.trim().toLowerCase();
    const foundUser = usersList.find(u => u.email.toLowerCase() === normalizedEmail);
    
    if (foundUser) {
      setUser(foundUser);
      return true;
    }
    return false;
  };

  const register = async (email: string, password: string, name: string): Promise<boolean> => {
    const normalizedEmail = email.trim().toLowerCase();
    
    // Kiểm tra xem email đã tồn tại chưa
    if (usersList.some(u => u.email.toLowerCase() === normalizedEmail)) {
      return false; // Email đã được sử dụng
    }

    const newUser: User = {
      id: Date.now().toString(),
      email: normalizedEmail,
      name,
      role: 'user',
      createdAt: new Date().toISOString(),
      reputationScore: 15,
      violationCount: 0,
    };
    
    // Thêm user mới vào danh sách và cho đăng nhập luôn
    setUsersList(prev => [...prev, newUser]);
    setUser(newUser);
    return true;
  };

  const logout = () => {
    setUser(null);
  };

  const updateUser = async (userData: Partial<User>): Promise<{ success: boolean; message?: string }> => {
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      
      if (!userData.name || userData.name.length < 3) {
        return { success: false, message: 'Tên phải có ít nhất 3 ký tự' };
      }

      if (user) {
        const updatedUser = { ...user, ...userData };
        setUser(updatedUser);
        
        // Cập nhật thông tin user này trong cả danh sách tổng
        setUsersList(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
        
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