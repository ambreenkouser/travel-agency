import { useEffect, useState } from 'react'
import { getAirlines, createAirline, updateAirline, deleteAirline } from '../../api/airlines'

const empty = { code: '', name: '', logoUrl: '' }

export default function AirlinesPage() {
  const [airlines, setAirlines] = useState([])
  const [form, setForm]         = useState(empty)
  const [editing, setEditing]   = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(true)
  const [saving, setSaving]     = useState(false)

  useEffect(() => { load() }, [])

  function load() {
    setLoading(true)
    getAirlines()
      .then(setAirlines)
      .catch(() => setError('Failed to load airlines'))
      .finally(() => setLoading(false))
  }

  function openCreate() {
    setForm(empty); setEditing(null); setShowForm(true); setError('')
  }

  function openEdit(a) {
    setForm({ code: a.code ?? '', name: a.name ?? '', logoUrl: a.logoUrl ?? '' })
    setEditing(a.id); setShowForm(true); setError('')
  }

  function cancel() {
    setShowForm(false); setEditing(null); setForm(empty); setError('')
  }

  async function handleSubmit(e) {
    e.preventDefault(); setError(''); setSaving(true)
    try {
      editing ? await updateAirline(editing, form) : await createAirline(form)
      cancel(); load()
    } catch {
      setError('Save failed. Code must be unique and 2–3 characters.')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id) {
    if (!confirm('Delete this airline?')) return
    try { await deleteAirline(id); load() }
    catch { setError('Delete failed.') }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Airlines</h1>
          <p className="text-gray-500 text-sm mt-0.5">Manage airline records used in flights</p>
        </div>
        {!showForm && (
          <button onClick={openCreate}
            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors">
            + New Airline
          </button>
        )}
      </div>

      {error && !showForm && <p className="text-sm text-red-600">{error}</p>}

      <div className={`flex gap-5 items-start ${showForm ? '' : ''}`}>

        {/* ── Inline form panel ── */}
        {showForm && (
          <div className="w-80 shrink-0 bg-white rounded-xl border border-gray-200 shadow-sm">
            <div className="px-5 py-4 border-b border-gray-100">
              <h2 className="text-base font-semibold text-gray-800">
                {editing ? 'Edit Airline' : 'New Airline'}
              </h2>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">

              <label className="block text-sm">
                <span className="block text-gray-600 mb-1 font-medium">IATA Code <span className="text-red-500">*</span></span>
                <input
                  value={form.code}
                  onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))}
                  maxLength={3} required placeholder="e.g. PK"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-xs text-gray-400 mt-0.5 block">2–3 characters, must be unique</span>
              </label>

              <label className="block text-sm">
                <span className="block text-gray-600 mb-1 font-medium">Airline Name <span className="text-red-500">*</span></span>
                <input
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  required placeholder="e.g. Pakistan International Airlines"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </label>

              <label className="block text-sm">
                <span className="block text-gray-600 mb-1 font-medium">Logo URL</span>
                <input
                  type="url" value={form.logoUrl}
                  onChange={e => setForm(f => ({ ...f, logoUrl: e.target.value }))}
                  placeholder="https://example.com/logo.png"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {form.logoUrl && (
                  <img src={form.logoUrl} alt="preview"
                    className="mt-2 h-10 object-contain rounded border border-gray-200 bg-gray-50 px-2" />
                )}
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
        <div className="flex-1 min-w-0">
          {loading ? (
            <p className="text-sm text-gray-500 py-4">Loading…</p>
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    {['Logo', 'Code', 'Name', ''].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {airlines.length === 0 && (
                    <tr><td colSpan={4} className="px-4 py-10 text-center text-gray-400">No airlines yet. Click + New Airline to add one.</td></tr>
                  )}
                  {airlines.map(a => (
                    <tr key={a.id}
                      className={`hover:bg-gray-50 transition-colors ${editing === a.id ? 'bg-blue-50' : ''}`}>
                      <td className="px-4 py-3 w-20">
                        {a.logoUrl
                          ? <img src={a.logoUrl} alt={a.code} className="h-8 w-16 object-contain" />
                          : <span className="text-gray-300 text-xs">—</span>}
                      </td>
                      <td className="px-4 py-3 font-mono font-semibold text-gray-900">{a.code}</td>
                      <td className="px-4 py-3 text-gray-700">{a.name}</td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <button onClick={() => openEdit(a)}
                          className="text-blue-600 hover:underline text-xs mr-3">Edit</button>
                        <button onClick={() => handleDelete(a.id)}
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
