import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getMyBookings, cancelBooking, requestCancellation } from '../../api/bookings'
import { useAuth } from '../../context/AuthContext'
import Badge from '../../components/ui/Badge'
import Card from '../../components/ui/Card'
import Spinner from '../../components/ui/Spinner'
import ErrorMessage from '../../components/ui/ErrorMessage'
import CountdownTimer from '../../components/ui/CountdownTimer'

export default function MyBookingsPage() {
  const { user } = useAuth()
  const [bookings, setBookings] = useState([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState('')

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
    catch (e) {
      const msg = e?.response?.data?.message ?? 'Failed to cancel booking.'
      setError(msg)
    }
  }

  async function handleRequestCancellation(id) {
    const reason = prompt('Reason for cancellation request (optional):') ?? ''
    try { await requestCancellation(id, reason); load() }
    catch (e) {
      const msg = e?.response?.data?.message ?? 'Failed to request cancellation.'
      setError(msg)
    }
  }

  if (loading) {
    return <div className="flex justify-center py-20"><Spinner size="lg" /></div>
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-gray-900">My Bookings</h1>
      <ErrorMessage message={error} />

      {bookings.length === 0 ? (
        <Card className="p-8 text-center text-gray-500">No bookings yet.</Card>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {['ID', 'Type', 'Passengers', 'Gross', 'Net', 'Tax', 'Status', 'Expires', 'Date', ''].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {bookings.map(b => (
                <tr key={b.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-gray-700">#{b.id}</td>
                  <td className="px-4 py-3 capitalize text-gray-700">{b.bookableType}</td>
                  <td className="px-4 py-3">
                    {b.passengers?.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {b.passengers.map((p, i) => (
                          <span key={i} className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">
                            {p.firstName} {p.lastName}
                            <span className="ml-1 text-gray-400">({p.type})</span>
                          </span>
                        ))}
                      </div>
                    ) : <span className="text-gray-400">—</span>}
                  </td>
                  <td className="px-4 py-3 text-gray-700">PKR {Number(b.grossTotal).toLocaleString()}</td>
                  <td className="px-4 py-3 text-gray-700">PKR {Number(b.netTotal).toLocaleString()}</td>
                  <td className="px-4 py-3 text-gray-500">{b.taxTotal ? `PKR ${Number(b.taxTotal).toLocaleString()}` : '—'}</td>
                  <td className="px-4 py-3">
                    <Badge status={b.status} />
                    {b.paymentComment && (
                      <p className="text-xs text-gray-500 mt-1 max-w-[160px] truncate" title={b.paymentComment}>
                        {b.paymentComment}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {b.status === 'PENDING' && b.expiresAt
                      ? <CountdownTimer expiresAt={b.expiresAt} />
                      : <span className="text-gray-300">—</span>}
                  </td>
                  <td className="px-4 py-3 text-gray-400 whitespace-nowrap">
                    {new Date(b.createdAt).toLocaleDateString('en-GB')}
                  </td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    {b.status === 'PENDING' && (
                      <div className="flex gap-2 justify-end items-center">
                        <Link
                          to={`/bookings/${b.id}/confirm`}
                          className="text-xs px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                        >
                          Submit Payment
                        </Link>
                        {canCancel && (
                          <button
                            onClick={() => handleCancel(b.id)}
                            className="text-xs px-2 py-1 border border-red-300 text-red-600 rounded hover:bg-red-50"
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                    )}
                    {b.status === 'CONFIRMED' && (
                      <div className="flex gap-2 justify-end flex-wrap">
                        <Link to={`/bookings/${b.id}/confirm`} className="text-xs text-blue-600 hover:underline">
                          View
                        </Link>
                        <a
                          href={`/api/bookings/${b.id}/invoice`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs text-gray-600 hover:underline"
                        >
                          Invoice
                        </a>
                      </div>
                    )}
                    {b.status === 'CANCELLATION_REQUESTED' && (
                      <div className="flex gap-2 justify-end items-center">
                        <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-medium">
                          Cancellation Pending
                        </span>
                        <Link to={`/bookings/${b.id}/confirm`} className="text-xs text-gray-500 hover:underline">
                          View
                        </Link>
                      </div>
                    )}
                    {b.status === 'CANCELLED' && (
                      <Link to={`/bookings/${b.id}/confirm`} className="text-xs text-red-500 hover:underline">
                        View Details
                      </Link>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
