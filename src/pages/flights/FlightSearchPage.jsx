import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { searchFlights } from '../../api/flights'
import { getAirlines } from '../../api/airlines'
import { getRoutes } from '../../api/routes'
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


export default function FlightSearchPage() {
  const navigate = useNavigate()
  const [airlines, setAirlines]   = useState([])
  const [origins, setOrigins]     = useState([])   // LOV for From
  const [destinations, setDestinations] = useState([])  // LOV for To
  const [form, setForm] = useState({
    origin: '', destination: '', date: '',
    airlineId: '', minPrice: '', maxPrice: '',
  })
  const [flights, setFlights] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [expandedId, setExpandedId] = useState(null)

  useEffect(() => {
    getAirlines().then(setAirlines).catch(() => {})
    getRoutes().then(routes => {
      const origs = [...new Set(routes.map(r => r.origin).filter(Boolean))].sort()
      const dests = [...new Set(routes.map(r => r.destination).filter(Boolean))].sort()
      setOrigins(origs)
      setDestinations(dests)
    }).catch(() => {})
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
    setForm({ origin: '', destination: '', date: '', airlineId: '', minPrice: '', maxPrice: '' })
    loadAll()
  }

  function handleBook(flight) {
    navigate(`/flights/${flight.id}/book`)
  }

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-semibold text-gray-900">Search Flights</h1>

      <Card className="p-5">
        <form onSubmit={handleSearch} className="space-y-4">

          {/* Primary row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {/* Origin LOV */}
            <label className="block text-sm">
              <span className="block text-gray-600 mb-1">From</span>
              <select
                value={form.origin} onChange={set('origin')}
                className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="">All Origins</option>
                {origins.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </label>

            {/* Destination LOV */}
            <label className="block text-sm">
              <span className="block text-gray-600 mb-1">To</span>
              <select
                value={form.destination} onChange={set('destination')}
                className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="">All Destinations</option>
                {destinations.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </label>

            <Field label="Date" value={form.date} onChange={set('date')} type="date" />

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
                  value={form.airlineId} onChange={set('airlineId')}
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

          {/* Actions row */}
          <div className="flex justify-end gap-2 pt-1 border-t border-gray-100">
            <button type="button" onClick={handleReset}
              className="px-4 py-1.5 border border-gray-300 rounded-md text-sm text-gray-600 hover:bg-gray-50">
              Reset
            </button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Searching…' : 'Search'}
            </Button>
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
                  passengers={{ adults: 1, children: 0, infants: 0 }}
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

  const legs = flight.legs ?? []
  const firstLeg = legs[0]
  const lastLeg  = legs[legs.length - 1]
  const origin      = firstLeg?.origin      ?? flight.origin
  const destination = lastLeg?.destination  ?? flight.destination
  const departAt    = firstLeg?.departAt    ?? flight.departAt
  const arriveAt    = lastLeg?.arriveAt     ?? flight.arriveAt
  const stops = legs.length > 1 ? legs.slice(0, -1).map(l => l.destination) : []

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
              <div className="text-2xl font-bold text-gray-900">{formatTime(departAt)}</div>
              <div className="text-sm font-medium text-gray-700">{origin}</div>
              <div className="text-xs text-gray-400">{formatDate(departAt)}</div>
            </div>

            <div className="text-center px-3">
              {flight.airlineLogoUrl && (
                <img src={flight.airlineLogoUrl} alt={flight.airlineCode}
                  className="h-7 object-contain mx-auto mb-1" />
              )}
              <div className="relative flex items-center">
                <div className="h-px w-20 bg-gray-300" />
                <span className="mx-1 text-gray-400 text-xs">✈</span>
                <div className="h-px w-20 bg-gray-300" />
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {flight.airlineCode && <span className="font-mono">{flight.airlineCode}</span>}
                {flight.airlineName && <span className="ml-1 text-gray-400">· {flight.airlineName}</span>}
              </div>
              {flight.flightNumber && (
                <div className="text-xs text-gray-400 font-mono mt-0.5">{flight.flightNumber}</div>
              )}
              {flight.pnrCode && (
                <div className="text-xs font-medium mt-0.5">
                  <span className="bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-mono">PNR: {flight.pnrCode}</span>
                </div>
              )}
              {stops.length > 0 && (
                <div className="text-xs text-amber-600 font-medium mt-0.5">via {stops.join(', ')}</div>
              )}
            </div>

            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{formatTime(arriveAt)}</div>
              <div className="text-sm font-medium text-gray-700">{destination}</div>
              <div className="text-xs text-gray-400">{formatDate(arriveAt)}</div>
            </div>
          </div>

          {/* Pricing + actions */}
          <div className="flex items-center gap-6">
            <div className="text-right space-y-0.5">
              {flight.groupName && (
                <div className="text-xs font-medium text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full mb-1 inline-block">
                  {flight.groupName}
                </div>
              )}
              <div className="text-xl font-bold text-blue-600">
                PKR {Number(flight.fareAdult).toLocaleString()}
              </div>
              <div className="text-xs text-gray-400">per adult</div>
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

          {/* Legs table */}
          {legs.length > 0 && (
            <div>
              <div className="text-xs text-gray-400 uppercase tracking-wide mb-2">Flight Itinerary</div>
              <table className="w-full text-xs border border-gray-200 rounded overflow-hidden">
                <thead className="bg-gray-100">
                  <tr>
                    {['Leg', 'From', 'To', 'Departure', 'Arrival', 'Baggage'].map(h => (
                      <th key={h} className="text-left px-3 py-2 font-medium text-gray-500">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                  {legs.map((leg, i) => (
                    <tr key={i}>
                      <td className="px-3 py-2 text-gray-400">{i + 1}</td>
                      <td className="px-3 py-2 font-medium text-gray-800">{leg.origin}</td>
                      <td className="px-3 py-2 font-medium text-gray-800">{leg.destination}</td>
                      <td className="px-3 py-2 text-gray-600">{leg.departAt ? new Date(leg.departAt).toLocaleString() : '—'}</td>
                      <td className="px-3 py-2 text-gray-600">{leg.arriveAt ? new Date(leg.arriveAt).toLocaleString() : '—'}</td>
                      <td className="px-3 py-2 text-gray-600">{leg.baggageKg != null ? `${leg.baggageKg} kg` : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {/* Taxes */}
            {flight.taxTotal != null && (
              <div>
                <div className="text-xs text-gray-400 uppercase tracking-wide mb-1">Taxes & Fees</div>
                <div className="text-gray-700">PKR {Number(flight.taxTotal).toLocaleString()}</div>
              </div>
            )}

            {/* Flight identifiers */}
            {flight.flightNumber && (
              <div>
                <div className="text-xs text-gray-400 uppercase tracking-wide mb-1">Flight Number</div>
                <div className="font-mono text-gray-800">{flight.flightNumber}</div>
              </div>
            )}
            {flight.pnrCode && (
              <div>
                <div className="text-xs text-gray-400 uppercase tracking-wide mb-1">PNR Code</div>
                <div className="font-mono text-gray-800">{flight.pnrCode}</div>
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
