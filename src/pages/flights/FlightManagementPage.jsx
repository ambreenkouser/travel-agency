import { useEffect, useState } from 'react'
import { searchFlights, createFlight, updateFlight, deleteFlight } from '../../api/flights'
import { getAirlines } from '../../api/airlines'
import { getRoutes } from '../../api/routes'
import ExtrasEditor, { defaultExtras, extrasFromServer } from '../../components/ui/ExtrasEditor'

const STATUS_OPTIONS = ['draft', 'active', 'cancelled']

const emptyForm = {
  airlineId: '', routeId: '',
  departAt: '', arriveAt: '',
  fareAdult: '', fareChild: '', fareInfant: '',
  taxTotal: '', baggageInfo: '', status: 'draft', seatQuota: '',
}

export default function FlightManagementPage() {
  const [flights, setFlights]   = useState([])
  const [airlines, setAirlines] = useState([])
  const [routes, setRoutes]     = useState([])
  const [form, setForm]         = useState(emptyForm)
  const [extras, setExtras]     = useState(defaultExtras())
  const [editing, setEditing]   = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    Promise.all([load(), getAirlines().then(setAirlines), getRoutes().then(setRoutes)])
  }, [])

  function load() {
    setLoading(true)
    return searchFlights({ size: 100, status: 'all' })
      .then(page => setFlights(page.content ?? []))
      .catch(() => setError('Failed to load flights'))
      .finally(() => setLoading(false))
  }

  function openCreate() {
    setForm(emptyForm); setExtras(defaultExtras())
    setEditing(null); setShowForm(true); setError('')
  }

  function openEdit(f) {
    setForm({
      airlineId:   f.airlineCode ? (airlines.find(a => a.code === f.airlineCode)?.id ?? '') : '',
      routeId:     routes.find(r => r.origin === f.origin && r.destination === f.destination)?.id ?? '',
      departAt:    f.departAt ? toLocalInput(f.departAt) : '',
      arriveAt:    f.arriveAt ? toLocalInput(f.arriveAt) : '',
      fareAdult:   f.fareAdult ?? '',
      fareChild:   f.fareChild ?? '',
      fareInfant:  f.fareInfant ?? '',
      taxTotal:    f.taxTotal ?? '',
      baggageInfo: f.baggageInfo ?? '',
      status:      f.status ?? 'draft',
      seatQuota:   f.seatQuota ?? '',
    })
    setExtras(extrasFromServer(f.extras))
    setEditing(f.id); setShowForm(true); setError('')
  }

  async function handleSubmit(e) {
    e.preventDefault(); setError('')
    const payload = {
      ...form,
      airlineId:  form.airlineId  ? Number(form.airlineId)  : null,
      routeId:    form.routeId    ? Number(form.routeId)    : null,
      fareAdult:  form.fareAdult  ? Number(form.fareAdult)  : null,
      fareChild:  form.fareChild  ? Number(form.fareChild)  : null,
      fareInfant: form.fareInfant ? Number(form.fareInfant) : null,
      taxTotal:   form.taxTotal   ? Number(form.taxTotal)   : null,
      departAt:   form.departAt   ? new Date(form.departAt).toISOString() : null,
      arriveAt:   form.arriveAt   ? new Date(form.arriveAt).toISOString() : null,
      seatQuota:  form.seatQuota  ? Number(form.seatQuota)  : null,
      extras,
    }
    try {
      editing ? await updateFlight(editing, payload) : await createFlight(payload)
      setShowForm(false); load()
    } catch {
      setError('Save failed. Ensure Adult fare and Route are set.')
    }
  }

  async function handleDelete(id) {
    if (!confirm('Soft-delete this flight?')) return
    try { await deleteFlight(id); load() }
    catch { setError('Delete failed.') }
  }

  function set(k) { return v => setForm(f => ({ ...f, [k]: v })) }

  const routeLabel = r =>
    r.routeType === 'ROUND_TRIP'
      ? `${r.origin} → ${r.destination} → ${r.origin}  (Round Trip)`
      : `${r.origin} → ${r.destination}  (One Way)`

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Flight Management</h1>
        <button onClick={openCreate} className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700">
          + New Flight
        </button>
      </div>

      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

      {/* Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg p-6 overflow-y-auto max-h-screen">
            <h2 className="text-lg font-semibold mb-4">{editing ? 'Edit Flight' : 'New Flight'}</h2>
            <form onSubmit={handleSubmit} className="space-y-3">

              <div className="grid grid-cols-2 gap-3">
                <label className="block text-sm">
                  <span className="block text-gray-600 mb-1">Airline</span>
                  <select value={form.airlineId} onChange={e => set('airlineId')(e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500">
                    <option value="">— Select —</option>
                    {airlines.map(a => <option key={a.id} value={a.id}>{a.code} – {a.name}</option>)}
                  </select>
                </label>

                <label className="block text-sm">
                  <span className="block text-gray-600 mb-1">Route *</span>
                  <select value={form.routeId} onChange={e => set('routeId')(e.target.value)} required
                    className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500">
                    <option value="">— Select —</option>
                    {routes.map(r => <option key={r.id} value={r.id}>{routeLabel(r)}</option>)}
                  </select>
                </label>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <DateTimeField label="Depart At" value={form.departAt} onChange={set('departAt')} />
                <DateTimeField label="Arrive At" value={form.arriveAt} onChange={set('arriveAt')} />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <NumField label="Fare Adult *" value={form.fareAdult} onChange={set('fareAdult')} required />
                <NumField label="Fare Child"   value={form.fareChild}  onChange={set('fareChild')} />
                <NumField label="Fare Infant"  value={form.fareInfant} onChange={set('fareInfant')} />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <NumField label="Tax Total" value={form.taxTotal} onChange={set('taxTotal')} />
                <IntField label="Seat Quota" value={form.seatQuota} onChange={set('seatQuota')} placeholder="e.g. 150" />
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

              <div className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                <ExtrasEditor extras={extras} onChange={setExtras} />
              </div>

              {error && <p className="text-sm text-red-600">{error}</p>}
              <div className="flex gap-2 pt-2">
                <button type="submit" className="flex-1 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700">
                  {editing ? 'Update' : 'Create'}
                </button>
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-2 border text-sm rounded-md hover:bg-gray-50">
                  Cancel
                </button>
              </div>
            </form>
          </div>
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
                {['Airline', 'Route', 'Depart', 'Arrive', 'Adult', 'Child', 'Infant', 'Status', ''].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {flights.length === 0 && (
                <tr><td colSpan={9} className="px-4 py-8 text-center text-gray-400">No flights found</td></tr>
              )}
              {flights.map(f => (
                <tr key={f.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-gray-700">{f.airlineCode ?? '—'}</td>
                  <td className="px-4 py-3 text-gray-700 whitespace-nowrap">
                    {f.origin} → {f.destination}{f.routeType === 'ROUND_TRIP' ? ` → ${f.origin}` : ''}
                  </td>
                  <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{fmtDt(f.departAt)}</td>
                  <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{fmtDt(f.arriveAt)}</td>
                  <td className="px-4 py-3 text-gray-700">{f.fareAdult}</td>
                  <td className="px-4 py-3 text-gray-500">{f.fareChild ?? '—'}</td>
                  <td className="px-4 py-3 text-gray-500">{f.fareInfant ?? '—'}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={f.status} />
                  </td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    <button onClick={() => openEdit(f)} className="text-blue-600 hover:underline mr-3 text-xs">Edit</button>
                    <button onClick={() => handleDelete(f.id)} className="text-red-500 hover:underline text-xs">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
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
  const cls = {
    active:    'bg-green-100 text-green-700',
    draft:     'bg-yellow-100 text-yellow-700',
    cancelled: 'bg-red-100 text-red-700',
  }[status] ?? 'bg-gray-100 text-gray-600'
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
