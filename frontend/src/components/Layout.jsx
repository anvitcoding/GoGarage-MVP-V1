import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

const NAV_ITEMS = {
  customer: [
    { to: '/customer', label: 'Dashboard' },
    { to: '/customer/vehicles/new', label: 'Add Vehicle' },
    { to: '/customer/jobs/new', label: 'Request Service' },
    { to: '/customer/history', label: 'History' },
  ],
  admin: [
    { to: '/admin', label: 'Job Board' },
    { to: '/admin/users', label: 'Users' },
  ],
  technician: [
    { to: '/technician', label: 'My Jobs' },
  ],
};

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const items = user ? (NAV_ITEMS[user.role] || []) : [];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <nav className="bg-blue-600 text-white shadow-md">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link
              to={user ? `/${user.role}` : '/login'}
              className="flex items-center gap-2.5 font-bold text-lg hover:opacity-90 transition-opacity duration-200"
            >
              GoGarage
            </Link>
            {items.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="text-sm text-blue-100 hover:text-white transition-colors duration-200"
              >
                {item.label}
              </Link>
            ))}
          </div>
          {user && (
            <div className="flex items-center gap-4 text-sm">
              <span className="text-blue-100">
                {user.name}{' '}
                <span className="text-blue-200 text-xs uppercase">({user.role})</span>
              </span>
              <button
                onClick={handleLogout}
                className="bg-blue-700 hover:bg-blue-800 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors duration-200 active:scale-95"
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </nav>

      {/* Page content */}
      <main className="max-w-6xl mx-auto px-4 py-6">{children}</main>
    </div>
  );
}
