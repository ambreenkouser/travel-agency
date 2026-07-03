export default function Pagination({ page, totalPages, onChange }) {
  if (totalPages <= 1) return null
  return (
    <div className="flex items-center justify-center gap-3 py-3">
      <button type="button" onClick={() => onChange(page - 1)} disabled={page <= 0}
        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-md disabled:opacity-40 disabled:cursor-not-allowed">
        Previous
      </button>
      <span className="text-sm text-gray-600">Page {page + 1} of {totalPages}</span>
      <button type="button" onClick={() => onChange(page + 1)} disabled={page >= totalPages - 1}
        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-md disabled:opacity-40 disabled:cursor-not-allowed">
        Next
      </button>
    </div>
  )
}
