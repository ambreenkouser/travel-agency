import { useEffect, useState } from 'react'
import { searchFlights, createFlight, updateFlight, deleteFlight, getFlightShares } from '../../api/flights'
import { getAirlines } from '../../api/airlines'
import { getRoutes } from '../../api/routes'
import { getAgencies } from '../../api/agencies'
import { useAuth } from '../../context/AuthContext'

const STATUS_OPTIONS = ['draft', 'active', 'cancelled']
const CLASS_OPTIONS  = [
  { value: 'economy',   label: 'Economy' },
  { value: 'business',  label: 'Business' },
  { value: 'executive', label: 'Executive' },
]

const emptyLeg = {
  origin: '', destination: '', departAt: '', arriveAt: '', baggageKg: '',
  airlineId: '', flightNumber: '', pnrCode: '', airlineCode: '',
  flightClass: 'economy', handCarryKg: '',
}

const emptyForm = {
  groupName: '',
  fareAdult: '', fareChild: '', fareInfant: '',
  costAdult: '', costChild: '', costInfant: '',
  taxTotal: '', baggageInfo: '', status: 'draft', seatQuota: '',
  contactPersonPhone: '', contactPersonEmail: '',
  legs: [{ ...emptyLeg }],
}

export default function FlightManagementPage() {
  const { user } = useAuth()
  const isSuperAdmin = user?.authorities?.includes('ROLE_super_admin') ?? false
  const canManageFlights = user?.authorities?.includes('flights:manage') ?? false

  const [flights, setFlights]     = useState([])
  const [airlines, setAirlines]   = useState([])
  const [stopCodes, setStopCodes]   = useState([])
  const [groupNames, setGroupNames] = useState([])
  const [agencies, setAgencies]   = useState([])
  const [form, setForm]           = useState(emptyForm)
  const [sharedWith, setSharedWith] = useState([])
  const [editing, setEditing]     = useState(null)
  const [showForm, setShowForm]   = useState(false)
  const [error, setError]         = useState('')
  const [loading, setLoading]     = useState(true)
  const [detailFlight, setDetailFlight] = useState(null)

  useEffect(() => {
    const loads = [
      load(),
      getAirlines().then(setAirlines),
      getRoutes().then(routes => {
        const codes = new Set()
        routes.forEach(r => { if (r.origin) codes.add(r.origin); if (r.destination) codes.add(r.destination) })
        setStopCodes([...codes].sort())
      }),
    ]
    if (isSuperAdmin) loads.push(getAgencies().then(setAgencies))
    Promise.all(loads)
  }, [])

  function load() {
    setLoading(true)
    return searchFlights({ size: 100, status: 'all' })
      .then(page => {
        const list = page.content ?? []
        setFlights(list)
        const names = [...new Set(list.map(f => f.groupName).filter(Boolean))].sort()
        setGroupNames(names)
      })
      .catch(() => setError('Failed to load flights'))
      .finally(() => setLoading(false))
  }

  function openCreate() {
    setForm(emptyForm); setSharedWith([])
    setEditing(null); setShowForm(true); setError('')
  }

  async function openEdit(f) {
    setForm({
      groupName:    f.groupName    ?? '',
      fareAdult:    f.fareAdult ?? '',
      fareChild:    f.fareChild ?? '',
      fareInfant:   f.fareInfant ?? '',
      costAdult:    f.costAdult  ?? '',
      costChild:    f.costChild  ?? '',
      costInfant:   f.costInfant ?? '',
      taxTotal:     f.taxTotal ?? '',
      baggageInfo:  f.baggageInfo ?? '',
      status:       f.status ?? 'draft',
      seatQuota:    f.seatQuota ?? '',
      contactPersonPhone: f.contactPersonPhone ?? '',
      contactPersonEmail: f.contactPersonEmail ?? '',
      legs: (f.legs ?? []).length > 0
        ? f.legs.map(l => ({
            origin:      l.origin ?? '',
            destination: l.destination ?? '',
            departAt:    l.departAt ? toLocalInput(l.departAt) : '',
            arriveAt:    l.arriveAt ? toLocalInput(l.arriveAt) : '',
            baggageKg:   l.baggageKg ?? '',
            airlineId:   l.airlineId ?? '',
            flightNumber: l.flightNumber ?? '',
            pnrCode:     l.pnrCode ?? '',
            airlineCode: l.airlineCode ?? '',
            flightClass: l.flightClass ?? 'economy',
            handCarryKg: l.handCarryKg ?? '',
          }))
        : [{ ...emptyLeg }],
    })
    if (isSuperAdmin) {
      const shares = await getFlightShares(f.id).catch(() => [])
      setSharedWith(shares)
    } else {
      setSharedWith([])
    }
    setEditing(f.id); setShowForm(true); setError('')
  }

  async function handleSubmit(e) {
    e.preventDefault(); setError('')
    const payload = {
      groupName:    form.groupName    || null,
      fareAdult:  form.fareAdult  ? Number(form.fareAdult)  : null,
      fareChild:  form.fareChild  ? Number(form.fareChild)  : null,
      fareInfant: form.fareInfant ? Number(form.fareInfant) : null,
      costAdult:  form.costAdult  ? Number(form.costAdult)  : null,
      costChild:  form.costChild  ? Number(form.costChild)  : null,
      costInfant: form.costInfant ? Number(form.costInfant) : null,
      taxTotal:   form.taxTotal   ? Number(form.taxTotal)   : null,
      baggageInfo: form.baggageInfo || null,
      status: form.status,
      seatQuota:  form.seatQuota  ? Number(form.seatQuota)  : null,
      contactPersonPhone: form.contactPersonPhone || null,
      contactPersonEmail: form.contactPersonEmail || null,
      sharedWith: isSuperAdmin ? sharedWith : [],
      legs: form.legs
        .filter(l => l.origin && l.destination)
        .map(l => ({
          origin:      l.origin.toUpperCase().trim(),
          destination: l.destination.toUpperCase().trim(),
          departAt:    l.departAt ? new Date(l.departAt).toISOString() : null,
          arriveAt:    l.arriveAt ? new Date(l.arriveAt).toISOString() : null,
          baggageKg:   l.baggageKg   ? Number(l.baggageKg)   : null,
          airlineId:   l.airlineId   ? Number(l.airlineId)   : null,
          flightNumber: l.flightNumber || null,
          pnrCode:     l.pnrCode     || null,
          airlineCode: l.airlineCode || null,
          flightClass: l.flightClass || 'economy',
          handCarryKg: l.handCarryKg ? Number(l.handCarryKg) : null,
        })),
    }
    try {
      editing ? await updateFlight(editing, payload) : await createFlight(payload)
      setShowForm(false); load()
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message
      setError(msg ? `Save failed: ${msg}` : 'Save failed. Ensure Adult fare and at least one leg are set.')
    }
  }

  async function handleDelete(id) {
    if (!confirm('Soft-delete this flight?')) return
    try { await deleteFlight(id); load() }
    catch { setError('Delete failed.') }
  }

  function toggleAgency(id) {
    setSharedWith(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  function set(k) { return v => setForm(f => ({ ...f, [k]: v })) }

  function setLeg(i, field, value) {
    setForm(f => {
      const legs = [...f.legs]
      legs[i] = { ...legs[i], [field]: value }
      return { ...f, legs }
    })
  }

  function addLeg() {
    setForm(f => ({ ...f, legs: [...f.legs, { ...emptyLeg }] }))
  }

  function removeLeg(i) {
    setForm(f => ({ ...f, legs: f.legs.filter((_, idx) => idx !== i) }))
  }

  function legChain(flight) {
    if (!flight.legs || flight.legs.length === 0) return '—'
    return flight.legs.map(l => l.origin).join(' → ') + ' → ' + flight.legs[flight.legs.length - 1].destination
  }

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
    const days  = Math.round((last - first) / 86400000)
    return Math.max(1, days)
  }

  function headerRoute(f) {
    const airline = f.legs?.[0]?.airlineName || f.airlineName || ''
    const legs = f.legs ?? []
    const stops = legs.length ? [legs[0].origin, ...legs.map(l => l.destination)] : []
    return airline ? `${airline} · ${stops.join('-')}` : stops.join('-')
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Flight Management</h1>
        <button onClick={openCreate} className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700">
          + New Flight
        </button>
      </div>

      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

      {/* Inline form panel */}
      {showForm && (
        <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">{editing ? 'Edit Flight' : 'New Flight'}</h2>
            <button type="button" onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600 text-xl font-bold leading-none">×</button>
          </div>

          <datalist id="stop-codes">
            {stopCodes.map(c => <option key={c} value={c} />)}
          </datalist>
          <datalist id="group-names">
            {groupNames.map(g => <option key={g} value={g} />)}
          </datalist>

          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Group Name — global */}
            <label className="block text-sm">
              <span className="block text-gray-600 mb-1">Group Name</span>
              <input list="group-names" value={form.groupName}
                onChange={e => set('groupName')(e.target.value)}
                placeholder="e.g. Hajj Group A, Tour Group 1"
                className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" />
            </label>

            {/* Legs */}
            <div className="border border-gray-200 rounded-lg p-3 space-y-3 bg-gray-50">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Flight Legs</span>
                <button type="button" onClick={addLeg}
                  className="text-xs px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                  + Add Leg
                </button>
              </div>
              {form.legs.map((leg, i) => (
                <div key={i} className="bg-white border border-gray-200 rounded-md p-3 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-gray-500 uppercase">Leg {i + 1}</span>
                    {form.legs.length > 1 && (
                      <button type="button" onClick={() => removeLeg(i)}
                        className="text-xs text-red-500 hover:underline">Remove</button>
                    )}
                  </div>

                  {/* Route */}
                  <div className="grid grid-cols-2 gap-2">
                    <label className="block text-sm">
                      <span className="block text-gray-600 mb-1">From *</span>
                      <input list="stop-codes" value={leg.origin}
                        onChange={e => setLeg(i, 'origin', e.target.value.toUpperCase())}
                        required placeholder="KHI"
                        className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" />
                    </label>
                    <label className="block text-sm">
                      <span className="block text-gray-600 mb-1">To *</span>
                      <input list="stop-codes" value={leg.destination}
                        onChange={e => setLeg(i, 'destination', e.target.value.toUpperCase())}
                        required placeholder="LHE"
                        className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" />
                    </label>
                    <DateTimeField label="Depart At" value={leg.departAt} onChange={v => setLeg(i, 'departAt', v)} />
                    <DateTimeField label="Arrive At" value={leg.arriveAt} onChange={v => setLeg(i, 'arriveAt', v)} />
                  </div>

                  {/* Airline & identifiers — per leg */}
                  <div className="grid grid-cols-2 gap-2">
                    <label className="block text-sm col-span-2 md:col-span-1">
                      <span className="block text-gray-600 mb-1">Airline</span>
                      <select value={leg.airlineId} onChange={e => setLeg(i, 'airlineId', e.target.value)}
                        className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500">
                        <option value="">— Select —</option>
                        {airlines.map(a => <option key={a.id} value={a.id}>{a.code} – {a.name}</option>)}
                      </select>
                    </label>
                    <LegField label="Flight Number" value={leg.flightNumber} onChange={v => setLeg(i, 'flightNumber', v)} placeholder="e.g. PK303" />
                    <LegField label="Airline Code"  value={leg.airlineCode}  onChange={v => setLeg(i, 'airlineCode', v)}  placeholder="e.g. PK" />
                    <LegField label="PNR Code"      value={leg.pnrCode}      onChange={v => setLeg(i, 'pnrCode', v)}      placeholder="e.g. ABC123" />
                  </div>

                  {/* Class, Baggage & Hand Carry — per leg */}
                  <div className="grid grid-cols-3 gap-2">
                    <label className="block text-sm">
                      <span className="block text-gray-600 mb-1">Class</span>
                      <select value={leg.flightClass} onChange={e => setLeg(i, 'flightClass', e.target.value)}
                        className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500">
                        {CLASS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                      </select>
                    </label>
                    <label className="block text-sm">
                      <span className="block text-gray-600 mb-1">Baggage (kg)</span>
                      <input type="number" min="0" step="1" value={leg.baggageKg}
                        onChange={e => setLeg(i, 'baggageKg', e.target.value)}
                        placeholder="e.g. 23"
                        className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" />
                    </label>
                    <label className="block text-sm">
                      <span className="block text-gray-600 mb-1">Hand Carry (kg)</span>
                      <input type="number" min="0" step="1" value={leg.handCarryKg}
                        onChange={e => setLeg(i, 'handCarryKg', e.target.value)}
                        placeholder="e.g. 7"
                        className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" />
                    </label>
                  </div>
                </div>
              ))}
            </div>

            {/* Selling prices */}
            <div className="border border-gray-200 rounded-lg p-3 bg-gray-50 space-y-2">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Selling Price (shown to agents)
              </p>
              <div className="grid grid-cols-3 gap-3">
                <NumField label="Adult *" value={form.fareAdult} onChange={set('fareAdult')} required />
                <NumField label="Child"   value={form.fareChild}  onChange={set('fareChild')} />
                <NumField label="Infant"  value={form.fareInfant} onChange={set('fareInfant')} />
              </div>
            </div>

            {/* Buying/cost prices — anyone who can manage flights */}
            {canManageFlights && (
              <div className="border border-amber-200 rounded-lg p-3 bg-amber-50 space-y-2">
                <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide">
                  Buying / Cost Price (admin only — not visible to agents)
                </p>
                <div className="grid grid-cols-3 gap-3">
                  <NumField label="Adult Cost"  value={form.costAdult}  onChange={set('costAdult')} />
                  <NumField label="Child Cost"  value={form.costChild}  onChange={set('costChild')} />
                  <NumField label="Infant Cost" value={form.costInfant} onChange={set('costInfant')} />
                </div>
              </div>
            )}

            <div className="grid grid-cols-3 gap-3">
              <NumField label="Tax Total"  value={form.taxTotal}  onChange={set('taxTotal')} />
              <IntField  label="Seat Quota" value={form.seatQuota} onChange={set('seatQuota')} placeholder="e.g. 150" />
              <label className="block text-sm">
                <span className="block text-gray-600 mb-1">Status</span>
                <select value={form.status} onChange={e => set('status')(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500">
                  {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </label>
            </div>

            <label className="block text-sm">
              <span className="block text-gray-600 mb-1">Baggage Info</span>
              <input value={form.baggageInfo} onChange={e => set('baggageInfo')(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" />
            </label>

            <div className="grid grid-cols-2 gap-3">
              <TextField label="Contact Person Phone" value={form.contactPersonPhone} onChange={set('contactPersonPhone')} placeholder="+92 300 0000000" />
              <TextField label="Contact Person Email" value={form.contactPersonEmail} onChange={set('contactPersonEmail')} placeholder="contact@airline.com" />
            </div>

            {/* Agency sharing — super_admin only */}
            {isSuperAdmin && agencies.length > 0 && (
              <div className="border border-indigo-200 rounded-lg p-3 bg-indigo-50">
                <p className="text-xs font-medium text-indigo-700 mb-2">Share with agencies</p>
                <div className="grid grid-cols-2 gap-1 max-h-32 overflow-y-auto">
                  {agencies.map(a => (
                    <label key={a.id} className="flex items-center gap-2 text-xs cursor-pointer">
                      <input type="checkbox" checked={sharedWith.includes(a.id)} onChange={() => toggleAgency(a.id)} className="rounded" />
                      <span className="text-gray-700 truncate">{a.name}</span>
                    </label>
                  ))}
                </div>
                {sharedWith.length > 0 && (
                  <p className="text-xs text-indigo-600 mt-1">{sharedWith.length} agenc{sharedWith.length === 1 ? 'y' : 'ies'} selected</p>
                )}
              </div>
            )}

            {error && <p className="text-sm text-red-600">{error}</p>}
            <div className="flex gap-2 pt-2">
              <button type="submit" className="px-6 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700">
                {editing ? 'Update' : 'Create'}
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="px-6 py-2 border text-sm rounded-md hover:bg-gray-50">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Flight Cards */}
      {loading ? (
        <p className="text-sm text-gray-500">Loading...</p>
      ) : flights.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-12">No flights found</p>
      ) : (
        <div className="space-y-4">
          {flights.map(f => {
            const legs = f.legs ?? []
            const firstLeg = legs[0]
            const headerColor = f.status === 'active'
              ? 'bg-green-700' : f.status === 'cancelled'
              ? 'bg-red-700' : 'bg-amber-600'

            return (
              <div key={f.id} className="border border-gray-200 rounded-lg overflow-hidden shadow-sm">

                {/* ── Header bar ── */}
                <div className={`${headerColor} text-white text-xs font-semibold px-4 py-2 flex flex-wrap items-center gap-x-3 gap-y-1`}>
                  <span className="tracking-wide">{(f.groupName || '—').toUpperCase()}</span>
                  <span className="opacity-50">|</span>
                  <span className="font-normal">{headerRoute(f)}</span>
                  <span className="opacity-50">|</span>
                  <span className="font-normal">Number of Days: {numDays(legs)}</span>
                  <span className="opacity-50">|</span>
                  <span className="font-mono">AG-{f.id}</span>
                </div>

                {/* ── Body table ── */}
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="text-left px-4 py-2 text-xs font-semibold text-gray-600 w-36">Airline</th>
                        <th className="text-left px-4 py-2 text-xs font-semibold text-gray-600">
                          Sector Details&nbsp;
                          <span className="font-normal text-indigo-600">({f.groupName || '—'})</span>
                        </th>
                        <th className="text-left px-4 py-2 text-xs font-semibold text-gray-600 w-32">Seats</th>
                        <th className="text-left px-4 py-2 text-xs font-semibold text-gray-600 w-32">Dep Date</th>
                        <th className="text-left px-4 py-2 text-xs font-semibold text-gray-600 w-32">Price</th>
                        <th className="text-right px-4 py-2 text-xs font-semibold text-gray-600 w-36"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {legs.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-4 py-3 text-gray-400 text-xs italic">No legs defined</td>
                        </tr>
                      ) : legs.map((leg, i) => (
                        <tr key={i} className="border-t border-gray-100">

                          {/* Airline — per leg */}
                          <td className="px-4 py-3 align-top">
                            {leg.airlineLogoUrl
                              ? <img src={leg.airlineLogoUrl} alt={leg.airlineCode} className="h-8 object-contain mb-0.5" />
                              : <span className="font-mono text-xs text-gray-500">{leg.airlineCode || '—'}</span>}
                            {leg.airlineName && (
                              <div className="text-xs text-gray-600 font-semibold uppercase leading-tight mt-0.5">
                                {leg.airlineName}
                              </div>
                            )}
                          </td>

                          {/* Sector details — per leg */}
                          <td className="px-4 py-3 align-top font-mono text-xs text-gray-700 whitespace-nowrap">
                            {i + 1})&nbsp;
                            <span className="font-semibold">{leg.flightNumber || '—'}</span>
                            &nbsp;{fmtLegDate(leg.departAt)}
                            &nbsp;{leg.origin}-{leg.destination}
                            &nbsp;{fmtTime(leg.departAt)}&nbsp;{fmtTime(leg.arriveAt)}
                            {leg.baggageKg != null && <>&nbsp;&nbsp;<span className="text-gray-500">{leg.baggageKg}-KG Baggage</span></>}
                          </td>

                          {/* Seats, Dep Date, Price, Actions — first leg only, rowSpan for the rest */}
                          {i === 0 && (
                            <>
                              <td className="px-4 py-3 align-top text-xs text-gray-700" rowSpan={legs.length}>
                                <div>Total Seats: <span className="font-semibold">{f.seatQuota ?? '—'}</span></div>
                                <div className="mt-0.5">
                                  Available Seats:&nbsp;
                                  <span className={`font-semibold ${f.availableSeats === 0 ? 'text-red-600' : 'text-green-700'}`}>
                                    {f.availableSeats ?? '—'}
                                  </span>
                                </div>
                              </td>
                              <td className="px-4 py-3 align-top text-xs font-semibold text-green-700 whitespace-nowrap" rowSpan={legs.length}>
                                {firstLeg?.departAt
                                  ? new Date(firstLeg.departAt).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
                                  : '—'}
                              </td>
                              <td className="px-4 py-3 align-top text-xs font-bold text-blue-700 whitespace-nowrap" rowSpan={legs.length}>
                                PKR {Number(f.fareAdult).toLocaleString()}
                              </td>
                              <td className="px-4 py-3 align-top text-right whitespace-nowrap" rowSpan={legs.length}>
                                <button onClick={() => setDetailFlight(f)} className="text-gray-500 hover:underline mr-3 text-xs">Details</button>
                                <button onClick={() => openEdit(f)} className="text-blue-600 hover:underline mr-3 text-xs">Edit</button>
                                <button onClick={() => handleDelete(f.id)} className="text-red-500 hover:underline text-xs">Delete</button>
                              </td>
                            </>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Details popup */}
      {detailFlight && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl p-6 overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Flight Details</h2>
              <button onClick={() => setDetailFlight(null)} className="text-gray-400 hover:text-gray-600 text-xl font-bold">×</button>
            </div>

            {detailFlight.airlineLogoUrl && (
              <img src={detailFlight.airlineLogoUrl} alt={detailFlight.airlineCode}
                className="h-12 object-contain mb-3" />
            )}
            <dl className="space-y-2 text-sm mb-4">
              <Row label="Group"          value={detailFlight.groupName    || '—'} />
              <Row label="Selling Price (Adult)"   value={detailFlight.fareAdult  != null ? `PKR ${Number(detailFlight.fareAdult).toLocaleString()}`  : '—'} />
              <Row label="Selling Price (Child)"   value={detailFlight.fareChild  != null ? `PKR ${Number(detailFlight.fareChild).toLocaleString()}`  : '—'} />
              <Row label="Selling Price (Infant)"  value={detailFlight.fareInfant != null ? `PKR ${Number(detailFlight.fareInfant).toLocaleString()}` : '—'} />
              {canManageFlights && detailFlight.costAdult != null && (
                <Row label="Cost Price (Adult)"    value={`PKR ${Number(detailFlight.costAdult).toLocaleString()}`} />
              )}
              {canManageFlights && detailFlight.costChild != null && (
                <Row label="Cost Price (Child)"    value={`PKR ${Number(detailFlight.costChild).toLocaleString()}`} />
              )}
              {canManageFlights && detailFlight.costInfant != null && (
                <Row label="Cost Price (Infant)"   value={`PKR ${Number(detailFlight.costInfant).toLocaleString()}`} />
              )}
              <Row label="Tax Total"      value={detailFlight.taxTotal   != null ? `PKR ${Number(detailFlight.taxTotal).toLocaleString()}`   : '—'} />
              <Row label="Seat Quota"     value={detailFlight.seatQuota ?? '—'} />
              <Row label="Baggage Info"   value={detailFlight.baggageInfo || '—'} />
              <Row label="Contact Phone"  value={detailFlight.contactPersonPhone || '—'} />
              <Row label="Contact Email"  value={detailFlight.contactPersonEmail || '—'} />
              <Row label="Status"         value={<StatusBadge status={detailFlight.status} />} />
            </dl>

            {/* Legs table with per-leg airline/class/handcarry */}
            {detailFlight.legs && detailFlight.legs.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Flight Legs</p>
                <div className="space-y-3">
                  {detailFlight.legs.map(l => (
                    <div key={l.legOrder} className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                      <div className="flex items-center gap-2 mb-2">
                        {l.airlineLogoUrl && <img src={l.airlineLogoUrl} alt={l.airlineCode} className="h-6 object-contain" />}
                        <span className="text-xs font-semibold text-gray-600 uppercase">Leg {l.legOrder}</span>
                        {l.airlineCode && <span className="text-xs font-mono text-gray-700">{l.airlineCode}</span>}
                        {l.airlineName && <span className="text-xs text-gray-500">— {l.airlineName}</span>}
                      </div>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                        <Row label="Route"        value={`${l.origin} → ${l.destination}`} />
                        <Row label="Class"        value={l.flightClass ? l.flightClass.charAt(0).toUpperCase() + l.flightClass.slice(1) : '—'} />
                        <Row label="Flight No."   value={l.flightNumber || '—'} />
                        <Row label="PNR"          value={l.pnrCode || '—'} />
                        <Row label="Depart"       value={fmtDt(l.departAt)} />
                        <Row label="Arrive"       value={fmtDt(l.arriveAt)} />
                        <Row label="Baggage"      value={l.baggageKg != null ? `${l.baggageKg} kg` : '—'} />
                        <Row label="Hand Carry"   value={l.handCarryKg != null ? `${l.handCarryKg} kg` : '—'} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-5 flex justify-end">
              <button onClick={() => setDetailFlight(null)} className="px-4 py-2 border text-sm rounded-md hover:bg-gray-50">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-gray-500 shrink-0">{label}</dt>
      <dd className="text-gray-800 font-medium text-right">{value}</dd>
    </div>
  )
}

function TextField({ label, value, onChange, placeholder }) {
  return (
    <label className="block text-sm">
      <span className="block text-gray-600 mb-1">{label}</span>
      <input type="text" value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" />
    </label>
  )
}

function LegField({ label, value, onChange, placeholder }) {
  return (
    <label className="block text-sm">
      <span className="block text-gray-600 mb-1">{label}</span>
      <input type="text" value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" />
    </label>
  )
}

function NumField({ label, value, onChange, required }) {
  return (
    <label className="block text-sm">
      <span className="block text-gray-600 mb-1">{label}</span>
      <input type="number" step="0.01" min="0" value={value} onChange={e => onChange(e.target.value)} required={required}
        className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" />
    </label>
  )
}

function IntField({ label, value, onChange, placeholder }) {
  return (
    <label className="block text-sm">
      <span className="block text-gray-600 mb-1">{label}</span>
      <input type="number" step="1" min="1" value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" />
    </label>
  )
}

function DateTimeField({ label, value, onChange }) {
  return (
    <label className="block text-sm">
      <span className="block text-gray-600 mb-1">{label}</span>
      <input type="datetime-local" value={value} onChange={e => onChange(e.target.value)}
        className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" />
    </label>
  )
}

function StatusBadge({ status }) {
  const cls = { active: 'bg-green-100 text-green-700', draft: 'bg-yellow-100 text-yellow-700', cancelled: 'bg-red-100 text-red-700' }[status] ?? 'bg-gray-100 text-gray-600'
  return <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${cls}`}>{status}</span>
}

function fmtDt(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('en-GB', { dateStyle: 'short', timeStyle: 'short' })
}

function toLocalInput(iso) {
  const d = new Date(iso)
  const pad = n => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}
