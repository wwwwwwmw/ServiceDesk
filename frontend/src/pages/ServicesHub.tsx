import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../contexts/AuthContext';
import { 
  PlusCircle, 
  Loader2, 
  Laptop, 
  Key, 
  Share2, 
  Monitor, 
  FileText
} from 'lucide-react';

interface ServiceTemplate {
  id: string;
  title: string;
  description: string;
  category_id: string;
  category_name: string;
  category_type: string;
}

export const ServicesHub: React.FC = () => {
  const navigate = useNavigate();
  const [templates, setTemplates] = useState<ServiceTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const response = await api.get<ServiceTemplate[]>('/api/service-templates');
        setTemplates(response.data);
      } catch (err: any) {
        console.error('Lỗi khi tải mẫu dịch vụ:', err);
        setError('Không thể kết nối máy chủ để tải danh sách mẫu dịch vụ.');
      } finally {
        setLoading(false);
      }
    };
    fetchTemplates();
  }, []);

  const getIconForTemplate = (title: string) => {
    const lower = title.toLowerCase();
    if (lower.includes('laptop') || lower.includes('macbook')) return <Laptop className="w-8 h-8 text-sky-400" />;
    if (lower.includes('thẻ') || lower.includes('truy cập văn phòng') || lower.includes('key')) return <Key className="w-8 h-8 text-amber-400" />;
    if (lower.includes('shared') || lower.includes('drive') || lower.includes('quyền truy cập')) return <Share2 className="w-8 h-8 text-emerald-400" />;
    if (lower.includes('màn hình') || lower.includes('monitor')) return <Monitor className="w-8 h-8 text-purple-400" />;
    return <FileText className="w-8 h-8 text-sky-400" />;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <Loader2 className="w-8 h-8 text-sky-500 animate-spin" />
        <span className="ml-3 text-sm text-slate-400 light:text-slate-500">Đang tải các mẫu dịch vụ...</span>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Title block */}
      <div>
        <h1 className="text-2xl font-bold text-white light:text-slate-900 tracking-tight m-0">Yêu cầu Dịch vụ IT</h1>
        <p className="text-sm text-slate-400 light:text-slate-500 mt-2">
          Chọn một dịch vụ tiêu chuẩn được thiết lập sẵn dưới đây để rút ngắn thời gian xử lý, hoặc đề xuất yêu cầu khác.
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Grid of templates */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {templates.map((tpl) => (
          <button
            key={tpl.id}
            onClick={() => navigate(`/create-ticket?type=request&template_id=${tpl.id}`)}
            className="flex items-start text-left p-5 bg-slate-900/40 light:bg-white border border-slate-800/80 light:border-slate-200 rounded-2xl shadow-lg hover:border-sky-500/50 light:hover:border-sky-500 hover:shadow-sky-500/5 hover:-translate-y-0.5 transition duration-300 group"
          >
            <div className="bg-slate-950/60 light:bg-slate-50 p-3 rounded-xl border border-slate-850 light:border-slate-100 mr-4 shrink-0 group-hover:scale-105 transition duration-300">
              {getIconForTemplate(tpl.title)}
            </div>
            <div className="space-y-1.5 min-w-0">
              <h3 className="text-sm font-bold text-white light:text-slate-900 group-hover:text-sky-400 light:group-hover:text-sky-500 transition m-0">
                {tpl.title}
              </h3>
              <p className="text-xs text-slate-400 light:text-slate-500 leading-relaxed line-clamp-2">
                {tpl.description}
              </p>
              <span className="inline-block text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-sky-500/10 text-sky-400 border border-sky-500/20">
                {tpl.category_name}
              </span>
            </div>
          </button>
        ))}

        {/* Custom request button */}
        <button
          onClick={() => navigate('/create-ticket?type=request')}
          className="flex items-start text-left p-5 bg-slate-900/10 light:bg-slate-50/20 border-2 border-dashed border-slate-800 light:border-slate-350 rounded-2xl hover:border-sky-500/50 light:hover:border-sky-500 hover:bg-slate-900/30 light:hover:bg-sky-500/5 hover:-translate-y-0.5 transition duration-300 group cursor-pointer"
        >
          <div className="bg-slate-950/20 light:bg-slate-100 p-3 rounded-xl border border-dashed border-slate-800 light:border-slate-200 mr-4 shrink-0 group-hover:scale-105 transition duration-300">
            <PlusCircle className="w-8 h-8 text-slate-500 light:text-slate-400 group-hover:text-sky-500" />
          </div>
          <div className="space-y-1.5">
            <h3 className="text-sm font-bold text-slate-300 light:text-slate-800 group-hover:text-sky-400 light:group-hover:text-sky-500 transition m-0">
              Yêu cầu dịch vụ khác
            </h3>
            <p className="text-xs text-slate-500 light:text-slate-400 leading-relaxed">
              Nếu không tìm thấy mẫu phù hợp ở trên, bạn có thể tạo một yêu cầu trống mới tại đây.
            </p>
          </div>
        </button>
      </div>
    </div>
  );
};

export default ServicesHub;
