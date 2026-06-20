import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../contexts/AuthContext';
import { 
  ArrowLeft, 
  Plus, 
  Trash2, 
  Loader2, 
  CheckCircle, 
  AlertCircle,
  Eye
} from 'lucide-react';

interface FormField {
  name: string;
  label: string;
  type: 'text' | 'textarea' | 'dropdown';
  required: boolean;
  placeholder?: string;
  options?: string[];
  _rawOptions?: string;
}

interface Category {
  id: string;
  name: string;
  type: 'request' | 'incident';
  template_json: FormField[] | string;
}

export const CategoryForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;

  const [loading, setLoading] = useState(isEdit);
  const [formLoading, setFormLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [type, setType] = useState<'request' | 'incident'>('request');
  const [fields, setFields] = useState<FormField[]>([]);

  useEffect(() => {
    if (isEdit) {
      const fetchCategory = async () => {
        try {
          const response = await api.get<Category[]>('/api/categories');
          const found = response.data.find(c => c.id === id);
          if (found) {
            setName(found.name);
            setType(found.type);
            
            let parsedFields: FormField[] = [];
            try {
              parsedFields = typeof found.template_json === 'string' 
                ? JSON.parse(found.template_json) 
                : found.template_json || [];
            } catch (e) {
              console.error(e);
            }
            setFields(parsedFields);
          } else {
            setError('Không tìm thấy danh mục này.');
          }
        } catch (err) {
          console.error('Lỗi khi tải danh mục:', err);
          setError('Không thể kết nối máy chủ để tải thông tin danh mục.');
        } finally {
          setLoading(false);
        }
      };
      fetchCategory();
    }
  }, [id, isEdit]);

  // Add custom field to builder
  const handleAddField = () => {
    const newField: FormField = {
      name: `field_${Date.now()}`,
      label: 'Trường dữ liệu mới',
      type: 'text',
      required: false,
      placeholder: ''
    };
    setFields([...fields, newField]);
  };

  // Update field property
  const handleUpdateField = (index: number, updatedField: FormField) => {
    const updated = [...fields];
    updated[index] = updatedField;
    setFields(updated);
  };

  // Remove field
  const handleRemoveField = (index: number) => {
    const updated = [...fields];
    updated.splice(index, 1);
    setFields(updated);
  };

  // Generate slug-name from label
  const handleLabelBlur = (index: number, labelVal: string) => {
    const currentName = fields[index].name;
    if (currentName.startsWith('field_')) {
      const cleanName = labelVal
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, '')
        .replace(/\s+/g, '_')
        .trim();
      
      handleUpdateField(index, {
        ...fields[index],
        name: cleanName || `field_${index + 1}`
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!name.trim()) {
      setError('Vui lòng điền tên danh mục!');
      return;
    }

    // Validate fields
    for (let i = 0; i < fields.length; i++) {
      if (!fields[i].label.trim() || !fields[i].name.trim()) {
        setError(`Cấu hình trường số ${i + 1} không được để trống tiêu đề hoặc mã trường.`);
        return;
      }
      if (fields[i].type === 'dropdown' && (!fields[i].options || fields[i].options?.length === 0)) {
        setError(`Trường "${fields[i].label}" chọn kiểu dropdown nhưng chưa nhập các tùy chọn.`);
        return;
      }
    }

    setFormLoading(true);
    try {
      const cleanedFields = fields.map(f => {
        const { _rawOptions, ...rest } = f;
        return rest;
      });

      const payload = {
        name: name.trim(),
        type,
        template_json: cleanedFields
      };

      if (!isEdit) {
        const response = await api.post('/api/categories', payload);
        setSuccess(response.data.message || 'Tạo danh mục mới thành công!');
        setName('');
        setFields([]);
      } else {
        const response = await api.put(`/api/admin/categories/${id}`, payload);
        setSuccess(response.data.message || 'Cập nhật danh mục thành công!');
      }

      setTimeout(() => {
        navigate('/admin/categories');
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
        <span className="ml-3 text-sm text-slate-400">Đang tải dữ liệu danh mục...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto h-[85vh] flex flex-col">
      {/* Back Header */}
      <div className="flex items-center space-x-4 shrink-0">
        <button
          onClick={() => navigate('/admin/categories')}
          className="p-2 rounded-xl bg-slate-900/60 light:bg-slate-100 hover:bg-slate-800 light:hover:bg-slate-200 border border-slate-800 light:border-slate-300 text-slate-400 light:text-slate-655 hover:text-white light:hover:text-slate-950 transition duration-200 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-white light:text-slate-900 tracking-tight m-0">
            {isEdit ? 'Thiết kế biểu mẫu danh mục' : 'Tạo danh mục biểu mẫu mới'}
          </h1>
          <p className="text-xs text-slate-400 light:text-slate-500 mt-1">
            Định cấu hình các ô nhập liệu động (Form Schema) mà người dùng sẽ điền khi tạo ticket.
          </p>
        </div>
      </div>

      {/* Main Dual Panel layout */}
      <div className="flex-1 flex flex-col md:flex-row gap-6 min-h-0 overflow-hidden">
        {/* Left Panel: Builder Form */}
        <div className="flex-1 bg-slate-900/40 light:bg-white border border-slate-800/80 light:border-slate-200 rounded-2xl p-6 shadow-xl flex flex-col overflow-y-auto">
          <form onSubmit={handleSubmit} className="space-y-6 flex-1 flex flex-col justify-between">
            <div className="space-y-5">
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

              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 light:text-slate-600 uppercase tracking-wider">Tên danh mục</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-950/50 light:bg-slate-50 text-sm rounded-xl border border-slate-800 light:border-slate-250 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 outline-none text-white light:text-slate-900 font-medium transition duration-200"
                    placeholder="Ví dụ: Đăng ký Office, Lỗi kẹt giấy..."
                    disabled={formLoading}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 light:text-slate-600 uppercase tracking-wider">Phân loại biểu mẫu</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as any)}
                    className="w-full px-4 py-2.5 bg-slate-950/50 light:bg-slate-50 text-sm rounded-xl border border-slate-800 light:border-slate-250 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 outline-none text-white light:text-slate-900 font-medium transition duration-200 cursor-pointer"
                    disabled={formLoading}
                  >
                    <option value="request" className="bg-slate-900 light:bg-white text-white light:text-slate-900">Yêu cầu dịch vụ (Request)</option>
                    <option value="incident" className="bg-slate-900 light:bg-white text-white light:text-slate-900">Báo cáo sự cố (Incident)</option>
                  </select>
                </div>
              </div>

              {/* Form fields editor list */}
              <div className="space-y-4 pt-4 border-t border-slate-850 light:border-slate-200">
                <div className="flex justify-between items-center">
                  <h4 className="text-xs font-bold text-white light:text-slate-800 uppercase tracking-wider m-0">Các trường thông tin động</h4>
                  <button
                    type="button"
                    onClick={handleAddField}
                    className="flex items-center space-x-1.5 px-3 py-1.5 bg-sky-500 hover:bg-sky-600 text-white text-[11px] font-bold rounded-lg transition cursor-pointer"
                    disabled={formLoading}
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Thêm trường mới</span>
                  </button>
                </div>

                {fields.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-500 border border-dashed border-slate-800 light:border-slate-350 rounded-xl">
                    Biểu mẫu hiện chưa có trường động nào. Hãy bấm nút phía trên để bắt đầu thêm.
                  </div>
                ) : (
                  <div className="space-y-4 max-h-[35vh] overflow-y-auto pr-1">
                    {fields.map((f, index) => (
                      <div 
                        key={f.name + '_' + index}
                        className="p-4 bg-slate-950/40 light:bg-slate-50 border border-slate-850 light:border-slate-200 rounded-xl space-y-3 relative"
                      >
                        {/* Remove button */}
                        <button
                          type="button"
                          onClick={() => handleRemoveField(index)}
                          className="absolute top-2.5 right-2.5 p-1 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <label className="text-[9px] text-slate-400 light:text-slate-600 font-bold uppercase tracking-wide">Nhãn hiển thị (Label)</label>
                            <input
                              type="text"
                              value={f.label}
                              onChange={(e) => handleUpdateField(index, { ...f, label: e.target.value })}
                              onBlur={(e) => handleLabelBlur(index, e.target.value)}
                              className="w-full px-3 py-1.5 bg-slate-950 light:bg-white text-xs rounded-lg border border-slate-850 light:border-slate-200 text-white light:text-slate-900 outline-none focus:border-sky-500 font-medium"
                              placeholder="Ví dụ: Mã thiết bị"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[9px] text-slate-400 light:text-slate-600 font-bold uppercase tracking-wide">Mã trường (Name - viết liền không dấu)</label>
                            <input
                              type="text"
                              value={f.name}
                              onChange={(e) => handleUpdateField(index, { ...f, name: e.target.value })}
                              className="w-full px-3 py-1.5 bg-slate-950 light:bg-white text-xs rounded-lg border border-slate-850 light:border-slate-200 text-white light:text-slate-900 outline-none focus:border-sky-500 font-mono"
                              placeholder="Ví dụ: device_tag"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
                          <div className="space-y-1">
                            <label className="text-[9px] text-slate-400 light:text-slate-600 font-bold uppercase tracking-wide">Kiểu nhập</label>
                            <select
                              value={f.type}
                              onChange={(e) => handleUpdateField(index, { 
                                ...f, 
                                type: e.target.value as any, 
                                options: e.target.value === 'dropdown' ? [] : undefined,
                                _rawOptions: undefined
                              })}
                              className="w-full px-3 py-1.5 bg-slate-950 light:bg-white text-xs rounded-lg border border-slate-850 light:border-slate-200 text-white light:text-slate-900 outline-none cursor-pointer"
                            >
                              <option value="text">Dòng văn bản ngắn (Text)</option>
                              <option value="textarea">Văn bản nhiều dòng (Textarea)</option>
                              <option value="dropdown">Hộp chọn danh sách (Dropdown)</option>
                            </select>
                          </div>

                          <div className="space-y-1 sm:col-span-2">
                            {f.type === 'dropdown' ? (
                              <>
                                <label className="text-[9px] text-slate-400 light:text-slate-600 font-bold uppercase tracking-wide">Các tùy chọn (cách nhau bằng dấu phẩy)</label>
                                <input
                                  type="text"
                                  value={f._rawOptions !== undefined ? f._rawOptions : (f.options?.join(', ') || '')}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    handleUpdateField(index, { 
                                      ...f, 
                                      _rawOptions: val,
                                      options: val.split(',').map(item => item.trim()).filter(Boolean) 
                                    });
                                  }}
                                  className="w-full px-3 py-1.5 bg-slate-950 light:bg-white text-xs rounded-lg border border-slate-850 light:border-slate-200 text-white light:text-slate-900 outline-none focus:border-sky-500 font-medium"
                                  placeholder="Ví dụ: Đỏ, Xanh, Vàng"
                                />
                              </>
                            ) : (
                              <>
                                <label className="text-[9px] text-slate-400 light:text-slate-600 font-bold uppercase tracking-wide">Chữ gợi ý mờ (Placeholder)</label>
                                <input
                                  type="text"
                                  value={f.placeholder || ''}
                                  onChange={(e) => handleUpdateField(index, { ...f, placeholder: e.target.value })}
                                  className="w-full px-3 py-1.5 bg-slate-950 light:bg-white text-xs rounded-lg border border-slate-850 light:border-slate-200 text-white light:text-slate-900 outline-none focus:border-sky-500 font-medium"
                                  placeholder="Gợi ý người dùng điền..."
                                />
                              </>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center space-x-2 pt-1">
                          <input
                            type="checkbox"
                            id={`req_${index}`}
                            checked={f.required}
                            onChange={(e) => handleUpdateField(index, { ...f, required: e.target.checked })}
                            className="w-3.5 h-3.5 accent-sky-500 rounded cursor-pointer"
                          />
                          <label htmlFor={`req_${index}`} className="text-[10px] text-slate-300 light:text-slate-700 font-semibold cursor-pointer select-none">
                            Bắt buộc điền trường này khi gửi
                          </label>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Action buttons */}
            <div className="pt-4 border-t border-slate-850 light:border-slate-200 flex justify-end space-x-3 mt-4 shrink-0">
              <button
                type="button"
                onClick={() => navigate('/admin/categories')}
                className="px-4.5 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white light:hover:text-slate-950 hover:bg-slate-800/40 light:hover:bg-slate-100 transition cursor-pointer border border-slate-805 light:border-slate-200"
              >
                Hủy bỏ
              </button>
              <button
                type="submit"
                disabled={formLoading}
                className="px-5 py-2 bg-sky-500 hover:bg-sky-600 disabled:bg-sky-500/50 text-white font-bold text-xs rounded-xl transition flex items-center space-x-1.5 cursor-pointer shadow-lg shadow-sky-500/10"
              >
                {formLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Lưu biểu mẫu</span>
              </button>
            </div>
          </form>
        </div>

        {/* Right Panel: Live Preview Panel */}
        <div className="w-full md:w-[380px] bg-slate-900/40 light:bg-slate-50/50 border border-slate-800/80 light:border-slate-200 rounded-2xl p-6 shadow-xl flex flex-col overflow-y-auto">
          <div className="flex items-center space-x-2 text-xs font-bold text-slate-400 light:text-slate-500 uppercase tracking-wider mb-4 border-b border-slate-850 light:border-slate-200 pb-3 shrink-0">
            <Eye className="w-4 h-4 text-sky-400" />
            <span>XEM TRƯỚC GIAO DIỆN BIỂU MẪU</span>
          </div>

          <div className="bg-slate-950/40 light:bg-white border border-slate-850 light:border-slate-150 rounded-xl p-5 shadow-inner space-y-4 flex-1 min-h-[300px]">
            <div className="space-y-1">
              <h3 className="text-[10px] font-mono text-slate-500 uppercase">Tên danh mục thiết kế</h3>
              <h2 className="text-sm font-bold text-white light:text-slate-900 m-0 border-l-2 border-sky-400 pl-2 leading-none">
                {name || 'Chưa đặt tên'}
              </h2>
            </div>

            {/* Standard inputs display */}
            <div className="space-y-1.5">
              <label className="text-[9px] text-slate-400 light:text-slate-600 font-bold uppercase tracking-wider">Tiêu đề yêu cầu / Sự cố *</label>
              <input
                type="text"
                disabled
                placeholder="Người dùng nhập tiêu đề chính..."
                className="w-full px-3 py-1.5 bg-slate-950/20 light:bg-slate-50 border border-slate-850 light:border-slate-200 rounded-lg text-xs cursor-not-allowed text-slate-500"
              />
            </div>

            {/* Dynamic fields display */}
            {fields.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-500 italic">
                Chưa có trường thông tin động nào.
              </div>
            ) : (
              <div className="space-y-3.5 pt-3 border-t border-dashed border-slate-800 light:border-slate-200">
                {fields.map((f, idx) => (
                  <div key={idx} className="space-y-1">
                    <label className="text-[10px] text-slate-300 light:text-slate-800 font-semibold flex items-center justify-between">
                      <span>
                        {f.label || 'Chưa đặt nhãn'}
                        {f.required && <span className="text-red-500 ml-0.5">*</span>}
                      </span>
                      <span className="text-[8px] text-slate-500 font-mono font-normal">({f.type})</span>
                    </label>

                    {f.type === 'text' && (
                      <input
                        type="text"
                        disabled
                        placeholder={f.placeholder || 'Người dùng nhập văn bản ngắn...'}
                        className="w-full px-3 py-1.5 bg-slate-950/20 light:bg-slate-50 border border-slate-850 light:border-slate-200 rounded-lg text-xs cursor-not-allowed text-slate-500"
                      />
                    )}

                    {f.type === 'textarea' && (
                      <textarea
                        disabled
                        rows={2}
                        placeholder={f.placeholder || 'Người dùng nhập nội dung mô tả chi tiết...'}
                        className="w-full px-3 py-1.5 bg-slate-950/20 light:bg-slate-50 border border-slate-850 light:border-slate-200 rounded-lg text-xs cursor-not-allowed text-slate-500 resize-none"
                      />
                    )}

                    {f.type === 'dropdown' && (
                      <select
                        disabled
                        className="w-full px-3 py-1.5 bg-slate-950/20 light:bg-slate-50 border border-slate-850 light:border-slate-200 rounded-lg text-xs cursor-not-allowed text-slate-500"
                      >
                        {f.options && f.options.length > 0 ? (
                          f.options.map((opt, oIdx) => (
                            <option key={oIdx}>{opt}</option>
                          ))
                        ) : (
                          <option>Chưa cấu hình các tùy chọn...</option>
                        )}
                      </select>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CategoryForm;
