import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../contexts/AuthContext';
import { 
  ArrowLeft, 
  Loader2, 
  CheckCircle, 
  AlertCircle,
  Eye
} from 'lucide-react';

interface Category {
  id: string;
  name: string;
  type: 'request' | 'incident';
}

interface KBArticle {
  id: string;
  title: string;
  category_id: string;
  issue_description: string;
  resolution_guide: string;
}

export const GuideForm: React.FC = () => {
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
  const [issueDescription, setIssueDescription] = useState('');
  const [resolutionGuide, setResolutionGuide] = useState('');

  useEffect(() => {
    const initData = async () => {
      try {
        const catRes = await api.get<Category[]>('/api/categories?type=incident');
        setCategories(catRes.data);

        if (isEdit) {
          const kbRes = await api.get<KBArticle[]>('/api/knowledge-base');
          const found = kbRes.data.find(a => a.id === id);
          if (found) {
            setTitle(found.title);
            setCategoryId(found.category_id);
            setIssueDescription(found.issue_description);
            setResolutionGuide(found.resolution_guide);
          } else {
            setError('Không tìm thấy bài cẩm nang hướng dẫn này.');
          }
        } else if (catRes.data.length > 0) {
          setCategoryId(catRes.data[0].id);
        }
      } catch (err) {
        console.error('Lỗi khi tải dữ liệu form cẩm nang:', err);
        setError('Không thể kết nối máy chủ để tải dữ liệu form.');
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

    if (!title.trim() || !categoryId || !issueDescription.trim() || !resolutionGuide.trim()) {
      setError('Vui lòng nhập đầy đủ tiêu đề, danh mục, mô tả lỗi và cẩm nang sửa lỗi!');
      return;
    }

    setFormLoading(true);
    try {
      const payload = {
        title: title.trim(),
        category_id: categoryId,
        issue_description: issueDescription.trim(),
        resolution_guide: resolutionGuide.trim()
      };

      if (!isEdit) {
        const response = await api.post('/api/admin/knowledge-base', payload);
        setSuccess(response.data.message || 'Tạo bài hướng dẫn mới thành công!');
        setTitle('');
        setIssueDescription('');
        setResolutionGuide('');
      } else {
        const response = await api.put(`/api/admin/knowledge-base/${id}`, payload);
        setSuccess(response.data.message || 'Cập nhật hướng dẫn thành công!');
      }

      setTimeout(() => {
        navigate('/admin/guides');
      }, 1500);
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.error || 'Đã xảy ra lỗi khi lưu bài cẩm nang.');
    } finally {
      setFormLoading(false);
    }
  };

  const getSelectedCategoryName = (): string => {
    const cat = categories.find(c => c.id === categoryId);
    return cat ? cat.name : 'Danh mục sự cố';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <Loader2 className="w-8 h-8 text-sky-500 animate-spin" />
        <span className="ml-3 text-sm text-slate-400">Đang tải dữ liệu biểu mẫu...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto h-[85vh] flex flex-col">
      {/* Back Header */}
      <div className="flex items-center space-x-4 shrink-0">
        <button
          onClick={() => navigate('/admin/guides')}
          className="p-2 rounded-xl bg-slate-900/60 light:bg-slate-100 hover:bg-slate-800 light:hover:bg-slate-200 border border-slate-800 light:border-slate-300 text-slate-400 light:text-slate-655 hover:text-white light:hover:text-slate-950 transition duration-200 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-white light:text-slate-900 tracking-tight m-0">
            {isEdit ? 'Chỉnh sửa bài viết cẩm nang' : 'Tạo cẩm nang sửa lỗi mới'}
          </h1>
          <p className="text-xs text-slate-400 light:text-slate-500 mt-1">
            Biên tập nội dung cẩm nang hướng dẫn người dùng tự sửa các sự cố IT cơ bản trước khi tạo yêu cầu.
          </p>
        </div>
      </div>

      {/* Main content dual panel */}
      <div className="flex-1 flex flex-col md:flex-row gap-6 min-h-0 overflow-hidden">
        {/* Left: Editor Panel */}
        <div className="flex-1 bg-slate-900/40 light:bg-white border border-slate-800/80 light:border-slate-200 rounded-2xl p-6 shadow-xl flex flex-col overflow-y-auto">
          <form onSubmit={handleSubmit} className="space-y-4 flex-1 flex flex-col justify-between">
            <div className="space-y-4">
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
                <label className="text-[10px] font-bold text-slate-400 light:text-slate-500 uppercase tracking-wider">Tiêu đề bài viết</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-950/50 light:bg-slate-50 text-sm rounded-xl border border-slate-800 light:border-slate-250 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 outline-none text-white light:text-slate-900 font-medium transition duration-200"
                  placeholder="Ví dụ: Cách sửa lỗi kẹt giấy máy in canon nhanh..."
                  disabled={formLoading}
                />
              </div>

              {/* Category */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 light:text-slate-500 uppercase tracking-wider">Danh mục sự cố liên quan</label>
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

              {/* Description */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 light:text-slate-500 uppercase tracking-wider">Mô tả biểu hiện lỗi</label>
                <textarea
                  value={issueDescription}
                  onChange={(e) => setIssueDescription(e.target.value)}
                  rows={2}
                  className="w-full px-4 py-2.5 bg-slate-950/50 light:bg-slate-50 text-sm rounded-xl border border-slate-800 light:border-slate-250 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 outline-none text-white light:text-slate-900 font-medium transition duration-200 resize-none"
                  placeholder="Mô tả hiện tượng lỗi máy in báo lỗi gì, wifi chấm than như thế nào..."
                  disabled={formLoading}
                />
              </div>

              {/* Resolution guide */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 light:text-slate-500 uppercase tracking-wider">Các bước khắc phục sự cố (Nhấn Enter ngắt dòng)</label>
                <textarea
                  value={resolutionGuide}
                  onChange={(e) => setResolutionGuide(e.target.value)}
                  rows={6}
                  className="w-full px-4 py-2.5 bg-slate-950/50 light:bg-slate-50 text-xs rounded-xl border border-slate-800 light:border-slate-250 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 outline-none text-white light:text-slate-900 font-mono transition duration-200"
                  placeholder="Mỗi dòng là một bước hướng dẫn người dùng tự thực hiện..."
                  disabled={formLoading}
                />
              </div>
            </div>

            {/* Action buttons */}
            <div className="pt-4 border-t border-slate-850 light:border-slate-200 flex justify-end space-x-3 shrink-0">
              <button
                type="button"
                onClick={() => navigate('/admin/guides')}
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

        {/* Right: Live Preview Panel */}
        <div className="w-full md:w-[380px] bg-slate-900/40 light:bg-slate-50/50 border border-slate-800/80 light:border-slate-200 rounded-2xl p-6 shadow-xl flex flex-col overflow-y-auto">
          <div className="flex items-center space-x-2 text-xs font-bold text-slate-400 light:text-slate-500 uppercase tracking-wider mb-4 border-b border-slate-850 light:border-slate-200 pb-3 shrink-0">
            <Eye className="w-4 h-4 text-sky-400" />
            <span>XEM TRƯỚC GIAO DIỆN BÀI VIẾT</span>
          </div>

          <div className="bg-slate-950/40 light:bg-white border border-slate-850 light:border-slate-150 rounded-xl p-5 shadow-inner space-y-4 flex-1 min-h-[300px]">
            <div className="space-y-1.5">
              <span className="inline-block text-[9px] font-bold uppercase px-2 py-0.5 rounded bg-red-500/10 text-red-400 border border-red-500/20">
                {getSelectedCategoryName()}
              </span>
              <h2 className="text-sm font-bold text-white light:text-slate-900 m-0 leading-tight">
                {title || 'Chưa đặt tiêu đề'}
              </h2>
            </div>

            {/* Mock Error Description */}
            <div className="p-3 bg-slate-950/45 light:bg-slate-50 border-l-2 border-red-500 rounded-r-lg text-xs text-slate-300 light:text-slate-700">
              <span className="font-bold text-red-400 uppercase text-[9px] tracking-wide block mb-1">Hiện tượng lỗi:</span>
              <p className="leading-relaxed m-0 italic whitespace-pre-wrap">
                {issueDescription || 'Chưa nhập mô tả hiện tượng lỗi...'}
              </p>
            </div>

            {/* Mock Steps */}
            <div className="space-y-2 pt-1">
              <span className="text-[9px] font-bold text-slate-400 light:text-slate-850 uppercase tracking-wider block">Các bước khắc phục sự cố:</span>
              {resolutionGuide ? (
                <div className="space-y-2">
                  {resolutionGuide.split('\n').map((line, idx) => (
                    <div key={idx} className="text-xs text-slate-350 light:text-slate-700 leading-relaxed pl-4 relative">
                      <span className="absolute left-0 top-0 text-sky-400 font-bold">•</span>
                      <span className="whitespace-pre-wrap">{line}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-500 italic">Chưa điền nội dung cẩm nang hướng dẫn.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GuideForm;
