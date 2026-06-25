import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api, useAuth } from '../contexts/AuthContext';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { 
  BarChart3, 
  Search, 
  MapPin, 
  Building,
  Calendar, 
  User, 
  Loader2, 
  ArrowRight,
  AlertCircle,
  FileSpreadsheet,
  FileText
} from 'lucide-react';

interface ReportTicket {
  id: string;
  title: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'assigned' | 'in_progress' | 'resolved' | 'closed' | 'reopened';
  created_at: string;
  resolved_at: string | null;
  closed_at: string | null;
  room: string | null;
  requester_name: string;
  requester_email: string;
  assignee_name: string | null;
  assignee_email: string | null;
  category_name: string;
  location_name: string;
}

interface Location {
  id: string;
  name: string;
}

export const Reports: React.FC = () => {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<ReportTicket[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pdfLoading, setPdfLoading] = useState(false);

  // Filters state
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedLocationId, setSelectedLocationId] = useState('');
  const [roomFilter, setRoomFilter] = useState('');
  const [userAccountFilter, setUserAccountFilter] = useState('');

  // Fetch locations for dropdown
  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const response = await api.get<Location[]>('/api/locations');
        setLocations(response.data);
      } catch (err) {
        console.error('Lỗi khi tải khu vực:', err);
      }
    };
    fetchLocations();
  }, []);

  // Fetch report data based on filters
  const fetchReportData = async () => {
    setLoading(true);
    setError(null);
    try {
      const params: any = {};
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      if (selectedLocationId) params.location_id = selectedLocationId;
      if (roomFilter.trim()) params.room = roomFilter.trim();
      if (userAccountFilter.trim()) params.user_account = userAccountFilter.trim();

      const response = await api.get<ReportTicket[]>('/api/reports', { params });
      setTickets(response.data);
    } catch (err: any) {
      console.error(err);
      setError('Lỗi khi tải dữ liệu báo cáo thống kê. Vui lòng kiểm tra lại kết nối!');
    } finally {
      setLoading(false);
    }
  };

  // Run search when filters apply
  useEffect(() => {
    fetchReportData();
  }, [startDate, endDate, selectedLocationId, user]);

  const handleSearchClick = (e: React.FormEvent) => {
    e.preventDefault();
    fetchReportData();
  };

  const handleClearFilters = () => {
    setStartDate('');
    setEndDate('');
    setSelectedLocationId('');
    setRoomFilter('');
    setUserAccountFilter('');
  };

  // Export to Excel
  const handleExportExcel = () => {
    if (tickets.length === 0) {
      alert('Không có dữ liệu để xuất!');
      return;
    }

    // 1. Tạo dữ liệu với key tiếng Anh (ASCII) để tránh lỗi XML của Excel với ký tự UTF-8 làm key
    const dataToExport = tickets.map(t => ({
      id: t.id,
      title: t.title,
      category: t.category_name,
      location: t.location_name,
      room: t.room || 'Mặc định',
      requester: t.requester_name,
      email: t.requester_email,
      assignee: t.assignee_name || 'Chưa gán',
      priority: t.priority === 'low' ? 'Thấp' : t.priority === 'medium' ? 'Thường' : t.priority === 'high' ? 'Cao' : 'Khẩn cấp',
      status: getStatusLabel(t.status),
      createdAt: new Date(t.created_at).toLocaleString('vi-VN'),
      resolvedAt: t.resolved_at ? new Date(t.resolved_at).toLocaleString('vi-VN') : 'N/A',
      closedAt: t.closed_at ? new Date(t.closed_at).toLocaleString('vi-VN') : 'N/A'
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);

    // 2. Định nghĩa các nhãn tiêu đề tiếng Việt có dấu
    const vietnameseHeaders = [
      'Mã Yêu Cầu',
      'Tiêu đề',
      'Danh mục',
      'Khu vực',
      'Phòng làm việc',
      'Người yêu cầu',
      'Email người yêu cầu',
      'Người hỗ trợ',
      'Độ ưu tiên',
      'Trạng thái',
      'Thời gian tạo',
      'Thời gian hoàn thành',
      'Thời gian đóng'
    ];

    // 3. Ghi đè dòng đầu tiên thành tiêu đề tiếng Việt
    XLSX.utils.sheet_add_aoa(worksheet, [vietnameseHeaders], { origin: 'A1' });
    
    // 4. Tính toán độ rộng cột tự động dựa trên độ dài chuỗi của tiêu đề và dữ liệu
    const maxColumnWidths = vietnameseHeaders.map(header => header.length);
    dataToExport.forEach(row => {
      const values = Object.values(row);
      values.forEach((val, colIndex) => {
        const valStr = String(val || '');
        if (valStr.length > maxColumnWidths[colIndex]) {
          maxColumnWidths[colIndex] = valStr.length;
        }
      });
    });

    // Giới hạn độ rộng cột từ 10 đến tối đa 50 ký tự để tránh cột quá to
    worksheet['!cols'] = maxColumnWidths.map(w => ({ wch: Math.min(Math.max(w + 3, 10), 50) })) as any;

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'ServiceDesk Stats');
    XLSX.writeFile(workbook, `ServiceDesk_Report_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const getStatusLabelVietnamese = (status: string) => {
    const labels: Record<string, string> = {
      open: 'Mới tạo',
      assigned: 'Đã giao',
      in_progress: 'Đang sửa',
      resolved: 'Xong (Chờ duyệt)',
      closed: 'Đã đóng',
      reopened: 'Mở lại'
    };
    return labels[status] || status;
  };

  // Export to PDF (Hỗ trợ tải font chữ Unicode để hiển thị Tiếng Việt có dấu, fallback sang không dấu nếu offline)
  const handleExportPDF = async () => {
    if (tickets.length === 0) {
      alert('Không có dữ liệu để xuất!');
      return;
    }

    setPdfLoading(true);
    const doc = new jsPDF();
    let useUnicode = false;

    try {
      // Tải font Roboto Regular hỗ trợ tiếng Việt từ Google Fonts CDN
      const response = await fetch('https://fonts.gstatic.com/s/roboto/v30/KFOmCnqEu92Fr1Mu4mxKKTU1Kg.ttf');
      if (response.ok) {
        const buffer = await response.arrayBuffer();
        const base64Font = btoa(
          new Uint8Array(buffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
        );
        doc.addFileToVFS('Roboto-Regular.ttf', base64Font);
        doc.addFont('Roboto-Regular.ttf', 'Roboto', 'normal');
        doc.setFont('Roboto');
        useUnicode = true;
      }
    } catch (err) {
      console.warn('Không thể tải font Roboto Unicode để hiển thị có dấu, tự động chuyển sang chế độ không dấu:', err);
    }

    const titleText = useUnicode ? 'BÁO CÁO THỐNG KÊ SERVICE DESK' : 'BAO CAO THONG KE SERVICE DESK';
    const dateText = useUnicode ? `Ngày xuất: ${new Date().toLocaleString('vi-VN')}` : `Ngay xuat: ${new Date().toLocaleString('vi-VN')}`;
    const userText = useUnicode ? `Người xuất: ${user?.username || 'System Admin'}` : `Nguoi xuat: ${user?.username || 'System Admin'}`;
    const totalText = useUnicode ? `Tổng số tickets: ${tickets.length}` : `Tong so tickets: ${tickets.length}`;

    doc.setFontSize(16);
    if (useUnicode) doc.setFont('Roboto', 'normal');
    doc.text(titleText, 14, 15);
    
    doc.setFontSize(10);
    doc.text(dateText, 14, 22);
    doc.text(userText, 14, 27);
    doc.text(totalText, 14, 32);

    const rawHeaders = ['Mã Ticket', 'Tiêu đề', 'Danh mục', 'Khu vực', 'Phòng', 'Người yêu cầu', 'Người xử lý', 'Trạng thái'];
    const tableHeaders = [
      useUnicode ? rawHeaders : rawHeaders.map(h => stripVietnameseDiacritics(h))
    ];

    const tableRows = tickets.map(t => {
      const row = [
        t.id.slice(0, 8),
        t.title,
        t.category_name,
        t.location_name,
        t.room || 'Mặc định',
        t.requester_name,
        t.assignee_name || 'Chưa gán',
        getStatusLabelVietnamese(t.status)
      ];
      return useUnicode ? row : row.map(cell => stripVietnameseDiacritics(String(cell)));
    });

    autoTable(doc, {
      head: tableHeaders,
      body: tableRows,
      startY: 38,
      theme: 'grid',
      styles: { fontSize: 8, font: useUnicode ? 'Roboto' : 'Helvetica' },
      headStyles: { fillColor: [14, 165, 233], textColor: [255, 255, 255] },
      alternateRowStyles: { fillColor: [248, 250, 252] }
    });

    doc.save(`ServiceDesk_Report_${new Date().toISOString().slice(0, 10)}.pdf`);
    setPdfLoading(false);
  };

  // Helper hàm loại bỏ dấu Tiếng Việt
  const stripVietnameseDiacritics = (str: string): string => {
    return str
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/Đ/g, 'D');
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      open: 'Moi tao',
      assigned: 'Da giao',
      in_progress: 'Dang sua',
      resolved: 'Xong (Cho duyet)',
      closed: 'Da dong',
      reopened: 'Mo lai'
    };
    return labels[status] || status;
  };

  const renderStatusBadge = (status: ReportTicket['status']) => {
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

  const renderPriorityBadge = (priority: ReportTicket['priority']) => {
    const labels = { low: 'Thấp', medium: 'Thường', high: 'Cao', critical: 'Khẩn cấp' };
    const styles = {
      low: 'text-slate-400',
      medium: 'text-sky-400',
      high: 'text-amber-500',
      critical: 'text-red-500 font-bold'
    };
    return <span className={`text-xs ${styles[priority]}`}>{labels[priority]}</span>;
  };

  // Tính số liệu cho KPI Cards
  const getKpiStats = () => {
    const total = tickets.length;
    const open = tickets.filter(t => t.status === 'open' || t.status === 'reopened').length;
    const processing = tickets.filter(t => t.status === 'assigned' || t.status === 'in_progress').length;
    const resolved = tickets.filter(t => t.status === 'resolved').length;
    const closed = tickets.filter(t => t.status === 'closed').length;

    return { total, open, processing, resolved, closed };
  };

  const kpis = getKpiStats();

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      
      {/* Title */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-4 border-b border-slate-850 light:border-slate-200">
        <div className="flex items-center space-x-3">
          <div className="bg-sky-500/10 p-2.5 rounded-xl border border-sky-500/20 text-sky-400">
            <BarChart3 className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white light:text-slate-900 m-0">Thống kê & Báo cáo</h1>
            <p className="text-slate-500 light:text-slate-400 text-xs mt-0.5">Truy xuất dữ liệu, lọc thông tin và xuất file báo cáo định dạng Excel / PDF</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-3">
          <button
            onClick={handleExportExcel}
            className="flex items-center space-x-1.5 py-2 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-lg shadow-emerald-600/10 cursor-pointer"
            title="Xuất dữ liệu hiện tại ra Excel"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Xuất Excel</span>
          </button>
          <button
            onClick={handleExportPDF}
            disabled={pdfLoading}
            className="flex items-center space-x-1.5 py-2 px-4 rounded-xl bg-sky-500 hover:bg-sky-600 disabled:bg-sky-500/50 text-white text-xs font-bold transition shadow-lg shadow-sky-500/10 cursor-pointer"
            title="Xuất dữ liệu hiện tại ra PDF"
          >
            {pdfLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <FileText className="w-4 h-4" />
            )}
            <span>{pdfLoading ? 'Đang tạo...' : 'Xuất PDF'}</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        
        <div className="p-4 bg-slate-900/40 light:bg-white border border-slate-800/80 light:border-slate-200 rounded-2xl flex flex-col justify-between">
          <span className="text-[10px] uppercase font-bold text-slate-500">Tổng số Ticket</span>
          <span className="text-2xl font-bold text-white light:text-slate-900 mt-2">{kpis.total}</span>
        </div>

        <div className="p-4 bg-slate-900/40 light:bg-white border border-slate-800/80 light:border-slate-200 rounded-2xl flex flex-col justify-between">
          <span className="text-[10px] uppercase font-bold text-sky-400">Yêu cầu mới</span>
          <span className="text-2xl font-bold text-sky-400 mt-2">{kpis.open}</span>
        </div>

        <div className="p-4 bg-slate-900/40 light:bg-white border border-slate-800/80 light:border-slate-200 rounded-2xl flex flex-col justify-between">
          <span className="text-[10px] uppercase font-bold text-amber-500">Đang xử lý</span>
          <span className="text-2xl font-bold text-amber-500 mt-2">{kpis.processing}</span>
        </div>

        <div className="p-4 bg-slate-900/40 light:bg-white border border-slate-800/80 light:border-slate-200 rounded-2xl flex flex-col justify-between">
          <span className="text-[10px] uppercase font-bold text-emerald-400">Đã giải quyết</span>
          <span className="text-2xl font-bold text-emerald-400 mt-2">{kpis.resolved}</span>
        </div>

        <div className="p-4 bg-slate-900/40 light:bg-white border border-slate-800/80 light:border-slate-200 rounded-2xl col-span-2 md:col-span-1 flex flex-col justify-between">
          <span className="text-[10px] uppercase font-bold text-slate-400">Đã đóng</span>
          <span className="text-2xl font-bold text-slate-350 light:text-slate-800 mt-2">{kpis.closed}</span>
        </div>

      </div>

      {/* Filter Section */}
      <div className="bg-slate-900/40 light:bg-white border border-slate-800/80 light:border-slate-200 rounded-2xl p-5 shadow-xl">
        <form onSubmit={handleSearchClick} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
            
            {/* Start Date */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center">
                <Calendar className="w-3.5 h-3.5 mr-1" />
                <span>Từ ngày</span>
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full bg-slate-950/60 light:bg-slate-50 border border-slate-800 light:border-slate-200 rounded-xl p-2.5 text-xs text-slate-200 light:text-slate-800 outline-none focus:border-sky-500/50"
              />
            </div>

            {/* End Date */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center">
                <Calendar className="w-3.5 h-3.5 mr-1" />
                <span>Đến ngày</span>
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full bg-slate-950/60 light:bg-slate-50 border border-slate-800 light:border-slate-200 rounded-xl p-2.5 text-xs text-slate-200 light:text-slate-800 outline-none focus:border-sky-500/50"
              />
            </div>

            {/* Area */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center">
                <MapPin className="w-3.5 h-3.5 mr-1" />
                <span>Khu vực</span>
              </label>
              <select
                value={selectedLocationId}
                onChange={(e) => setSelectedLocationId(e.target.value)}
                className="w-full bg-slate-950/60 light:bg-slate-50 border border-slate-800 light:border-slate-200 rounded-xl p-2.5 text-xs text-slate-350 light:text-slate-800 outline-none cursor-pointer"
              >
                <option value="">Tất cả khu vực</option>
                {locations.map(loc => (
                  <option key={loc.id} value={loc.id}>{loc.name}</option>
                ))}
              </select>
            </div>

            {/* Room */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center">
                <Building className="w-3.5 h-3.5 mr-1" />
                <span>Phòng</span>
              </label>
              <input
                type="text"
                placeholder="Nhập tên phòng..."
                value={roomFilter}
                onChange={(e) => setRoomFilter(e.target.value)}
                className="w-full bg-slate-950/60 light:bg-slate-50 border border-slate-800 light:border-slate-200 rounded-xl p-2.5 text-xs text-slate-200 light:text-slate-800 outline-none focus:border-sky-500/50"
              />
            </div>

            {/* User Account */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center">
                <User className="w-3.5 h-3.5 mr-1" />
                <span>Tài khoản</span>
              </label>
              <input
                type="text"
                placeholder="Tên / email..."
                value={userAccountFilter}
                onChange={(e) => setUserAccountFilter(e.target.value)}
                className="w-full bg-slate-950/60 light:bg-slate-50 border border-slate-800 light:border-slate-200 rounded-xl p-2.5 text-xs text-slate-200 light:text-slate-800 outline-none focus:border-sky-500/50"
              />
            </div>

          </div>

          <div className="flex justify-end space-x-3 pt-2">
            <button
              type="button"
              onClick={handleClearFilters}
              className="py-2 px-5 bg-slate-950 light:bg-slate-100 border border-slate-850 light:border-slate-200 text-slate-450 light:text-slate-600 hover:text-slate-200 hover:bg-slate-900 rounded-xl text-xs font-semibold transition cursor-pointer"
            >
              Xóa bộ lọc
            </button>
            <button
              type="submit"
              className="py-2 px-6 bg-sky-500 hover:bg-sky-600 text-white rounded-xl text-xs font-bold transition flex items-center space-x-1 shadow-md shadow-sky-500/10 cursor-pointer"
            >
              <Search className="w-3.5 h-3.5" />
              <span>Tìm kiếm</span>
            </button>
          </div>
        </form>
      </div>

      {/* Main Table View */}
      {error && (
        <div className="flex items-center space-x-2 bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl text-xs font-semibold">
          <AlertCircle className="w-4 h-4" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center min-h-[300px]">
          <Loader2 className="w-8 h-8 text-sky-500 animate-spin" />
          <span className="ml-3 text-sm text-slate-400">Đang truy vấn dữ liệu...</span>
        </div>
      ) : (
        <div className="bg-slate-900/40 light:bg-white border border-slate-800/80 light:border-slate-200 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-950/40 light:bg-slate-50 text-[10px] uppercase font-bold tracking-wider text-slate-400 light:text-slate-500 border-b border-slate-800 light:border-slate-200">
                  <th className="p-4">Mã Ticket</th>
                  <th className="p-4">Tiêu đề sự cố/yêu cầu</th>
                  <th className="p-4">Khu vực / Phòng</th>
                  <th className="p-4">Người yêu cầu</th>
                  <th className="p-4">Người hỗ trợ</th>
                  <th className="p-4">Độ ưu tiên</th>
                  <th className="p-4">Trạng thái</th>
                  <th className="p-4">Ngày tạo</th>
                  <th className="p-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850 light:divide-slate-200 text-xs font-medium">
                {tickets.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="p-12 text-center text-slate-500">
                      Không tìm thấy dữ liệu ticket phù hợp với bộ lọc hiện tại.
                    </td>
                  </tr>
                ) : (
                  tickets.map((ticket) => (
                    <tr key={ticket.id} className="hover:bg-slate-950/15 light:hover:bg-slate-50/50 transition">
                      <td className="p-4 font-mono text-[10px] text-slate-400">{ticket.id.slice(0, 8)}</td>
                      <td className="p-4 text-slate-200 light:text-slate-800 max-w-[200px] truncate" title={ticket.title}>
                        <span className="block font-semibold text-slate-200 light:text-slate-800">{ticket.title}</span>
                        <span className="text-[10px] text-slate-500 font-normal">{ticket.category_name}</span>
                      </td>
                      <td className="p-4">
                        <div className="flex flex-col text-slate-350 light:text-slate-700">
                          <span className="flex items-center text-[11px] font-semibold">
                            <MapPin className="w-3 h-3 mr-0.5 text-slate-500" />
                            {ticket.location_name}
                          </span>
                          {ticket.room && (
                            <span className="text-[10px] text-slate-500 pl-3.5">Phòng: {ticket.room}</span>
                          )}
                        </div>
                      </td>
                      <td className="p-4 text-slate-300 light:text-slate-700">{ticket.requester_name}</td>
                      <td className="p-4 text-slate-400 light:text-slate-600">{ticket.assignee_name || 'Chưa gán'}</td>
                      <td className="p-4">{renderPriorityBadge(ticket.priority)}</td>
                      <td className="p-4">{renderStatusBadge(ticket.status)}</td>
                      <td className="p-4 text-[10px] text-slate-450 light:text-slate-500">
                        {new Date(ticket.created_at).toLocaleDateString('vi-VN')}
                      </td>
                      <td className="p-4 text-right">
                        <Link
                          to={`/ticket/${ticket.id}`}
                          className="inline-flex items-center space-x-1 py-1 px-3 bg-sky-500/10 border border-sky-500/20 text-sky-400 rounded-lg text-[11px] font-bold hover:bg-sky-500/20 transition cursor-pointer"
                        >
                          <span>Chi tiết</span>
                          <ArrowRight className="w-3 h-3" />
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
};

export default Reports;
