import { useEffect, useState } from 'react'
import {
  ResponsiveContainer, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ComposedChart, Area,
} from 'recharts'
import { getDashboardStats } from '../../api/dashboard'
import Spinner from '../../components/ui/Spinner'

// ── Formatters ───────────────────────────────────────────────────────────────

function fmt(num) {
  if (num == null) return '—'
  const n = Number(num)
  if (n >= 1_000_000) return `PKR ${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000)     return `PKR ${(n / 1_000).toFixed(0)}K`
  return `PKR ${n.toLocaleString()}`
}
function fmtDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-PK', { month: 'short', day: 'numeric', year: 'numeric' })
}
function shortDate(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('en-PK', { month: 'short', day: 'numeric' })
}

// ── Stat card ────────────────────────────────────────────────────────────────

function StatCard({ label, value, sub, color = 'blue' }) {
  const colors = {
    blue:   'bg-blue-50 text-blue-700 border-blue-200',
    green:  'bg-green-50 text-green-700 border-green-200',
    amber:  'bg-amber-50 text-amber-700 border-amber-200',
    purple: 'bg-purple-50 text-purple-700 border-purple-200',
  }
  return (
    <div className={`rounded-xl border p-4 ${colors[color]}`}>
      <p className="text-xs font-medium uppercase tracking-wide opacity-70">{label}</p>
      <p className="text-2xl font-bold mt-1">{value}</p>
      {sub && <p className="text-xs mt-1 opacity-60">{sub}</p>}
    </div>
  )
}

// ── Custom tooltip ───────────────────────────────────────────────────────────

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload || !payload.length) return null
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-3 shadow text-xs">
      <p className="font-semibold text-gray-700 mb-1">{label}</p>
      {payload.map(p => (
        <div key={p.name} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
          <span className="text-gray-600">{p.name}:</span>
          <span className="font-medium" style={{ color: p.color }}>
            {p.name === 'Bookings' ? p.value : fmt(p.value)}
          </span>
        </div>
      ))}
    </div>
  )
}

// ── Time range options ───────────────────────────────────────────────────────

const TIME_RANGES = [
  { label: '7 days',  value: 7  },
  { label: '30 days', value: 30 },
  { label: '90 days', value: 90 },
]

const STATUS_COLORS = {
  CONFIRMED: 'bg-green-100 text-green-700',
  PENDING:   'bg-yellow-100 text-yellow-700',
  CANCELLED: 'bg-red-100 text-red-700',
}

// ── Main page ────────────────────────────────────────────────────────────────

export default function AnalyticsPage() {
  const [activeTab, setActiveTab] = useState('overview')

  const [stats, setStats]           = useState(null)
  const [loadingStats, setLoading]  = useState(true)
  const [days, setDays]             = useState(30)
  const [agentId, setAgentId]       = useState(null)
  const [statsError, setStatsError] = useState('')

  useEffect(() => {
    setLoading(true)
    setStatsError('')
    getDashboardStats(days, agentId)
      .then(setStats)
      .catch(() => setStatsError('Failed to load analytics.'))
      .finally(() => setLoading(false))
  }, [days, agentId])

  const chartData = (stats?.activityByDate || []).map(d => ({
    date:     shortDate(d.date),
    Bookings: d.count,
    Revenue:  d.revenue ? Number(d.revenue) : 0,
    Cost:     d.cost    ? Number(d.cost)    : 0,
    Profit:   d.profit  ? Number(d.profit)  : 0,
  }))

  const tickInterval = days <= 7 ? 0 : days <= 30 ? 4 : 9

  return (
    <div className="space-y-6">

      {/* ── Page header ── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
          <p className="text-gray-500 text-sm mt-0.5">Booking analytics and performance overview</p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Time range */}
          <div className="flex rounded-lg border border-gray-200 overflow-hidden text-sm">
            {TIME_RANGES.map(r => (
              <button key={r.value} onClick={() => setDays(r.value)}
                className={`px-3 py-1.5 transition-colors ${days === r.value ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}>
                {r.label}
              </button>
            ))}
          </div>
          {/* Agent filter */}
          {stats?.agentOptions?.length > 1 && (
            <select value={agentId ?? ''} onChange={e => setAgentId(e.target.value ? Number(e.target.value) : null)}
              className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500">
              <option value="">All Agents</option>
              {stats.agentOptions.map(a => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex gap-6">
          {[
            { key: 'overview', label: 'Overview' },
            { key: 'history',  label: 'Booking History' },
          ].map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.key
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}>
              {tab.label}
              {tab.key === 'history' && stats?.bookingHistory?.length > 0 && (
                <span className="ml-2 bg-gray-100 text-gray-600 text-xs rounded-full px-2 py-0.5">
                  {stats.bookingHistory.length}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {statsError && <p className="text-sm text-red-600">{statsError}</p>}

      {loadingStats ? (
        <div className="flex justify-center py-16"><Spinner size="lg" /></div>
      ) : stats && (
        <>
          {/* ── Overview tab ── */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Summary cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard label="Total Bookings" value={stats.totalBookings}      sub={`last ${days} days`}        color="blue"   />
                <StatCard label="Confirmed"       value={stats.confirmedBookings}  sub="active bookings"            color="green"  />
                <StatCard label="Revenue"         value={fmt(stats.totalRevenue)}  sub="gross selling"              color="amber"  />
                <StatCard label="Profit"          value={fmt(stats.totalProfit)}   sub={`cost: ${fmt(stats.totalCost)}`} color="purple" />
              </div>

              {/* Booking Activity Chart */}
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <h2 className="text-base font-semibold text-gray-800 mb-4">Booking Activity</h2>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} interval={tickInterval} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11 }} width={30} />
                    <Tooltip content={<ChartTooltip />} />
                    <Bar dataKey="Bookings" fill="#3b82f6" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Revenue & Profit Chart */}
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <h2 className="text-base font-semibold text-gray-800 mb-4">Revenue vs Cost vs Profit</h2>
                <ResponsiveContainer width="100%" height={250}>
                  <ComposedChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} interval={tickInterval} />
                    <YAxis tick={{ fontSize: 11 }} width={55}
                      tickFormatter={v => v >= 1000 ? `${(v / 1000).toFixed(0)}K` : v} />
                    <Tooltip content={<ChartTooltip />} />
                    <Legend iconSize={10} wrapperStyle={{ fontSize: 12 }} />
                    <Area type="monotone" dataKey="Revenue" fill="#dbeafe" stroke="#3b82f6" strokeWidth={2} />
                    <Line type="monotone" dataKey="Cost"    stroke="#f59e0b" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="Profit"  stroke="#10b981" strokeWidth={2} dot={false} strokeDasharray="4 2" />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* ── Booking History tab ── */}
          {activeTab === 'history' && (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              {stats.bookingHistory?.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        {['ID', 'Type', 'Status', 'Gross', 'Cost', 'Profit', 'Date'].map(h => (
                          <th key={h} className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {stats.bookingHistory.map(b => {
                        const profit = b.grossTotal != null && b.cost != null
                          ? Number(b.grossTotal) - Number(b.cost)
                          : null
                        return (
                          <tr key={b.id} className="hover:bg-gray-50">
                            <td className="px-4 py-2.5 font-mono text-gray-500 text-xs">#{b.id}</td>
                            <td className="px-4 py-2.5 capitalize text-gray-700">{b.bookableType}</td>
                            <td className="px-4 py-2.5">
                              <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[b.status] ?? 'bg-gray-100 text-gray-600'}`}>
                                {b.status}
                              </span>
                            </td>
                            <td className="px-4 py-2.5 text-gray-700">{b.grossTotal != null ? fmt(b.grossTotal) : '—'}</td>
                            <td className="px-4 py-2.5 text-gray-500">{b.cost != null ? fmt(b.cost) : '—'}</td>
                            <td className={`px-4 py-2.5 font-medium ${profit != null && profit >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                              {profit != null ? fmt(profit) : '—'}
                            </td>
                            <td className="px-4 py-2.5 text-gray-500 text-xs">{fmtDate(b.createdAt)}</td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="py-16 text-center text-gray-400 text-sm">
                  No booking history for the selected period.
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}
