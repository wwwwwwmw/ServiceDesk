import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import AppLayout from './layouts/AppLayout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import CreateTicket from './pages/CreateTicket';
import TicketDetail from './pages/TicketDetail';
import ServicesHub from './pages/ServicesHub';
import IncidentsHub from './pages/IncidentsHub';
import Settings from './pages/Settings';
import ManageUsers from './pages/ManageUsers';
import ManageLocations from './pages/ManageLocations';
import ManageCategories from './pages/ManageCategories';
import ManageTemplates from './pages/ManageTemplates';
import ManageGuides from './pages/ManageGuides';
import UserForm from './pages/UserForm';
import LocationForm from './pages/LocationForm';
import CategoryForm from './pages/CategoryForm';
import TemplateForm from './pages/TemplateForm';
import GuideForm from './pages/GuideForm';
import ManageHub from './pages/ManageHub';

// Component phụ điều hướng trang chủ dựa trên trạng thái đăng nhập
const HomeRedirect = () => {
  const { user } = useAuth();
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return <Navigate to={`/dashboard/${user.role}`} replace />;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Route công khai */}
          <Route path="/login" element={<Login />} />

          {/* Route bảo mật cho mọi user */}
          <Route element={<ProtectedRoute allowedRoles={['admin', 'manager', 'employee', 'user']} />}>
            <Route element={<AppLayout />}>
              <Route path="/dashboard/:role" element={<Dashboard />} />
              <Route path="/ticket/:id" element={<TicketDetail />} />
              <Route path="/create-ticket" element={<CreateTicket />} />
              <Route path="/services-hub" element={<ServicesHub />} />
              <Route path="/incidents-hub" element={<IncidentsHub />} />
              <Route path="/settings" element={<Settings />} />
            </Route>
          </Route>

          {/* Route bảo mật riêng cho Admin */}
          <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
            <Route element={<AppLayout />}>
              <Route path="/admin/management" element={<ManageHub />} />
              <Route path="/admin/users" element={<ManageUsers />} />
              <Route path="/admin/users/create" element={<UserForm />} />
              <Route path="/admin/users/edit/:id" element={<UserForm />} />
              
              <Route path="/admin/locations" element={<ManageLocations />} />
              <Route path="/admin/locations/create" element={<LocationForm />} />
              <Route path="/admin/locations/edit/:id" element={<LocationForm />} />
              
              <Route path="/admin/categories" element={<ManageCategories />} />
              <Route path="/admin/categories/create" element={<CategoryForm />} />
              <Route path="/admin/categories/edit/:id" element={<CategoryForm />} />
              
              <Route path="/admin/templates" element={<ManageTemplates />} />
              <Route path="/admin/templates/create" element={<TemplateForm />} />
              <Route path="/admin/templates/edit/:id" element={<TemplateForm />} />
              
              <Route path="/admin/guides" element={<ManageGuides />} />
              <Route path="/admin/guides/create" element={<GuideForm />} />
              <Route path="/admin/guides/edit/:id" element={<GuideForm />} />
            </Route>
          </Route>

          {/* Điều hướng trang chủ */}
          <Route path="/" element={<HomeRedirect />} />
          
          {/* Fallback route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
