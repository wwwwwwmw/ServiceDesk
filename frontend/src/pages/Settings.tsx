import React, { useState, useEffect } from 'react';
import { useAuth, api } from '../contexts/AuthContext';
import { 
  User as UserIcon, 
  Lock, 
  MapPin, 
  Mail, 
  CheckCircle, 
  AlertCircle, 
  Loader2 
} from 'lucide-react';

interface Location {
  id: string;
  name: string;
}

export const Settings: React.FC = () => {
  const { user, updateUserSession } = useAuth();
  const [activeTab, setActiveTab] = useState<'profile' | 'password'>('profile');
  const [locations, setLocations] = useState<Location[]>([]);

  // Profile states
  const [username, setUsername] = useState(user?.username || '');
  const [email, setEmail] = useState(user?.email || '');
  const [locationId, setLocationId] = useState(user?.location_id || '');
  const [room, setRoom] = useState(user?.room || '');
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileMessage, setProfileMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Password states
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Load locations
  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const response = await api.get<Location[]>('/api/locations');
        setLocations(response.data);
      } catch (error) {
        console.error('Không thể lấy danh sách khu vực:', error);
      }
    };
    fetchLocations();
  }, []);

  // Update profile handler
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileMessage(null);

    if (!username.trim() || !email.trim()) {
      setProfileMessage({ type: 'error', text: 'Tên người dùng và Email không được bỏ trống!' });
      return;
    }

    setProfileLoading(true);
    try {
      const response = await api.put<{ message: string; token: string; user: any }>('/api/auth/profile', {
        username: username.trim(),
        email: email.trim(),
        location_id: locationId || null,
        room: room.trim() || null
      });

      const { token, user: updatedUser } = response.data;
      updateUserSession(token, updatedUser);
      setProfileMessage({ type: 'success', text: 'Cập nhật thông tin cá nhân thành công!' });
    } catch (error: any) {
      console.error(error);
      const msg = error.response?.data?.error || 'Đã xảy ra lỗi khi cập nhật thông tin.';
      setProfileMessage({ type: 'error', text: msg });
    } finally {
      setProfileLoading(false);
    }
  };

  // Update password handler
  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMessage(null);

    if (!oldPassword || !newPassword || !confirmPassword) {
      setPasswordMessage({ type: 'error', text: 'Vui lòng nhập đầy đủ tất cả các trường mật khẩu!' });
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordMessage({ type: 'error', text: 'Mật khẩu mới và xác nhận mật khẩu không trùng khớp!' });
      return;
    }

    if (newPassword.length < 6) {
      setPasswordMessage({ type: 'error', text: 'Mật khẩu mới phải có ít nhất 6 ký tự!' });
      return;
    }

    setPasswordLoading(true);
    try {
      await api.put('/api/auth/password', {
        oldPassword,
        newPassword
      });

      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setPasswordMessage({ type: 'success', text: 'Thay đổi mật khẩu thành công!' });
    } catch (error: any) {
      console.error(error);
      const msg = error.response?.data?.error || 'Mật khẩu cũ không chính xác hoặc lỗi hệ thống.';
      setPasswordMessage({ type: 'error', text: msg });
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Title Header */}
      <div>
        <h1 className="text-2xl font-bold text-white light:text-slate-900 tracking-tight m-0">Cài đặt tài khoản</h1>
        <p className="text-sm text-slate-400 light:text-slate-500 mt-2">
          Thay đổi thông tin cá nhân, cập nhật khu vực làm việc hoặc cập nhật lại mật khẩu của bạn.
        </p>
      </div>

      {/* Tabs Layout */}
      <div className="flex space-x-1 p-1 bg-slate-950/60 light:bg-slate-200/50 rounded-xl border border-slate-900 light:border-slate-300 max-w-md">
        <button
          onClick={() => setActiveTab('profile')}
          className={`flex items-center justify-center space-x-2 w-1/2 py-2.5 rounded-lg text-xs font-semibold tracking-wide transition-all duration-200 ${
            activeTab === 'profile'
              ? 'bg-sky-500 text-white shadow-md'
              : 'text-slate-400 light:text-slate-600 hover:text-slate-200 light:hover:text-slate-950'
          }`}
        >
          <UserIcon className="w-4 h-4" />
          <span>Thông tin cá nhân</span>
        </button>
        <button
          onClick={() => setActiveTab('password')}
          className={`flex items-center justify-center space-x-2 w-1/2 py-2.5 rounded-lg text-xs font-semibold tracking-wide transition-all duration-200 ${
            activeTab === 'password'
              ? 'bg-sky-500 text-white shadow-md'
              : 'text-slate-400 light:text-slate-600 hover:text-slate-200 light:hover:text-slate-950'
          }`}
        >
          <Lock className="w-4 h-4" />
          <span>Đổi mật khẩu</span>
        </button>
      </div>

      {/* Content Form Card */}
      <div className="bg-slate-900/40 light:bg-white border border-slate-800/80 light:border-slate-200 rounded-2xl p-6 shadow-xl relative overflow-hidden transition-colors duration-300">
        {activeTab === 'profile' ? (
          <form onSubmit={handleUpdateProfile} className="space-y-6">
            <h2 className="text-base font-bold text-white light:text-slate-900 border-b border-slate-800/60 light:border-slate-200 pb-3 m-0">
              Thông tin cá nhân & Khu vực làm việc
            </h2>

            {profileMessage && (
              <div className={`p-4 rounded-xl flex items-center space-x-3 text-sm border ${
                profileMessage.type === 'success'
                  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                  : 'bg-red-500/10 border-red-500/20 text-red-400'
              }`}>
                {profileMessage.type === 'success' ? <CheckCircle className="w-5 h-5 shrink-0" /> : <AlertCircle className="w-5 h-5 shrink-0" />}
                <span>{profileMessage.text}</span>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Tên đăng nhập */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 light:text-slate-500 uppercase tracking-wide">
                  Tên hiển thị
                </label>
                <div className="relative">
                  <UserIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-950/50 light:bg-slate-50 text-sm rounded-xl border border-slate-800 light:border-slate-250 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 outline-none text-white light:text-slate-900 font-medium transition duration-200"
                    placeholder="Nhập tên đăng nhập của bạn..."
                  />
                </div>
              </div>

              {/* Email */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 light:text-slate-500 uppercase tracking-wide">
                  Địa chỉ Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-950/50 light:bg-slate-50 text-sm rounded-xl border border-slate-800 light:border-slate-250 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 outline-none text-white light:text-slate-900 font-medium transition duration-200"
                    placeholder="Nhập email của bạn..."
                  />
                </div>
              </div>

              {/* Khu vực làm việc */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 light:text-slate-500 uppercase tracking-wide flex items-center">
                  <MapPin className="w-3.5 h-3.5 mr-1 text-sky-400" />
                  Khu vực làm việc
                </label>
                <select
                  value={locationId}
                  disabled={user?.role !== 'admin'}
                  onChange={(e) => setLocationId(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-950/50 light:bg-slate-50 text-sm rounded-xl border border-slate-800 light:border-slate-250 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 outline-none text-white light:text-slate-900 font-medium transition duration-200 appearance-none cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <option value="" className="bg-slate-950 light:bg-white text-slate-400">
                    -- Chọn khu vực --
                  </option>
                  {locations.map((loc) => (
                    <option key={loc.id} value={loc.id} className="bg-slate-950 light:bg-white text-white light:text-slate-900">
                      {loc.name}
                    </option>
                  ))}
                </select>
                {user?.role !== 'admin' ? (
                  <p className="text-[11px] text-amber-500 mt-1">
                    * Chỉ Admin mới được quyền thay đổi Khu vực.
                  </p>
                ) : (
                  <p className="text-[11px] text-slate-500 mt-1">
                    * Hệ thống sẽ dựa trên Khu vực để tự động điều hướng ticket.
                  </p>
                )}
              </div>

              {/* Phòng làm việc */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 light:text-slate-500 uppercase tracking-wide flex items-center">
                  <span className="w-3.5 h-3.5 mr-1 flex items-center justify-center text-sky-400 font-extrabold">P</span>
                  Phòng làm việc mặc định
                </label>
                <input
                  type="text"
                  value={room}
                  onChange={(e) => setRoom(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-950/50 light:bg-slate-50 text-sm rounded-xl border border-slate-800 light:border-slate-250 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 outline-none text-white light:text-slate-900 font-medium transition duration-200"
                  placeholder="Ví dụ: Phòng 201, 305..."
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  * Tự động điền vào ticket khi bạn tạo yêu cầu hỗ trợ mới.
                </p>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800/60 light:border-slate-200 flex justify-end">
              <button
                type="submit"
                disabled={profileLoading}
                className="px-6 py-2.5 bg-sky-500 hover:bg-sky-600 disabled:bg-sky-500/50 text-white font-bold text-xs rounded-xl transition flex items-center space-x-2 cursor-pointer shadow-lg shadow-sky-500/10"
              >
                {profileLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>Lưu thay đổi</span>
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleUpdatePassword} className="space-y-6">
            <h2 className="text-base font-bold text-white light:text-slate-900 border-b border-slate-800/60 light:border-slate-200 pb-3 m-0">
              Đổi mật khẩu tài khoản
            </h2>

            {passwordMessage && (
              <div className={`p-4 rounded-xl flex items-center space-x-3 text-sm border ${
                passwordMessage.type === 'success'
                  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                  : 'bg-red-500/10 border-red-500/20 text-red-400'
              }`}>
                {passwordMessage.type === 'success' ? <CheckCircle className="w-5 h-5 shrink-0" /> : <AlertCircle className="w-5 h-5 shrink-0" />}
                <span>{passwordMessage.text}</span>
              </div>
            )}

            <div className="space-y-5">
              {/* Mật khẩu cũ */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 light:text-slate-500 uppercase tracking-wide">
                  Mật khẩu cũ
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="password"
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-950/50 light:bg-slate-50 text-sm rounded-xl border border-slate-800 light:border-slate-250 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 outline-none text-white light:text-slate-900 font-medium transition duration-200"
                    placeholder="Nhập mật khẩu hiện tại của bạn..."
                  />
                </div>
              </div>

              {/* Mật khẩu mới */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 light:text-slate-500 uppercase tracking-wide">
                  Mật khẩu mới
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-950/50 light:bg-slate-50 text-sm rounded-xl border border-slate-800 light:border-slate-250 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 outline-none text-white light:text-slate-900 font-medium transition duration-200"
                    placeholder="Tối thiểu 6 ký tự..."
                  />
                </div>
              </div>

              {/* Xác nhận mật khẩu mới */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 light:text-slate-500 uppercase tracking-wide">
                  Xác nhận mật khẩu mới
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-950/50 light:bg-slate-50 text-sm rounded-xl border border-slate-800 light:border-slate-250 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 outline-none text-white light:text-slate-900 font-medium transition duration-200"
                    placeholder="Nhập lại mật khẩu mới..."
                  />
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800/60 light:border-slate-200 flex justify-end">
              <button
                type="submit"
                disabled={passwordLoading}
                className="px-6 py-2.5 bg-sky-500 hover:bg-sky-600 disabled:bg-sky-500/50 text-white font-bold text-xs rounded-xl transition flex items-center space-x-2 cursor-pointer shadow-lg shadow-sky-500/10"
              >
                {passwordLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>Cập nhật mật khẩu</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default Settings;
