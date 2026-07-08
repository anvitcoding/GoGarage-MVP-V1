import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import apiClient from '../../api/client';
import StatusBadge from '../../components/StatusBadge';

const PAYMENT_MODES = ['cash', 'upi', 'card'];

function Skeleton() {
  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-pulse">
      <div className="flex justify-between">
        <div className="space-y-2">
          <div className="h-8 w-32 bg-gray-200 rounded" />
          <div className="h-4 w-64 bg-gray-200 rounded" />
        </div>
        <div className="h-6 w-20 bg-gray-200 rounded-full" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="h-32 bg-gray-200 rounded-xl" />
        <div className="h-32 bg-gray-200 rounded-xl" />
      </div>
      <div className="h-24 bg-gray-200 rounded-xl" />
      <div className="h-48 bg-gray-200 rounded-xl" />
    </div>
  );
}

function InfoCard({ icon, label, children }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-5 hover:shadow-md transition-shadow duration-300">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-lg">{icon}</span>
        <h3 className="font-semibold text-sm text-gray-600 uppercase tracking-wide">{label}</h3>
      </div>
      {children}
    </div>
  );
}

export default function AdminJobDetail() {
  const { id } = useParams();
  const [job, setJob] = useState(null);
  const [technicians, setTechnicians] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');
  const [selectedTech, setSelectedTech] = useState('');
  const [assigning, setAssigning] = useState(false);
  const [paymentMode, setPaymentMode] = useState('cash');
  const [paying, setPaying] = useState(false);
  const [changingStatus, setChangingStatus] = useState(false);

  const fetchJob = async () => {
    try {
      const res = await apiClient.get(`/jobs/${id}`);
      setJob(res.data);
      setError('');
    } catch (err) {
      setError('Failed to load job');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJob();
    apiClient.get('/users').then((res) => {
      setTechnicians(res.data.filter((u) => u.role === 'technician' && u.is_active));
    }).catch(() => {});
    const interval = setInterval(fetchJob, 10000);
    return () => clearInterval(interval);
  }, [id]);

  const handleAssign = async (e) => {
    e.preventDefault();
    if (!selectedTech) return;
    setAssigning(true);
    setActionError('');
    try {
      const res = await apiClient.patch(`/jobs/${id}`, {
        technician_id: parseInt(selectedTech),
      });
      setJob(res.data);
    } catch (err) {
      setActionError(err.response?.data?.detail || 'Failed to assign');
    } finally {
      setAssigning(false);
    }
  };

  const handleStatusChange = async (newStatus) => {
    setChangingStatus(true);
    setActionError('');
    try {
      const res = await apiClient.patch(`/jobs/${id}`, { status: newStatus });
      setJob(res.data);
    } catch (err) {
      setActionError(err.response?.data?.detail || 'Failed to update status');
    } finally {
      setChangingStatus(false);
    }
  };

  const handleMarkPaid = async () => {
    if (!job?.invoice) return;
    setPaying(true);
    setActionError('');
    try {
      await apiClient.patch(`/invoices/${job.invoice.id}`, {
        status: 'paid',
        payment_mode: paymentMode,
      });
      await fetchJob();
    } catch (err) {
      setActionError(err.response?.data?.detail || 'Failed to mark paid');
    } finally {
      setPaying(false);
    }
  };

  if (loading) return <Skeleton />;
  if (error) return (
    <div className="max-w-4xl mx-auto text-center py-12">
      <div className="text-4xl mb-3">!</div>
      <p className="text-red-500 text-lg">{error}</p>
      <Link to="/admin" className="text-blue-600 text-sm mt-4 inline-block">Back to Dashboard</Link>
    </div>
  );
  if (!job) return (
    <div className="max-w-4xl mx-auto text-center py-12">
      <p className="text-gray-400 text-lg">Job not found.</p>
      <Link to="/admin" className="text-blue-600 text-sm mt-4 inline-block">Back to Dashboard</Link>
    </div>
  );

  const invoice = job.invoice;
  const isCompleted = job.status === 'completed';

  return (
    <div className="max-w-4xl mx-auto animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Job #{job.id}</h1>
          <p className="text-sm text-gray-500 mt-1">
            {job.vehicle
              ? `${job.vehicle.make} ${job.vehicle.model} (${job.vehicle.reg_number})`
              : `Vehicle #${job.vehicle_id}`}{' '}
            · Customer: <span className="text-gray-700 font-medium">{job.customer_name}</span>
          </p>
        </div>
        <StatusBadge status={job.status} />
      </div>

      {actionError && (
        <p className="text-red-600 text-sm mb-4 bg-red-50 border border-red-200 rounded-lg px-4 py-3 animate-shake">
          {actionError}
        </p>
      )}

      {/* Admin controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <InfoCard icon="&#x1F527;" label="Assign Technician">
          {job.technician_name ? (
            <p className="text-sm text-gray-600 mb-3">
              Currently:{' '}
              <span className="inline-flex items-center gap-1.5 font-medium text-gray-800 bg-blue-50 px-2.5 py-1 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                {job.technician_name}
              </span>
            </p>
          ) : (
            <p className="text-sm text-gray-400 mb-3 italic">Not yet assigned</p>
          )}
          <form onSubmit={handleAssign} className="flex flex-col sm:flex-row gap-2">
            <select
              value={selectedTech}
              onChange={(e) => setSelectedTech(e.target.value)}
              className="flex-1 border border-gray-200 rounded-lg px-3 py-2.5 text-sm bg-gray-50 focus:bg-white focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none transition-all duration-200"
            >
              <option value="">— Select technician —</option>
              {technicians.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.email})
                </option>
              ))}
            </select>
            <button
              type="submit"
              disabled={!selectedTech || assigning}
              className="bg-blue-600 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 min-w-[90px]"
            >
              {assigning ? (
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ...
                </span>
              ) : 'Assign'}
            </button>
          </form>
        </InfoCard>

        <InfoCard icon="&#x1F504;" label="Update Status">
          <div className="flex flex-wrap gap-2">
            {job.status === 'created' && (
              <button
                onClick={() => handleStatusChange('in_progress')}
                disabled={changingStatus || !job.technician_id}
                className="bg-blue-600 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                title={!job.technician_id ? 'Assign a technician first' : ''}
              >
                {changingStatus ? (
                  <span className="inline-flex items-center gap-1.5">
                    <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ...
                  </span>
                ) : 'Start (In Progress)'}
              </button>
            )}
            {job.status === 'in_progress' && (
              <button
                onClick={() => handleStatusChange('completed')}
                disabled={changingStatus}
                className="bg-green-600 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-green-700 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                {changingStatus ? (
                  <span className="inline-flex items-center gap-1.5">
                    <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ...
                  </span>
                ) : 'Mark Completed'}
              </button>
            )}
            {isCompleted && (
              <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 px-3 py-1.5 rounded-lg">
                <span className="w-2 h-2 rounded-full bg-green-500" />
                Job completed
              </div>
            )}
          </div>
        </InfoCard>
      </div>

      {/* Description */}
      <InfoCard icon="&#x1F4DD;" label="Description">
        <p className="text-sm text-gray-700 leading-relaxed">{job.description}</p>
        <div className="flex flex-wrap gap-x-6 gap-y-1 mt-3 text-xs text-gray-400">
          {job.km_reading && <span>KM: {job.km_reading.toLocaleString()}</span>}
          <span>Created: {new Date(job.created_at).toLocaleString()}</span>
          {job.completed_at && <span>Completed: {new Date(job.completed_at).toLocaleString()}</span>}
        </div>
      </InfoCard>

      {/* Items table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-6 overflow-hidden">
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
                      <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${item.item_type === 'service' ? 'bg-purple-50 text-purple-600' : 'bg-amber-50 text-amber-600'}`}>
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
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-6 overflow-hidden">
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

            {invoice.status === 'unpaid' && isCompleted && (
              <div className="border-t border-gray-100 pt-3 mt-3">
                <p className="text-xs text-gray-500 mb-2 font-medium">Mark as paid:</p>
                <div className="flex flex-col sm:flex-row gap-2">
                  <select
                    value={paymentMode}
                    onChange={(e) => setPaymentMode(e.target.value)}
                    className="flex-1 border border-gray-200 rounded-lg px-3 py-2.5 text-sm bg-gray-50 focus:bg-white focus:border-green-400 focus:ring-2 focus:ring-green-100 outline-none transition-all duration-200"
                  >
                    {PAYMENT_MODES.map((pm) => (
                      <option key={pm} value={pm}>{pm.toUpperCase()}</option>
                    ))}
                  </select>
                  <button
                    onClick={handleMarkPaid}
                    disabled={paying}
                    className="bg-green-600 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-green-700 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                  >
                    {paying ? (
                      <span className="inline-flex items-center gap-1.5">
                        <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ...
                      </span>
                    ) : 'Mark Paid'}
                  </button>
                </div>
              </div>
            )}
            {invoice.paid_at && (
              <div className="flex items-center gap-2 text-xs text-green-600 bg-green-50 rounded-lg px-3 py-2 mt-2">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                Paid on {new Date(invoice.paid_at).toLocaleDateString()} via{' '}
                <span className="uppercase font-medium">{invoice.payment_mode}</span>
              </div>
            )}
          </div>
        </div>
      )}

      <Link
        to="/admin"
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors duration-200"
      >
        <span className="text-lg leading-none">&larr;</span> Back to Dashboard
      </Link>
    </div>
  );
}
