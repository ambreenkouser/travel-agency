import { useEffect, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { getFlight } from '../../api/flights'
import { createBooking } from '../../api/bookings'
import { getHotels } from '../../api/hotels'
import { EXTRAS_CONFIG, extraPaxCount } from '../../components/ui/ExtrasEditor'
import Button from '../../components/ui/Button'
import Card from '../../components/ui/Card'
import Spinner from '../../components/ui/Spinner'
import ErrorMessage from '../../components/ui/ErrorMessage'

// ── Passenger type config ──────────────────────────────────────────────────
const TYPE_CONFIG = {
  ADULT:  { label: 'Adult',  color: 'bg-blue-600',   light: 'bg-blue-50 border-blue-200',  text: 'text-blue-700'  },
  CHILD:  { label: 'Child',  color: 'bg-green-600',  light: 'bg-green-50 border-green-200', text: 'text-green-700' },
  INFANT: { label: 'Infant', color: 'bg-orange-500', light: 'bg-orange-50 border-orange-200', text: 'text-orange-700' },
}

function emptyPassenger() {
  return { firstName: '', lastName: '', passportNo: '', nationality: '', dateOfBirth: '' }
}

function buildList(adults, children, infants) {
  return [
    ...Array.from({ length: adults },   (_, i) => ({ type: 'ADULT',  num: i + 1 })),
    ...Array.from({ length: children }, (_, i) => ({ type: 'CHILD',  num: i + 1 })),
    ...Array.from({ length: infants },  (_, i) => ({ type: 'INFANT', num: i + 1 })),
  ]
}

// ── Counter button ─────────────────────────────────────────────────────────
function Counter({ label, sublabel, value, min = 0, max = 9, onChange }) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <div className="text-sm font-medium text-gray-800">{label}</div>
        {sublabel && <div className="text-xs text-gray-400">{sublabel}</div>}
      </div>
      <div className="flex items-center gap-3">
        <button type="button"
          onClick={() => onChange(Math.max(min, value - 1))}
          disabled={value <= min}
          className="w-8 h-8 rounded-full border border-gray-300 text-gray-600 flex items-center justify-center text-lg hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
        >−</button>
        <span className="w-5 text-center text-sm font-semibold text-gray-900">{value}</span>
        <button type="button"
          onClick={() => onChange(Math.min(max, value + 1))}
          disabled={value >= max}
          className="w-8 h-8 rounded-full border border-gray-300 text-gray-600 flex items-center justify-center text-lg hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
        >+</button>
      </div>
    </div>
  )
}

// ── Main page ──────────────────────────────────────────────────────────────
export default function FlightBookingPage() {
  const { id } = useParams()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  // Passenger counts — pre-filled from search, adjustable here
  const [adults,   setAdults]   = useState(Math.max(1, parseInt(searchParams.get('adults')   || '1', 10)))
  const [children, setChildren] = useState(Math.max(0, parseInt(searchParams.get('children') || '0', 10)))
  const [infants,  setInfants]  = useState(Math.max(0, parseInt(searchParams.get('infants')  || '0', 10)))

  const [flight, setFlight]               = useState(null)
  const [hotels, setHotels]               = useState([])
  const [loadingFlight, setLoadingFlight] = useState(true)
  const [passengerData, setPassengerData] = useState({}) // key: "ADULT-1" → {firstName,...}
  const [selectedExtras, setSelectedExtras] = useState({}) // key → bool
  const [extraPrices, setExtraPrices]     = useState({})   // key → editable price (per person)
  const [selectedHotelId, setSelectedHotelId] = useState('')
  const [error, setError]                 = useState('')
  const [submitting, setSubmitting]       = useState(false)

  // Rebuild passenger slots when counts change, preserving existing data
  const passengerList = buildList(adults, children, infants)

  useEffect(() => {
    getFlight(id)
      .then(data => {
        setFlight(data)
        if (data.extras) {
          const preSelected = {}
          const preFares = {}
          Object.entries(data.extras).forEach(([k, v]) => {
            if (v?.enabled) preSelected[k] = true
            preFares[k] = v?.price ?? 0
          })
          setSelectedExtras(preSelected)
          setExtraPrices(preFares)
        }
      })
      .catch(() => setError('Failed to load flight details.'))
      .finally(() => setLoadingFlight(false))
    getHotels().then(setHotels).catch(() => {})
  }, [id])

  function getKey(type, num) { return `${type}-${num}` }

  function getP(type, num) {
    return passengerData[getKey(type, num)] ?? emptyPassenger()
  }

  function setP(type, num, field, value) {
    const key = getKey(type, num)
    setPassengerData(prev => ({
      ...prev,
      [key]: { ...( prev[key] ?? emptyPassenger() ), [field]: value },
    }))
  }

  // Pricing
  const fareAdult  = Number(flight?.fareAdult  || 0)
  const fareChild  = Number(flight?.fareChild  || 0)
  const fareInfant = Number(flight?.fareInfant || 0)
  const taxTotal   = Number(flight?.taxTotal   || 0)
  const subtotal   = adults * fareAdult + children * fareChild + infants * fareInfant
  const totalPassengers = adults + children + infants

  const availableExtras = flight?.extras
    ? EXTRAS_CONFIG.filter(e => flight.extras[e.key] !== undefined)
    : []

  function toggleExtra(key) {
    setSelectedExtras(prev => ({ ...prev, [key]: !prev[key] }))
  }
  function setExtraPrice(key, val) {
    setExtraPrices(prev => ({ ...prev, [key]: val === '' ? 0 : Number(val) }))
  }

  const extrasTotal = availableExtras.reduce((sum, e) => {
    if (!selectedExtras[e.key]) return sum
    const pax = extraPaxCount(e.key, adults, children, infants)
    return sum + ((extraPrices[e.key] ?? 0) * pax)
  }, 0)

  const grandTotal = subtotal + taxTotal + extrasTotal

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      const passengers = passengerList.map(({ type, num }) => {
        const p = getP(type, num)
        return {
          type,
          firstName:   p.firstName,
          lastName:    p.lastName,
          passportNo:  p.passportNo  || null,
          nationality: p.nationality || null,
          dateOfBirth: p.dateOfBirth || null,
        }
      })
      const booking = await createBooking({
        bookableType: 'flight',
        bookableId:   Number(id),
        selectedHotelId: selectedHotelId ? Number(selectedHotelId) : null,
        extrasFee: extrasTotal, // pre-calculated total (infant exemption already applied)
        passengers,
      })
      navigate(`/bookings/${booking.id}/confirm`)
    } catch {
      setError('Failed to create booking. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loadingFlight) {
    return <div className="flex justify-center py-20"><Spinner size="lg" /></div>
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <h1 className="text-xl font-semibold text-gray-900">Book Flight</h1>

      {/* ── Flight summary ── */}
      {flight && (
        <Card className="p-5 space-y-4">
          {/* Airline header row */}
          <div className="flex items-center gap-4">
            {flight.airlineLogoUrl && (
              <img src={flight.airlineLogoUrl} alt={flight.airlineCode}
                className="h-10 w-20 object-contain shrink-0 rounded border border-gray-100 p-1" />
            )}
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-gray-800">
                {flight.airlineCode}{flight.airlineName ? ` · ${flight.airlineName}` : ''}
              </div>
              <div className="flex flex-wrap gap-3 mt-1 text-xs text-gray-500">
                {flight.flightNumber && (
                  <span className="font-mono bg-gray-100 px-1.5 py-0.5 rounded">
                    Flight {flight.flightNumber}
                  </span>
                )}
                {flight.groupName && (
                  <span className="bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded font-medium">
                    {flight.groupName}
                  </span>
                )}
                {flight.seatQuota != null && (
                  <span className={`px-1.5 py-0.5 rounded font-medium ${
                    flight.availableSeats === 0
                      ? 'bg-red-100 text-red-600'
                      : flight.availableSeats <= Math.ceil(flight.seatQuota * 0.2)
                      ? 'bg-orange-100 text-orange-600'
                      : 'bg-green-100 text-green-700'
                  }`}>
                    {flight.availableSeats === 0
                      ? 'Fully booked'
                      : `${flight.availableSeats} of ${flight.seatQuota} seats available`}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Route */}
          <div className="flex items-center gap-3">
            <div>
              <div className="text-2xl font-bold text-gray-900">{flight.origin}</div>
              {flight.departAt && (
                <div className="text-xs text-gray-400">{new Date(flight.departAt).toLocaleString()}</div>
              )}
            </div>
            <div className="flex-1 text-center text-gray-300 text-xl">→</div>
            <div className="text-right">
              <div className="text-2xl font-bold text-gray-900">{flight.destination}</div>
              {flight.arriveAt && (
                <div className="text-xs text-gray-400">{new Date(flight.arriveAt).toLocaleString()}</div>
              )}
            </div>
          </div>
          {flight.legs?.length > 1 && (
            <div className="text-xs text-amber-600 font-medium -mt-2">
              via {flight.legs.slice(0, -1).map(l => l.destination).join(', ')}
            </div>
          )}

          {/* Itinerary table — always shown when legs exist */}
          {flight.legs?.length > 0 && (
            <div className="border-t border-gray-100 pt-3">
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Flight Itinerary</div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs border border-gray-200 rounded overflow-hidden">
                  <thead className="bg-gray-50">
                    <tr>
                      {['Leg', 'From', 'To', 'Departure', 'Arrival', 'Baggage'].map(h => (
                        <th key={h} className="text-left px-2 py-1.5 font-medium text-gray-500">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 bg-white">
                    {flight.legs.map((leg, i) => (
                      <tr key={i}>
                        <td className="px-2 py-1.5 text-gray-400">{leg.legOrder ?? i + 1}</td>
                        <td className="px-2 py-1.5 font-medium text-gray-800">{leg.origin}</td>
                        <td className="px-2 py-1.5 font-medium text-gray-800">{leg.destination}</td>
                        <td className="px-2 py-1.5 text-gray-600">
                          {leg.departAt ? new Date(leg.departAt).toLocaleString() : '—'}
                        </td>
                        <td className="px-2 py-1.5 text-gray-600">
                          {leg.arriveAt ? new Date(leg.arriveAt).toLocaleString() : '—'}
                        </td>
                        <td className="px-2 py-1.5 text-gray-600">
                          {leg.baggageKg != null ? `${leg.baggageKg} kg` : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </Card>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">

        {/* ── Passenger count selector ── */}
        <Card className="p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Passengers</h2>
          <div className="space-y-4">
            <Counter
              label="Adults" sublabel="Age 12+"
              value={adults} min={1} max={9}
              onChange={v => setAdults(v)}
            />
            <div className="border-t border-gray-100" />
            <Counter
              label="Children" sublabel="Age 2–11"
              value={children} min={0} max={9}
              onChange={v => setChildren(v)}
            />
            <div className="border-t border-gray-100" />
            <Counter
              label="Infants" sublabel="Under 2"
              value={infants} min={0} max={adults}
              onChange={v => setInfants(v)}
            />
          </div>

          {/* Summary pills */}
          <div className="flex gap-2 mt-4 flex-wrap">
            {adults   > 0 && <Pill color="bg-blue-100 text-blue-700">{adults} Adult{adults > 1 ? 's' : ''}</Pill>}
            {children > 0 && <Pill color="bg-green-100 text-green-700">{children} Child{children > 1 ? 'ren' : ''}</Pill>}
            {infants  > 0 && <Pill color="bg-orange-100 text-orange-700">{infants} Infant{infants > 1 ? 's' : ''}</Pill>}
            <Pill color="bg-gray-100 text-gray-600">
              {adults + children + infants} total passenger{adults + children + infants !== 1 ? 's' : ''}
            </Pill>
          </div>
        </Card>

        {/* ── Extras / Add-ons ── */}
        {availableExtras.length > 0 && (
          <Card className="p-5">
            <h2 className="text-sm font-semibold text-gray-700 mb-3">Add-ons</h2>
            <div className="space-y-2">
              {availableExtras.map(e => {
                const checked = !!selectedExtras[e.key]
                const price   = extraPrices[e.key] ?? 0
                return (
                  <div key={e.key}
                    className={`border rounded-lg p-3 transition-all ${
                      checked
                        ? 'border-blue-400 bg-blue-50'
                        : 'border-gray-200 bg-white opacity-60'
                    }`}>
                    <div className="flex items-center justify-between gap-3">
                      {/* Toggle switch + label */}
                      <button
                        type="button"
                        onClick={() => toggleExtra(e.key)}
                        className="flex items-center gap-3 flex-1 text-left"
                      >
                        {/* Toggle pill */}
                        <span className={`relative inline-flex h-6 w-11 shrink-0 rounded-full transition-colors duration-200 ${
                          checked ? 'bg-blue-600' : 'bg-gray-300'
                        }`}>
                          <span className={`inline-block h-5 w-5 mt-0.5 rounded-full bg-white shadow transition-transform duration-200 ${
                            checked ? 'translate-x-5' : 'translate-x-0.5'
                          }`} />
                        </span>
                        <span className="text-lg">{e.icon}</span>
                        <span className={`text-sm font-medium ${checked ? 'text-gray-900' : 'text-gray-500'}`}>
                          {e.label}
                        </span>
                      </button>
                      {/* Editable price — only active when checked */}
                      <div className={`flex items-center gap-1 shrink-0 ${checked ? '' : 'opacity-40 pointer-events-none'}`}>
                        <span className="text-xs text-gray-400">PKR</span>
                        <input
                          type="number" min="0" step="1"
                          value={price}
                          onChange={ev => setExtraPrice(e.key, ev.target.value)}
                          className="w-24 border border-gray-300 rounded-md px-2 py-1 text-sm text-right focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                        <span className="text-xs text-gray-400">/pax</span>
                      </div>
                    </div>
                    {/* Hotel dropdown */}
                    {e.key === 'hotel' && checked && hotels.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-blue-200">
                        <label className="block text-xs text-gray-500 mb-1">Select Hotel</label>
                        <select
                          value={selectedHotelId}
                          onChange={ev => setSelectedHotelId(ev.target.value)}
                          className="w-full border border-gray-300 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                        >
                          <option value="">— No specific hotel —</option>
                          {hotels.map(h => (
                            <option key={h.id} value={h.id}>
                              {h.name} – {h.city}{h.starRating ? ` (${'★'.repeat(h.starRating)})` : ''}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </Card>
        )}

        {/* ── Passenger detail forms ── */}
        {passengerList.map(({ type, num }) => {
          const cfg = TYPE_CONFIG[type]
          const p   = getP(type, num)
          return (
            <Card key={`${type}-${num}`} className={`overflow-hidden border ${cfg.light}`}>
              {/* Colored header bar */}
              <div className={`${cfg.color} px-5 py-3 flex items-center gap-3`}>
                <span className="text-white text-sm font-semibold">
                  {cfg.label} {num}
                </span>
                <span className="text-white/70 text-xs">
                  {type === 'ADULT' ? 'Age 12+' : type === 'CHILD' ? 'Age 2–11' : 'Under 2'}
                </span>
              </div>

              <div className="p-5">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    label="First Name *" required
                    value={p.firstName}
                    onChange={v => setP(type, num, 'firstName', v)}
                  />
                  <FormField
                    label="Last Name *" required
                    value={p.lastName}
                    onChange={v => setP(type, num, 'lastName', v)}
                  />
                  <FormField
                    label="Passport No."
                    value={p.passportNo}
                    onChange={v => setP(type, num, 'passportNo', v)}
                    placeholder="AB1234567"
                  />
                  <FormField
                    label="Nationality"
                    value={p.nationality}
                    onChange={v => setP(type, num, 'nationality', v)}
                    placeholder="Pakistani"
                  />
                  <FormField
                    label="Date of Birth"
                    type="date"
                    value={p.dateOfBirth}
                    onChange={v => setP(type, num, 'dateOfBirth', v)}
                  />
                </div>
              </div>
            </Card>
          )
        })}

        {/* ── Pricing summary ── */}
        {flight && (
          <Card className="p-5">
            <h2 className="text-sm font-semibold text-gray-700 mb-4">Pricing Summary</h2>
            <div className="space-y-2 text-sm">
              {adults > 0 && (
                <PriceLine
                  label={`${adults} Adult${adults > 1 ? 's' : ''} × PKR ${fareAdult.toLocaleString()}`}
                  value={adults * fareAdult}
                />
              )}
              {children > 0 && (
                <PriceLine
                  label={`${children} Child${children > 1 ? 'ren' : ''} × PKR ${fareChild.toLocaleString()}`}
                  value={children * fareChild}
                />
              )}
              {infants > 0 && (
                <PriceLine
                  label={`${infants} Infant${infants > 1 ? 's' : ''} × PKR ${fareInfant.toLocaleString()}`}
                  value={infants * fareInfant}
                />
              )}
              {taxTotal > 0 && (
                <PriceLine label="Taxes & Fees" value={taxTotal} />
              )}
              {availableExtras.filter(e => !!selectedExtras[e.key]).map(e => {
                const price = extraPrices[e.key] ?? 0
                const pax   = extraPaxCount(e.key, adults, children, infants)
                const hotel = selectedHotelId && e.key === 'hotel'
                  ? hotels.find(h => String(h.id) === selectedHotelId)
                  : null
                return (
                  <div key={e.key}>
                    <PriceLine
                      label={`${e.icon} ${e.label} × ${pax} pax${infants > 0 && pax < totalPassengers ? ' (excl. infants)' : ''}`}
                      value={price * pax}
                    />
                    {hotel && (
                      <div className="text-xs text-gray-400 text-right -mt-1">
                        {hotel.name} · {hotel.city}
                      </div>
                    )}
                  </div>
                )
              })}
              <div className="border-t border-gray-200 pt-2 mt-1 flex justify-between font-bold text-gray-900 text-base">
                <span>Total</span>
                <span>PKR {grandTotal.toLocaleString()}</span>
              </div>
            </div>
          </Card>
        )}

        <ErrorMessage message={error} />

        <div className="flex gap-3">
          <Button type="button" variant="secondary" onClick={() => navigate(-1)}>Back</Button>
          <Button type="submit" disabled={submitting || passengerList.length === 0}>
            {submitting ? 'Creating Booking...' : `Confirm ${adults + children + infants} Passenger${adults + children + infants !== 1 ? 's' : ''}`}
          </Button>
        </div>
      </form>
    </div>
  )
}

// ── Small helpers ──────────────────────────────────────────────────────────

function Pill({ color, children }) {
  return (
    <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${color}`}>
      {children}
    </span>
  )
}

function PriceLine({ label, value }) {
  return (
    <div className="flex justify-between text-gray-600">
      <span>{label}</span>
      <span>PKR {Number(value).toLocaleString()}</span>
    </div>
  )
}

function FormField({ label, value, onChange, type = 'text', placeholder, required }) {
  return (
    <label className="block text-sm">
      <span className="block text-gray-600 mb-1">{label}</span>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
      />
    </label>
  )
}
