import { useState, useEffect } from 'react';
import apiClient from '../../api/client';

const ROLES = ['technician', 'admin'];

function Skeleton() {
  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-pulse">
      <div className="h-8 w-40 bg-gray-200 rounded" />
      <div className="h-40 bg-gray-200 rounded-xl" />
      <div className="h-64 bg-gray-200 rounded-xl" />
    </div>
  );
}

function UserRow({ u, onToggle }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 px-4 sm:px-5 py-3 border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition-colors duration-150 group">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-800 truncate">{u.name}</p>
        <p className="text-xs text-gray-400 truncate">{u.email}</p>
      </div>
      <div className="flex items-center gap-3 sm:gap-4">
        <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${
          u.role === 'admin' ? 'bg-purple-50 text-purple-600' : 'bg-blue-50 text-blue-600'
        }`}>
          {u.role}
        </span>
        <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${
          u.is_active ? 'text-green-600' : 'text-red-500'
        }`}>
          <span className={`w-1.5 h-1.5 rounded-full ${u.is_active ? 'bg-green-500 animate-[pulse_2s_ease-in-out_infinite]' : 'bg-red-400'}`} />
          {u.is_active ? 'Active' : 'Inactive'}
        </span>
        <button
          onClick={() => onToggle(u)}
          className={`text-xs font-medium px-3 py-1.5 rounded-lg transition-all duration-200 active:scale-95 ${
            u.is_active
              ? 'text-red-600 hover:bg-red-50 hover:text-red-700'
              : 'text-green-600 hover:bg-green-50 hover:text-green-700'
          }`}
        >
          {u.is_active ? 'Deactivate' : 'Activate'}
        </button>
      </div>
    </div>
  );
}

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', role: 'technician' });
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');
  const [createOk, setCreateOk] = useState('');

  const fetchUsers = async () => {
    try {
      const res = await apiClient.get('/users');
      setUsers(res.data);
      setError('');
    } catch (err) {
      setError('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setCreateError('');
    setCreateOk('');
    setCreating(true);
    try {
      await apiClient.post('/users', { ...form, phone: form.phone || null });
      setForm({ name: '', email: '', phone: '', password: '', role: 'technician' });
      setCreateOk('User created successfully');
      fetchUsers();
    } catch (err) {
      setCreateError(err.response?.data?.detail || 'Failed to create user');
    } finally {
      setCreating(false);
    }
  };

  const handleToggleActive = async (user) => {
    try {
      await apiClient.patch(`/users/${user.id}`, { is_active: !user.is_active });
      fetchUsers();
    } catch (err) {
      setError('Failed to update user');
    }
  };

  if (loading) return <Skeleton />;

  return (
    <div className="max-w-4xl mx-auto animate-fadeIn">
      <h1 className="text-2xl font-bold tracking-tight mb-6">Manage Users</h1>

      {error && (
        <p className="text-red-600 text-sm mb-4 bg-red-50 border border-red-200 rounded-lg px-4 py-3">{error}</p>
      )}

      {/* Create staff form */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-5 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-lg">&#x1F465;</span>
          <h2 className="font-semibold text-sm text-gray-700 uppercase tracking-wide">Create Staff Account</h2>
        </div>
        {createError && (
          <p className="text-red-600 text-sm mb-3 bg-red-50 border border-red-200 rounded-lg px-3 py-2 animate-shake">
            {createError}
          </p>
        )}
        {createOk && (
          <p className="text-green-600 text-sm mb-3 bg-green-50 border border-green-200 rounded-lg px-3 py-2 animate-fadeIn">
            {createOk}
          </p>
        )}
        <form onSubmit={handleCreate} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <input
            placeholder="Full Name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm bg-gray-50 focus:bg-white focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none transition-all duration-200"
            required
          />
          <input
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm bg-gray-50 focus:bg-white focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none transition-all duration-200"
            required
          />
          <input
            type="password"
            placeholder="Password (min 6 chars)"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm bg-gray-50 focus:bg-white focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none transition-all duration-200"
            required
            minLength={6}
          />
          <input
            type="tel"
            placeholder="Phone (optional)"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm bg-gray-50 focus:bg-white focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none transition-all duration-200"
          />
          <select
            value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value })}
            className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm bg-gray-50 focus:bg-white focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none transition-all duration-200"
          >
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {r.charAt(0).toUpperCase() + r.slice(1)}
              </option>
            ))}
          </select>
          <button
            type="submit"
            disabled={creating}
            className="bg-blue-600 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 sm:col-span-2 lg:col-span-1"
          >
            {creating ? (
              <span className="inline-flex items-center gap-1.5">
                <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Creating...
              </span>
            ) : 'Create Staff'}
          </button>
        </form>
      </div>

      {/* User list */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-4 sm:px-5 py-3 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold text-sm text-gray-700">
            All Users
          </h2>
          <span className="text-xs text-gray-400 bg-gray-100 px-2.5 py-0.5 rounded-full font-medium">
            {users.length}
          </span>
        </div>
        {/* Desktop table header */}
        <div className="hidden sm:flex items-center px-5 py-2 bg-gray-50/50 text-xs text-gray-400 uppercase font-medium border-b border-gray-100">
          <span className="flex-1">User</span>
          <span className="w-20 text-center">Role</span>
          <span className="w-20 text-center">Status</span>
          <span className="w-24 text-right">Action</span>
        </div>
        {users.map((u) => (
          <UserRow key={u.id} u={u} onToggle={handleToggleActive} />
        ))}
      </div>
    </div>
  );
}
