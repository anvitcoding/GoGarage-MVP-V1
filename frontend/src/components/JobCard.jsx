import { Link } from 'react-router-dom';
import StatusBadge from './StatusBadge';

export default function JobCard({ job, linkTo }) {
  const content = (
    <div className="bg-white rounded-lg shadow p-4 border hover:shadow-md transition">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-semibold text-sm font-mono text-gray-500">Job #{job.id}</h3>
        <StatusBadge status={job.status} />
      </div>
      <p className="text-sm text-gray-700 mb-1 line-clamp-2">{job.description}</p>
      <p className="text-xs text-gray-400">
        Vehicle: {job.vehicle_reg_number || `#${job.vehicle_id}`}
        {job.technician_name && ` · Technician: ${job.technician_name}`}
      </p>
      <p className="text-xs text-gray-400 mt-0.5">
        {new Date(job.created_at).toLocaleDateString()}
      </p>
    </div>
  );

  if (linkTo) {
    return <Link to={linkTo}>{content}</Link>;
  }
  return content;
}
