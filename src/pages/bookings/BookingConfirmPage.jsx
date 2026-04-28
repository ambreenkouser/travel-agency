import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { confirmBooking, getBooking, submitPaymentSlip } from '../../api/bookings'
import { getParentAccounts } from '../../api/accounts'
import { useAuth } from '../../context/AuthContext'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import Card from '../../components/ui/Card'
import Spinner from '../../components/ui/Spinner'
import ErrorMessage from '../../components/ui/ErrorMessage'
import CountdownTimer from '../../components/ui/CountdownTimer'

export default function BookingConfirmPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const canConfirm = user?.authorities?.includes('bookings:confirm') ?? false
  const isAgent = user?.authorities?.includes('ROLE_sub_agent') ?? false
  const isAgencyAdmin = user?.authorities?.includes('ROLE_agency_admin') ?? false

  const [booking, setBooking] = useState(null)
  const [loading, setLoading] = useState(true)
  const [confirming, setConfirming] = useState(false)
  const [error, setError] = useState('')
  const [confirmed, setConfirmed] = useState(false)

  // Payment slip state
  const [parentAccounts, setParentAccounts] = useState([])
  const [slipForm, setSlipForm] = useState({ paymentAccountId: '', referenceNumber: '', slipImage: null })
  const [submitting, setSubmitting] = useState(false)
  const [slipSuccess, setSlipSuccess] = useState(false)
  const [slipError, setSlipError] = useState('')

  useEffect(() => {
    getBooking(id)
      .then(b => {
        setBooking(b)
        // Pre-fill slip form if already submitted
        if (b.payment) {
          setSlipForm(f => ({ ...f, paymentAccountId: String(b.payment.paymentAccountId), referenceNumber: b.payment.referenceNumber ?? '' }))
          setSlipSuccess(true)
        }
      })
      .catch(() => setError('Failed to load booking.'))
      .finally(() => setLoading(false))
  }, [id])

  useEffect(() => {
    if (isAgent || isAgencyAdmin) {
      getParentAccounts().then(setParentAccounts).catch(() => {})
    }
  }, [isAgent, isAgencyAdmin])

  async function handleConfirm() {
    setError('')
    setConfirming(true)
    try {
      const updated = await confirmBooking(id, '')
      setBooking(updated)
      setConfirmed(true)
    } catch {
      setError('Failed to confirm booking. Please try again.')
    } finally {
      setConfirming(false)
    }
  }

  async function handleSlipSubmit(e) {
    e.preventDefault()
    setSlipError('')
    if (!slipForm.paymentAccountId) { setSlipError('Please select a payment account.'); return }
    if (!slipForm.referenceNumber.trim()) { setSlipError('Reference number is required.'); return }
    setSubmitting(true)
    try {
      const formData = new FormData()
      formData.append('paymentAccountId', slipForm.paymentAccountId)
      formData.append('referenceNumber', slipForm.referenceNumber)
      if (slipForm.slipImage) formData.append('slipImage', slipForm.slipImage)
      await submitPaymentSlip(id, formData)
      // Refresh booking to get updated payment info
      const updated = await getBooking(id)
      setBooking(updated)
      setSlipSuccess(true)
    } catch (err) {
      setSlipError(err?.response?.data?.message ?? 'Failed to submit payment slip.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return <div className="flex justify-center py-20"><Spinner size="lg" /></div>
  }

  if (!booking) {
    return <ErrorMessage message={error || 'Booking not found.'} />
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-900">Booking #{booking.id}</h1>
        {booking.status === 'PENDING' && booking.expiresAt && (
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <span>Expires in</span>
            <CountdownTimer expiresAt={booking.expiresAt} />
          </div>
        )}
      </div>

      {confirmed && (
        <div className="rounded-md bg-green-50 border border-green-200 p-4 text-green-700 text-sm font-medium">
          Booking confirmed successfully! Your invoice is being generated.
        </div>
      )}

      {/* Parent feedback banner — shown when booking is resolved */}
      {booking.status === 'CONFIRMED' && (
        <div className="rounded-lg bg-green-50 border border-green-200 p-4 space-y-1">
          <div className="flex items-center gap-2 text-green-700 font-semibold text-sm">
            <span>✓</span> Booking Confirmed by Admin
          </div>
          {booking.paymentComment && (
            <p className="text-sm text-green-700 pl-5">{booking.paymentComment}</p>
          )}
        </div>
      )}

      {booking.status === 'CANCELLED' && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-4 space-y-1">
          <div className="flex items-center gap-2 text-red-700 font-semibold text-sm">
            <span>✕</span> Booking Rejected / Cancelled
          </div>
          {booking.paymentComment && (
            <p className="text-sm text-red-700 pl-5">{booking.paymentComment}</p>
          )}
        </div>
      )}

      <Card className="p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-500">Status</div>
          <Badge status={booking.status} />
        </div>
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-500">Type</div>
          <div className="text-sm font-medium capitalize">{booking.bookableType}</div>
        </div>
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-500">Gross Total</div>
          <div className="text-sm font-medium">{booking.currency} {Number(booking.grossTotal).toLocaleString()}</div>
        </div>
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-500">Net Total</div>
          <div className="text-sm font-medium">{booking.currency} {Number(booking.netTotal).toLocaleString()}</div>
        </div>
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-500">Tax Total</div>
          <div className="text-sm font-medium">{booking.currency} {Number(booking.taxTotal).toLocaleString()}</div>
        </div>
      </Card>

      {booking.passengers?.length > 0 && (
        <Card className="p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Passengers</h2>
          <div className="space-y-3">
            {booking.passengers.map((p, i) => (
              <div key={i} className="flex items-center gap-4 text-sm">
                <span className="text-gray-400 text-xs w-12">{p.type}</span>
                <span className="font-medium">{p.firstName} {p.lastName}</span>
                {p.passportNo && <span className="text-gray-500">· {p.passportNo}</span>}
                {p.nationality && <span className="text-gray-500">· {p.nationality}</span>}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Payment slip section — sub_agents and agency_admins, pending bookings */}
      {(isAgent || isAgencyAdmin) && booking.status === 'PENDING' && (
        <Card className="p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Submit Payment</h2>

          {/* Already submitted — show info */}
          {booking.payment && slipSuccess ? (
            <div className="space-y-3">
              <div className="rounded-md bg-green-50 border border-green-200 p-3 text-green-700 text-sm">
                Payment slip submitted. Awaiting verification by your admin.
              </div>
              <div className="text-sm space-y-1 text-gray-700">
                <div><span className="text-gray-500">Account Name:</span> {booking.payment.accountName}</div>
                <div><span className="text-gray-500">Bank:</span> {booking.payment.bankName}</div>
                <div><span className="text-gray-500">Account Number:</span> <span className="font-mono font-semibold">{booking.payment.bankAccountNumber}</span></div>
                <div><span className="text-gray-500">Account Title:</span> {booking.payment.accountTitle}</div>
                <div><span className="text-gray-500">Reference #:</span> <span className="font-medium">{booking.payment.referenceNumber}</span></div>
              </div>
              <button
                onClick={() => setSlipSuccess(false)}
                className="text-xs text-blue-600 hover:underline"
              >
                Update slip
              </button>
            </div>
          ) : (
            /* Slip submission form */
            <form onSubmit={handleSlipSubmit} className="space-y-4">
              {parentAccounts.length === 0 ? (
                <p className="text-sm text-gray-400">Your admin has not added any payment accounts yet.</p>
              ) : (
                <>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Select Payment Account *</label>
                    <select
                      required
                      value={slipForm.paymentAccountId}
                      onChange={e => setSlipForm(f => ({ ...f, paymentAccountId: e.target.value }))}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">— Select account —</option>
                      {parentAccounts.map(a => (
                        <option key={a.id} value={a.id}>
                          {a.accountName} — {a.bankAccountNumber}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Reference Number (from receipt) *</label>
                    <input
                      required
                      type="text"
                      value={slipForm.referenceNumber}
                      onChange={e => setSlipForm(f => ({ ...f, referenceNumber: e.target.value }))}
                      placeholder="e.g. TXN123456789"
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Payment Slip Image</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={e => setSlipForm(f => ({ ...f, slipImage: e.target.files?.[0] ?? null }))}
                      className="w-full text-sm text-gray-600 file:mr-3 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-xs file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    />
                  </div>
                  <ErrorMessage message={slipError} />
                  <Button type="submit" variant="primary" disabled={submitting}>
                    {submitting ? 'Submitting...' : 'Submit Payment Slip'}
                  </Button>
                </>
              )}
            </form>
          )}
        </Card>
      )}

      <ErrorMessage message={error} />

      <div className="flex gap-3 flex-wrap items-center">
        <Button variant="secondary" onClick={() => navigate('/bookings')}>Back to Bookings</Button>
        {booking.status === 'PENDING' && canConfirm && booking.bookedByUserId !== user?.id && (
          <Button variant="success" disabled={confirming} onClick={handleConfirm}>
            {confirming ? 'Confirming...' : 'Confirm Booking'}
          </Button>
        )}
        {booking.status === 'PENDING' && !canConfirm && !isAgent && (
          <span className="text-sm text-yellow-600 bg-yellow-50 border border-yellow-200 rounded-md px-3 py-2">
            Submitted — awaiting approval from your admin
          </span>
        )}
        {booking.status === 'CONFIRMED' && (
          <a
            href={`/api/bookings/${booking.id}/invoice`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 bg-gray-800 text-white text-sm rounded-md hover:bg-gray-700"
          >
            Download Invoice (PDF)
          </a>
        )}
      </div>
    </div>
  )
}
