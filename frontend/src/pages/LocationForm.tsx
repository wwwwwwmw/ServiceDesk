import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../contexts/AuthContext';
import { 
  ArrowLeft, 
  MapPin, 
  Loader2, 
  CheckCircle, 
  AlertCircle 
} from 'lucide-react';

interface Location {
  id: string;
  name: string;
}

export const LocationForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;

  const [loading, setLoading] = useState(isEdit);
  const [formLoading, setFormLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form input
  const [name, setName] = useState('');

  useEffect(() => {
    if (isEdit) {
      const fetchLocation = async () => {
        try {
          const response = await api.get<Location[]>('/api/locations');
          const found = response.data.find(loc => loc.id === id);
          if (found) {
            setName(found.name);
          } else {
            setError('Không tìm thấy khu vực làm việc này.');
          }
        } catch (err) {
          console.error('Lỗi khi tải dữ liệu khu vực:', err);
          setError('Không thể kết nối máy chủ để tải thông tin khu vực.');
        } finally {
          setLoading(false);
        }
      };
      fetchLocation();
    }
  }, [id, isEdit]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!name.trim()) {
      setError('Tên khu vực / Tòa nhà không được để trống!');
      return;
    }

    setFormLoading(true);
    try {
      const payload = { name: name.trim() };

      if (!isEdit) {
        const response = await api.post('/api/admin/locations', payload);
        setSuccess(response.data.message || 'Tạo khu vực mới thành công!');
        setName('');
      } else {
        const response = await api.put(`/api/admin/locations/${id}`, payload);
        setSuccess(response.data.message || 'Cập nhật khu vực thành công!');
      }

      setTimeout(() => {
        navigate('/admin/locations');
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
        <span className="ml-3 text-sm text-slate-400">Đang tải dữ liệu khu vực...</span>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto space-y-6">
      {/* Back Header */}
      <div className="flex items-center space-x-4">
        <button
          onClick={() => navigate('/admin/locations')}
          className="p-2 rounded-xl bg-slate-900/60 light:bg-slate-100 hover:bg-slate-800 light:hover:bg-slate-200 border border-slate-800 light:border-slate-300 text-slate-400 light:text-slate-655 hover:text-white light:hover:text-slate-950 transition duration-200 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-white light:text-slate-900 tracking-tight m-0">
            {isEdit ? 'Chỉnh sửa khu vực' : 'Thêm khu vực mới'}
          </h1>
          <p className="text-xs text-slate-400 light:text-slate-500 mt-1">
            Thiết lập tên tòa nhà hoặc chi nhánh làm việc trong hệ thống.
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

          {/* Name */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 light:text-slate-500 uppercase tracking-wider">Tên khu vực / Tòa nhà / Chi nhánh</label>
            <div className="relative">
              <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-950/50 light:bg-slate-50 text-sm rounded-xl border border-slate-800 light:border-slate-250 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 outline-none text-white light:text-slate-900 font-medium transition duration-200"
                placeholder="Ví dụ: Tòa nhà C, Chi nhánh Quận 1"
                disabled={formLoading}
              />
            </div>
          </div>

          {/* Action buttons */}
          <div className="pt-4 border-t border-slate-850 light:border-slate-200 flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => navigate('/admin/locations')}
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

export default LocationForm;
