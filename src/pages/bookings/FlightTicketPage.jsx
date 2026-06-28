import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { getBooking } from '../../api/bookings'
import { getFlight } from '../../api/flights'
import Spinner from '../../components/ui/Spinner'

// Simple airport-code → city name map for common routes
const CITY_MAP = {
  LHE: 'Lahore', KHI: 'Karachi', ISB: 'Islamabad', PEW: 'Peshawar',
  MUX: 'Multan', SKT: 'Sialkot', LYP: 'Faisalabad', RYK: 'Rahim Yar Khan',
  JED: 'Jeddah', RUH: 'Riyadh', MED: 'Madinah', DXB: 'Dubai',
  AUH: 'Abu Dhabi', DOH: 'Doha', KWI: 'Kuwait City', BAH: 'Bahrain',
  MCT: 'Muscat', AMD: 'Amritsar', DEL: 'Delhi', BOM: 'Mumbai',
  LHR: 'London', CDG: 'Paris', FRA: 'Frankfurt', IST: 'Istanbul',
  KUL: 'Kuala Lumpur', BKK: 'Bangkok', SIN: 'Singapore',
}

const COUNTRY_MAP = {
  LHE: 'PAKISTAN', KHI: 'PAKISTAN', ISB: 'PAKISTAN', PEW: 'PAKISTAN',
  MUX: 'PAKISTAN', SKT: 'PAKISTAN', LYP: 'PAKISTAN', RYK: 'PAKISTAN',
  JED: 'SAUDI ARABIA', RUH: 'SAUDI ARABIA', MED: 'SAUDI ARABIA',
  DXB: 'UAE', AUH: 'UAE', DOH: 'QATAR', KWI: 'KUWAIT',
  BAH: 'BAHRAIN', MCT: 'OMAN', AMD: 'INDIA', DEL: 'INDIA', BOM: 'INDIA',
  LHR: 'UK', CDG: 'FRANCE', FRA: 'GERMANY', IST: 'TURKEY',
  KUL: 'MALAYSIA', BKK: 'THAILAND', SIN: 'SINGAPORE',
}

function city(code) {
  return CITY_MAP[code] || code
}

function country(code) {
  return COUNTRY_MAP[code] || ''
}

function fmtFullDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-GB', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })
}

function fmtShortDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-GB', {
    weekday: 'short', day: '2-digit', month: 'short', year: 'numeric',
  })
}

function fmtTime(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
}

function passengerStatus(bookingStatus) {
  if (bookingStatus === 'CONFIRMED') return 'CONFIRMED'
  return 'ON HOLD'
}

const RULES = [
  'Please Report Airline Check-In Counter 4 Hours Before Flight Departure.',
  'Please Reconfirm the Ticket Before 48 Hours of Flight Departure.',
  'All Visa and Travel Document are Traveler Own Responsibility.',
  'All Groups Tickets are Non-Refundable and Non-Changeable.',
  'All (Non-PK market / LLC) tickets are Non-Refundable / Non-Changeable.',
]

export default function FlightTicketPage() {
  const { id } = useParams()
  const [booking, setBooking]   = useState(null)
  const [flight, setFlight]     = useState(null)
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState('')

  useEffect(() => {
    getBooking(id)
      .then(b => {
        setBooking(b)
        if (b.bookableType === 'flight' && b.bookableId) {
          return getFlight(b.bookableId).then(setFlight)
        }
      })
      .catch(() => setError('Failed to load booking.'))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) {
    return <div className="flex justify-center py-20"><Spinner size="lg" /></div>
  }

  if (error || !booking) {
    return <div className="p-8 text-red-600">{error || 'Booking not found.'}</div>
  }

  const legs     = flight?.legs ?? []
  const firstLeg = legs[0]
  const pStatus  = passengerStatus(booking.status)

  return (
    <div className="min-h-screen bg-white">
      {/* Print button — hidden when printing */}
      <div className="flex justify-end p-4 print:hidden">
        <button
          onClick={() => window.print()}
          className="px-5 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-semibold rounded"
        >
          Print
        </button>
      </div>

      <div className="max-w-4xl mx-auto px-6 pb-10">

        {/* ── Header ── */}
        <div className="flex items-center justify-between mb-4">
          <div>
            {(booking.airlineLogoUrl || firstLeg?.airlineLogoUrl) && (
              <img
                src={booking.airlineLogoUrl || firstLeg.airlineLogoUrl}
                alt={booking.airlineName || firstLeg?.airlineCode}
                className="h-14 object-contain"
              />
            )}
          </div>
          <div className="text-center flex-1">
            <h1 className="text-xl font-bold text-gray-800">E-Ticket Voucher</h1>
          </div>
          <div className="w-32" />
        </div>

        {/* ── Status banner ── */}
        <div className="border border-gray-300 rounded mb-4 overflow-hidden">
          <div className="flex items-start justify-between p-3 gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-orange-400 inline-block" />
                <span className="text-base font-semibold text-orange-700">
                  {booking.status === 'CONFIRMED' ? 'Your booking is Confirmed' : 'Your booking is On Hold'}
                </span>
              </div>
              <div className="text-xs text-gray-700 ml-5 mt-0.5">Thank you for booking with us.</div>
              <div className="text-xs text-gray-700 ml-5">Passenger details</div>
            </div>
            <div className="text-right shrink-0">
              {firstLeg?.departAt && (
                <div className="text-sm font-bold text-blue-600">
                  Departure Date: {fmtShortDate(firstLeg.departAt)}
                </div>
              )}
              {booking.pnrCode && (
                <div className="text-sm font-bold text-gray-700 mt-0.5">
                  PNR: {booking.pnrCode}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Passenger table ── */}
        <div className="mb-4 border border-gray-300 rounded overflow-hidden">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-blue-600 text-white">
                <th className="px-4 py-2 text-left font-semibold border-r border-blue-500">
                  👤 Passenger Name
                </th>
                <th className="px-4 py-2 text-left font-semibold border-r border-blue-500">
                  🛂 Passport No
                </th>
                <th className="px-4 py-2 text-left font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {booking.passengers?.map((p, i) => (
                <tr key={i} className="bg-green-50">
                  <td className="px-4 py-2 font-medium text-gray-800">
                    {[p.title, p.firstName, p.lastName].filter(Boolean).join(' ').toUpperCase()}
                  </td>
                  <td className="px-4 py-2 font-mono text-gray-700">
                    {p.passportNo || 'N/A'}
                  </td>
                  <td className="px-4 py-2 font-semibold text-gray-700">
                    {pStatus}
                  </td>
                </tr>
              ))}
              {(!booking.passengers || booking.passengers.length === 0) && (
                <tr>
                  <td colSpan={3} className="px-4 py-3 text-gray-400 text-center">No passengers</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* ── Per-leg sections ── */}
        {legs.map((leg, i) => (
          <div key={i} className="mb-4 border border-gray-300 rounded overflow-hidden">
            {/* Leg header */}
            <div className="bg-blue-600 text-white px-4 py-2 flex items-center gap-2">
              <span>✈</span>
              <span className="font-semibold text-sm">
                Departure from {city(leg.origin)} (Flight {leg.flightNumber || '—'})
              </span>
            </div>

            {/* Leg details grid */}
            <div className="grid grid-cols-3 text-sm divide-x divide-gray-200">
              {/* Left — dates */}
              <div className="p-3 space-y-1">
                <div className="text-gray-600">{fmtFullDate(leg.departAt)}</div>
                <div className="text-xl font-bold text-gray-900">{fmtTime(leg.departAt)}</div>
                <div className="font-bold text-gray-800">{leg.origin}</div>
                <div className="text-xs text-gray-500">{city(leg.origin)},{country(leg.origin)}</div>
              </div>

              {/* Middle — arrival */}
              <div className="p-3 space-y-1">
                <div className="text-gray-600">{fmtFullDate(leg.arriveAt)}</div>
                <div className="text-xl font-bold text-gray-900">{fmtTime(leg.arriveAt)}</div>
                <div className="font-bold text-gray-800">{leg.destination}</div>
                <div className="text-xs text-gray-500">{city(leg.destination)},{country(leg.destination)}</div>
              </div>

              {/* Right — class + extras */}
              <div className="p-3 space-y-1 text-sm">
                <div className="font-bold text-gray-800 uppercase">
                  {leg.flightClass || 'ECONOMY'}
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <span>🧳</span>
                  <span>{leg.baggageKg != null ? leg.baggageKg : '—'}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <span>🍽️</span>
                  <span>Yes</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <span>💺</span>
                  <span>Unassigned</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <span>🎧</span>
                  <span className="text-xs">Buy on board, if available</span>
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* ── Emergency Contact ── */}
        <div className="border border-gray-300 rounded p-4 mb-4">
          <div className="text-sm font-bold text-center text-gray-700 mb-2">Emergency Contact</div>
          <div className="text-sm text-center text-gray-600">
            <span className="font-medium">👤 Contact Person:</span>{' '}
            {booking.bookedByName || '—'}
            {flight?.contactPersonPhone && (
              <>
                {' '}|{' '}
                <span className="font-medium">📞 Contact No:</span>{' '}
                {flight.contactPersonPhone}
              </>
            )}
          </div>
        </div>

        {/* ── Rules ── */}
        <div className="border border-gray-300 rounded p-4">
          <div className="font-bold text-gray-800 mb-2">Rules:-</div>
          <ul className="space-y-1">
            {RULES.map((r, i) => (
              <li key={i} className="text-sm text-blue-600">• {r}</li>
            ))}
          </ul>
        </div>

      </div>

      {/* Print styles */}
      <style>{`
        @media print {
          .print\\:hidden { display: none !important; }
          body { margin: 0; }
        }
      `}</style>
    </div>
  )
}
