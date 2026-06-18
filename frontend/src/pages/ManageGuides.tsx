import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../contexts/AuthContext';
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Loader2, 
  CheckCircle, 
  ShieldAlert,
  ArrowLeft
} from 'lucide-react';

interface KBArticle {
  id: string;
  title: string;
  category_id: string;
  category_name?: string;
  issue_description: string;
  resolution_guide: string;
  created_at?: string;
}

export const ManageGuides: React.FC = () => {
  const navigate = useNavigate();
  const [articles, setArticles] = useState<KBArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Delete confirm state
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [articleToDelete, setArticleToDelete] = useState<KBArticle | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchArticles = async () => {
    setLoading(true);
    try {
      const response = await api.get<KBArticle[]>('/api/knowledge-base');
      setArticles(response.data);
      setError(null);
    } catch (err) {
      console.error('Lỗi khi tải cẩm nang:', err);
      setError('Không thể tải danh sách cẩm nang từ máy chủ.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchArticles();
  }, []);

  const handleOpenDeleteConfirm = (art: KBArticle) => {
    setArticleToDelete(art);
    setDeleteConfirmOpen(true);
  };

  const handleDeleteArticle = async () => {
    if (!articleToDelete) return;
    setDeleteLoading(true);
    try {
      const response = await api.delete(`/api/admin/knowledge-base/${articleToDelete.id}`);
      setSuccessMessage(response.data.message || 'Xóa bài cẩm nang thành công!');
      setDeleteConfirmOpen(false);
      setArticleToDelete(null);
      fetchArticles();
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.error || 'Lỗi khi xóa bài hướng dẫn.');
    } finally {
      setDeleteLoading(false);
    }
  };

  const filteredArticles = articles.filter((art) =>
    art.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (art.category_name && art.category_name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

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
          <h1 className="text-2xl font-bold text-white light:text-slate-900 tracking-tight m-0">Quản lý cẩm nang sự cố</h1>
          <p className="text-sm text-slate-400 light:text-slate-500 mt-2">
            Đăng tải và biên tập các bài viết hướng dẫn khắc phục sự cố nhanh dạng blog.
          </p>
        </div>
        <button
          onClick={() => navigate('/admin/guides/create')}
          className="flex items-center space-x-2 px-4 py-2.5 bg-sky-500 hover:bg-sky-600 text-white font-bold text-xs rounded-xl transition cursor-pointer shadow-lg shadow-sky-500/15"
        >
          <Plus className="w-4 h-4" />
          <span>Tạo cẩm nang</span>
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
          placeholder="Tìm kiếm bài cẩm nang theo tiêu đề hoặc danh mục..."
          className="bg-transparent border-none outline-none text-slate-100 light:text-slate-900 text-sm w-full font-medium placeholder-slate-500"
        />
      </div>

      {/* Grid view */}
      {loading ? (
        <div className="flex items-center justify-center min-h-[300px]">
          <Loader2 className="w-8 h-8 text-sky-500 animate-spin" />
          <span className="ml-3 text-sm text-slate-400">Đang tải danh sách bài hướng dẫn...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredArticles.length === 0 ? (
            <div className="col-span-2 text-center py-12 bg-slate-900/40 light:bg-white border border-slate-800 light:border-slate-250 rounded-2xl text-slate-500 text-sm">
              Không tìm thấy bài viết cẩm nang nào phù hợp.
            </div>
          ) : (
            filteredArticles.map((art) => (
              <div
                key={art.id}
                className="flex flex-col justify-between p-5 bg-slate-900/40 light:bg-white border border-slate-800/80 light:border-slate-200 rounded-2xl shadow-lg hover:shadow-sky-500/5 hover:-translate-y-0.5 transition duration-300 relative group"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="inline-block text-[9px] uppercase font-bold px-2 py-0.5 rounded bg-red-500/10 text-red-400 border border-red-500/25">
                      {art.category_name}
                    </span>
                    {art.created_at && (
                      <span className="text-[10px] text-slate-500 font-medium">
                        {new Date(art.created_at).toLocaleDateString('vi-VN')}
                      </span>
                    )}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white light:text-slate-900 group-hover:text-sky-400 transition m-0 line-clamp-1">{art.title}</h3>
                    <p className="text-xs text-slate-400 light:text-slate-500 leading-relaxed mt-2 line-clamp-3">
                      {art.issue_description}
                    </p>
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-slate-850 light:border-slate-150 flex justify-end space-x-2">
                  <button
                    onClick={() => navigate(`/admin/guides/edit/${art.id}`)}
                    className="flex items-center space-x-1.5 px-3.5 py-1.5 bg-sky-500/10 hover:bg-sky-500/25 text-sky-400 text-xs font-bold rounded-lg border border-sky-500/20 transition cursor-pointer"
                  >
                    <Edit className="w-3.5 h-3.5" />
                    <span>Chỉnh sửa</span>
                  </button>
                  <button
                    onClick={() => handleOpenDeleteConfirm(art)}
                    className="flex items-center space-x-1.5 px-3.5 py-1.5 bg-red-500/10 hover:bg-red-500/25 text-red-400 text-xs font-bold rounded-lg border border-red-500/20 transition cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Xóa</span>
                  </button>
                </div>
              </div>
            ))
          )}
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
                <h3 className="text-base font-bold text-white light:text-slate-900 m-0">Xác nhận xóa cẩm nang?</h3>
                <p className="text-xs text-slate-400 light:text-slate-500 mt-2 leading-relaxed">
                  Bạn có chắc chắn muốn xóa cẩm nang sự cố <span className="font-semibold text-slate-200 light:text-slate-900">{articleToDelete?.title}</span>?
                  Người dùng sẽ không thể tự đọc hướng dẫn này trên Incident Hub.
                </p>
              </div>
              <div className="flex justify-center space-x-3 pt-2">
                <button
                  onClick={() => setDeleteConfirmOpen(false)}
                  className="px-4.5 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white light:hover:text-slate-955 hover:bg-slate-800/40 light:hover:bg-slate-100 transition cursor-pointer border border-slate-850 light:border-slate-200"
                >
                  Không, giữ lại
                </button>
                <button
                  onClick={handleDeleteArticle}
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

export default ManageGuides;
