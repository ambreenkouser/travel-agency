import { useEffect, useState } from 'react'
import { searchFlights, createFlight, updateFlight, deleteFlight, getFlightShares } from '../../api/flights'
import { getAirlines } from '../../api/airlines'
import { getRoutes } from '../../api/routes'
import { getAgencies } from '../../api/agencies'
import { useAuth } from '../../context/AuthContext'

const STATUS_OPTIONS = ['draft', 'active', 'cancelled']

const emptyLeg = { origin: '', destination: '', departAt: '', arriveAt: '', baggageKg: '' }

const emptyForm = {
  airlineId: '',
  flightNumber: '', airlineCode: '', pnrCode: '',
  groupName: '',
  fareAdult: '', fareChild: '', fareInfant: '',
  costAdult: '', costChild: '', costInfant: '',
  taxTotal: '', baggageInfo: '', status: 'draft', seatQuota: '',
  flightClass: 'economy',
  contactPersonPhone: '', contactPersonEmail: '',
  legs: [{ ...emptyLeg }],
}

export default function FlightManagementPage() {
  const { user } = useAuth()
  const isSuperAdmin = user?.authorities?.includes('ROLE_super_admin') ?? false
  const canManageFlights = user?.authorities?.includes('flights:manage') ?? false

  const [flights, setFlights]     = useState([])
  const [airlines, setAirlines]   = useState([])
  const [stopCodes, setStopCodes]   = useState([])  // unique sector codes for autocomplete
  const [groupNames, setGroupNames] = useState([])  // existing group names for datalist
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
        // Collect unique stop codes from sector pairs for autocomplete
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
      airlineId:    f.airlineCode ? (airlines.find(a => a.code === f.airlineCode)?.id ?? '') : '',
      flightNumber: f.flightNumber ?? '',
      airlineCode:  f.airlineCode  ?? '',
      pnrCode:      f.pnrCode      ?? '',
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
      flightClass:  f.flightClass ?? 'economy',
      contactPersonPhone: f.contactPersonPhone ?? '',
      contactPersonEmail: f.contactPersonEmail ?? '',
      legs: (f.legs ?? []).length > 0
        ? f.legs.map(l => ({
            origin:      l.origin ?? '',
            destination: l.destination ?? '',
            departAt:    l.departAt ? toLocalInput(l.departAt) : '',
            arriveAt:    l.arriveAt ? toLocalInput(l.arriveAt) : '',
            baggageKg:   l.baggageKg ?? '',
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
      airlineId:  form.airlineId  ? Number(form.airlineId)  : null,
      flightNumber: form.flightNumber || null,
      airlineCode:  form.airlineCode  || null,
      pnrCode:      form.pnrCode      || null,
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
      flightClass: form.flightClass || 'economy',
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
          baggageKg:   l.baggageKg ? Number(l.baggageKg) : null,
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

            {/* Stop codes datalist for autocomplete */}
            <datalist id="stop-codes">
              {stopCodes.map(c => <option key={c} value={c} />)}
            </datalist>

            {/* Group names datalist */}
            <datalist id="group-names">
              {groupNames.map(g => <option key={g} value={g} />)}
            </datalist>

            <form onSubmit={handleSubmit} className="space-y-4">

              {/* Airline + identifiers */}
              <div className="grid grid-cols-2 gap-3">
                <label className="block text-sm">
                  <span className="block text-gray-600 mb-1">Airline</span>
                  <select value={form.airlineId} onChange={e => set('airlineId')(e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500">
                    <option value="">— Select —</option>
                    {airlines.map(a => <option key={a.id} value={a.id}>{a.code} – {a.name}</option>)}
                  </select>
                </label>
                <TextField label="Flight Number" value={form.flightNumber} onChange={set('flightNumber')} placeholder="e.g. PK303" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <TextField label="Airline Code" value={form.airlineCode} onChange={set('airlineCode')} placeholder="e.g. PK" />
                <TextField label="PNR Code"     value={form.pnrCode}     onChange={set('pnrCode')}     placeholder="e.g. ABC123" />
              </div>
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
                  <div key={i} className="bg-white border border-gray-200 rounded-md p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-gray-500 uppercase">Leg {i + 1}</span>
                      {form.legs.length > 1 && (
                        <button type="button" onClick={() => removeLeg(i)}
                          className="text-xs text-red-500 hover:underline">Remove</button>
                      )}
                    </div>
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
                      <label className="block text-sm col-span-2 md:col-span-1">
                        <span className="block text-gray-600 mb-1">Baggage (kg)</span>
                        <input type="number" min="0" step="1" value={leg.baggageKg}
                          onChange={e => setLeg(i, 'baggageKg', e.target.value)}
                          placeholder="e.g. 23"
                          className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" />
                      </label>
                    </div>
                  </div>
                ))}
              </div>

              {/* Selling prices (visible to agents as ticket price) */}
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

              {/* Buying/cost prices — anyone who can manage flights (not sub_agents) */}
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
                <NumField label="Tax Total" value={form.taxTotal} onChange={set('taxTotal')} />
                <IntField label="Seat Quota" value={form.seatQuota} onChange={set('seatQuota')} placeholder="e.g. 150" />
                <label className="block text-sm">
                  <span className="block text-gray-600 mb-1">Class</span>
                  <select value={form.flightClass} onChange={e => set('flightClass')(e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500">
                    <option value="economy">Economy</option>
                    <option value="business">Business</option>
                  </select>
                </label>
              </div>

              <label className="block text-sm">
                <span className="block text-gray-600 mb-1">Status</span>
                <select value={form.status} onChange={e => set('status')(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500">
                  {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </label>

              <label className="block text-sm">
                <span className="block text-gray-600 mb-1">Baggage Info</span>
                <input value={form.baggageInfo} onChange={e => set('baggageInfo')(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" />
              </label>

              {/* Contact Person */}
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

      {/* Table */}
      {loading ? (
        <p className="text-sm text-gray-500">Loading...</p>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {['Logo', 'Airline', 'Group', 'Route', 'Depart', 'Adult', 'Status', ''].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {flights.length === 0 && (
                <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-400">No flights found</td></tr>
              )}
              {flights.map(f => (
                <tr key={f.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    {f.airlineLogoUrl
                      ? <img src={f.airlineLogoUrl} alt={f.airlineCode} className="h-8 w-14 object-contain" />
                      : <span className="text-gray-300 text-xs">—</span>}
                  </td>
                  <td className="px-4 py-3 font-mono text-gray-700">
                    <div>{f.airlineCode ?? '—'}</div>
                    {f.flightNumber && <div className="text-xs text-gray-400">{f.flightNumber}</div>}
                    {f.pnrCode && <div className="text-xs text-blue-500">PNR: {f.pnrCode}</div>}
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{f.groupName || '—'}</td>
                  <td className="px-4 py-3 text-gray-700 whitespace-nowrap font-medium">{legChain(f)}</td>
                  <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{fmtDt(f.departAt)}</td>
                  <td className="px-4 py-3 text-gray-700">{f.fareAdult}</td>
                  <td className="px-4 py-3"><StatusBadge status={f.status} /></td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    <button onClick={() => setDetailFlight(f)} className="text-gray-500 hover:underline mr-3 text-xs">Details</button>
                    <button onClick={() => openEdit(f)} className="text-blue-600 hover:underline mr-3 text-xs">Edit</button>
                    <button onClick={() => handleDelete(f.id)} className="text-red-500 hover:underline text-xs">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Details popup */}
      {detailFlight && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg p-6 overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Flight Details</h2>
              <button onClick={() => setDetailFlight(null)} className="text-gray-400 hover:text-gray-600 text-xl font-bold">×</button>
            </div>

            {detailFlight.airlineLogoUrl && (
              <img src={detailFlight.airlineLogoUrl} alt={detailFlight.airlineCode}
                className="h-12 object-contain mb-3" />
            )}
            <dl className="space-y-2 text-sm mb-4">
              <Row label="Airline"        value={detailFlight.airlineCode ? `${detailFlight.airlineCode}${detailFlight.airlineName ? ' – ' + detailFlight.airlineName : ''}` : '—'} />
              <Row label="Flight Number"  value={detailFlight.flightNumber || '—'} />
              <Row label="PNR Code"       value={detailFlight.pnrCode      || '—'} />
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
              <Row label="Class"          value={detailFlight.flightClass ? detailFlight.flightClass.charAt(0).toUpperCase() + detailFlight.flightClass.slice(1) : '—'} />
              <Row label="Baggage Info"   value={detailFlight.baggageInfo || '—'} />
              <Row label="Contact Phone"  value={detailFlight.contactPersonPhone || '—'} />
              <Row label="Contact Email"  value={detailFlight.contactPersonEmail || '—'} />
              <Row label="Status"         value={<StatusBadge status={detailFlight.status} />} />
            </dl>

            {/* Legs table */}
            {detailFlight.legs && detailFlight.legs.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Flight Legs</p>
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <table className="w-full text-xs">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        {['Leg', 'From', 'To', 'Depart', 'Arrive'].map(h => (
                          <th key={h} className="text-left px-3 py-2 font-medium text-gray-500">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {detailFlight.legs.map(l => (
                        <tr key={l.legOrder}>
                          <td className="px-3 py-2 text-gray-500">{l.legOrder}</td>
                          <td className="px-3 py-2 font-medium text-gray-800">{l.origin}</td>
                          <td className="px-3 py-2 font-medium text-gray-800">{l.destination}</td>
                          <td className="px-3 py-2 text-gray-600">{fmtDt(l.departAt)}</td>
                          <td className="px-3 py-2 text-gray-600">{fmtDt(l.arriveAt)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
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
