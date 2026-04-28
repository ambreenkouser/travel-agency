import { useEffect, useState } from 'react'
import { getRoutes, createRoute, updateRoute, deleteRoute } from '../../api/routes'

const empty = { origin: '', destination: '' }

export default function RoutesPage() {
  const [routes, setRoutes]     = useState([])
  const [form, setForm]         = useState(empty)
  const [editing, setEditing]   = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(true)

  useEffect(() => { load() }, [])

  function load() {
    setLoading(true)
    getRoutes()
      .then(setRoutes)
      .catch(() => setError('Failed to load sectors'))
      .finally(() => setLoading(false))
  }

  function openCreate() {
    setForm(empty); setEditing(null); setShowForm(true); setError('')
  }

  function openEdit(r) {
    setForm({ origin: r.origin ?? '', destination: r.destination ?? '' })
    setEditing(r.id); setShowForm(true); setError('')
  }

  async function handleSubmit(e) {
    e.preventDefault(); setError('')
    try {
      editing ? await updateRoute(editing, form) : await createRoute(form)
      setShowForm(false); load()
    } catch {
      setError('Save failed.')
    }
  }

  async function handleDelete(id) {
    if (!confirm('Delete this sector?')) return
    try { await deleteRoute(id); load() }
    catch { setError('Delete failed.') }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <h1 className="text-xl font-semibold text-gray-900">Sectors</h1>
        <button onClick={openCreate} className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700">
          + New Sector
        </button>
      </div>

      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-sm p-6">
            <h2 className="text-lg font-semibold mb-4">{editing ? 'Edit Sector' : 'New Sector'}</h2>
            <form onSubmit={handleSubmit} className="space-y-3">
              {[
                { key: 'origin',      label: 'From *', req: true },
                { key: 'destination', label: 'To *',   req: true },
              ].map(f => (
                <label key={f.key} className="block text-sm">
                  <span className="block text-gray-600 mb-1">{f.label}</span>
                  <input
                    type="text"
                    value={form[f.key]}
                    onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value.toUpperCase() }))}
                    required={f.req}
                    placeholder="e.g. KHI"
                    className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </label>
              ))}
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

      {loading ? (
        <p className="text-sm text-gray-500">Loading...</p>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {['From', 'To', ''].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {routes.length === 0 && (
                <tr><td colSpan={3} className="px-4 py-8 text-center text-gray-400">No sectors found</td></tr>
              )}
              {routes.map(r => (
                <tr key={r.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{r.origin}</td>
                  <td className="px-4 py-3 text-gray-700">{r.destination}</td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => openEdit(r)} className="text-blue-600 hover:underline mr-3 text-xs">Edit</button>
                    <button onClick={() => handleDelete(r.id)} className="text-red-500 hover:underline text-xs">Delete</button>
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
