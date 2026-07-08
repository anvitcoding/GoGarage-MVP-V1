import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../../api/client';
import StatusBadge from '../../components/StatusBadge';

function Skeleton() {
  return (
    <div className="max-w-3xl mx-auto space-y-4 animate-pulse">
      <div className="h-8 w-40 bg-gray-200 rounded" />
      {[1, 2, 3].map((i) => (
        <div key={i} className="h-28 bg-gray-200 rounded-xl" />
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="text-center py-16 bg-white rounded-xl border border-dashed border-gray-200 animate-fadeIn">
      <div className="text-5xl mb-4 opacity-30">&#x1F4CB;</div>
      <h2 className="text-lg font-semibold text-gray-600 mb-1">No service history yet</h2>
      <p className="text-gray-400 text-sm mb-4">Completed jobs and invoices will appear here.</p>
      <Link
        to="/customer/jobs/new"
        className="text-green-600 text-sm font-medium hover:text-green-700 transition-colors duration-200"
      >
        Request your first service
      </Link>
    </div>
  );
}

export default function HistoryPage() {
  const [jobs, setJobs] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      apiClient.get('/jobs'),
      apiClient.get('/invoices'),
    ])
      .then(([jRes, iRes]) => {
        setJobs(jRes.data.filter((j) => j.status === 'completed'));
        setInvoices(iRes.data);
      })
      .catch(() => setError('Failed to load history'))
      .finally(() => setLoading(false));
  }, []);

  const invoiceByJob = {};
  invoices.forEach((inv) => {
    invoiceByJob[inv.job_id] = inv;
  });

  if (loading) return <Skeleton />;
  if (error) return (
    <div className="max-w-3xl mx-auto text-center py-12">
      <p className="text-red-500">{error}</p>
      <Link to="/customer" className="text-blue-600 text-sm mt-4 inline-block">Back to Dashboard</Link>
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto animate-fadeIn">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Service History</h1>
          <p className="text-sm text-gray-400 mt-1">
            {jobs.length} completed job{jobs.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Link
          to="/customer"
          className="text-sm text-gray-500 hover:text-gray-700 transition-colors duration-200"
        >
          Back to Dashboard
        </Link>
      </div>

      {jobs.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="space-y-3">
          {jobs.map((job) => {
            const inv = invoiceByJob[job.id];
            return (
              <Link
                key={job.id}
                to={`/customer/jobs/${job.id}`}
                className="block bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-5 hover:shadow-md hover:scale-[1.005] active:scale-[0.995] transition-all duration-200 group"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                  <h3 className="font-semibold text-gray-800 group-hover:text-blue-600 transition-colors duration-200">
                    Job #{job.id} — {job.vehicle_reg_number || `Vehicle #${job.vehicle_id}`}
                  </h3>
                  <div className="flex items-center gap-2">
                    <StatusBadge status="completed" />
                    {inv && <StatusBadge status={inv.status} />}
                  </div>
                </div>
                <p className="text-sm text-gray-600 mb-3 line-clamp-2 leading-relaxed">
                  {job.description}
                </p>
                <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-gray-400">
                  <span>
                    Completed:{' '}
                    <span className="text-gray-500 font-medium">
                      {job.completed_at
                        ? new Date(job.completed_at).toLocaleDateString()
                        : '—'}
                    </span>
                  </span>
                  {inv && (
                    <>
                      <span>
                        Total:{' '}
                        <span className="text-green-600 font-bold">
                          Rs.{inv.total.toFixed(2)}
                        </span>
                      </span>
                    </>
                  )}
                  {job.technician_name && (
                    <span>Tech: {job.technician_name}</span>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
