import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../../api/client';
import VehicleCard from '../../components/VehicleCard';
import JobCard from '../../components/JobCard';

function Skeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex gap-3">
        <div className="h-10 w-28 bg-gray-200 rounded-lg" />
        <div className="h-10 w-36 bg-gray-200 rounded-lg" />
      </div>
      <div className="h-6 w-28 bg-gray-200 rounded" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {[1, 2].map((i) => (
          <div key={i} className="h-24 bg-gray-200 rounded-xl" />
        ))}
      </div>
      <div className="h-6 w-24 bg-gray-200 rounded" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {[1].map((i) => (
          <div key={i} className="h-28 bg-gray-200 rounded-xl" />
        ))}
      </div>
    </div>
  );
}

export default function CustomerDashboard() {
  const [vehicles, setVehicles] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchData = async () => {
    try {
      const [vRes, jRes] = await Promise.all([
        apiClient.get('/vehicles'),
        apiClient.get('/jobs'),
      ]);
      setVehicles(vRes.data);
      setJobs(jRes.data);
      setError('');
    } catch (err) {
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const activeJobs = jobs.filter((j) => j.status !== 'completed');
  const completedCount = jobs.filter((j) => j.status === 'completed').length;

  if (loading) return <Skeleton />;

  return (
    <div className="animate-fadeIn">
      {error && (
        <p className="text-red-600 text-sm mb-4 bg-red-50 border border-red-200 rounded-lg px-4 py-3 animate-shake">
          {error}
        </p>
      )}

      {/* Quick actions */}
      <div className="flex flex-wrap gap-3 mb-8">
        <Link
          to="/customer/vehicles/new"
          className="inline-flex items-center gap-2 bg-blue-600 text-white px-5 py-3 rounded-xl text-sm font-semibold hover:bg-blue-700 active:scale-95 transition-all duration-200 shadow-sm hover:shadow-md min-h-[48px]"
        >
          <span className="text-lg leading-none">+</span> Add Vehicle
        </Link>
        <Link
          to="/customer/jobs/new"
          className="inline-flex items-center gap-2 bg-green-600 text-white px-5 py-3 rounded-xl text-sm font-semibold hover:bg-green-700 active:scale-95 transition-all duration-200 shadow-sm hover:shadow-md min-h-[48px]"
        >
          <span className="text-lg leading-none">+</span> Request Service
        </Link>
        <button
          onClick={fetchData}
          className="text-sm font-medium text-gray-600 px-4 py-3 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 active:scale-95 transition-all duration-200 min-h-[48px]"
        >
          Refresh
        </button>
      </div>

      {/* Vehicles */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <h2 className="text-lg font-semibold text-gray-800">My Vehicles</h2>
          <span className="bg-gray-100 text-gray-600 text-xs font-bold px-2.5 py-0.5 rounded-full">
            {vehicles.length}
          </span>
        </div>
        {vehicles.length === 0 ? (
          <div className="text-center py-10 bg-white rounded-xl border border-dashed border-gray-200">
            <div className="text-4xl mb-3 opacity-30">&#x1F698;</div>
            <p className="text-gray-400 text-sm">No vehicles yet.</p>
            <Link to="/customer/vehicles/new" className="text-blue-600 text-sm font-medium mt-1 inline-block">
              Add your first vehicle
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {vehicles.map((v) => (
              <VehicleCard key={v.id} vehicle={v} />
            ))}
          </div>
        )}
      </div>

      {/* Active jobs */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <h2 className="text-lg font-semibold text-gray-800">Active Jobs</h2>
          <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2.5 py-0.5 rounded-full">
            {activeJobs.length}
          </span>
        </div>
        {activeJobs.length === 0 ? (
          <div className="text-center py-10 bg-white rounded-xl border border-dashed border-gray-200">
            <div className="text-4xl mb-3 opacity-30">&#x1F6E0;</div>
            <p className="text-gray-400 text-sm">No active service requests.</p>
            <Link to="/customer/jobs/new" className="text-green-600 text-sm font-medium mt-1 inline-block">
              Request a service
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {activeJobs.map((job) => (
              <JobCard
                key={job.id}
                job={job}
                linkTo={`/customer/jobs/${job.id}`}
              />
            ))}
          </div>
        )}
      </div>

      {/* History link */}
      <div className="bg-white rounded-xl border border-gray-100 px-4 py-3 flex items-center justify-between">
        <div className="text-sm">
          <span className="text-gray-600 font-medium">Service History</span>
          {completedCount > 0 && (
            <span className="text-gray-400 ml-2">
              ({completedCount} completed job{completedCount !== 1 ? 's' : ''})
            </span>
          )}
        </div>
        <Link
          to="/customer/history"
          className="text-blue-600 text-sm font-medium hover:text-blue-700 transition-colors duration-200"
        >
          View &rarr;
        </Link>
      </div>
    </div>
  );
}
