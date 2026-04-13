import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import Button from '../ui/Button'

export default function TopBar() {
  const { user, logout } = useAuth()

  return (
    <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-6">
      <div />
      <div className="flex items-center gap-4">
        <Link to="/settings" className="text-sm text-gray-700 hover:text-gray-900 font-medium">
          {user?.firstName} {user?.lastName}
        </Link>
        <Button variant="secondary" onClick={logout}>
          Logout
        </Button>
      </div>
    </header>
  )
}
