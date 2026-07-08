import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import apiClient from '../../api/client';
import StatusBadge from '../../components/StatusBadge';

const ITEM_TYPES = ['service', 'part'];

function Skeleton() {
  return (
    <div className="max-w-3xl mx-auto space-y-5 animate-pulse">
      <div className="flex justify-between">
        <div className="space-y-2">
          <div className="h-8 w-28 bg-gray-200 rounded" />
          <div className="h-4 w-56 bg-gray-200 rounded" />
        </div>
        <div className="h-6 w-24 bg-gray-200 rounded-full" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="h-28 bg-gray-200 rounded-xl" />
        <div className="h-28 bg-gray-200 rounded-xl" />
      </div>
      <div className="h-32 bg-gray-200 rounded-xl" />
      <div className="h-40 bg-gray-200 rounded-xl" />
    </div>
  );
}

export default function TechnicianJobDetail() {
  const { id } = useParams();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');

  const [itemForm, setItemForm] = useState({
    description: '',
    item_type: 'service',
    quantity: 1,
    unit_price: '',
  });
  const [addingItem, setAddingItem] = useState(false);
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
    const interval = setInterval(fetchJob, 10000);
    return () => clearInterval(interval);
  }, [id]);

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

  const handleAddItem = async (e) => {
    e.preventDefault();
    if (!itemForm.description || !itemForm.unit_price) return;
    setAddingItem(true);
    setActionError('');
    try {
      const res = await apiClient.post(`/jobs/${id}/items`, {
        description: itemForm.description,
        item_type: itemForm.item_type,
        quantity: parseInt(itemForm.quantity),
        unit_price: parseFloat(itemForm.unit_price),
      });
      setJob((prev) => ({ ...prev, items: [...prev.items, res.data] }));
      setItemForm({ description: '', item_type: 'service', quantity: 1, unit_price: '' });
    } catch (err) {
      setActionError(err.response?.data?.detail || 'Failed to add item');
    } finally {
      setAddingItem(false);
    }
  };

  const handleRemoveItem = async (itemId) => {
    setActionError('');
    try {
      await apiClient.delete(`/jobs/${id}/items/${itemId}`);
      setJob((prev) => ({
        ...prev,
        items: prev.items.filter((item) => item.id !== itemId),
      }));
    } catch (err) {
      setActionError(err.response?.data?.detail || 'Failed to remove item');
    }
  };

  if (loading) return <Skeleton />;
  if (error) return (
    <div className="max-w-3xl mx-auto text-center py-12">
      <div className="text-4xl mb-3">!</div>
      <p className="text-red-500 text-lg">{error}</p>
      <Link to="/technician" className="text-blue-600 text-sm mt-4 inline-block">Back to My Jobs</Link>
    </div>
  );
  if (!job) return (
    <div className="max-w-3xl mx-auto text-center py-12">
      <p className="text-gray-400 text-lg">Job not found.</p>
      <Link to="/technician" className="text-blue-600 text-sm mt-4 inline-block">Back to My Jobs</Link>
    </div>
  );

  const isCompleted = job.status === 'completed';
  const itemsTotal = job.items.reduce(
    (sum, item) => sum + item.quantity * item.unit_price, 0,
  );

  return (
    <div className="max-w-3xl mx-auto animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Job #{job.id}</h1>
          <p className="text-sm text-gray-500 mt-1">
            {job.vehicle
              ? `${job.vehicle.make} ${job.vehicle.model} (${job.vehicle.reg_number})`
              : `Vehicle #${job.vehicle_id}`}{' '}
            · <span className="text-gray-700 font-medium">{job.customer_name}</span>
          </p>
        </div>
        <StatusBadge status={job.status} />
      </div>

      {actionError && (
        <p className="text-red-600 text-sm mb-4 bg-red-50 border border-red-200 rounded-lg px-4 py-3 animate-shake">
          {actionError}
        </p>
      )}

      {/* Description + Status */}
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
          <h3 className="text-xs text-gray-400 uppercase tracking-wide font-semibold mb-3">Update Status</h3>
          {isCompleted ? (
            <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 rounded-lg px-3 py-2.5">
              <span className="w-2 h-2 rounded-full bg-green-500" />
              Job completed
            </div>
          ) : (
            <div className="space-y-2">
              {job.status === 'created' && (
                <button
                  onClick={() => handleStatusChange('in_progress')}
                  disabled={changingStatus}
                  className="w-full bg-blue-600 text-white px-5 py-3 rounded-xl text-sm font-semibold hover:bg-blue-700 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 min-h-[48px] shadow-sm hover:shadow-md"
                >
                  {changingStatus ? (
                    <span className="inline-flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Starting...
                    </span>
                  ) : 'Start Working'}
                </button>
              )}
              {job.status === 'in_progress' && (
                <button
                  onClick={() => handleStatusChange('completed')}
                  disabled={changingStatus}
                  className="w-full bg-green-600 text-white px-5 py-3 rounded-xl text-sm font-semibold hover:bg-green-700 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 min-h-[48px] shadow-sm hover:shadow-md"
                >
                  {changingStatus ? (
                    <span className="inline-flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Completing...
                    </span>
                  ) : 'Mark Completed'}
                </button>
              )}
            </div>
          )}
          <p className="text-xs text-gray-400 mt-3">
            Created: {new Date(job.created_at).toLocaleDateString()}
          </p>
        </div>
      </div>

      {/* Add item form — hidden when completed */}
      {!isCompleted && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-5">
          <h3 className="text-xs text-gray-400 uppercase tracking-wide font-semibold mb-3">
            Add Service / Part
          </h3>
          <form onSubmit={handleAddItem} className="space-y-3">
            <input
              placeholder="What was done? (e.g. Oil filter replaced)"
              value={itemForm.description}
              onChange={(e) => setItemForm({ ...itemForm, description: e.target.value })}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm bg-gray-50 focus:bg-white focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none transition-all duration-200 min-h-[48px]"
              required
              maxLength={200}
            />
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <select
                value={itemForm.item_type}
                onChange={(e) => setItemForm({ ...itemForm, item_type: e.target.value })}
                className="border border-gray-200 rounded-xl px-3 py-3 text-sm bg-gray-50 focus:bg-white focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none transition-all duration-200 min-h-[48px]"
              >
                {ITEM_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </option>
                ))}
              </select>
              <input
                type="number"
                placeholder="Qty"
                value={itemForm.quantity}
                onChange={(e) => setItemForm({ ...itemForm, quantity: e.target.value })}
                className="border border-gray-200 rounded-xl px-3 py-3 text-sm bg-gray-50 focus:bg-white focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none transition-all duration-200 min-h-[48px]"
                min={1}
                required
              />
              <input
                type="number"
                placeholder="Price"
                value={itemForm.unit_price}
                onChange={(e) => setItemForm({ ...itemForm, unit_price: e.target.value })}
                className="border border-gray-200 rounded-xl px-3 py-3 text-sm bg-gray-50 focus:bg-white focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none transition-all duration-200 min-h-[48px]"
                step="0.01"
                min="0.01"
                required
              />
              <button
                type="submit"
                disabled={addingItem}
                className="bg-blue-600 text-white px-4 py-3 rounded-xl text-sm font-semibold hover:bg-blue-700 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 min-h-[48px]"
              >
                {addingItem ? (
                  <span className="inline-flex items-center gap-1.5">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  </span>
                ) : 'Add'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Items table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-6 overflow-hidden">
        <div className="px-4 sm:px-5 py-3 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold text-sm text-gray-700">Services &amp; Parts</h2>
          <span className="text-sm font-bold text-gray-800">
            Rs.{itemsTotal.toFixed(2)}
          </span>
        </div>
        {job.items.length === 0 ? (
          <p className="px-5 py-8 text-sm text-gray-400 text-center">
            No items logged yet. Use the form above to add services and parts.
          </p>
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
                  {!isCompleted && (
                    <th className="px-4 sm:px-5 py-2.5 font-medium text-right">Act</th>
                  )}
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
                    {!isCompleted && (
                      <td className="px-4 sm:px-5 py-3 text-right">
                        <button
                          onClick={() => handleRemoveItem(item.id)}
                          className="text-red-500 hover:text-red-700 text-xs font-medium hover:bg-red-50 px-3 py-1.5 rounded-lg transition-all duration-200 active:scale-90 min-h-[36px]"
                        >
                          Remove
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Link
        to="/technician"
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors duration-200 min-h-[44px]"
      >
        <span className="text-lg leading-none">&larr;</span> Back to My Jobs
      </Link>
    </div>
  );
}
