import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { confirmBooking, getBooking, submitPaymentSlip } from '../../api/bookings'
import { getFlight } from '../../api/flights'
import { getParentAccounts } from '../../api/accounts'
import { useAuth } from '../../context/AuthContext'
import Spinner from '../../components/ui/Spinner'
import ErrorMessage from '../../components/ui/ErrorMessage'
import Button from '../../components/ui/Button'
import CountdownTimer from '../../components/ui/CountdownTimer'

function fmtDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
  })
}

function fmtDateDMY(iso) {
  if (!iso) return '—'
  const d = new Date(iso)
  const dd = String(d.getDate()).padStart(2, '0')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const yy = d.getFullYear()
  return `${dd}-${mm}-${yy}`
}

function fmtTime(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
}

function fmtBookedOn(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-GB', {
    weekday: 'short', day: '2-digit', month: 'short', year: 'numeric',
  })
}

function fareForType(flight, type) {
  if (!flight) return '—'
  const t = type?.toUpperCase()
  if (t === 'ADULT')  return flight.fareAdult  != null ? `PKR ${Number(flight.fareAdult).toLocaleString()}` : '—'
  if (t === 'CHILD')  return flight.fareChild  != null ? `PKR ${Number(flight.fareChild).toLocaleString()}` : '—'
  if (t === 'INFANT') return flight.fareInfant != null ? `PKR ${Number(flight.fareInfant).toLocaleString()}` : '—'
  return '—'
}

function StatusBadge({ status }) {
  const map = {
    PENDING:                { cls: 'bg-yellow-100 text-yellow-800', label: 'PENDING' },
    CONFIRMED:              { cls: 'bg-green-100 text-green-800',   label: 'CONFIRMED' },
    CANCELLED:              { cls: 'bg-red-100 text-red-700',       label: 'CANCELLED' },
    CANCELLATION_REQUESTED: { cls: 'bg-orange-100 text-orange-700', label: 'CANCEL REQ' },
  }
  const s = map[status] ?? { cls: 'bg-gray-100 text-gray-600', label: status }
  return (
    <span className={`inline-flex px-2 py-0.5 rounded text-xs font-bold uppercase ${s.cls}`}>
      {s.label}
    </span>
  )
}

function FieldBox({ label, value, className = '' }) {
  return (
    <div className={`flex flex-col ${className}`}>
      <span className="text-xs text-gray-500 mb-0.5">{label}</span>
      <div className="border border-gray-300 rounded px-2 py-1.5 bg-gray-50 text-sm text-gray-800 min-h-[34px]">
        {value || '—'}
      </div>
    </div>
  )
}

export default function BookingConfirmPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()

  const canConfirm   = user?.authorities?.includes('bookings:confirm') ?? false
  const isAgent      = user?.authorities?.includes('ROLE_sub_agent') ?? false
  const isAgencyAdmin = user?.authorities?.includes('ROLE_agency_admin') ?? false

  const [booking, setBooking]           = useState(null)
  const [flight, setFlight]             = useState(null)
  const [loading, setLoading]           = useState(true)
  const [confirming, setConfirming]     = useState(false)
  const [error, setError]               = useState('')
  const [confirmed, setConfirmed]       = useState(false)

  // Payment slip state
  const [parentAccounts, setParentAccounts] = useState([])
  const [slipForm, setSlipForm] = useState({ paymentAccountId: '', referenceNumber: '', slipImage: null })
  const [submitting, setSubmitting]     = useState(false)
  const [slipSuccess, setSlipSuccess]   = useState(false)
  const [slipError, setSlipError]       = useState('')

  useEffect(() => {
    getBooking(id)
      .then(b => {
        setBooking(b)
        if (b.payment) {
          setSlipForm(f => ({ ...f, paymentAccountId: String(b.payment.paymentAccountId), referenceNumber: b.payment.referenceNumber ?? '' }))
          setSlipSuccess(true)
        }
        if (b.bookableType === 'flight' && b.bookableId) {
          getFlight(b.bookableId).then(setFlight).catch(() => {})
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
    if (slipForm.slipImage) {
      const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf']
      if (!allowed.includes(slipForm.slipImage.type)) {
        setSlipError('Invalid file format. Please upload JPG, JPEG, PNG, or PDF only.')
        return
      }
      if (slipForm.slipImage.size < 50 * 1024) {
        setSlipError('File is too small. Minimum allowed size is 50 KB.')
        return
      }
      if (slipForm.slipImage.size > 10 * 1024 * 1024) {
        setSlipError('File is too large. Maximum allowed size is 10 MB.')
        return
      }
    }
    setSubmitting(true)
    try {
      const formData = new FormData()
      formData.append('paymentAccountId', slipForm.paymentAccountId)
      formData.append('referenceNumber', slipForm.referenceNumber)
      if (slipForm.slipImage) formData.append('slipImage', slipForm.slipImage)
      await submitPaymentSlip(id, formData)
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

  const legs = flight?.legs ?? []

  return (
    <div className="space-y-5">

      {/* ── Page header ── */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">My Airline Booking</h1>
          {booking.bookedByName && (
            <p className="text-sm text-red-600 font-medium mt-0.5">
              Added By User - {booking.bookedByName}
            </p>
          )}
          <p className="text-sm text-gray-500 mt-0.5">
            Booked On: {fmtBookedOn(booking.createdAt)}
          </p>
          <p className="text-sm mt-0.5">
            <span className="text-green-700 font-semibold">AG# {booking.bookableId}</span>
            {' - '}
            <span className="text-red-600 font-semibold">BK# {booking.id}</span>
          </p>
          {booking.status === 'PENDING' && booking.expiresAt && (
            <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
              <span>Expires in</span>
              <CountdownTimer expiresAt={booking.expiresAt} />
            </div>
          )}
        </div>
        <nav className="text-xs text-gray-400 text-right">
          Home / My Airline Booking Details
        </nav>
      </div>

      {/* ── Status alerts ── */}
      {confirmed && (
        <div className="rounded-md bg-green-50 border border-green-200 p-3 text-green-700 text-sm font-medium">
          Booking confirmed successfully!
        </div>
      )}
      {booking.status === 'CONFIRMED' && !confirmed && (
        <div className="rounded-md bg-green-50 border border-green-200 p-3 text-green-700 text-sm font-medium flex items-center gap-2">
          <span>✓</span> Booking Confirmed by Admin
          {booking.paymentComment && <span className="font-normal ml-2">{booking.paymentComment}</span>}
        </div>
      )}
      {booking.status === 'CANCELLED' && (
        <div className="rounded-md bg-red-50 border border-red-200 p-3 text-red-700 text-sm font-medium flex items-center gap-2">
          <span>✕</span> Booking Rejected / Cancelled
          {booking.paymentComment && <span className="font-normal ml-2">{booking.paymentComment}</span>}
        </div>
      )}

      {/* ── Airline Group Details panel ── */}
      <div className="border border-blue-200 rounded-lg overflow-hidden">
        <div className="bg-blue-600 text-white px-4 py-2 font-semibold text-sm flex items-center gap-2">
          <span>✈</span> Airline Group Details
        </div>
        <div className="bg-white p-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <FieldBox label="Group Category" value={booking.groupName} />
          <FieldBox label="Group Name"     value={booking.bookableTitle || booking.flightNumber} />
          <FieldBox label="Airline"        value={booking.airlineName} />
          <FieldBox label="Group Type"     value="ONE WAY" />
          <FieldBox label="No of Seats"    value={flight?.seatQuota != null ? String(flight.seatQuota) : '—'} />
          <FieldBox label="PNR"            value={booking.pnrCode} />
        </div>
        {booking.airlineLogoUrl && (
          <div className="bg-white px-4 pb-3">
            <img src={booking.airlineLogoUrl} alt={booking.airlineName} className="h-10 object-contain" />
          </div>
        )}
      </div>

      {/* ── Flight legs table ── */}
      {legs.length > 0 && (
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <div className="bg-gray-800 text-white px-4 py-2 font-semibold text-sm">
            Flight Sectors
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="bg-gray-100 text-gray-700">
                  {['Flight #', 'Dep Date', 'Dep Time', 'Sector From', 'From Terminal', 'Sector TO', 'To Terminal', 'Class', 'Arr Date', 'Arr Time', 'Meal', 'Baggage'].map(h => (
                    <th key={h} className="px-3 py-2 text-left font-semibold border-r border-gray-200 last:border-0 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {legs.map((leg, i) => (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="px-3 py-2 border-r border-gray-100 font-mono font-semibold">{leg.flightNumber || '—'}</td>
                    <td className="px-3 py-2 border-r border-gray-100 whitespace-nowrap">{fmtDateDMY(leg.departAt)}</td>
                    <td className="px-3 py-2 border-r border-gray-100 whitespace-nowrap">{fmtTime(leg.departAt)}</td>
                    <td className="px-3 py-2 border-r border-gray-100">
                      <select disabled className="bg-transparent text-xs font-semibold text-gray-700 border-0 p-0 cursor-default">
                        <option>{leg.origin || '—'}</option>
                      </select>
                    </td>
                    <td className="px-3 py-2 border-r border-gray-100 text-gray-400">—</td>
                    <td className="px-3 py-2 border-r border-gray-100">
                      <select disabled className="bg-transparent text-xs font-semibold text-gray-700 border-0 p-0 cursor-default">
                        <option>{leg.destination || '—'}</option>
                      </select>
                    </td>
                    <td className="px-3 py-2 border-r border-gray-100 text-gray-400">—</td>
                    <td className="px-3 py-2 border-r border-gray-100 uppercase">{leg.flightClass || 'Economy'}</td>
                    <td className="px-3 py-2 border-r border-gray-100 whitespace-nowrap">{fmtDateDMY(leg.arriveAt)}</td>
                    <td className="px-3 py-2 border-r border-gray-100 whitespace-nowrap">{fmtTime(leg.arriveAt)}</td>
                    <td className="px-3 py-2 border-r border-gray-100">Yes</td>
                    <td className="px-3 py-2">{leg.baggageKg != null ? `${leg.baggageKg} Kg` : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Passenger table ── */}
      {booking.passengers?.length > 0 && (
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <div className="bg-gray-800 text-white px-4 py-2 font-semibold text-sm">
            Passenger Details
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="bg-gray-100 text-gray-700">
                  {['Title', 'Surname', 'Given Name', 'Type', 'Passport', 'DOB', 'DOI', 'DOE', 'PNR', 'Ticket No', 'Price', 'Status', 'Ticket'].map(h => (
                    <th key={h} className="px-2 py-2 text-left font-semibold border-r border-gray-200 last:border-0 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {booking.passengers.map((p, i) => (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="px-2 py-2 border-r border-gray-100">{p.title || '—'}</td>
                    <td className="px-2 py-2 border-r border-gray-100 font-medium">{p.lastName || '—'}</td>
                    <td className="px-2 py-2 border-r border-gray-100">{p.firstName || '—'}</td>
                    <td className="px-2 py-2 border-r border-gray-100">
                      <span className="inline-flex px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800 uppercase">
                        {p.type}
                      </span>
                    </td>
                    <td className="px-2 py-2 border-r border-gray-100 font-mono">{p.passportNo || '—'}</td>
                    <td className="px-2 py-2 border-r border-gray-100 whitespace-nowrap">{p.dateOfBirth ? fmtDate(p.dateOfBirth) : 'N/A'}</td>
                    <td className="px-2 py-2 border-r border-gray-100 text-gray-400">N/A</td>
                    <td className="px-2 py-2 border-r border-gray-100 whitespace-nowrap">{p.passportExpiry ? fmtDate(p.passportExpiry) : 'N/A'}</td>
                    <td className="px-2 py-2 border-r border-gray-100 font-mono text-gray-600">
                      {booking.pnrCode ? (
                        <div>
                          <div>PNR 1: {booking.pnrCode}</div>
                          <div className="text-gray-400">PNR 2:</div>
                        </div>
                      ) : '—'}
                    </td>
                    <td className="px-2 py-2 border-r border-gray-100 text-gray-400">—</td>
                    <td className="px-2 py-2 border-r border-gray-100 whitespace-nowrap font-semibold text-gray-800">
                      {fareForType(flight, p.type)}
                    </td>
                    <td className="px-2 py-2 border-r border-gray-100">
                      <StatusBadge status={booking.status} />
                    </td>
                    <td className="px-2 py-2">
                      {booking.status !== 'CANCELLED'
                        ? <a href={`/bookings/${booking.id}/ticket`} target="_blank" rel="noreferrer"
                             className="inline-flex items-center px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-semibold rounded whitespace-nowrap">
                            Print Ticket
                          </a>
                        : <span className="text-gray-400 text-xs">N/A</span>
                      }
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Payment slip section ── */}
      {(isAgent || isAgencyAdmin) && booking.status === 'PENDING' && (
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <div className="bg-gray-800 text-white px-4 py-2 font-semibold text-sm">Submit Payment</div>
          <div className="p-4">
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
                <button onClick={() => setSlipSuccess(false)} className="text-xs text-blue-600 hover:underline">
                  Update slip
                </button>
              </div>
            ) : (
              <form onSubmit={handleSlipSubmit} className="space-y-4">
                {parentAccounts.length === 0 ? (
                  <p className="text-sm text-gray-400">Your admin has not added any payment accounts yet.</p>
                ) : (
                  <>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Select Payment Account *</label>
                      <select required value={slipForm.paymentAccountId}
                        onChange={e => setSlipForm(f => ({ ...f, paymentAccountId: e.target.value }))}
                        className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                        <option value="">— Select account —</option>
                        {parentAccounts.map(a => (
                          <option key={a.id} value={a.id}>{a.accountName} — {a.bankAccountNumber}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Reference Number *</label>
                      <input required type="text" value={slipForm.referenceNumber}
                        onChange={e => setSlipForm(f => ({ ...f, referenceNumber: e.target.value }))}
                        placeholder="e.g. TXN123456789"
                        className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Payment Slip Image</label>
                      <input type="file" accept="image/jpeg,image/jpg,image/png,application/pdf"
                        onChange={e => setSlipForm(f => ({ ...f, slipImage: e.target.files?.[0] ?? null }))}
                        className="w-full text-sm text-gray-600 file:mr-3 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-xs file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
                      <p className="text-xs text-gray-400 mt-1">
                        Accepted formats: JPG, JPEG, PNG, PDF &bull; File size: 50 KB – 10 MB
                      </p>
                    </div>
                    <ErrorMessage message={slipError} />
                    <Button type="submit" variant="primary" disabled={submitting}>
                      {submitting ? 'Submitting...' : 'Submit Payment Slip'}
                    </Button>
                  </>
                )}
              </form>
            )}
          </div>
        </div>
      )}

      <ErrorMessage message={error} />

      {/* ── Action buttons ── */}
      <div className="flex gap-3 flex-wrap items-center">
        <Button variant="secondary" onClick={() => navigate('/bookings')}>Back to Bookings</Button>

        {booking.status === 'PENDING' && canConfirm && booking.bookedByUserId !== user?.id && (
          <Button variant="success" disabled={confirming} onClick={handleConfirm}>
            {confirming ? 'Confirming...' : 'Confirm Booking'}
          </Button>
        )}
        {booking.status === 'PENDING' && !canConfirm && !isAgent && (
          <span className="text-sm text-yellow-600 bg-yellow-50 border border-yellow-200 rounded px-3 py-2">
            Submitted — awaiting approval from your admin
          </span>
        )}
        {booking.status === 'CONFIRMED' && (
          <a href={`/api/bookings/${booking.id}/invoice`} target="_blank" rel="noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 bg-gray-800 text-white text-sm rounded hover:bg-gray-700">
            Download Invoice (PDF)
          </a>
        )}
        <a href={`/bookings/${booking.id}/ticket`} target="_blank" rel="noreferrer"
          className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-400 hover:bg-yellow-500 text-gray-900 text-sm rounded font-semibold">
          Print E-Ticket
        </a>
      </div>
    </div>
  )
}
