import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth, api } from '../contexts/AuthContext';
import { 
  PlusCircle, 
  MapPin, 
  ArrowLeft, 
  ShieldAlert,
  CheckCircle,
  HelpCircle,
  Mail,
  Loader2,
  Paperclip,
  X
} from 'lucide-react';

interface Category {
  id: string;
  name: string;
  type: 'request' | 'incident';
  template_json: Array<{
    name: string;
    label: string;
    type: 'text' | 'textarea' | 'number' | 'dropdown';
    required: boolean;
    placeholder?: string;
    options?: string[];
    validation?: {
      min?: number;
      max?: number;
      pattern?: string;
    }
  }>;
}

interface Location {
  id: string;
  name: string;
}

interface UserProfile {
  id: string;
  username: string;
  email: string;
  location_id: string;
  location_name: string;
}

export const CreateTicket: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const typeParam = searchParams.get('type');
  const templateIdParam = searchParams.get('template_id');
  const articleIdParam = searchParams.get('article_id');

  const [ticketType, setTicketType] = useState<'request' | 'incident'>(() => {
    return (typeParam === 'request' || typeParam === 'incident') ? typeParam : 'incident';
  });
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [title, setTitle] = useState('');
  
  // Delegated creation (Tạo hộ bằng email)
  const [requesterEmail, setRequesterEmail] = useState(user?.email || '');
  const [resolvedUserId, setResolvedUserId] = useState(user?.id || '');
  const [resolvedUsername, setResolvedUsername] = useState(user?.username || '');
  const [emailError, setEmailError] = useState<string | null>(null);
  const [checkingEmail, setCheckingEmail] = useState(false);

  // Locations list and selected Location
  const [locationsList, setLocationsList] = useState<Location[]>([]);
  const [selectedLocationId, setSelectedLocationId] = useState(user?.location_id || '');
  
  // Form values động
  const [dynamicValues, setDynamicValues] = useState<Record<string, any>>({});
  const [priority, setPriority] = useState<'low' | 'medium' | 'high' | 'critical'>('medium');

  // Đính kèm tệp
  const [attachments, setAttachments] = useState<Array<{ file_name: string, file_type: string, file_data: string }>>([]);
  const [fileError, setFileError] = useState<string | null>(null);

  // UI state
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Đồng bộ ticketType khi URL parameters thay đổi
  useEffect(() => {
    if (typeParam === 'request' || typeParam === 'incident') {
      setTicketType(typeParam);
    }
  }, [typeParam]);

  // Lấy danh mục dựa trên loại ticket
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await api.get<Category[]>(`/api/categories?type=${ticketType}`);
        setCategories(response.data);
        // Ngăn chặn reset selectedCategoryId nếu nó khớp với danh mục được điền sẵn
        setSelectedCategoryId(current => {
          const exists = response.data.some(c => c.id === current);
          return exists ? current : '';
        });
      } catch (err) {
        console.error('Lỗi khi tải danh mục:', err);
      }
    };
    fetchCategories();
  }, [ticketType]);

  // Tải danh sách Location khi load trang
  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const response = await api.get<Location[]>('/api/locations');
        setLocationsList(response.data);
      } catch (err) {
        console.error('Lỗi khi tải danh sách khu vực:', err);
      }
    };
    fetchLocations();
  }, []);

  // Tải dữ liệu điền sẵn nếu có template_id hoặc article_id từ URL
  useEffect(() => {
    const loadPrefilledData = async () => {
      if (templateIdParam) {
        try {
          const response = await api.get(`/api/service-templates/${templateIdParam}`);
          const data = response.data;
          setTitle(data.title || '');
          setSelectedCategoryId(data.category_id || '');
          setPriority(data.prefilled_data?.priority || 'medium');
          if (data.prefilled_data?.dynamic_data) {
            setDynamicValues(data.prefilled_data.dynamic_data);
          }
        } catch (err) {
          console.error('Lỗi khi tải dữ liệu mẫu Yêu cầu:', err);
        }
      } else if (articleIdParam) {
        try {
          const response = await api.get(`/api/knowledge-base/${articleIdParam}`);
          const data = response.data;
          setTitle(`Khắc phục sự cố: ${data.title}`);
          setSelectedCategoryId(data.category_id || '');
          setPriority('medium');
          setDynamicValues({});
        } catch (err) {
          console.error('Lỗi khi tải dữ liệu cẩm nang Sự cố:', err);
        }
      }
    };
    loadPrefilledData();
  }, [templateIdParam, articleIdParam]);

  // Lắng nghe sự thay đổi của email để tra cứu thông tin người dùng
  useEffect(() => {
    if (!requesterEmail || requesterEmail.trim() === '') {
      setResolvedUserId('');
      setResolvedUsername('');
      setEmailError(null);
      return;
    }

    // Nếu trùng với email của chính user hiện tại
    if (requesterEmail.trim().toLowerCase() === user?.email.toLowerCase()) {
      setResolvedUserId(user.id);
      setResolvedUsername(user.username);
      setSelectedLocationId(user.location_id || '');
      setEmailError(null);
      return;
    }

    if (!requesterEmail.includes('@')) {
      setEmailError('Email chưa đúng định dạng!');
      setResolvedUserId('');
      setResolvedUsername('');
      return;
    }

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setCheckingEmail(true);
      setEmailError(null);
      try {
        const response = await api.get<UserProfile>(
          `/api/users/by-email?email=${encodeURIComponent(requesterEmail.trim())}`,
          { signal: controller.signal }
        );
        const data = response.data;
        if (data && data.id) {
          setResolvedUserId(data.id);
          setResolvedUsername(data.username);
          setSelectedLocationId(data.location_id || '');
          setEmailError(null);
        }
      } catch (err: any) {
        if (err.name !== 'CanceledError') {
          setResolvedUserId('');
          setResolvedUsername('');
          setEmailError('Email người yêu cầu không tồn tại trong hệ thống!');
        }
      } finally {
        setCheckingEmail(false);
      }
    }, 600);

    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [requesterEmail, user]);

  const selectedCategory = categories.find(c => c.id === selectedCategoryId);

  // Cập nhật giá trị trường động
  const handleDynamicChange = (name: string, value: any) => {
    setDynamicValues(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Xử lý đính kèm tập tin và chuyển đổi sang base64
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setFileError(null);
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const maxBytes = 5 * 1024 * 1024; // Giới hạn 5MB
    const promises = Array.from(files).map(file => {
      return new Promise<{ file_name: string, file_type: string, file_data: string } | null>((resolve) => {
        if (file.size > maxBytes) {
          setFileError(prev => (prev ? prev + '\n' : '') + `Tệp "${file.name}" vượt quá giới hạn 5MB!`);
          return resolve(null);
        }

        const reader = new FileReader();
        reader.onload = () => {
          const base64String = (reader.result as string).split(',')[1];
          resolve({
            file_name: file.name,
            file_type: file.type,
            file_data: base64String
          });
        };
        reader.readAsDataURL(file);
      });
    });

    const results = await Promise.all(promises);
    const validFiles = results.filter(f => f !== null) as Array<{ file_name: string, file_type: string, file_data: string }>;
    setAttachments(prev => [...prev, ...validFiles]);
    e.target.value = '';
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !selectedCategoryId) {
      setError('Vui lòng điền tiêu đề và chọn phân loại danh mục!');
      return;
    }

    if (emailError || !resolvedUserId) {
      setError('Vui lòng cung cấp email người yêu cầu hợp lệ đã đăng ký trên hệ thống!');
      return;
    }

    if (!selectedLocationId) {
      setError('Vui lòng chọn khu vực ghi nhận sự cố/yêu cầu!');
      return;
    }

    // Client-side validation cho các trường động
    if (selectedCategory) {
      for (const field of selectedCategory.template_json) {
        const val = dynamicValues[field.name];
        if (field.required && (val === undefined || val === null || val === '')) {
          setError(`Vui lòng điền trường bắt buộc: "${field.label}"`);
          return;
        }
        if (field.type === 'number' && val !== undefined && val !== '') {
          const numVal = Number(val);
          if (field.validation?.min !== undefined && numVal < field.validation.min) {
            setError(`Trường "${field.label}" phải lớn hơn hoặc bằng ${field.validation.min}`);
            return;
          }
          if (field.validation?.max !== undefined && numVal > field.validation.max) {
            setError(`Trường "${field.label}" phải nhỏ hơn hoặc bằng ${field.validation.max}`);
            return;
          }
        }
      }
    }

    setSubmitting(true);
    setError(null);

    try {
      const payload = {
        title,
        requester_id: resolvedUserId,
        location_id: selectedLocationId,
        category_id: selectedCategoryId,
        dynamic_data: dynamicValues,
        priority,
        attachments
      };

      await api.post('/api/tickets', payload);
      setSuccess(true);
      setTimeout(() => {
        navigate(`/dashboard/${user?.role}`);
      }, 1500);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Lỗi khi gửi yêu cầu. Vui lòng kiểm tra lại!');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      
      {/* Navigation header */}
      <div className="flex items-center space-x-2">
        <button 
          onClick={() => navigate(-1)}
          className="p-1.5 rounded-lg bg-slate-900 light:bg-white border border-slate-800 light:border-slate-200 hover:bg-slate-800 light:hover:bg-slate-100 text-slate-400 light:text-slate-500 hover:text-white light:hover:text-slate-900 transition"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <span className="text-xs text-slate-500 light:text-slate-400">Quay lại Dashboard</span>
      </div>

      <div className="bg-slate-900/40 light:bg-white border border-slate-800/80 light:border-slate-200 rounded-2xl p-6 shadow-xl space-y-6 transition-colors duration-300">
        
        {/* Title */}
        <div className="flex items-center space-x-3 pb-4 border-b border-slate-800 light:border-slate-250">
          <div className="bg-sky-500/10 p-2.5 rounded-xl border border-sky-500/20 text-sky-400">
            <PlusCircle className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white light:text-slate-900 m-0">Tạo Yêu Cầu/Sự Cố Mới</h2>
            <p className="text-slate-500 light:text-slate-400 text-xs mt-0.5">Khởi tạo phiếu hỗ trợ IT kỹ thuật toàn hệ thống</p>
          </div>
        </div>

        {/* Notifications */}
        {error && (
          <div className="flex items-start space-x-2.5 bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl text-xs font-semibold">
            <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="flex items-start space-x-2.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-4 rounded-xl text-xs font-semibold">
            <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>Gửi yêu cầu thành công! Đang chuyển hướng về Dashboard...</span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* 1. Phân loại loại Ticket */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 light:text-slate-500 uppercase tracking-wider block">Phân loại dịch vụ</label>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setTicketType('incident')}
                className={`py-3 px-4 rounded-xl border text-center text-xs font-bold transition flex flex-col items-center justify-center space-y-1 cursor-pointer ${
                  ticketType === 'incident'
                    ? 'bg-rose-500/10 border-rose-500 text-rose-400'
                    : 'bg-slate-950/40 light:bg-slate-50 border-slate-800/80 light:border-slate-200 text-slate-500 light:text-slate-400 hover:text-slate-300 light:hover:text-slate-700'
                }`}
              >
                <ShieldAlert className="w-5 h-5" />
                <span>BÁO CÁO SỰ CỐ (Incident)</span>
              </button>
              <button
                type="button"
                onClick={() => setTicketType('request')}
                className={`py-3 px-4 rounded-xl border text-center text-xs font-bold transition flex flex-col items-center justify-center space-y-1 cursor-pointer ${
                  ticketType === 'request'
                    ? 'bg-sky-500/10 border-sky-500 text-sky-400'
                    : 'bg-slate-950/40 light:bg-slate-50 border-slate-800/80 light:border-slate-200 text-slate-500 light:text-slate-400 hover:text-slate-300 light:hover:text-slate-700'
                }`}
              >
                <HelpCircle className="w-5 h-5" />
                <span>YÊU CẦU DỊCH VỤ (Request)</span>
              </button>
            </div>
          </div>

          {/* 2. Trường email người yêu cầu & chọn khu vực */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-950/30 light:bg-slate-50 border border-slate-800 light:border-slate-200 p-5 rounded-2xl">
            
            {/* Email Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400 light:text-slate-500 uppercase tracking-wider flex items-center">
                <Mail className="w-3.5 h-3.5 mr-1" />
                <span>Người yêu cầu / Gặp sự cố</span>
              </label>
              <input
                type="email"
                value={requesterEmail}
                onChange={(e) => setRequesterEmail(e.target.value)}
                placeholder="Nhập email nhân viên gặp sự cố..."
                className="w-full bg-slate-950 light:bg-white border border-slate-800 light:border-slate-250 rounded-xl p-3 text-xs text-slate-200 light:text-slate-800 outline-none focus:border-sky-500/50"
                required
              />
              
              {/* Trạng thái xác thực email */}
              {checkingEmail && (
                <span className="text-[10px] text-slate-400 flex items-center pt-1">
                  <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                  Đang kiểm tra thông tin email...
                </span>
              )}
              {emailError && (
                <span className="text-[10px] text-rose-500 block pt-1 font-medium">{emailError}</span>
              )}
              {!checkingEmail && !emailError && resolvedUserId && requesterEmail !== user?.email && (
                <span className="text-[10px] text-emerald-400 block pt-1 font-semibold">
                  ✓ Người dùng: {resolvedUsername} (Tạo hộ)
                </span>
              )}
              {requesterEmail === user?.email && (
                <span className="text-[10px] text-slate-500 light:text-slate-400 block pt-1 font-medium">
                  (Mặc định: Bản thân bạn)
                </span>
              )}
            </div>

            {/* Location dropdown */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400 light:text-slate-500 uppercase tracking-wider flex items-center">
                <MapPin className="w-3.5 h-3.5 mr-1" />
                <span>Khu vực ảnh hưởng</span>
              </label>
              <select
                value={selectedLocationId}
                onChange={(e) => setSelectedLocationId(e.target.value)}
                className="w-full bg-slate-950 light:bg-white border border-slate-800 light:border-slate-250 rounded-xl p-3 text-xs text-slate-350 light:text-slate-800 outline-none focus:border-sky-500/50 cursor-pointer"
                required
              >
                <option value="">-- Chọn khu vực ghi nhận --</option>
                {locationsList.map(loc => (
                  <option key={loc.id} value={loc.id}>{loc.name}</option>
                ))}
              </select>
              <span className="text-[10px] text-slate-500 light:text-slate-400 block pt-1">
                Tự động đổi theo email; bạn có thể chọn lại để ghi đè.
              </span>
            </div>

          </div>

          {/* 3. Danh mục Ticket */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-400 light:text-slate-500 uppercase tracking-wider block">Phân loại danh mục con</label>
            <select
              value={selectedCategoryId}
              onChange={(e) => {
                setSelectedCategoryId(e.target.value);
                setDynamicValues({});
              }}
              className="w-full bg-slate-950 light:bg-white border border-slate-800 light:border-slate-250 rounded-xl p-3 text-xs text-slate-300 light:text-slate-800 outline-none focus:border-sky-500/50 cursor-pointer"
              required
            >
              <option value="">-- Chọn danh mục cụ thể --</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          {/* 4. Tiêu đề Ticket */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-400 light:text-slate-500 uppercase tracking-wider block">Tiêu đề yêu cầu/sự cố</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Tóm tắt ngắn gọn sự cố (Ví dụ: Máy in kẹt giấy, Xin cấp màn hình phụ)"
              className="w-full bg-slate-950 light:bg-white border border-slate-800 light:border-slate-250 rounded-xl p-3 text-xs text-slate-200 light:text-slate-800 placeholder-slate-600 light:placeholder-slate-450 outline-none focus:border-sky-500/50"
              required
            />
          </div>

          {/* 5. Cấu hình Form Động Render */}
          {selectedCategory && selectedCategory.template_json && (
            <div className="space-y-5 pt-4 border-t border-slate-800 light:border-slate-200">
              <h4 className="text-xs font-bold text-sky-400 uppercase tracking-wider m-0">Chi tiết thông tin bổ sung</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {selectedCategory.template_json.map((field) => (
                  <div 
                    key={field.name} 
                    className={`space-y-1.5 ${field.type === 'textarea' ? 'md:col-span-2' : ''}`}
                  >
                    <label className="text-xs text-slate-300 light:text-slate-700 font-semibold flex items-center">
                      <span>{field.label}</span>
                      {field.required && <span className="text-rose-500 ml-1 font-bold">*</span>}
                    </label>

                    {/* Text Input */}
                    {field.type === 'text' && (
                      <input
                        type="text"
                        placeholder={field.placeholder || 'Nhập văn bản...'}
                        value={dynamicValues[field.name] || ''}
                        onChange={(e) => handleDynamicChange(field.name, e.target.value)}
                        className="w-full bg-slate-950 light:bg-white border border-slate-800 light:border-slate-250 rounded-lg p-2 text-xs text-slate-250 light:text-slate-800"
                        required={field.required}
                      />
                    )}

                    {/* Textarea */}
                    {field.type === 'textarea' && (
                      <textarea
                        rows={3}
                        placeholder={field.placeholder || 'Mô tả chi tiết tại đây...'}
                        value={dynamicValues[field.name] || ''}
                        onChange={(e) => handleDynamicChange(field.name, e.target.value)}
                        className="w-full bg-slate-950 light:bg-white border border-slate-800 light:border-slate-250 rounded-lg p-2 text-xs text-slate-200 light:text-slate-800 outline-none focus:border-sky-500/50"
                        required={field.required}
                      />
                    )}

                    {/* Number Input */}
                    {field.type === 'number' && (
                      <input
                        type="number"
                        placeholder={field.placeholder || '0'}
                        value={dynamicValues[field.name] || ''}
                        min={field.validation?.min}
                        max={field.validation?.max}
                        onChange={(e) => handleDynamicChange(field.name, e.target.value)}
                        className="w-full bg-slate-950 light:bg-white border border-slate-800 light:border-slate-250 rounded-lg p-2 text-xs text-slate-200 light:text-slate-800"
                        required={field.required}
                      />
                    )}

                    {/* Dropdown Select */}
                    {field.type === 'dropdown' && (
                      <select
                        value={dynamicValues[field.name] || ''}
                        onChange={(e) => handleDynamicChange(field.name, e.target.value)}
                        className="w-full bg-slate-950 light:bg-white border border-slate-800 light:border-slate-250 rounded-lg p-2 text-xs text-slate-300 light:text-slate-800 outline-none"
                        required={field.required}
                      >
                        <option value="">-- Chọn option --</option>
                        {field.options?.map(opt => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 6. Mức độ ưu tiên */}
          <div className="space-y-1.5 pt-4 border-t border-slate-800 light:border-slate-200">
            <label className="text-xs font-bold text-slate-400 light:text-slate-500 uppercase tracking-wider block">Độ ưu tiên đề xuất</label>
            <div className="flex space-x-3">
              {(['low', 'medium', 'high', 'critical'] as const).map(pr => {
                const colors = {
                  low: 'border-slate-800 light:border-slate-200 text-slate-400 light:text-slate-500 bg-slate-950/20 light:bg-slate-50 active:bg-slate-800/20',
                  medium: 'border-sky-800/40 light:border-sky-200 text-sky-400 light:text-sky-600 bg-sky-950/10 light:bg-sky-50 active:bg-sky-900/10',
                  high: 'border-amber-800/40 light:border-amber-200 text-amber-500 light:text-amber-600 bg-amber-950/10 light:bg-amber-50 active:bg-amber-900/10',
                  critical: 'border-red-800/40 light:border-red-200 text-red-500 light:text-red-600 bg-red-950/10 light:bg-red-50 active:bg-red-900/10'
                };
                const activeColors = {
                  low: 'border-slate-700 bg-slate-700 text-white font-bold',
                  medium: 'border-sky-500 bg-sky-500 text-white font-bold',
                  high: 'border-amber-500 bg-amber-500 text-white font-bold',
                  critical: 'border-red-500 bg-red-500 text-white font-bold'
                };
                const labels = { low: 'Thấp', medium: 'Thường', high: 'Cao', critical: 'Khẩn cấp' };

                const isSelected = priority === pr;

                return (
                  <button
                    key={pr}
                    type="button"
                    onClick={() => setPriority(pr)}
                    className={`flex-1 py-1.5 rounded-lg border text-center text-xs transition duration-200 cursor-pointer ${
                      isSelected ? activeColors[pr] : colors[pr]
                    }`}
                  >
                    {labels[pr]}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 7. Đính kèm tập tin/hình ảnh */}
          <div className="space-y-2.5 pt-4 border-t border-slate-800 light:border-slate-200">
            <label className="text-xs font-bold text-slate-400 light:text-slate-500 uppercase tracking-wider block">Tập tin & Hình ảnh đính kèm</label>
            <input
              type="file"
              multiple
              onChange={handleFileChange}
              className="hidden"
              id="file-upload"
            />
            <label
              htmlFor="file-upload"
              className="flex flex-col items-center justify-center border-2 border-dashed border-slate-800 light:border-slate-350 rounded-xl p-4 cursor-pointer hover:border-sky-500/50 light:hover:border-sky-500 hover:bg-slate-900/10 light:hover:bg-slate-50/50 transition duration-200"
            >
              <Paperclip className="w-6 h-6 text-slate-500 light:text-slate-400 mb-1.5" />
              <span className="text-xs font-semibold text-slate-300 light:text-slate-700">Chọn tập tin từ máy tính hoặc kéo thả</span>
              <span className="text-[10px] text-slate-500 light:text-slate-450 mt-1">Hỗ trợ hình ảnh, tài liệu (Tối đa 5MB mỗi tệp)</span>
            </label>

            {attachments.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                {attachments.map((file, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2.5 bg-slate-950/60 light:bg-slate-50 border border-slate-850 light:border-slate-200 rounded-lg">
                    <div className="flex items-center min-w-0 pr-2">
                      <Paperclip className="w-3.5 h-3.5 text-slate-500 mr-2 shrink-0" />
                      <span className="text-xs text-slate-300 light:text-slate-700 truncate">{file.file_name}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeAttachment(idx)}
                      className="p-1 rounded bg-slate-900 light:bg-slate-100 hover:bg-red-500/10 hover:text-red-500 text-slate-500 transition cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            {fileError && (
              <p className="text-xs text-rose-500 mt-1.5 whitespace-pre-line">{fileError}</p>
            )}
          </div>

          {/* Action button */}
          <div className="pt-6 border-t border-slate-800 light:border-slate-200 flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="py-2.5 px-5 rounded-xl bg-slate-950 light:bg-slate-100 border border-slate-850 light:border-slate-200 text-slate-400 light:text-slate-600 hover:text-slate-200 light:hover:text-slate-900 text-xs font-semibold transition cursor-pointer"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              disabled={submitting || success}
              className="py-2.5 px-6 rounded-xl bg-sky-500 hover:bg-sky-600 text-white text-xs font-bold transition shadow-lg shadow-sky-500/15 disabled:opacity-50 cursor-pointer"
            >
              {submitting ? 'Đang gửi yêu cầu...' : 'Gửi Yêu Cầu'}
            </button>
          </div>

        </form>

      </div>

    </div>
  );
};

export default CreateTicket;
