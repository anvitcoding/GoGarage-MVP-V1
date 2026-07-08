import { useState, useEffect } from 'react';
import apiClient from '../../api/client';
import JobCard from '../../components/JobCard';

function Skeleton() {
  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-pulse">
      <div className="flex justify-between">
        <div className="h-8 w-28 bg-gray-200 rounded" />
        <div className="h-9 w-20 bg-gray-200 rounded-lg" />
      </div>
      <div className="h-6 w-24 bg-gray-200 rounded" />
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-28 bg-gray-200 rounded-xl" />
        ))}
      </div>
    </div>
  );
}

export default function TechnicianDashboard() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchJobs = async () => {
    try {
      const res = await apiClient.get('/jobs');
      setJobs(res.data);
      setError('');
    } catch (err) {
      setError('Failed to load jobs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const activeJobs = jobs.filter((j) => j.status !== 'completed');
  const completedJobs = jobs.filter((j) => j.status === 'completed');

  if (loading) return <Skeleton />;

  return (
    <div className="max-w-3xl mx-auto animate-fadeIn">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <h1 className="text-2xl font-bold tracking-tight">My Jobs</h1>
        <button
          onClick={fetchJobs}
          className="self-start text-sm font-medium text-gray-600 px-4 py-2.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 hover:border-gray-300 active:scale-95 transition-all duration-200 min-h-[44px]"
        >
          Refresh
        </button>
      </div>

      {error && (
        <p className="text-red-600 text-sm mb-4 bg-red-50 border border-red-200 rounded-lg px-4 py-3 animate-shake">
          {error}
        </p>
      )}

      {/* Active jobs */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <h2 className="text-lg font-semibold text-gray-800">Active</h2>
          <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2.5 py-0.5 rounded-full">
            {activeJobs.length}
          </span>
        </div>
        {activeJobs.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-gray-100">
            <div className="text-4xl mb-3 opacity-30">&#x1F527;</div>
            <p className="text-gray-400 text-sm">No active jobs assigned to you.</p>
            <p className="text-gray-300 text-xs mt-1">Pull to refresh or tap Refresh.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {activeJobs.map((job) => (
              <JobCard
                key={job.id}
                job={job}
                linkTo={`/technician/jobs/${job.id}`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Completed */}
      {completedJobs.length > 0 && (
        <div>
          <div className="flex items-center gap-3 mb-4">
            <h2 className="text-lg font-semibold text-gray-800">Recently Completed</h2>
            <span className="bg-green-100 text-green-700 text-xs font-bold px-2.5 py-0.5 rounded-full">
              {completedJobs.length}
            </span>
          </div>
          <div className="space-y-3 opacity-75">
            {completedJobs.slice(0, 10).map((job) => (
              <JobCard
                key={job.id}
                job={job}
                linkTo={`/technician/jobs/${job.id}`}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
