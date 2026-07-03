import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { jsPDF } from 'jspdf'
import 'jspdf-autotable'
import * as XLSX from 'xlsx'
import { getBookings } from '../../api/bookings'
import { useAuth } from '../../context/AuthContext'
import Spinner from '../../components/ui/Spinner'
import ErrorMessage from '../../components/ui/ErrorMessage'
import Pagination from '../../components/ui/Pagination'

function buildExportRows(list, fmtDate) {
  return list.map((b, idx) => {
    const adults   = b.passengers?.filter(p => p.type === 'ADULT').length ?? 0
    const children = b.passengers?.filter(p => p.type === 'CHILD').length ?? 0
    const infants  = b.passengers?.filter(p => p.type === 'INFANT').length ?? 0
    return {
      '#': idx + 1,
      'Booking': `BK# ${b.id}`,
      'Agent': b.bookedByName || '—',
      'Flight/Group': b.groupName || b.airlineName || b.bookableTitle || '—',
      'Departure': b.departureDate ? new Date(b.departureDate).toLocaleDateString('en-GB') : '—',
      'Passengers': `${adults}A ${children}C ${infants}I`,
      'Amount': `PKR ${Number(b.grossTotal || 0).toLocaleString()}`,
      'Status': b.status,
      'Booked On': fmtDate(b.createdAt),
      'Confirmed/Rejected On': b.confirmedAt ? fmtDate(b.confirmedAt) : '—',
    }
  })
}

function fmtDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
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

export default function BookingHistoryPage() {
  const { user } = useAuth()
  const [bookings, setBookings] = useState([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState('')
  const [filters, setFilters]   = useState({
    dateFrom: '', dateTo: '', status: '', agent: '',
  })
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(10)

  useEffect(() => { load() }, [])
  useEffect(() => { setPage(0) }, [filters])

  function handlePageSizeChange(newSize) {
    setPageSize(newSize)
    setPage(0)
  }

  function handleExportPdf() {
    try {
      const rows = buildExportRows(visible, fmtDate)
      const doc = new jsPDF({ orientation: 'landscape' })
      doc.text('Booking History', 14, 12)
      doc.autoTable({
        startY: 18,
        head: [Object.keys(rows[0] ?? {})],
        body: rows.map(r => Object.values(r)),
        styles: { fontSize: 8 },
      })
      doc.save('booking-history.pdf')
    } catch (err) {
      console.error('PDF export failed:', err)
      setError('Failed to generate PDF export.')
    }
  }

  function handleExportExcel() {
    try {
      const rows = buildExportRows(visible, fmtDate)
      const ws = XLSX.utils.json_to_sheet(rows)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'Bookings')
      XLSX.writeFile(wb, 'booking-history.xlsx')
    } catch (err) {
      console.error('Excel export failed:', err)
      setError('Failed to generate Excel export.')
    }
  }

  function load() {
    setLoading(true)
    getBookings()
      .then(setBookings)
      .catch(() => setError('Failed to load booking history.'))
      .finally(() => setLoading(false))
  }

  const allAgents   = [...new Set(bookings.map(b => b.bookedByName).filter(Boolean))].sort()
  const allStatuses = [...new Set(bookings.map(b => b.status).filter(Boolean))].sort()

  const visible = bookings.filter(b => {
    if (filters.dateFrom && new Date(b.createdAt) < new Date(filters.dateFrom)) return false
    if (filters.dateTo   && new Date(b.createdAt) > new Date(filters.dateTo + 'T23:59:59')) return false
    if (filters.status   && b.status !== filters.status) return false
    if (filters.agent    && b.bookedByName !== filters.agent) return false
    return true
  })

  const confirmedBookings = visible.filter(b => b.status === 'CONFIRMED')
  const pendingBookings   = visible.filter(b => b.status === 'PENDING' || b.status === 'CANCELLATION_REQUESTED')
  const cancelledBookings = visible.filter(b => b.status === 'CANCELLED')

  const sumPax    = arr => arr.reduce((s, b) => s + (b.passengers?.length ?? 0), 0)
  const sumAmount = arr => arr.reduce((s, b) => s + Number(b.grossTotal || 0), 0)

  const totalPassengers = sumPax(visible)
  const confirmedCount  = confirmedBookings.length
  const pendingCount    = pendingBookings.length
  const cancelledCount  = cancelledBookings.length

  const totalPages    = Math.ceil(visible.length / pageSize)
  const pagedBookings = visible.slice(page * pageSize, page * pageSize + pageSize)

  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-900">Booking History</h1>
        <nav className="text-xs text-gray-400">Home / Booking History</nav>
      </div>

      <ErrorMessage message={error} />

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: 'Total Bookings',   value: visible.length, color: 'bg-blue-600' },
          { label: 'Confirmed',         value: confirmedCount,  color: 'bg-green-600' },
          { label: 'Pending',           value: pendingCount,    color: 'bg-yellow-500' },
          { label: 'Cancelled',         value: cancelledCount,  color: 'bg-red-600' },
          { label: 'Total Passengers',  value: totalPassengers, color: 'bg-purple-600' },
        ].map(card => (
          <div key={card.label} className={`${card.color} text-white rounded-lg p-4`}>
            <div className="text-2xl font-bold">{card.value}</div>
            <div className="text-xs opacity-90 mt-1">{card.label}</div>
          </div>
        ))}
      </div>

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
          <label className="block text-xs text-white mb-1">Status</label>
          <select value={filters.status}
            onChange={e => setFilters(f => ({ ...f, status: e.target.value }))}
            className="border border-gray-300 rounded px-2 py-1 text-sm bg-white min-w-[130px]">
            <option value="">All Statuses</option>
            {allStatuses.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs text-white mb-1">Agent</label>
          <select value={filters.agent}
            onChange={e => setFilters(f => ({ ...f, agent: e.target.value }))}
            className="border border-gray-300 rounded px-2 py-1 text-sm bg-white min-w-[160px]">
            <option value="">All Agents</option>
            {allAgents.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>
        <button
          onClick={() => setFilters({ dateFrom: '', dateTo: '', status: '', agent: '' })}
          className="px-4 py-1.5 bg-yellow-400 hover:bg-yellow-500 text-gray-900 text-sm font-semibold rounded"
        >
          Clear
        </button>
        <button
          onClick={handleExportPdf}
          disabled={visible.length === 0}
          className="px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Download PDF
        </button>
        <button
          onClick={handleExportExcel}
          disabled={visible.length === 0}
          className="px-4 py-1.5 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Download Excel
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
                  {['#', 'Booking', 'Agent', 'Flight / Group', 'Pax / Amount', 'Status', 'Booked On'].map(h => (
                    <th key={h} className="px-3 py-3 text-left font-semibold border-r border-gray-700 last:border-0 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {pagedBookings.map((b, idx) => {
                  const paxCount = b.passengers?.length ?? 0
                  const adults   = b.passengers?.filter(p => p.type === 'ADULT').length ?? 0
                  const children = b.passengers?.filter(p => p.type === 'CHILD').length ?? 0
                  const infants  = b.passengers?.filter(p => p.type === 'INFANT').length ?? 0

                  return (
                    <tr key={b.id} className="hover:bg-gray-50 align-top">
                      <td className="px-3 py-3 text-gray-900 font-semibold border-r border-gray-100">{page * pageSize + idx + 1}</td>

                      <td className="px-3 py-3 border-r border-gray-100 min-w-[130px]">
                        <Link to={`/bookings/${b.id}/confirm`} className="text-blue-600 font-bold hover:underline">
                          BK# {b.id}
                        </Link>
                        {b.bookableId && <div className="text-gray-700 text-xs">AG# {b.bookableId}</div>}
                      </td>

                      <td className="px-3 py-3 border-r border-gray-100 min-w-[130px]">
                        <div className="font-semibold text-gray-900 text-xs">{b.bookedByName || '—'}</div>
                        {b.paymentComment && b.status === 'CANCELLED' && (
                          <div className="text-red-500 text-[10px] mt-0.5">{b.paymentComment}</div>
                        )}
                      </td>

                      <td className="px-3 py-3 border-r border-gray-100 min-w-[160px]">
                        {b.airlineName && (
                          <div className="font-bold text-gray-800 text-sm flex items-center gap-1.5">
                            {b.airlineLogoUrl && (
                              <img src={b.airlineLogoUrl} alt={b.airlineName} className="h-4 object-contain" />
                            )}
                            {b.airlineName}
                          </div>
                        )}
                        {b.groupName && (
                          <span className="inline-flex px-2 py-0.5 bg-blue-600 text-white text-xs font-bold rounded mt-1">
                            {b.groupName}
                          </span>
                        )}
                        {b.pnrCode && (
                          <div className="text-gray-600 text-[10px] mt-0.5">PNR: {b.pnrCode}</div>
                        )}
                        {b.departureDate && (
                          <div className="text-gray-600 text-[10px] mt-0.5">
                            {new Date(b.departureDate).toLocaleDateString('en-GB', {
                              weekday: 'short', day: '2-digit', month: 'short', year: 'numeric',
                            })}
                          </div>
                        )}
                      </td>

                      <td className="px-3 py-3 border-r border-gray-100">
                        <div className="text-gray-900 font-bold text-sm">
                          {paxCount} pax
                          {(adults > 0 || children > 0 || infants > 0) && (
                            <span className="text-gray-600 font-normal text-[10px]">
                              {' '}({adults > 0 && `${adults}A`}{children > 0 && ` ${children}C`}{infants > 0 && ` ${infants}I`})
                            </span>
                          )}
                        </div>
                        <div className="font-bold text-gray-900">PKR {Number(b.grossTotal || 0).toLocaleString()}</div>
                      </td>

                      <td className="px-3 py-3 border-r border-gray-100">
                        <StatusBadge status={b.status} />
                        {b.confirmedAt && (
                          <div className={`text-[10px] mt-1 ${b.status === 'CANCELLED' ? 'text-red-600' : 'text-green-700'}`}>
                            {b.status === 'CANCELLED' ? 'Rejected' : 'Confirmed'} {fmtDate(b.confirmedAt)}
                          </div>
                        )}
                      </td>

                      <td className="px-3 py-3 whitespace-nowrap text-xs text-gray-700">
                        {fmtDate(b.createdAt)}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
              <tfoot>
                <tr className="bg-gray-50 border-t-2 border-gray-300">
                  <td colSpan={4} className="px-3 py-2 text-sm font-bold text-gray-800 text-right">
                    Confirmed ({confirmedBookings.length} bookings, {sumPax(confirmedBookings)} pax):
                  </td>
                  <td className="px-3 py-2 font-bold text-gray-900 whitespace-nowrap">
                    PKR {sumAmount(confirmedBookings).toLocaleString()}
                  </td>
                  <td colSpan={2}></td>
                </tr>
                <tr className="bg-gray-50 border-t border-gray-200">
                  <td colSpan={4} className="px-3 py-2 text-sm font-bold text-gray-800 text-right">
                    Pending ({pendingBookings.length} bookings, {sumPax(pendingBookings)} pax):
                  </td>
                  <td className="px-3 py-2 font-bold text-gray-900 whitespace-nowrap">
                    PKR {sumAmount(pendingBookings).toLocaleString()}
                  </td>
                  <td colSpan={2}></td>
                </tr>
                <tr className="bg-gray-50 border-t border-gray-200">
                  <td colSpan={4} className="px-3 py-2 text-sm font-bold text-gray-800 text-right">
                    Cancelled ({cancelledBookings.length} bookings, {sumPax(cancelledBookings)} pax):
                  </td>
                  <td className="px-3 py-2 font-bold text-gray-900 whitespace-nowrap">
                    PKR {sumAmount(cancelledBookings).toLocaleString()}
                  </td>
                  <td colSpan={2}></td>
                </tr>
              </tfoot>
            </table>
          </div>
          <Pagination page={page} totalPages={totalPages} pageSize={pageSize}
            onPageChange={setPage} onPageSizeChange={handlePageSizeChange} />
        </div>
      )}
    </div>
  )
}
