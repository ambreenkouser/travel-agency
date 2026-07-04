import { Link } from 'react-router-dom'
import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import Button from '../ui/Button'
import { userPhotoUrl } from '../../api/users'

export default function TopBar({ announcementCount = 0 }) {
  const { user, logout } = useAuth()
  const [photoError, setPhotoError] = useState(false)
  const initials = `${user?.firstName?.[0] ?? ''}${user?.lastName?.[0] ?? ''}`.toUpperCase()

  return (
    <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-6">
      <div />
      <div className="flex items-center gap-4">
        {/* Announcement bell */}
        <Link to="/announcements" className="relative text-gray-500 hover:text-gray-700" title="Announcements">
          <span className="text-xl leading-none">🔔</span>
          {announcementCount > 0 && (
            <span className="absolute -top-1 -right-1 h-4 min-w-4 px-1 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center leading-none">
              {announcementCount > 9 ? '9+' : announcementCount}
            </span>
          )}
        </Link>

        <Link to="/settings" className="flex items-center gap-2 text-sm text-gray-700 hover:text-gray-900 font-medium">
          {user?.id && !photoError ? (
            <img
              key={user.id}
              src={userPhotoUrl(user.id)}
              alt=""
              className="h-8 w-8 rounded-full object-cover"
              onError={() => setPhotoError(true)}
            />
          ) : (
            <span key={user?.id} className="h-8 w-8 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center text-xs font-semibold">
              {initials}
            </span>
          )}
          <span>{user?.firstName} {user?.lastName}</span>
        </Link>
        <Button variant="secondary" onClick={logout}>
          Logout
        </Button>
      </div>
    </header>
  )
}
