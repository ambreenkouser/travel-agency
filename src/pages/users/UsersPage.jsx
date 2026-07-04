import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { getUsers, getAllowedTypes, createUser, updateUser, toggleActive, deleteUser, uploadUserPhoto, userPhotoUrl } from '../../api/users'
import { getAgencies, getBranding } from '../../api/agencies'
import { getGrantablePermissions } from '../../api/permissions'

const TYPE_COLORS = {
  1: { badge: 'bg-purple-100 text-purple-700', dot: 'bg-purple-500' },
  2: { badge: 'bg-blue-100 text-blue-700',     dot: 'bg-blue-500'   },
  3: { badge: 'bg-teal-100 text-teal-700',     dot: 'bg-teal-500'   },
  4: { badge: 'bg-orange-100 text-orange-700', dot: 'bg-orange-400' },
}

// Human-readable labels for each permission
const PERM_LABELS = {
  'agencies:view':     'View Agencies',
  'agencies:create':   'Create Agencies',
  'agencies:edit':     'Edit Agencies',
  'agencies:delete':   'Delete Agencies',
  'flights:view':      'View Flights',
  'flights:manage':    'Manage Flights',
  'umrah:view':        'View Umrah Packages',
  'umrah:manage':      'Manage Umrah Packages',
  'hajj:view':         'View Hajj Packages',
  'hajj:manage':       'Manage Hajj Packages',
  'bookings:view':     'View Bookings',
  'bookings:create':   'Create Bookings',
  'bookings:confirm':  'Confirm Bookings',
  'bookings:cancel':   'Cancel Bookings',
  'reports:view':      'View Reports',
  'accounts:manage':   'Manage Payment Accounts',
  'ledger:view':       'View Ledger',
  'custom:view':       'View Custom Packages',
  'custom:manage':     'Manage Custom Packages',
}

// Permissions relevant to an Agency Agent (booking agent) — hides
// Payments/Reports/Custom Packages/Agencies/Ledger, which don't apply to that role.
const AGENT_PERMISSION_NAMES = [
  'flights:view', 'flights:manage',
  'umrah:view', 'umrah:manage',
  'hajj:view', 'hajj:manage',
  'bookings:view', 'bookings:create', 'bookings:confirm', 'bookings:cancel',
  'ledger:view',
]

const emptyForm = {
  firstName: '', lastName: '', email: '', password: '',
  userTypeId: '', agencyId: '', parentId: '',
  permissionIds: [], phone: '',
}

export default function UsersPage() {
  const { user: me } = useAuth()

  const myLevel = (() => {
    if (me?.authorities?.includes('ROLE_super_admin'))  return 1
    if (me?.authorities?.includes('ROLE_master_agent')) return 2
    if (me?.authorities?.includes('ROLE_agency_admin')) return 3
    return 4
  })()

  const [users, setUsers]                     = useState([])
  const [allowedTypes, setAllowedTypes]       = useState([])
  const [agencies, setAgencies]               = useState([])
  const [myAgencyName, setMyAgencyName]       = useState('')
  const [availablePerms, setAvailablePerms]   = useState([])
  const [form, setForm]                       = useState(emptyForm)
  const [photoFile, setPhotoFile]             = useState(null)
  const [editing, setEditing]                 = useState(null)
  const [showForm, setShowForm]               = useState(false)
  const [error, setError]                     = useState('')
  const [loading, setLoading]                 = useState(true)

  useEffect(() => {
    Promise.all([
      getUsers(),
      getAllowedTypes(),
      myLevel <= 2 ? getAgencies() : Promise.resolve([]),
      getGrantablePermissions(),
    ]).then(([u, types, a, perms]) => {
      setUsers(u)
      // Hide master_agent from the type dropdown — legacy role only
      setAllowedTypes(types.filter(t => t.name !== 'master_admin'))
      setAgencies(a)
      setAvailablePerms(perms)
    }).catch(() => setError('Failed to load data'))
      .finally(() => setLoading(false))
  }, [myLevel])

  useEffect(() => {
    if (myLevel !== 3) return
    getBranding().then(b => setMyAgencyName(b.agencyName ?? '')).catch(() => {})
  }, [myLevel])

  function load() {
    getUsers().then(setUsers).catch(() => setError('Failed to reload users'))
  }

  function openCreate() {
    setForm({ ...emptyForm, userTypeId: allowedTypes[0]?.id ?? '', permissionIds: [] })
    setPhotoFile(null)
    setEditing(null)
    setShowForm(true)
    setError('')
  }

  function openEdit(u) {
    setForm({
      firstName:  u.firstName,
      lastName:   u.lastName,
      email:      u.email,
      password:   '',
      userTypeId: u.userTypeId ?? '',
      agencyId:   u.agencyId ?? '',
      parentId:   u.parentId ?? '',
      permissionIds: u.permissionIds ?? [],
      phone: u.phone ?? '',
    })
    setPhotoFile(null)
    setEditing(u.id)
    setShowForm(true)
    setError('')
  }

  function togglePerm(id) {
    setForm(f => ({
      ...f,
      permissionIds: f.permissionIds.includes(id)
        ? f.permissionIds.filter(p => p !== id)
        : [...f.permissionIds, id],
    }))
  }

  function selectAllPerms() {
    setForm(f => ({ ...f, permissionIds: visiblePerms.map(p => p.id) }))
  }

  function clearAllPerms() {
    setForm(f => ({ ...f, permissionIds: [] }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    const payload = {
      ...form,
      userTypeId:    form.userTypeId    ? Number(form.userTypeId)    : null,
      agencyId:      form.agencyId      ? Number(form.agencyId)      : null,
      parentId:      form.parentId      ? Number(form.parentId)      : null,
      permissionIds: form.permissionIds,
    }
    try {
      let savedId = editing
      if (editing) {
        await updateUser(editing, payload)
      } else {
        const created = await createUser(payload)
        savedId = created.id
      }
      if (photoFile && savedId) {
        const fd = new FormData()
        fd.append('photo', photoFile)
        await uploadUserPhoto(savedId, fd)
      }
      setShowForm(false)
      load()
    } catch (err) {
      setError(err?.response?.data?.message ?? err?.response?.data ?? 'Save failed.')
    }
  }

  async function handleToggle(id) {
    try { await toggleActive(id); load() }
    catch { setError('Failed to update status.') }
  }

  async function handleDelete(id) {
    if (!confirm('Permanently delete this user?')) return
    try { await deleteUser(id); load() }
    catch { setError('Delete failed.') }
  }

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  const selectedType = allowedTypes.find(t => t.id === Number(form.userTypeId))
  const needsAgency  = selectedType ? selectedType.level >= 3 : myLevel <= 2
  // Show permissions panel when creating or editing a non-super_admin user
  const showPerms = selectedType && selectedType.level > 1
  // Phone/Photo fields are only collected when an agency_admin creates/edits an Agent
  const isAgentByAgencyAdmin = myLevel === 3 && selectedType?.level === 4

  // Agents only see/can-be-granted a fixed, role-appropriate subset of permissions
  const visiblePerms = selectedType?.level === 4
    ? availablePerms.filter(p => AGENT_PERMISSION_NAMES.includes(p.name))
    : availablePerms

  // Group permissions by module for cleaner UI
  const permGroups = {
    'Agencies':  visiblePerms.filter(p => p.name.startsWith('agencies')),
    'Flights':   visiblePerms.filter(p => p.name.startsWith('flights')),
    'Umrah':     visiblePerms.filter(p => p.name.startsWith('umrah')),
    'Hajj':      visiblePerms.filter(p => p.name.startsWith('hajj')),
    'Bookings':  visiblePerms.filter(p => p.name.startsWith('bookings')),
    'Accounts':  visiblePerms.filter(p => p.name.startsWith('accounts')),
    'Reports':   visiblePerms.filter(p => p.name.startsWith('reports')),
    'Ledger':    visiblePerms.filter(p => p.name.startsWith('ledger')),
    'Custom':    visiblePerms.filter(p => p.name.startsWith('custom')),
  }

  const tree = buildTree(users)

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Users</h1>
        {allowedTypes.length > 0 && (
          <button onClick={openCreate}
            className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700">
            + New User
          </button>
        )}
      </div>

      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

      {/* ── Inline form ── */}
      {showForm && (
        <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-semibold">{editing ? 'Edit User' : 'New User'}</h2>
            <button type="button" onClick={() => setShowForm(false)}
              className="text-gray-400 hover:text-gray-600 text-xl font-bold leading-none">×</button>
          </div>
            <form onSubmit={handleSubmit} className="space-y-4">

              {/* Name */}
              <div className="grid grid-cols-2 gap-3">
                <Field label="First Name *" value={form.firstName} onChange={set('firstName')} required />
                <Field label="Last Name *"  value={form.lastName}  onChange={set('lastName')}  required />
              </div>

              {/* Email + Password */}
              <Field label="Email *" value={form.email} onChange={set('email')} type="email" required />
              <Field
                label={editing ? 'New Password (leave blank to keep)' : 'Password *'}
                value={form.password} onChange={set('password')} type="password"
                required={!editing}
              />

              {/* User type */}
              {allowedTypes.length > 0 && (
                <div>
                  <label className="block text-sm text-gray-600 mb-1">User Type *</label>
                  <select value={form.userTypeId} onChange={set('userTypeId')} required
                    className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500">
                    <option value="">— Select type —</option>
                    {allowedTypes.map(t => (
                      <option key={t.id} value={t.id}>{t.displayName}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Agency */}
              {(needsAgency || editing) && myLevel <= 2 && (
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Agency</label>
                  <select value={form.agencyId} onChange={set('agencyId')}
                    className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500">
                    <option value="">— No agency —</option>
                    {agencies.map(a => (
                      <option key={a.id} value={a.id}>{a.name}</option>
                    ))}
                  </select>
                </div>
              )}
              {(needsAgency || editing) && myLevel === 3 && (
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Agency</label>
                  <input type="text" value={myAgencyName || '—'} disabled
                    className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm bg-gray-50 text-gray-500" />
                </div>
              )}

              {/* Phone + Photo — agency_admin creating/editing an Agent only */}
              {isAgentByAgencyAdmin && (
                <>
                  <Field label="Phone Number *" value={form.phone} onChange={set('phone')} required />
                  <label className="block text-sm">
                    <span className="block text-gray-600 mb-1">Profile Photo (optional)</span>
                    {editing && (
                      <img src={userPhotoUrl(editing)} alt="current photo"
                        className="h-12 w-12 rounded-full object-cover mb-2"
                        onError={e => e.currentTarget.style.display = 'none'} />
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={e => setPhotoFile(e.target.files?.[0] ?? null)}
                      className="w-full text-sm text-gray-600 file:mr-3 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-xs file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    />
                  </label>
                </>
              )}

              {/* ── Permissions Panel ── */}
              {showPerms && visiblePerms.length > 0 && (
                <div className="border border-gray-200 rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-gray-700">Permissions</span>
                    <div className="flex gap-3">
                      <button type="button" onClick={selectAllPerms}
                        className="text-xs text-blue-600 hover:underline">Select All</button>
                      <button type="button" onClick={clearAllPerms}
                        className="text-xs text-gray-500 hover:underline">Clear</button>
                    </div>
                  </div>
                  {Object.entries(permGroups).map(([group, perms]) =>
                    perms.length === 0 ? null : (
                      <div key={group}>
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">{group}</p>
                        <div className="grid grid-cols-2 gap-1.5">
                          {perms.map(p => (
                            <label key={p.id} className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={form.permissionIds.includes(p.id)}
                                onChange={() => togglePerm(p.id)}
                                className="w-3.5 h-3.5 text-blue-600 rounded"
                              />
                              <span className="text-xs text-gray-700">
                                {PERM_LABELS[p.name] ?? p.name}
                              </span>
                            </label>
                          ))}
                        </div>
                      </div>
                    )
                  )}
                  <p className="text-xs text-gray-400">
                    {form.permissionIds.filter(id => visiblePerms.some(p => p.id === id)).length} of {visiblePerms.length} selected
                  </p>
                </div>
              )}

              {error && <p className="text-sm text-red-600">{error}</p>}

              <div className="flex gap-2 pt-1">
                <button type="submit"
                  className="flex-1 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700">
                  {editing ? 'Update User' : 'Create User'}
                </button>
                <button type="button" onClick={() => setShowForm(false)}
                  className="flex-1 py-2 border text-sm rounded-md hover:bg-gray-50">
                  Cancel
                </button>
              </div>
            </form>
        </div>
      )}

      {/* ── Hierarchy Table ── */}
      {loading ? (
        <p className="text-sm text-gray-500">Loading...</p>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="w-12 px-4 py-3" />
                {['Name', 'User Type', 'Email', 'Agency', 'Status', ''].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {tree.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">No users found</td></tr>
              )}
              {tree.map(({ user: u, depth }) => {
                const level  = u.userTypeLevel || 0
                const colors = TYPE_COLORS[level] ?? TYPE_COLORS[4]
                return (
                  <tr key={u.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <UserAvatar user={u} />
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-900">
                      <span style={{ paddingLeft: depth * 20 }} className="flex items-center gap-1.5">
                        {depth > 0 && <span className="text-gray-300 text-xs">└─</span>}
                        {u.firstName} {u.lastName}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {u.userTypeName
                        ? <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${colors.badge}`}>
                            {u.userTypeName}
                          </span>
                        : <span className="text-gray-300 text-xs">—</span>
                      }
                    </td>
                    <td className="px-4 py-3 text-gray-600">{u.email}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">
                      {u.agencyName ?? <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                        u.active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'
                      }`}>
                        {u.active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap space-x-3">
                      <button onClick={() => openEdit(u)} className="text-blue-600 hover:underline text-xs">Edit</button>
                      <button onClick={() => handleToggle(u.id)}
                        className={`text-xs hover:underline ${u.active ? 'text-yellow-600' : 'text-green-600'}`}>
                        {u.active ? 'Deactivate' : 'Activate'}
                      </button>
                      <button onClick={() => handleDelete(u.id)} className="text-red-500 hover:underline text-xs">Delete</button>
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

/** Build a flat list with depth for indented rendering, ordered by parent-child. */
function buildTree(users) {
  const byParent = {}
  const roots    = []

  users.forEach(u => {
    byParent[u.id] = byParent[u.id] || []
    if (u.parentId == null || !users.find(p => p.id === u.parentId)) {
      roots.push(u)
    } else {
      byParent[u.parentId] = byParent[u.parentId] || []
      byParent[u.parentId].push(u)
    }
  })

  const sortFn = (a, b) => (a.userTypeLevel || 0) - (b.userTypeLevel || 0) || a.firstName.localeCompare(b.firstName)
  roots.sort(sortFn)
  Object.values(byParent).forEach(arr => arr.sort(sortFn))

  const result = []
  function walk(user, depth) {
    result.push({ user, depth })
    ;(byParent[user.id] || []).forEach(child => walk(child, depth + 1))
  }
  roots.forEach(r => walk(r, 0))
  return result
}

function UserAvatar({ user }) {
  const [error, setError] = useState(false)
  const initials = `${user.firstName?.[0] ?? ''}${user.lastName?.[0] ?? ''}`.toUpperCase()

  if (error) {
    return (
      <span className="h-7 w-7 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center text-[10px] font-semibold">
        {initials}
      </span>
    )
  }
  return (
    <img src={userPhotoUrl(user.id)} alt="" className="h-7 w-7 rounded-full object-cover"
      onError={() => setError(true)} />
  )
}

function Field({ label, value, onChange, type = 'text', required }) {
  return (
    <label className="block text-sm">
      <span className="block text-gray-600 mb-1">{label}</span>
      <input type={type} value={value} onChange={onChange} required={required}
        className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" />
    </label>
  )
}
