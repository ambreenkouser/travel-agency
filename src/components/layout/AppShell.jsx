import { useEffect, useState } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import TopBar from './TopBar'

export default function AppShell() {
  const [warning, setWarning] = useState('')
  const [expired, setExpired] = useState(false)

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

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <TopBar />

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

        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
