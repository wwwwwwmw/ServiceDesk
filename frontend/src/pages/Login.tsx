import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, api } from '../contexts/AuthContext';
import { Activity, ShieldAlert, Key, User, Mail, ArrowLeft, CheckCircle } from 'lucide-react';

export const Login: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [usernameOrEmail, setUsernameOrEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // States cho quên mật khẩu
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState<string | null>(null);
  const [forgotError, setForgotError] = useState<string | null>(null);
  const [forgotSubmitting, setForgotSubmitting] = useState(false);

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

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail.trim()) {
      setForgotError('Vui lòng nhập địa chỉ email của bạn!');
      return;
    }

    setForgotSubmitting(true);
    setForgotError(null);
    setForgotSuccess(null);

    try {
      const response = await api.post('/api/auth/forgot-password', { email: forgotEmail.trim() });
      setForgotSuccess(response.data.message || 'Yêu cầu đổi mật khẩu thành công. Vui lòng chờ phản hồi từ Admin.');
      setForgotEmail('');
    } catch (err: any) {
      setForgotError(err.response?.data?.error || 'Địa chỉ email không tồn tại trong hệ thống!');
    } finally {
      setForgotSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070a13] light:bg-slate-50 text-slate-200 light:text-slate-800 flex flex-col justify-center items-center px-4 font-sans relative overflow-hidden transition-colors duration-300">
      
      {/* Decorative Blur Backgrounds */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-sky-500/10 rounded-full filter blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-primary-500/5 rounded-full filter blur-3xl pointer-events-none"></div>

      <div className="w-full max-w-md bg-slate-900/50 light:bg-white backdrop-blur-md border border-slate-800/80 light:border-slate-200 rounded-2xl p-8 shadow-2xl relative z-10 transition-colors duration-300">
        
        {!isForgotPassword ? (
          <>
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
                  <button
                    type="button"
                    onClick={() => {
                      setIsForgotPassword(true);
                      setForgotError(null);
                      setForgotSuccess(null);
                    }}
                    className="text-xs text-sky-400 hover:text-sky-300 light:text-sky-600 light:hover:text-sky-700 font-semibold cursor-pointer"
                  >
                    Quên mật khẩu?
                  </button>
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
          </>
        ) : (
          <>
            {/* Forgot Password Header */}
            <div className="flex flex-col items-center mb-8">
              <div className="bg-sky-500/10 p-3 rounded-xl border border-sky-500/20 mb-3">
                <Mail className="w-8 h-8 text-sky-400" />
              </div>
              <h2 className="text-2xl font-bold tracking-tight text-white light:text-slate-900 m-0">Quên Mật Khẩu</h2>
              <p className="text-slate-500 light:text-slate-400 text-xs mt-1.5 text-center">Nhập email đã đăng ký để gửi yêu cầu đặt lại mật khẩu</p>
            </div>

            {/* Error Notification */}
            {forgotError && (
              <div className="mb-5 flex items-start space-x-2.5 bg-red-500/10 border border-red-500/20 text-red-400 p-3.5 rounded-xl text-xs font-medium">
                <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{forgotError}</span>
              </div>
            )}

            {/* Success Notification */}
            {forgotSuccess && (
              <div className="mb-5 flex items-start space-x-2.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-3.5 rounded-xl text-xs font-semibold">
                <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{forgotSuccess}</span>
              </div>
            )}

            {/* Forgot Form */}
            <form onSubmit={handleForgotSubmit} className="space-y-5">
              
              {/* Email Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400 light:text-slate-500 uppercase tracking-wider block">
                  Địa chỉ Email
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                    <Mail className="w-4 h-4" />
                  </span>
                  <input
                    type="email"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="Nhập email của bạn (ví dụ: user1@company.com)"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950/60 light:bg-white border border-slate-800 light:border-slate-250 focus:border-sky-500/80 focus:ring-1 focus:ring-sky-500/80 outline-none text-slate-100 light:text-slate-800 placeholder-slate-600 light:placeholder-slate-400 text-sm transition"
                    required
                  />
                </div>
              </div>

              {/* Submit forgot request */}
              <button
                type="submit"
                disabled={forgotSubmitting}
                className="w-full mt-6 py-2.5 px-4 rounded-xl bg-sky-500 hover:bg-sky-600 active:bg-sky-700 text-white text-sm font-semibold transition shadow-lg shadow-sky-500/15 disabled:opacity-50 cursor-pointer"
              >
                {forgotSubmitting ? 'Đang gửi yêu cầu...' : 'Gửi Yêu Cầu'}
              </button>

              {/* Return to login link */}
              <button
                type="button"
                onClick={() => {
                  setIsForgotPassword(false);
                  setError(null);
                }}
                className="w-full flex items-center justify-center space-x-1.5 py-2 text-xs text-slate-400 hover:text-slate-300 light:text-slate-600 light:hover:text-slate-700 font-semibold cursor-pointer transition"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Quay lại đăng nhập</span>
              </button>

            </form>
          </>
        )}

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
