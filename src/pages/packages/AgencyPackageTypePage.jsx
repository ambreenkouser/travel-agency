import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import {
  getCustomPackagesByType, createCustomPackage,
  updateCustomPackage, deleteCustomPackage,
  getCustomUserGrants, updateCustomUserGrants,
} from '../../api/customPackages'
import { getPackageTypeDef } from '../../api/packageTypeDefs'
import { getUsers } from '../../api/users'
import { useAuth } from '../../context/AuthContext'
import PackageAddonsEditor, { defaultAddons, addonsFromServer } from '../../components/ui/PackageAddonsEditor'

const STATUS_OPTIONS = ['draft', 'active', 'inactive']
const CLASS_OPTIONS  = ['economy', 'business', 'first']

const EMPTY_FORM = {
  title: '', description: '',
  basePrice: '', priceChild: '', priceInfant: '',
  costAdult: '', costChild: '', costInfant: '',
  packageClass: 'economy', status: 'draft',
  contactPersonPhone: '', contactPersonEmail: '',
  assignedUserIds: [],
}

export default function AgencyPackageTypePage() {
  const { typeDefId } = useParams()
  const { user } = useAuth()

  const [typeDef, setTypeDef]     = useState(null)
  const [packages, setPackages]   = useState([])
  const [subAgents, setSubAgents] = useState([])
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState('')

  const [showForm, setShowForm]   = useState(false)
  const [editing, setEditing]     = useState(null)
  const [form, setForm]           = useState(EMPTY_FORM)
  const [addons, setAddons]       = useState(defaultAddons())
  const [saving, setSaving]       = useState(false)
  const [formError, setFormError] = useState('')

  useEffect(() => {
    Promise.all([
      getPackageTypeDef(typeDefId),
      loadPackages(),
      getUsers().then(all => {
        const myId = user?.id
        setSubAgents(all.filter(u => u.id !== myId &&
          (u.authorities ?? []).some(a => a === 'ROLE_sub_agent')))
      }).catch(() => {}),
    ]).then(([td]) => setTypeDef(td))
      .catch(() => setError('Failed to load.'))
      .finally(() => setLoading(false))
  }, [typeDefId])

  async function loadPackages() {
    const data = await getCustomPackagesByType(typeDefId)
    setPackages(data)
  }

  function openCreate() {
    setEditing(null)
    setForm({ ...EMPTY_FORM, assignedUserIds: [] })
    setAddons(defaultAddons())
    setFormError('')
    setShowForm(true)
  }

  async function openEdit(pkg) {
    setEditing(pkg)
    let userGrants = []
    try { userGrants = await getCustomUserGrants(pkg.id) } catch {}
    setForm({
      title:              pkg.title              ?? '',
      description:        pkg.description        ?? '',
      basePrice:          pkg.basePrice          ?? '',
      priceChild:         pkg.priceChild         ?? '',
      priceInfant:        pkg.priceInfant        ?? '',
      costAdult:          pkg.costAdult          ?? '',
      costChild:          pkg.costChild          ?? '',
      costInfant:         pkg.costInfant         ?? '',
      packageClass:       pkg.packageClass       ?? 'economy',
      status:             pkg.status             ?? 'draft',
      contactPersonPhone: pkg.contactPersonPhone ?? '',
      contactPersonEmail: pkg.contactPersonEmail ?? '',
      assignedUserIds:    userGrants,
    })
    setAddons(addonsFromServer(pkg.extras))
    setFormError('')
    setShowForm(true)
  }

  function cancel() {
    setShowForm(false); setEditing(null); setForm(EMPTY_FORM)
    setAddons(defaultAddons()); setFormError('')
  }

  async function handleSave(e) {
    e.preventDefault()
    setFormError('')
    if (!form.title.trim()) { setFormError('Title is required.'); return }
    setSaving(true)
    try {
      const payload = {
        typeDefId:          Number(typeDefId),
        packageType:        typeDef?.name ?? '',
        title:              form.title,
        description:        form.description || null,
        basePrice:          form.basePrice   ? Number(form.basePrice)   : null,
        priceChild:         form.priceChild  ? Number(form.priceChild)  : null,
        priceInfant:        form.priceInfant ? Number(form.priceInfant) : null,
        costAdult:          form.costAdult   ? Number(form.costAdult)   : null,
        costChild:          form.costChild   ? Number(form.costChild)   : null,
        costInfant:         form.costInfant  ? Number(form.costInfant)  : null,
        packageClass:       form.packageClass || 'economy',
        status:             form.status,
        contactPersonPhone: form.contactPersonPhone || null,
        contactPersonEmail: form.contactPersonEmail || null,
        extras:             addons,
        quotaTotal:         null,
        quotaReserved:      0,
        attributes:         null,
        assignedUserIds:    form.assignedUserIds,
      }
      editing
        ? await updateCustomPackage(editing.id, payload)
        : await createCustomPackage(payload)
      cancel(); await loadPackages()
    } catch (err) {
      setFormError(err?.response?.data?.message ?? 'Failed to save.')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id) {
    if (!confirm('Delete this package?')) return
    try { await deleteCustomPackage(id); await loadPackages() }
    catch { setError('Failed to delete.') }
  }

  function set(k) { return e => setForm(f => ({ ...f, [k]: e.target.value })) }
  function toggleUser(userId) {
    setForm(f => {
      const has = f.assignedUserIds.includes(userId)
      return { ...f, assignedUserIds: has ? f.assignedUserIds.filter(id => id !== userId) : [...f.assignedUserIds, userId] }
    })
  }

  if (loading) return <p className="text-sm text-gray-500 py-10 text-center">Loading…</p>

  return (
    <div className="space-y-4">

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-2xl">{typeDef?.icon ?? '📦'}</span>
            <h1 className="text-2xl font-bold text-gray-900">{typeDef?.name ?? 'Packages'}</h1>
          </div>
          {typeDef?.description && (
            <p className="text-sm text-gray-500 mt-0.5">{typeDef.description}</p>
          )}
        </div>
        {!showForm && (
          <button onClick={openCreate}
            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors">
            + New Package
          </button>
        )}
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {/* ── Inline form ── */}
      {showForm && (
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <h2 className="text-base font-semibold text-gray-800">
              {editing ? `Edit — ${editing.title}` : `New ${typeDef?.name ?? 'Package'}`}
            </h2>
            <button type="button" onClick={cancel}
              className="text-gray-400 hover:text-gray-600 text-2xl font-light leading-none">×</button>
          </div>

          <form onSubmit={handleSave} className="p-6 space-y-5">

            {/* Title + Description */}
            <div className="grid grid-cols-1 gap-4">
              <Field label="Title *" value={form.title} onChange={set('title')} required />
              <label className="block text-sm">
                <span className="block text-gray-600 mb-1 font-medium">Description</span>
                <textarea value={form.description} onChange={set('description')} rows={2}
                  placeholder="Optional description…"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
              </label>
            </div>

            {/* Selling prices */}
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Selling Prices (PKR)</p>
              <div className="grid grid-cols-3 gap-3">
                <Field label="Adult *" value={form.basePrice}  onChange={set('basePrice')}  type="number" min="0" step="0.01" placeholder="0.00" />
                <Field label="Child"   value={form.priceChild}  onChange={set('priceChild')}  type="number" min="0" step="0.01" placeholder="0.00" />
                <Field label="Infant"  value={form.priceInfant} onChange={set('priceInfant')} type="number" min="0" step="0.01" placeholder="0.00" />
              </div>
            </div>

            {/* Cost prices */}
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Cost Prices / Buying (PKR)</p>
              <div className="grid grid-cols-3 gap-3">
                <Field label="Adult"  value={form.costAdult}  onChange={set('costAdult')}  type="number" min="0" step="0.01" placeholder="0.00" />
                <Field label="Child"  value={form.costChild}  onChange={set('costChild')}  type="number" min="0" step="0.01" placeholder="0.00" />
                <Field label="Infant" value={form.costInfant} onChange={set('costInfant')} type="number" min="0" step="0.01" placeholder="0.00" />
              </div>
            </div>

            {/* Class + Status */}
            <div className="grid grid-cols-2 gap-3">
              <label className="block text-sm">
                <span className="block text-gray-600 mb-1 font-medium">Class</span>
                <select value={form.packageClass} onChange={set('packageClass')}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  {CLASS_OPTIONS.map(c => (
                    <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
                  ))}
                </select>
              </label>
              <label className="block text-sm">
                <span className="block text-gray-600 mb-1 font-medium">Status</span>
                <select value={form.status} onChange={set('status')}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  {STATUS_OPTIONS.map(s => (
                    <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                  ))}
                </select>
              </label>
            </div>

            {/* Contact person */}
            <div className="grid grid-cols-2 gap-3">
              <Field label="Contact Phone" value={form.contactPersonPhone} onChange={set('contactPersonPhone')} placeholder="+92 300 0000000" />
              <Field label="Contact Email" value={form.contactPersonEmail} onChange={set('contactPersonEmail')} placeholder="contact@agency.com" />
            </div>

            {/* Add-ons */}
            <PackageAddonsEditor addons={addons} onChange={setAddons} />

            {/* Sub-agent visibility */}
            <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                Visible to sub-agents
                <span className="ml-1 text-gray-400 normal-case font-normal">(leave all unchecked = all agents)</span>
              </p>
              {subAgents.length === 0 ? (
                <p className="text-xs text-gray-400 italic">No sub-agents in your agency.</p>
              ) : (
                <div className="grid grid-cols-2 gap-1.5 max-h-36 overflow-y-auto">
                  {subAgents.map(u => (
                    <label key={u.id} className="flex items-center gap-2 text-sm cursor-pointer">
                      <input type="checkbox"
                        checked={form.assignedUserIds.includes(u.id)}
                        onChange={() => toggleUser(u.id)}
                        className="rounded" />
                      <span className="text-gray-800 truncate">{u.firstName} {u.lastName}</span>
                    </label>
                  ))}
                </div>
              )}
              {form.assignedUserIds.length === 0 && (
                <p className="text-xs text-green-600 mt-1.5">All sub-agents will see this package.</p>
              )}
            </div>

            {formError && <p className="text-sm text-red-600">{formError}</p>}

            <div className="flex gap-2 pt-1">
              <button type="submit" disabled={saving}
                className="px-6 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors">
                {saving ? 'Saving…' : editing ? 'Update Package' : 'Create Package'}
              </button>
              <button type="button" onClick={cancel}
                className="px-6 py-2 border border-gray-300 text-sm rounded-lg hover:bg-gray-50 transition-colors">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── Table ── */}
      {packages.length === 0 && !showForm ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <p className="text-4xl mb-3">{typeDef?.icon ?? '📦'}</p>
          <p className="text-gray-600 font-medium">No packages yet</p>
          <p className="text-sm text-gray-400 mt-1 mb-4">Create your first {typeDef?.name} package.</p>
          <button onClick={openCreate}
            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700">
            + New Package
          </button>
        </div>
      ) : packages.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {['Title', 'Sell (Adult)', 'Child / Infant', 'Cost (Adult)', 'Class', 'Visibility', 'Status', ''].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {packages.map(p => (
                <tr key={p.id} className={`hover:bg-gray-50 transition-colors ${editing?.id === p.id ? 'bg-blue-50' : ''}`}>
                  <td className="px-4 py-3 font-medium text-gray-800">
                    {p.title}
                    {p.description && (
                      <div className="text-xs text-gray-400 mt-0.5 truncate max-w-[200px]">{p.description}</div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-700">
                    {p.basePrice != null ? `PKR ${Number(p.basePrice).toLocaleString()}` : '—'}
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">
                    <div>{p.priceChild  != null ? `PKR ${Number(p.priceChild).toLocaleString()}`  : '—'}</div>
                    <div>{p.priceInfant != null ? `PKR ${Number(p.priceInfant).toLocaleString()}` : '—'}</div>
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">
                    {p.costAdult != null ? `PKR ${Number(p.costAdult).toLocaleString()}` : '—'}
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs capitalize">
                    {p.packageClass ?? '—'}
                  </td>
                  <td className="px-4 py-3">
                    {p.visibleToAll ? (
                      <span className="text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full">All agents</span>
                    ) : (
                      <span className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                        {(p.assignedUserIds ?? []).length} specific
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={p.status} />
                  </td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    <button onClick={() => openEdit(p)} className="text-xs text-blue-600 hover:underline mr-3">Edit</button>
                    <button onClick={() => handleDelete(p.id)} className="text-xs text-red-500 hover:underline">Delete</button>
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

function Field({ label, value, onChange, type = 'text', required, min, step, placeholder }) {
  return (
    <label className="block text-sm">
      <span className="block text-gray-600 mb-1 font-medium">{label}</span>
      <input type={type} value={value} onChange={onChange} required={required}
        min={min} step={step} placeholder={placeholder}
        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
    </label>
  )
}

function StatusBadge({ status }) {
  const cls = {
    active:   'bg-green-100 text-green-700',
    draft:    'bg-gray-100 text-gray-500',
    inactive: 'bg-red-100 text-red-700',
  }[status] ?? 'bg-gray-100 text-gray-600'
  return (
    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${cls}`}>
      {status}
    </span>
  )
}
