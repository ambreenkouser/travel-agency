import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import {
  getMyAnnouncements,
  getSentAnnouncements,
  createAnnouncement,
  deleteAnnouncement,
  announcementImageUrl,
} from '../../api/announcements'

const LS_KEY = 'readAnnouncements'
function getReadIds() {
  try { return JSON.parse(localStorage.getItem(LS_KEY) ?? '[]') }
  catch { return [] }
}

const emptyForm = { title: '', message: '', validFrom: '', validUntil: '', image: null }

export default function AnnouncementsPage() {
  const { user } = useAuth()
  const authorities = user?.authorities ?? []
  const isAdmin = authorities.includes('ROLE_super_admin') ||
                  authorities.includes('ROLE_agency_admin') ||
                  authorities.includes('ROLE_master_agent')

  const [tab, setTab]               = useState(isAdmin ? 'sent' : 'received')
  const [sent, setSent]             = useState([])
  const [received, setReceived]     = useState([])
  const [form, setForm]             = useState(emptyForm)
  const [showForm, setShowForm]     = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError]           = useState('')
  const [loading, setLoading]       = useState(true)
  const [selectedAnn, setSelectedAnn] = useState(null)   // detail modal
  const [readIds, setReadIds]       = useState(getReadIds)

  useEffect(() => { load() }, [isAdmin])

  function load() {
    setLoading(true)
    const promises = [getMyAnnouncements()]
    if (isAdmin) promises.push(getSentAnnouncements())
    Promise.all(promises)
      .then(([recv, snt]) => {
        setReceived(recv ?? [])
        setSent(snt ?? [])
      })
      .catch(() => setError('Failed to load announcements.'))
      .finally(() => setLoading(false))
  }

  /** Open detail modal and mark announcement as read */
  function openDetail(ann) {
    setSelectedAnn(ann)
    if (!readIds.includes(ann.id)) {
      const updated = [...readIds, ann.id]
      localStorage.setItem(LS_KEY, JSON.stringify(updated))
      setReadIds(updated)
      // Tell AppShell bell to decrement
      window.dispatchEvent(new CustomEvent('announcement-read', { detail: ann.id }))
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (!form.title.trim()) { setError('Title is required.'); return }
    if (!form.validFrom)  { setError('Start date is required.'); return }
    if (!form.validUntil) { setError('End date is required.'); return }
    if (form.validUntil < form.validFrom) { setError('End date must be on or after start date.'); return }
    setSubmitting(true)
    try {
      const fd = new FormData()
      fd.append('title',      form.title.trim())
      fd.append('validFrom',  form.validFrom)
      fd.append('validUntil', form.validUntil)
      if (form.message.trim()) fd.append('message', form.message.trim())
      if (form.image)          fd.append('image', form.image)
      await createAnnouncement(fd)
      setForm(emptyForm)
      setShowForm(false)
      window.dispatchEvent(new CustomEvent('announcements-changed'))
      load()
    } catch (err) {
      setError(err?.response?.data?.message ?? 'Failed to create announcement.')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete(id) {
    if (!confirm('Delete this announcement?')) return
    try {
      await deleteAnnouncement(id)
      window.dispatchEvent(new CustomEvent('announcements-changed'))
      load()
    } catch {
      setError('Failed to delete.')
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-gray-900">News &amp; Announcements</h1>
        {isAdmin && (
          <button
            onClick={() => { setShowForm(true); setForm(emptyForm); setError('') }}
            className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-md hover:bg-indigo-700"
          >
            + New Announcement
          </button>
        )}
      </div>

      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

      {/* Tabs */}
      {isAdmin && (
        <div className="flex gap-4 mb-6 border-b border-gray-200">
          {['sent', 'received'].map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`pb-2 text-sm font-medium capitalize border-b-2 transition-colors ${
                tab === t
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {t === 'sent' ? 'Sent by Me' : 'Received'}
            </button>
          ))}
        </div>
      )}

      {/* Create modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg p-6 overflow-y-auto max-h-[90vh]">
            <h2 className="text-lg font-semibold mb-4">New News / Announcement</h2>
            <form onSubmit={handleSubmit} className="space-y-3">
              <label className="block text-sm">
                <span className="block text-gray-600 mb-1">Title *</span>
                <input
                  value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  required
                  className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </label>
              <label className="block text-sm">
                <span className="block text-gray-600 mb-1">Message</span>
                <textarea
                  value={form.message}
                  onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                  rows={4}
                  placeholder="Optional text message…"
                  className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </label>
              <label className="block text-sm">
                <span className="block text-gray-600 mb-1">Image (optional)</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={e => setForm(f => ({ ...f, image: e.target.files?.[0] ?? null }))}
                  className="w-full text-sm text-gray-600 file:mr-3 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-xs file:font-medium file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                />
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="block text-sm">
                  <span className="block text-gray-600 mb-1">
                    Start Date <span className="text-red-500">*</span>
                  </span>
                  <input type="date" value={form.validFrom} required
                    onChange={e => setForm(f => ({ ...f, validFrom: e.target.value }))}
                    className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </label>
                <label className="block text-sm">
                  <span className="block text-gray-600 mb-1">
                    End Date <span className="text-red-500">*</span>
                  </span>
                  <input type="date" value={form.validUntil} required
                    onChange={e => setForm(f => ({ ...f, validUntil: e.target.value }))}
                    className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </label>
              </div>
              {error && <p className="text-sm text-red-600">{error}</p>}
              <div className="flex gap-2 pt-2">
                <button type="submit" disabled={submitting}
                  className="flex-1 py-2 bg-indigo-600 text-white text-sm rounded-md hover:bg-indigo-700 disabled:opacity-50">
                  {submitting ? 'Sending…' : 'Send Announcement'}
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

      {/* Detail modal */}
      {selectedAnn && (
        <AnnDetailModal ann={selectedAnn} onClose={() => setSelectedAnn(null)} />
      )}

      {/* Content */}
      {loading ? (
        <p className="text-sm text-gray-500">Loading…</p>
      ) : (
        <>
          {isAdmin && tab === 'sent' && (
            <div className="space-y-3">
              {sent.length === 0 ? (
                <div className="bg-white rounded-lg border border-gray-200 p-8 text-center text-gray-400 text-sm">
                  No announcements sent yet.
                </div>
              ) : (
                sent.map(a => (
                  <SentCard key={a.id} ann={a} onDelete={handleDelete} onClick={() => setSelectedAnn(a)} />
                ))
              )}
            </div>
          )}

          {(!isAdmin || tab === 'received') && (
            <div className="space-y-4">
              {received.length === 0 ? (
                <div className="bg-white rounded-lg border border-gray-200 p-8 text-center text-gray-400 text-sm">
                  No announcements for you yet.
                </div>
              ) : (
                received.map(a => (
                  <ReceivedCard
                    key={a.id}
                    ann={a}
                    isRead={readIds.includes(a.id)}
                    onClick={() => openDetail(a)}
                  />
                ))
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}

/* ── Sent card (admin view) ─────────────────────────────────────────────── */
function SentCard({ ann, onDelete, onClick }) {
  return (
    <div
      onClick={onClick}
      className="bg-white rounded-lg border border-gray-200 px-5 py-4 flex items-start justify-between gap-4 cursor-pointer hover:shadow-sm transition-shadow"
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-medium text-gray-900 text-sm">{ann.title}</span>
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
            ann.targetType === 'AGENCY_ADMINS'
              ? 'bg-purple-100 text-purple-700'
              : 'bg-blue-100 text-blue-700'
          }`}>
            {ann.targetType === 'AGENCY_ADMINS' ? 'Agency Admins' : 'My Sub-Agents'}
          </span>
          {ann.hasImage && (
            <span className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">📷 Image</span>
          )}
        </div>
        {ann.message && (
          <p className="text-sm text-gray-500 truncate">{ann.message}</p>
        )}
        <p className="text-xs text-gray-400 mt-1">
          {new Date(ann.createdAt).toLocaleDateString('en-GB')}
          {ann.validUntil && ` · Expires ${ann.validUntil}`}
        </p>
      </div>
      <button
        onClick={e => { e.stopPropagation(); onDelete(ann.id) }}
        className="text-red-500 hover:text-red-700 text-xs shrink-0"
      >
        Delete
      </button>
    </div>
  )
}

/* ── Received card (child view) ─────────────────────────────────────────── */
function ReceivedCard({ ann, isRead, onClick }) {
  return (
    <div
      onClick={onClick}
      className={`rounded-lg border overflow-hidden cursor-pointer hover:shadow-md transition-shadow ${
        isRead ? 'bg-white border-gray-200' : 'bg-indigo-50 border-indigo-200'
      }`}
    >
      {ann.hasImage && (
        <img src={announcementImageUrl(ann.id)} alt={ann.title}
          className="w-full max-h-48 object-cover" />
      )}
      <div className="px-5 py-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-center gap-2">
            <span className="text-lg">📢</span>
            <h3 className={`font-semibold text-gray-900 ${!isRead ? 'text-indigo-900' : ''}`}>
              {ann.title}
            </h3>
            {!isRead && (
              <span className="h-2 w-2 rounded-full bg-indigo-500 shrink-0" title="Unread" />
            )}
          </div>
          <span className="text-xs text-gray-400 shrink-0">Click to read</span>
        </div>
        {ann.message && (
          <p className="text-sm text-gray-600 line-clamp-2">{ann.message}</p>
        )}
        <p className="text-xs text-gray-400 mt-3">
          From {ann.createdByName ?? 'Admin'} · {new Date(ann.createdAt).toLocaleDateString('en-GB')}
          {ann.validUntil && ` · Valid until ${ann.validUntil}`}
        </p>
      </div>
    </div>
  )
}

/* ── Detail modal ───────────────────────────────────────────────────────── */
function AnnDetailModal({ ann, onClose }) {
  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden max-h-[90vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <span className="text-xl">📢</span>
            <h2 className="text-lg font-semibold text-gray-900">{ann.title}</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1">
          {ann.hasImage && (
            <img
              src={announcementImageUrl(ann.id)}
              alt={ann.title}
              className="w-full object-cover max-h-64"
            />
          )}
          <div className="px-6 py-5 space-y-4">
            {ann.message ? (
              <p className="text-gray-700 text-sm whitespace-pre-wrap leading-relaxed">
                {ann.message}
              </p>
            ) : (
              <p className="text-gray-400 text-sm italic">No message body.</p>
            )}

            <div className="border-t border-gray-100 pt-4 space-y-1 text-xs text-gray-500">
              <p>
                <span className="font-medium text-gray-700">From:</span>{' '}
                {ann.createdByName ?? 'Admin'}
              </p>
              <p>
                <span className="font-medium text-gray-700">Posted:</span>{' '}
                {new Date(ann.createdAt).toLocaleString('en-GB')}
              </p>
              {ann.validFrom && (
                <p>
                  <span className="font-medium text-gray-700">Valid from:</span>{' '}
                  {ann.validFrom}
                </p>
              )}
              {ann.validUntil && (
                <p>
                  <span className="font-medium text-gray-700">Valid until:</span>{' '}
                  {ann.validUntil}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-gray-100 bg-gray-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-md hover:bg-indigo-700"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
