import { useEffect, useState } from 'react'
import { getAllBanks, createBank, updateBank, deleteBank } from '../../api/banks'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import ErrorMessage from '../../components/ui/ErrorMessage'

const BLANK = { name: '', shortName: '', type: 'BANK', active: true, displayOrder: 0 }

export default function BanksPage() {
  const [banks, setBanks] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null) // null | 'create' | bank object (edit)
  const [form, setForm] = useState(BLANK)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => { load() }, [])

  function load() {
    setLoading(true)
    getAllBanks().then(setBanks).catch(() => setError('Failed to load banks.')).finally(() => setLoading(false))
  }

  function openCreate() {
    setForm(BLANK)
    setError('')
    setModal('create')
  }

  function openEdit(bank) {
    setForm({ name: bank.name, shortName: bank.shortName ?? '', type: bank.type, active: bank.active, displayOrder: bank.displayOrder })
    setError('')
    setModal(bank)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSaving(true)
    try {
      const payload = { ...form, displayOrder: Number(form.displayOrder) }
      if (modal === 'create') {
        await createBank(payload)
      } else {
        await updateBank(modal.id, payload)
      }
      setModal(null)
      load()
    } catch (err) {
      setError(err?.response?.data?.message ?? 'Failed to save bank.')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(bank) {
    if (!confirm(`Delete "${bank.name}"?`)) return
    try {
      await deleteBank(bank.id)
      load()
    } catch {
      setError('Failed to delete bank.')
    }
  }

  const typeBadge = (type) => {
    const styles = {
      BANK:    'bg-blue-100 text-blue-700',
      FINTECH: 'bg-purple-100 text-purple-700',
      EMI:     'bg-green-100 text-green-700',
    }
    return <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${styles[type] ?? 'bg-gray-100 text-gray-600'}`}>{type}</span>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-900">Banks & Fintech</h1>
        <Button variant="primary" onClick={openCreate}>+ Add Bank</Button>
      </div>

      <ErrorMessage message={error} />

      <Card className="p-0 overflow-hidden">
        {loading ? (
          <p className="p-6 text-sm text-gray-400">Loading...</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Name</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Short</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Type</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Order</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Status</th>
                <th className="px-4 py-3 text-right font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {banks.map(b => (
                <tr key={b.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-800">{b.name}</td>
                  <td className="px-4 py-3 text-gray-500">{b.shortName}</td>
                  <td className="px-4 py-3">{typeBadge(b.type)}</td>
                  <td className="px-4 py-3 text-gray-500">{b.displayOrder}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${b.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {b.active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right space-x-2">
                    <button onClick={() => openEdit(b)} className="text-xs text-blue-600 hover:underline">Edit</button>
                    <button onClick={() => handleDelete(b)} className="text-xs text-red-500 hover:underline">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-base font-semibold text-gray-800 mb-5">
              {modal === 'create' ? 'Add Bank / Fintech' : `Edit: ${modal.name}`}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Name *</label>
                <input required type="text" value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Short Name</label>
                  <input type="text" value={form.shortName}
                    onChange={e => setForm(f => ({ ...f, shortName: e.target.value }))}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Display Order</label>
                  <input type="number" min="0" value={form.displayOrder}
                    onChange={e => setForm(f => ({ ...f, displayOrder: e.target.value }))}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Type</label>
                  <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="BANK">Bank</option>
                    <option value="FINTECH">Fintech</option>
                    <option value="EMI">EMI</option>
                  </select>
                </div>
                <div className="flex items-end pb-1">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={form.active}
                      onChange={e => setForm(f => ({ ...f, active: e.target.checked }))}
                      className="w-4 h-4 text-blue-600" />
                    <span className="text-sm text-gray-700">Active</span>
                  </label>
                </div>
              </div>
              <ErrorMessage message={error} />
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="secondary" onClick={() => setModal(null)}>Cancel</Button>
                <Button type="submit" variant="primary" disabled={saving}>{saving ? 'Saving...' : 'Save'}</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
