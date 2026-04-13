import { useEffect, useState } from 'react'
import { getRoutes, createRoute, updateRoute, deleteRoute } from '../../api/routes'

const empty = { origin: '', destination: '', durationMins: '', distanceKm: '', routeType: 'ONE_WAY' }

export default function RoutesPage() {
  const [routes, setRoutes]       = useState([])
  const [filterType, setFilterType] = useState('')
  const [form, setForm]           = useState(empty)
  const [editing, setEditing]     = useState(null)
  const [showForm, setShowForm]   = useState(false)
  const [error, setError]         = useState('')
  const [loading, setLoading]     = useState(true)

  useEffect(() => { load() }, [])

  function load() {
    setLoading(true)
    getRoutes()
      .then(setRoutes)
      .catch(() => setError('Failed to load routes'))
      .finally(() => setLoading(false))
  }

  function openCreate() {
    setForm(empty); setEditing(null); setShowForm(true); setError('')
  }

  function openEdit(r) {
    setForm({
      origin: r.origin ?? '',
      destination: r.destination ?? '',
      durationMins: r.durationMins ?? '',
      distanceKm: r.distanceKm ?? '',
      routeType: r.routeType ?? 'ONE_WAY',
    })
    setEditing(r.id); setShowForm(true); setError('')
  }

  async function handleSubmit(e) {
    e.preventDefault(); setError('')
    const payload = {
      ...form,
      durationMins: form.durationMins === '' ? null : Number(form.durationMins),
      distanceKm:   form.distanceKm   === '' ? null : Number(form.distanceKm),
    }
    try {
      editing ? await updateRoute(editing, payload) : await createRoute(payload)
      setShowForm(false); load()
    } catch {
      setError('Save failed.')
    }
  }

  async function handleDelete(id) {
    if (!confirm('Delete this route?')) return
    try { await deleteRoute(id); load() }
    catch { setError('Delete failed.') }
  }

  function fmtDuration(mins) {
    if (!mins) return '—'
    const h = Math.floor(mins / 60)
    const m = mins % 60
    return h > 0 ? `${h}h ${m}m` : `${m}m`
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <h1 className="text-xl font-semibold text-gray-900">Routes</h1>
        <div className="flex items-center gap-3">
          <select
            value={filterType}
            onChange={e => setFilterType(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="">All types</option>
            <option value="ONE_WAY">One Way</option>
            <option value="ROUND_TRIP">Round Trip</option>
          </select>
          <button onClick={openCreate} className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700">
            + New Route
          </button>
        </div>
      </div>

      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-sm p-6">
            <h2 className="text-lg font-semibold mb-4">{editing ? 'Edit Route' : 'New Route'}</h2>
            <form onSubmit={handleSubmit} className="space-y-3">
              {[
                { key: 'origin',       label: 'Origin *',          req: true },
                { key: 'destination',  label: 'Destination *',     req: true },
                { key: 'durationMins', label: 'Duration (minutes)', req: false, type: 'number' },
                { key: 'distanceKm',   label: 'Distance (km)',      req: false, type: 'number' },
              ].map(f => (
                <label key={f.key} className="block text-sm">
                  <span className="block text-gray-600 mb-1">{f.label}</span>
                  <input
                    type={f.type ?? 'text'}
                    value={form[f.key]}
                    onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                    required={f.req}
                    className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </label>
              ))}

              <label className="block text-sm">
                <span className="block text-gray-600 mb-1">Route Type</span>
                <select
                  value={form.routeType}
                  onChange={e => setForm(p => ({ ...p, routeType: e.target.value }))}
                  className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="ONE_WAY">One Way</option>
                  <option value="ROUND_TRIP">Round Trip (2× fare)</option>
                </select>
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

      {loading ? (
        <p className="text-sm text-gray-500">Loading...</p>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {['Origin', 'Destination', 'Type', 'Duration', 'Distance', ''].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {routes.filter(r => !filterType || r.routeType === filterType).length === 0 && (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">No routes found</td></tr>
              )}
              {routes.filter(r => !filterType || r.routeType === filterType).map(r => (
                <tr key={r.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{r.origin}</td>
                  <td className="px-4 py-3 text-gray-700">{r.destination}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                      r.routeType === 'ROUND_TRIP'
                        ? 'bg-indigo-100 text-indigo-700'
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {r.routeType === 'ROUND_TRIP' ? 'Round Trip' : 'One Way'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{fmtDuration(r.durationMins)}</td>
                  <td className="px-4 py-3 text-gray-500">{r.distanceKm ? `${r.distanceKm} km` : '—'}</td>
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
