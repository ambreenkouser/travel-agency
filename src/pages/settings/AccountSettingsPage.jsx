import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { changePassword } from '../../api/auth'
import { getMyAccounts, createAccount, deleteAccount } from '../../api/accounts'
import { getBanks } from '../../api/banks'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import ErrorMessage from '../../components/ui/ErrorMessage'

const TABS = ['Profile', 'Security', 'Payment Accounts']

export default function AccountSettingsPage() {
  const { user, updateProfile } = useAuth()
  const isAdmin = user?.authorities?.some(a => ['ROLE_super_admin', 'ROLE_master_agent', 'ROLE_agency_admin'].includes(a))
  const tabs = isAdmin ? TABS : TABS.slice(0, 2)
  const [tab, setTab] = useState(tabs[0])

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-xl font-semibold text-gray-900">Account Settings</h1>

      {/* Tab bar */}
      <div className="flex gap-1 border-b border-gray-200">
        {tabs.map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              tab === t
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'Profile'           && <ProfileTab user={user} updateProfile={updateProfile} />}
      {tab === 'Security'          && <SecurityTab />}
      {tab === 'Payment Accounts'  && <PaymentAccountsTab />}
    </div>
  )
}

/* ── Profile Tab ── */
function ProfileTab({ user, updateProfile }) {
  const [form, setForm] = useState({
    firstName: user?.firstName ?? '',
    lastName: user?.lastName ?? '',
    email: user?.email ?? '',
  })
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  async function handleSave(e) {
    e.preventDefault()
    setError('')
    setSuccess(false)
    setSaving(true)
    try {
      await updateProfile({ firstName: form.firstName, lastName: form.lastName, email: form.email })
      setSuccess(true)
    } catch (err) {
      const msg = err?.response?.data?.message ?? err?.response?.data ?? 'Failed to update profile.'
      setError(typeof msg === 'string' ? msg : 'Failed to update profile.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card className="p-6">
      <h2 className="text-sm font-semibold text-gray-700 mb-5">Profile Information</h2>
      <form onSubmit={handleSave} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">First Name</label>
            <input required type="text" value={form.firstName}
              onChange={e => setForm(f => ({ ...f, firstName: e.target.value }))}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Last Name</label>
            <input required type="text" value={form.lastName}
              onChange={e => setForm(f => ({ ...f, lastName: e.target.value }))}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Email</label>
          <input required type="email" value={form.email}
            onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        {success && <div className="rounded-md bg-green-50 border border-green-200 p-3 text-green-700 text-sm">Profile updated.</div>}
        <ErrorMessage message={error} />
        <div className="flex justify-end">
          <Button type="submit" variant="primary" disabled={saving}>{saving ? 'Saving...' : 'Save Changes'}</Button>
        </div>
      </form>
    </Card>
  )
}

/* ── Security Tab ── */
function SecurityTab() {
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  async function handleChange(e) {
    e.preventDefault()
    setError('')
    setSuccess(false)
    if (form.newPassword !== form.confirmPassword) { setError('New passwords do not match.'); return }
    if (form.newPassword.length < 6) { setError('New password must be at least 6 characters.'); return }
    setSaving(true)
    try {
      await changePassword({ currentPassword: form.currentPassword, newPassword: form.newPassword })
      setSuccess(true)
      setForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
    } catch (err) {
      const msg = err?.response?.data?.message ?? err?.response?.data ?? 'Failed to change password.'
      setError(typeof msg === 'string' ? msg : 'Failed to change password.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card className="p-6">
      <h2 className="text-sm font-semibold text-gray-700 mb-5">Change Password</h2>
      <form onSubmit={handleChange} className="space-y-4">
        {['currentPassword', 'newPassword', 'confirmPassword'].map((field, i) => (
          <div key={field}>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              {['Current Password', 'New Password', 'Confirm New Password'][i]}
            </label>
            <input required type="password" value={form[field]}
              onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
        ))}
        {success && <div className="rounded-md bg-green-50 border border-green-200 p-3 text-green-700 text-sm">Password changed successfully.</div>}
        <ErrorMessage message={error} />
        <div className="flex justify-end">
          <Button type="submit" variant="primary" disabled={saving}>{saving ? 'Updating...' : 'Change Password'}</Button>
        </div>
      </form>
    </Card>
  )
}

/* ── Payment Accounts Tab ── */
function PaymentAccountsTab() {
  const [accounts, setAccounts] = useState([])
  const [banks, setBanks] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ accountName: '', bankId: '', accountTitle: '', bankAccountNumber: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    load()
    getBanks().then(setBanks).catch(() => {})
  }, [])

  function load() {
    setLoading(true)
    getMyAccounts().then(setAccounts).catch(() => setError('Failed to load accounts.')).finally(() => setLoading(false))
  }

  async function handleCreate(e) {
    e.preventDefault()
    setError('')
    setSaving(true)
    try {
      await createAccount({ ...form, bankId: form.bankId ? Number(form.bankId) : null })
      setShowForm(false)
      setForm({ accountName: '', bankId: '', accountTitle: '', bankAccountNumber: '' })
      load()
    } catch (err) {
      setError(err?.response?.data?.message ?? 'Failed to create account.')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id) {
    if (!confirm('Delete this payment account?')) return
    try {
      await deleteAccount(id)
      load()
    } catch {
      setError('Failed to delete account.')
    }
  }

  // Group banks by type for optgroup
  const bankGroups = banks.reduce((acc, b) => {
    const key = b.type === 'BANK' ? 'Banks' : b.type === 'FINTECH' ? 'Fintech / Wallets' : 'EMI'
    ;(acc[key] = acc[key] || []).push(b)
    return acc
  }, {})

  return (
    <div className="space-y-4">
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-gray-700">My Payment Accounts</h2>
          <button
            onClick={() => setShowForm(s => !s)}
            className="text-sm px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            + Add Account
          </button>
        </div>

        {showForm && (
          <form onSubmit={handleCreate} className="mb-5 p-4 bg-gray-50 rounded-lg border border-gray-200 space-y-3">
            <h3 className="text-xs font-semibold text-gray-600 uppercase tracking-wide">New Account</h3>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Account Name (Nickname) *</label>
              <input required type="text" value={form.accountName}
                onChange={e => setForm(f => ({ ...f, accountName: e.target.value }))}
                placeholder="e.g. My HBL Main"
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Bank / Fintech *</label>
              <select required value={form.bankId}
                onChange={e => setForm(f => ({ ...f, bankId: e.target.value }))}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">-- Select Bank --</option>
                {Object.entries(bankGroups).map(([group, items]) => (
                  <optgroup key={group} label={group}>
                    {items.map(b => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Account Title (Holder Name) *</label>
              <input required type="text" value={form.accountTitle}
                onChange={e => setForm(f => ({ ...f, accountTitle: e.target.value }))}
                placeholder="e.g. Muhammad Ali"
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Account Number *</label>
              <input required type="text" value={form.bankAccountNumber}
                onChange={e => setForm(f => ({ ...f, bankAccountNumber: e.target.value }))}
                placeholder="IBAN, account no, or mobile number"
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <ErrorMessage message={error} />
            <div className="flex gap-2">
              <Button type="submit" variant="primary" disabled={saving}>{saving ? 'Creating...' : 'Create'}</Button>
              <Button type="button" variant="secondary" onClick={() => setShowForm(false)}>Cancel</Button>
            </div>
          </form>
        )}

        {loading ? (
          <p className="text-sm text-gray-400">Loading...</p>
        ) : accounts.length === 0 ? (
          <p className="text-sm text-gray-400 py-4 text-center">No payment accounts yet. Add one above.</p>
        ) : (
          <div className="divide-y divide-gray-100">
            {accounts.map(a => {
              const bank = banks.find(b => b.id === a.bankId)
              return (
                <div key={a.id} className="flex items-center justify-between py-3">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-gray-800">{a.accountName}</span>
                      {bank && (
                        <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${
                          bank.type === 'FINTECH' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                        }`}>{bank.type}</span>
                      )}
                    </div>
                    <div className="text-sm text-gray-600">
                      {bank ? bank.name : 'Unknown Bank'} · {a.bankAccountNumber}
                    </div>
                    <div className="text-xs text-gray-400">{a.accountTitle}</div>
                  </div>
                  <button onClick={() => handleDelete(a.id)}
                    className="text-xs text-red-500 hover:text-red-700 border border-red-200 rounded px-2 py-1 hover:bg-red-50">
                    Delete
                  </button>
                </div>
              )
            })}
          </div>
        )}
        <ErrorMessage message={!showForm ? error : ''} />
      </Card>
    </div>
  )
}
