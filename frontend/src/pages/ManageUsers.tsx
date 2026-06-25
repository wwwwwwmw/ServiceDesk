import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, useAuth } from '../contexts/AuthContext';
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Loader2, 
  ShieldAlert, 
  MapPin, 
  CheckCircle,
  ArrowLeft
} from 'lucide-react';

interface User {
  id: string;
  username: string;
  email: string;
  role: 'admin' | 'manager' | 'employee' | 'user';
  location_id: string | null;
  location_name?: string;
  room?: string | null;
  created_at: string;
}

export const ManageUsers: React.FC = () => {
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Delete confirm state
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Load data
  const fetchData = async () => {
    setLoading(true);
    try {
      const usersRes = await api.get<User[]>('/api/admin/users');
      setUsers(usersRes.data);
      setError(null);
    } catch (err) {
      console.error('Lỗi khi tải dữ liệu người dùng:', err);
      setError('Không thể kết nối máy chủ để lấy thông tin.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenDeleteConfirm = (user: User) => {
    if (user.id === currentUser?.id) {
      alert('Bạn không thể tự xóa chính tài khoản Admin của mình!');
      return;
    }
    setUserToDelete(user);
    setDeleteConfirmOpen(true);
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    setDeleteLoading(true);
    try {
      const response = await api.delete(`/api/admin/users/${userToDelete.id}`);
      setSuccessMessage(response.data.message || 'Xóa tài khoản thành công!');
      setDeleteConfirmOpen(false);
      setUserToDelete(null);
      fetchData();
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.error || 'Lỗi khi xóa người dùng.');
    } finally {
      setDeleteLoading(false);
    }
  };

  const filteredUsers = users.filter(
    (u) =>
      u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return <span className="inline-block text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-red-500/10 text-red-400 border border-red-500/25">Admin</span>;
      case 'manager':
        return <span className="inline-block text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/25">Manager</span>;
      case 'employee':
        return <span className="inline-block text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/25">IT Staff</span>;
      default:
        return <span className="inline-block text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-sky-500/10 text-sky-400 border border-sky-500/25">User</span>;
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Back Button */}
      <button
        onClick={() => navigate('/admin/management')}
        className="flex items-center space-x-1.5 text-xs font-bold text-slate-400 hover:text-white light:hover:text-slate-800 transition duration-200 cursor-pointer border-none bg-transparent p-0"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Quay lại trang quản trị</span>
      </button>

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white light:text-slate-900 tracking-tight m-0">Quản lý người dùng</h1>
          <p className="text-sm text-slate-400 light:text-slate-500 mt-2">
            Xem danh sách, chỉnh sửa thông tin hoặc thêm mới tài khoản hệ thống.
          </p>
        </div>
        <button
          onClick={() => navigate('/admin/users/create')}
          className="flex items-center space-x-2 px-4 py-2.5 bg-sky-500 hover:bg-sky-600 text-white font-bold text-xs rounded-xl transition cursor-pointer shadow-lg shadow-sky-500/15"
        >
          <Plus className="w-4 h-4" />
          <span>Thêm người dùng</span>
        </button>
      </div>

      {successMessage && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm flex items-center space-x-2">
          <CheckCircle className="w-4 h-4" />
          <span>{successMessage}</span>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Control bar */}
      <div className="flex items-center bg-slate-900/40 light:bg-white border border-slate-800/80 light:border-slate-200 rounded-xl px-4 py-2.5 transition-colors duration-300">
        <Search className="w-4 h-4 text-slate-500 mr-3" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Tìm kiếm người dùng theo tên tài khoản hoặc email..."
          className="bg-transparent border-none outline-none text-slate-100 light:text-slate-900 text-sm w-full font-medium placeholder-slate-500"
        />
      </div>

      {/* Table view */}
      {loading ? (
        <div className="flex items-center justify-center min-h-[300px]">
          <Loader2 className="w-8 h-8 text-sky-500 animate-spin" />
          <span className="ml-3 text-sm text-slate-400">Đang tải danh sách người dùng...</span>
        </div>
      ) : (
        <div className="bg-slate-900/40 light:bg-white border border-slate-800/80 light:border-slate-200 rounded-2xl overflow-hidden shadow-lg transition-colors duration-300">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-850 light:border-slate-200 bg-slate-950/20 light:bg-slate-50">
                  <th className="p-4 text-xs font-bold text-slate-400 light:text-slate-500 uppercase tracking-wide">Người dùng</th>
                  <th className="p-4 text-xs font-bold text-slate-400 light:text-slate-500 uppercase tracking-wide">Email</th>
                  <th className="p-4 text-xs font-bold text-slate-400 light:text-slate-500 uppercase tracking-wide">Vai trò</th>
                  <th className="p-4 text-xs font-bold text-slate-400 light:text-slate-500 uppercase tracking-wide">Khu vực</th>
                  <th className="p-4 text-xs font-bold text-slate-400 light:text-slate-500 uppercase tracking-wide">Phòng</th>
                  <th className="p-4 text-xs font-bold text-slate-400 light:text-slate-500 uppercase tracking-wide">Ngày tạo</th>
                  <th className="p-4 text-xs font-bold text-slate-400 light:text-slate-500 uppercase tracking-wide text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850 light:divide-slate-200">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-sm text-slate-500">
                      Không tìm thấy người dùng nào phù hợp.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-950/10 light:hover:bg-slate-50/50 transition">
                      <td className="p-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-9 h-9 rounded-xl bg-sky-500/10 border border-sky-500/25 flex items-center justify-center text-sky-400 font-bold uppercase text-sm">
                            {u.username.slice(0, 2)}
                          </div>
                          <div>
                            <span className="font-semibold text-slate-200 light:text-slate-800 block text-sm">{u.username}</span>
                            <span className="text-[10px] text-slate-500 font-mono block">{u.id.split('-')[0]}</span>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-sm font-medium text-slate-300 light:text-slate-700">{u.email}</td>
                      <td className="p-4">{getRoleBadge(u.role)}</td>
                      <td className="p-4">
                        {u.location_name ? (
                          <span className="flex items-center text-xs text-slate-300 light:text-slate-700">
                            <MapPin className="w-3.5 h-3.5 mr-1 text-slate-500" />
                            {u.location_name}
                          </span>
                        ) : (
                          <span className="text-xs text-slate-500 font-medium">Chưa gán</span>
                        )}
                      </td>
                      <td className="p-4 text-xs text-slate-300 light:text-slate-700 font-medium">
                        {u.room || '-'}
                      </td>
                      <td className="p-4 text-xs text-slate-400 light:text-slate-500">
                        {u.created_at ? new Date(u.created_at).toLocaleDateString('vi-VN') : '-'}
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => navigate(`/admin/users/edit/${u.id}`)}
                            className="p-2 bg-sky-500/10 border border-sky-500/20 hover:bg-sky-500/25 hover:border-sky-500/30 text-sky-400 rounded-lg transition cursor-pointer"
                            title="Sửa"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleOpenDeleteConfirm(u)}
                            className={`p-2 rounded-lg transition cursor-pointer ${
                              u.id === currentUser?.id
                                ? 'bg-slate-800 border border-slate-700 text-slate-605 cursor-not-allowed text-slate-500'
                                : 'bg-red-500/10 border border-red-500/20 hover:bg-red-500/25 hover:border-red-500/30 text-red-400'
                            }`}
                            disabled={u.id === currentUser?.id}
                            title={u.id === currentUser?.id ? 'Không thể xóa bản thân' : 'Xóa'}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900/90 light:bg-white border border-slate-800 light:border-slate-200 rounded-2xl overflow-hidden shadow-2xl transition duration-300">
            <div className="p-6 text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/25 flex items-center justify-center text-red-400 mx-auto">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white light:text-slate-900 m-0">Xác nhận xóa tài khoản?</h3>
                <p className="text-xs text-slate-400 light:text-slate-500 mt-2 leading-relaxed">
                  Bạn có chắc chắn muốn xóa tài khoản người dùng <span className="font-semibold text-slate-200 light:text-slate-900">{userToDelete?.username}</span>?
                  Hành động này không thể hoàn tác và toàn bộ lịch sử sẽ bị ảnh hưởng.
                </p>
              </div>
              <div className="flex justify-center space-x-3 pt-2">
                <button
                  onClick={() => setDeleteConfirmOpen(false)}
                  className="px-4.5 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white light:hover:text-slate-950 hover:bg-slate-800/40 light:hover:bg-slate-100 transition cursor-pointer border border-slate-850 light:border-slate-200"
                >
                  Không, giữ lại
                </button>
                <button
                  onClick={handleDeleteUser}
                  disabled={deleteLoading}
                  className="px-5 py-2 bg-red-500 hover:bg-red-600 disabled:bg-red-500/50 text-white font-bold text-xs rounded-xl transition flex items-center space-x-1.5 cursor-pointer shadow-lg shadow-red-500/10"
                >
                  {deleteLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Đồng ý xóa</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageUsers;
