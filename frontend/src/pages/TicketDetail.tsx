import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth, api } from '../contexts/AuthContext';
import { 
  ArrowLeft, 
  MapPin, 
  User as UserIcon, 
  Calendar, 
  ShieldAlert, 
  MessageSquare, 
  Play, 
  Check, 
  RotateCcw,
  Send,
  Loader2,
  Paperclip,
  Download
} from 'lucide-react';

interface Attachment {
  id: string;
  file_name: string;
  file_type: string;
  file_data: string;
  created_at: string;
}

interface TicketDetailData {
  id: string;
  title: string;
  requester_id: string;
  requester_name: string;
  requester_email: string;
  creator_name: string;
  assignee_id: string | null;
  assignee_name: string | null;
  category_name: string;
  template_json: any[];
  location_name: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'assigned' | 'in_progress' | 'resolved' | 'closed' | 'reopened';
  dynamic_data: Record<string, any>;
  created_at: string;
  resolved_at: string | null;
  closed_at: string | null;
  attachments?: Attachment[];
}

interface TimelineItem {
  type: 'log' | 'comment';
  id: string;
  user_name: string;
  user_role: string;
  content: string;
  created_at: string;
}

interface Employee {
  id: string;
  username: string;
  location_name: string;
}

export const TicketDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [ticket, setTicket] = useState<TicketDetailData | null>(null);
  const [timeline, setTimeline] = useState<TimelineItem[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [commentContent, setCommentContent] = useState('');
  const [reopenReason, setReopenReason] = useState('');
  const [showReopenForm, setShowReopenForm] = useState(false);
  const [selectedAssignee, setSelectedAssignee] = useState('');
  const [selectedPriority, setSelectedPriority] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const downloadFile = (file: Attachment) => {
    const link = document.createElement('a');
    link.href = `data:${file.file_type};base64,${file.file_data}`;
    link.download = file.file_name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const timelineEndRef = useRef<HTMLDivElement>(null);

  const fetchTicketDetail = async () => {
    try {
      // 1. Fetch chi tiết ticket
      const ticketRes = await api.get<TicketDetailData>(`/api/tickets/${id}`);
      setTicket(ticketRes.data);
      setSelectedPriority(ticketRes.data.priority);
      if (ticketRes.data.assignee_id) {
        setSelectedAssignee(ticketRes.data.assignee_id);
      }

      // 2. Fetch timeline
      const timelineRes = await api.get<TimelineItem[]>(`/api/tickets/${id}/timeline`);
      setTimeline(timelineRes.data);

      // 3. Fetch employees (nếu Manager/Admin đang xem và ticket chưa đóng)
      if ((user?.role === 'manager' || user?.role === 'admin') && ticketRes.data.status !== 'closed') {
        const empRes = await api.get<Employee[]>('/api/employees');
        setEmployees(empRes.data);
      }
    } catch (error) {
      console.error('Lỗi khi tải chi tiết ticket:', error);
      alert('Không thể tải thông tin ticket hoặc bạn không có quyền xem!');
      navigate(-1);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTicketDetail();
  }, [id, user]);

  // Polling thảo luận và trạng thái ticket mỗi 5 giây để cập nhật realtime
  useEffect(() => {
    if (!id || !ticket) return;

    const interval = setInterval(async () => {
      try {
        // 1. Fetch timeline mới
        const timelineRes = await api.get<TimelineItem[]>(`/api/tickets/${id}/timeline`);
        setTimeline(prev => {
          if (JSON.stringify(prev) !== JSON.stringify(timelineRes.data)) {
            return timelineRes.data;
          }
          return prev;
        });

        // 2. Fetch trạng thái và thông tin phân công mới của ticket
        const ticketRes = await api.get<TicketDetailData>(`/api/tickets/${id}`);
        setTicket(prev => {
          if (prev && (
            prev.status !== ticketRes.data.status || 
            prev.assignee_id !== ticketRes.data.assignee_id || 
            prev.priority !== ticketRes.data.priority
          )) {
            setSelectedPriority(ticketRes.data.priority);
            if (ticketRes.data.assignee_id) {
              setSelectedAssignee(ticketRes.data.assignee_id);
            }
            return ticketRes.data;
          }
          return prev;
        });
      } catch (err) {
        console.error('Lỗi tự động cập nhật thảo luận/trạng thái:', err);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [id, ticket]);

  // Cuộn timeline xuống cuối khi có tin nhắn mới
  useEffect(() => {
    timelineEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [timeline]);

  // Gửi bình luận
  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentContent.trim()) return;

    setActionLoading(true);
    try {
      await api.post(`/api/tickets/${id}/comments`, { content: commentContent.trim() });
      setCommentContent('');
      // Tải lại timeline
      const timelineRes = await api.get<TimelineItem[]>(`/api/tickets/${id}/timeline`);
      setTimeline(timelineRes.data);
    } catch (err) {
      console.error('Lỗi gửi comment:', err);
    } finally {
      setActionLoading(false);
    }
  };

  // Cập nhật trạng thái (Employee/Manager)
  const handleUpdateStatus = async (newStatus: string) => {
    setActionLoading(true);
    try {
      await api.patch(`/api/tickets/${id}/status`, { status: newStatus });
      await fetchTicketDetail();
    } catch (err) {
      console.error('Lỗi cập nhật trạng thái:', err);
    } finally {
      setActionLoading(false);
    }
  };

  // Giao việc kỹ thuật (Manager/Admin)
  const handleAssign = async () => {
    if (!selectedAssignee) return;
    setActionLoading(true);
    try {
      await api.patch(`/api/tickets/${id}/assign`, { 
        assignee_id: selectedAssignee,
        priority: selectedPriority
      });
      await fetchTicketDetail();
    } catch (err) {
      console.error('Lỗi gán việc:', err);
    } finally {
      setActionLoading(false);
    }
  };

  // Mở lại Ticket (Reopen - User/Manager)
  const handleReopen = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reopenReason.trim()) return;

    setActionLoading(true);
    try {
      await api.post(`/api/tickets/${id}/reopen`, { reason: reopenReason.trim() });
      setReopenReason('');
      setShowReopenForm(false);
      await fetchTicketDetail();
    } catch (err) {
      console.error('Lỗi khi mở lại ticket:', err);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="py-20 text-center text-slate-500 text-xs flex flex-col items-center justify-center">
        <Loader2 className="w-10 h-10 text-sky-400 animate-spin mb-4" />
        <span>Đang tải thông tin chi tiết sự cố...</span>
      </div>
    );
  }

  if (!ticket || !user) return null;

  // Render badge trạng thái
  const renderStatusBadge = (status: TicketDetailData['status']) => {
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
      assigned: 'Đã gán việc',
      in_progress: 'Đang xử lý',
      resolved: 'Đã xong (Chờ duyệt)',
      closed: 'Đã đóng hoàn tất',
      reopened: 'Đã mở lại'
    };

    return (
      <span className={`inline-flex items-center text-xs font-bold px-3 py-1 rounded-full border ${styles[status]}`}>
        {labels[status]}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      
      {/* Navigation header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <button 
            onClick={() => navigate(-1)}
            className="p-1.5 rounded-lg bg-slate-900 light:bg-white border border-slate-800 light:border-slate-200 hover:bg-slate-800 light:hover:bg-slate-100 text-slate-400 light:text-slate-500 hover:text-white light:hover:text-slate-900 transition"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <span className="text-xs text-slate-500 light:text-slate-600">Quay lại Dashboard</span>
        </div>
        <span className="text-xs text-slate-500 light:text-slate-600">Mã ticket: <strong className="text-slate-300 light:text-slate-700 font-mono">{ticket.id.substring(0,8)}...</strong></span>
      </div>

      {/* Main Grid: Left Panel Info & Right Panel Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">
        
        {/* Cột trái (3/5): Thông tin Ticket & Actions */}
        <div className="lg:col-span-3 space-y-6">
          
          {/* General Box */}
          <div className="bg-slate-900/40 light:bg-white border border-slate-800/80 light:border-slate-200 rounded-2xl p-6 space-y-5 transition-colors duration-300">
            <div>
              <div className="flex flex-wrap items-center gap-3 mb-3">
                {renderStatusBadge(ticket.status)}
                <span className="text-xs px-2.5 py-1 rounded-lg bg-slate-800 light:bg-slate-100 border border-slate-700/50 light:border-slate-200 text-slate-400 light:text-slate-600 font-semibold">
                  {ticket.category_name}
                </span>
              </div>
              <h2 className="text-xl font-bold text-white light:text-slate-900 tracking-tight m-0">{ticket.title}</h2>
            </div>

            {/* Meta details list */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-b border-slate-850 light:border-slate-200 py-4 text-xs text-slate-400 light:text-slate-600">
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <UserIcon className="w-4 h-4 text-slate-500" />
                  <span>Người yêu cầu: <strong className="text-slate-200 light:text-slate-800">{ticket.requester_name}</strong></span>
                </div>
                <div className="flex items-center space-x-2">
                  <MapPin className="w-4 h-4 text-slate-500" />
                  <span>Khu vực: <strong className="text-slate-200 light:text-slate-800">{ticket.location_name}</strong></span>
                </div>
                {ticket.creator_name !== ticket.requester_name && (
                  <div className="flex items-center space-x-2">
                    <UserIcon className="w-4 h-4 text-slate-500" />
                    <span>Người tạo hộ: <strong className="text-slate-200 light:text-slate-800">{ticket.creator_name}</strong></span>
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4 text-slate-500" />
                  <span>Ngày tạo: <strong className="text-slate-200 light:text-slate-800">{new Date(ticket.created_at).toLocaleString()}</strong></span>
                </div>
                <div className="flex items-center space-x-2">
                  <UserIcon className="w-4 h-4 text-slate-500" />
                  <span>Kỹ thuật viên: <strong className="text-slate-200 light:text-slate-800">{ticket.assignee_name || 'Chưa chỉ định'}</strong></span>
                </div>
                <div className="flex items-center space-x-2">
                  <ShieldAlert className="w-4 h-4 text-slate-500" />
                  <span>Mức độ ưu tiên: <strong className="text-slate-200 light:text-slate-800 uppercase">{ticket.priority}</strong></span>
                </div>
              </div>
            </div>

            {/* Dynamic fields display */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-sky-400 uppercase tracking-wider m-0">Chi tiết biểu mẫu (Form động)</h4>
              <div className="bg-slate-950/40 light:bg-slate-50 rounded-xl p-4 border border-slate-850/50 light:border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-4">
                {ticket.template_json && ticket.template_json.map((field: any) => {
                  const val = ticket.dynamic_data[field.name];
                  return (
                    <div key={field.name} className="space-y-1">
                      <span className="text-[10px] text-slate-400 light:text-slate-600 font-bold block">{field.label}:</span>
                      <span className="text-xs text-slate-200 light:text-slate-800 font-semibold block">
                        {val !== undefined && val !== '' ? String(val) : <em className="text-slate-600 light:text-slate-450">Trống</em>}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Hiển thị tập tin đính kèm */}
            {ticket.attachments && ticket.attachments.length > 0 && (
              <div className="space-y-3 pt-4 border-t border-slate-850 light:border-slate-200">
                <h4 className="text-xs font-bold text-sky-400 uppercase tracking-wider m-0 flex items-center">
                  <Paperclip className="w-4 h-4 mr-1.5" />
                  Tập tin & Hình ảnh đính kèm ({ticket.attachments.length})
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {ticket.attachments.map((file) => {
                    const isImage = file.file_type.startsWith('image/');
                    return (
                      <div 
                        key={file.id} 
                        className="flex items-center justify-between p-3 bg-slate-950/40 light:bg-slate-50 border border-slate-850 light:border-slate-200 rounded-xl hover:border-slate-800 light:hover:border-slate-300 transition"
                      >
                        <div className="flex items-center min-w-0 pr-3 space-x-3">
                          {isImage ? (
                            <img 
                              src={`data:${file.file_type};base64,${file.file_data}`}
                              alt={file.file_name}
                              className="w-10 h-10 object-cover rounded-lg border border-slate-800 light:border-slate-250 shrink-0"
                            />
                          ) : (
                            <div className="w-10 h-10 bg-slate-900 light:bg-slate-200 flex items-center justify-center rounded-lg border border-slate-850 light:border-slate-100 shrink-0">
                              <Paperclip className="w-5 h-5 text-slate-500 light:text-slate-600" />
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-slate-200 light:text-slate-850 truncate m-0">{file.file_name}</p>
                            <p className="text-[10px] text-slate-500 light:text-slate-600 m-0 uppercase tracking-wider">{file.file_type.split('/')[1] || 'file'}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => downloadFile(file)}
                          className="p-2 rounded-lg bg-slate-900 light:bg-slate-100 hover:bg-sky-500/10 light:hover:bg-sky-500 hover:text-sky-400 light:hover:text-white text-slate-400 light:text-slate-600 transition cursor-pointer"
                          title="Tải tập tin về máy"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Action Panel Box */}
          {ticket.status !== 'closed' && (
            <div className="bg-slate-900/40 light:bg-white border border-slate-800/80 light:border-slate-200 rounded-2xl p-6 space-y-4 transition-colors duration-300">
              <h3 className="text-xs font-bold text-slate-400 light:text-slate-500 uppercase tracking-wider m-0">Bảng điều khiển tác vụ</h3>
              
              {/* 1. Manager / Admin: Phân công (khi trạng thái là open hoặc reopened) */}
              {(user.role === 'manager' || user.role === 'admin') && 
               (ticket.status === 'open' || ticket.status === 'reopened') && (
                <div className="space-y-3">
                  <p className="text-xs text-slate-400 light:text-slate-600">Chọn kỹ thuật viên phù hợp trực khu vực để gán xử lý:</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <select
                      value={selectedAssignee}
                      onChange={(e) => setSelectedAssignee(e.target.value)}
                      className="bg-slate-950 light:bg-white border border-slate-800 light:border-slate-250 rounded-lg p-2.5 text-xs text-slate-300 light:text-slate-850 outline-none cursor-pointer"
                    >
                      <option value="">-- Chọn kỹ thuật viên --</option>
                      {/* Lọc các nhân viên cùng khu vực trước để dễ chọn */}
                      <option disabled>Nhân viên trực tại {ticket.location_name}:</option>
                      {employees.filter(e => e.location_name === ticket.location_name).map(e => (
                        <option key={e.id} value={e.id}>{e.username}</option>
                      ))}
                      <option disabled>Nhân viên trực khu vực khác:</option>
                      {employees.filter(e => e.location_name !== ticket.location_name).map(e => (
                        <option key={e.id} value={e.id}>{e.username} ({e.location_name})</option>
                      ))}
                    </select>

                    <select
                      value={selectedPriority}
                      onChange={(e) => setSelectedPriority(e.target.value)}
                      className="bg-slate-950 light:bg-white border border-slate-800 light:border-slate-250 rounded-lg p-2.5 text-xs text-slate-300 light:text-slate-855 outline-none cursor-pointer"
                    >
                      <option value="low">Độ ưu tiên: Thấp</option>
                      <option value="medium">Độ ưu tiên: Thường</option>
                      <option value="high">Độ ưu tiên: Cao</option>
                      <option value="critical">Độ ưu tiên: Khẩn cấp</option>
                    </select>
                  </div>
                  <button
                    onClick={handleAssign}
                    disabled={actionLoading || !selectedAssignee}
                    className="w-full flex items-center justify-center space-x-2 py-2 rounded-lg bg-sky-500 hover:bg-sky-600 text-white font-bold text-xs transition duration-200 disabled:opacity-50"
                  >
                    <span>Phân công công việc</span>
                  </button>
                </div>
              )}

              {/* 2. Employee: Đổi trạng thái xử lý */}
              {user.role === 'employee' && ticket.assignee_id === user.id && (
                <div className="space-y-3">
                  <p className="text-xs text-slate-400 light:text-slate-600">Bạn là người được gán xử lý sự cố này. Cập nhật tiến độ:</p>
                  <div className="flex gap-4">
                    {ticket.status === 'assigned' && (
                      <button
                        onClick={() => handleUpdateStatus('in_progress')}
                        disabled={actionLoading}
                        className="flex-1 flex items-center justify-center space-x-2 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs transition disabled:opacity-50"
                      >
                        <Play className="w-4 h-4 fill-current" />
                        <span>Bắt đầu xử lý (In Progress)</span>
                      </button>
                    )}
                    {ticket.status === 'in_progress' && (
                      <button
                        onClick={() => handleUpdateStatus('resolved')}
                        disabled={actionLoading}
                        className="flex-1 flex items-center justify-center space-x-2 py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs transition disabled:opacity-50"
                      >
                        <Check className="w-4 h-4" />
                        <span>Báo cáo hoàn thành (Resolved)</span>
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* 3. Manager / Admin: Nghiệm thu & đóng Case (khi đã resolved) */}
              {(user.role === 'manager' || user.role === 'admin') && ticket.status === 'resolved' && (
                <div className="space-y-4">
                  <p className="text-xs text-slate-400 light:text-slate-600">Kỹ thuật viên đã báo hoàn thành sự cố. Bạn cần phê duyệt kết quả:</p>
                  <div className="flex gap-4">
                    <button
                      onClick={() => handleUpdateStatus('closed')}
                      disabled={actionLoading}
                      className="flex-1 flex items-center justify-center space-x-2 py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs transition disabled:opacity-50"
                    >
                      <Check className="w-4 h-4" />
                      <span>Phê duyệt & Đóng Case (Closed)</span>
                    </button>
                    <button
                      onClick={() => setShowReopenForm(true)}
                      disabled={actionLoading}
                      className="flex-1 flex items-center justify-center space-x-2 py-2.5 rounded-lg bg-rose-500/10 border border-rose-500/30 hover:bg-rose-500/20 text-rose-400 font-bold text-xs transition disabled:opacity-50"
                    >
                      <RotateCcw className="w-4 h-4" />
                      <span>Không đạt $\rightarrow$ Mở lại (Reopen)</span>
                    </button>
                  </div>
                </div>
              )}

              {/* 4. User: Nghiệm thu (khi đã resolved) */}
              {user.role === 'user' && ticket.status === 'resolved' && (
                <div className="space-y-4">
                  <p className="text-xs text-slate-400 light:text-slate-600 font-medium text-emerald-400 light:text-emerald-600">
                    Sự cố của bạn đã được giải quyết. Nếu bạn thấy sự cố vẫn còn, bạn có quyền mở lại ticket:
                  </p>
                  <button
                    onClick={() => setShowReopenForm(true)}
                    disabled={actionLoading}
                    className="w-full flex items-center justify-center space-x-2 py-2.5 rounded-lg bg-rose-500/10 border border-rose-500/30 hover:bg-rose-500/20 text-rose-400 font-bold text-xs transition"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>Vẫn lỗi $\rightarrow$ Mở lại ticket (Reopen)</span>
                  </button>
                </div>
              )}

              {/* Form Lý do Reopen */}
              {showReopenForm && (
                <form onSubmit={handleReopen} className="bg-slate-950/50 p-4 rounded-xl border border-rose-500/20 space-y-3">
                  <div className="space-y-1">
                    <label className="text-[10px] text-rose-400 font-bold uppercase tracking-wider block">Lý do mở lại sự cố:</label>
                    <textarea
                      rows={2}
                      value={reopenReason}
                      onChange={(e) => setReopenReason(e.target.value)}
                      placeholder="Nêu rõ lý do (ví dụ: máy in vẫn kẹt giấy, mạng vẫn chập chờn...)"
                      className="w-full bg-slate-900 light:bg-white border border-slate-800 light:border-slate-250 rounded-lg p-2 text-xs text-slate-200 light:text-slate-850 outline-none focus:border-rose-500/40"
                      required
                    />
                  </div>
                  <div className="flex justify-end space-x-2">
                    <button
                      type="button"
                      onClick={() => setShowReopenForm(false)}
                      className="py-1 px-3 rounded bg-slate-900 text-slate-400 text-[10px]"
                    >
                      Hủy
                    </button>
                    <button
                      type="submit"
                      disabled={actionLoading}
                      className="py-1 px-3.5 rounded bg-rose-500 hover:bg-rose-600 text-white text-[10px] font-bold"
                    >
                      Xác nhận Reopen
                    </button>
                  </div>
                </form>
              )}

            </div>
          )}

        </div>

        {/* Cột phải (2/5): Timeline chat & Logs */}
        <div className="lg:col-span-2 bg-slate-900/40 light:bg-white border border-slate-800/80 light:border-slate-200 rounded-2xl p-5 flex flex-col h-[550px] transition-colors duration-300">
          
          <h3 className="text-xs font-bold text-slate-400 light:text-slate-500 uppercase tracking-wider pb-3 border-b border-slate-850 light:border-slate-200 m-0 shrink-0 flex items-center space-x-2">
            <MessageSquare className="w-4 h-4 text-sky-400" />
            <span>Timeline thảo luận & Logs</span>
          </h3>

          {/* Timeline Messages Box */}
          <div className="flex-1 overflow-y-auto py-4 space-y-4 min-h-0 pr-1">
            {timeline.map((item) => {
              if (item.type === 'log') {
                return (
                  <div key={item.id} className="text-center">
                    <span className="inline-block text-[10px] bg-slate-950 light:bg-slate-100 text-slate-500 px-3 py-1 rounded-full border border-slate-850/50 light:border-slate-200">
                      ⚙️ {item.content} ({new Date(item.created_at).toLocaleTimeString()})
                    </span>
                  </div>
                );
              }

              // Comments bubble layout
              const isCurrentUserComment = item.user_name === user.username;

              return (
                <div 
                  key={item.id} 
                  className={`flex flex-col ${isCurrentUserComment ? 'items-end' : 'items-start'}`}
                >
                  <div className="flex items-center space-x-1 mb-1">
                    <span className="text-[10px] font-bold text-slate-400 light:text-slate-600">{item.user_name}</span>
                    <span className="text-[9px] uppercase px-1 rounded bg-slate-800 light:bg-slate-100 text-slate-500 light:text-slate-600 scale-90">
                      {item.user_role}
                    </span>
                  </div>
                  <div className={`p-3 rounded-2xl text-xs max-w-[85%] leading-relaxed ${
                    isCurrentUserComment 
                      ? 'bg-sky-500 text-white rounded-tr-none' 
                      : 'bg-slate-950 light:bg-slate-50 text-slate-300 light:text-slate-800 rounded-tl-none border border-slate-850 light:border-slate-200'
                  }`}>
                    {item.content}
                  </div>
                  <span className="text-[9px] text-slate-600 light:text-slate-550 mt-1">
                    {new Date(item.created_at).toLocaleTimeString()}
                  </span>
                </div>
              );
            })}
            <div ref={timelineEndRef} />
          </div>

          {/* Write comment Form */}
          {ticket.status !== 'closed' ? (
            <form onSubmit={handlePostComment} className="pt-3 border-t border-slate-850 light:border-slate-200 shrink-0 flex items-center space-x-2">
              <input
                type="text"
                placeholder="Nhập phản hồi/bình luận của bạn..."
                value={commentContent}
                onChange={(e) => setCommentContent(e.target.value)}
                className="flex-1 bg-slate-950 light:bg-white border border-slate-850 light:border-slate-250 rounded-xl px-3.5 py-2 text-xs text-slate-200 light:text-slate-800 outline-none focus:border-sky-500/50"
                disabled={actionLoading}
              />
              <button
                type="submit"
                disabled={actionLoading || !commentContent.trim()}
                className="p-2 rounded-xl bg-sky-500 hover:bg-sky-600 text-white transition disabled:opacity-50 shrink-0"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          ) : (
            <div className="pt-3 border-t border-slate-850 text-center text-[10px] text-slate-600 italic shrink-0">
              Ticket đã đóng, khung thảo luận đã khóa.
            </div>
          )}

        </div>

      </div>

    </div>
  );
};

export default TicketDetail;
