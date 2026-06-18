import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  allowedRoles: Array<'admin' | 'manager' | 'employee' | 'user'>;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#070a13] flex flex-col items-center justify-center text-slate-300">
        <Loader2 className="w-10 h-10 text-sky-400 animate-spin mb-4" />
        <p className="text-sm tracking-wide text-slate-500 font-medium">Đang tải thông tin hệ thống...</p>
      </div>
    );
  }

  // Chưa đăng nhập thì chuyển về trang login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Đăng nhập rồi nhưng không đúng role thì chuyển về trang dashboard tương ứng với role đó
  if (!allowedRoles.includes(user.role)) {
    return <Navigate to={`/dashboard/${user.role}`} replace />;
  }

  // Hợp lệ thì render route bên trong
  return <Outlet />;
};

export default ProtectedRoute;
