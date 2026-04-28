import { useEffect, useState } from 'react'
import {
  getPackageTypeDefs, createPackageTypeDef,
  updatePackageTypeDef, deletePackageTypeDef,
} from '../../api/packageTypeDefs'
import { getAgencies } from '../../api/agencies'

const EMPTY = { name: '', description: '', icon: '📦', active: true, grantedAgencyIds: [] }

export default function PackageTypeDefsPage() {
  const [types, setTypes]       = useState([])
  const [agencies, setAgencies] = useState([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState('')

  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing]     = useState(null)
  const [form, setForm]           = useState(EMPTY)
  const [saving, setSaving]       = useState(false)
  const [formError, setFormError] = useState('')

  useEffect(() => {
    load()
    getAgencies().then(setAgencies).catch(() => {})
  }, [])

  function load() {
    setLoading(true)
    getPackageTypeDefs()
      .then(setTypes)
      .catch(() => setError('Failed to load package types.'))
      .finally(() => setLoading(false))
  }

  function openCreate() {
    setEditing(null)
    setForm(EMPTY)
    setFormError('')
    setShowModal(true)
  }

  function openEdit(t) {
    setEditing(t)
    setForm({
      name:             t.name,
      description:      t.description ?? '',
      icon:             t.icon ?? '📦',
      active:           t.active,
      grantedAgencyIds: t.grantedAgencyIds ?? [],
    })
    setFormError('')
    setShowModal(true)
  }

  async function handleSave(e) {
    e.preventDefault()
    setFormError('')
    if (!form.name.trim()) { setFormError('Name is required.'); return }
    setSaving(true)
    try {
      if (editing) {
        await updatePackageTypeDef(editing.id, form)
      } else {
        await createPackageTypeDef(form)
      }
      setShowModal(false)
      load()
    } catch (err) {
      setFormError(err?.response?.data?.message ?? 'Failed to save.')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id) {
    if (!confirm('Delete this package type? All packages of this type will lose the type link.')) return
    try {
      await deletePackageTypeDef(id)
      load()
    } catch {
      setError('Failed to delete.')
    }
  }

  function toggleAgency(agencyId) {
    setForm(f => {
      const has = f.grantedAgencyIds.includes(agencyId)
      return {
        ...f,
        grantedAgencyIds: has
          ? f.grantedAgencyIds.filter(id => id !== agencyId)
          : [...f.grantedAgencyIds, agencyId],
      }
    })
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Package Type Definitions</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Create reusable package types (UAE Package, UK Visa, etc.) and assign them to agencies.
          </p>
        </div>
        <button
          onClick={openCreate}
          className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700"
        >
          + New Type
        </button>
      </div>

      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

      {loading ? (
        <p className="text-sm text-gray-500">Loading…</p>
      ) : types.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-10 text-center">
          <p className="text-3xl mb-2">📦</p>
          <p className="text-gray-600 font-medium">No package types yet</p>
          <p className="text-sm text-gray-400 mt-1">Create a type like "UAE Package" or "UK Visa" and assign it to agencies.</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {['Icon', 'Name', 'Slug', 'Description', 'Assigned to', 'Status', ''].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {types.map(t => {
                const grantedNames = (t.grantedAgencyIds ?? [])
                  .map(id => agencies.find(a => a.id === id)?.name ?? `Agency #${id}`)
                return (
                  <tr key={t.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-xl">{t.icon}</td>
                    <td className="px-4 py-3 font-semibold text-gray-800">{t.name}</td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-400">{t.slug}</td>
                    <td className="px-4 py-3 text-gray-500 max-w-xs truncate">{t.description ?? '—'}</td>
                    <td className="px-4 py-3">
                      {grantedNames.length === 0 ? (
                        <span className="text-xs text-gray-400 italic">None</span>
                      ) : (
                        <div className="flex flex-wrap gap-1">
                          {grantedNames.map((n, i) => (
                            <span key={i} className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">{n}</span>
                          ))}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                        t.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                      }`}>
                        {t.active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <button onClick={() => openEdit(t)} className="text-xs text-blue-600 hover:underline mr-3">Edit</button>
                      <button onClick={() => handleDelete(t.id)} className="text-xs text-red-500 hover:underline">Delete</button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">{editing ? 'Edit Package Type' : 'New Package Type'}</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 text-xl font-bold">×</button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-4 gap-3">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Icon</label>
                  <input
                    value={form.icon}
                    onChange={e => setForm(f => ({ ...f, icon: e.target.value }))}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-center text-xl focus:outline-none focus:ring-1 focus:ring-blue-500"
                    maxLength={4}
                  />
                </div>
                <div className="col-span-3">
                  <label className="block text-sm text-gray-600 mb-1">Name *</label>
                  <input
                    required value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="e.g. UAE Package, UK Visa"
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-600 mb-1">Description</label>
                <input
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Short description (optional)"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox" id="active"
                  checked={form.active}
                  onChange={e => setForm(f => ({ ...f, active: e.target.checked }))}
                  className="rounded"
                />
                <label htmlFor="active" className="text-sm text-gray-700">Active (visible to agencies)</label>
              </div>

              {/* Assign to agencies */}
              <div>
                <label className="block text-sm text-gray-600 mb-1">Assign to agencies</label>
                {agencies.length === 0 ? (
                  <p className="text-xs text-gray-400">No agencies found.</p>
                ) : (
                  <div className="border border-gray-200 rounded-md p-3 max-h-44 overflow-y-auto space-y-1.5">
                    {agencies.map(a => (
                      <label key={a.id} className="flex items-center gap-2 text-sm cursor-pointer">
                        <input
                          type="checkbox"
                          checked={form.grantedAgencyIds.includes(a.id)}
                          onChange={() => toggleAgency(a.id)}
                          className="rounded"
                        />
                        <span className="font-medium text-gray-800">{a.name}</span>
                        <span className="text-xs text-gray-400">{a.slug}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              {formError && <p className="text-sm text-red-600">{formError}</p>}

              <div className="flex gap-2 pt-1">
                <button type="submit" disabled={saving}
                  className="flex-1 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 disabled:opacity-60">
                  {saving ? 'Saving…' : editing ? 'Save Changes' : 'Create Type'}
                </button>
                <button type="button" onClick={() => setShowModal(false)}
                  className="flex-1 py-2 border text-sm rounded-md hover:bg-gray-50">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
