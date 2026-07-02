import { useEffect, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { getFlight } from '../../api/flights'
import { createBooking } from '../../api/bookings'
import { getMyOffers } from '../../api/offers'
import { getParentAccounts } from '../../api/accounts'
import { getHotels } from '../../api/hotels'
import { EXTRAS_CONFIG, extraPaxCount } from '../../components/ui/ExtrasEditor'
import Button from '../../components/ui/Button'
import Card from '../../components/ui/Card'
import Spinner from '../../components/ui/Spinner'
import ErrorMessage from '../../components/ui/ErrorMessage'

// ── Helpers ────────────────────────────────────────────────────────────────
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

function emptyPassenger() {
  return { title: '', firstName: '', lastName: '', passportNo: '', dateOfBirth: '', passportExpiry: '' }
}

function buildList(adults, children, infants) {
  return [
    ...Array.from({ length: adults },   (_, i) => ({ type: 'ADULT',  num: i + 1 })),
    ...Array.from({ length: children }, (_, i) => ({ type: 'CHILD',  num: i + 1 })),
    ...Array.from({ length: infants },  (_, i) => ({ type: 'INFANT', num: i + 1 })),
  ]
}

const TITLE_OPTIONS = ['Mr', 'Mrs', 'Miss', 'Ms', 'Master', 'Mstr']

// ── Counter inside panel ───────────────────────────────────────────────────
function PanelCounter({ label, value, min = 0, max = 9, onChange, readonly }) {
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-slate-600 last:border-0">
      <span className="text-sm text-slate-200">{label}</span>
      {readonly ? (
        <span className="text-sm font-bold text-white">{value}</span>
      ) : (
        <div className="flex items-center gap-2">
          <button type="button"
            onClick={() => onChange(Math.max(min, value - 1))}
            disabled={value <= min}
            className="w-6 h-6 rounded-full border border-slate-400 text-slate-300 flex items-center justify-center text-base hover:bg-slate-600 disabled:opacity-30"
          >−</button>
          <span className="w-4 text-center text-sm font-bold text-white">{value}</span>
          <button type="button"
            onClick={() => onChange(Math.min(max, value + 1))}
            disabled={value >= max}
            className="w-6 h-6 rounded-full border border-slate-400 text-slate-300 flex items-center justify-center text-base hover:bg-slate-600 disabled:opacity-30"
          >+</button>
        </div>
      )}
    </div>
  )
}

// ── Main page ──────────────────────────────────────────────────────────────
export default function FlightBookingPage() {
  const { id } = useParams()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  const [adults,   setAdults]   = useState(Math.max(1, parseInt(searchParams.get('adults')   || '1', 10)))
  const [children, setChildren] = useState(Math.max(0, parseInt(searchParams.get('children') || '0', 10)))
  const [infants,  setInfants]  = useState(Math.max(0, parseInt(searchParams.get('infants')  || '0', 10)))

  const [flight, setFlight]               = useState(null)
  const [hotels, setHotels]               = useState([])
  const [loadingFlight, setLoadingFlight] = useState(true)
  const [passengerData, setPassengerData] = useState({})
  const [selectedExtras, setSelectedExtras] = useState({})
  const [extraPrices, setExtraPrices]     = useState({})
  const [selectedHotelId, setSelectedHotelId] = useState('')
  const [error, setError]                 = useState('')
  const [submitting, setSubmitting]       = useState(false)
  const [successBooking, setSuccessBooking] = useState(null)
  const [parentAccounts, setParentAccounts] = useState([])
  const [myOffers, setMyOffers] = useState([])

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
    getMyOffers().then(setMyOffers).catch(() => {})
  }, [id])

  function getKey(type, num) { return `${type}-${num}` }
  function getP(type, num)   { return passengerData[getKey(type, num)] ?? emptyPassenger() }

  function setP(type, num, field, value) {
    const key = getKey(type, num)
    setPassengerData(prev => ({
      ...prev,
      [key]: { ...(prev[key] ?? emptyPassenger()), [field]: value },
    }))
  }

  const fareAdult  = Number(flight?.fareAdult  || 0)
  const fareChild  = Number(flight?.fareChild  || 0)
  const fareInfant = Number(flight?.fareInfant || 0)
  const taxTotal   = Number(flight?.taxTotal   || 0)

  // Flight-level admin discount
  const flightDisc = Number(flight?.agentDiscountPercent || 0)

  // Active, in-date personal offers
  const now = new Date()
  const activeOffers = myOffers.filter(o =>
    o.active &&
    (!o.validFrom  || new Date(o.validFrom)  <= now) &&
    (!o.validUntil || new Date(o.validUntil) >= now)
  )
  const offerPercent = Math.min(100, activeOffers
    .filter(o => o.discountType === 'PERCENTAGE')
    .reduce((s, o) => s + Number(o.discountValue), 0))
  const offerFixed = activeOffers
    .filter(o => o.discountType === 'FIXED')
    .reduce((s, o) => s + Number(o.discountValue), 0)

  // Combined percentage discount (flight + offer)
  const totalPercent = Math.min(100, flightDisc + offerPercent)
  const discountedAdult  = fareAdult  * (1 - totalPercent / 100)
  const discountedChild  = fareChild  * (1 - totalPercent / 100)
  const discountedInfant = fareInfant * (1 - totalPercent / 100)
  const totalPassengers = adults + children + infants

  const availableExtras = flight?.extras
    ? EXTRAS_CONFIG.filter(e => flight.extras[e.key] !== undefined)
    : []

  function toggleExtra(key) { setSelectedExtras(prev => ({ ...prev, [key]: !prev[key] })) }
  function setExtraPrice(key, val) { setExtraPrices(prev => ({ ...prev, [key]: val === '' ? 0 : Number(val) })) }

  const extrasTotal = availableExtras.reduce((sum, e) => {
    if (!selectedExtras[e.key]) return sum
    return sum + ((extraPrices[e.key] ?? 0) * extraPaxCount(e.key, adults, children, infants))
  }, 0)

  const grandTotal = adults * discountedAdult + children * discountedChild + infants * discountedInfant + taxTotal + extrasTotal - offerFixed

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      const passengers = passengerList.map(({ type, num }) => {
        const p = getP(type, num)
        return {
          type,
          firstName:      p.firstName,
          lastName:       p.lastName,
          passportNo:     p.passportNo     || null,
          nationality:    null,
          dateOfBirth:    p.dateOfBirth    || null,
          title:          p.title          || null,
          passportExpiry: p.passportExpiry || null,
        }
      })
      const booking = await createBooking({
        bookableType: 'flight',
        bookableId:   Number(id),
        selectedHotelId: selectedHotelId ? Number(selectedHotelId) : null,
        extrasFee: extrasTotal,
        passengers,
      })
      setSuccessBooking(booking)
      getParentAccounts().then(setParentAccounts).catch(() => {})
    } catch {
      setError('Failed to create booking. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loadingFlight) {
    return <div className="flex justify-center py-20"><Spinner size="lg" /></div>
  }

  const legs     = flight?.legs ?? []
  const firstLeg = legs[0]

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-semibold text-gray-900">Book Flight</h1>

      {/* ── Top flight info section ── */}
      {flight && (
        <div className="border border-gray-300 rounded-lg overflow-hidden bg-white shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-0">

            {/* Left — airline + sector details */}
            <div className="p-5 border-b md:border-b-0 md:border-r border-gray-200">
              <div className="flex items-center gap-3 mb-3">
                {firstLeg?.airlineLogoUrl && (
                  <img src={firstLeg.airlineLogoUrl} alt={firstLeg.airlineCode}
                    className="h-10 object-contain" />
                )}
                <div className="font-bold text-gray-800 text-base uppercase">
                  {firstLeg?.airlineName || firstLeg?.airlineCode || '—'}
                </div>
              </div>
              <div className="text-xs font-semibold text-gray-800 uppercase tracking-wide mb-2">
                Sector Details ({flight.groupName || '—'})
              </div>
              <div className="space-y-1">
                {legs.map((leg, i) => (
                  <div key={i} className="text-xs font-mono font-bold text-gray-900 flex flex-wrap gap-x-2">
                    <span className="text-gray-700 font-semibold">{i + 1} )</span>
                    <span>{leg.flightNumber || '—'}</span>
                    <span>{fmtLegDate(leg.departAt)}</span>
                    <span className="text-blue-700">{leg.origin}-{leg.destination}</span>
                    <span>{fmtTime(leg.departAt)}</span>
                    <span>{fmtTime(leg.arriveAt)}</span>
                    {leg.baggageKg != null && <span>{leg.baggageKg}-KG Baggage</span>}
                  </div>
                ))}
              </div>
            </div>

            {/* Right — seats + dep date */}
            <div className="p-5 flex flex-col justify-center gap-2">
              <div className="text-sm text-gray-900 font-semibold">
                Seats Available:&nbsp;
                <span className={`font-bold text-base ${flight.availableSeats === 0 ? 'text-red-600' : 'text-gray-900'}`}>
                  {flight.availableSeats ?? '—'}
                </span>
              </div>
              <div className="text-sm text-gray-900 font-semibold">
                Dep Date&nbsp;
                <span className="font-bold text-green-700">
                  {firstLeg?.departAt
                    ? new Date(firstLeg.departAt).toLocaleDateString('en-GB', {
                        weekday: 'short', day: '2-digit', month: 'short', year: 'numeric',
                      })
                    : '—'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">

        {/* ── Three pricing panels ── */}
        {flight && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

            {/* Panel 1 — Passengers */}
            <div className="rounded-lg overflow-hidden border border-slate-700">
              <div className="bg-slate-800 px-4 py-2.5">
                <span className="text-white text-sm font-bold uppercase tracking-wide">Passengers</span>
              </div>
              <div className="bg-slate-700 px-4 py-3">
                <PanelCounter label="Adults"   value={adults}   min={1} max={9} onChange={setAdults} />
                <PanelCounter label="Childs"   value={children} min={0} max={9} onChange={setChildren} />
                <PanelCounter label="Infants"  value={infants}  min={0} max={adults} onChange={setInfants} />
                <PanelCounter label="Total"    value={totalPassengers} readonly />
                {children > 0 && (
                  <p className="text-xs text-amber-400 font-medium mt-2 pt-2 border-t border-slate-600">
                    Child booking - please confirm before booking
                  </p>
                )}
              </div>
            </div>

            {/* Panel 2 — Price / Seat */}
            <div className="rounded-lg overflow-hidden border border-slate-700">
              <div className="bg-slate-800 px-4 py-2.5">
                <span className="text-white text-sm font-bold uppercase tracking-wide">Price / Seat</span>
              </div>
              <div className="bg-slate-700 px-4 py-3 space-y-1.5">
                {(flightDisc > 0 || offerPercent > 0) && (
                  <div className="flex flex-wrap gap-1 mb-1 justify-center">
                    {flightDisc > 0 && (
                      <span className="bg-green-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">{flightDisc}% Flight Discount</span>
                    )}
                    {offerPercent > 0 && (
                      <span className="bg-orange-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">{offerPercent}% Offer Discount</span>
                    )}
                  </div>
                )}
                <div className="flex justify-between py-1.5 border-b border-slate-600">
                  <span className="text-sm text-slate-200">Adults</span>
                  <span className="text-sm font-bold text-white flex items-center gap-1.5">
                    {totalPercent > 0 && <span className="line-through text-red-400 text-xs">PKR {fareAdult.toLocaleString()}</span>}
                    PKR {discountedAdult.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-600">
                  <span className="text-sm text-slate-200">Child</span>
                  <span className="text-sm font-bold text-white flex items-center gap-1.5">
                    {totalPercent > 0 && <span className="line-through text-red-400 text-xs">PKR {fareChild.toLocaleString()}</span>}
                    PKR {discountedChild.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-sm text-slate-200">Infant</span>
                  <span className="text-sm font-bold text-white flex items-center gap-1.5">
                    {totalPercent > 0 && <span className="line-through text-red-400 text-xs">PKR {fareInfant.toLocaleString()}</span>}
                    PKR {discountedInfant.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Panel 3 — Total Price */}
            <div className="rounded-lg overflow-hidden border border-slate-700">
              <div className="bg-slate-800 px-4 py-2.5">
                <span className="text-white text-sm font-bold uppercase tracking-wide">Total Price</span>
              </div>
              <div className="bg-slate-700 px-4 py-3">
                <div className="flex justify-between py-1.5 border-b border-slate-600">
                  <span className="text-sm text-slate-200">Adults</span>
                  <span className="text-sm font-bold text-white flex items-center gap-1.5">
                    {totalPercent > 0 && <span className="line-through text-red-400 text-xs">PKR {(adults * fareAdult).toLocaleString()}</span>}
                    PKR {(adults * discountedAdult).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-600">
                  <span className="text-sm text-slate-200">Child</span>
                  <span className="text-sm font-bold text-white flex items-center gap-1.5">
                    {totalPercent > 0 && <span className="line-through text-red-400 text-xs">PKR {(children * fareChild).toLocaleString()}</span>}
                    PKR {(children * discountedChild).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-600">
                  <span className="text-sm text-slate-200">Infants</span>
                  <span className="text-sm font-bold text-white flex items-center gap-1.5">
                    {totalPercent > 0 && <span className="line-through text-red-400 text-xs">PKR {(infants * fareInfant).toLocaleString()}</span>}
                    PKR {(infants * discountedInfant).toLocaleString()}
                  </span>
                </div>
                {offerFixed > 0 && (
                  <div className="flex justify-between py-1.5 border-b border-slate-600">
                    <span className="text-sm text-orange-300">Offer Discount</span>
                    <span className="text-sm font-bold text-orange-300">− PKR {offerFixed.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between py-1.5 mt-1">
                  <span className="text-sm font-bold text-white">Total Price</span>
                  <span className="text-sm font-bold text-green-400">PKR {Math.max(0, grandTotal).toLocaleString()}</span>
                </div>
              </div>
            </div>

          </div>
        )}

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
                      checked ? 'border-blue-400 bg-blue-50' : 'border-gray-200 bg-white opacity-60'
                    }`}>
                    <div className="flex items-center justify-between gap-3">
                      <button type="button" onClick={() => toggleExtra(e.key)}
                        className="flex items-center gap-3 flex-1 text-left">
                        <span className={`relative inline-flex h-6 w-11 shrink-0 rounded-full transition-colors duration-200 ${checked ? 'bg-blue-600' : 'bg-gray-300'}`}>
                          <span className={`inline-block h-5 w-5 mt-0.5 rounded-full bg-white shadow transition-transform duration-200 ${checked ? 'translate-x-5' : 'translate-x-0.5'}`} />
                        </span>
                        <span className="text-lg">{e.icon}</span>
                        <span className={`text-sm font-medium ${checked ? 'text-gray-900' : 'text-gray-500'}`}>{e.label}</span>
                      </button>
                      <div className={`flex items-center gap-1 shrink-0 ${checked ? '' : 'opacity-40 pointer-events-none'}`}>
                        <span className="text-xs text-gray-400">PKR</span>
                        <input type="number" min="0" step="1" value={price}
                          onChange={ev => setExtraPrice(e.key, ev.target.value)}
                          className="w-24 border border-gray-300 rounded-md px-2 py-1 text-sm text-right focus:outline-none focus:ring-1 focus:ring-blue-500" />
                        <span className="text-xs text-gray-400">/pax</span>
                      </div>
                    </div>
                    {e.key === 'hotel' && checked && hotels.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-blue-200">
                        <label className="block text-xs text-gray-500 mb-1">Select Hotel</label>
                        <select value={selectedHotelId} onChange={ev => setSelectedHotelId(ev.target.value)}
                          className="w-full border border-gray-300 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500">
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

        {/* ── Passenger detail table ── */}
        {passengerList.length > 0 && (
          <div className="border border-gray-300 rounded-lg overflow-hidden bg-white shadow-sm">
            <div className="bg-slate-800 px-5 py-3">
              <span className="text-white text-sm font-bold uppercase tracking-wide">Passenger Details</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="px-3 py-2 text-left text-xs font-bold text-gray-600 border-r border-gray-200 whitespace-nowrap">Sr#</th>
                    <th className="px-3 py-2 text-left text-xs font-bold text-gray-600 border-r border-gray-200 w-24">Title</th>
                    <th className="px-3 py-2 text-left text-xs font-bold text-gray-600 border-r border-gray-200">Given Name</th>
                    <th className="px-3 py-2 text-left text-xs font-bold text-gray-600 border-r border-gray-200">Sur Name</th>
                    <th className="px-3 py-2 text-left text-xs font-bold text-gray-600 border-r border-gray-200">Passport #</th>
                    <th className="px-3 py-2 text-left text-xs font-bold text-gray-600 border-r border-gray-200 whitespace-nowrap">Date of Birth</th>
                    <th className="px-3 py-2 text-left text-xs font-bold text-gray-600 whitespace-nowrap">Passport Expiry</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {passengerList.map(({ type, num }) => {
                    const p       = getP(type, num)
                    const srLabel = `${type.charAt(0) + type.slice(1).toLowerCase()} ${num}`
                    return (
                      <tr key={`${type}-${num}`} className="hover:bg-gray-50">
                        <td className="px-3 py-2 border-r border-gray-200 text-xs font-semibold text-gray-500 whitespace-nowrap">{srLabel}</td>
                        <td className="px-3 py-2 border-r border-gray-200">
                          <select
                            value={p.title}
                            onChange={e => setP(type, num, 'title', e.target.value)}
                            className="w-full border border-gray-300 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                          >
                            <option value="">—</option>
                            {TITLE_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
                          </select>
                        </td>
                        <td className="px-3 py-2 border-r border-gray-200">
                          <input required value={p.firstName}
                            onChange={e => setP(type, num, 'firstName', e.target.value)}
                            placeholder="Given name"
                            className="w-full border border-gray-300 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500" />
                        </td>
                        <td className="px-3 py-2 border-r border-gray-200">
                          <input required value={p.lastName}
                            onChange={e => setP(type, num, 'lastName', e.target.value)}
                            placeholder="Sur name"
                            className="w-full border border-gray-300 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500" />
                        </td>
                        <td className="px-3 py-2 border-r border-gray-200">
                          <input value={p.passportNo}
                            onChange={e => setP(type, num, 'passportNo', e.target.value)}
                            placeholder="AB1234567"
                            className="w-full border border-gray-300 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500" />
                        </td>
                        <td className="px-3 py-2 border-r border-gray-200">
                          <input type="date" value={p.dateOfBirth}
                            onChange={e => setP(type, num, 'dateOfBirth', e.target.value)}
                            className="w-full border border-gray-300 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500" />
                        </td>
                        <td className="px-3 py-2">
                          <input type="date" value={p.passportExpiry}
                            onChange={e => setP(type, num, 'passportExpiry', e.target.value)}
                            className="w-full border border-gray-300 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500" />
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <ErrorMessage message={error} />

        <div className="flex justify-end gap-3">
          <Button type="button" variant="secondary" onClick={() => navigate(-1)}>Back</Button>
          <Button type="submit" disabled={submitting || passengerList.length === 0}>
            {submitting ? 'Creating Booking…' : 'Book Now'}
          </Button>
        </div>
      </form>

      {/* ── Success Modal ── */}
      {successBooking && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl p-8 max-h-[90vh] overflow-y-auto">

            {/* Header */}
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 rounded-full border-4 border-green-500 flex items-center justify-center shrink-0">
                <span className="text-green-500 text-2xl font-bold">✓</span>
              </div>
              <h2 className="text-xl font-bold text-gray-800 uppercase tracking-wide">
                BOOKING SUCCESSFULLY MADE
              </h2>
            </div>

            <div className="space-y-3 text-gray-700 mb-6 text-sm">
              <p>
                This is to inform you that your ticket reservation has been successfully placed{' '}
                <strong>on hold</strong>
              </p>
              {successBooking.expiresAt && (
                <p>
                  We request you to make the payment by{' '}
                  <strong>
                    {new Date(successBooking.expiresAt).toLocaleString('en-GB', {
                      weekday: 'short', day: '2-digit', month: 'short', year: 'numeric',
                      hour: '2-digit', minute: '2-digit',
                    })}
                  </strong>.
                </p>
              )}
              <p>
                You can download your demo ticket print from this link&nbsp;
                <a
                  href={`/bookings/${successBooking.id}/ticket`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-blue-600 font-semibold hover:underline"
                >
                  Print
                </a>
                &nbsp;or you can view all your bookings from this link&nbsp;
                <button
                  onClick={() => navigate('/bookings')}
                  className="text-blue-600 hover:underline font-medium"
                >
                  view all bookings
                </button>
              </p>
            </div>

            {parentAccounts.length > 0 && (
              <>
                <p className="text-gray-700 text-sm mb-3">Below are our account details:</p>
                <div className="overflow-x-auto mb-6 rounded border border-gray-200">
                  <table className="w-full border-collapse text-sm">
                    <tbody>
                      {parentAccounts.map((acc, i) => (
                        <tr key={acc.id} className="bg-blue-500 text-white border-b border-blue-400 last:border-0">
                          <td className="px-3 py-2.5 font-bold border-r border-blue-400 whitespace-nowrap">
                            Bank {i + 1}
                          </td>
                          <td className="px-3 py-2.5 border-r border-blue-400">
                            <div className="text-xs text-blue-200">Bank Name:</div>
                            <div className="font-semibold">{acc.bankName || '—'}</div>
                          </td>
                          <td className="px-3 py-2.5 border-r border-blue-400">
                            <div className="text-xs text-blue-200">Account Title:</div>
                            <div className="font-semibold">{acc.accountTitle || '—'}</div>
                          </td>
                          <td className="px-3 py-2.5 border-r border-blue-400">
                            <div className="text-xs text-blue-200">Account#:</div>
                            <div className="font-semibold font-mono">{acc.bankAccountNumber || '—'}</div>
                          </td>
                          <td className="px-3 py-2.5">
                            <div className="text-xs text-blue-200">IBAN#:</div>
                            <div className="font-semibold font-mono">{acc.iban || acc.bankAccountNumber || '—'}</div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}

            <div className="border-t pt-4 flex justify-end">
              <button
                onClick={() => navigate('/bookings')}
                className="px-6 py-2 text-sm text-gray-600 hover:text-gray-900 font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
