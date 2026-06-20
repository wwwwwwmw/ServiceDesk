import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth, api } from '../contexts/AuthContext';
import { 
  ClipboardList, 
  Clock, 
  CheckCircle, 
  MapPin, 
  User as UserIcon,
  ChevronRight,
  Filter,
  RefreshCw,
  Search,
  Plus
} from 'lucide-react';

interface Ticket {
  id: string;
  title: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'assigned' | 'in_progress' | 'resolved' | 'closed' | 'reopened';
  created_at: string;
  requester_name: string;
  assignee_name: string | null;
  category_name: string;
  location_name: string;
}

interface Employee {
  id: string;
  username: string;
  location_name: string;
}

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [locations, setLocations] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchDashboardData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      // Fetch tickets
      const params: any = {};
      if (statusFilter) params.status = statusFilter;
      if (locationFilter) params.location_id = locationFilter;

      const ticketsResponse = await api.get<Ticket[]>('/api/tickets', { params });
      setTickets(ticketsResponse.data);

      // Nếu là Manager/Admin, fetch thêm danh sách Employee để gán việc & danh sách Locations để lọc
      if (user.role === 'manager' || user.role === 'admin') {
        const empResponse = await api.get<Employee[]>('/api/employees');
        setEmployees(empResponse.data);

        const locResponse = await api.get<{ id: string; name: string }[]>('/api/locations');
        setLocations(locResponse.data);
      }
    } catch (error) {
      console.error('Lỗi khi tải dữ liệu dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [statusFilter, locationFilter, user]);

  const handleQuickAssign = async (ticketId: string, assigneeId: string) => {
    if (!assigneeId) return;
    setActionLoading(ticketId);
    try {
      await api.patch(`/api/tickets/${ticketId}/assign`, { assignee_id: assigneeId });
      await fetchDashboardData(); // Reload list
    } catch (error) {
      console.error('Lỗi khi gán việc nhanh:', error);
      alert('Không thể hoàn thành gán việc nhanh. Vui lòng thử lại!');
    } finally {
      setActionLoading(null);
    }
  };

  if (!user) return null;

  // Tính toán số lượng theo trạng thái
  const getStats = () => {
    const total = tickets.length;
    const open = tickets.filter(t => t.status === 'open' || t.status === 'reopened').length;
    const processing = tickets.filter(t => t.status === 'assigned' || t.status === 'in_progress').length;
    const resolved = tickets.filter(t => t.status === 'resolved').length;
    const closed = tickets.filter(t => t.status === 'closed').length;

    return { total, open, processing, resolved, closed };
  };

  const stats = getStats();

  // Tìm kiếm cục bộ
  const filteredTickets = tickets.filter(t => 
    t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.requester_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.category_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Nhãn badge trạng thái
  const renderStatusBadge = (status: Ticket['status']) => {
    const styles = {
      open: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
      assigned: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
      in_progress: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
      resolved: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      closed: 'bg-slate-700/20 text-slate-400 border-slate-700/30',
      reopened: 'bg-rose-500/10 text-rose-400 border-rose-500/20'
    };

    const labels = {
      open: 'Mới tạo',
      assigned: 'Đã giao',
      in_progress: 'Đang sửa',
      resolved: 'Xong (Chờ duyệt)',
      closed: 'Đã đóng',
      reopened: 'Mở lại'
    };

    return (
      <span className={`inline-flex items-center text-[11px] font-semibold px-2 py-0.5 rounded border ${styles[status]}`}>
        {labels[status]}
      </span>
    );
  };

  // Nhãn mức độ ưu tiên
  const renderPriorityBadge = (priority: Ticket['priority']) => {
    const styles = {
      low: 'text-slate-400',
      medium: 'text-sky-400',
      high: 'text-amber-500',
      critical: 'text-red-500 font-bold'
    };

    const labels = {
      low: 'Thấp',
      medium: 'Thường',
      high: 'Cao',
      critical: 'Khẩn cấp'
    };

    return (
      <span className={`text-xs ${styles[priority]}`}>
        {labels[priority]}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      
      {/* Page Title & Controls */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-white light:text-slate-900 tracking-tight m-0">
            {user.role === 'user' && 'Bảng Điều Khiển Yêu Cầu'}
            {user.role === 'employee' && 'Danh Sách Công Việc Kỹ Thuật'}
            {user.role === 'manager' && 'Bể Case Điều Phối Sự Cố'}
            {user.role === 'admin' && 'Bảng Quản Trị Hệ Thống'}
          </h2>
          <p className="text-slate-500 light:text-slate-400 text-xs mt-1">
            {user.role === 'user' && 'Quản lý, tạo mới và theo dõi tiến độ xử lý ticket của bạn'}
            {user.role === 'employee' && 'Xem các yêu cầu được giao và cập nhật trạng thái sửa chữa'}
            {user.role === 'manager' && 'Tiếp nhận các ticket OPEN, giao việc cho kỹ thuật viên theo khu vực'}
            {user.role === 'admin' && 'Theo dõi toàn bộ ticket của doanh nghiệp'}
          </p>
        </div>
        <div className="flex items-center space-x-2 shrink-0">
          <button 
            onClick={fetchDashboardData}
            className="p-2 rounded-xl bg-slate-900 light:bg-white border border-slate-800 light:border-slate-200 hover:bg-slate-800 light:hover:bg-slate-100 text-slate-400 light:text-slate-500 hover:text-white light:hover:text-slate-900 transition"
            title="Tải lại dữ liệu"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          {user.role === 'user' && (
            <Link 
              to="/create-ticket"
              className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-medium text-xs transition shadow-lg shadow-sky-500/10"
            >
              <Plus className="w-4 h-4" />
              <span>Gửi Yêu Cầu</span>
            </Link>
          )}
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Mới tạo / Chờ xử lý */}
        <div className="bg-slate-900/40 light:bg-white border border-slate-800/80 light:border-slate-200 rounded-2xl p-5 flex items-center space-x-4 transition-colors duration-300">
          <div className="bg-sky-500/10 p-3 rounded-xl border border-sky-500/20 text-sky-400">
            <ClipboardList className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-500 light:text-slate-400 tracking-wider block">Chờ điều phối</span>
            <span className="text-2xl font-bold text-slate-200 light:text-slate-800 block">{stats.open}</span>
          </div>
        </div>

        {/* Card 2: Đang xử lý */}
        <div className="bg-slate-900/40 light:bg-white border border-slate-800/80 light:border-slate-200 rounded-2xl p-5 flex items-center space-x-4 transition-colors duration-300">
          <div className="bg-amber-500/10 p-3 rounded-xl border border-amber-500/20 text-amber-400">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-500 light:text-slate-400 tracking-wider block">Đang xử lý</span>
            <span className="text-2xl font-bold text-slate-200 light:text-slate-800 block">{stats.processing}</span>
          </div>
        </div>

        {/* Card 3: Đã xử lý */}
        <div className="bg-slate-900/40 light:bg-white border border-slate-800/80 light:border-slate-200 rounded-2xl p-5 flex items-center space-x-4 transition-colors duration-300">
          <div className="bg-emerald-500/10 p-3 rounded-xl border border-emerald-500/20 text-emerald-400">
            <CheckCircle className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-500 light:text-slate-400 tracking-wider block">Chờ nghiệm thu</span>
            <span className="text-2xl font-bold text-slate-200 light:text-slate-800 block">{stats.resolved}</span>
          </div>
        </div>

        {/* Card 4: Đã đóng hoàn thành */}
        <div className="bg-slate-900/40 light:bg-white border border-slate-800/80 light:border-slate-200 rounded-2xl p-5 flex items-center space-x-4 transition-colors duration-300">
          <div className="bg-slate-700/10 p-3 rounded-xl border border-slate-700/20 text-slate-400">
            <CheckCircle className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-500 light:text-slate-400 tracking-wider block">Đã đóng</span>
            <span className="text-2xl font-bold text-slate-200 light:text-slate-800 block">{stats.closed}</span>
          </div>
        </div>

      </div>

      {/* Filter Options Panel */}
      <div className="bg-slate-900/20 light:bg-slate-100 border border-slate-800/80 light:border-slate-200 rounded-2xl p-4 flex flex-col md:flex-row gap-4 items-center justify-between transition-colors duration-300">
        
        {/* Search */}
        <div className="relative w-full md:w-80">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
            <Search className="w-4 h-4" />
          </span>
          <input
            type="text"
            placeholder="Tìm theo tiêu đề, người yêu cầu..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-950/60 light:bg-white border border-slate-800 light:border-slate-200 outline-none text-slate-200 light:text-slate-800 placeholder-slate-600 light:placeholder-slate-400 text-xs focus:border-sky-500/50 transition-colors duration-200"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 w-full md:w-auto items-center justify-end">
          
          {/* Status filter */}
          <div className="flex items-center space-x-2">
            <Filter className="w-3.5 h-3.5 text-slate-500" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-950/80 light:bg-white border border-slate-800 light:border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-300 light:text-slate-800 outline-none focus:border-sky-500/50 cursor-pointer"
            >
              <option value="">Tất cả trạng thái</option>
              <option value="open">Mới tạo (Open)</option>
              <option value="assigned">Đã giao (Assigned)</option>
              <option value="in_progress">Đang sửa (In Progress)</option>
              <option value="resolved">Xong (Resolved)</option>
              <option value="closed">Đã đóng (Closed)</option>
              <option value="reopened">Mở lại (Reopened)</option>
            </select>
          </div>

          {/* Location filter (chỉ Manager/Admin thấy) */}
          {(user.role === 'manager' || user.role === 'admin') && (
            <select
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
              className="bg-slate-950/80 light:bg-white border border-slate-800 light:border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-300 light:text-slate-800 outline-none focus:border-sky-500/50 cursor-pointer"
            >
              <option value="">Tất cả khu vực</option>
              {locations.map(loc => (
                <option key={loc.id} value={loc.id}>{loc.name}</option>
              ))}
            </select>
          )}

        </div>
      </div>

      {/* Ticket List Table */}
      <div className="bg-slate-900/20 light:bg-white border border-slate-800/80 light:border-slate-200 rounded-2xl overflow-hidden transition-colors duration-300">
        {loading ? (
          <div className="py-20 text-center text-slate-500 text-xs flex flex-col items-center justify-center">
            <RefreshCw className="w-8 h-8 text-sky-400 animate-spin mb-3" />
            <span>Đang đồng bộ dữ liệu sự cố...</span>
          </div>
        ) : filteredTickets.length === 0 ? (
          <div className="py-20 text-center text-slate-500 text-xs">
            Không tìm thấy ticket nào phù hợp với bộ lọc hiện tại.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 light:border-slate-200 bg-slate-950/30 light:bg-slate-50 text-slate-500 light:text-slate-400 text-[10px] font-bold uppercase tracking-wider transition-colors duration-300">
                  <th className="py-4 px-6">Tiêu đề</th>
                  <th className="py-4 px-4">Khu vực</th>
                  <th className="py-4 px-4">Phân loại</th>
                  <th className="py-4 px-4">Độ ưu tiên</th>
                  <th className="py-4 px-4">Trạng thái</th>
                  <th className="py-4 px-4">Xử lý bởi</th>
                  {user.role === 'manager' && <th className="py-4 px-4 w-52">Giao việc nhanh</th>}
                  <th className="py-4 px-6 text-right">Chi tiết</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 light:divide-slate-200 text-xs text-slate-300 light:text-slate-700">
                {filteredTickets.map((ticket) => (
                  <tr 
                    key={ticket.id}
                    className="hover:bg-slate-800/20 light:hover:bg-slate-100 transition cursor-pointer"
                    onClick={() => navigate(`/ticket/${ticket.id}`)}
                  >
                    <td className="py-4 px-6 font-medium text-slate-100 light:text-slate-800 max-w-xs truncate">
                      <div className="font-semibold text-slate-200 light:text-black">{ticket.title}</div>
                      <div className="text-[10px] text-slate-500 light:text-slate-600 flex items-center mt-1">
                        <UserIcon className="w-3 h-3 mr-1" />
                        <span>Yêu cầu bởi: {ticket.requester_name}</span>
                        <span className="mx-1.5">•</span>
                        <span>{new Date(ticket.created_at).toLocaleDateString()}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4 whitespace-nowrap text-slate-400 light:text-slate-600">
                      <span className="flex items-center">
                        <MapPin className="w-3.5 h-3.5 mr-1 text-slate-500" />
                        {ticket.location_name}
                      </span>
                    </td>
                    <td className="py-4 px-4 whitespace-nowrap text-slate-400 light:text-slate-600">
                      {ticket.category_name}
                    </td>
                    <td className="py-4 px-4 whitespace-nowrap">
                      {renderPriorityBadge(ticket.priority)}
                    </td>
                    <td className="py-4 px-4 whitespace-nowrap">
                      {renderStatusBadge(ticket.status)}
                    </td>
                    <td className="py-4 px-4 whitespace-nowrap text-slate-400 light:text-slate-600">
                      {ticket.assignee_name || (
                        <span className="text-[10px] italic text-slate-600 light:text-slate-500">Chưa chỉ định</span>
                      )}
                    </td>
                    {user.role === 'manager' && (
                      <td 
                        className="py-3 px-4"
                        onClick={(e) => e.stopPropagation()} // Chặn click dòng nhảy sang trang chi tiết
                      >
                        {ticket.status === 'open' || ticket.status === 'reopened' ? (
                          <div className="flex items-center">
                            <select
                               defaultValue=""
                              disabled={actionLoading === ticket.id}
                              onChange={(e) => handleQuickAssign(ticket.id, e.target.value)}
                              className="w-full bg-slate-950/80 light:bg-white border border-slate-800 light:border-slate-200 rounded-lg py-1 px-2 text-[11px] text-slate-300 light:text-slate-800 outline-none focus:border-sky-500/50 transition disabled:opacity-50 cursor-pointer"
                            >
                              <option value="">Giao việc...</option>
                              {employees
                                .filter(emp => emp.location_name === ticket.location_name)
                                .map(emp => (
                                  <option key={emp.id} value={emp.id}>{emp.username} (Trực {emp.location_name})</option>
                                ))
                              }
                              {/* Option fallback cho nhân viên ở nơi khác */}
                              <option disabled>──────────</option>
                              {employees
                                .filter(emp => emp.location_name !== ticket.location_name)
                                .map(emp => (
                                  <option key={emp.id} value={emp.id}>{emp.username} ({emp.location_name})</option>
                                ))
                              }
                            </select>
                          </div>
                        ) : (
                          <span className="text-[10px] text-slate-500">Đã gán xử lý</span>
                        )}
                      </td>
                    )}
                    <td className="py-4 px-6 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                      <button 
                        onClick={() => navigate(`/ticket/${ticket.id}`)}
                        className="p-1 rounded bg-slate-800 light:bg-slate-100 hover:bg-slate-700 light:hover:bg-slate-200 text-slate-400 light:text-slate-500 hover:text-white light:hover:text-slate-900 transition"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
};

export default Dashboard;
