import { useEffect, useState } from 'react'
import { getMyOffers, getSentOffers, createOffer, deactivateOffer } from '../../api/offers'
import { getUsers } from '../../api/users'
import { useAuth } from '../../context/AuthContext'

const TYPE_LABEL = { FIXED: 'PKR', PERCENTAGE: '%' }

export default function OffersPage() {
  const { user } = useAuth()
  const canManage = user?.authorities?.includes('bookings:confirm') ?? false

  const [myOffers,   setMyOffers]   = useState([])
  const [sentOffers, setSentOffers] = useState([])
  const [children,   setChildren]   = useState([])
  const [loading,    setLoading]    = useState(true)
  const [error,      setError]      = useState('')

  // Create modal
  const [showForm, setShowForm]   = useState(false)
  const [form, setForm]           = useState(emptyForm())
  const [formError, setFormError] = useState('')
  const [saving, setSaving]       = useState(false)

  function emptyForm() {
    return { targetUserId: '', title: '', description: '', discountType: 'FIXED', discountValue: '', validFrom: '', validUntil: '' }
  }

  useEffect(() => {
    const promises = [getMyOffers()]
    if (canManage) {
      promises.push(getSentOffers())
      promises.push(getUsers().then(all => all.filter(u => u.parentId === user?.id)))
    }
    Promise.all(promises)
      .then(([mine, sent, kids]) => {
        setMyOffers(mine)
        if (sent)  setSentOffers(sent)
        if (kids)  setChildren(kids)
      })
      .catch(() => setError('Failed to load offers.'))
      .finally(() => setLoading(false))
  }, [canManage, user?.id])

  async function handleCreate(e) {
    e.preventDefault()
    setFormError('')
    if (!form.targetUserId) { setFormError('Please select an agent.'); return }
    if (!form.discountValue || Number(form.discountValue) <= 0) { setFormError('Enter a positive discount value.'); return }
    setSaving(true)
    try {
      await createOffer({
        targetUserId:  Number(form.targetUserId),
        title:         form.title,
        description:   form.description || null,
        discountType:  form.discountType,
        discountValue: Number(form.discountValue),
        validFrom:     form.validFrom || null,
        validUntil:    form.validUntil || null,
      })
      setShowForm(false)
      setForm(emptyForm())
      getSentOffers().then(setSentOffers)
    } catch (err) {
      setFormError(err?.response?.data?.message ?? 'Failed to create offer.')
    } finally {
      setSaving(false)
    }
  }

  async function handleDeactivate(id) {
    try {
      await deactivateOffer(id)
      setSentOffers(prev => prev.map(o => o.id === id ? { ...o, active: false } : o))
    } catch { setError('Failed to deactivate offer.') }
  }

  const isExpired = o => o.validUntil && new Date(o.validUntil) < new Date()

  if (loading) return <p className="text-sm text-gray-500 py-10 text-center">Loading…</p>

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-900">Discount Offers</h1>
        {canManage && children.length > 0 && (
          <button
            onClick={() => { setShowForm(true); setFormError('') }}
            className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700"
          >
            + New Offer
          </button>
        )}
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {/* ── Create Modal ── */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg p-6 overflow-y-auto max-h-[90vh]">
            <h2 className="text-lg font-semibold mb-4">Create Discount Offer</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1">Agent *</label>
                <select required value={form.targetUserId}
                  onChange={e => setForm(f => ({ ...f, targetUserId: e.target.value }))}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500">
                  <option value="">— Select agent —</option>
                  {children.map(c => (
                    <option key={c.id} value={c.id}>{c.firstName} {c.lastName}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Offer Title *</label>
                <input required type="text" value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="e.g. Summer Special Discount"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Description</label>
                <textarea rows={2} value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Optional details about this offer…"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Discount Type *</label>
                  <select value={form.discountType}
                    onChange={e => setForm(f => ({ ...f, discountType: e.target.value }))}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500">
                    <option value="FIXED">Fixed Amount (PKR)</option>
                    <option value="PERCENTAGE">Percentage (%)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">
                    Value * {form.discountType === 'PERCENTAGE' ? '(%)' : '(PKR)'}
                  </label>
                  <input required type="number" min="0.01" step="0.01" value={form.discountValue}
                    onChange={e => setForm(f => ({ ...f, discountValue: e.target.value }))}
                    placeholder={form.discountType === 'PERCENTAGE' ? '0–100' : '0.00'}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Valid From</label>
                  <input type="date" value={form.validFrom}
                    onChange={e => setForm(f => ({ ...f, validFrom: e.target.value }))}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Valid Until</label>
                  <input type="date" value={form.validUntil}
                    onChange={e => setForm(f => ({ ...f, validUntil: e.target.value }))}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" />
                </div>
              </div>
              {formError && <p className="text-sm text-red-600">{formError}</p>}
              <div className="flex gap-2 pt-1">
                <button type="submit" disabled={saving}
                  className="flex-1 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 disabled:opacity-60">
                  {saving ? 'Creating…' : 'Create Offer'}
                </button>
                <button type="button" onClick={() => setShowForm(false)}
                  className="flex-1 py-2 border text-sm rounded-md hover:bg-gray-50">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── My Offers (received) ── */}
      <section>
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">
          My Discount Offers
        </h2>
        {myOffers.length === 0 ? (
          <p className="text-sm text-gray-400">No offers for you yet.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {myOffers.map(o => (
              <OfferCard key={o.id} offer={o} expired={isExpired(o)} />
            ))}
          </div>
        )}
      </section>

      {/* ── Sent Offers (admin only) ── */}
      {canManage && (
        <section>
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">
            Offers Sent by You
          </h2>
          {sentOffers.length === 0 ? (
            <p className="text-sm text-gray-400">No offers created yet.</p>
          ) : (
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    {['Agent', 'Title', 'Discount', 'Valid Until', 'Status', ''].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {sentOffers.map(o => (
                    <tr key={o.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-gray-800 font-medium">{o.targetName ?? `User #${o.targetUserId}`}</td>
                      <td className="px-4 py-3 text-gray-700">{o.title}</td>
                      <td className="px-4 py-3 font-semibold text-green-700">
                        {o.discountType === 'PERCENTAGE'
                          ? `${o.discountValue}%`
                          : `PKR ${Number(o.discountValue).toLocaleString()}`}
                      </td>
                      <td className="px-4 py-3 text-gray-500">
                        {o.validUntil ?? <span className="text-gray-300">—</span>}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge active={o.active} expired={isExpired(o)} />
                      </td>
                      <td className="px-4 py-3 text-right">
                        {o.active && (
                          <button onClick={() => handleDeactivate(o.id)}
                            className="text-xs text-red-500 hover:underline">
                            Deactivate
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}
    </div>
  )
}

function OfferCard({ offer, expired }) {
  const isPerc = offer.discountType === 'PERCENTAGE'
  return (
    <div className={`rounded-xl border p-5 space-y-2 ${
      expired || !offer.active
        ? 'bg-gray-50 border-gray-200 opacity-60'
        : 'bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200'
    }`}>
      <div className="flex items-start justify-between gap-2">
        <span className="text-sm font-semibold text-gray-900">{offer.title}</span>
        <span className={`shrink-0 text-xs font-bold px-2 py-0.5 rounded-full ${
          isPerc ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'
        }`}>
          {isPerc ? `${offer.discountValue}% OFF` : `PKR ${Number(offer.discountValue).toLocaleString()} OFF`}
        </span>
      </div>
      {offer.description && (
        <p className="text-xs text-gray-600">{offer.description}</p>
      )}
      {offer.validUntil && (
        <p className="text-xs text-gray-400">
          Valid until: <span className="font-medium text-gray-600">{offer.validUntil}</span>
          {expired && <span className="ml-1 text-red-500">(Expired)</span>}
        </p>
      )}
    </div>
  )
}

function StatusBadge({ active, expired }) {
  if (!active)  return <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">Inactive</span>
  if (expired)  return <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-600">Expired</span>
  return             <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700">Active</span>
}
