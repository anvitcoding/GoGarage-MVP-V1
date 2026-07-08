import { useState, useEffect } from 'react';
import apiClient from '../../api/client';
import StatusBadge from '../../components/StatusBadge';

const COLUMNS = [
  { key: 'created', label: 'Created', color: 'bg-gray-50', border: 'border-gray-200', dot: 'bg-gray-400' },
  { key: 'in_progress', label: 'In Progress', color: 'bg-blue-50/60', border: 'border-blue-200', dot: 'bg-blue-500' },
  { key: 'completed', label: 'Completed', color: 'bg-green-50/60', border: 'border-green-200', dot: 'bg-green-500' },
];

function Skeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="h-8 w-48 bg-gray-200 rounded" />
        <div className="h-8 w-32 bg-gray-200 rounded" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-lg p-3 bg-gray-100 min-h-[200px] space-y-3">
            <div className="flex justify-between">
              <div className="h-4 w-20 bg-gray-200 rounded" />
              <div className="h-4 w-8 bg-gray-200 rounded-full" />
            </div>
            <div className="h-20 bg-gray-200 rounded" />
            <div className="h-20 bg-gray-200 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const [jobs, setJobs] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAll, setShowAll] = useState(false);

  const fetchData = async () => {
    try {
      const [jRes, iRes] = await Promise.all([
        apiClient.get('/jobs'),
        apiClient.get('/invoices'),
      ]);
      setJobs(jRes.data);
      setInvoices(iRes.data);
      setError('');
    } catch (err) {
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const revenue = invoices
    .filter((inv) => inv.status === 'paid')
    .reduce((sum, inv) => sum + inv.total, 0);

  if (loading) return <Skeleton />;

  return (
    <div className="animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Admin Dashboard</h1>
        <div className="flex items-center gap-3">
          <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-2 text-right">
            <p className="text-xs text-green-600 font-medium uppercase tracking-wide">Revenue (Paid)</p>
            <p className="text-xl font-bold text-green-700 tabular-nums">
              Rs.{revenue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </p>
          </div>
          <button
            onClick={fetchData}
            className="text-sm text-gray-500 px-4 py-2 rounded-lg border border-gray-200 hover:bg-gray-100 hover:border-gray-300 active:scale-95 transition-all duration-200"
          >
            Refresh
          </button>
        </div>
      </div>

      {error && (
        <p className="text-red-600 text-sm mb-4 bg-red-50 border border-red-200 rounded-lg px-4 py-3 animate-shake">
          {error}
        </p>
      )}

      {/* Toggle */}
      <label className="inline-flex items-center gap-3 text-sm text-gray-600 mb-6 cursor-pointer select-none">
        <div className="relative">
          <input
            type="checkbox"
            checked={showAll}
            onChange={(e) => setShowAll(e.target.checked)}
            className="sr-only peer"
          />
          <div className="w-9 h-5 bg-gray-200 rounded-full peer-checked:bg-blue-600 transition-colors duration-200" />
          <div className="absolute left-0.5 top-0.5 w-4 h-4 bg-white rounded-full shadow peer-checked:translate-x-4 transition-transform duration-200" />
        </div>
        Show all jobs (including completed)
      </label>

      {/* 3-column board */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {COLUMNS.map((col) => {
          const columnJobs = jobs.filter((j) => {
            if (j.status !== col.key) return false;
            if (!showAll && col.key === 'completed') return false;
            return true;
          });

          return (
            <div
              key={col.key}
              className={`rounded-xl ${col.color} border ${col.border} min-h-[200px] transition-all duration-300`}
            >
              <div className="flex items-center justify-between px-4 py-3 border-b border-inherit">
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${col.dot}`} />
                  <h2 className="font-semibold text-sm uppercase tracking-wide text-gray-700">
                    {col.label}
                  </h2>
                </div>
                <span className="text-xs font-medium text-gray-500 bg-white/80 px-2.5 py-0.5 rounded-full shadow-sm">
                  {columnJobs.length}
                </span>
              </div>
              <div className="p-2 space-y-2">
                {columnJobs.map((job) => (
                  <a
                    key={job.id}
                    href={`/admin/jobs/${job.id}`}
                    className="block bg-white rounded-lg shadow-sm border border-gray-100 p-3 hover:shadow-md hover:scale-[1.01] active:scale-[0.99] transition-all duration-200 cursor-pointer"
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-mono text-gray-400">#{job.id}</span>
                      <StatusBadge status={job.status} />
                    </div>
                    <p className="text-sm text-gray-700 line-clamp-2 mb-1.5 leading-snug">
                      {job.description}
                    </p>
                    <div className="text-xs text-gray-400 space-y-0.5">
                      <p className="font-medium text-gray-500">
                        {job.vehicle_reg_number || `Vehicle #${job.vehicle_id}`}
                      </p>
                      {job.customer_name && <p>{job.customer_name}</p>}
                      {job.technician_name && (
                        <p className="text-blue-600">Tech: {job.technician_name}</p>
                      )}
                    </div>
                  </a>
                ))}
                {columnJobs.length === 0 && (
                  <div className="text-center py-8">
                    <div className="text-3xl mb-2 opacity-30">—</div>
                    <p className="text-xs text-gray-400">No jobs</p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
