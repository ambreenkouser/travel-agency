import { useEffect, useState } from 'react'
import {
  getUmrahPackages,
  createUmrahPackage,
  updateUmrahPackage,
  deleteUmrahPackage,
  getUmrahShares,
} from '../../api/umrah'
import client from '../../api/client'
import { getAgencies } from '../../api/agencies'
import { useAuth } from '../../context/AuthContext'
import PackageAddonsEditor, { defaultAddons, addonsFromServer } from '../../components/ui/PackageAddonsEditor'

const STATUS_OPTIONS = ['draft', 'active', 'cancelled']

const emptyForm = {
  title: '', durationDays: '', startDate: '', endDate: '',
  basePrice: '', priceChild: '', priceInfant: '', status: 'draft',
  packageClass: 'economy',
  contactPersonPhone: '', contactPersonEmail: '',
  costAdult: '', costChild: '', costInfant: '',
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
                {a.code} – {a.name}{a.seatQuota != null ? ` (remaining: ${a.remainingQuota}/${a.seatQuota})` : ''}
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
  const { user } = useAuth()
  const isSuperAdmin = user?.authorities?.includes('ROLE_super_admin') ?? false

  const [packages, setPackages]           = useState([])
  const [airlineOptions, setAirlineOptions] = useState([])
  const [agencies, setAgencies]           = useState([])
  const [form, setForm]                   = useState(emptyForm)
  const [addons, setAddons]               = useState(defaultAddons())
  const [configEntries, setConfigEntries] = useState([])
  const [airlineRows, setAirlineRows]     = useState([])
  const [sharedWith, setSharedWith]       = useState([])
  const [editing, setEditing]             = useState(null)
  const [showForm, setShowForm]           = useState(false)
  const [error, setError]                 = useState('')
  const [loading, setLoading]             = useState(true)
  const [detailPkg, setDetailPkg]         = useState(null)

  useEffect(() => {
    load()
    client.get('/api/airlines').then(r => setAirlineOptions(r.data)).catch(() => {})
    if (isSuperAdmin) getAgencies().then(setAgencies).catch(() => {})
  }, [])

  function load() {
    setLoading(true)
    getUmrahPackages()
      .then(setPackages)
      .catch(() => setError('Failed to load packages'))
      .finally(() => setLoading(false))
  }

  function openCreate() {
    setForm(emptyForm); setAddons(defaultAddons()); setConfigEntries([]); setAirlineRows([])
    setSharedWith([])
    setEditing(null); setShowForm(true); setError('')
  }

  async function openEdit(pkg) {
    setForm({
      title: pkg.title ?? '', durationDays: pkg.durationDays ?? '',
      startDate: pkg.startDate ?? '', endDate: pkg.endDate ?? '',
      basePrice: pkg.basePrice ?? '', priceChild: pkg.priceChild ?? '',
      priceInfant: pkg.priceInfant ?? '', status: pkg.status ?? 'draft',
      packageClass: pkg.packageClass ?? 'economy',
      contactPersonPhone: pkg.contactPersonPhone ?? '',
      contactPersonEmail: pkg.contactPersonEmail ?? '',
      costAdult:  pkg.costAdult  ?? '',
      costChild:  pkg.costChild  ?? '',
      costInfant: pkg.costInfant ?? '',
    })
    setAddons(addonsFromServer(pkg.extras))
    setConfigEntries(mapToEntries(pkg.config))
    setAirlineRows((pkg.airlines ?? []).map(a => ({
      airlineId: String(a.airlineId), allocatedSeats: String(a.allocatedSeats),
    })))
    if (isSuperAdmin) {
      const shares = await getUmrahShares(pkg.id).catch(() => [])
      setSharedWith(shares)
    } else {
      setSharedWith([])
    }
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
      packageClass: form.packageClass || 'economy',
      contactPersonPhone: form.contactPersonPhone || null,
      contactPersonEmail: form.contactPersonEmail || null,
      costAdult:    form.costAdult    === '' ? null : Number(form.costAdult),
      costChild:    form.costChild    === '' ? null : Number(form.costChild),
      costInfant:   form.costInfant   === '' ? null : Number(form.costInfant),
      config: entriesToMap(configEntries),
      extras: addons,
      airlines: airlineRows
        .filter(r => r.airlineId !== '')
        .map(r => ({ airlineId: Number(r.airlineId), allocatedSeats: Number(r.allocatedSeats) || 0 })),
      sharedWith: isSuperAdmin ? sharedWith : [],
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
  function toggleAgency(id) {
    setSharedWith(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Umrah Packages</h1>
        <button onClick={openCreate} className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700">
          + New Package
        </button>
      </div>

      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

      {/* Inline form panel */}
      {showForm && (
        <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">
              {editing ? 'Edit Umrah Package' : 'New Umrah Package'}
            </h2>
            <button type="button" onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600 text-xl font-bold leading-none">×</button>
          </div>
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
            <div className="grid grid-cols-2 gap-3">
              <label className="block text-sm">
                <span className="block text-gray-600 mb-1">Class</span>
                <select value={form.packageClass} onChange={set('packageClass')}
                  className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500">
                  <option value="economy">Economy</option>
                  <option value="business">Business</option>
                </select>
              </label>
              <label className="block text-sm">
                <span className="block text-gray-600 mb-1">Status</span>
                <select value={form.status} onChange={set('status')}
                  className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500">
                  {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </label>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Contact Person Phone" value={form.contactPersonPhone} onChange={set('contactPersonPhone')} placeholder="+92 300 0000000" />
              <Field label="Contact Person Email" value={form.contactPersonEmail} onChange={set('contactPersonEmail')} placeholder="contact@agency.com" />
            </div>

            {/* Airlines */}
            <div className="border border-gray-200 rounded-md p-3 bg-gray-50">
              <AirlineEditor rows={airlineRows} airlineOptions={airlineOptions} onChange={setAirlineRows} />
            </div>

            {/* Cost prices */}
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Cost Prices (Buying)</p>
            <div className="grid grid-cols-3 gap-3">
              <Field label="Cost Adult" value={form.costAdult} onChange={set('costAdult')} type="number" min="0" step="0.01" placeholder="0.00" />
              <Field label="Cost Child" value={form.costChild} onChange={set('costChild')} type="number" min="0" step="0.01" placeholder="0.00" />
              <Field label="Cost Infant" value={form.costInfant} onChange={set('costInfant')} type="number" min="0" step="0.01" placeholder="0.00" />
            </div>

            {/* Extras */}
            <PackageAddonsEditor addons={addons} onChange={setAddons} />

            {/* Config */}
            <div className="border border-gray-200 rounded-md p-3 bg-gray-50">
              <ConfigEditor entries={configEntries} onChange={setConfigEntries} />
            </div>

            {/* Agency assignment — super_admin only */}
            {isSuperAdmin && agencies.length > 0 && (
              <div className="border border-indigo-200 rounded-lg p-3 bg-indigo-50">
                <p className="text-xs font-medium text-indigo-700 mb-2">Share with agencies</p>
                <div className="grid grid-cols-2 gap-1 max-h-32 overflow-y-auto">
                  {agencies.map(a => (
                    <label key={a.id} className="flex items-center gap-2 text-xs cursor-pointer">
                      <input
                        type="checkbox"
                        checked={sharedWith.includes(a.id)}
                        onChange={() => toggleAgency(a.id)}
                        className="rounded"
                      />
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

      {/* Details popup */}
      <UmrahDetailModal pkg={detailPkg} onClose={() => setDetailPkg(null)} />

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
                    <button onClick={() => setDetailPkg(pkg)} className="text-gray-500 hover:underline mr-3 text-xs">Details</button>
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

function UmrahDetailModal({ pkg, onClose }) {
  if (!pkg) return null
  const enabledExtras = pkg.extras ? Object.entries(pkg.extras).filter(([, v]) => v && v.enabled !== false) : []
  const configEntries = pkg.config ? Object.entries(pkg.config) : []
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg p-6 overflow-y-auto max-h-[90vh]">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">{pkg.title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl font-bold">×</button>
        </div>

        <dl className="space-y-2 text-sm mb-4">
          <URow label="Status" value={<span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
            { active: 'bg-green-100 text-green-700', draft: 'bg-yellow-100 text-yellow-700', cancelled: 'bg-red-100 text-red-700' }[pkg.status] ?? 'bg-gray-100 text-gray-600'
          }`}>{pkg.status}</span>} />
          <URow label="Duration" value={pkg.durationDays ? `${pkg.durationDays} days` : '—'} />
          <URow label="Dates" value={pkg.startDate && pkg.endDate ? `${pkg.startDate} → ${pkg.endDate}` : pkg.startDate || '—'} />
          <URow label="Adult Price" value={pkg.basePrice != null ? `PKR ${Number(pkg.basePrice).toLocaleString()}` : '—'} />
          <URow label="Child Price" value={pkg.priceChild != null ? `PKR ${Number(pkg.priceChild).toLocaleString()}` : '—'} />
          <URow label="Infant Price" value={pkg.priceInfant != null ? `PKR ${Number(pkg.priceInfant).toLocaleString()}` : '—'} />
          <URow label="Class" value={pkg.packageClass ? pkg.packageClass.charAt(0).toUpperCase() + pkg.packageClass.slice(1) : '—'} />
          {pkg.contactPersonPhone && <URow label="Contact Phone" value={pkg.contactPersonPhone} />}
          {pkg.contactPersonEmail && <URow label="Contact Email" value={pkg.contactPersonEmail} />}
          {pkg.costAdult  != null && <URow label="Cost Adult"  value={`PKR ${Number(pkg.costAdult).toLocaleString()}`} />}
          {pkg.costChild  != null && <URow label="Cost Child"  value={`PKR ${Number(pkg.costChild).toLocaleString()}`} />}
          {pkg.costInfant != null && <URow label="Cost Infant" value={`PKR ${Number(pkg.costInfant).toLocaleString()}`} />}
        </dl>

        {pkg.airlines && pkg.airlines.length > 0 && (
          <div className="border-t border-gray-100 pt-3 mb-3">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Airlines</p>
            <div className="space-y-1">
              {pkg.airlines.map(a => (
                <div key={a.id} className="flex items-center justify-between text-sm bg-gray-50 px-3 py-1.5 rounded">
                  <span className="font-medium text-gray-700">{a.airlineCode}</span>
                  <span className={`text-xs px-2 py-0.5 rounded font-medium ${
                    a.availableSeats === 0 ? 'bg-red-100 text-red-700' :
                    a.availableSeats <= 5  ? 'bg-yellow-100 text-yellow-700' :
                    'bg-green-100 text-green-700'
                  }`}>
                    {a.availableSeats} / {a.allocatedSeats} available
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {configEntries.length > 0 && (
          <div className="border-t border-gray-100 pt-3 mb-3">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Config</p>
            <div className="space-y-1">
              {configEntries.map(([k, v]) => (
                <div key={k} className="flex justify-between text-sm">
                  <span className="text-gray-500">{k}</span>
                  <span className="text-gray-800 font-medium">{String(v)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {enabledExtras.length > 0 && (
          <div className="border-t border-gray-100 pt-3 mb-3">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Extras</p>
            <div className="space-y-1">
              {enabledExtras.map(([key, val]) => (
                <div key={key} className="flex items-center justify-between text-sm bg-gray-50 px-3 py-1.5 rounded">
                  <span className="capitalize font-medium text-gray-700">{key}</span>
                  <span className="text-gray-500">
                    {val.price != null ? `PKR ${Number(val.price).toLocaleString()}` : 'Included'}
                    {val.quantity > 1 ? ` × ${val.quantity}` : ''}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-5 flex justify-end">
          <button onClick={onClose} className="px-4 py-2 border text-sm rounded-md hover:bg-gray-50">Close</button>
        </div>
      </div>
    </div>
  )
}

function URow({ label, value }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-gray-500 shrink-0">{label}</dt>
      <dd className="text-gray-800 font-medium text-right">{value}</dd>
    </div>
  )
}

function Field({ label, value, onChange, type = 'text', required, min, step, placeholder }) {
  return (
    <label className="block text-sm">
      <span className="block text-gray-600 mb-1">{label}</span>
      <input type={type} value={value} onChange={onChange} required={required} min={min} step={step} placeholder={placeholder}
        className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" />
    </label>
  )
}

function StatusBadge({ status }) {
  const cls = { active: 'bg-green-100 text-green-700', draft: 'bg-yellow-100 text-yellow-700', cancelled: 'bg-red-100 text-red-700' }[status] ?? 'bg-gray-100 text-gray-600'
  return <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${cls}`}>{status}</span>
}
