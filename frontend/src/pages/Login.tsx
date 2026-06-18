import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Activity, ShieldAlert, Key, User } from 'lucide-react';

export const Login: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [usernameOrEmail, setUsernameOrEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!usernameOrEmail.trim() || !password.trim()) {
      setError('Vui lòng điền đầy đủ tên đăng nhập/email và mật khẩu!');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await login(usernameOrEmail.trim(), password);
      // Lấy thông tin user vừa đăng nhập để điều hướng
      // Do useAuth lưu user sau khi token được ghi nhận, ta có thể giải mã token hoặc lấy trực tiếp
      // Để chắc chắn, ta đợi một chút hoặc giải mã JWT, hoặc đơn giản là lấy vai trò từ API phản hồi.
      // Do AuthContext cập nhật State bất đồng bộ, cách tốt nhất là decode token hoặc
      // AuthContext.login có thể trả về thông tin user. Ta sẽ lấy token từ localStorage
      const token = localStorage.getItem('token');
      if (token) {
        const payload = JSON.parse(atob(token.split('.')[1]));
        navigate(`/dashboard/${payload.role}`);
      } else {
        navigate('/');
      }
    } catch (err: any) {
      setError(err.message || 'Tài khoản, email hoặc mật khẩu không chính xác!');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070a13] light:bg-slate-50 text-slate-200 light:text-slate-800 flex flex-col justify-center items-center px-4 font-sans relative overflow-hidden transition-colors duration-300">
      
      {/* Decorative Blur Backgrounds */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-sky-500/10 rounded-full filter blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-primary-500/5 rounded-full filter blur-3xl pointer-events-none"></div>

      <div className="w-full max-w-md bg-slate-900/50 light:bg-white backdrop-blur-md border border-slate-800/80 light:border-slate-200 rounded-2xl p-8 shadow-2xl relative z-10 transition-colors duration-300">
        
        {/* Brand Header */}
        <div className="flex flex-col items-center mb-8">
          <div className="bg-sky-500/10 p-3 rounded-xl border border-sky-500/20 mb-3">
            <Activity className="w-8 h-8 text-sky-400" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-white light:text-slate-900 m-0">Đăng Nhập</h2>
          <p className="text-slate-500 light:text-slate-400 text-xs mt-1.5">Hệ thống điều phối dịch vụ Service Desk</p>
        </div>

        {/* Error Notification */}
        {error && (
          <div className="mb-5 flex items-start space-x-2.5 bg-red-500/10 border border-red-500/20 text-red-400 p-3.5 rounded-xl text-xs font-medium">
            <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          
          {/* Username / Email */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-400 light:text-slate-500 uppercase tracking-wider block">
              Tên tài khoản hoặc Email
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                <User className="w-4 h-4" />
              </span>
              <input
                type="text"
                value={usernameOrEmail}
                onChange={(e) => setUsernameOrEmail(e.target.value)}
                placeholder="Ví dụ: admin hoặc admin@company.com"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950/60 light:bg-white border border-slate-800 light:border-slate-250 focus:border-sky-500/80 focus:ring-1 focus:ring-sky-500/80 outline-none text-slate-100 light:text-slate-800 placeholder-slate-600 light:placeholder-slate-400 text-sm transition"
                required
              />
            </div>
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold text-slate-400 light:text-slate-500 uppercase tracking-wider block">
                Mật khẩu
              </label>
            </div>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                <Key className="w-4 h-4" />
              </span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Nhập mật khẩu (Mặc định: 123456)"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950/60 light:bg-white border border-slate-800 light:border-slate-250 focus:border-sky-500/80 focus:ring-1 focus:ring-sky-500/80 outline-none text-slate-100 light:text-slate-800 placeholder-slate-600 light:placeholder-slate-400 text-sm transition"
                required
              />
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full mt-6 py-2.5 px-4 rounded-xl bg-sky-500 hover:bg-sky-600 active:bg-sky-700 text-white text-sm font-semibold transition shadow-lg shadow-sky-500/15 disabled:opacity-50 cursor-pointer"
          >
            {submitting ? 'Đang xác thực...' : 'Đăng Nhập'}
          </button>

        </form>

        {/* Hints */}
        <div className="mt-8 pt-6 border-t border-slate-800/60 light:border-slate-250 text-[10px] text-slate-500 text-center space-y-1">
          <p>Tài khoản Test: <code className="text-slate-400 light:text-slate-600 font-mono">admin</code>, <code className="text-slate-400 light:text-slate-600 font-mono">manager</code>, <code className="text-slate-400 light:text-slate-600 font-mono">employee1</code>, <code className="text-slate-400 light:text-slate-600 font-mono">user1</code></p>
          <p>Mật khẩu mặc định: <code className="text-slate-400 light:text-slate-600 font-mono">123456</code></p>
        </div>

      </div>
    </div>
  );
};

export default Login;
