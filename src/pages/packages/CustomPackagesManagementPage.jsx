import { useEffect, useState } from 'react'
import {
  getCustomPackages, createCustomPackage, updateCustomPackage,
  deleteCustomPackage, getCustomShares,
} from '../../api/customPackages'
import { getAgencies } from '../../api/agencies'
import PackageAddonsEditor, { defaultAddons, addonsFromServer } from '../../components/ui/PackageAddonsEditor'

const EMPTY = {
  packageType: '', title: '', description: '',
  basePrice: '', priceChild: '', priceInfant: '',
  quotaTotal: '', quotaReserved: '0',
  status: 'draft',
  packageClass: 'economy',
  contactPersonPhone: '', contactPersonEmail: '',
  costAdult: '', costChild: '', costInfant: '',
}

function Field({ label, children }) {
  return (
    <label className="block text-sm">
      <span className="block text-gray-600 mb-1">{label}</span>
      {children}
    </label>
  )
}
function Inp({ value, onChange, type = 'text', ...rest }) {
  return (
    <input type={type} value={value} onChange={onChange} {...rest}
      className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" />
  )
}

export default function CustomPackagesManagementPage() {
  const [packages, setPackages] = useState([])
  const [agencies, setAgencies] = useState([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState('')

  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing]   = useState(null)
  const [form, setForm]         = useState(EMPTY)
  const [addons, setAddons]     = useState(defaultAddons())
  const [attrEntries, setAttrEntries] = useState([])
  const [sharedWith, setSharedWith]   = useState([])
  const [saving, setSaving]     = useState(false)
  const [formError, setFormError] = useState('')

  useEffect(() => {
    load()
    getAgencies().then(setAgencies).catch(() => {})
  }, [])

  function load() {
    setLoading(true)
    getCustomPackages().then(setPackages).catch(() => setError('Failed to load packages.')).finally(() => setLoading(false))
  }

  function openCreate() {
    setEditing(null)
    setForm(EMPTY)
    setAddons(defaultAddons())
    setAttrEntries([])
    setSharedWith([])
    setFormError('')
    setShowForm(true)
    setTimeout(() => document.getElementById('custom-form-top')?.scrollIntoView({ behavior: 'smooth' }), 50)
  }

  async function openEdit(pkg) {
    setEditing(pkg)
    let shares = []
    try { shares = await getCustomShares(pkg.id) } catch {}
    setForm({
      packageType:        pkg.packageType        ?? '',
      title:              pkg.title              ?? '',
      description:        pkg.description        ?? '',
      basePrice:          pkg.basePrice          ?? '',
      priceChild:         pkg.priceChild         ?? '',
      priceInfant:        pkg.priceInfant        ?? '',
      quotaTotal:         pkg.quotaTotal         ?? '',
      quotaReserved:      pkg.quotaReserved      ?? 0,
      status:             pkg.status             ?? 'draft',
      packageClass:       pkg.packageClass       ?? 'economy',
      contactPersonPhone: pkg.contactPersonPhone ?? '',
      contactPersonEmail: pkg.contactPersonEmail ?? '',
      costAdult:          pkg.costAdult          ?? '',
      costChild:          pkg.costChild          ?? '',
      costInfant:         pkg.costInfant         ?? '',
    })
    setAddons(addonsFromServer(pkg.extras))
    setAttrEntries(pkg.attributes ? Object.entries(pkg.attributes).map(([k, v]) => ({ k, v: String(v) })) : [])
    setSharedWith(shares)
    setFormError('')
    setShowForm(true)
    setTimeout(() => document.getElementById('custom-form-top')?.scrollIntoView({ behavior: 'smooth' }), 50)
  }

  async function handleSave(e) {
    e.preventDefault()
    setFormError('')
    if (!form.packageType.trim()) { setFormError('Package type is required.'); return }
    if (!form.title.trim())       { setFormError('Title is required.'); return }
    setSaving(true)
    const n = k => form[k] === '' || form[k] == null ? null : Number(form[k])
    try {
      const payload = {
        packageType:        form.packageType,
        title:              form.title,
        description:        form.description || null,
        basePrice:          n('basePrice'),
        priceChild:         n('priceChild'),
        priceInfant:        n('priceInfant'),
        quotaTotal:         n('quotaTotal'),
        quotaReserved:      Number(form.quotaReserved ?? 0),
        status:             form.status,
        packageClass:       form.packageClass,
        contactPersonPhone: form.contactPersonPhone || null,
        contactPersonEmail: form.contactPersonEmail || null,
        costAdult:          n('costAdult'),
        costChild:          n('costChild'),
        costInfant:         n('costInfant'),
        attributes:         attrEntries.length
          ? Object.fromEntries(attrEntries.map(({ k, v }) => [k, v]))
          : null,
        extras:             addons,
        sharedWith,
        assignedUserIds:    null,
      }
      editing ? await updateCustomPackage(editing.id, payload) : await createCustomPackage(payload)
      setShowForm(false)
      load()
    } catch (err) {
      setFormError(err?.response?.data?.message ?? 'Failed to save package.')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id) {
    if (!confirm('Delete this package?')) return
    try { await deleteCustomPackage(id); load() }
    catch { setError('Failed to delete package.') }
  }

  function addAttr() {
    const key = prompt('Attribute key:')
    if (!key?.trim()) return
    const val = prompt('Value:') ?? ''
    setAttrEntries(prev => [...prev, { k: key.trim(), v: val }])
  }

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))
  function toggleShare(id) {
    setSharedWith(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  const grouped = packages.reduce((acc, p) => {
    const t = p.packageType || 'Other'
    if (!acc[t]) acc[t] = []
    acc[t].push(p)
    return acc
  }, {})

  return (
    <div id="custom-form-top">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Custom Packages</h1>
        {!showForm && (
          <button onClick={openCreate}
            className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700">
            + New Package
          </button>
        )}
      </div>

      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

      {/* ── Inline Form ── */}
      {showForm && (
        <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-800">
              {editing ? 'Edit Package' : 'New Custom Package'}
            </h2>
            <button type="button" onClick={() => setShowForm(false)}
              className="text-gray-400 hover:text-gray-600 text-xl font-bold leading-none">×</button>
          </div>

          <form onSubmit={handleSave} className="space-y-5">
            {/* Type + Title */}
            <div className="grid grid-cols-2 gap-3">
              <Field label="Package Type *">
                <Inp required value={form.packageType} onChange={set('packageType')} placeholder="e.g. UAE Package" />
              </Field>
              <Field label="Title *">
                <Inp required value={form.title} onChange={set('title')} placeholder="Package title" />
              </Field>
            </div>

            {/* Description */}
            <Field label="Description">
              <textarea rows={2} value={form.description} onChange={set('description')}
                placeholder="Optional description…"
                className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none" />
            </Field>

            {/* Selling Prices */}
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Selling Prices (PKR)</p>
            <div className="grid grid-cols-3 gap-3">
              <Field label="Adult Price">
                <Inp type="number" min="0" step="0.01" value={form.basePrice} onChange={set('basePrice')} placeholder="0.00" />
              </Field>
              <Field label="Child Price">
                <Inp type="number" min="0" step="0.01" value={form.priceChild} onChange={set('priceChild')} placeholder="same as adult" />
              </Field>
              <Field label="Infant Price">
                <Inp type="number" min="0" step="0.01" value={form.priceInfant} onChange={set('priceInfant')} placeholder="same as adult" />
              </Field>
            </div>

            {/* Cost Prices */}
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Cost Prices (Buying)</p>
            <div className="grid grid-cols-3 gap-3">
              <Field label="Cost Adult">
                <Inp type="number" min="0" step="0.01" value={form.costAdult} onChange={set('costAdult')} placeholder="0.00" />
              </Field>
              <Field label="Cost Child">
                <Inp type="number" min="0" step="0.01" value={form.costChild} onChange={set('costChild')} placeholder="0.00" />
              </Field>
              <Field label="Cost Infant">
                <Inp type="number" min="0" step="0.01" value={form.costInfant} onChange={set('costInfant')} placeholder="0.00" />
              </Field>
            </div>

            {/* Quota + Class + Status */}
            <div className="grid grid-cols-3 gap-3">
              <Field label="Quota (blank = unlimited)">
                <Inp type="number" min="0" value={form.quotaTotal} onChange={set('quotaTotal')} placeholder="Unlimited" />
              </Field>
              <Field label="Class">
                <select value={form.packageClass} onChange={set('packageClass')}
                  className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500">
                  <option value="economy">Economy</option>
                  <option value="business">Business</option>
                </select>
              </Field>
              <Field label="Status">
                <select value={form.status} onChange={set('status')}
                  className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500">
                  <option value="draft">Draft</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </Field>
            </div>

            {/* Contact Person */}
            <div className="grid grid-cols-2 gap-3">
              <Field label="Contact Person Phone">
                <Inp value={form.contactPersonPhone} onChange={set('contactPersonPhone')} placeholder="+92 3xx xxxxxxx" />
              </Field>
              <Field label="Contact Person Email">
                <Inp type="email" value={form.contactPersonEmail} onChange={set('contactPersonEmail')} placeholder="contact@agency.com" />
              </Field>
            </div>

            {/* Attributes (key-value) */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">Attributes (key-value)</span>
                <button type="button" onClick={addAttr}
                  className="text-xs text-blue-600 hover:underline">+ Add attribute</button>
              </div>
              {attrEntries.length > 0 && (
                <div className="space-y-1 mb-2">
                  {attrEntries.map((a, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm">
                      <span className="font-mono bg-gray-100 px-2 py-0.5 rounded text-xs">{a.k}</span>
                      <span className="text-gray-500">=</span>
                      <span className="text-gray-700">{a.v}</span>
                      <button type="button"
                        onClick={() => setAttrEntries(prev => prev.filter((_, idx) => idx !== i))}
                        className="ml-auto text-red-400 hover:text-red-600 text-xs">Remove</button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Extras / Add-ons */}
            <PackageAddonsEditor addons={addons} onChange={setAddons} />

            {/* Agency shares */}
            {agencies.length > 0 && (
              <div>
                <label className="block text-sm text-gray-600 mb-1">Share with agencies</label>
                <div className="border border-gray-200 rounded-md p-3 max-h-36 overflow-y-auto space-y-1">
                  {agencies.map(a => (
                    <label key={a.id} className="flex items-center gap-2 text-sm cursor-pointer">
                      <input type="checkbox" checked={sharedWith.includes(a.id)}
                        onChange={() => toggleShare(a.id)} className="rounded" />
                      <span className="text-gray-700">{a.name}</span>
                      <span className="text-xs text-gray-400">{a.slug}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {formError && <p className="text-sm text-red-600">{formError}</p>}

            <div className="flex gap-2 pt-1">
              <button type="submit" disabled={saving}
                className="flex-1 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 disabled:opacity-60">
                {saving ? 'Saving…' : editing ? 'Save Changes' : 'Create Package'}
              </button>
              <button type="button" onClick={() => setShowForm(false)}
                className="flex-1 py-2 border text-sm rounded-md hover:bg-gray-50">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── Package Table ── */}
      {loading ? (
        <p className="text-sm text-gray-500">Loading…</p>
      ) : packages.length === 0 ? (
        <p className="text-sm text-gray-500">No custom packages yet. Create one to get started.</p>
      ) : (
        Object.entries(grouped).map(([type, pkgs]) => (
          <div key={type} className="mb-8">
            <h2 className="text-base font-semibold text-gray-700 mb-3 pb-1 border-b border-gray-200">{type}</h2>
            <div className="bg-white rounded-lg border border-gray-200 overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    {['Title', 'Adult (Sell)', 'Adult (Cost)', 'Class', 'Quota', 'Status', ''].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {pkgs.map(p => (
                    <tr key={p.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-800">
                        {p.title}
                        {p.description && <div className="text-xs text-gray-400 mt-0.5 truncate max-w-xs">{p.description}</div>}
                      </td>
                      <td className="px-4 py-3 text-gray-700">
                        {p.basePrice != null ? `PKR ${Number(p.basePrice).toLocaleString()}` : '—'}
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs">
                        {p.costAdult != null ? `PKR ${Number(p.costAdult).toLocaleString()}` : '—'}
                      </td>
                      <td className="px-4 py-3 text-gray-600 capitalize">{p.packageClass ?? 'economy'}</td>
                      <td className="px-4 py-3 text-gray-500 text-xs">
                        {p.quotaTotal != null ? `${p.quotaReserved ?? 0} / ${p.quotaTotal}` : '∞'}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                          p.status === 'active' ? 'bg-green-100 text-green-700' :
                          p.status === 'draft'  ? 'bg-gray-100 text-gray-600' : 'bg-red-100 text-red-700'
                        }`}>{p.status}</span>
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
          </div>
        ))
      )}

      {showForm && (
        <div className="mt-4">
          <button onClick={openCreate}
            className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700">
            + New Package
          </button>
        </div>
      )}
    </div>
  )
}
