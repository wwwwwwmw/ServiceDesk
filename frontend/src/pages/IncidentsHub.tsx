import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../contexts/AuthContext';
import { 
  ShieldAlert, 
  Loader2, 
  ChevronDown, 
  ChevronUp, 
  Wrench, 
  Wifi, 
  Printer, 
  Laptop, 
  Mail, 
  Info,
  ArrowRight
} from 'lucide-react';

interface IncidentArticle {
  id: string;
  title: string;
  category_id: string;
  category_name: string;
  category_type: string;
  issue_description: string;
  resolution_guide: string;
}

export const IncidentsHub: React.FC = () => {
  const navigate = useNavigate();
  const [articles, setArticles] = useState<IncidentArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    const fetchArticles = async () => {
      try {
        const response = await api.get<IncidentArticle[]>('/api/knowledge-base');
        setArticles(response.data);
      } catch (err: any) {
        console.error('Lỗi khi tải cẩm nang sự cố:', err);
        setError('Không thể kết nối máy chủ để tải cẩm nang hướng dẫn sự cố.');
      } finally {
        setLoading(false);
      }
    };
    fetchArticles();
  }, []);

  const toggleExpand = (id: string) => {
    setExpandedId(prev => prev === id ? null : id);
  };

  const getIconForArticle = (title: string) => {
    const lower = title.toLowerCase();
    if (lower.includes('wifi') || lower.includes('mạng') || lower.includes('internet')) return <Wifi className="w-6 h-6 text-sky-400" />;
    if (lower.includes('in') || lower.includes('printer')) return <Printer className="w-6 h-6 text-amber-400" />;
    if (lower.includes('xanh') || lower.includes('bsod') || lower.includes('win')) return <Laptop className="w-6 h-6 text-red-400" />;
    if (lower.includes('email') || lower.includes('outlook') || lower.includes('mật khẩu')) return <Mail className="w-6 h-6 text-purple-400" />;
    return <Wrench className="w-6 h-6 text-slate-400" />;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <Loader2 className="w-8 h-8 text-sky-500 animate-spin" />
        <span className="ml-3 text-sm text-slate-400 light:text-slate-500">Đang tải cẩm nang sự cố...</span>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Title block */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white light:text-slate-900 tracking-tight m-0">Báo cáo Sự cố & Cẩm nang Sửa lỗi</h1>
          <p className="text-sm text-slate-400 light:text-slate-500 mt-2">
            Xem qua hướng dẫn khắc phục nhanh cho các sự cố phổ biến dưới đây trước khi gửi yêu cầu hỗ trợ IT.
          </p>
        </div>
        
        {/* Custom Incident Button */}
        <button
          onClick={() => navigate('/create-ticket?type=incident')}
          className="flex items-center justify-center space-x-2 px-5 py-3 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 border border-red-500/20 hover:border-red-500/30 text-sm font-semibold tracking-wide shadow-lg cursor-pointer transition shrink-0 self-start sm:self-center"
        >
          <ShieldAlert className="w-4 h-4" />
          <span>Báo cáo sự cố khác (Other)</span>
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Accordion List of common articles */}
      <div className="space-y-4">
        {articles.map((art) => {
          const isExpanded = expandedId === art.id;
          return (
            <div 
              key={art.id}
              className={`bg-slate-900/40 light:bg-white border rounded-2xl overflow-hidden shadow-lg transition-all duration-300 ${
                isExpanded 
                  ? 'border-sky-500/50 light:border-sky-500 shadow-sky-500/5' 
                  : 'border-slate-800/80 light:border-slate-200 hover:border-slate-700 light:hover:border-slate-300'
              }`}
            >
              {/* Header block (clickable) */}
              <button
                onClick={() => toggleExpand(art.id)}
                className="w-full flex items-center justify-between p-5 text-left cursor-pointer transition focus:outline-none"
              >
                <div className="flex items-center space-x-4 min-w-0 pr-4">
                  <div className="bg-slate-950/60 light:bg-slate-50 p-2.5 rounded-xl border border-slate-850 light:border-slate-100 shrink-0">
                    {getIconForArticle(art.title)}
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-bold text-white light:text-slate-900 m-0 line-clamp-1">
                      {art.title}
                    </h3>
                    <p className="text-xs text-slate-500 light:text-slate-400 mt-1 line-clamp-1">
                      {art.issue_description}
                    </p>
                  </div>
                </div>
                <div>
                  {isExpanded ? (
                    <ChevronUp className="w-5 h-5 text-slate-400 light:text-slate-500" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-slate-400 light:text-slate-500" />
                  )}
                </div>
              </button>

              {/* Collapsible content */}
              {isExpanded && (
                <div className="border-t border-slate-850 light:border-slate-100 bg-slate-950/20 light:bg-slate-50/50 p-6 space-y-6">
                  
                  {/* Problem details */}
                  <div className="space-y-2">
                    <h4 className="flex items-center text-xs font-bold text-sky-400 light:text-sky-600 uppercase tracking-wider m-0">
                      <Info className="w-4 h-4 mr-1.5 shrink-0" />
                      Mô tả hiện tượng lỗi
                    </h4>
                    <p className="text-xs text-slate-300 light:text-slate-600 leading-relaxed pl-5.5">
                      {art.issue_description}
                    </p>
                  </div>

                  {/* Guide list */}
                  <div className="space-y-2">
                    <h4 className="flex items-center text-xs font-bold text-emerald-400 light:text-emerald-600 uppercase tracking-wider m-0">
                      <Wrench className="w-4 h-4 mr-1.5 shrink-0" />
                      Hướng dẫn tự khắc phục sự cố
                    </h4>
                    <div className="text-xs text-slate-300 light:text-slate-600 leading-relaxed pl-5.5 space-y-2 whitespace-pre-line">
                      {art.resolution_guide}
                    </div>
                  </div>

                  {/* Create Ticket Trigger */}
                  <div className="pt-4 border-t border-slate-850 light:border-slate-100 flex justify-end">
                    <button
                      onClick={() => navigate(`/create-ticket?type=incident&article_id=${art.id}`)}
                      className="flex items-center space-x-2 px-4 py-2.5 rounded-lg bg-sky-500 hover:bg-sky-600 text-white text-xs font-semibold shadow-lg shadow-sky-500/10 hover:shadow-sky-600/20 cursor-pointer transition"
                    >
                      <span>Vẫn gặp sự cố? Tạo yêu cầu hỗ trợ IT</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default IncidentsHub;
