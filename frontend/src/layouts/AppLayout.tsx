import React, { useState, useEffect } from 'react';
import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import NotificationDropdown from '../components/NotificationDropdown';
import { 
  Activity, 
  LogOut, 
  PlusCircle, 
  MapPin,
  Building,
  LayoutDashboard,
  Sun,
  Moon,
  Settings,
  Sliders,
  Menu,
  X,
  BarChart3
} from 'lucide-react';

export const AppLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Mobile menu open state
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Theme state: dark by default
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    return (localStorage.getItem('theme') as 'light' | 'dark') || 'dark';
  });

  useEffect(() => {
    if (theme === 'light') {
      document.body.classList.add('light');
    } else {
      document.body.classList.remove('light');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!user) return null;

  // Xây dựng danh sách menu dựa theo vai trò của User
  const getMenuItems = () => {
    const items = [
      {
        path: `/dashboard/${user.role}`,
        label: 'Dashboard',
        icon: <LayoutDashboard className="w-5 h-5" />
      }
    ];

    if (user.role !== 'employee') {
      items.push(
        {
          path: '/incidents-hub',
          label: 'Báo cáo sự cố',
          icon: <Activity className="w-5 h-5" />
        },
        {
          path: '/services-hub',
          label: 'Yêu cầu dịch vụ',
          icon: <PlusCircle className="w-5 h-5" />
        }
      );
    }

    if (user.role === 'admin') {
      items.push({
        path: '/admin/management',
        label: 'Quản trị hệ thống',
        icon: <Sliders className="w-5 h-5" />
      });
    }

    items.push({
      path: '/reports',
      label: 'Báo cáo & Thống kê',
      icon: <BarChart3 className="w-5 h-5" />
    });

    items.push({
      path: '/settings',
      label: 'Cài đặt',
      icon: <Settings className="w-5 h-5" />
    });

    return items;
  };

  const menuItems = getMenuItems();

  return (
    <div className="min-h-screen bg-[#070a13] light:bg-slate-50 text-slate-100 light:text-slate-800 flex flex-col font-sans transition-colors duration-300">
      
      {/* Header */}
      <header className="border-b border-slate-800/80 light:border-slate-200 bg-slate-950/60 light:bg-white/80 backdrop-blur-md sticky top-0 z-50 transition-colors duration-300">
        <div className="w-full px-4 md:px-8 py-4 flex items-center justify-between">
          
          {/* Logo & Mobile Trigger */}
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="md:hidden p-2 rounded-lg bg-slate-900/60 light:bg-slate-100 border border-slate-800 light:border-slate-200 hover:bg-slate-800/60 light:hover:bg-slate-200 text-slate-400 light:text-slate-600 hover:text-white light:hover:text-slate-900 transition duration-200 cursor-pointer"
              title="Mở danh mục"
            >
              <Menu className="w-4 h-4" />
            </button>
            <Link to={`/dashboard/${user.role}`} className="flex items-center space-x-3 hover:opacity-90 transition">
              <div className="bg-sky-500/10 p-2 rounded-lg border border-sky-500/20">
                <Activity className="w-6 h-6 text-sky-400" />
              </div>
              <div>
                <span className="text-lg font-bold tracking-tight text-white light:text-slate-900 block">Service Desk</span>
                <span className="text-[10px] text-slate-500 light:text-slate-400 block uppercase tracking-wider font-semibold">Portal</span>
              </div>
            </Link>
          </div>

          {/* User Info & Action */}
          <div className="flex items-center space-x-4 md:space-x-6">
            
            {/* Notification Bell */}
            <NotificationDropdown />

            {/* User Details */}
            <div className="hidden md:flex items-center space-x-4 border-r border-slate-800 light:border-slate-200 pr-6 text-right">
              <div>
                <span className="text-xs text-slate-400 light:text-slate-500 block font-medium">Xin chào,</span>
                <span className="text-sm font-semibold text-slate-200 light:text-slate-800 block">{user.username}</span>
              </div>
              <div className="space-y-1">
                <span className="inline-block text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-sky-500/10 text-sky-400 border border-sky-500/20">
                  {user.role}
                </span>
                {user.location_name && (
                  <span className="flex items-center justify-end text-[10px] text-slate-500 light:text-slate-400">
                    <MapPin className="w-3 h-3 mr-0.5" />
                    {user.location_name}
                  </span>
                )}
              </div>
            </div>

            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg bg-slate-900/60 light:bg-slate-100 border border-slate-800 light:border-slate-200 hover:bg-slate-800/60 light:hover:bg-slate-200 text-slate-400 light:text-slate-600 hover:text-white light:hover:text-slate-900 transition duration-200"
              title="Chuyển chế độ sáng/tối"
            >
              {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
            </button>

            {/* Logout button */}
            <button 
              onClick={handleLogout}
              className="flex items-center space-x-2 px-3.5 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 hover:border-red-500/30 text-red-400 text-xs font-semibold transition duration-200"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Đăng xuất</span>
            </button>

          </div>
        </div>
      </header>

      {/* Main Grid Wrapper */}
      <div className="flex-1 w-full px-4 md:px-8 py-8 flex flex-col md:flex-row gap-8">
        
        {/* Sidebar */}
        <aside className="hidden md:block w-64 shrink-0">
          <div className="bg-slate-900/40 light:bg-white border border-slate-800/80 light:border-slate-200 rounded-2xl p-5 sticky top-24 transition-colors duration-300">
            <h3 className="text-xs font-bold text-slate-500 light:text-slate-400 uppercase tracking-wider mb-4 px-3">Danh mục</h3>
            <nav className="space-y-1.5">
              {menuItems.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition duration-200 ${
                      isActive 
                        ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/10' 
                        : 'text-slate-400 light:text-slate-600 hover:text-slate-200 light:hover:text-slate-900 hover:bg-slate-800/40 light:hover:bg-slate-100'
                    }`}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>

            <div className="mt-8 pt-6 border-t border-slate-800/60 light:border-slate-200 px-3">
              <div className="flex items-center space-x-2 text-xs text-slate-500 light:text-slate-400">
                <Building className="w-3.5 h-3.5" />
                <span>Service Desk System</span>
              </div>
            </div>
          </div>
        </aside>

        {/* Dynamic page content */}
        <main className="flex-1 min-w-0">
          <Outlet />
        </main>

      </div>

      {/* Mobile Sidebar Drawer */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-[150] md:hidden">
          {/* Backdrop overlay */}
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          {/* Drawer Panel */}
          <div className="fixed top-0 left-0 bottom-0 w-64 bg-[#070a13] light:bg-slate-50 border-r border-slate-800 light:border-slate-200 p-5 flex flex-col z-[160] transition-transform duration-300">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-2">
                <Activity className="w-5 h-5 text-sky-400" />
                <span className="text-sm font-bold text-white light:text-slate-900">Service Desk</span>
              </div>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-1.5 rounded-lg bg-slate-900/60 light:bg-slate-100 border border-slate-800 light:border-slate-200 text-slate-400 light:text-slate-655 hover:text-white light:hover:text-slate-950 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <nav className="space-y-1.5 flex-1">
              {menuItems.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition duration-200 ${
                      isActive 
                        ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/10' 
                        : 'text-slate-400 light:text-slate-600 hover:text-slate-200 light:hover:text-slate-900 hover:bg-slate-800/40 light:hover:bg-slate-100'
                    }`}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
            <div className="mt-8 pt-6 border-t border-slate-800/60 light:border-slate-200 px-3">
              <div className="flex items-center space-x-2 text-xs text-slate-500 light:text-slate-400">
                <Building className="w-3.5 h-3.5" />
                <span>Service Desk System</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-slate-800/50 light:border-slate-200 py-6 text-center text-xs text-slate-500 bg-slate-950/20 light:bg-slate-100/40 transition-colors duration-300">
        <p>© 2026 Service Desk Portal. All rights reserved.</p>
      </footer>

    </div>
  );
};

export default AppLayout;
