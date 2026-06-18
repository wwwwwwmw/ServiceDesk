import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../contexts/AuthContext';
import { 
  ArrowLeft, 
  Sliders, 
  Loader2, 
  CheckCircle, 
  AlertCircle 
} from 'lucide-react';

interface FormField {
  name: string;
  label: string;
  type: 'text' | 'textarea' | 'dropdown';
  required: boolean;
  placeholder?: string;
  options?: string[];
}

interface Category {
  id: string;
  name: string;
  type: 'request' | 'incident';
  template_json: FormField[] | string;
}

interface PrefilledData {
  priority: 'low' | 'medium' | 'high' | 'critical';
  dynamic_data: Record<string, any>;
}

interface ServiceTemplate {
  id: string;
  title: string;
  category_id: string;
  description: string;
  prefilled_data: PrefilledData | string;
}

export const TemplateForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;

  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [formLoading, setFormLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form states
  const [title, setTitle] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high' | 'critical'>('low');
  const [dynamicPrefill, setDynamicPrefill] = useState<Record<string, any>>({});

  useEffect(() => {
    const initData = async () => {
      try {
        const catRes = await api.get<Category[]>('/api/categories?type=request');
        setCategories(catRes.data);

        if (isEdit) {
          const tplRes = await api.get<ServiceTemplate[]>('/api/service-templates');
          const found = tplRes.data.find(t => t.id === id);
          if (found) {
            setTitle(found.title);
            setCategoryId(found.category_id);
            setDescription(found.description || '');

            let parsedPrefill: PrefilledData = { priority: 'low', dynamic_data: {} };
            try {
              parsedPrefill = typeof found.prefilled_data === 'string'
                ? JSON.parse(found.prefilled_data)
                : found.prefilled_data || { priority: 'low', dynamic_data: {} };
            } catch (e) {}

            setPriority(parsedPrefill.priority || 'low');
            setDynamicPrefill(parsedPrefill.dynamic_data || {});
          } else {
            setError('Không tìm thấy mẫu điền sẵn này.');
          }
        } else if (catRes.data.length > 0) {
          setCategoryId(catRes.data[0].id);
        }
      } catch (err) {
        console.error('Lỗi khi tải dữ liệu form template:', err);
        setError('Không thể kết nối máy chủ để tải dữ liệu form.');
      } finally {
        setLoading(false);
      }
    };
    initData();
  }, [id, isEdit]);

  // Find dynamic fields config of currently selected category
  const getSelectedCategoryFields = (): FormField[] => {
    const cat = categories.find(c => c.id === categoryId);
    if (!cat) return [];
    try {
      return typeof cat.template_json === 'string' 
        ? JSON.parse(cat.template_json) 
        : cat.template_json || [];
    } catch (e) {
      return [];
    }
  };

  // Reset/sync dynamic prefill keys when category changes
  useEffect(() => {
    if (!loading) {
      const fields = getSelectedCategoryFields();
      const initial: Record<string, any> = {};
      fields.forEach(f => {
        initial[f.name] = dynamicPrefill[f.name] !== undefined ? dynamicPrefill[f.name] : '';
      });
      setDynamicPrefill(initial);
    }
  }, [categoryId, loading]);

  const handleDynamicChange = (fieldName: string, value: any) => {
    setDynamicPrefill(prev => ({
      ...prev,
      [fieldName]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!title.trim() || !categoryId) {
      setError('Vui lòng nhập tiêu đề mẫu và chọn danh mục dịch vụ!');
      return;
    }

    setFormLoading(true);
    try {
      const payload = {
        title: title.trim(),
        category_id: categoryId,
        description: description.trim(),
        prefilled_data: {
          priority,
          dynamic_data: dynamicPrefill
        }
      };

      if (!isEdit) {
        const response = await api.post('/api/admin/service-templates', payload);
        setSuccess(response.data.message || 'Tạo mẫu điền sẵn thành công!');
        setTitle('');
        setDescription('');
        setPriority('low');
        setDynamicPrefill({});
      } else {
        const response = await api.put(`/api/admin/service-templates/${id}`, payload);
        setSuccess(response.data.message || 'Cập nhật mẫu điền sẵn thành công!');
      }

      setTimeout(() => {
        navigate('/admin/templates');
      }, 1500);
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.error || 'Đã xảy ra lỗi khi lưu thông tin mẫu.');
    } finally {
      setFormLoading(false);
    }
  };

  const currentCategoryFields = getSelectedCategoryFields();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <Loader2 className="w-8 h-8 text-sky-500 animate-spin" />
        <span className="ml-3 text-sm text-slate-400">Đang tải biểu mẫu...</span>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Back Header */}
      <div className="flex items-center space-x-4">
        <button
          onClick={() => navigate('/admin/templates')}
          className="p-2 rounded-xl bg-slate-900/60 light:bg-slate-100 hover:bg-slate-800 light:hover:bg-slate-200 border border-slate-800 light:border-slate-300 text-slate-400 light:text-slate-655 hover:text-white light:hover:text-slate-950 transition duration-200 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-white light:text-slate-900 tracking-tight m-0">
            {isEdit ? 'Chỉnh sửa mẫu điền sẵn' : 'Tạo mẫu điền sẵn mới'}
          </h1>
          <p className="text-xs text-slate-400 light:text-slate-500 mt-1">
            Mẫu điền sẵn giúp người dùng tự động điền các thông tin cơ bản khi tạo yêu cầu dịch vụ.
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

          {/* Title */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 light:text-slate-500 uppercase tracking-wider">Tiêu đề mẫu điền sẵn</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-950/50 light:bg-slate-50 text-sm rounded-xl border border-slate-800 light:border-slate-250 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 outline-none text-white light:text-slate-900 font-medium transition duration-200"
              placeholder="Ví dụ: Đăng ký Office 365 Pro, Cấp màn hình Dell 27 inch"
              disabled={formLoading}
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 light:text-slate-500 uppercase tracking-wider">Mô tả ngắn</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="w-full px-4 py-2.5 bg-slate-950/50 light:bg-slate-50 text-sm rounded-xl border border-slate-800 light:border-slate-250 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 outline-none text-white light:text-slate-900 font-medium transition duration-200 resize-none"
              placeholder="Mô tả công dụng hoặc phạm vi áp dụng mẫu dịch vụ..."
              disabled={formLoading}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Category selection */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 light:text-slate-500 uppercase tracking-wider">Danh mục dịch vụ liên kết</label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-950/50 light:bg-slate-50 text-sm rounded-xl border border-slate-800 light:border-slate-250 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 outline-none text-white light:text-slate-900 font-medium transition duration-200 cursor-pointer"
                disabled={formLoading}
              >
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id} className="bg-slate-900 light:bg-white">{cat.name}</option>
                ))}
              </select>
            </div>

            {/* Default Priority */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 light:text-slate-500 uppercase tracking-wider">Mức độ ưu tiên mặc định</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as any)}
                className="w-full px-4 py-2.5 bg-slate-950/50 light:bg-slate-50 text-sm rounded-xl border border-slate-800 light:border-slate-250 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 outline-none text-white light:text-slate-900 font-medium transition duration-200 cursor-pointer"
                disabled={formLoading}
              >
                <option value="low" className="bg-slate-900 light:bg-white">Thấp (Low)</option>
                <option value="medium" className="bg-slate-900 light:bg-white">Trung bình (Medium)</option>
                <option value="high" className="bg-slate-900 light:bg-white">Cao (High)</option>
                <option value="critical" className="bg-slate-900 light:bg-white">Khẩn cấp (Critical)</option>
              </select>
            </div>
          </div>

          {/* Prefilled Fields Dynamic list */}
          <div className="space-y-4 pt-4 border-t border-slate-850 light:border-slate-200">
            <h4 className="text-xs font-bold text-sky-400 uppercase tracking-wider m-0 flex items-center">
              <Sliders className="w-4 h-4 mr-2" />
              Điền sẵn các trường thông tin động
            </h4>

            {currentCategoryFields.length === 0 ? (
              <div className="p-4 bg-slate-950/20 light:bg-slate-50 border border-slate-850 light:border-slate-200 rounded-xl text-center text-xs text-slate-500">
                Danh mục dịch vụ này hiện không có trường động nào.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {currentCategoryFields.map((f) => (
                  <div key={f.name} className="space-y-1">
                    <label className="text-[10px] text-slate-350 light:text-slate-800 font-bold uppercase tracking-wider flex items-center justify-between">
                      <span>{f.label}</span>
                      <span className="text-[8px] text-slate-500 font-mono font-normal">({f.name})</span>
                    </label>

                    {f.type === 'text' && (
                      <input
                        type="text"
                        value={dynamicPrefill[f.name] || ''}
                        onChange={(e) => handleDynamicChange(f.name, e.target.value)}
                        className="w-full px-3 py-2 bg-slate-950/50 light:bg-slate-50 text-xs rounded-lg border border-slate-850 light:border-slate-250 text-white light:text-slate-900 outline-none focus:border-sky-500 font-medium"
                        placeholder={f.placeholder || 'Dữ liệu điền sẵn...'}
                        disabled={formLoading}
                      />
                    )}

                    {f.type === 'textarea' && (
                      <textarea
                        value={dynamicPrefill[f.name] || ''}
                        onChange={(e) => handleDynamicChange(f.name, e.target.value)}
                        rows={3}
                        className="w-full px-3 py-2 bg-slate-950/50 light:bg-slate-50 text-xs rounded-lg border border-slate-850 light:border-slate-250 text-white light:text-slate-900 outline-none focus:border-sky-500 font-medium resize-none"
                        placeholder={f.placeholder || 'Nội dung điền sẵn...'}
                        disabled={formLoading}
                      />
                    )}

                    {f.type === 'dropdown' && (
                      <select
                        value={dynamicPrefill[f.name] || ''}
                        onChange={(e) => handleDynamicChange(f.name, e.target.value)}
                        className="w-full px-3 py-2 bg-slate-950/50 light:bg-slate-50 text-xs rounded-lg border border-slate-850 light:border-slate-250 text-white light:text-slate-900 outline-none cursor-pointer font-medium"
                        disabled={formLoading}
                      >
                        <option value="" className="bg-slate-900 light:bg-white text-slate-500">-- Để trống --</option>
                        {f.options?.map((opt, oIdx) => (
                          <option key={oIdx} value={opt} className="bg-slate-900 light:bg-white">{opt}</option>
                        ))}
                      </select>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="pt-4 border-t border-slate-850 light:border-slate-200 flex justify-end space-x-3 mt-4">
            <button
              type="button"
              onClick={() => navigate('/admin/templates')}
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

export default TemplateForm;
