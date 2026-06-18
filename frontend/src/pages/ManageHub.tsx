import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../contexts/AuthContext';
import { 
  Users, 
  MapPin, 
  FolderTree, 
  FileText, 
  BookOpen, 
  ArrowRight, 
  Sliders, 
  Loader2,
  AlertCircle
} from 'lucide-react';

interface AdminStats {
  usersCount: number;
  locationsCount: number;
  categoriesCount: number;
  templatesCount: number;
  guidesCount: number;
}

export const ManageHub: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await api.get<AdminStats>('/api/admin/stats');
        setStats(response.data);
      } catch (err) {
        console.error('Lỗi khi tải số liệu thống kê:', err);
        setError('Không thể tải số liệu thống kê quản trị từ hệ thống.');
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const cards = [
    {
      title: 'Quản lý người dùng',
      description: 'Quản lý thông tin tài khoản, mật khẩu, phân quyền vai trò (Admin, Manager, Employee, User) và gán khu vực làm việc.',
      path: '/admin/users',
      count: stats?.usersCount ?? 0,
      icon: <Users className="w-8 h-8 text-sky-400" />,
      colorClass: 'from-sky-500/10 to-blue-500/10 border-sky-500/20 text-sky-400 bg-sky-500/5',
      badgeClass: 'bg-sky-500/10 text-sky-400 border-sky-500/20'
    },
    {
      title: 'Quản lý khu vực',
      description: 'Quản lý danh sách các cơ sở, tòa nhà và chi nhánh văn phòng làm việc của doanh nghiệp trong hệ thống.',
      path: '/admin/locations',
      count: stats?.locationsCount ?? 0,
      icon: <MapPin className="w-8 h-8 text-amber-400" />,
      colorClass: 'from-amber-500/10 to-orange-500/10 border-amber-500/20 text-amber-400 bg-amber-500/5',
      badgeClass: 'bg-amber-500/10 text-amber-400 border-amber-500/20'
    },
    {
      title: 'Quản lý danh mục',
      description: 'Thiết kế cấu trúc các nhóm sự cố / yêu cầu dịch vụ. Hỗ trợ Dynamic Form Builder và Live Preview biểu mẫu động.',
      path: '/admin/categories',
      count: stats?.categoriesCount ?? 0,
      icon: <FolderTree className="w-8 h-8 text-emerald-400" />,
      colorClass: 'from-emerald-500/10 to-teal-500/10 border-emerald-500/20 text-emerald-400 bg-emerald-500/5',
      badgeClass: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
    },
    {
      title: 'Quản lý mẫu điền sẵn',
      description: 'Cấu hình các biểu mẫu dịch vụ tiêu chuẩn điền sẵn dữ liệu mặc định (Office 365, laptop mới) giúp tạo ticket nhanh.',
      path: '/admin/templates',
      count: stats?.templatesCount ?? 0,
      icon: <FileText className="w-8 h-8 text-purple-400" />,
      colorClass: 'from-purple-500/10 to-indigo-500/10 border-purple-500/20 text-purple-400 bg-purple-500/5',
      badgeClass: 'bg-purple-500/10 text-purple-400 border-purple-500/20'
    },
    {
      title: 'Quản lý hướng dẫn sự cố',
      description: 'Biên soạn cẩm nang xử lý nhanh các sự cố phổ biến dưới dạng bài viết để hiển thị trên trang Báo cáo sự cố.',
      path: '/admin/guides',
      count: stats?.guidesCount ?? 0,
      icon: <BookOpen className="w-8 h-8 text-rose-400" />,
      colorClass: 'from-rose-500/10 to-pink-500/10 border-rose-500/20 text-rose-400 bg-rose-500/5',
      badgeClass: 'bg-rose-500/10 text-rose-400 border-rose-500/20'
    }
  ];

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Title block */}
      <div className="flex items-center space-x-3">
        <div className="bg-sky-500/10 p-2.5 rounded-xl border border-sky-500/20 text-sky-400">
          <Sliders className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white light:text-slate-900 tracking-tight m-0">Quản trị hệ thống</h1>
          <p className="text-sm text-slate-400 light:text-slate-500 mt-1">
            Trung tâm kiểm soát dữ liệu nền tảng, tài khoản người dùng, danh mục và biểu mẫu nghiệp vụ.
          </p>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center space-x-2">
          <AlertCircle className="w-4 h-4" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center min-h-[300px]">
          <Loader2 className="w-8 h-8 text-sky-500 animate-spin" />
          <span className="ml-3 text-sm text-slate-400 light:text-slate-500">Đang tải số liệu hệ thống...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {cards.map((card, idx) => (
            <div
              key={idx}
              onClick={() => navigate(card.path)}
              className="flex flex-col justify-between p-6 bg-slate-900/40 light:bg-white border border-slate-800/80 light:border-slate-200 rounded-2xl shadow-xl hover:border-sky-500/50 light:hover:border-sky-500 hover:shadow-sky-500/5 hover:-translate-y-1 transition duration-300 group cursor-pointer"
            >
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <div className={`p-3 rounded-xl border bg-gradient-to-br ${card.colorClass} shrink-0 group-hover:scale-105 transition duration-300`}>
                    {card.icon}
                  </div>
                  <span className={`text-xs font-bold font-mono px-2.5 py-1 rounded-full border ${card.badgeClass}`}>
                    {card.count} đối tượng
                  </span>
                </div>
                
                <div className="space-y-2">
                  <h3 className="text-base font-bold text-white light:text-slate-900 group-hover:text-sky-400 light:group-hover:text-sky-600 transition m-0">
                    {card.title}
                  </h3>
                  <p className="text-xs text-slate-400 light:text-slate-500 leading-relaxed font-medium">
                    {card.description}
                  </p>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-850 light:border-slate-150 flex items-center justify-between text-xs text-slate-500 font-semibold group-hover:text-sky-400 light:group-hover:text-sky-600 transition">
                <span>Truy cập cấu hình</span>
                <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition duration-300" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ManageHub;
