import { useEffect, useState } from 'react'
import {
  getHajjPackages, createHajjPackage, updateHajjPackage,
  deleteHajjPackage, getHajjShares,
} from '../../api/hajj'
import { getAgencies } from '../../api/agencies'
import { useAuth } from '../../context/AuthContext'
import PackageAddonsEditor, { defaultAddons, addonsFromServer } from '../../components/ui/PackageAddonsEditor'

const EMPTY = {
  title: '', quotaTotal: '', quotaReserved: '',
  basePrice: '', priceChild: '', priceInfant: '',
  packageClass: 'economy', status: 'active',
  contactPersonPhone: '', contactPersonEmail: '',
  costAdult: '', costChild: '', costInfant: '',
}

function mapToEntries(obj) {
  if (!obj || typeof obj !== 'object') return []
  return Object.entries(obj).map(([key, value]) => ({ key, value: String(value) }))
}
function entriesToMap(entries) {
  const r = {}
  entries.forEach(({ key, value }) => { if (key.trim()) r[key.trim()] = value })
  return r
}

function Field({ label, children }) {
  return (
    <label className="block text-sm">
      <span className="block text-gray-600 mb-1">{label}</span>
      {children}
    </label>
  )
}
function Input({ value, onChange, type = 'text', ...rest }) {
  return (
    <input type={type} value={value} onChange={onChange} {...rest}
      className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" />
  )
}

function ComplianceEditor({ entries, onChange }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-600">Compliance Fields</span>
        <button type="button" onClick={() => onChange([...entries, { key: '', value: '' }])}
          className="text-xs text-blue-600 hover:underline">+ Add field</button>
      </div>
      {entries.length === 0 && <p className="text-xs text-gray-400 italic">No compliance fields added.</p>}
      {entries.map((entry, i) => (
        <div key={i} className="flex gap-2 items-center">
          <input value={entry.key}
            onChange={e => onChange(entries.map((en, idx) => idx === i ? { ...en, key: e.target.value } : en))}
            placeholder="key" className="flex-1 border border-gray-300 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500" />
          <span className="text-gray-400">:</span>
          <input value={entry.value}
            onChange={e => onChange(entries.map((en, idx) => idx === i ? { ...en, value: e.target.value } : en))}
            placeholder="value" className="flex-1 border border-gray-300 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500" />
          <button type="button" onClick={() => onChange(entries.filter((_, idx) => idx !== i))}
            className="text-red-400 hover:text-red-600 text-xs font-bold">✕</button>
        </div>
      ))}
    </div>
  )
}

export default function HajjManagementPage() {
  const { user } = useAuth()
  const isSuperAdmin = user?.authorities?.includes('ROLE_super_admin') ?? false

  const [packages, setPackages] = useState([])
  const [agencies, setAgencies] = useState([])
  const [form, setForm]         = useState(EMPTY)
  const [addons, setAddons]     = useState(defaultAddons())
  const [complianceEntries, setComplianceEntries] = useState([])
  const [sharedWith, setSharedWith] = useState([])
  const [editing, setEditing]   = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(true)
  const [detailPkg, setDetailPkg] = useState(null)

  useEffect(() => {
    load()
    if (isSuperAdmin) getAgencies().then(setAgencies).catch(() => {})
  }, [])

  function load() {
    setLoading(true)
    getHajjPackages().then(setPackages).catch(() => setError('Failed to load packages')).finally(() => setLoading(false))
  }

  function openCreate() {
    setForm(EMPTY)
    setAddons(defaultAddons())
    setComplianceEntries([])
    setSharedWith([])
    setEditing(null)
    setShowForm(true)
    setError('')
    setTimeout(() => document.getElementById('hajj-form-top')?.scrollIntoView({ behavior: 'smooth' }), 50)
  }

  async function openEdit(pkg) {
    setForm({
      title:              pkg.title         ?? '',
      quotaTotal:         pkg.quotaTotal    ?? '',
      quotaReserved:      pkg.quotaReserved ?? '',
      basePrice:          pkg.basePrice     ?? '',
      priceChild:         pkg.priceChild    ?? '',
      priceInfant:        pkg.priceInfant   ?? '',
      packageClass:       pkg.packageClass  ?? 'economy',
      status:             pkg.status        ?? 'active',
      contactPersonPhone: pkg.contactPersonPhone ?? '',
      contactPersonEmail: pkg.contactPersonEmail ?? '',
      costAdult:          pkg.costAdult     ?? '',
      costChild:          pkg.costChild     ?? '',
      costInfant:         pkg.costInfant    ?? '',
    })
    setAddons(addonsFromServer(pkg.extras))
    setComplianceEntries(mapToEntries(pkg.compliance))
    if (isSuperAdmin) {
      const shares = await getHajjShares(pkg.id).catch(() => [])
      setSharedWith(shares)
    } else {
      setSharedWith([])
    }
    setEditing(pkg.id)
    setShowForm(true)
    setError('')
    setTimeout(() => document.getElementById('hajj-form-top')?.scrollIntoView({ behavior: 'smooth' }), 50)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    const n = k => form[k] === '' ? null : Number(form[k])
    const payload = {
      title:              form.title,
      quotaTotal:         n('quotaTotal'),
      quotaReserved:      n('quotaReserved'),
      basePrice:          n('basePrice'),
      priceChild:         n('priceChild'),
      priceInfant:        n('priceInfant'),
      packageClass:       form.packageClass,
      contactPersonPhone: form.contactPersonPhone || null,
      contactPersonEmail: form.contactPersonEmail || null,
      costAdult:          n('costAdult'),
      costChild:          n('costChild'),
      costInfant:         n('costInfant'),
      compliance:         entriesToMap(complianceEntries),
      extras:             addons,
      sharedWith:         isSuperAdmin ? sharedWith : [],
    }
    try {
      editing ? await updateHajjPackage(editing, payload) : await createHajjPackage(payload)
      setShowForm(false)
      load()
    } catch {
      setError('Save failed. Title is required.')
    }
  }

  async function handleDelete(id) {
    if (!confirm('Delete this package?')) return
    try { await deleteHajjPackage(id); load() }
    catch { setError('Delete failed.') }
  }

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))
  function toggleAgency(id) {
    setSharedWith(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }
  const quotaUsed = pkg => pkg.quotaTotal > 0 ? Math.round(((pkg.quotaReserved ?? 0) / pkg.quotaTotal) * 100) : 0

  return (
    <div id="hajj-form-top">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Hajj Packages</h1>
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
              {editing ? 'Edit Hajj Package' : 'New Hajj Package'}
            </h2>
            <button type="button" onClick={() => setShowForm(false)}
              className="text-gray-400 hover:text-gray-600 text-xl font-bold leading-none">×</button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Title */}
            <Field label="Title *">
              <Input value={form.title} onChange={set('title')} required placeholder="e.g. Hajj Package 2025" />
            </Field>

            {/* Quota + Prices */}
            <div className="grid grid-cols-2 gap-3">
              <Field label="Total Quota">
                <Input value={form.quotaTotal} onChange={set('quotaTotal')} type="number" min="0" placeholder="e.g. 50" />
              </Field>
              <Field label="Reserved">
                <Input value={form.quotaReserved} onChange={set('quotaReserved')} type="number" min="0" placeholder="0" />
              </Field>
            </div>

            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Selling Prices (PKR)</p>
            <div className="grid grid-cols-3 gap-3">
              <Field label="Adult Price">
                <Input value={form.basePrice} onChange={set('basePrice')} type="number" min="0" step="0.01" placeholder="0.00" />
              </Field>
              <Field label="Child Price">
                <Input value={form.priceChild} onChange={set('priceChild')} type="number" min="0" step="0.01" placeholder="same as adult" />
              </Field>
              <Field label="Infant Price">
                <Input value={form.priceInfant} onChange={set('priceInfant')} type="number" min="0" step="0.01" placeholder="same as adult" />
              </Field>
            </div>

            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Cost Prices (Buying)</p>
            <div className="grid grid-cols-3 gap-3">
              <Field label="Cost Adult">
                <Input value={form.costAdult} onChange={set('costAdult')} type="number" min="0" step="0.01" placeholder="0.00" />
              </Field>
              <Field label="Cost Child">
                <Input value={form.costChild} onChange={set('costChild')} type="number" min="0" step="0.01" placeholder="0.00" />
              </Field>
              <Field label="Cost Infant">
                <Input value={form.costInfant} onChange={set('costInfant')} type="number" min="0" step="0.01" placeholder="0.00" />
              </Field>
            </div>

            {/* Class + Status */}
            <div className="grid grid-cols-2 gap-3">
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
                <Input value={form.contactPersonPhone} onChange={set('contactPersonPhone')} placeholder="+92 3xx xxxxxxx" />
              </Field>
              <Field label="Contact Person Email">
                <Input value={form.contactPersonEmail} onChange={set('contactPersonEmail')} type="email" placeholder="contact@agency.com" />
              </Field>
            </div>

            {/* Compliance */}
            <div className="border border-gray-200 rounded-md p-3 bg-gray-50">
              <ComplianceEditor entries={complianceEntries} onChange={setComplianceEntries} />
            </div>

            {/* Extras / Add-ons */}
            <PackageAddonsEditor addons={addons} onChange={setAddons} />

            {/* Agency shares — super_admin only */}
            {isSuperAdmin && agencies.length > 0 && (
              <div className="border border-indigo-200 rounded-lg p-3 bg-indigo-50">
                <p className="text-xs font-medium text-indigo-700 mb-2">Share with agencies</p>
                <div className="grid grid-cols-2 gap-1 max-h-32 overflow-y-auto">
                  {agencies.map(a => (
                    <label key={a.id} className="flex items-center gap-2 text-xs cursor-pointer">
                      <input type="checkbox" checked={sharedWith.includes(a.id)}
                        onChange={() => toggleAgency(a.id)} className="rounded" />
                      <span className="text-gray-700 truncate">{a.name}</span>
                    </label>
                  ))}
                </div>
                {sharedWith.length > 0 && (
                  <p className="text-xs text-indigo-600 mt-1">{sharedWith.length} agenc{sharedWith.length === 1 ? 'y' : 'ies'} selected</p>
                )}
              </div>
            )}

            {error && <p className="text-sm text-red-600">{error}</p>}

            <div className="flex gap-2 pt-1">
              <button type="submit"
                className="flex-1 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700">
                {editing ? 'Update Package' : 'Create Package'}
              </button>
              <button type="button" onClick={() => setShowForm(false)}
                className="flex-1 py-2 border text-sm rounded-md hover:bg-gray-50">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── Detail Slide-in ── */}
      {detailPkg && (
        <div className="fixed inset-0 z-40">
          <div className="absolute inset-0 bg-black/20" onClick={() => setDetailPkg(null)} />
          <div className="absolute top-0 right-0 h-full w-96 bg-white shadow-2xl overflow-y-auto z-50 p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-gray-900">{detailPkg.title}</h2>
              <button onClick={() => setDetailPkg(null)} className="text-gray-400 hover:text-gray-600 text-xl font-bold">×</button>
            </div>

            <div className="space-y-3 text-sm">
              <Section title="Pricing">
                <DRow label="Adult (Sell)">{detailPkg.basePrice != null ? `PKR ${Number(detailPkg.basePrice).toLocaleString()}` : '—'}</DRow>
                <DRow label="Child (Sell)">{detailPkg.priceChild != null ? `PKR ${Number(detailPkg.priceChild).toLocaleString()}` : '—'}</DRow>
                <DRow label="Infant (Sell)">{detailPkg.priceInfant != null ? `PKR ${Number(detailPkg.priceInfant).toLocaleString()}` : '—'}</DRow>
                <DRow label="Adult (Cost)">{detailPkg.costAdult != null ? `PKR ${Number(detailPkg.costAdult).toLocaleString()}` : '—'}</DRow>
                <DRow label="Child (Cost)">{detailPkg.costChild != null ? `PKR ${Number(detailPkg.costChild).toLocaleString()}` : '—'}</DRow>
                <DRow label="Infant (Cost)">{detailPkg.costInfant != null ? `PKR ${Number(detailPkg.costInfant).toLocaleString()}` : '—'}</DRow>
              </Section>

              <Section title="Details">
                <DRow label="Class">{detailPkg.packageClass ?? '—'}</DRow>
                <DRow label="Status">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    detailPkg.status === 'active' ? 'bg-green-100 text-green-700' :
                    detailPkg.status === 'draft'  ? 'bg-gray-100 text-gray-600' : 'bg-red-100 text-red-700'
                  }`}>{detailPkg.status}</span>
                </DRow>
                {detailPkg.quotaTotal > 0 && <>
                  <DRow label="Quota">{detailPkg.quotaReserved ?? 0} / {detailPkg.quotaTotal}</DRow>
                  <DRow label="Available">{Math.max(0, detailPkg.quotaTotal - (detailPkg.quotaReserved ?? 0))}</DRow>
                </>}
              </Section>

              {(detailPkg.contactPersonPhone || detailPkg.contactPersonEmail) && (
                <Section title="Contact">
                  {detailPkg.contactPersonPhone && <DRow label="Phone">{detailPkg.contactPersonPhone}</DRow>}
                  {detailPkg.contactPersonEmail && <DRow label="Email">{detailPkg.contactPersonEmail}</DRow>}
                </Section>
              )}

              {detailPkg.compliance && Object.keys(detailPkg.compliance).length > 0 && (
                <Section title="Compliance">
                  {Object.entries(detailPkg.compliance).map(([k, v]) => (
                    <DRow key={k} label={k}>{String(v)}</DRow>
                  ))}
                </Section>
              )}
            </div>

            <div className="mt-5 flex gap-2">
              <button onClick={() => { setDetailPkg(null); openEdit(detailPkg) }}
                className="flex-1 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700">Edit</button>
              <button onClick={() => setDetailPkg(null)}
                className="flex-1 py-1.5 text-sm border rounded hover:bg-gray-50">Close</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Table ── */}
      {loading ? (
        <p className="text-sm text-gray-500">Loading...</p>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {['Title', 'Class', 'Quota', 'Sell Price', 'Status', ''].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {packages.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">No packages found</td></tr>
              )}
              {packages.map(pkg => (
                <tr key={pkg.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => setDetailPkg(pkg)}>
                  <td className="px-4 py-3 font-medium text-gray-900">{pkg.title}</td>
                  <td className="px-4 py-3 text-gray-600 capitalize">{pkg.packageClass ?? 'economy'}</td>
                  <td className="px-4 py-3">
                    {pkg.quotaTotal ? (
                      <div className="space-y-1">
                        <div className="text-xs text-gray-600">{pkg.quotaReserved ?? 0} / {pkg.quotaTotal}</div>
                        <div className="w-20 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                          <div className="h-full bg-blue-500 rounded-full" style={{ width: `${quotaUsed(pkg)}%` }} />
                        </div>
                      </div>
                    ) : <span className="text-gray-400">—</span>}
                  </td>
                  <td className="px-4 py-3 text-gray-700">
                    {pkg.basePrice ? `PKR ${Number(pkg.basePrice).toLocaleString()}` : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                      pkg.status === 'active'   ? 'bg-green-100 text-green-700' :
                      pkg.status === 'draft'    ? 'bg-gray-100 text-gray-600' : 'bg-red-100 text-red-700'
                    }`}>{pkg.status ?? 'draft'}</span>
                  </td>
                  <td className="px-4 py-3 text-right whitespace-nowrap" onClick={e => e.stopPropagation()}>
                    <button onClick={() => openEdit(pkg)} className="text-blue-600 hover:underline text-xs mr-3">Edit</button>
                    <button onClick={() => handleDelete(pkg.id)} className="text-red-500 hover:underline text-xs">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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

function Section({ title, children }) {
  return (
    <div>
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">{title}</p>
      <div className="space-y-1">{children}</div>
    </div>
  )
}

function DRow({ label, children }) {
  return (
    <div className="flex justify-between gap-4 text-sm">
      <span className="text-gray-500 shrink-0">{label}</span>
      <span className="text-gray-800 font-medium text-right">{children}</span>
    </div>
  )
}
