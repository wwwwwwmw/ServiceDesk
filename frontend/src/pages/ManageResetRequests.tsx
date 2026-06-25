import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../contexts/AuthContext';
import { 
  ArrowLeft, 
  Key, 
  Loader2, 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  CheckSquare, 
  User,
  Search,
  Sparkles
} from 'lucide-react';

interface ResetRequest {
  id: string;
  status: 'pending' | 'completed';
  created_at: string;
  completed_at: string | null;
  user_id: string;
  username: string;
  email: string;
}

export const ManageResetRequests: React.FC = () => {
  const navigate = useNavigate();
  const [requests, setRequests] = useState<ResetRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Modal State
  const [selectedReq, setSelectedReq] = useState<ResetRequest | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [processing, setProcessing] = useState(false);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const response = await api.get<ResetRequest[]>('/api/admin/password-resets');
      setRequests(response.data);
    } catch (err: any) {
      console.error(err);
      setError('Không thể tải danh sách yêu cầu khôi phục mật khẩu.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const generateRandomPassword = () => {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let pass = '';
    // Tạo 4 ký tự ngẫu nhiên
    for (let i = 0; i < 5; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    // Định dạng Desk@12345
    const finalPass = `Desk@${pass}`;
    setNewPassword(finalPass);
  };

  const handleOpenResetModal = (req: ResetRequest) => {
    setSelectedReq(req);
    // Tự sinh mật khẩu mặc định
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    setNewPassword(`Desk@${randomSuffix}`);
    setError(null);
  };

  const handleCloseModal = () => {
    setSelectedReq(null);
    setNewPassword('');
  };

  const handleProcessReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReq || !newPassword.trim()) return;

    setProcessing(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await api.post(`/api/admin/password-resets/${selectedReq.id}/process`, {
        new_password: newPassword.trim()
      });
      setSuccess(response.data.message || 'Đã đặt lại mật khẩu thành công và gửi email thông báo.');
      handleCloseModal();
      fetchRequests();
      setTimeout(() => setSuccess(null), 4000);
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.error || 'Đã xảy ra lỗi trong quá trình đặt lại mật khẩu.');
    } finally {
      setProcessing(false);
    }
  };

  const filteredRequests = requests.filter(
    r =>
      r.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const pendingRequests = filteredRequests.filter(r => r.status === 'pending');
  const completedRequests = filteredRequests.filter(r => r.status === 'completed');

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      
      {/* Navigation header */}
      <div className="flex items-center space-x-2">
        <button 
          onClick={() => navigate('/admin/management')}
          className="p-1.5 rounded-lg bg-slate-900 light:bg-white border border-slate-800 light:border-slate-200 hover:bg-slate-800 light:hover:bg-slate-100 text-slate-400 light:text-slate-500 hover:text-white light:hover:text-slate-900 transition"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <span className="text-xs text-slate-500 light:text-slate-400 font-medium">Quay lại Hub Quản trị</span>
      </div>

      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-850 light:border-slate-200">
        <div className="flex items-center space-x-3">
          <div className="bg-sky-500/10 p-2.5 rounded-xl border border-sky-500/20 text-sky-400">
            <Key className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white light:text-slate-900 m-0">Yêu cầu đổi mật khẩu</h1>
            <p className="text-slate-500 light:text-slate-400 text-xs mt-0.5">Xử lý khôi phục mật khẩu và gửi email tự động cho người dùng</p>
          </div>
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-64">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500 pointer-events-none">
            <Search className="w-3.5 h-3.5" />
          </span>
          <input
            type="text"
            placeholder="Tìm kiếm tài khoản, email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-950/40 light:bg-white border border-slate-800 light:border-slate-250 rounded-xl text-xs text-slate-200 light:text-slate-800 outline-none focus:border-sky-500/50"
          />
        </div>
      </div>

      {/* Notifications */}
      {error && (
        <div className="flex items-start space-x-2.5 bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl text-xs font-semibold">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="flex items-start space-x-2.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-4 rounded-xl text-xs font-semibold">
          <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{success}</span>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 text-sky-500 animate-spin" />
          <span className="ml-3 text-sm text-slate-400">Đang tải danh sách yêu cầu...</span>
        </div>
      ) : (
        <div className="space-y-8">
          
          {/* PENDING REQUESTS */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2 px-1">
              <Clock className="w-4 h-4 text-amber-400" />
              <h2 className="text-sm font-bold text-white light:text-slate-850 uppercase tracking-wider m-0">Yêu cầu chờ xử lý ({pendingRequests.length})</h2>
            </div>
            
            <div className="bg-slate-900/40 light:bg-white border border-slate-800/80 light:border-slate-200 rounded-2xl overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-950/40 light:bg-slate-50 text-[10px] uppercase font-bold tracking-wider text-slate-400 light:text-slate-500 border-b border-slate-800 light:border-slate-200">
                      <th className="p-4">Tài khoản</th>
                      <th className="p-4">Email</th>
                      <th className="p-4">Thời gian gửi</th>
                      <th className="p-4">Trạng thái</th>
                      <th className="p-4 text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-850 light:divide-slate-200">
                    {pendingRequests.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-8 text-center text-xs text-slate-500 font-medium">
                          Không có yêu cầu đặt lại mật khẩu nào đang chờ.
                        </td>
                      </tr>
                    ) : (
                      pendingRequests.map((req) => (
                        <tr key={req.id} className="hover:bg-slate-950/15 light:hover:bg-slate-50/50 transition">
                          <td className="p-4">
                            <div className="flex items-center space-x-2">
                              <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/25 flex items-center justify-center text-amber-400 font-bold text-xs">
                                <User className="w-3.5 h-3.5" />
                              </div>
                              <span className="font-semibold text-slate-200 light:text-slate-800 text-xs">{req.username}</span>
                            </div>
                          </td>
                          <td className="p-4 text-xs font-medium text-slate-350 light:text-slate-655">{req.email}</td>
                          <td className="p-4 text-xs text-slate-450 light:text-slate-500">
                            {new Date(req.created_at).toLocaleString('vi-VN')}
                          </td>
                          <td className="p-4">
                            <span className="inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded border bg-amber-500/10 text-amber-400 border-amber-500/20">
                              Chờ xử lý
                            </span>
                          </td>
                          <td className="p-4 text-right">
                            <button
                              onClick={() => handleOpenResetModal(req)}
                              className="py-1 px-3 bg-sky-500 hover:bg-sky-600 text-white rounded-lg text-xs font-bold transition cursor-pointer shadow-md shadow-sky-500/10"
                            >
                              Đặt lại mật khẩu
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* COMPLETED REQUESTS */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2 px-1">
              <CheckSquare className="w-4 h-4 text-emerald-400" />
              <h2 className="text-sm font-bold text-white light:text-slate-850 uppercase tracking-wider m-0">Yêu cầu đã xử lý ({completedRequests.length})</h2>
            </div>

            <div className="bg-slate-900/40 light:bg-white border border-slate-800/80 light:border-slate-200 rounded-2xl overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-950/40 light:bg-slate-50 text-[10px] uppercase font-bold tracking-wider text-slate-400 light:text-slate-500 border-b border-slate-800 light:border-slate-200">
                      <th className="p-4">Tài khoản</th>
                      <th className="p-4">Email</th>
                      <th className="p-4">Thời gian gửi</th>
                      <th className="p-4">Ngày xử lý</th>
                      <th className="p-4">Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-850 light:divide-slate-200">
                    {completedRequests.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-8 text-center text-xs text-slate-500 font-medium">
                          Chưa có yêu cầu nào được xử lý thành công.
                        </td>
                      </tr>
                    ) : (
                      completedRequests.map((req) => (
                        <tr key={req.id} className="hover:bg-slate-950/15 light:hover:bg-slate-50/50 transition">
                          <td className="p-4">
                            <div className="flex items-center space-x-2">
                              <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-emerald-400 font-bold text-xs">
                                <User className="w-3.5 h-3.5" />
                              </div>
                              <span className="font-semibold text-slate-350 light:text-slate-700 text-xs">{req.username}</span>
                            </div>
                          </td>
                          <td className="p-4 text-xs text-slate-400 light:text-slate-600">{req.email}</td>
                          <td className="p-4 text-xs text-slate-500">
                            {new Date(req.created_at).toLocaleString('vi-VN')}
                          </td>
                          <td className="p-4 text-xs text-slate-500">
                            {req.completed_at ? new Date(req.completed_at).toLocaleString('vi-VN') : 'N/A'}
                          </td>
                          <td className="p-4">
                            <span className="inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded border bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
                              Đã hoàn thành
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

        </div>
      )}

      {/* RESET PASSWORD MODAL */}
      {selectedReq && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            onClick={handleCloseModal}
          />
          {/* Panel */}
          <div className="relative w-full max-w-md bg-slate-900 light:bg-white border border-slate-800 light:border-slate-200 rounded-2xl p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200">
            
            {/* Header */}
            <div className="flex items-center space-x-3 pb-3 border-b border-slate-800 light:border-slate-250">
              <div className="bg-sky-500/10 p-2 rounded-xl text-sky-400">
                <Key className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white light:text-slate-900 m-0">Đặt lại mật khẩu tài khoản</h3>
                <p className="text-[10px] text-slate-500 mt-0.5">Đặt lại cho {selectedReq.username} ({selectedReq.email})</p>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleProcessReset} className="space-y-4">
              
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 light:text-slate-500 uppercase tracking-wider block">Mật khẩu mới</label>
                <div className="flex space-x-2">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Nhập mật khẩu mới..."
                      className="w-full bg-slate-950 light:bg-slate-50 border border-slate-850 light:border-slate-200 rounded-lg p-2 text-xs text-slate-200 light:text-slate-800 outline-none focus:border-sky-500/50"
                      required
                      minLength={6}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={generateRandomPassword}
                    className="p-2 bg-sky-500/10 border border-sky-500/25 hover:bg-sky-500/20 text-sky-400 rounded-lg transition text-xs font-bold flex items-center space-x-1 cursor-pointer"
                    title="Tự động tạo mật khẩu ngẫu nhiên"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Tự tạo</span>
                  </button>
                </div>
                <span className="text-[9px] text-slate-500 block">Mật khẩu này sẽ được lưu và gửi trực tiếp qua mail cho người dùng.</span>
              </div>

              {/* Action buttons */}
              <div className="pt-4 border-t border-slate-800 light:border-slate-200 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="py-1.5 px-4 bg-slate-950 light:bg-slate-100 border border-slate-850 light:border-slate-200 text-slate-400 light:text-slate-600 hover:text-slate-200 rounded-lg text-xs font-semibold cursor-pointer"
                  disabled={processing}
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={processing}
                  className="py-1.5 px-4 bg-sky-500 hover:bg-sky-600 text-white rounded-lg text-xs font-bold transition flex items-center space-x-1 shadow-md shadow-sky-500/10 cursor-pointer"
                >
                  {processing ? (
                    <>
                      <Loader2 className="w-3 h-3 animate-spin mr-1" />
                      Đang xử lý...
                    </>
                  ) : (
                    <span>Xác nhận & Gửi mail</span>
                  )}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
};

export default ManageResetRequests;
