import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { searchFlights } from '../../api/flights'
import { getAirlines } from '../../api/airlines'
import { EXTRAS_CONFIG } from '../../components/ui/ExtrasEditor'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Spinner from '../../components/ui/Spinner'
import ErrorMessage from '../../components/ui/ErrorMessage'

function formatTime(dt) {
  if (!dt) return '—'
  return new Date(dt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

function formatDate(dt) {
  if (!dt) return '—'
  return new Date(dt).toLocaleDateString([], { day: '2-digit', month: 'short', year: 'numeric' })
}

function formatDuration(mins) {
  if (!mins) return null
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return h > 0 ? `${h}h ${m}m` : `${m}m`
}

export default function FlightSearchPage() {
  const navigate = useNavigate()
  const [airlines, setAirlines] = useState([])
  const [form, setForm] = useState({
    origin: '', destination: '', date: '',
    airlineId: '', minPrice: '', maxPrice: '',
    adults: 1, children: 0, infants: 0,
  })
  const [flights, setFlights] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [expandedId, setExpandedId] = useState(null)

  useEffect(() => {
    getAirlines().then(setAirlines).catch(() => {})
    loadAll()
  }, [])

  function loadAll() {
    setLoading(true)
    searchFlights({ size: 100 })
      .then(r => setFlights(r.content ?? []))
      .catch(() => setError('Failed to load flights.'))
      .finally(() => setLoading(false))
  }

  function set(k) {
    return e => setForm(f => ({ ...f, [k]: e.target.value }))
  }

  async function handleSearch(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const params = {
        origin:      form.origin      || undefined,
        destination: form.destination || undefined,
        date:        form.date        || undefined,
        airlineId:   form.airlineId   || undefined,
        minPrice:    form.minPrice    || undefined,
        maxPrice:    form.maxPrice    || undefined,
        size: 50,
      }
      const result = await searchFlights(params)
      setFlights(result.content ?? [])
    } catch {
      setError('Search failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  function handleReset() {
    setForm({ origin: '', destination: '', date: '', airlineId: '', minPrice: '', maxPrice: '', adults: 1, children: 0, infants: 0 })
    loadAll()
  }

  function handleBook(flight) {
    navigate(`/flights/${flight.id}/book?adults=${form.adults}&children=${form.children}&infants=${form.infants}`)
  }

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-semibold text-gray-900">Search Flights</h1>

      <Card className="p-5">
        <form onSubmit={handleSearch} className="space-y-4">

          {/* Primary row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Field label="From" value={form.origin} onChange={set('origin')} placeholder="KHI" />
            <Field label="To"   value={form.destination} onChange={set('destination')} placeholder="LHE" />
            <Field label="Date"   value={form.date}   onChange={set('date')}   type="date" />
            <div className="flex items-end">
              <button
                type="button"
                onClick={() => setShowFilters(v => !v)}
                className="w-full py-1.5 border border-gray-300 rounded-md text-sm text-gray-600 hover:bg-gray-50"
              >
                {showFilters ? 'Hide Filters ▲' : 'More Filters ▼'}
              </button>
            </div>
          </div>

          {/* Expanded filters */}
          {showFilters && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-1 border-t border-gray-100">
              <label className="block text-sm">
                <span className="block text-gray-600 mb-1">Airline</span>
                <select
                  value={form.airlineId}
                  onChange={set('airlineId')}
                  className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="">All Airlines</option>
                  {airlines.map(a => (
                    <option key={a.id} value={a.id}>{a.code} – {a.name}</option>
                  ))}
                </select>
              </label>
              <Field label="Min Price (PKR)" value={form.minPrice} onChange={set('minPrice')} type="number" min="0" placeholder="0" />
              <Field label="Max Price (PKR)" value={form.maxPrice} onChange={set('maxPrice')} type="number" min="0" placeholder="999999" />
            </div>
          )}

          {/* Passengers + actions */}
          <div className="flex flex-wrap items-end gap-3 pt-1 border-t border-gray-100">
            <Field label="Adults"   value={form.adults}   onChange={set('adults')}   type="number" min="1" max="9" className="w-20" />
            <Field label="Children" value={form.children} onChange={set('children')} type="number" min="0" max="9" className="w-20" />
            <Field label="Infants"  value={form.infants}  onChange={set('infants')}  type="number" min="0" max="9" className="w-20" />
            <div className="flex gap-2 ml-auto">
              <button type="button" onClick={handleReset} className="px-4 py-1.5 border border-gray-300 rounded-md text-sm text-gray-600 hover:bg-gray-50">
                Reset
              </button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Searching…' : 'Search'}
              </Button>
            </div>
          </div>
        </form>
      </Card>

      <ErrorMessage message={error} />

      {loading && (
        <div className="flex justify-center py-12">
          <Spinner size="lg" />
        </div>
      )}

      {!loading && (
        <>
          <p className="text-sm text-gray-500">
            {flights.length} flight{flights.length !== 1 ? 's' : ''} found
          </p>

          {flights.length === 0 ? (
            <Card className="p-8 text-center text-gray-500">
              No flights match your search. Try adjusting the filters.
            </Card>
          ) : (
            <div className="space-y-3">
              {flights.map(flight => (
                <FlightCard
                  key={flight.id}
                  flight={flight}
                  passengers={{ adults: Number(form.adults), children: Number(form.children), infants: Number(form.infants) }}
                  onBook={() => handleBook(flight)}
                  expanded={expandedId === flight.id}
                  onToggle={() => setExpandedId(prev => prev === flight.id ? null : flight.id)}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}

function FlightCard({ flight, passengers, onBook, expanded, onToggle }) {
  const total =
    passengers.adults   * (Number(flight.fareAdult)  || 0) +
    passengers.children * (Number(flight.fareChild)  || 0) +
    passengers.infants  * (Number(flight.fareInfant) || 0)

  const isRoundTrip = flight.routeType === 'ROUND_TRIP'
  const enabledExtras = EXTRAS_CONFIG.filter(e => flight.extras?.[e.key]?.enabled)

  return (
    <Card className="overflow-hidden">
      {/* ── Summary row (always visible, clickable) ── */}
      <div
        className="p-5 cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={onToggle}
      >
        <div className="flex items-center justify-between flex-wrap gap-4">
          {/* Route */}
          <div className="flex items-center gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{formatTime(flight.departAt)}</div>
              <div className="text-sm font-medium text-gray-700">{flight.origin}</div>
              <div className="text-xs text-gray-400">{formatDate(flight.departAt)}</div>
            </div>

            <div className="text-center px-3">
              <div className="text-xs text-gray-400 mb-1">{formatDuration(flight.durationMins) ?? ''}</div>
              <div className="relative flex items-center">
                <div className="h-px w-20 bg-gray-300" />
                <span className="mx-1 text-gray-400 text-xs">✈</span>
                <div className="h-px w-20 bg-gray-300" />
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {flight.airlineCode && <span className="font-mono">{flight.airlineCode}</span>}
                {flight.airlineName && <span className="ml-1 text-gray-400">· {flight.airlineName}</span>}
              </div>
              {isRoundTrip && (
                <div className="text-xs text-indigo-600 font-medium mt-0.5">Round Trip</div>
              )}
            </div>

            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{formatTime(flight.arriveAt)}</div>
              <div className="text-sm font-medium text-gray-700">{flight.destination}</div>
              <div className="text-xs text-gray-400">{formatDate(flight.arriveAt)}</div>
            </div>
          </div>

          {/* Pricing + actions */}
          <div className="flex items-center gap-6">
            <div className="text-right space-y-0.5">
              <div className="text-xl font-bold text-blue-600">
                PKR {Number(flight.fareAdult).toLocaleString()}
              </div>
              <div className="text-xs text-gray-400">per adult{isRoundTrip ? ' (×2)' : ''}</div>
              {flight.fareChild != null && (
                <div className="text-xs text-gray-500">Child: PKR {Number(flight.fareChild).toLocaleString()}</div>
              )}
              {flight.fareInfant != null && (
                <div className="text-xs text-gray-500">Infant: PKR {Number(flight.fareInfant).toLocaleString()}</div>
              )}
              {total > 0 && (passengers.adults + passengers.children + passengers.infants > 1) && (
                <div className="text-xs font-medium text-gray-700 pt-1 border-t border-gray-100">
                  Total: PKR {total.toLocaleString()}
                </div>
              )}
              {flight.seatQuota != null && (
                <SeatBadge available={flight.availableSeats} quota={flight.seatQuota} />
              )}
            </div>
            <div className="flex flex-col items-center gap-2">
              <Button onClick={e => { e.stopPropagation(); onBook() }}>Book</Button>
              <span className="text-xs text-gray-400">{expanded ? '▲ Less' : '▼ Details'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Expanded detail panel ── */}
      {expanded && (
        <div className="border-t border-gray-100 bg-gray-50 px-5 py-4 space-y-4 text-sm">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">

            {/* Departure / Arrival full dates */}
            <div>
              <div className="text-xs text-gray-400 uppercase tracking-wide mb-1">Departure</div>
              <div className="font-medium text-gray-800">{flight.origin}</div>
              <div className="text-gray-600">{flight.departAt ? new Date(flight.departAt).toLocaleString() : '—'}</div>
            </div>
            <div>
              <div className="text-xs text-gray-400 uppercase tracking-wide mb-1">Arrival</div>
              <div className="font-medium text-gray-800">{flight.destination}</div>
              <div className="text-gray-600">{flight.arriveAt ? new Date(flight.arriveAt).toLocaleString() : '—'}</div>
            </div>

            {/* Route info */}
            <div>
              <div className="text-xs text-gray-400 uppercase tracking-wide mb-1">Route Type</div>
              <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                isRoundTrip ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-600'
              }`}>
                {isRoundTrip
                  ? `${flight.origin} → ${flight.destination} → ${flight.origin}`
                  : `${flight.origin} → ${flight.destination}`}
              </span>
            </div>

            {/* Taxes */}
            {flight.taxTotal != null && (
              <div>
                <div className="text-xs text-gray-400 uppercase tracking-wide mb-1">Taxes & Fees</div>
                <div className="text-gray-700">PKR {Number(flight.taxTotal).toLocaleString()}</div>
              </div>
            )}

            {/* Baggage */}
            {flight.baggageInfo && (
              <div>
                <div className="text-xs text-gray-400 uppercase tracking-wide mb-1">Baggage</div>
                <div className="text-gray-700">{flight.baggageInfo}</div>
              </div>
            )}

            {/* Status */}
            <div>
              <div className="text-xs text-gray-400 uppercase tracking-wide mb-1">Status</div>
              <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                flight.status === 'active' ? 'bg-green-100 text-green-700' :
                flight.status === 'draft'  ? 'bg-yellow-100 text-yellow-700' :
                'bg-red-100 text-red-700'
              }`}>{flight.status}</span>
            </div>
          </div>

          {/* Included extras */}
          {enabledExtras.length > 0 && (
            <div>
              <div className="text-xs text-gray-400 uppercase tracking-wide mb-2">Included Add-ons</div>
              <div className="flex flex-wrap gap-2">
                {enabledExtras.map(e => {
                  const price = Number(flight.extras[e.key]?.price ?? 0)
                  return (
                    <span key={e.key} className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 border border-blue-200 rounded-full text-xs text-blue-700">
                      {e.icon} {e.label}
                      {price > 0 && <span className="text-blue-500">· PKR {price.toLocaleString()}/pax</span>}
                    </span>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </Card>
  )
}

function SeatBadge({ available, quota }) {
  const pct = quota > 0 ? available / quota : 0
  const cls = available === 0
    ? 'bg-red-100 text-red-600'
    : pct <= 0.2
    ? 'bg-orange-100 text-orange-600'
    : 'bg-green-100 text-green-700'
  return (
    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${cls}`}>
      {available === 0 ? 'Full' : `${available} / ${quota} seats`}
    </span>
  )
}

function Field({ label, value, onChange, type = 'text', placeholder, min, max, required, className = '' }) {
  return (
    <label className={`block text-sm ${className}`}>
      <span className="block text-gray-600 mb-1">{label}</span>
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        min={min}
        max={max}
        required={required}
        className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
      />
    </label>
  )
}
