import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { getUmrahPackage } from '../../api/umrah'
import { createBooking } from '../../api/bookings'
import { getHotels } from '../../api/hotels'
import { EXTRAS_CONFIG, extraPaxCount } from '../../components/ui/ExtrasEditor'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Spinner from '../../components/ui/Spinner'
import ErrorMessage from '../../components/ui/ErrorMessage'

async function fetchPackage(type, id) {
  if (type === 'umrah') return getUmrahPackage(id)
  const { default: client } = await import('../../api/client')
  if (type === 'custom') return client.get(`/api/custom-packages/${id}`).then(r => r.data)
  return client.get(`/api/hajj-packages/${id}`).then(r => r.data)
}

// ── Passenger counter ──────────────────────────────────────────────────────
function Counter({ label, sublabel, value, min = 0, max = 9, onChange }) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <div className="text-sm font-medium text-gray-800">{label}</div>
        {sublabel && <div className="text-xs text-gray-400">{sublabel}</div>}
      </div>
      <div className="flex items-center gap-3">
        <button type="button" onClick={() => onChange(Math.max(min, value - 1))} disabled={value <= min}
          className="w-8 h-8 rounded-full border border-gray-300 text-gray-600 flex items-center justify-center text-lg hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed">
          −
        </button>
        <span className="w-5 text-center text-sm font-semibold text-gray-900">{value}</span>
        <button type="button" onClick={() => onChange(Math.min(max, value + 1))} disabled={value >= max}
          className="w-8 h-8 rounded-full border border-gray-300 text-gray-600 flex items-center justify-center text-lg hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed">
          +
        </button>
      </div>
    </div>
  )
}

const TYPE_CONFIG = {
  ADULT:  { label: 'Adult',  color: 'bg-blue-600',   light: 'bg-blue-50 border-blue-200',   text: 'text-blue-700'   },
  CHILD:  { label: 'Child',  color: 'bg-green-600',  light: 'bg-green-50 border-green-200',  text: 'text-green-700'  },
  INFANT: { label: 'Infant', color: 'bg-orange-500', light: 'bg-orange-50 border-orange-200', text: 'text-orange-700' },
}

function emptyPax() {
  return { firstName: '', lastName: '', passportNo: '', nationality: '', dateOfBirth: '' }
}
function buildSlots(adults, children, infants) {
  return [
    ...Array.from({ length: adults },   (_, i) => ({ type: 'ADULT',  num: i + 1 })),
    ...Array.from({ length: children }, (_, i) => ({ type: 'CHILD',  num: i + 1 })),
    ...Array.from({ length: infants },  (_, i) => ({ type: 'INFANT', num: i + 1 })),
  ]
}

export default function PackageBookingPage() {
  const navigate     = useNavigate()
  const [params]     = useSearchParams()
  const bookableType = params.get('bookableType') ?? 'umrah'
  const bookableId   = Number(params.get('bookableId'))

  const [adults,   setAdults]   = useState(Math.max(1, parseInt(params.get('adults')   ?? '1', 10)))
  const [children, setChildren] = useState(Math.max(0, parseInt(params.get('children') ?? '0', 10)))
  const [infants,  setInfants]  = useState(Math.max(0, parseInt(params.get('infants')  ?? '0', 10)))

  const [pkg, setPkg]                   = useState(null)
  const [hotels, setHotels]             = useState([])
  const [passengerData, setPassengerData] = useState({})
  const [selectedAirlineId, setSelectedAirlineId] = useState('')
  const [selectedExtras, setSelectedExtras]       = useState({}) // key → bool
  const [extraPrices, setExtraPrices]             = useState({}) // key → editable price
  const [selectedHotelId, setSelectedHotelId]     = useState('')
  const [loadingPkg, setLoadingPkg]     = useState(true)
  const [submitting, setSubmitting]     = useState(false)
  const [error, setError]               = useState('')

  useEffect(() => {
    fetchPackage(bookableType, bookableId)
      .then(data => {
        setPkg(data)
        if (bookableType === 'umrah' && data.airlines?.length > 0) {
          const first = data.airlines.find(a => a.availableSeats > 0)
          if (first) setSelectedAirlineId(String(first.airlineId))
        }
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
      .catch(() => setError('Failed to load package details.'))
      .finally(() => setLoadingPkg(false))
    getHotels().then(setHotels).catch(() => {})
  }, [bookableType, bookableId])

  const slots           = buildSlots(adults, children, infants)
  const totalPassengers = adults + children + infants

  function getKey(type, num) { return `${type}-${num}` }
  function getP(type, num) { return passengerData[getKey(type, num)] ?? emptyPax() }
  function setP(type, num, field, value) {
    const key = getKey(type, num)
    setPassengerData(prev => ({ ...prev, [key]: { ...(prev[key] ?? emptyPax()), [field]: value } }))
  }

  // Pricing
  const fareAdult  = Number(pkg?.basePrice  ?? 0)
  const fareChild  = Number(pkg?.priceChild  ?? pkg?.basePrice ?? 0)
  const fareInfant = Number(pkg?.priceInfant ?? pkg?.basePrice ?? 0)
  const subtotal   = adults * fareAdult + children * fareChild + infants * fareInfant

  const availableExtras = pkg?.extras
    ? EXTRAS_CONFIG.filter(e => pkg.extras[e.key]?.enabled !== undefined)
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

  const grandTotal = subtotal + extrasTotal

  const selectedAirline = pkg?.airlines?.find(a => String(a.airlineId) === selectedAirlineId)

  // Seat / quota availability check per package type
  const quotaAvailable = (bookableType === 'hajj' || bookableType === 'custom') && pkg?.quotaTotal != null
    ? Math.max(0, pkg.quotaTotal - (pkg.quotaReserved ?? 0))
    : null
  const quotaFull = quotaAvailable !== null && quotaAvailable <= 0
  const quotaInsufficient = quotaAvailable !== null && quotaAvailable < totalPassengers

  const seatsOk = bookableType === 'umrah'
    ? (!selectedAirline || selectedAirline.availableSeats >= totalPassengers)
    : !quotaInsufficient

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (bookableType === 'umrah' && pkg?.airlines?.length > 0 && !selectedAirlineId) {
      setError('Please select an airline.'); return
    }
    setSubmitting(true)
    try {
      const booking = await createBooking({
        bookableType,
        bookableId,
        selectedAirlineId: selectedAirlineId ? Number(selectedAirlineId) : null,
        selectedHotelId: selectedHotelId ? Number(selectedHotelId) : null,
        extrasFee: extrasTotal, // pre-calculated total (infant exemption already applied)
        passengers: slots.map(({ type, num }) => {
          const p = getP(type, num)
          return {
            type,
            firstName:   p.firstName,
            lastName:    p.lastName,
            passportNo:  p.passportNo  || null,
            nationality: p.nationality || null,
            dateOfBirth: p.dateOfBirth || null,
          }
        }),
      })
      navigate(`/bookings/${booking.id}/confirm`)
    } catch (err) {
      const msg = err?.response?.data?.message ?? err?.message ?? 'Failed to create booking.'
      setError(msg)
      document.getElementById('main-scroll')?.scrollTo({ top: 0, behavior: 'smooth' })
    } finally {
      setSubmitting(false)
    }
  }

  if (loadingPkg) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>

  const typeLabel = bookableType === 'hajj' ? 'Hajj' :
                   bookableType === 'custom' ? (pkg?.packageType ?? 'Custom') : 'Umrah'

  return (
    <div className="space-y-6 max-w-3xl">
      <h1 className="text-xl font-semibold text-gray-900">Book {typeLabel} Package</h1>

      {/* Quota / full warning */}
      {quotaFull && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 font-medium">
          This package is fully booked. No spots remaining.
        </div>
      )}
      {!quotaFull && quotaInsufficient && (
        <div className="rounded-lg bg-yellow-50 border border-yellow-200 px-4 py-3 text-sm text-yellow-800">
          Only <strong>{quotaAvailable}</strong> spot{quotaAvailable !== 1 ? 's' : ''} remaining — reduce the number of passengers.
        </div>
      )}

      {/* Package summary */}
      {pkg && (
        <Card className="p-5">
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div className="space-y-1">
              {bookableType === 'custom' && pkg.packageType && (
                <span className="inline-flex px-2 py-0.5 text-xs font-medium bg-purple-100 text-purple-700 rounded-full">
                  {pkg.packageType}
                </span>
              )}
              <div className="font-semibold text-gray-900 text-base">{pkg.title}</div>
              {pkg.description && <div className="text-sm text-gray-500">{pkg.description}</div>}
              {pkg.durationDays && <div className="text-sm text-gray-500">{pkg.durationDays} days</div>}
              {pkg.startDate && pkg.endDate && (
                <div className="text-sm text-gray-500">{pkg.startDate} → {pkg.endDate}</div>
              )}
              {(bookableType === 'hajj' || bookableType === 'custom') && pkg.quotaTotal != null && (
                <div className="text-sm text-gray-500">Quota: {pkg.quotaReserved ?? 0} / {pkg.quotaTotal}</div>
              )}
              {bookableType === 'custom' && pkg.attributes && Object.keys(pkg.attributes).length > 0 && (
                <div className="mt-2 space-y-0.5 border-t border-gray-100 pt-2">
                  {Object.entries(pkg.attributes).map(([k, v]) => (
                    <div key={k} className="flex gap-3 text-xs">
                      <span className="text-gray-400 w-24 shrink-0">{k}</span>
                      <span className="text-gray-700">{String(v)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="text-right space-y-1">
              <div className="text-xl font-bold text-blue-600">
                PKR {Number(pkg.basePrice ?? 0).toLocaleString()}
              </div>
              <div className="text-xs text-gray-400">adult / person</div>
              {(pkg.priceChild != null || pkg.priceInfant != null) && (
                <div className="text-xs text-gray-500 space-y-0.5">
                  {pkg.priceChild  != null && <div>Child: PKR {Number(pkg.priceChild).toLocaleString()}</div>}
                  {pkg.priceInfant != null && <div>Infant: PKR {Number(pkg.priceInfant).toLocaleString()}</div>}
                </div>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* Passenger counters */}
      <Card className="p-5">
        <h2 className="text-sm font-semibold text-gray-700 mb-4">Passengers</h2>
        <div className="space-y-4">
          <Counter label="Adults"   sublabel="12+ years"  value={adults}   min={1} onChange={setAdults}   />
          <Counter label="Children" sublabel="2–11 years" value={children} min={0} onChange={setChildren} />
          <Counter label="Infants"  sublabel="Under 2"    value={infants}  min={0} onChange={setInfants}  />
        </div>
        {totalPassengers > 0 && (
          <p className="mt-3 text-xs text-gray-400 text-right">{totalPassengers} passenger{totalPassengers > 1 ? 's' : ''} total</p>
        )}
      </Card>

      {/* Airline selector — Umrah only */}
      {bookableType === 'umrah' && pkg?.airlines?.length > 0 && (
        <Card className="p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">Select Airline</h2>
          <div className="space-y-2">
            {pkg.airlines.map(a => {
              const noSeats   = a.availableSeats === 0
              const lowSeats  = a.availableSeats > 0 && a.availableSeats <= 5
              const isSelected = String(a.airlineId) === selectedAirlineId
              return (
                <label key={a.airlineId}
                  className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer transition-colors ${
                    noSeats    ? 'opacity-50 cursor-not-allowed border-gray-200 bg-gray-50' :
                    isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-300'
                  }`}>
                  <div className="flex items-center gap-3">
                    <input type="radio" name="airline" value={a.airlineId} checked={isSelected}
                      disabled={noSeats} onChange={() => setSelectedAirlineId(String(a.airlineId))} />
                    <div>
                      <div className="font-medium text-sm text-gray-900">{a.airlineCode} – {a.airlineName}</div>
                      {a.seatQuota && <div className="text-xs text-gray-400">Total quota: {a.seatQuota}</div>}
                    </div>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    noSeats  ? 'bg-red-100 text-red-700' :
                    lowSeats ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'
                  }`}>
                    {noSeats ? 'Full' : `${a.availableSeats} / ${a.allocatedSeats} seats`}
                  </span>
                </label>
              )
            })}
          </div>
          {selectedAirline && !seatsOk && (
            <p className="mt-2 text-sm text-red-600">
              Only {selectedAirline.availableSeats} seat{selectedAirline.availableSeats !== 1 ? 's' : ''} available — reduce passengers.
            </p>
          )}
        </Card>
      )}

      {/* Extras */}
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
                    {/* Editable price */}
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

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Passenger forms */}
        {slots.map(({ type, num }) => {
          const cfg = TYPE_CONFIG[type]
          const p   = getP(type, num)
          return (
            <Card key={`${type}-${num}`} className={`overflow-hidden border ${cfg.light}`}>
              <div className={`${cfg.color} px-5 py-2.5 flex items-center gap-2`}>
                <span className="text-white font-semibold text-sm">{cfg.label} {num}</span>
                <span className={`ml-auto text-xs px-2 py-0.5 rounded-full bg-white/20 text-white`}>{type}</span>
              </div>
              <div className="p-5 grid grid-cols-2 gap-4">
                <Input label="First Name *" required value={p.firstName} onChange={e => setP(type, num, 'firstName', e.target.value)} />
                <Input label="Last Name *"  required value={p.lastName}  onChange={e => setP(type, num, 'lastName',  e.target.value)} />
                <Input label="Passport No." value={p.passportNo}  onChange={e => setP(type, num, 'passportNo',  e.target.value)} placeholder="AB1234567" />
                <Input label="Nationality"  value={p.nationality} onChange={e => setP(type, num, 'nationality', e.target.value)} placeholder="Pakistani" />
                <Input label="Date of Birth" type="date" value={p.dateOfBirth} onChange={e => setP(type, num, 'dateOfBirth', e.target.value)} />
              </div>
            </Card>
          )
        })}

        {/* Pricing summary */}
        {pkg && totalPassengers > 0 && (
          <Card className="p-5">
            <h2 className="text-sm font-semibold text-gray-700 mb-3">Pricing Summary</h2>
            <div className="space-y-1.5 text-sm text-gray-600">
              {adults   > 0 && <div className="flex justify-between"><span>{adults} Adult{adults>1?'s':''} × PKR {fareAdult.toLocaleString()}</span><span>PKR {(adults * fareAdult).toLocaleString()}</span></div>}
              {children > 0 && <div className="flex justify-between"><span>{children} Child{children>1?'ren':''} × PKR {fareChild.toLocaleString()}</span><span>PKR {(children * fareChild).toLocaleString()}</span></div>}
              {infants  > 0 && <div className="flex justify-between"><span>{infants} Infant{infants>1?'s':''} × PKR {fareInfant.toLocaleString()}</span><span>PKR {(infants * fareInfant).toLocaleString()}</span></div>}
              {availableExtras.filter(e => !!selectedExtras[e.key]).map(e => {
                const price = extraPrices[e.key] ?? 0
                const pax   = extraPaxCount(e.key, adults, children, infants)
                const hotel = selectedHotelId && e.key === 'hotel'
                  ? hotels.find(h => String(h.id) === selectedHotelId)
                  : null
                return (
                  <div key={e.key}>
                    <div className="flex justify-between text-gray-500">
                      <span>{e.icon} {e.label} × {pax} pax{infants > 0 && pax < totalPassengers ? ' (excl. infants)' : ''}</span>
                      <span>PKR {(price * pax).toLocaleString()}</span>
                    </div>
                    {hotel && (
                      <div className="text-xs text-gray-400 text-right -mt-1">
                        {hotel.name} · {hotel.city}
                      </div>
                    )}
                  </div>
                )
              })}
              <div className="flex justify-between font-bold text-gray-900 text-base border-t border-gray-200 pt-2 mt-1">
                <span>Total</span>
                <span>PKR {grandTotal.toLocaleString()}</span>
              </div>
            </div>
          </Card>
        )}

        <ErrorMessage message={error} />

        <div className="flex gap-3">
          <Button type="button" variant="secondary" onClick={() => navigate(-1)}>Back</Button>
          <Button type="submit" disabled={submitting || !pkg || !seatsOk || totalPassengers === 0}>
            {submitting ? 'Creating Booking…' : `Confirm ${totalPassengers} Passenger${totalPassengers !== 1 ? 's' : ''}`}
          </Button>
        </div>
      </form>
    </div>
  )
}
