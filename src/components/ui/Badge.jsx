const colors = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  CONFIRMED: 'bg-green-100 text-green-800',
  CANCELLATION_REQUESTED: 'bg-orange-100 text-orange-800',
  CANCELLED: 'bg-red-100 text-red-800',
  draft: 'bg-gray-100 text-gray-700',
  active: 'bg-blue-100 text-blue-700',
}

const labels = {
  CANCELLATION_REQUESTED: 'CANCEL REQUESTED',
}

export default function Badge({ status }) {
  const colorClass = colors[status] || 'bg-gray-100 text-gray-700'
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colorClass}`}>
      {labels[status] ?? status}
    </span>
  )
}
