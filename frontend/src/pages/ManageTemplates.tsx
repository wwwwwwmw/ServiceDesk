import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../contexts/AuthContext';
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Loader2, 
  Laptop, 
  CheckCircle, 
  ShieldAlert,
  ArrowLeft
} from 'lucide-react';

interface PrefilledData {
  priority: 'low' | 'medium' | 'high' | 'critical';
  dynamic_data: Record<string, any>;
}

interface ServiceTemplate {
  id: string;
  title: string;
  category_id: string;
  category_name?: string;
  description: string;
  prefilled_data: PrefilledData | string;
  created_at?: string;
}

export const ManageTemplates: React.FC = () => {
  const navigate = useNavigate();
  const [templates, setTemplates] = useState<ServiceTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Delete confirm state
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [templateToDelete, setTemplateToDelete] = useState<ServiceTemplate | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const response = await api.get<ServiceTemplate[]>('/api/service-templates');
      setTemplates(response.data);
      setError(null);
    } catch (err) {
      console.error('Lỗi khi tải templates:', err);
      setError('Không thể tải danh sách mẫu dịch vụ từ máy chủ.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  const handleOpenDeleteConfirm = (tpl: ServiceTemplate) => {
    setTemplateToDelete(tpl);
    setDeleteConfirmOpen(true);
  };

  const handleDeleteTemplate = async () => {
    if (!templateToDelete) return;
    setDeleteLoading(true);
    try {
      const response = await api.delete(`/api/admin/service-templates/${templateToDelete.id}`);
      setSuccessMessage(response.data.message || 'Xóa mẫu dịch vụ thành công!');
      setDeleteConfirmOpen(false);
      setTemplateToDelete(null);
      fetchTemplates();
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.error || 'Lỗi khi xóa mẫu dịch vụ.');
    } finally {
      setDeleteLoading(false);
    }
  };

  const filteredTemplates = templates.filter((tpl) =>
    tpl.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (tpl.category_name && tpl.category_name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
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
          <h1 className="text-2xl font-bold text-white light:text-slate-900 tracking-tight m-0">Quản lý mẫu điền sẵn</h1>
          <p className="text-sm text-slate-400 light:text-slate-500 mt-2">
            Tạo các biểu mẫu yêu cầu tiêu chuẩn kèm dữ liệu điền sẵn để người dùng tạo nhanh ticket.
          </p>
        </div>
        <button
          onClick={() => navigate('/admin/templates/create')}
          className="flex items-center space-x-2 px-4 py-2.5 bg-sky-500 hover:bg-sky-600 text-white font-bold text-xs rounded-xl transition cursor-pointer shadow-lg shadow-sky-500/15"
        >
          <Plus className="w-4 h-4" />
          <span>Tạo mẫu điền sẵn</span>
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
          placeholder="Tìm kiếm mẫu điền sẵn theo tiêu đề hoặc danh mục..."
          className="bg-transparent border-none outline-none text-slate-100 light:text-slate-900 text-sm w-full font-medium placeholder-slate-500"
        />
      </div>

      {/* Table view */}
      {loading ? (
        <div className="flex items-center justify-center min-h-[300px]">
          <Loader2 className="w-8 h-8 text-sky-500 animate-spin" />
          <span className="ml-3 text-sm text-slate-400">Đang tải danh sách mẫu...</span>
        </div>
      ) : (
        <div className="bg-slate-900/40 light:bg-white border border-slate-800/80 light:border-slate-200 rounded-2xl overflow-hidden shadow-lg transition-colors duration-300">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-850 light:border-slate-200 bg-slate-950/20 light:bg-slate-50">
                  <th className="p-4 text-xs font-bold text-slate-400 light:text-slate-500 uppercase tracking-wide">Tiêu đề mẫu</th>
                  <th className="p-4 text-xs font-bold text-slate-400 light:text-slate-500 uppercase tracking-wide">Danh mục liên kết</th>
                  <th className="p-4 text-xs font-bold text-slate-400 light:text-slate-500 uppercase tracking-wide">Độ ưu tiên mặc định</th>
                  <th className="p-4 text-xs font-bold text-slate-400 light:text-slate-500 uppercase tracking-wide text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850 light:divide-slate-200">
                {filteredTemplates.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-sm text-slate-500">
                      Không tìm thấy mẫu điền sẵn nào phù hợp.
                    </td>
                  </tr>
                ) : (
                  filteredTemplates.map((tpl) => {
                    let parsedPrefill: PrefilledData = { priority: 'low', dynamic_data: {} };
                    try {
                      if (tpl.prefilled_data) {
                        const parsed = typeof tpl.prefilled_data === 'string'
                          ? JSON.parse(tpl.prefilled_data)
                          : tpl.prefilled_data;
                        if (parsed) {
                          parsedPrefill = parsed;
                        }
                      }
                    } catch (e) {}

                    return (
                      <tr key={tpl.id} className="hover:bg-slate-950/10 light:hover:bg-slate-50/50 transition">
                        <td className="p-4">
                          <div className="flex items-center space-x-3">
                            <div className="w-9 h-9 rounded-xl bg-sky-500/10 border border-sky-500/25 flex items-center justify-center text-sky-400">
                              <Laptop className="w-4 h-4" />
                            </div>
                            <div>
                              <span className="font-semibold text-slate-200 light:text-slate-800 text-sm block">{tpl.title}</span>
                              <span className="text-[10px] text-slate-550 light:text-slate-500 line-clamp-1 max-w-xs">{tpl.description}</span>
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded bg-sky-500/10 text-sky-400 border border-sky-500/20">
                            {tpl.category_name}
                          </span>
                        </td>
                        <td className="p-4 text-xs font-mono uppercase">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            parsedPrefill.priority === 'critical' ? 'bg-red-500/15 text-red-400' :
                            parsedPrefill.priority === 'high' ? 'bg-orange-500/15 text-orange-400' :
                            parsedPrefill.priority === 'medium' ? 'bg-sky-500/15 text-sky-400' :
                            'bg-slate-500/15 text-slate-400'
                          }`}>
                            {parsedPrefill.priority}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end space-x-2">
                            <button
                              onClick={() => navigate(`/admin/templates/edit/${tpl.id}`)}
                              className="p-2 bg-sky-500/10 border border-sky-500/20 hover:bg-sky-500/25 hover:border-sky-500/30 text-sky-400 rounded-lg transition cursor-pointer"
                              title="Sửa"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleOpenDeleteConfirm(tpl)}
                              className="p-2 bg-red-500/10 border border-red-500/20 hover:bg-red-500/25 hover:border-red-500/30 text-red-400 rounded-lg transition cursor-pointer"
                              title="Xóa"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
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
                <h3 className="text-base font-bold text-white light:text-slate-900 m-0">Xác nhận xóa mẫu điền sẵn?</h3>
                <p className="text-xs text-slate-400 light:text-slate-550 mt-2 leading-relaxed font-medium">
                  Bạn có chắc chắn muốn xóa mẫu điền sẵn <span className="font-semibold text-slate-200 light:text-slate-900">{templateToDelete?.title}</span>?
                  Người dùng sẽ không thể chọn tạo nhanh bằng mẫu này nữa.
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
                  onClick={handleDeleteTemplate}
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

export default ManageTemplates;
