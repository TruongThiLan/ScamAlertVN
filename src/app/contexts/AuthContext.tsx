import React, { createContext, useContext, useState, ReactNode } from 'react';
import { User, UserRole } from '../types';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  register: (email: string, password: string, name: string) => Promise<boolean>;
  logout: () => void;
  updateUser: (userData: Partial<User>) => void;
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
  const [user, setUser] = useState<User | null>(null);

  const login = async (email: string, password: string): Promise<boolean> => {
    // Mock login logic
    const foundUser = mockUsers.find(u => u.email === email);
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

  const updateUser = (userData: Partial<User>) => {
    if (user) {
      setUser({ ...user, ...userData });
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