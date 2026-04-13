import { useEffect, useState } from 'react'
import { getHotels, createHotel, updateHotel, deleteHotel } from '../../api/hotels'

const STARS = [1, 2, 3, 4, 5]

const emptyForm = { name: '', city: '', starRating: '', description: '' }

export default function HotelsManagementPage() {
  const [hotels, setHotels]   = useState([])
  const [form, setForm]       = useState(emptyForm)
  const [editing, setEditing] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [filterCity, setFilterCity] = useState('')
  const [error, setError]     = useState('')
  const [loading, setLoading] = useState(true)

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
      name: h.name ?? '',
      city: h.city ?? '',
      starRating: h.starRating ?? '',
      description: h.description ?? '',
    })
    setEditing(h.id); setShowForm(true); setError('')
  }

  async function handleSubmit(e) {
    e.preventDefault(); setError('')
    const payload = {
      ...form,
      starRating: form.starRating === '' ? null : Number(form.starRating),
    }
    try {
      editing ? await updateHotel(editing, payload) : await createHotel(payload)
      setShowForm(false); load()
    } catch (err) { setError(err?.response?.data?.message ?? err?.message ?? 'Save failed. Please check all required fields.') }
  }

  async function handleDelete(id) {
    if (!confirm('Delete this hotel?')) return
    try { await deleteHotel(id); load() }
    catch { setError('Delete failed.') }
  }

  function set(k) { return e => setForm(f => ({ ...f, [k]: e.target.value })) }

  const filtered = filterCity
    ? hotels.filter(h => h.city?.toLowerCase().includes(filterCity.toLowerCase()))
    : hotels

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Hotels</h1>
        <button onClick={openCreate} className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700">
          + New Hotel
        </button>
      </div>

      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

      {/* Filter */}
      <div className="mb-4">
        <input
          value={filterCity}
          onChange={e => setFilterCity(e.target.value)}
          placeholder="Filter by city…"
          className="border border-gray-300 rounded-md px-3 py-1.5 text-sm w-56 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>

      {/* Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
            <h2 className="text-lg font-semibold mb-4">{editing ? 'Edit Hotel' : 'New Hotel'}</h2>
            <form onSubmit={handleSubmit} className="space-y-3">
              <Field label="Hotel Name *" value={form.name} onChange={set('name')} required />
              <div className="grid grid-cols-2 gap-3">
                <Field label="City *" value={form.city} onChange={set('city')} required />
                <label className="block text-sm">
                  <span className="block text-gray-600 mb-1">Star Rating</span>
                  <select value={form.starRating} onChange={set('starRating')}
                    className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500">
                    <option value="">— None —</option>
                    {STARS.map(s => <option key={s} value={s}>{s} Star{s > 1 ? 's' : ''}</option>)}
                  </select>
                </label>
              </div>
              <label className="block text-sm">
                <span className="block text-gray-600 mb-1">Description</span>
                <textarea value={form.description} onChange={set('description')} rows={3}
                  className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" />
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
      {loading ? <p className="text-sm text-gray-500">Loading…</p> : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-x-auto">
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
                <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">No hotels found</td></tr>
              )}
              {filtered.map(h => (
                <tr key={h.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{h.name}</td>
                  <td className="px-4 py-3 text-gray-600">{h.city}</td>
                  <td className="px-4 py-3 text-yellow-500">
                    {h.starRating ? '★'.repeat(h.starRating) : <span className="text-gray-300">—</span>}
                  </td>
                  <td className="px-4 py-3 text-gray-500 max-w-xs truncate">{h.description || '—'}</td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    <button onClick={() => openEdit(h)} className="text-blue-600 hover:underline mr-3 text-xs">Edit</button>
                    <button onClick={() => handleDelete(h.id)} className="text-red-500 hover:underline text-xs">Delete</button>
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

function Field({ label, value, onChange, required }) {
  return (
    <label className="block text-sm">
      <span className="block text-gray-600 mb-1">{label}</span>
      <input value={value} onChange={onChange} required={required}
        className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" />
    </label>
  )
}
