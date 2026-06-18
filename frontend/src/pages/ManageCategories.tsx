import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../contexts/AuthContext';
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Loader2, 
  FolderTree, 
  CheckCircle, 
  ShieldAlert,
  ArrowLeft
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
  created_at?: string;
}

export const ManageCategories: React.FC = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'request' | 'incident'>('all');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Delete confirm state
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const response = await api.get<Category[]>('/api/categories');
      setCategories(response.data);
      setError(null);
    } catch (err) {
      console.error('Lỗi khi tải danh mục:', err);
      setError('Không thể tải danh sách danh mục từ máy chủ.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleOpenDeleteConfirm = (cat: Category) => {
    setCategoryToDelete(cat);
    setDeleteConfirmOpen(true);
  };

  const handleDeleteCategory = async () => {
    if (!categoryToDelete) return;
    setDeleteLoading(true);
    try {
      const response = await api.delete(`/api/admin/categories/${categoryToDelete.id}`);
      setSuccessMessage(response.data.message || 'Xóa danh mục thành công!');
      setDeleteConfirmOpen(false);
      setCategoryToDelete(null);
      fetchCategories();
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.error || 'Không thể xóa danh mục do có liên kết dữ liệu.');
    } finally {
      setDeleteLoading(false);
    }
  };

  const filteredCategories = categories.filter((cat) => {
    const matchesSearch = cat.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTab = activeTab === 'all' ? true : cat.type === activeTab;
    return matchesSearch && matchesTab;
  });

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
          <h1 className="text-2xl font-bold text-white light:text-slate-900 tracking-tight m-0">Quản lý danh mục</h1>
          <p className="text-sm text-slate-400 light:text-slate-500 mt-2">
            Định nghĩa các nhóm yêu cầu / sự cố kèm các trường thông tin động của biểu mẫu (Form Schema).
          </p>
        </div>
        <button
          onClick={() => navigate('/admin/categories/create')}
          className="flex items-center space-x-2 px-4 py-2.5 bg-sky-500 hover:bg-sky-600 text-white font-bold text-xs rounded-xl transition cursor-pointer shadow-lg shadow-sky-500/15"
        >
          <Plus className="w-4 h-4" />
          <span>Tạo danh mục</span>
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
      <div className="flex flex-col md:flex-row items-center gap-4">
        {/* Search */}
        <div className="flex-1 flex items-center bg-slate-900/40 light:bg-white border border-slate-800/80 light:border-slate-200 rounded-xl px-4 py-2.5 w-full transition-colors duration-300">
          <Search className="w-4 h-4 text-slate-500 mr-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm kiếm danh mục theo tên..."
            className="bg-transparent border-none outline-none text-slate-100 light:text-slate-900 text-sm w-full font-medium placeholder-slate-500"
          />
        </div>

        {/* Tab Filters */}
        <div className="flex space-x-1 p-1 bg-slate-950/60 light:bg-slate-200/50 rounded-xl border border-slate-900 light:border-slate-355 shrink-0 w-full md:w-auto">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold tracking-wide transition duration-200 cursor-pointer ${
              activeTab === 'all'
                ? 'bg-sky-500 text-white'
                : 'text-slate-400 light:text-slate-650 hover:text-slate-200'
            }`}
          >
            Tất cả
          </button>
          <button
            onClick={() => setActiveTab('incident')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold tracking-wide transition duration-200 cursor-pointer ${
              activeTab === 'incident'
                ? 'bg-sky-500 text-white'
                : 'text-slate-400 light:text-slate-650 hover:text-slate-200'
            }`}
          >
            Sự cố (Incidents)
          </button>
          <button
            onClick={() => setActiveTab('request')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold tracking-wide transition duration-200 cursor-pointer ${
              activeTab === 'request'
                ? 'bg-sky-500 text-white'
                : 'text-slate-400 light:text-slate-655 hover:text-slate-200'
            }`}
          >
            Dịch vụ (Requests)
          </button>
        </div>
      </div>

      {/* Grid of categories */}
      {loading ? (
        <div className="flex items-center justify-center min-h-[300px]">
          <Loader2 className="w-8 h-8 text-sky-500 animate-spin" />
          <span className="ml-3 text-sm text-slate-400">Đang tải danh sách danh mục...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredCategories.length === 0 ? (
            <div className="col-span-2 text-center py-12 bg-slate-900/40 light:bg-white border border-slate-800 light:border-slate-250 rounded-2xl text-slate-500 text-sm">
              Không tìm thấy danh mục nào phù hợp.
            </div>
          ) : (
            filteredCategories.map((cat) => {
              const fieldCount = typeof cat.template_json === 'string'
                ? JSON.parse(cat.template_json).length
                : cat.template_json?.length || 0;

              return (
                <div
                  key={cat.id}
                  className="flex flex-col justify-between p-5 bg-slate-900/40 light:bg-white border border-slate-800/80 light:border-slate-200 rounded-2xl shadow-lg hover:shadow-sky-500/5 hover:-translate-y-0.5 transition duration-300 relative group"
                >
                  <div className="space-y-3">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center space-x-3">
                        <div className="bg-slate-950/60 light:bg-slate-50 p-2.5 rounded-lg border border-slate-850 light:border-slate-100">
                          <FolderTree className="w-5 h-5 text-sky-400" />
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-white light:text-slate-900 m-0">{cat.name}</h3>
                          <span className="text-[9px] text-slate-500 font-mono block mt-0.5">{cat.id}</span>
                        </div>
                      </div>
                      <span className={`text-[9px] uppercase font-bold px-2 py-0.5 rounded border ${
                        cat.type === 'incident' 
                          ? 'bg-red-500/10 text-red-400 border-red-500/25'
                          : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25'
                      }`}>
                        {cat.type === 'incident' ? 'Sự cố' : 'Dịch vụ'}
                      </span>
                    </div>

                    <div className="pt-2 flex items-center justify-between text-xs text-slate-500">
                      <span>Số trường động: <strong>{fieldCount} trường</strong></span>
                      {cat.created_at && (
                        <span>Tạo ngày: {new Date(cat.created_at).toLocaleDateString('vi-VN')}</span>
                      )}
                    </div>
                  </div>

                  <div className="mt-5 pt-3 border-t border-slate-850 light:border-slate-150 flex justify-end space-x-2">
                    <button
                      onClick={() => navigate(`/admin/categories/edit/${cat.id}`)}
                      className="flex items-center space-x-1.5 px-3.5 py-1.5 bg-sky-500/10 hover:bg-sky-500/25 text-sky-400 text-xs font-bold rounded-lg border border-sky-500/20 transition cursor-pointer"
                    >
                      <Edit className="w-3.5 h-3.5" />
                      <span>Sửa biểu mẫu</span>
                    </button>
                    <button
                      onClick={() => handleOpenDeleteConfirm(cat)}
                      className="flex items-center space-x-1.5 px-3.5 py-1.5 bg-red-500/10 hover:bg-red-500/25 text-red-400 text-xs font-bold rounded-lg border border-red-500/20 transition cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Xóa</span>
                    </button>
                  </div>
                </div>
              );
            })
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
                <h3 className="text-base font-bold text-white light:text-slate-900 m-0">Xác nhận xóa danh mục?</h3>
                <p className="text-xs text-slate-400 light:text-slate-500 mt-2 leading-relaxed">
                  Bạn có chắc chắn muốn xóa danh mục <span className="font-semibold text-slate-200 light:text-slate-900">{categoryToDelete?.name}</span>?
                  Các mẫu điền sẵn (templates) và cẩm nang hướng dẫn thuộc danh mục này cũng sẽ tự động bị xóa theo (Cascade).
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
                  onClick={handleDeleteCategory}
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

export default ManageCategories;
