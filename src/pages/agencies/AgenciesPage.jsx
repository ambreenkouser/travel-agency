import { useEffect, useState } from 'react'
import { getAgencies, createAgency, updateAgency, deleteAgency } from '../../api/agencies'

const PLANS = [
  { value: 'weekly',  label: 'Weekly  (+7 days)' },
  { value: 'monthly', label: 'Monthly (+1 month)' },
  { value: 'yearly',  label: 'Yearly  (+1 year)'  },
]

const empty = { name: '', slug: '', subscriptionPlan: 'monthly', expiresAt: '', graceDays: '', active: true, bookingExpiryMinutes: 60 }

export default function AgenciesPage() {
  const [agencies, setAgencies] = useState([])
  const [form, setForm]         = useState(empty)
  const [editing, setEditing]   = useState(null) // id or null
  const [showForm, setShowForm] = useState(false)
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(true)

  useEffect(() => { load() }, [])

  function load() {
    setLoading(true)
    getAgencies()
      .then(setAgencies)
      .catch(() => setError('Failed to load agencies'))
      .finally(() => setLoading(false))
  }

  function openCreate() {
    setForm(empty)
    setEditing(null)
    setShowForm(true)
    setError('')
  }

  function openEdit(a) {
    setForm({
      name: a.name ?? '',
      slug: a.slug ?? '',
      subscriptionPlan: a.subscriptionPlan ?? '',
      expiresAt: a.expiresAt ?? '',
      graceDays: a.graceDays ?? '',
      active: a.active ?? true,
      bookingExpiryMinutes: a.bookingExpiryMinutes ?? 60,
    })
    setEditing(a.id)
    setShowForm(true)
    setError('')
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    const payload = {
      ...form,
      graceDays: form.graceDays === '' ? null : Number(form.graceDays),
      expiresAt: form.expiresAt || null,
      bookingExpiryMinutes: form.bookingExpiryMinutes === '' ? 60 : Number(form.bookingExpiryMinutes),
    }
    try {
      if (editing) {
        await updateAgency(editing, payload)
      } else {
        await createAgency(payload)
      }
      setShowForm(false)
      load()
    } catch {
      setError('Save failed. Check all required fields.')
    }
  }

  async function handleDelete(id) {
    if (!confirm('Delete this agency?')) return
    try {
      await deleteAgency(id)
      load()
    } catch {
      setError('Delete failed.')
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Agencies</h1>
        <button
          onClick={openCreate}
          className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700"
        >
          + New Agency
        </button>
      </div>

      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

      {/* Modal form */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
            <h2 className="text-lg font-semibold mb-4">{editing ? 'Edit Agency' : 'New Agency'}</h2>
            <form onSubmit={handleSubmit} className="space-y-3">
              <Field label="Name *" value={form.name} onChange={v => setForm(f => ({ ...f, name: v }))} required />
              <Field label="Slug *" value={form.slug} onChange={v => setForm(f => ({ ...f, slug: v }))} required />
              <label className="block text-sm">
                <span className="block text-gray-600 mb-1">Subscription Plan *</span>
                <select
                  value={form.subscriptionPlan}
                  onChange={e => setForm(f => ({ ...f, subscriptionPlan: e.target.value }))}
                  className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  {PLANS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                </select>
                <p className="text-xs text-gray-400 mt-1">Expiry is auto-calculated from today when saving. Override below if needed.</p>
              </label>
              <Field label="Expiry Override (optional)" type="date" value={form.expiresAt} onChange={v => setForm(f => ({ ...f, expiresAt: v }))} />
              <Field label="Grace Days" type="number" value={form.graceDays} onChange={v => setForm(f => ({ ...f, graceDays: v }))} />
              <Field label="Booking Expiry (minutes)" type="number" value={form.bookingExpiryMinutes} onChange={v => setForm(f => ({ ...f, bookingExpiryMinutes: v }))} />
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={form.active} onChange={e => setForm(f => ({ ...f, active: e.target.checked }))} />
                Active
              </label>
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
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {['Name', 'Slug', 'Plan', 'Expires', 'Status', ''].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {agencies.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">No agencies found</td></tr>
              )}
              {agencies.map(a => (
                <tr key={a.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{a.name}</td>
                  <td className="px-4 py-3 text-gray-500">{a.slug}</td>
                  <td className="px-4 py-3">
                    {a.subscriptionPlan ? (
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                        a.subscriptionPlan === 'yearly'  ? 'bg-purple-100 text-purple-700' :
                        a.subscriptionPlan === 'monthly' ? 'bg-blue-100 text-blue-700' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>{a.subscriptionPlan}</span>
                    ) : '—'}
                  </td>
                  <td className="px-4 py-3 text-gray-500">{a.expiresAt || '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${a.active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {a.active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => openEdit(a)} className="text-blue-600 hover:underline mr-3 text-xs">Edit</button>
                    <button onClick={() => handleDelete(a.id)} className="text-red-500 hover:underline text-xs">Delete</button>
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

function Field({ label, value, onChange, type = 'text', required }) {
  return (
    <label className="block text-sm">
      <span className="block text-gray-600 mb-1">{label}</span>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        required={required}
        className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
      />
    </label>
  )
}
