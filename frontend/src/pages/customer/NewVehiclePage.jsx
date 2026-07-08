import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import apiClient from '../../api/client';

const FUEL_TYPES = ['', 'petrol', 'diesel', 'cng', 'ev'];

export default function NewVehiclePage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    reg_number: '',
    make: '',
    model: '',
    year: '',
    fuel_type: '',
  });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const payload = {
        ...form,
        year: form.year ? parseInt(form.year) : null,
        fuel_type: form.fuel_type || null,
      };
      await apiClient.post('/vehicles', payload);
      navigate('/customer', { replace: true });
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to add vehicle');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto animate-fadeIn">
      <Link
        to="/customer"
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors duration-200 mb-4"
      >
        <span className="text-lg leading-none">&larr;</span> Back
      </Link>
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h1 className="text-2xl font-bold tracking-tight mb-6">Add Vehicle</h1>
        {error && (
          <p className="text-red-600 text-sm mb-4 bg-red-50 border border-red-200 rounded-lg px-4 py-3 animate-shake">
            {error}
          </p>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1.5">
              Registration Number <span className="text-red-400">*</span>
            </label>
            <input
              name="reg_number"
              value={form.reg_number}
              onChange={handleChange}
              placeholder="e.g. MH12AB1234"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm bg-gray-50 focus:bg-white focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none transition-all duration-200"
              required
              maxLength={20}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1.5">
                Make <span className="text-red-400">*</span>
              </label>
              <input
                name="make"
                value={form.make}
                onChange={handleChange}
                placeholder="e.g. Maruti"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm bg-gray-50 focus:bg-white focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none transition-all duration-200"
                required
                maxLength={60}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1.5">
                Model <span className="text-red-400">*</span>
              </label>
              <input
                name="model"
                value={form.model}
                onChange={handleChange}
                placeholder="e.g. Swift"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm bg-gray-50 focus:bg-white focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none transition-all duration-200"
                required
                maxLength={60}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1.5">Year</label>
              <input
                name="year"
                type="number"
                value={form.year}
                onChange={handleChange}
                placeholder="2020"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm bg-gray-50 focus:bg-white focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none transition-all duration-200"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1.5">Fuel Type</label>
              <select
                name="fuel_type"
                value={form.fuel_type}
                onChange={handleChange}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm bg-gray-50 focus:bg-white focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none transition-all duration-200"
              >
                {FUEL_TYPES.map((ft) => (
                  <option key={ft} value={ft}>
                    {ft ? ft.charAt(0).toUpperCase() + ft.slice(1) : '— Select —'}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-blue-600 text-white py-3.5 rounded-xl text-sm font-semibold hover:bg-blue-700 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm hover:shadow-md min-h-[48px]"
          >
            {submitting ? (
              <span className="inline-flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Adding...
              </span>
            ) : 'Add Vehicle'}
          </button>
        </form>
      </div>
    </div>
  );
}
