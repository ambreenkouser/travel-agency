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
  const [bookings, setBookings]       = useState([])
  const [loading, setLoading]         = useState(true)
  const [error, setError]             = useState('')
  const [detailBooking, setDetailBooking] = useState(null)
  const [slipZoom, setSlipZoom]       = useState(false)

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
                  <td className="px-4 py-3 font-mono text-gray-700">
                    <button onClick={() => setDetailBooking(b)} className="hover:underline text-blue-600">#{b.id}</button>
                  </td>
                  <td className="px-4 py-3 capitalize text-gray-700">
                    <div>{b.bookableType}</div>
                    {b.bookableTitle && <div className="text-xs text-gray-500 mt-0.5">{b.bookableTitle}</div>}
                  </td>
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
      {/* Booking Detail Modal */}
      {detailBooking && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg p-6 overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-lg font-semibold text-gray-900">Booking #{detailBooking.id}</h2>
              <button onClick={() => setDetailBooking(null)} className="text-gray-400 hover:text-gray-600 text-xl font-bold">×</button>
            </div>
            {detailBooking.bookableTitle && (
              <p className="text-sm text-blue-600 font-medium mb-3">{detailBooking.bookableTitle}</p>
            )}

            {/* Flight identifiers (flight bookings only) */}
            {detailBooking.bookableType === 'flight' && (detailBooking.flightNumber || detailBooking.pnrCode) && (
              <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 mb-3 flex flex-wrap gap-4 text-sm">
                {detailBooking.flightNumber && (
                  <div>
                    <span className="text-xs text-blue-500 uppercase tracking-wide block mb-0.5">Flight No.</span>
                    <span className="font-mono font-semibold text-blue-800">{detailBooking.flightNumber}</span>
                  </div>
                )}
                {detailBooking.pnrCode && (
                  <div>
                    <span className="text-xs text-blue-500 uppercase tracking-wide block mb-0.5">PNR Code</span>
                    <span className="font-mono font-semibold text-blue-800">{detailBooking.pnrCode}</span>
                  </div>
                )}
              </div>
            )}

            {/* Status + dates */}
            <div className="bg-gray-50 rounded-lg p-3 mb-4 space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Status</span>
                <Badge status={detailBooking.status} />
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Created</span>
                <span className="text-gray-800">{new Date(detailBooking.createdAt).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })}</span>
              </div>
              {detailBooking.status === 'PENDING' && detailBooking.expiresAt && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Expires</span>
                  <span className="text-orange-600">{new Date(detailBooking.expiresAt).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })}</span>
                </div>
              )}
              {detailBooking.paymentComment && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Comment</span>
                  <span className="text-gray-800 text-right max-w-[200px]">{detailBooking.paymentComment}</span>
                </div>
              )}
            </div>

            {/* Passengers */}
            {detailBooking.passengers?.length > 0 && (
              <div className="mb-4">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Passengers</p>
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <table className="w-full text-xs">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        {['Name', 'Type', 'Passport', 'Nationality', 'DOB'].map(h => (
                          <th key={h} className="text-left px-3 py-2 font-medium text-gray-500">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {detailBooking.passengers.map((p, i) => (
                        <tr key={i}>
                          <td className="px-3 py-2 font-medium text-gray-800">{p.firstName} {p.lastName}</td>
                          <td className="px-3 py-2 text-gray-500 capitalize">{p.type?.toLowerCase()}</td>
                          <td className="px-3 py-2 font-mono text-gray-600">{p.passportNo || '—'}</td>
                          <td className="px-3 py-2 text-gray-600">{p.nationality || '—'}</td>
                          <td className="px-3 py-2 text-gray-600">{p.dateOfBirth || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Pricing */}
            <div className="mb-4 grid grid-cols-3 gap-2">
              {[['Gross', detailBooking.grossTotal], ['Net', detailBooking.netTotal], ['Tax', detailBooking.taxTotal]].map(([label, val]) => (
                <div key={label} className="bg-gray-50 rounded p-2 text-center">
                  <div className="text-xs text-gray-500">{label}</div>
                  <div className="text-sm font-semibold text-gray-800">
                    {detailBooking.currency ?? 'PKR'} {val != null ? Number(val).toLocaleString() : '—'}
                  </div>
                </div>
              ))}
            </div>

            {/* Payment */}
            {detailBooking.payment && (
              <div className="mb-4 p-3 rounded-lg border border-blue-200 bg-blue-50 space-y-1.5 text-sm">
                <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide">Payment</p>
                <div className="flex justify-between"><span className="text-gray-500">Bank</span><span>{detailBooking.payment.bankName || '—'}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Account</span><span>{detailBooking.payment.accountTitle || detailBooking.payment.accountName || '—'}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Acc #</span><span className="font-mono">{detailBooking.payment.bankAccountNumber || '—'}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Reference</span><span className="font-medium">{detailBooking.payment.referenceNumber || '—'}</span></div>
                {detailBooking.payment.hasSlip && (
                  <div className="pt-1">
                    <p className="text-xs text-gray-500 mb-1">Payment slip <span className="text-blue-500">(click to enlarge)</span>:</p>
                    <img
                      src={`/api/bookings/${detailBooking.id}/payment/slip`}
                      alt="Payment slip"
                      onClick={() => setSlipZoom(true)}
                      className="max-h-40 rounded border border-gray-200 object-contain w-full cursor-zoom-in hover:opacity-90 transition-opacity"
                    />
                  </div>
                )}
              </div>
            )}

            <div className="flex justify-end">
              <button onClick={() => setDetailBooking(null)} className="px-4 py-2 border text-sm rounded-md hover:bg-gray-50">Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Slip lightbox */}
      {slipZoom && detailBooking && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-[60] p-4" onClick={() => setSlipZoom(false)}>
          <button onClick={() => setSlipZoom(false)}
            className="absolute top-4 right-4 text-white bg-white/20 hover:bg-white/30 rounded-full w-9 h-9 flex items-center justify-center text-xl font-bold">×</button>
          <img
            src={`/api/bookings/${detailBooking.id}/payment/slip`}
            alt="Payment slip (full size)"
            onClick={e => e.stopPropagation()}
            className="max-w-[90vw] max-h-[90vh] object-contain rounded shadow-2xl"
          />
        </div>
      )}
    </div>
  )
}
