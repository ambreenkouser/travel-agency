import { useEffect, useState } from 'react'
import { getHotels, createHotel, updateHotel, deleteHotel } from '../../api/hotels'

const STARS = [1, 2, 3, 4, 5]

const emptyForm = { name: '', city: '', starRating: '', description: '' }

export default function HotelsManagementPage() {
  const [hotels, setHotels]     = useState([])
  const [form, setForm]         = useState(emptyForm)
  const [editing, setEditing]   = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [filterCity, setFilterCity] = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(true)
  const [saving, setSaving]     = useState(false)

  useEffect(() => { load() }, [])

  function load() {
    setLoading(true)
    getHotels()
      .then(setHotels)
      .catch(() => setError('Failed to load hotels'))
      .finally(() => setLoading(false))
  }

  function openCreate() {
    setForm(emptyForm); setEditing(null); setShowForm(true); setError('')
  }

  function openEdit(h) {
    setForm({
      name:        h.name        ?? '',
      city:        h.city        ?? '',
      starRating:  h.starRating  ?? '',
      description: h.description ?? '',
    })
    setEditing(h.id); setShowForm(true); setError('')
  }

  function cancel() {
    setShowForm(false); setEditing(null); setForm(emptyForm); setError('')
  }

  async function handleSubmit(e) {
    e.preventDefault(); setError(''); setSaving(true)
    const payload = {
      ...form,
      starRating: form.starRating === '' ? null : Number(form.starRating),
    }
    try {
      editing ? await updateHotel(editing, payload) : await createHotel(payload)
      cancel(); load()
    } catch (err) {
      setError(err?.response?.data?.message ?? err?.message ?? 'Save failed. Please check all fields.')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id) {
    if (!confirm('Delete this hotel?')) return
    try { await deleteHotel(id); load() }
    catch { setError('Delete failed.') }
  }

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  const filtered = filterCity
    ? hotels.filter(h => h.city?.toLowerCase().includes(filterCity.toLowerCase()))
    : hotels

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Hotels</h1>
          <p className="text-gray-500 text-sm mt-0.5">Manage hotels available for package add-ons</p>
        </div>
        {!showForm && (
          <button onClick={openCreate}
            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors">
            + New Hotel
          </button>
        )}
      </div>

      {error && !showForm && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex gap-5 items-start">

        {/* ── Inline form panel ── */}
        {showForm && (
          <div className="w-80 shrink-0 bg-white rounded-xl border border-gray-200 shadow-sm">
            <div className="px-5 py-4 border-b border-gray-100">
              <h2 className="text-base font-semibold text-gray-800">
                {editing ? 'Edit Hotel' : 'New Hotel'}
              </h2>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">

              <label className="block text-sm">
                <span className="block text-gray-600 mb-1 font-medium">Hotel Name <span className="text-red-500">*</span></span>
                <input value={form.name} onChange={set('name')} required
                  placeholder="e.g. Makkah Clock Tower"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </label>

              <label className="block text-sm">
                <span className="block text-gray-600 mb-1 font-medium">City <span className="text-red-500">*</span></span>
                <input value={form.city} onChange={set('city')} required
                  placeholder="e.g. Makkah"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </label>

              <label className="block text-sm">
                <span className="block text-gray-600 mb-1 font-medium">Star Rating</span>
                <select value={form.starRating} onChange={set('starRating')}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">— None —</option>
                  {STARS.map(s => <option key={s} value={s}>{s} Star{s > 1 ? 's' : ''}</option>)}
                </select>
              </label>

              <label className="block text-sm">
                <span className="block text-gray-600 mb-1 font-medium">Description</span>
                <textarea value={form.description} onChange={set('description')} rows={3}
                  placeholder="Optional notes about this hotel…"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
              </label>

              {error && <p className="text-sm text-red-600">{error}</p>}

              <div className="flex gap-2 pt-1">
                <button type="submit" disabled={saving}
                  className="flex-1 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors">
                  {saving ? 'Saving…' : editing ? 'Update' : 'Create'}
                </button>
                <button type="button" onClick={cancel}
                  className="flex-1 py-2 border border-gray-300 text-sm rounded-lg hover:bg-gray-50 transition-colors">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ── Table ── */}
        <div className="flex-1 min-w-0 space-y-3">
          {/* City filter */}
          <input
            value={filterCity} onChange={e => setFilterCity(e.target.value)}
            placeholder="Filter by city…"
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-56 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          {loading ? (
            <p className="text-sm text-gray-500 py-4">Loading…</p>
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    {['Name', 'City', 'Stars', 'Description', ''].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filtered.length === 0 && (
                    <tr><td colSpan={5} className="px-4 py-10 text-center text-gray-400">
                      {hotels.length === 0 ? 'No hotels yet. Click + New Hotel to add one.' : 'No hotels match your filter.'}
                    </td></tr>
                  )}
                  {filtered.map(h => (
                    <tr key={h.id}
                      className={`hover:bg-gray-50 transition-colors ${editing === h.id ? 'bg-blue-50' : ''}`}>
                      <td className="px-4 py-3 font-medium text-gray-900">{h.name}</td>
                      <td className="px-4 py-3 text-gray-600">{h.city}</td>
                      <td className="px-4 py-3 text-yellow-500 text-base">
                        {h.starRating ? '★'.repeat(h.starRating) : <span className="text-gray-300 text-sm">—</span>}
                      </td>
                      <td className="px-4 py-3 text-gray-500 max-w-xs truncate">{h.description || '—'}</td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <button onClick={() => openEdit(h)}
                          className="text-blue-600 hover:underline text-xs mr-3">Edit</button>
                        <button onClick={() => handleDelete(h.id)}
                          className="text-red-500 hover:underline text-xs">Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
