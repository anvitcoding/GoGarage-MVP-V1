import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import apiClient from '../../api/client';

function Skeleton() {
  return (
    <div className="max-w-lg mx-auto space-y-5 animate-pulse">
      <div className="h-5 w-12 bg-gray-200 rounded" />
      <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
        <div className="h-7 w-36 bg-gray-200 rounded" />
        <div className="h-12 bg-gray-200 rounded-xl" />
        <div className="h-32 bg-gray-200 rounded-xl" />
        <div className="h-12 bg-gray-200 rounded-xl" />
        <div className="h-12 bg-gray-200 rounded-xl" />
      </div>
    </div>
  );
}

export default function NewJobPage() {
  const navigate = useNavigate();
  const [vehicles, setVehicles] = useState([]);
  const [vehicleId, setVehicleId] = useState('');
  const [description, setDescription] = useState('');
  const [kmReading, setKmReading] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [loadingVehicles, setLoadingVehicles] = useState(true);

  useEffect(() => {
    apiClient
      .get('/vehicles')
      .then((res) => {
        setVehicles(res.data);
        if (res.data.length > 0) setVehicleId(res.data[0].id);
      })
      .catch(() => setError('Failed to load vehicles'))
      .finally(() => setLoadingVehicles(false));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!vehicleId) {
      setError('Please select a vehicle');
      return;
    }
    setError('');
    setSubmitting(true);
    try {
      const payload = {
        vehicle_id: parseInt(vehicleId),
        description,
        km_reading: kmReading ? parseInt(kmReading) : null,
      };
      const res = await apiClient.post('/jobs', payload);
      navigate(`/customer/jobs/${res.data.id}`, { replace: true });
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create service request');
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingVehicles) return <Skeleton />;

  if (vehicles.length === 0) {
    return (
      <div className="max-w-lg mx-auto text-center py-12 animate-fadeIn">
        <div className="text-5xl mb-4 opacity-30">&#x1F698;</div>
        <h1 className="text-2xl font-bold mb-2">Request Service</h1>
        <p className="text-gray-500 mb-6">You need to add a vehicle before requesting a service.</p>
        <button
          onClick={() => navigate('/customer/vehicles/new')}
          className="bg-blue-600 text-white px-6 py-3 rounded-xl text-sm font-semibold hover:bg-blue-700 active:scale-95 transition-all duration-200 min-h-[48px] shadow-sm"
        >
          + Add Vehicle
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto animate-fadeIn">
      <Link
        to="/customer"
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors duration-200 mb-4"
      >
        <span className="text-lg leading-none">&larr;</span> Back
      </Link>
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h1 className="text-2xl font-bold tracking-tight mb-6">Request Service</h1>
        {error && (
          <p className="text-red-600 text-sm mb-4 bg-red-50 border border-red-200 rounded-lg px-4 py-3 animate-shake">
            {error}
          </p>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1.5">
              Vehicle <span className="text-red-400">*</span>
            </label>
            <select
              value={vehicleId}
              onChange={(e) => setVehicleId(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm bg-gray-50 focus:bg-white focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none transition-all duration-200"
              required
            >
              {vehicles.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.make} {v.model} ({v.reg_number})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1.5">
              Issue / Service Description <span className="text-red-400">*</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what needs to be done..."
              rows={4}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm bg-gray-50 focus:bg-white focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none transition-all duration-200 resize-none"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1.5">KM Reading</label>
            <input
              type="number"
              value={kmReading}
              onChange={(e) => setKmReading(e.target.value)}
              placeholder="Current odometer reading (optional)"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm bg-gray-50 focus:bg-white focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none transition-all duration-200"
            />
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-green-600 text-white py-3.5 rounded-xl text-sm font-semibold hover:bg-green-700 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm hover:shadow-md min-h-[48px]"
          >
            {submitting ? (
              <span className="inline-flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Submitting...
              </span>
            ) : 'Submit Service Request'}
          </button>
        </form>
      </div>
    </div>
  );
}
