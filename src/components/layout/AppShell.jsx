import { useEffect, useState } from 'react'
import { Link, Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import TopBar from './TopBar'
import { getMyAnnouncements, announcementImageUrl } from '../../api/announcements'

const LS_KEY = 'readAnnouncements'

function getRead() {
  try { return JSON.parse(localStorage.getItem(LS_KEY) ?? '[]') }
  catch { return [] }
}
function persistRead(id) {
  const list = getRead()
  if (!list.includes(id)) localStorage.setItem(LS_KEY, JSON.stringify([...list, id]))
}

export default function AppShell() {
  const [warning, setWarning]     = useState('')
  const [expired, setExpired]     = useState(false)
  const [announcements, setAnnouncements] = useState([])
  const [readIds, setReadIds]     = useState(() => getRead())
  const [annLoaded, setAnnLoaded] = useState(false)

  useEffect(() => {
    function onWarning(e) { setWarning(e.detail) }
    function onExpired()  { setExpired(true) }
    window.addEventListener('subscription-warning', onWarning)
    window.addEventListener('subscription-expired', onExpired)
    return () => {
      window.removeEventListener('subscription-warning', onWarning)
      window.removeEventListener('subscription-expired', onExpired)
    }
  }, [])

  function fetchAnnouncements() {
    getMyAnnouncements()
      .then(list => { setAnnouncements(list ?? []); setAnnLoaded(true) })
      .catch(() => setAnnLoaded(true))
  }

  useEffect(() => {
    fetchAnnouncements()
    const interval  = setInterval(fetchAnnouncements, 60_000)
    const onFocus   = () => fetchAnnouncements()
    const onChanged = () => fetchAnnouncements()
    // When a specific announcement is read (opened) in AnnouncementsPage
    const onRead = (e) => {
      const id = e.detail
      persistRead(id)
      setReadIds(prev => prev.includes(id) ? prev : [...prev, id])
    }
    window.addEventListener('focus', onFocus)
    window.addEventListener('announcements-changed', onChanged)
    window.addEventListener('announcement-read', onRead)
    return () => {
      clearInterval(interval)
      window.removeEventListener('focus', onFocus)
      window.removeEventListener('announcements-changed', onChanged)
      window.removeEventListener('announcement-read', onRead)
    }
  }, [])

  // Dismiss banner AND mark as read
  function markRead(id) {
    persistRead(id)
    setReadIds(prev => prev.includes(id) ? prev : [...prev, id])
  }

  const unread = announcements.filter(a => !readIds.includes(a.id))
  const banner = unread[0] ?? null

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <Sidebar />
      <div id="main-scroll" className="flex-1 flex flex-col overflow-y-auto">
        <TopBar announcementCount={unread.length} />

        {expired && (
          <div className="bg-red-600 text-white text-sm text-center px-4 py-2 font-medium">
            Your subscription has expired. Please contact your administrator to renew.
          </div>
        )}
        {!expired && warning && (
          <div className="bg-yellow-500 text-white text-sm text-center px-4 py-2 font-medium flex items-center justify-center gap-2">
            <span>⚠ {warning}</span>
            <button onClick={() => setWarning('')} className="ml-4 underline text-xs opacity-80 hover:opacity-100">
              Dismiss
            </button>
          </div>
        )}

        {/* Announcement banner — latest unread */}
        {annLoaded && banner && (
          <div className="bg-indigo-700 text-white px-4 py-2.5 flex items-center gap-3">
            {banner.hasImage && (
              <img src={announcementImageUrl(banner.id)} alt=""
                className="h-8 w-8 rounded object-cover shrink-0" />
            )}
            <span className="text-base shrink-0">📢</span>
            <div className="flex-1 min-w-0">
              <span className="font-semibold text-sm">{banner.title}</span>
              {banner.message && (
                <span className="text-indigo-200 text-sm ml-2 truncate hidden sm:inline">
                  — {banner.message}
                </span>
              )}
            </div>
            <Link
              to="/announcements"
              className="text-xs text-indigo-200 hover:text-white underline shrink-0"
            >
              View All
            </Link>
            <button
              onClick={() => markRead(banner.id)}
              className="text-indigo-300 hover:text-white text-lg leading-none shrink-0 ml-1"
              aria-label="Dismiss"
            >
              ×
            </button>
          </div>
        )}

        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
