import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import apiClient from '../../api/client';
import StatusBadge from '../../components/StatusBadge';

function Skeleton() {
  return (
    <div className="max-w-3xl mx-auto space-y-5 animate-pulse">
      <div className="flex justify-between">
        <div className="space-y-2">
          <div className="h-8 w-28 bg-gray-200 rounded" />
          <div className="h-4 w-48 bg-gray-200 rounded" />
        </div>
        <div className="h-6 w-24 bg-gray-200 rounded-full" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="h-28 bg-gray-200 rounded-xl" />
        <div className="h-28 bg-gray-200 rounded-xl" />
      </div>
      <div className="h-40 bg-gray-200 rounded-xl" />
      <div className="h-48 bg-gray-200 rounded-xl" />
    </div>
  );
}

export default function CustomerJobDetail() {
  const { id } = useParams();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchJob = async () => {
    try {
      const res = await apiClient.get(`/jobs/${id}`);
      setJob(res.data);
      setError('');
    } catch (err) {
      setError('Failed to load job details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJob();
    const interval = setInterval(fetchJob, 10000);
    return () => clearInterval(interval);
  }, [id]);

  if (loading) return <Skeleton />;
  if (error) return (
    <div className="max-w-3xl mx-auto text-center py-12">
      <div className="text-4xl mb-3">!</div>
      <p className="text-red-500 text-lg">{error}</p>
      <Link to="/customer" className="text-blue-600 text-sm mt-4 inline-block">Back to Dashboard</Link>
    </div>
  );
  if (!job) return (
    <div className="max-w-3xl mx-auto text-center py-12">
      <p className="text-gray-400 text-lg">Job not found.</p>
      <Link to="/customer" className="text-blue-600 text-sm mt-4 inline-block">Back to Dashboard</Link>
    </div>
  );

  const invoice = job.invoice;

  return (
    <div className="max-w-3xl mx-auto animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Job #{job.id}</h1>
          <p className="text-sm text-gray-500 mt-1">
            {job.vehicle
              ? `${job.vehicle.make} ${job.vehicle.model} (${job.vehicle.reg_number})`
              : `Vehicle #${job.vehicle_id}`}
          </p>
        </div>
        <StatusBadge status={job.status} />
      </div>

      {/* Info cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <h3 className="text-xs text-gray-400 uppercase tracking-wide font-semibold mb-2">Description</h3>
          <p className="text-sm text-gray-700 leading-relaxed">{job.description}</p>
          {job.km_reading && (
            <div className="mt-3 inline-flex items-center gap-1.5 bg-gray-100 rounded-full px-3 py-1 text-xs text-gray-500">
              <span className="font-mono font-bold">{job.km_reading.toLocaleString()}</span> km
            </div>
          )}
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <h3 className="text-xs text-gray-400 uppercase tracking-wide font-semibold mb-2">Status</h3>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-gray-500">Technician:</span>
              {job.technician_name ? (
                <span className="inline-flex items-center gap-1.5 font-medium text-gray-800 bg-blue-50 px-2.5 py-1 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                  {job.technician_name}
                </span>
              ) : (
                <span className="text-gray-400 italic">Not yet assigned</span>
              )}
            </div>
            <p className="text-xs text-gray-400">
              Created: {new Date(job.created_at).toLocaleString()}
            </p>
            {job.completed_at && (
              <p className="text-xs text-gray-400">
                Completed: {new Date(job.completed_at).toLocaleString()}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Items table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-5 overflow-hidden">
        <div className="px-4 sm:px-5 py-3 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold text-sm text-gray-700">Services &amp; Parts</h2>
          <span className="text-xs text-gray-400">{job.items.length} item{job.items.length !== 1 ? 's' : ''}</span>
        </div>
        {job.items.length === 0 ? (
          <p className="px-5 py-8 text-sm text-gray-400 text-center">No items logged yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-gray-400 text-xs uppercase bg-gray-50/50">
                <tr>
                  <th className="px-4 sm:px-5 py-2.5 font-medium">Item</th>
                  <th className="px-4 sm:px-5 py-2.5 font-medium hidden sm:table-cell">Type</th>
                  <th className="px-4 sm:px-5 py-2.5 font-medium text-right">Qty</th>
                  <th className="px-4 sm:px-5 py-2.5 font-medium text-right">Price</th>
                  <th className="px-4 sm:px-5 py-2.5 font-medium text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {job.items.map((item) => (
                  <tr key={item.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition-colors duration-150">
                    <td className="px-4 sm:px-5 py-3 text-gray-700">{item.description}</td>
                    <td className="px-4 sm:px-5 py-3 capitalize text-gray-500 hidden sm:table-cell">
                      <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                        item.item_type === 'service' ? 'bg-purple-50 text-purple-600' : 'bg-amber-50 text-amber-600'
                      }`}>
                        {item.item_type}
                      </span>
                    </td>
                    <td className="px-4 sm:px-5 py-3 text-right">{item.quantity}</td>
                    <td className="px-4 sm:px-5 py-3 text-right text-gray-600">Rs.{item.unit_price.toFixed(2)}</td>
                    <td className="px-4 sm:px-5 py-3 text-right font-semibold text-gray-800">
                      Rs.{(item.quantity * item.unit_price).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Invoice */}
      {invoice && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-5 overflow-hidden">
          <div className="px-4 sm:px-5 py-3 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-semibold text-sm text-gray-700">Invoice</h2>
            <StatusBadge status={invoice.status} />
          </div>
          <div className="px-4 sm:px-5 py-4 space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Subtotal</span>
              <span className="font-medium">Rs.{invoice.subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">GST ({invoice.gst_percent}%)</span>
              <span>Rs.{invoice.gst_amount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-bold text-base border-t border-gray-100 pt-3">
              <span>Total</span>
              <span className="text-green-700">Rs.{invoice.total.toFixed(2)}</span>
            </div>
            {invoice.payment_mode && (
              <div className="flex items-center gap-2 text-xs text-gray-400 bg-gray-50 rounded-lg px-3 py-2">
                <span>Payment:</span>
                <span className="uppercase font-medium text-gray-600">{invoice.payment_mode}</span>
              </div>
            )}
            {invoice.paid_at && (
              <div className="flex items-center gap-2 text-xs text-green-600 bg-green-50 rounded-lg px-3 py-2">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                Paid on {new Date(invoice.paid_at).toLocaleDateString()}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-wrap items-center gap-4 text-sm">
        <button
          onClick={fetchJob}
          className="text-blue-600 font-medium hover:text-blue-700 transition-colors duration-200 px-4 py-2.5 rounded-lg hover:bg-blue-50 active:scale-95 min-h-[44px]"
        >
          Refresh now
        </button>
        <Link
          to="/customer"
          className="inline-flex items-center gap-1.5 text-gray-500 hover:text-gray-700 transition-colors duration-200 min-h-[44px]"
        >
          <span className="text-lg leading-none">&larr;</span> Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
