import { useEffect, useState } from 'react'

function secondsLeft(expiresAt) {
  if (!expiresAt) return null
  return Math.max(0, Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000))
}

function Digit({ d, color }) {
  return (
    <span className={`w-7 h-9 ${color} text-white text-lg font-bold font-mono rounded flex items-center justify-center`}>
      {d}
    </span>
  )
}

function Unit({ label, value, color }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wide">{label}</span>
      <div className="flex gap-0.5">
        <Digit d={value[0]} color={color} />
        <Digit d={value[1]} color={color} />
      </div>
    </div>
  )
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

  const hh = String(h).padStart(2, '0')
  const mm = String(m).padStart(2, '0')
  const ss = String(s).padStart(2, '0')

  const color = left < 300 ? 'bg-red-700' : left < 900 ? 'bg-orange-700' : 'bg-gray-800'

  return (
    <div className="flex items-end gap-1.5 mt-1">
      <Unit label="Hours"   value={hh} color={color} />
      <span className="text-gray-400 font-bold text-base pb-1">:</span>
      <Unit label="Minutes" value={mm} color={color} />
      <span className="text-gray-400 font-bold text-base pb-1">:</span>
      <Unit label="Seconds" value={ss} color={color} />
    </div>
  )
}
