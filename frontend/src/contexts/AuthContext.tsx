import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';

export interface User {
  id: string;
  username: string;
  email: string;
  role: 'admin' | 'manager' | 'employee' | 'user';
  location_id: string | null;
  location_name?: string;
}

interface AuthContextType {
  token: string | null;
  user: User | null;
  loading: boolean;
  login: (usernameOrEmail: string, password: string) => Promise<void>;
  logout: () => void;
  updateUserSession: (token: string, user: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Axios instance cấu hình cơ bản cho API
export const api = axios.create({
  baseURL: 'http://localhost:5000'
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Cấu hình interceptor để tự động gắn token vào header của mọi request gửi đi
  useEffect(() => {
    const requestInterceptor = api.interceptors.request.use((config) => {
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    return () => {
      api.interceptors.request.eject(requestInterceptor);
    };
  }, [token]);

  // Load thông tin user hiện tại nếu có token trong localStorage khi mở trang
  useEffect(() => {
    const fetchUser = async () => {
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const response = await api.get<User>('/api/auth/me');
        setUser(response.data);
      } catch (error) {
        console.error('Không thể tự động đăng nhập từ Token lưu trữ:', error);
        logout();
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [token]);

  // Đăng nhập hệ thống (Hỗ trợ kép username/email)
  const login = async (usernameOrEmail: string, password: string) => {
    setLoading(true);
    try {
      const response = await api.post<{ token: string; user: User }>('/api/auth/login', {
        usernameOrEmail,
        password
      });

      const { token: receivedToken, user: receivedUser } = response.data;
      localStorage.setItem('token', receivedToken);
      setToken(receivedToken);
      setUser(receivedUser);
    } catch (error: any) {
      const errorMsg = error.response?.data?.error || 'Đăng nhập không thành công. Vui lòng kiểm tra lại!';
      throw new Error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  // Đăng xuất hệ thống
  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  // Cập nhật session
  const updateUserSession = (newToken: string, newUser: User) => {
    localStorage.setItem('token', newToken);
    setToken(newToken);
    setUser(newUser);
  };

  return (
    <AuthContext.Provider value={{ token, user, loading, login, logout, updateUserSession }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth phải được sử dụng bên trong AuthProvider!');
  }
  return context;
};
