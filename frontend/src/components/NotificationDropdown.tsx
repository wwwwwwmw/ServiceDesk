import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../contexts/AuthContext';
import { Bell, CheckCheck, Inbox, Clock, Loader2 } from 'lucide-react';

interface Notification {
  id: string;
  title: string;
  content: string;
  is_read: boolean;
  ticket_id: string | null;
  created_at: string;
}

export const NotificationDropdown: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const fetchNotifications = async (showLoading = false) => {
    if (showLoading) setLoading(true);
    try {
      const response = await api.get<Notification[]>('/api/notifications');
      setNotifications(response.data);
    } catch (error) {
      console.error('Lỗi khi tải thông báo:', error);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  // Tải danh sách thông báo khi mount và thiết lập polling mỗi 2 giây khi dropdown đang đóng
  useEffect(() => {
    fetchNotifications(true);

    const interval = setInterval(() => {
      if (!isOpen) {
        fetchNotifications(false);
      }
    }, 2000); // 2s polling

    return () => clearInterval(interval);
  }, [isOpen]);

  // Đóng dropdown khi click ra ngoài
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Đánh dấu một thông báo là đã đọc
  const handleMarkAsRead = async (id: string, ticketId: string | null, title: string) => {
    try {
      await api.patch(`/api/notifications/${id}/read`);
      // Cập nhật client-side state nhanh hơn
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
      setIsOpen(false);

      if (ticketId) {
        navigate(`/ticket/${ticketId}`);
      } else if (title === 'Yêu cầu đổi mật khẩu') {
        navigate('/admin/reset-requests');
      }
    } catch (error) {
      console.error('Lỗi khi đánh dấu đã đọc:', error);
    }
  };

  // Đánh dấu tất cả là đã đọc
  const handleMarkAllRead = async () => {
    try {
      await api.patch('/api/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch (error) {
      console.error('Lỗi khi đánh dấu tất cả đã đọc:', error);
    }
  };

  const formatTime = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

      if (diffMins < 1) return 'Vừa xong';
      if (diffMins < 60) return `${diffMins} phút trước`;
      if (diffHours < 24) return `${diffHours} giờ trước`;
      
      return date.toLocaleDateString('vi-VN', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return '';
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Icon chuông và Badge đếm */}
      <button
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) {
            // Refetch khi mở để đảm bảo cập nhật mới nhất
            fetchNotifications(false);
          }
        }}
        className="relative p-2 rounded-lg bg-slate-900/60 light:bg-slate-100 border border-slate-800 light:border-slate-200 hover:bg-slate-800/60 light:hover:bg-slate-200 text-slate-400 light:text-slate-600 hover:text-white light:hover:text-slate-900 transition duration-200 cursor-pointer"
        title="Thông báo"
      >
        <Bell className={`w-4.5 h-4.5 ${unreadCount > 0 ? 'animate-bounce' : ''}`} />
        {unreadCount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-extrabold text-white shadow-lg shadow-red-500/20">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-3 w-80 md:w-96 rounded-2xl bg-[#0d1324]/95 light:bg-white border border-slate-800/80 light:border-slate-200 shadow-2xl z-[100] backdrop-blur-lg flex flex-col overflow-hidden max-h-[480px] transition-colors duration-300">
          {/* Header */}
          <div className="p-4 border-b border-slate-800/60 light:border-slate-200 flex items-center justify-between shrink-0">
            <span className="text-sm font-bold text-white light:text-slate-900">Thông báo</span>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="flex items-center space-x-1 text-xs text-sky-400 hover:text-sky-300 transition duration-150 cursor-pointer font-medium"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span>Đọc tất cả</span>
              </button>
            )}
          </div>

          {/* List items */}
          <div className="flex-1 overflow-y-auto min-h-0 pr-0.5">
            {loading ? (
              <div className="py-12 flex flex-col items-center justify-center text-slate-500">
                <Loader2 className="w-8 h-8 text-sky-400 animate-spin mb-2" />
                <span className="text-xs">Đang tải thông báo...</span>
              </div>
            ) : notifications.length === 0 ? (
              <div className="py-12 flex flex-col items-center justify-center text-slate-500 text-center">
                <Inbox className="w-10 h-10 text-slate-600 mb-2.5" />
                <p className="text-xs font-semibold text-slate-400 light:text-slate-500">Bạn chưa có thông báo nào</p>
                <p className="text-[10px] text-slate-600">Khi có cập nhật mới, thông báo sẽ hiển thị ở đây.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-850/50 light:divide-slate-100">
                {notifications.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => handleMarkAsRead(item.id, item.ticket_id, item.title)}
                    className={`p-4 flex gap-3 hover:bg-slate-800/30 light:hover:bg-slate-50 cursor-pointer transition relative group ${
                      !item.is_read ? 'bg-sky-500/5 light:bg-sky-50/40' : ''
                    }`}
                  >
                    {/* Blue unread dot indicator */}
                    {!item.is_read && (
                      <span className="absolute left-1.5 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-sky-500" />
                    )}

                    <div className="flex-1 space-y-1 pl-1">
                      <div className="flex justify-between items-start gap-2">
                        <h4 className={`text-xs font-bold text-slate-100 light:text-slate-900 leading-tight truncate-2-lines ${
                          !item.is_read ? 'font-extrabold text-white' : 'font-medium'
                        }`}>
                          {item.title}
                        </h4>
                      </div>
                      <p className="text-[11px] text-slate-400 light:text-slate-600 leading-relaxed break-words">
                        {item.content}
                      </p>
                      <div className="flex items-center space-x-1 text-[9px] text-slate-500 light:text-slate-400 pt-0.5">
                        <Clock className="w-3 h-3" />
                        <span>{formatTime(item.created_at)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationDropdown;
