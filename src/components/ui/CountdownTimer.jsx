import { useEffect, useState } from 'react'

function secondsLeft(expiresAt) {
  if (!expiresAt) return null
  return Math.max(0, Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000))
}

export default function CountdownTimer({ expiresAt }) {
  const [left, setLeft] = useState(() => secondsLeft(expiresAt))

  useEffect(() => {
    if (!expiresAt) return
    setLeft(secondsLeft(expiresAt))
    const t = setInterval(() => setLeft(secondsLeft(expiresAt)), 1000)
    return () => clearInterval(t)
  }, [expiresAt])

  if (left === null) return null

  if (left <= 0) {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-red-600 bg-red-50 border border-red-200 rounded px-1.5 py-0.5">
        Expired
      </span>
    )
  }

  const h = Math.floor(left / 3600)
  const m = Math.floor((left % 3600) / 60)
  const s = left % 60
  const display = h > 0
    ? `${h}h ${String(m).padStart(2, '0')}m`
    : `${m}:${String(s).padStart(2, '0')}`

  const color = left < 300
    ? 'text-red-600 bg-red-50 border-red-200'
    : left < 900
    ? 'text-orange-600 bg-orange-50 border-orange-200'
    : 'text-gray-600 bg-gray-50 border-gray-200'

  return (
    <span className={`inline-flex items-center gap-1 text-xs font-mono font-medium border rounded px-1.5 py-0.5 ${color}`}>
      {display}
    </span>
  )
}
