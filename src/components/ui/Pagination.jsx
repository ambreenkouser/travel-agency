import { useState } from 'react'

const PAGE_SIZE_OPTIONS = [10, 20, 50]

/** Builds a windowed list of page numbers with '...' gap markers, always showing first/last. */
function pageWindow(current, total) {
  const pages = new Set([1, total, current - 1, current, current + 1])
  const sorted = [...pages].filter(p => p >= 1 && p <= total).sort((a, b) => a - b)

  const withGaps = []
  let prev = null
  for (const p of sorted) {
    if (prev !== null && p - prev > 1) withGaps.push('...')
    withGaps.push(p)
    prev = p
  }
  return withGaps
}

export default function Pagination({ page, totalPages, pageSize, onPageChange, onPageSizeChange }) {
  const [goTo, setGoTo] = useState('')
  if (totalPages <= 0) return null

  const current = page + 1

  function goToPage(n) {
    const clamped = Math.min(Math.max(1, n), totalPages)
    onPageChange(clamped - 1)
  }

  function handleGoToSubmit(e) {
    e.preventDefault()
    const n = parseInt(goTo, 10)
    if (!isNaN(n)) goToPage(n)
    setGoTo('')
  }

  return (
    <div className="flex flex-wrap items-center justify-center gap-2 py-3 text-sm">
      <button type="button" onClick={() => goToPage(current - 1)} disabled={current <= 1}
        className="w-8 h-8 flex items-center justify-center rounded-md border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed">
        ‹
      </button>

      {pageWindow(current, totalPages).map((p, i) => p === '...' ? (
        <span key={`gap-${i}`} className="px-1 text-gray-400">...</span>
      ) : (
        <button key={p} type="button" onClick={() => goToPage(p)}
          className={`w-8 h-8 flex items-center justify-center rounded-full border text-sm font-medium ${
            p === current
              ? 'border-blue-500 text-blue-600 bg-blue-50'
              : 'border-gray-300 text-gray-700 hover:bg-gray-50'
          }`}>
          {p}
        </button>
      ))}

      <button type="button" onClick={() => goToPage(current + 1)} disabled={current >= totalPages}
        className="w-8 h-8 flex items-center justify-center rounded-md border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed">
        ›
      </button>

      {onPageSizeChange && (
        <select value={pageSize} onChange={e => onPageSizeChange(Number(e.target.value))}
          className="border border-gray-300 rounded-md px-2 py-1.5 text-sm ml-2">
          {PAGE_SIZE_OPTIONS.map(n => <option key={n} value={n}>{n} / page</option>)}
        </select>
      )}

      <form onSubmit={handleGoToSubmit} className="flex items-center gap-1.5 ml-2">
        <span className="text-gray-600">Go to</span>
        <input type="number" min="1" max={totalPages} value={goTo}
          onChange={e => setGoTo(e.target.value)}
          className="w-14 border border-gray-300 rounded-md px-2 py-1 text-sm" />
        <span className="text-gray-600">Page</span>
        <button type="submit"
          className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-md">
          Go
        </button>
      </form>
    </div>
  )
}
