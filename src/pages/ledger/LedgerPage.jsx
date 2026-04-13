import { useEffect, useState } from 'react'
import { getLedger, getUserLedger, createAdjustment } from '../../api/ledger'
import { getUsers } from '../../api/users'
import { useAuth } from '../../context/AuthContext'

export default function LedgerPage() {
  const { user } = useAuth()
  const authorities = user?.authorities ?? []
  const canAdjust = authorities.includes('bookings:confirm')

  const [entries, setEntries]   = useState([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState('')

  // Child user selector
  const [children, setChildren]     = useState([])
  const [selectedUser, setSelectedUser] = useState('') // '' = my own

  // Search filter
  const [filter, setFilter] = useState('')

  // Adjustment modal
  const [showAdj, setShowAdj]   = useState(false)
  const [adjForm, setAdjForm]   = useState({ childUserId: '', amount: '', currency: 'PKR', memo: '' })
  const [adjError, setAdjError] = useState('')
  const [adjSaving, setAdjSaving] = useState(false)

  useEffect(() => {
    if (canAdjust) {
      getUsers()
        .then(all => setChildren(all.filter(u => u.parentId === user?.id)))
        .catch(() => {})
    }
  }, [canAdjust, user?.id])

  useEffect(() => { loadEntries() }, [selectedUser])

  function loadEntries() {
    setLoading(true)
    setError('')
    const promise = selectedUser ? getUserLedger(Number(selectedUser)) : getLedger()
    promise
      .then(setEntries)
      .catch(() => setError('Failed to load ledger.'))
      .finally(() => setLoading(false))
  }

  const filtered = entries.filter(e => {
    if (!filter) return true
    const q = filter.toLowerCase()
    return (
      String(e.bookingId ?? '').includes(q) ||
      (e.userName ?? '').toLowerCase().includes(q) ||
      (e.memo ?? '').toLowerCase().includes(q) ||
      e.entryType.toLowerCase().includes(q)
    )
  })

  const totalDebit  = filtered.filter(e => e.entryType === 'DEBIT') .reduce((s, e) => s + Number(e.amount), 0)
  const totalCredit = filtered.filter(e => e.entryType !== 'DEBIT').reduce((s, e) => s + Number(e.amount), 0)
  const balance     = totalDebit - totalCredit

  async function handleAdjustment(ev) {
    ev.preventDefault()
    setAdjError('')
    if (!adjForm.childUserId) { setAdjError('Please select a sub-agent.'); return }
    if (!adjForm.amount || Number(adjForm.amount) <= 0) { setAdjError('Enter a positive amount.'); return }
    setAdjSaving(true)
    try {
      await createAdjustment({
        childUserId: Number(adjForm.childUserId),
        amount:      Number(adjForm.amount),
        currency:    adjForm.currency || 'PKR',
        memo:        adjForm.memo,
      })
      setShowAdj(false)
      setAdjForm({ childUserId: '', amount: '', currency: 'PKR', memo: '' })
      loadEntries()
    } catch (e) {
      setAdjError(e?.response?.data?.message ?? 'Failed to create adjustment.')
    } finally {
      setAdjSaving(false)
    }
  }

  const selectedChild = children.find(c => String(c.id) === selectedUser)

  return (
    <div>
      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h1 className="text-xl font-semibold text-gray-900">
          Ledger
          {selectedChild && (
            <span className="ml-2 text-base font-normal text-gray-500">
              — {selectedChild.firstName} {selectedChild.lastName}
            </span>
          )}
        </h1>
        <div className="flex gap-2 flex-wrap items-center">
          {canAdjust && children.length > 0 && (
            <select
              value={selectedUser}
              onChange={e => setSelectedUser(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">My Account</option>
              {children.map(c => (
                <option key={c.id} value={c.id}>
                  {c.firstName} {c.lastName}
                </option>
              ))}
            </select>
          )}
          <input
            value={filter}
            onChange={e => setFilter(e.target.value)}
            placeholder="Search booking, memo…"
            className="border border-gray-300 rounded-md px-3 py-1.5 text-sm w-52 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          {canAdjust && children.length > 0 && (
            <button
              onClick={() => { setShowAdj(true); setAdjError('') }}
              className="px-4 py-1.5 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700"
            >
              + Adjustment
            </button>
          )}
        </div>
      </div>

      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

      {/* ── Adjustment Modal ── */}
      {showAdj && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
            <h2 className="text-lg font-semibold mb-1">Credit Adjustment</h2>
            <p className="text-sm text-gray-500 mb-4">
              Credits the agent's account (reduces what they owe you).
            </p>
            <form onSubmit={handleAdjustment} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1">Sub-agent *</label>
                <select
                  required value={adjForm.childUserId}
                  onChange={e => setAdjForm(f => ({ ...f, childUserId: e.target.value }))}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="">— Select agent —</option>
                  {children.map(c => (
                    <option key={c.id} value={c.id}>{c.firstName} {c.lastName}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-2">
                  <label className="block text-sm text-gray-600 mb-1">Amount *</label>
                  <input
                    required type="number" min="0.01" step="0.01"
                    value={adjForm.amount}
                    onChange={e => setAdjForm(f => ({ ...f, amount: e.target.value }))}
                    placeholder="0.00"
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Currency</label>
                  <input
                    type="text" value={adjForm.currency}
                    onChange={e => setAdjForm(f => ({ ...f, currency: e.target.value }))}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Memo / Reason</label>
                <input
                  type="text" value={adjForm.memo}
                  onChange={e => setAdjForm(f => ({ ...f, memo: e.target.value }))}
                  placeholder="e.g. Monthly advance, payment correction…"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              {adjError && <p className="text-sm text-red-600">{adjError}</p>}
              <div className="flex gap-2 pt-1">
                <button type="submit" disabled={adjSaving}
                  className="flex-1 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 disabled:opacity-60">
                  {adjSaving ? 'Saving…' : 'Create Adjustment'}
                </button>
                <button type="button" onClick={() => setShowAdj(false)}
                  className="flex-1 py-2 border text-sm rounded-md hover:bg-gray-50">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Summary ── */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <SummaryCard label="Total Debits"  amount={totalDebit}  color="text-red-600" />
        <SummaryCard label="Total Credits" amount={totalCredit} color="text-green-600" />
        <SummaryCard
          label="Net Balance" amount={Math.abs(balance)}
          color={balance > 0 ? 'text-red-600' : 'text-green-600'}
          note={balance > 0 ? 'Amount owed' : balance < 0 ? 'Credit balance' : 'Settled'}
        />
      </div>

      {/* ── Table ── */}
      {loading ? (
        <p className="text-sm text-gray-500">Loading…</p>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {['#', 'Booking', 'Type', 'Amount', 'Memo', 'Date'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">No ledger entries found</td></tr>
              )}
              {filtered.map(e => {
                const isAdj = e.bookingId == null
                return (
                  <tr key={e.id} className={`hover:bg-gray-50 ${isAdj ? 'bg-blue-50/30' : ''}`}>
                    <td className="px-4 py-3 font-mono text-gray-400 text-xs">{e.id}</td>
                    <td className="px-4 py-3 font-mono text-gray-500">
                      {e.bookingId
                        ? `#${e.bookingId}`
                        : <span className="text-xs text-blue-600 font-medium italic">adjustment</span>}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                        e.entryType === 'DEBIT'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-green-100 text-green-700'
                      }`}>
                        {e.entryType}
                      </span>
                    </td>
                    <td className={`px-4 py-3 font-semibold whitespace-nowrap ${
                      e.entryType === 'DEBIT' ? 'text-red-600' : 'text-green-600'
                    }`}>
                      {e.entryType === 'DEBIT' ? '−' : '+'} {e.currency} {Number(e.amount).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-gray-500 max-w-xs truncate" title={e.memo ?? ''}>
                      {e.memo ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-gray-400 whitespace-nowrap text-xs">
                      {new Date(e.createdAt).toLocaleString('en-GB', { dateStyle: 'short', timeStyle: 'short' })}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function SummaryCard({ label, amount, color, note }) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">{label}</div>
      <div className={`text-xl font-bold ${color}`}>PKR {Math.abs(amount).toLocaleString()}</div>
      {note && <div className="text-xs text-gray-400 mt-0.5">{note}</div>}
    </div>
  )
}
