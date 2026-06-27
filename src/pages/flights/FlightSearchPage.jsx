import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { searchFlights } from '../../api/flights'
import { getAirlines } from '../../api/airlines'
import { getRoutes } from '../../api/routes'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Spinner from '../../components/ui/Spinner'
import ErrorMessage from '../../components/ui/ErrorMessage'


function fmtLegDate(iso) {
  if (!iso) return '—'
  const d = new Date(iso)
  return d.getDate().toString().padStart(2, '0') +
    d.toLocaleString('en-GB', { month: 'short' }).toUpperCase()
}

function fmtTime(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
}

function numDays(legs) {
  if (!legs?.length) return '—'
  const first = new Date(legs[0].departAt)
  const last  = new Date(legs[legs.length - 1].arriveAt)
  return Math.max(1, Math.round((last - first) / 86400000))
}

function headerRoute(f) {
  const airline = f.legs?.[0]?.airlineName || f.airlineName || ''
  const legs = f.legs ?? []
  const stops = legs.length ? [legs[0].origin, ...legs.map(l => l.destination)] : []
  return airline ? `${airline}-${stops.join('-')}` : stops.join('-')
}


export default function FlightSearchPage() {
  const navigate = useNavigate()
  const [airlines, setAirlines]   = useState([])
  const [origins, setOrigins]     = useState([])   // LOV for From
  const [destinations, setDestinations] = useState([])  // LOV for To
  const [form, setForm] = useState({
    origin: '', destination: '', dateFrom: '', dateTo: '', airlineId: '',
  })
  const [flights, setFlights] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

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
        dateFrom:    form.dateFrom    || undefined,
        dateTo:      form.dateTo      || undefined,
        airlineId:   form.airlineId   || undefined,
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
    setForm({ origin: '', destination: '', dateFrom: '', dateTo: '', airlineId: '' })
    loadAll()
  }

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-semibold text-gray-900">Search Flights</h1>

      <Card className="p-5">
        <form onSubmit={handleSearch}>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 items-end">
            {/* Airline */}
            <label className="block text-sm">
              <span className="block text-gray-800 font-semibold mb-1">Airline</span>
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

            {/* Sector From */}
            <label className="block text-sm">
              <span className="block text-gray-800 font-semibold mb-1">Sector From</span>
              <select
                value={form.origin} onChange={set('origin')}
                className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="">All Origins</option>
                {origins.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </label>

            {/* Sector To */}
            <label className="block text-sm">
              <span className="block text-gray-800 font-semibold mb-1">Sector To</span>
              <select
                value={form.destination} onChange={set('destination')}
                className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="">All Destinations</option>
                {destinations.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </label>

            <Field label="Date From" value={form.dateFrom} onChange={set('dateFrom')} type="date" />
            <Field label="Date To"   value={form.dateTo}   onChange={set('dateTo')}   type="date" />

            <div className="flex gap-2">
              <button type="button" onClick={handleReset}
                className="flex-1 py-1.5 border border-gray-300 rounded-md text-sm text-gray-700 font-semibold hover:bg-gray-50">
                Reset
              </button>
              <Button type="submit" disabled={loading} className="flex-1">
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
          <p className="text-sm text-gray-800 font-semibold">
            {flights.length} flight{flights.length !== 1 ? 's' : ''} found
          </p>

          {flights.length === 0 ? (
            <Card className="p-8 text-center text-gray-500">
              No flights match your search. Try adjusting the filters.
            </Card>
          ) : (
            <div className="space-y-5">
              {flights.map(f => {
                const legs = f.legs ?? []
                const firstLeg = legs[0]
                return (
                  <div key={f.id} className="border border-gray-300 rounded-lg overflow-hidden shadow-sm bg-white">

                    {/* ── Header ── */}
                    <div className="bg-white border-b border-gray-200 px-5 py-3 flex flex-wrap items-center gap-x-3 gap-y-1">
                      <span className="font-bold text-gray-800 text-sm uppercase tracking-wide">
                        {(f.groupName || '—').toUpperCase()}
                      </span>
                      <span className="text-gray-300">|</span>
                      <span className="text-green-600 font-semibold text-sm">{headerRoute(f)}</span>
                      <span className="text-gray-300">|</span>
                      <span className="text-sm text-gray-600">
                        Number Of Days&nbsp;<span className="font-bold text-green-600">{numDays(legs)}</span>
                      </span>
                      <span className="text-gray-300">|</span>
                      <span className="text-green-600 font-semibold text-sm">AG-{f.id}</span>
                    </div>

                    {/* ── Table ── */}
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="border-b border-gray-200">
                            <th className="px-4 py-2 text-left text-sm font-bold text-blue-600 border-r border-gray-200 w-44">Airline</th>
                            <th className="px-4 py-2 text-left text-sm font-bold text-blue-600 border-r border-gray-200">
                              Sector Details&nbsp;
                              <span className="text-xs font-normal text-gray-500">({f.groupName || '—'})</span>
                            </th>
                            <th className="px-4 py-2 text-left text-sm font-bold text-blue-600 border-r border-gray-200 w-44">Seats</th>
                            <th className="px-4 py-2 text-left text-sm font-bold text-blue-600 border-r border-gray-200 w-36">Dep Date</th>
                            <th className="px-4 py-2 text-left text-sm font-bold text-blue-600 w-40">Price</th>
                          </tr>
                        </thead>
                        <tbody>
                          {legs.length === 0 ? (
                            <tr>
                              <td colSpan={5} className="px-4 py-4 text-gray-400 text-xs italic">No legs defined</td>
                            </tr>
                          ) : (
                            <tr className="align-top">
                              {/* Airline — first leg only */}
                              <td className="px-4 py-3 border-r border-gray-200">
                                <div className="font-bold text-blue-700 text-sm uppercase leading-tight">
                                  {firstLeg?.airlineName || firstLeg?.airlineCode || '—'}
                                </div>
                                {firstLeg?.airlineLogoUrl && (
                                  <img src={firstLeg.airlineLogoUrl} alt={firstLeg.airlineCode}
                                    className="h-8 object-contain mt-1" />
                                )}
                              </td>

                              {/* Sector details — scrollable */}
                              <td className="px-4 py-3 border-r border-gray-200">
                                <div className="max-h-44 overflow-y-auto space-y-2 pr-1">
                                  {legs.map((leg, i) => (
                                    <div key={i} className="text-xs font-mono text-gray-900 flex flex-wrap items-baseline gap-x-1.5">
                                      <span className="text-gray-700 font-semibold shrink-0">{i + 1} )</span>
                                      <span className="font-bold text-gray-900">{leg.flightNumber || '—'}</span>
                                      <span className="font-bold">{fmtLegDate(leg.departAt)}</span>
                                      <span className="font-bold text-blue-700">{leg.origin}-{leg.destination}</span>
                                      <span className="font-bold">{fmtTime(leg.departAt)}</span>
                                      <span className="font-bold">{fmtTime(leg.arriveAt)}</span>
                                      {leg.baggageKg != null && (
                                        <span className="font-bold text-gray-700 whitespace-nowrap">{leg.baggageKg}-KG&nbsp;Baggage</span>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </td>

                              {/* Seats */}
                              <td className="px-4 py-3 border-r border-gray-200 text-sm">
                                <div className="text-gray-900 font-semibold">
                                  Total Seats:&nbsp;<span className="font-bold text-gray-900">{f.seatQuota ?? '—'}</span>
                                </div>
                                <div className="text-gray-900 font-semibold mt-1">
                                  Available Seats:&nbsp;
                                  <span className={`font-bold ${f.availableSeats === 0 ? 'text-red-600' : 'text-gray-900'}`}>
                                    {f.availableSeats ?? '—'}
                                  </span>
                                </div>
                              </td>

                              {/* Dep Date */}
                              <td className="px-4 py-3 border-r border-gray-200 text-sm font-bold text-green-700 whitespace-nowrap">
                                {firstLeg?.departAt
                                  ? new Date(firstLeg.departAt).toLocaleDateString('en-GB', {
                                      weekday: 'short', day: '2-digit', month: 'short', year: 'numeric'
                                    })
                                  : '—'}
                              </td>

                              {/* Price + Book Now */}
                              <td className="px-4 py-3">
                                <div className="text-sm font-bold text-gray-800 mb-3">
                                  PKR {Number(f.fareAdult).toLocaleString()}
                                </div>
                                <button
                                  onClick={() => navigate(`/flights/${f.id}/book`)}
                                  disabled={f.availableSeats === 0}
                                  className="px-5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-md disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                                >
                                  {f.availableSeats === 0 ? 'Full' : 'Book Now'}
                                </button>
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </>
      )}
    </div>
  )
}


function Field({ label, value, onChange, type = 'text', placeholder, min, max, required, className = '' }) {
  return (
    <label className={`block text-sm ${className}`}>
      <span className="block text-gray-800 font-semibold mb-1">{label}</span>
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
