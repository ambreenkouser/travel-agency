import { useEffect, useState } from 'react'
import {
  getUmrahPackages,
  createUmrahPackage,
  updateUmrahPackage,
  deleteUmrahPackage,
} from '../../api/umrah'
import { searchFlights } from '../../api/flights'
import client from '../../api/client'
import ExtrasEditor, { defaultExtras, extrasFromServer } from '../../components/ui/ExtrasEditor'

const STATUS_OPTIONS = ['draft', 'active', 'cancelled']

const emptyForm = {
  title: '', durationDays: '', startDate: '', endDate: '',
  basePrice: '', priceChild: '', priceInfant: '', status: 'draft',
}

// ── Config editor ──────────────────────────────────────────────────────────
function ConfigEditor({ entries, onChange }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-600">Config Fields</span>
        <button type="button" onClick={() => onChange([...entries, { key: '', value: '' }])}
          className="text-xs text-blue-600 hover:underline">+ Add field</button>
      </div>
      {entries.length === 0 && (
        <p className="text-xs text-gray-400 italic">No config fields.</p>
      )}
      {entries.map((entry, i) => (
        <div key={i} className="flex gap-2 items-center">
          <input value={entry.key} onChange={e => onChange(entries.map((x, j) => j===i ? {...x, key:e.target.value} : x))}
            placeholder="key" className="flex-1 border rounded px-2 py-1 text-xs" />
          <span className="text-gray-400 text-xs">:</span>
          <input value={entry.value} onChange={e => onChange(entries.map((x, j) => j===i ? {...x, value:e.target.value} : x))}
            placeholder="value" className="flex-1 border rounded px-2 py-1 text-xs" />
          <button type="button" onClick={() => onChange(entries.filter((_, j) => j !== i))}
            className="text-red-400 text-xs font-bold px-1">✕</button>
        </div>
      ))}
    </div>
  )
}

function mapToEntries(config) {
  if (!config || typeof config !== 'object') return []
  return Object.entries(config).map(([key, value]) => ({ key, value: String(value) }))
}
function entriesToMap(entries) {
  const result = {}
  entries.forEach(({ key, value }) => { if (key.trim()) result[key.trim()] = value })
  return result
}

// ── Airline rows editor ────────────────────────────────────────────────────
function AirlineEditor({ rows, airlineOptions, onChange }) {
  function addRow() {
    onChange([...rows, { airlineId: '', allocatedSeats: '' }])
  }
  function removeRow(i) {
    onChange(rows.filter((_, j) => j !== i))
  }
  function update(i, field, val) {
    onChange(rows.map((r, j) => j === i ? { ...r, [field]: val } : r))
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-600">Linked Airlines &amp; Seat Allocation</span>
        <button type="button" onClick={addRow} className="text-xs text-blue-600 hover:underline">+ Add airline</button>
      </div>
      {rows.length === 0 && (
        <p className="text-xs text-gray-400 italic">No airlines linked yet.</p>
      )}
      {rows.map((row, i) => (
        <div key={i} className="flex gap-2 items-center">
          <select
            value={row.airlineId}
            onChange={e => update(i, 'airlineId', e.target.value)}
            className="flex-1 border border-gray-300 rounded-md px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="">— Select airline —</option>
            {airlineOptions.map(a => (
              <option key={a.id} value={a.id}>
                {a.code} – {a.name}{a.seatQuota ? ` (quota: ${a.seatQuota})` : ''}
              </option>
            ))}
          </select>
          <input
            type="number" min="0" value={row.allocatedSeats}
            onChange={e => update(i, 'allocatedSeats', e.target.value)}
            placeholder="Seats"
            className="w-20 border border-gray-300 rounded-md px-2 py-1 text-xs"
          />
          <button type="button" onClick={() => removeRow(i)}
            className="text-red-400 hover:text-red-600 text-xs font-bold px-1">✕</button>
        </div>
      ))}
    </div>
  )
}

// ── Main page ──────────────────────────────────────────────────────────────
export default function UmrahManagementPage() {
  const [packages, setPackages]           = useState([])
  const [airlineOptions, setAirlineOptions] = useState([])
  const [form, setForm]                   = useState(emptyForm)
  const [extras, setExtras]               = useState(defaultExtras())
  const [configEntries, setConfigEntries] = useState([])
  const [airlineRows, setAirlineRows]     = useState([])
  const [editing, setEditing]             = useState(null)
  const [showForm, setShowForm]           = useState(false)
  const [error, setError]                 = useState('')
  const [loading, setLoading]             = useState(true)

  useEffect(() => {
    load()
    client.get('/api/airlines').then(r => setAirlineOptions(r.data)).catch(() => {})
  }, [])

  function load() {
    setLoading(true)
    getUmrahPackages()
      .then(setPackages)
      .catch(() => setError('Failed to load packages'))
      .finally(() => setLoading(false))
  }

  function openCreate() {
    setForm(emptyForm); setExtras(defaultExtras()); setConfigEntries([]); setAirlineRows([])
    setEditing(null); setShowForm(true); setError('')
  }

  function openEdit(pkg) {
    setForm({
      title: pkg.title ?? '', durationDays: pkg.durationDays ?? '',
      startDate: pkg.startDate ?? '', endDate: pkg.endDate ?? '',
      basePrice: pkg.basePrice ?? '', priceChild: pkg.priceChild ?? '',
      priceInfant: pkg.priceInfant ?? '', status: pkg.status ?? 'draft',
    })
    setExtras(extrasFromServer(pkg.extras))
    setConfigEntries(mapToEntries(pkg.config))
    setAirlineRows((pkg.airlines ?? []).map(a => ({
      airlineId: String(a.airlineId), allocatedSeats: String(a.allocatedSeats),
    })))
    setEditing(pkg.id); setShowForm(true); setError('')
  }

  async function handleSubmit(e) {
    e.preventDefault(); setError('')
    const payload = {
      ...form,
      durationDays: form.durationDays  === '' ? null : Number(form.durationDays),
      basePrice:    form.basePrice     === '' ? null : Number(form.basePrice),
      priceChild:   form.priceChild    === '' ? null : Number(form.priceChild),
      priceInfant:  form.priceInfant   === '' ? null : Number(form.priceInfant),
      startDate:    form.startDate     || null,
      endDate:      form.endDate       || null,
      config: entriesToMap(configEntries),
      extras,
      airlines: airlineRows
        .filter(r => r.airlineId !== '')
        .map(r => ({ airlineId: Number(r.airlineId), allocatedSeats: Number(r.allocatedSeats) || 0 })),
    }
    try {
      editing ? await updateUmrahPackage(editing, payload) : await createUmrahPackage(payload)
      setShowForm(false); load()
    } catch (err) {
      setError(err?.response?.data?.message ?? err?.message ?? 'Save failed. Please check all required fields.')
    }
  }

  async function handleDelete(id) {
    if (!confirm('Soft-delete this package?')) return
    try { await deleteUmrahPackage(id); load() }
    catch { setError('Delete failed.') }
  }

  function set(k) { return e => setForm(f => ({ ...f, [k]: e.target.value })) }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Umrah Packages</h1>
        <button onClick={openCreate} className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700">
          + New Package
        </button>
      </div>

      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

      {/* Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg p-6 overflow-y-auto max-h-[90vh]">
            <h2 className="text-lg font-semibold mb-4">
              {editing ? 'Edit Umrah Package' : 'New Umrah Package'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-3">
              <Field label="Title *" value={form.title} onChange={set('title')} required />
              <div className="grid grid-cols-2 gap-3">
                <Field label="Duration (days)" value={form.durationDays} onChange={set('durationDays')} type="number" min="1" />
                <Field label="Adult Price (PKR) *" value={form.basePrice} onChange={set('basePrice')} type="number" min="0" step="0.01" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Child Price (PKR)" value={form.priceChild} onChange={set('priceChild')} type="number" min="0" step="0.01" />
                <Field label="Infant Price (PKR)" value={form.priceInfant} onChange={set('priceInfant')} type="number" min="0" step="0.01" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Start Date" value={form.startDate} onChange={set('startDate')} type="date" />
                <Field label="End Date"   value={form.endDate}   onChange={set('endDate')}   type="date" />
              </div>
              <label className="block text-sm">
                <span className="block text-gray-600 mb-1">Status</span>
                <select value={form.status} onChange={set('status')}
                  className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500">
                  {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </label>

              {/* Airlines */}
              <div className="border border-gray-200 rounded-md p-3 bg-gray-50">
                <AirlineEditor rows={airlineRows} airlineOptions={airlineOptions} onChange={setAirlineRows} />
              </div>

              {/* Extras */}
              <div className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                <ExtrasEditor extras={extras} onChange={setExtras} />
              </div>

              {/* Config */}
              <div className="border border-gray-200 rounded-md p-3 bg-gray-50">
                <ConfigEditor entries={configEntries} onChange={setConfigEntries} />
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
      {loading ? <p className="text-sm text-gray-500">Loading...</p> : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {['Title', 'Duration', 'Dates', 'Price', 'Airlines & Seats', 'Status', ''].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {packages.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">No packages found</td></tr>
              )}
              {packages.map(pkg => (
                <tr key={pkg.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{pkg.title}</td>
                  <td className="px-4 py-3 text-gray-500">{pkg.durationDays ? `${pkg.durationDays}d` : '—'}</td>
                  <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                    {pkg.startDate && pkg.endDate ? `${pkg.startDate} → ${pkg.endDate}` : pkg.startDate || '—'}
                  </td>
                  <td className="px-4 py-3 text-gray-700">
                    {pkg.basePrice ? `PKR ${Number(pkg.basePrice).toLocaleString()}` : '—'}
                  </td>
                  <td className="px-4 py-3">
                    {pkg.airlines && pkg.airlines.length > 0 ? (
                      <div className="flex flex-col gap-1">
                        {pkg.airlines.map(a => (
                          <div key={a.id} className="flex items-center gap-2 text-xs">
                            <span className="font-medium text-gray-700">{a.airlineCode}</span>
                            <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${
                              a.availableSeats === 0 ? 'bg-red-100 text-red-700' :
                              a.availableSeats <= 5  ? 'bg-yellow-100 text-yellow-700' :
                              'bg-green-100 text-green-700'
                            }`}>
                              {a.availableSeats}/{a.allocatedSeats} avail
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : <span className="text-gray-400 text-xs">No airlines</span>}
                  </td>
                  <td className="px-4 py-3"><StatusBadge status={pkg.status} /></td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    <button onClick={() => openEdit(pkg)} className="text-blue-600 hover:underline mr-3 text-xs">Edit</button>
                    <button onClick={() => handleDelete(pkg.id)} className="text-red-500 hover:underline text-xs">Delete</button>
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

function Field({ label, value, onChange, type = 'text', required, min, step }) {
  return (
    <label className="block text-sm">
      <span className="block text-gray-600 mb-1">{label}</span>
      <input type={type} value={value} onChange={onChange} required={required} min={min} step={step}
        className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" />
    </label>
  )
}

function StatusBadge({ status }) {
  const cls = { active: 'bg-green-100 text-green-700', draft: 'bg-yellow-100 text-yellow-700', cancelled: 'bg-red-100 text-red-700' }[status] ?? 'bg-gray-100 text-gray-600'
  return <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${cls}`}>{status}</span>
}
