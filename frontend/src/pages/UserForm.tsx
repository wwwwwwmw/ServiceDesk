import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../contexts/AuthContext';
import { 
  ArrowLeft, 
  User as UserIcon, 
  Mail, 
  Lock, 
  MapPin, 
  Loader2, 
  CheckCircle, 
  AlertCircle 
} from 'lucide-react';

interface Location {
  id: string;
  name: string;
}

interface User {
  id: string;
  username: string;
  email: string;
  role: 'admin' | 'manager' | 'employee' | 'user';
  location_id: string | null;
  room?: string | null;
}

export const UserForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;

  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(isEdit);
  const [formLoading, setFormLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form inputs
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'admin' | 'manager' | 'employee' | 'user'>('user');
  const [locationId, setLocationId] = useState('');
  const [room, setRoom] = useState('');

  useEffect(() => {
    const initData = async () => {
      try {
        // Fetch locations
        const locResponse = await api.get<Location[]>('/api/locations');
        setLocations(locResponse.data);

        if (isEdit) {
          // Fetch all users and find the one to edit
          const usersResponse = await api.get<User[]>('/api/admin/users');
          const found = usersResponse.data.find(u => u.id === id);
          if (found) {
            setUsername(found.username);
            setEmail(found.email);
            setRole(found.role);
            setLocationId(found.location_id || '');
            setRoom(found.room || '');
          } else {
            setError('Không tìm thấy người dùng này trong hệ thống.');
          }
        }
      } catch (err) {
        console.error('Lỗi khi tải dữ liệu form:', err);
        setError('Không thể kết nối máy chủ để tải thông tin form.');
      } finally {
        setLoading(false);
      }
    };

    initData();
  }, [id, isEdit]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!username.trim() || !email.trim()) {
      setError('Vui lòng điền đầy đủ Tên tài khoản và Địa chỉ Email!');
      return;
    }

    if (!isEdit && !password) {
      setError('Vui lòng nhập mật khẩu khởi tạo!');
      return;
    }

    setFormLoading(true);
    try {
      const payload = {
        username: username.trim(),
        email: email.trim(),
        role,
        location_id: locationId || null,
        room: room.trim() || null,
        password: password || undefined
      };

      if (!isEdit) {
        const response = await api.post('/api/admin/users', payload);
        setSuccess(response.data.message || 'Tạo tài khoản người dùng thành công!');
        // Reset form
        setUsername('');
        setEmail('');
        setPassword('');
        setRole('user');
        setLocationId('');
        setRoom('');
      } else {
        const response = await api.put(`/api/admin/users/${id}`, payload);
        setSuccess(response.data.message || 'Cập nhật tài khoản người dùng thành công!');
      }

      // Auto redirect back to list page after 1.5s
      setTimeout(() => {
        navigate('/admin/users');
      }, 1500);
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.error || 'Đã xảy ra lỗi khi gửi dữ liệu lên máy chủ.');
    } finally {
      setFormLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <Loader2 className="w-8 h-8 text-sky-500 animate-spin" />
        <span className="ml-3 text-sm text-slate-400">Đang tải dữ liệu người dùng...</span>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Back Header */}
      <div className="flex items-center space-x-4">
        <button
          onClick={() => navigate('/admin/users')}
          className="p-2 rounded-xl bg-slate-900/60 light:bg-slate-100 hover:bg-slate-800 light:hover:bg-slate-200 border border-slate-800 light:border-slate-300 text-slate-400 light:text-slate-655 hover:text-white light:hover:text-slate-950 transition duration-200 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-white light:text-slate-900 tracking-tight m-0">
            {isEdit ? 'Chỉnh sửa tài khoản' : 'Thêm tài khoản mới'}
          </h1>
          <p className="text-xs text-slate-400 light:text-slate-500 mt-1">
            Điền thông tin chi tiết của người dùng và thiết lập khu vực làm việc.
          </p>
        </div>
      </div>

      {/* Form Card */}
      <div className="bg-slate-900/40 light:bg-white border border-slate-800/80 light:border-slate-200 rounded-2xl p-6 shadow-xl relative overflow-hidden transition-colors duration-300">
        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 shrink-0" />
              <span>{success}</span>
            </div>
          )}

          {/* Username */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 light:text-slate-500 uppercase tracking-wider">Tên tài khoản</label>
            <div className="relative">
              <UserIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-950/50 light:bg-slate-50 text-sm rounded-xl border border-slate-800 light:border-slate-250 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 outline-none text-white light:text-slate-900 font-medium transition duration-200"
                placeholder="Ví dụ: nguyenvanan"
                disabled={formLoading}
              />
            </div>
          </div>

          {/* Email */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 light:text-slate-500 uppercase tracking-wider">Địa chỉ Email</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-950/50 light:bg-slate-50 text-sm rounded-xl border border-slate-800 light:border-slate-250 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 outline-none text-white light:text-slate-900 font-medium transition duration-200"
                placeholder="Ví dụ: an.nv@company.com"
                disabled={formLoading}
              />
            </div>
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 light:text-slate-500 uppercase tracking-wider">
              Mật khẩu {isEdit && '(Chỉ nhập nếu muốn cập nhật mới)'}
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-950/50 light:bg-slate-50 text-sm rounded-xl border border-slate-800 light:border-slate-250 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 outline-none text-white light:text-slate-900 font-medium transition duration-200"
                placeholder={isEdit ? 'Để trống để giữ nguyên mật khẩu cũ...' : 'Nhập mật khẩu khởi tạo (tối thiểu 6 ký tự)...'}
                disabled={formLoading}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Role */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 light:text-slate-500 uppercase tracking-wider">Vai trò hệ thống</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as any)}
                className="w-full px-4 py-2.5 bg-slate-950/50 light:bg-slate-50 text-sm rounded-xl border border-slate-800 light:border-slate-250 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 outline-none text-white light:text-slate-900 font-medium transition duration-200 cursor-pointer"
                disabled={formLoading}
              >
                <option value="user" className="bg-slate-900 light:bg-white">User (Người dùng)</option>
                <option value="employee" className="bg-slate-900 light:bg-white">Employee (Kỹ thuật viên)</option>
                <option value="manager" className="bg-slate-900 light:bg-white">Manager (Quản lý)</option>
                <option value="admin" className="bg-slate-900 light:bg-white">Admin (Quản trị viên)</option>
              </select>
            </div>

            {/* Location */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 light:text-slate-500 uppercase tracking-wider">Khu vực làm việc</label>
              <div className="relative">
                <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <select
                  value={locationId}
                  onChange={(e) => setLocationId(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-950/50 light:bg-slate-50 text-sm rounded-xl border border-slate-800 light:border-slate-250 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 outline-none text-white light:text-slate-900 font-medium transition duration-200 cursor-pointer appearance-none"
                  disabled={formLoading}
                >
                  <option value="" className="bg-slate-900 light:bg-white text-slate-450">Chưa gán khu vực</option>
                  {locations.map((loc) => (
                    <option key={loc.id} value={loc.id} className="bg-slate-900 light:bg-white">{loc.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Room */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 light:text-slate-500 uppercase tracking-wider">Phòng làm việc mặc định</label>
              <input
                type="text"
                value={room}
                onChange={(e) => setRoom(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-950/50 light:bg-slate-50 text-sm rounded-xl border border-slate-800 light:border-slate-250 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 outline-none text-white light:text-slate-900 font-medium transition duration-200"
                placeholder="Ví dụ: Phòng 201, 305..."
                disabled={formLoading}
              />
            </div>
          </div>

          {/* Action buttons */}
          <div className="pt-4 border-t border-slate-850 light:border-slate-200 flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => navigate('/admin/users')}
              className="px-4.5 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white light:hover:text-slate-950 hover:bg-slate-800/40 light:hover:bg-slate-100 transition cursor-pointer border border-slate-800 light:border-slate-200"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              disabled={formLoading}
              className="px-5 py-2 bg-sky-500 hover:bg-sky-600 disabled:bg-sky-500/50 text-white font-bold text-xs rounded-xl transition flex items-center space-x-1.5 cursor-pointer shadow-lg shadow-sky-500/10"
            >
              {formLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>Lưu thay đổi</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UserForm;
