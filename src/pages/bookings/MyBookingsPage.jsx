import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getMyBookings, cancelBooking, requestCancellation } from '../../api/bookings'
import { useAuth } from '../../context/AuthContext'
import Spinner from '../../components/ui/Spinner'
import ErrorMessage from '../../components/ui/ErrorMessage'
import CountdownTimer from '../../components/ui/CountdownTimer'

function countByType(passengers, type) {
  return passengers?.filter(p => p.type === type).length ?? 0
}

function fmtDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-GB', {
    weekday: 'short', day: '2-digit', month: 'short', year: 'numeric',
  })
}

function StatusBadge({ status }) {
  const map = {
    PENDING:                { bg: 'bg-yellow-100 text-yellow-800', label: 'PENDING' },
    CONFIRMED:              { bg: 'bg-green-100 text-green-800',   label: 'CONFIRMED' },
    CANCELLED:              { bg: 'bg-red-100 text-red-700',       label: 'CANCELLED' },
    CANCELLATION_REQUESTED: { bg: 'bg-orange-100 text-orange-700', label: 'CANCEL REQ' },
  }
  const s = map[status] ?? { bg: 'bg-gray-100 text-gray-600', label: status }
  return (
    <span className={`inline-flex px-2 py-0.5 rounded text-xs font-bold uppercase ${s.bg}`}>
      {s.label}
    </span>
  )
}

export default function MyBookingsPage() {
  const { user } = useAuth()
  const [bookings, setBookings]   = useState([])
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState('')
  const [filters, setFilters]     = useState({ dateFrom: '', dateTo: '', groupCategory: '', depDate: '' })

  const authorities = user?.authorities ?? []
  const canCancel   = authorities.includes('bookings:cancel')

  useEffect(() => { load() }, [])

  function load() {
    setLoading(true)
    getMyBookings()
      .then(setBookings)
      .catch(() => setError('Failed to load bookings.'))
      .finally(() => setLoading(false))
  }

  async function handleCancel(id) {
    if (!confirm('Cancel this booking?')) return
    try { await cancelBooking(id, ''); load() }
    catch (e) { setError(e?.response?.data?.message ?? 'Failed to cancel booking.') }
  }

  async function handleRequestCancellation(id) {
    const reason = prompt('Reason for cancellation request (optional):') ?? ''
    try { await requestCancellation(id, reason); load() }
    catch (e) { setError(e?.response?.data?.message ?? 'Failed to request cancellation.') }
  }

  // Derived filter LOVs
  const groupCategories = [...new Set(bookings.map(b => b.groupName).filter(Boolean))].sort()
  const depDates        = [...new Set(bookings.map(b => b.departureDate ? fmtDate(b.departureDate) : null).filter(Boolean))].sort()

  // Client-side filter
  const visible = bookings.filter(b => {
    if (filters.dateFrom && new Date(b.createdAt) < new Date(filters.dateFrom)) return false
    if (filters.dateTo   && new Date(b.createdAt) > new Date(filters.dateTo + 'T23:59:59')) return false
    if (filters.groupCategory && b.groupName !== filters.groupCategory) return false
    if (filters.depDate && fmtDate(b.departureDate) !== filters.depDate) return false
    return true
  })

  if (loading) {
    return <div className="flex justify-center py-20"><Spinner size="lg" /></div>
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-900">All Airline Group Booking</h1>
        <nav className="text-xs text-gray-400">Home / All Airline Groups</nav>
      </div>

      <ErrorMessage message={error} />

      {/* Filter bar */}
      <div className="bg-blue-600 rounded-lg p-4 flex flex-wrap gap-3 items-end">
        <div>
          <label className="block text-xs text-white mb-1">Date From</label>
          <input type="date" value={filters.dateFrom}
            onChange={e => setFilters(f => ({ ...f, dateFrom: e.target.value }))}
            className="border border-gray-300 rounded px-2 py-1 text-sm bg-white" />
        </div>
        <div>
          <label className="block text-xs text-white mb-1">Date To</label>
          <input type="date" value={filters.dateTo}
            onChange={e => setFilters(f => ({ ...f, dateTo: e.target.value }))}
            className="border border-gray-300 rounded px-2 py-1 text-sm bg-white" />
        </div>
        <div>
          <label className="block text-xs text-white mb-1">Group Category</label>
          <select value={filters.groupCategory}
            onChange={e => setFilters(f => ({ ...f, groupCategory: e.target.value }))}
            className="border border-gray-300 rounded px-2 py-1 text-sm bg-white min-w-[160px]">
            <option value="">All Groups</option>
            {groupCategories.map(g => <option key={g} value={g}>{g}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs text-white mb-1">Dep Date</label>
          <select value={filters.depDate}
            onChange={e => setFilters(f => ({ ...f, depDate: e.target.value }))}
            className="border border-gray-300 rounded px-2 py-1 text-sm bg-white min-w-[160px]">
            <option value="">All Dates</option>
            {depDates.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
        <button
          onClick={() => setFilters({ dateFrom: '', dateTo: '', groupCategory: '', depDate: '' })}
          className="px-4 py-1.5 bg-yellow-400 hover:bg-yellow-500 text-gray-900 text-sm font-semibold rounded"
        >
          Filter
        </button>
      </div>

      {visible.length === 0 ? (
        <div className="bg-white rounded-lg border p-8 text-center text-gray-500">No bookings found.</div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-gray-800 text-white text-xs">
                  {['Sr #', 'Booking No', 'Group', 'Departure', 'Passenger', 'Total Price', 'Status', 'Action'].map(h => (
                    <th key={h} className="px-3 py-3 text-left font-semibold border-r border-gray-700 last:border-0 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {visible.map((b, idx) => {
                  const adults   = countByType(b.passengers, 'ADULT')
                  const children = countByType(b.passengers, 'CHILD')
                  const infants  = countByType(b.passengers, 'INFANT')
                  const total    = b.passengers?.length ?? 0
                  const cnf      = b.status === 'CONFIRMED' ? { adults, children, infants, total } : { adults: 0, children: 0, infants: 0, total: 0 }

                  return (
                    <tr key={b.id} className="hover:bg-gray-50 align-top">
                      {/* Sr# */}
                      <td className="px-3 py-3 text-gray-500 border-r border-gray-100">{idx + 1}</td>

                      {/* Booking No */}
                      <td className="px-3 py-3 border-r border-gray-100 min-w-[150px]">
                        <div>
                          <Link to={`/bookings/${b.id}/confirm`}
                            className="text-blue-600 font-semibold hover:underline text-sm">
                            BK# {b.id}
                          </Link>
                        </div>
                        {b.bookableId && (
                          <div className="text-gray-500 text-xs mt-0.5">AG# {b.bookableId}</div>
                        )}
                        <div className="text-gray-500 text-xs mt-0.5">
                          Created:{' '}
                          {new Date(b.createdAt).toLocaleString('en-GB', {
                            day: '2-digit', month: 'short', year: 'numeric',
                            hour: '2-digit', minute: '2-digit',
                          })}
                        </div>
                        {b.bookedByName && (
                          <div className="text-red-600 text-xs mt-0.5 font-medium">
                            Added By User - {b.bookedByName}
                          </div>
                        )}
                        {b.status === 'CANCELLED' && b.paymentComment && (
                          <div className="text-red-500 text-xs mt-0.5">
                            Auto Cancelled: {b.paymentComment}
                          </div>
                        )}
                        {b.status === 'PENDING' && b.expiresAt && (
                          <div className="mt-1">
                            <div className="text-xs text-red-600 font-semibold mb-0.5">Booking Expires In:</div>
                            <CountdownTimer expiresAt={b.expiresAt} />
                          </div>
                        )}
                      </td>

                      {/* Group */}
                      <td className="px-3 py-3 border-r border-gray-100 min-w-[170px]">
                        {b.bookableTitle && (
                          <div className="text-gray-700 text-xs mb-1">{b.bookableTitle}</div>
                        )}
                        {b.airlineName && (
                          <div className="font-bold text-gray-800 text-sm flex items-center gap-2">
                            {b.airlineLogoUrl && (
                              <img src={b.airlineLogoUrl} alt={b.airlineName}
                                className="h-5 object-contain" />
                            )}
                            {b.airlineName}
                          </div>
                        )}
                        {b.groupName && (
                          <div className="mt-1">
                            <span className="inline-flex px-2 py-0.5 bg-blue-600 text-white text-xs font-bold rounded">
                              {b.groupName}
                            </span>
                          </div>
                        )}
                      </td>

                      {/* Departure */}
                      <td className="px-3 py-3 border-r border-gray-100 whitespace-nowrap text-sm font-medium text-gray-700">
                        {b.departureDate ? fmtDate(b.departureDate) : '—'}
                      </td>

                      {/* Passenger mini-table */}
                      <td className="px-3 py-3 border-r border-gray-100">
                        <table className="text-xs border border-gray-300 border-collapse">
                          <thead>
                            <tr className="bg-gray-800 text-white">
                              {['', 'ADT', 'CHD', 'INF', 'TOT'].map(h => (
                                <th key={h} className="px-1.5 py-1 border border-gray-600 font-semibold">{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            <tr className="border border-gray-200">
                              <td className="px-1.5 py-1 border border-gray-200 font-semibold text-orange-600">Req</td>
                              <td className="px-1.5 py-1 border border-gray-200 text-center">{adults}</td>
                              <td className="px-1.5 py-1 border border-gray-200 text-center">{children}</td>
                              <td className="px-1.5 py-1 border border-gray-200 text-center">{infants}</td>
                              <td className="px-1.5 py-1 border border-gray-200 text-center font-semibold">{total}</td>
                            </tr>
                            <tr className="border border-gray-200">
                              <td className="px-1.5 py-1 border border-gray-200 font-semibold text-green-600">Cnf</td>
                              <td className="px-1.5 py-1 border border-gray-200 text-center">{cnf.adults}</td>
                              <td className="px-1.5 py-1 border border-gray-200 text-center">{cnf.children}</td>
                              <td className="px-1.5 py-1 border border-gray-200 text-center">{cnf.infants}</td>
                              <td className="px-1.5 py-1 border border-gray-200 text-center font-semibold">{cnf.total}</td>
                            </tr>
                          </tbody>
                        </table>
                      </td>

                      {/* Total Price */}
                      <td className="px-3 py-3 border-r border-gray-100 whitespace-nowrap font-semibold text-gray-800">
                        PKR {Number(b.grossTotal).toLocaleString()} /-
                      </td>

                      {/* Status */}
                      <td className="px-3 py-3 border-r border-gray-100">
                        <StatusBadge status={b.status} />
                      </td>

                      {/* Action */}
                      <td className="px-3 py-3">
                        <div className="flex flex-col gap-1.5">
                          <Link to={`/bookings/${b.id}/confirm`}
                            className="inline-flex items-center justify-center px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-xs font-semibold rounded">
                            View
                          </Link>
                          <a href={`/bookings/${b.id}/ticket`} target="_blank" rel="noreferrer"
                            className="inline-flex items-center justify-center px-3 py-1 bg-yellow-400 hover:bg-yellow-500 text-gray-900 text-xs font-semibold rounded">
                            Print
                          </a>
                          {b.status === 'PENDING' && canCancel && (
                            <button onClick={() => handleCancel(b.id)}
                              className="inline-flex items-center justify-center px-3 py-1 border border-red-400 text-red-600 text-xs font-semibold rounded hover:bg-red-50">
                              Cancel
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
