import { useEffect, useState } from 'react'
import { getBookingQueue, confirmBooking, cancelBooking,
         getCancellationRequests, approveCancellation, rejectCancellation } from '../../api/bookings'

const STATUS_COLORS = {
  PENDING:   'bg-yellow-100 text-yellow-700',
  CONFIRMED: 'bg-green-100 text-green-700',
  CANCELLED: 'bg-red-100 text-red-600',
}

export default function BookingRequestsPage() {
  const [bookings, setBookings]           = useState([])
  const [cancelRequests, setCancelRequests] = useState([])
  const [loading, setLoading]             = useState(true)
  const [error, setError]                 = useState('')
  const [modal, setModal]                 = useState(null) // { booking, action: 'approve'|'reject' }
  const [cancelModal, setCancelModal]     = useState(null) // { request, action: 'approve'|'reject' }
  const [comment, setComment]             = useState('')
  const [saving, setSaving]               = useState(false)
  const [slipZoom, setSlipZoom]           = useState(null) // booking id whose slip is zoomed

  useEffect(() => { load() }, [])

  function load() {
    setLoading(true)
    Promise.all([getBookingQueue(), getCancellationRequests()])
      .then(([bks, reqs]) => { setBookings(bks); setCancelRequests(reqs) })
      .catch(() => setError('Failed to load booking requests.'))
      .finally(() => setLoading(false))
  }

  function openModal(booking, action) {
    setModal({ booking, action })
    setComment('')
    setError('')
  }

  function closeModal() {
    setModal(null)
    setComment('')
  }

  function openCancelModal(request, action) {
    setCancelModal({ request, action })
    setComment('')
    setError('')
  }

  function closeCancelModal() {
    setCancelModal(null)
    setComment('')
  }

  async function handleAction() {
    if (!modal) return
    if (modal.action === 'approve' && !comment.trim()) {
      setError('Payment comment is required when approving.')
      return
    }
    setSaving(true)
    setError('')
    try {
      if (modal.action === 'approve') {
        await confirmBooking(modal.booking.id, comment)
      } else {
        await cancelBooking(modal.booking.id, comment)
      }
      closeModal()
      load()
    } catch (e) {
      setError(e?.response?.data?.message ?? 'Action failed.')
    } finally {
      setSaving(false)
    }
  }

  async function handleCancelAction() {
    if (!cancelModal) return
    setSaving(true)
    setError('')
    try {
      if (cancelModal.action === 'approve') {
        await approveCancellation(cancelModal.request.id, comment)
      } else {
        await rejectCancellation(cancelModal.request.id, comment)
      }
      closeCancelModal()
      load()
    } catch (e) {
      setError(e?.response?.data?.message ?? 'Action failed.')
    } finally {
      setSaving(false)
    }
  }

  const totalPax = b => b.passengers?.length ?? 0

  return (
    <div className="space-y-10">
      {/* ── Booking Requests header ── */}
      <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-semibold text-gray-900">Booking Requests</h1>
          {bookings.length > 0 && (
            <span className="inline-flex items-center justify-center min-w-[1.5rem] h-6 px-1.5 bg-red-500 text-white text-xs font-bold rounded-full">
              {bookings.length}
            </span>
          )}
        </div>
        <span className="text-sm text-gray-400">
          {bookings.length} pending request{bookings.length !== 1 ? 's' : ''}
        </span>
      </div>

      {error && !modal && !cancelModal && <p className="mb-4 text-sm text-red-600">{error}</p>}

      {/* ── Approval Modal ── */}
      {modal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6 overflow-y-auto max-h-[90vh]">
            <h2 className={`text-lg font-semibold mb-1 ${modal.action === 'approve' ? 'text-green-700' : 'text-red-600'}`}>
              {modal.action === 'approve' ? 'Approve Booking' : 'Reject Booking'}
            </h2>
            <p className="text-sm text-gray-500">Booking #{modal.booking.id}</p>
            {modal.booking.bookableTitle && (
              <p className="text-sm text-blue-600 font-medium mb-3">{modal.booking.bookableTitle}</p>
            )}
            {!modal.booking.bookableTitle && <div className="mb-3" />}

            {/* Booking summary */}
            <div className="bg-gray-50 rounded-lg p-3 mb-4 space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Booked by</span>
                <span className="font-medium text-gray-800">{modal.booking.bookedByName ?? `User #${modal.booking.bookedByUserId}`}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Type</span>
                <span className="capitalize font-medium text-gray-800">{modal.booking.bookableType}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Passengers</span>
                <span className="font-medium text-gray-800">{totalPax(modal.booking)}</span>
              </div>
              <div className="flex justify-between pt-1 border-t border-gray-200">
                <span className="text-gray-500">Total</span>
                <span className="font-semibold text-gray-900">PKR {Number(modal.booking.grossTotal).toLocaleString()}</span>
              </div>
            </div>

            {/* Full passenger details */}
            {modal.booking.passengers?.length > 0 && (
              <div className="mb-4">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Passenger Details</p>
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <table className="w-full text-xs">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        {['Name', 'Type', 'Passport', 'Nationality', 'DOB'].map(h => (
                          <th key={h} className="text-left px-2 py-1.5 font-medium text-gray-500">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {modal.booking.passengers.map((p, i) => (
                        <tr key={i}>
                          <td className="px-2 py-1.5 font-medium text-gray-800">{p.firstName} {p.lastName}</td>
                          <td className="px-2 py-1.5 text-gray-500 capitalize">{p.type?.toLowerCase()}</td>
                          <td className="px-2 py-1.5 font-mono text-gray-600">{p.passportNo || '—'}</td>
                          <td className="px-2 py-1.5 text-gray-600">{p.nationality || '—'}</td>
                          <td className="px-2 py-1.5 text-gray-600">{p.dateOfBirth || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Payment slip info */}
            {modal.booking.payment && (
              <div className="mb-4 p-3 rounded-lg border border-blue-200 bg-blue-50 space-y-2">
                <div className="text-xs font-semibold text-blue-700 uppercase tracking-wide">Payment Submitted</div>
                <div className="text-sm space-y-1 text-gray-700">
                  <div><span className="text-gray-500">Account Name:</span> {modal.booking.payment.accountName}</div>
                  <div><span className="text-gray-500">Bank:</span> {modal.booking.payment.bankName}</div>
                  <div><span className="text-gray-500">Account Number:</span> <span className="font-mono font-semibold">{modal.booking.payment.bankAccountNumber}</span></div>
                  <div><span className="text-gray-500">Reference #:</span> <span className="font-medium">{modal.booking.payment.referenceNumber}</span></div>
                </div>
                {modal.booking.payment.hasSlip && (
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Payment slip <span className="text-blue-500">(click to enlarge)</span>:</p>
                    <img
                      src={`/api/bookings/${modal.booking.id}/payment/slip`}
                      alt="Payment slip"
                      onClick={() => setSlipZoom(modal.booking.id)}
                      className="max-h-48 rounded border border-gray-200 object-contain w-full cursor-zoom-in hover:opacity-90 transition-opacity"
                    />
                  </div>
                )}
              </div>
            )}

            {/* Comment */}
            <label className="block text-sm mb-4">
              <span className="block text-gray-600 mb-1">
                {modal.action === 'approve'
                  ? 'Payment Comment *'
                  : 'Rejection Reason (optional)'}
              </span>
              <textarea
                rows={3}
                value={comment}
                onChange={e => setComment(e.target.value)}
                placeholder={modal.action === 'approve'
                  ? 'e.g. Cash received, Cheque #1234, Transfer confirmed…'
                  : 'e.g. Insufficient seats, passenger docs incomplete…'}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
              />
            </label>

            {error && <p className="text-sm text-red-600 mb-3">{error}</p>}

            <div className="flex gap-2">
              <button
                onClick={handleAction}
                disabled={saving}
                className={`flex-1 py-2 text-white text-sm rounded-md font-medium ${
                  modal.action === 'approve'
                    ? 'bg-green-600 hover:bg-green-700'
                    : 'bg-red-600 hover:bg-red-700'
                } disabled:opacity-60`}
              >
                {saving ? 'Processing…' : modal.action === 'approve' ? 'Confirm & Approve' : 'Reject Booking'}
              </button>
              <button
                onClick={closeModal}
                className="flex-1 py-2 border text-sm rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Booking approval table ── */}
      {loading ? (
        <p className="text-sm text-gray-500">Loading...</p>
      ) : bookings.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center text-gray-400">
          No pending booking requests.
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {['#', 'Booked By', 'Type', 'Passengers', 'Total', 'Payment', 'Date', 'Actions'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {bookings.map(b => (
                <tr key={b.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-gray-700 whitespace-nowrap">#{b.id}</td>
                  <td className="px-4 py-3 text-gray-800 font-medium whitespace-nowrap">
                    {b.bookedByName ?? `User #${b.bookedByUserId}`}
                  </td>
                  <td className="px-4 py-3 capitalize text-gray-700">{b.bookableType}</td>
                  <td className="px-4 py-3">
                    {b.passengers?.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {b.passengers.slice(0, 3).map((p, i) => (
                          <span key={i} className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded whitespace-nowrap">
                            {p.firstName} {p.lastName}
                            <span className="ml-1 text-gray-400">({p.type?.toLowerCase()})</span>
                          </span>
                        ))}
                        {b.passengers.length > 3 && (
                          <span className="text-xs text-gray-400">+{b.passengers.length - 3} more</span>
                        )}
                      </div>
                    ) : <span className="text-gray-400">—</span>}
                  </td>
                  <td className="px-4 py-3 font-semibold text-gray-800 whitespace-nowrap">
                    PKR {Number(b.grossTotal).toLocaleString()}
                  </td>
                  <td className="px-4 py-3">
                    {b.payment ? (
                      <span className="inline-flex items-center gap-1 text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full font-medium">
                        {b.payment.hasSlip ? 'Slip attached' : 'No slip'}
                      </span>
                    ) : (
                      <span className="text-xs text-gray-400">None</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-400 whitespace-nowrap">
                    {new Date(b.createdAt).toLocaleDateString('en-GB')}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex gap-2">
                      <button
                        onClick={() => openModal(b, 'approve')}
                        className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 font-medium"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => openModal(b, 'reject')}
                        className="px-3 py-1 text-xs border border-red-300 text-red-600 rounded hover:bg-red-50 font-medium"
                      >
                        Reject
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      </div>{/* end booking requests section */}

      {/* ── Cancellation Requests section ── */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold text-gray-900">Cancellation Requests</h2>
            {cancelRequests.length > 0 && (
              <span className="inline-flex items-center justify-center min-w-[1.5rem] h-6 px-1.5 bg-orange-500 text-white text-xs font-bold rounded-full">
                {cancelRequests.length}
              </span>
            )}
          </div>
          <span className="text-sm text-gray-400">
            {cancelRequests.length} pending
          </span>
        </div>

        {/* Cancellation Action Modal */}
        {cancelModal && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6 overflow-y-auto max-h-[90vh]">
              <h2 className={`text-lg font-semibold mb-1 ${cancelModal.action === 'approve' ? 'text-green-700' : 'text-red-600'}`}>
                {cancelModal.action === 'approve' ? 'Approve Cancellation & Refund' : 'Reject Cancellation Request'}
              </h2>
              <p className="text-sm text-gray-500 mb-4">Booking #{cancelModal.request.bookingId}</p>

              <div className="bg-gray-50 rounded-lg p-3 mb-4 space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Requested by</span>
                  <span className="font-medium text-gray-800">{cancelModal.request.requestedByName ?? `User #${cancelModal.request.requestedByUserId}`}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Type</span>
                  <span className="capitalize font-medium text-gray-800">{cancelModal.request.bookableType}</span>
                </div>
                <div className="flex justify-between pt-1 border-t border-gray-200">
                  <span className="text-gray-500">Amount to refund</span>
                  <span className="font-semibold text-gray-900">{cancelModal.request.currency} {Number(cancelModal.request.netTotal).toLocaleString()}</span>
                </div>
                {cancelModal.request.reason && (
                  <div className="pt-1 border-t border-gray-200">
                    <span className="text-gray-500 block text-xs mb-0.5">Agent's reason</span>
                    <span className="text-gray-800 text-xs italic">{cancelModal.request.reason}</span>
                  </div>
                )}
              </div>

              {cancelModal.action === 'approve' && (
                <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded p-2 mb-4">
                  Approving will cancel the booking and credit the agent's ledger with the refund amount.
                </p>
              )}

              <label className="block text-sm mb-4">
                <span className="block text-gray-600 mb-1">
                  {cancelModal.action === 'approve' ? 'Comment (optional)' : 'Rejection Reason (optional)'}
                </span>
                <textarea
                  rows={3}
                  value={comment}
                  onChange={e => setComment(e.target.value)}
                  placeholder={cancelModal.action === 'approve'
                    ? 'e.g. Refund processed, approved by management…'
                    : 'e.g. Non-refundable ticket, no-show policy…'}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
                />
              </label>

              {error && <p className="text-sm text-red-600 mb-3">{error}</p>}

              <div className="flex gap-2">
                <button
                  onClick={handleCancelAction}
                  disabled={saving}
                  className={`flex-1 py-2 text-white text-sm rounded-md font-medium ${
                    cancelModal.action === 'approve'
                      ? 'bg-green-600 hover:bg-green-700'
                      : 'bg-red-600 hover:bg-red-700'
                  } disabled:opacity-60`}
                >
                  {saving ? 'Processing…' : cancelModal.action === 'approve' ? 'Approve Refund' : 'Reject Request'}
                </button>
                <button onClick={closeCancelModal} className="flex-1 py-2 border text-sm rounded-md hover:bg-gray-50">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {cancelRequests.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-8 text-center text-gray-400">
            No pending cancellation requests.
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-orange-200 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-orange-50 border-b border-orange-200">
                <tr>
                  {['Booking #', 'Agent', 'Type', 'Refund Amount', 'Reason', 'Requested', 'Actions'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-medium text-orange-700 uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {cancelRequests.map(r => (
                  <tr key={r.id} className="hover:bg-orange-50/30">
                    <td className="px-4 py-3 font-mono text-gray-700">#{r.bookingId}</td>
                    <td className="px-4 py-3 text-gray-800 font-medium whitespace-nowrap">
                      {r.requestedByName ?? `User #${r.requestedByUserId}`}
                    </td>
                    <td className="px-4 py-3 capitalize text-gray-700">{r.bookableType}</td>
                    <td className="px-4 py-3 font-semibold text-gray-800 whitespace-nowrap">
                      {r.currency} {Number(r.netTotal).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-gray-500 max-w-[180px] truncate" title={r.reason}>
                      {r.reason || <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-4 py-3 text-gray-400 whitespace-nowrap">
                      {new Date(r.createdAt).toLocaleDateString('en-GB')}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex gap-2">
                        <button
                          onClick={() => openCancelModal(r, 'approve')}
                          className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 font-medium"
                        >
                          Approve Refund
                        </button>
                        <button
                          onClick={() => openCancelModal(r, 'reject')}
                          className="px-3 py-1 text-xs border border-red-300 text-red-600 rounded hover:bg-red-50 font-medium"
                        >
                          Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Payment Slip Lightbox ── */}
      {slipZoom && (
        <div
          className="fixed inset-0 bg-black/90 flex items-center justify-center z-[60] p-4"
          onClick={() => setSlipZoom(null)}
        >
          <button
            onClick={() => setSlipZoom(null)}
            className="absolute top-4 right-4 text-white bg-white/20 hover:bg-white/30 rounded-full w-9 h-9 flex items-center justify-center text-xl font-bold"
          >
            ×
          </button>
          <img
            src={`/api/bookings/${slipZoom}/payment/slip`}
            alt="Payment slip (full size)"
            onClick={e => e.stopPropagation()}
            className="max-w-[90vw] max-h-[90vh] object-contain rounded shadow-2xl"
          />
        </div>
      )}
    </div>
  )
}
