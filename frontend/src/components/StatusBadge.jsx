const STATUS_STYLES = {
  // Job statuses
  created: 'bg-gray-100 text-gray-700',
  in_progress: 'bg-blue-100 text-blue-700',
  completed: 'bg-green-100 text-green-700',
  // Invoice statuses
  unpaid: 'bg-red-100 text-red-700',
  paid: 'bg-green-100 text-green-700',
};

export default function StatusBadge({ status }) {
  const style = STATUS_STYLES[status] || 'bg-gray-100 text-gray-700';
  const label = (status || '').replace('_', ' ');

  return (
    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium capitalize ${style}`}>
      {label}
    </span>
  );
}
