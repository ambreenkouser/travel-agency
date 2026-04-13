import { useEffect, useState } from 'react'
import {
  getHajjPackages,
  createHajjPackage,
  updateHajjPackage,
  deleteHajjPackage,
} from '../../api/hajj'

const emptyForm = {
  title: '', quotaTotal: '', quotaReserved: '', basePrice: '',
}

function mapToEntries(obj) {
  if (!obj || typeof obj !== 'object') return []
  return Object.entries(obj).map(([key, value]) => ({ key, value: String(value) }))
}
function entriesToMap(entries) {
  const result = {}
  entries.forEach(({ key, value }) => { if (key.trim()) result[key.trim()] = value })
  return result
}

function ComplianceEditor({ entries, onChange }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-600">Compliance Fields</span>
        <button type="button" onClick={() => onChange([...entries, { key: '', value: '' }])}
          className="text-xs text-blue-600 hover:underline">+ Add field</button>
      </div>
      {entries.length === 0 && (
        <p className="text-xs text-gray-400 italic">No compliance fields added.</p>
      )}
      {entries.map((entry, i) => (
        <div key={i} className="flex gap-2 items-center">
          <input value={entry.key}
            onChange={e => onChange(entries.map((en, idx) => idx === i ? { ...en, key: e.target.value } : en))}
            placeholder="key (e.g. visa_type)"
            className="flex-1 border border-gray-300 rounded-md px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500" />
          <span className="text-gray-400 text-xs">:</span>
          <input value={entry.value}
            onChange={e => onChange(entries.map((en, idx) => idx === i ? { ...en, value: e.target.value } : en))}
            placeholder="value"
            className="flex-1 border border-gray-300 rounded-md px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500" />
          <button type="button" onClick={() => onChange(entries.filter((_, idx) => idx !== i))}
            className="text-red-400 hover:text-red-600 text-xs font-bold px-1">✕</button>
        </div>
      ))}
    </div>
  )
}

export default function HajjManagementPage() {
  const [packages, setPackages] = useState([])
  const [form, setForm]         = useState(emptyForm)
  const [complianceEntries, setComplianceEntries] = useState([])
  const [editing, setEditing]   = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(true)

  useEffect(() => { load() }, [])

  function load() {
    setLoading(true)
    getHajjPackages()
      .then(setPackages)
      .catch(() => setError('Failed to load packages'))
      .finally(() => setLoading(false))
  }

  function openCreate() {
    setForm(emptyForm)
    setComplianceEntries([])
    setEditing(null)
    setShowForm(true)
    setError('')
  }

  function openEdit(pkg) {
    setForm({
      title:         pkg.title ?? '',
      quotaTotal:    pkg.quotaTotal ?? '',
      quotaReserved: pkg.quotaReserved ?? '',
      basePrice:     pkg.basePrice ?? '',
    })
    setComplianceEntries(mapToEntries(pkg.compliance))
    setEditing(pkg.id)
    setShowForm(true)
    setError('')
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    const payload = {
      title:         form.title,
      quotaTotal:    form.quotaTotal    === '' ? null : Number(form.quotaTotal),
      quotaReserved: form.quotaReserved === '' ? null : Number(form.quotaReserved),
      basePrice:     form.basePrice     === '' ? null : Number(form.basePrice),
      compliance:    entriesToMap(complianceEntries),
    }
    try {
      editing ? await updateHajjPackage(editing, payload) : await createHajjPackage(payload)
      setShowForm(false)
      load()
    } catch {
      setError('Save failed. Title is required.')
    }
  }

  async function handleDelete(id) {
    if (!confirm('Delete this package?')) return
    try { await deleteHajjPackage(id); load() }
    catch { setError('Delete failed.') }
  }

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  const quotaUsed = pkg =>
    pkg.quotaTotal > 0
      ? Math.round(((pkg.quotaReserved ?? 0) / pkg.quotaTotal) * 100)
      : 0

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Hajj Packages</h1>
        <button onClick={openCreate}
          className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700">
          + New Package
        </button>
      </div>

      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

      {/* Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg p-6 overflow-y-auto max-h-[90vh]">
            <h2 className="text-lg font-semibold mb-4">
              {editing ? 'Edit Hajj Package' : 'New Hajj Package'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-3">

              <Field label="Title *" value={form.title} onChange={set('title')} required />

              <div className="grid grid-cols-3 gap-3">
                <Field label="Total Quota" value={form.quotaTotal} onChange={set('quotaTotal')} type="number" min="0" />
                <Field label="Reserved"    value={form.quotaReserved} onChange={set('quotaReserved')} type="number" min="0" />
                <Field label="Base Price (PKR)" value={form.basePrice} onChange={set('basePrice')} type="number" min="0" step="0.01" />
              </div>

              <div className="border border-gray-200 rounded-md p-3 bg-gray-50">
                <ComplianceEditor entries={complianceEntries} onChange={setComplianceEntries} />
              </div>

              {error && <p className="text-sm text-red-600">{error}</p>}

              <div className="flex gap-2 pt-2">
                <button type="submit"
                  className="flex-1 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700">
                  {editing ? 'Update' : 'Create'}
                </button>
                <button type="button" onClick={() => setShowForm(false)}
                  className="flex-1 py-2 border text-sm rounded-md hover:bg-gray-50">
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
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {['Title', 'Quota', 'Price', 'Compliance', ''].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {packages.length === 0 && (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">No packages found</td></tr>
              )}
              {packages.map(pkg => (
                <tr key={pkg.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{pkg.title}</td>
                  <td className="px-4 py-3">
                    {pkg.quotaTotal ? (
                      <div className="space-y-1">
                        <div className="text-xs text-gray-600">
                          {pkg.quotaReserved ?? 0} / {pkg.quotaTotal} seats
                        </div>
                        <div className="w-24 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-blue-500 rounded-full"
                            style={{ width: `${quotaUsed(pkg)}%` }}
                          />
                        </div>
                      </div>
                    ) : <span className="text-gray-400">—</span>}
                  </td>
                  <td className="px-4 py-3 text-gray-700">
                    {pkg.basePrice ? `PKR ${Number(pkg.basePrice).toLocaleString()}` : '—'}
                  </td>
                  <td className="px-4 py-3">
                    {pkg.compliance && Object.keys(pkg.compliance).length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {Object.entries(pkg.compliance).map(([k, v]) => (
                          <span key={k} className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-green-50 text-green-700 text-xs">
                            <span className="font-medium">{k}:</span> {String(v)}
                          </span>
                        ))}
                      </div>
                    ) : <span className="text-gray-400 text-xs">—</span>}
                  </td>
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
