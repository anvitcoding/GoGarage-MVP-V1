import { Navigate } from 'react-router-dom';
import { useAuth } from './AuthContext';

const ROLE_REDIRECTS = {
  admin: '/admin',
  technician: '/technician',
  customer: '/customer',
};

export default function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-400 text-lg">Loading...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirect to the user's own dashboard
    const fallback = ROLE_REDIRECTS[user.role] || '/login';
    return <Navigate to={fallback} replace />;
  }

  return children;
}
