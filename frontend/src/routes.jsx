import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './auth/ProtectedRoute';

// Public
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';

// Customer
import CustomerDashboard from './pages/customer/DashboardPage';
import NewVehiclePage from './pages/customer/NewVehiclePage';
import NewJobPage from './pages/customer/NewJobPage';
import CustomerJobDetail from './pages/customer/JobDetailPage';
import HistoryPage from './pages/customer/HistoryPage';

// Admin
import AdminDashboard from './pages/admin/DashboardPage';
import AdminJobDetail from './pages/admin/JobDetailPage';
import UsersPage from './pages/admin/UsersPage';

// Technician
import TechnicianDashboard from './pages/technician/DashboardPage';
import TechnicianJobDetail from './pages/technician/JobDetailPage';

export default function AppRoutes() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* Customer */}
      <Route
        path="/customer"
        element={
          <ProtectedRoute allowedRoles={['customer']}>
            <CustomerDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/customer/vehicles/new"
        element={
          <ProtectedRoute allowedRoles={['customer']}>
            <NewVehiclePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/customer/jobs/new"
        element={
          <ProtectedRoute allowedRoles={['customer']}>
            <NewJobPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/customer/jobs/:id"
        element={
          <ProtectedRoute allowedRoles={['customer']}>
            <CustomerJobDetail />
          </ProtectedRoute>
        }
      />
      <Route
        path="/customer/history"
        element={
          <ProtectedRoute allowedRoles={['customer']}>
            <HistoryPage />
          </ProtectedRoute>
        }
      />

      {/* Admin */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/jobs/:id"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminJobDetail />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/users"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <UsersPage />
          </ProtectedRoute>
        }
      />

      {/* Technician */}
      <Route
        path="/technician"
        element={
          <ProtectedRoute allowedRoles={['technician']}>
            <TechnicianDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/technician/jobs/:id"
        element={
          <ProtectedRoute allowedRoles={['technician']}>
            <TechnicianJobDetail />
          </ProtectedRoute>
        }
      />

      {/* Fallback: redirect to login */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
