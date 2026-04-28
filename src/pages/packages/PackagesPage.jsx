import { useEffect, useState } from 'react'
import { getHajjPackages } from '../../api/hajj'
import { getUmrahPackages } from '../../api/umrah'
import { getMyCustomPackages } from '../../api/customPackages'
import { useAuth } from '../../context/AuthContext'
import client from '../../api/client'
import Card from '../../components/ui/Card'
import Spinner from '../../components/ui/Spinner'
import ErrorMessage from '../../components/ui/ErrorMessage'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'

function CustomCard({ pkg, onBook }) {
  const available = pkg.quotaTotal != null ? pkg.quotaTotal - (pkg.quotaReserved ?? 0) : null
  const isFull = available !== null && available <= 0
  return (
    <Card className="p-4 flex flex-col gap-3">
      <div className="flex items-start justify-between">
        <div>
          <span className="inline-flex px-2 py-0.5 text-xs font-medium bg-purple-100 text-purple-700 rounded-full mb-1">
            {pkg.packageType}
          </span>
          <h3 className="font-semibold text-gray-900">{pkg.title}</h3>
        </div>
        <Badge status={pkg.status || 'active'} />
      </div>
      {pkg.description && (
        <p className="text-xs text-gray-500 line-clamp-2">{pkg.description}</p>
      )}
      <div className="text-sm text-gray-600 space-y-1">
        {pkg.quotaTotal != null && (
          <div className="flex justify-between">
            <span>Quota</span>
            <span>{pkg.quotaReserved ?? 0} / {pkg.quotaTotal}</span>
          </div>
        )}
        {pkg.attributes && Object.keys(pkg.attributes).length > 0 && (
          <div className="mt-1 space-y-0.5">
            {Object.entries(pkg.attributes).slice(0, 3).map(([k, v]) => (
              <div key={k} className="flex justify-between text-xs">
                <span className="text-gray-400">{k}</span>
                <span className="text-gray-600">{String(v)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="space-y-0.5">
        <div className="text-lg font-bold text-blue-600">PKR {Number(pkg.basePrice || 0).toLocaleString()}</div>
        {(pkg.priceChild != null || pkg.priceInfant != null) && (
          <div className="text-xs text-gray-500">
            {pkg.priceChild  != null && <span className="mr-2">Child: PKR {Number(pkg.priceChild).toLocaleString()}</span>}
            {pkg.priceInfant != null && <span>Infant: PKR {Number(pkg.priceInfant).toLocaleString()}</span>}
          </div>
        )}
      </div>
      <Button onClick={() => onBook(pkg, 'custom')} className="w-full mt-auto" disabled={isFull}>
        {isFull ? 'Fully Booked' : 'Book Package'}
      </Button>
    </Card>
  )
}

function HajjCard({ pkg, onBook }) {
  const available = pkg.quotaTotal != null ? pkg.quotaTotal - (pkg.quotaReserved ?? 0) : null
  const isFull = available !== null && available <= 0
  return (
    <Card className="p-4 flex flex-col gap-3">
      <div className="flex items-start justify-between">
        <h3 className="font-semibold text-gray-900">{pkg.title}</h3>
        <Badge status={pkg.status || 'active'} />
      </div>
      <div className="text-sm text-gray-600 space-y-1">
        <div className="flex justify-between"><span>Quota</span><span>{pkg.quotaReserved ?? 0} / {pkg.quotaTotal ?? '—'}</span></div>
      </div>
      <div className="text-lg font-bold text-blue-600">PKR {Number(pkg.basePrice || 0).toLocaleString()}</div>
      <Button onClick={() => onBook(pkg, 'hajj')} className="w-full mt-auto" disabled={isFull}>
        {isFull ? 'Fully Booked' : 'Book Package'}
      </Button>
    </Card>
  )
}

function UmrahCard({ pkg, onBook }) {
  const totalAvailable = (pkg.airlines ?? []).reduce((sum, a) => sum + (a.availableSeats ?? 0), 0)
  const totalAllocated = (pkg.airlines ?? []).reduce((sum, a) => sum + (a.allocatedSeats ?? 0), 0)
  const isFullyBooked  = pkg.airlines && pkg.airlines.length > 0 && totalAvailable === 0

  return (
    <Card className="p-4 flex flex-col gap-3">
      <div className="flex items-start justify-between">
        <h3 className="font-semibold text-gray-900">{pkg.title}</h3>
        <Badge status={pkg.status || 'active'} />
      </div>
      <div className="text-sm text-gray-600 space-y-1">
        {pkg.durationDays && <div className="flex justify-between"><span>Duration</span><span>{pkg.durationDays} days</span></div>}
        {pkg.startDate    && <div className="flex justify-between"><span>Start</span><span>{new Date(pkg.startDate).toLocaleDateString()}</span></div>}
        {pkg.endDate      && <div className="flex justify-between"><span>End</span>  <span>{new Date(pkg.endDate).toLocaleDateString()}</span></div>}
      </div>

      {pkg.airlines && pkg.airlines.length > 0 && (
        <div className="border-t border-gray-100 pt-2 space-y-1">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Airlines</p>
          {pkg.airlines.map(a => (
            <div key={a.id} className="flex items-center justify-between text-xs">
              <span className="font-medium text-gray-700">{a.airlineCode} – {a.airlineName}</span>
              <span className={`px-2 py-0.5 rounded-full font-medium ${
                a.availableSeats === 0 ? 'bg-red-100 text-red-700' :
                a.availableSeats <= 5  ? 'bg-yellow-100 text-yellow-700' :
                'bg-green-100 text-green-700'
              }`}>
                {a.availableSeats} / {a.allocatedSeats} seats
              </span>
            </div>
          ))}
          {totalAllocated > 0 && (
            <div className="flex justify-between text-xs text-gray-400 pt-1 border-t border-gray-50">
              <span>Total available</span>
              <span>{totalAvailable} / {totalAllocated}</span>
            </div>
          )}
        </div>
      )}

      <div className="text-lg font-bold text-blue-600">PKR {Number(pkg.basePrice || 0).toLocaleString()}</div>
      <Button onClick={() => onBook(pkg, 'umrah')} className="w-full mt-auto" disabled={isFullyBooked}>
        {isFullyBooked ? 'Fully Booked' : 'Book Package'}
      </Button>
    </Card>
  )
}

export default function PackagesPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const group = searchParams.get('group')           // 'umrah' | 'hajj' | 'custom' | null
  const typeDefId = searchParams.get('typeDefId')   // numeric id when group=custom

  const { user } = useAuth()
  const authorities = user?.authorities ?? []
  const canManage = authorities.includes('custom:manage')

  const [hajjPackages, setHajjPackages]     = useState([])
  const [umrahPackages, setUmrahPackages]   = useState([])
  const [customPackages, setCustomPackages] = useState([])
  const [airlines, setAirlines]             = useState([])
  const [filterAirline, setFilterAirline]   = useState('')
  const [loading, setLoading]               = useState(true)
  const [error, setError]                   = useState('')

  useEffect(() => {
    Promise.all([
      getHajjPackages(),
      getUmrahPackages(),
      client.get('/api/airlines').then(r => r.data),
      getMyCustomPackages().catch(() => []),
    ])
      .then(([hajj, umrah, airs, custom]) => {
        setHajjPackages(hajj)
        setUmrahPackages(umrah)
        setAirlines(Array.isArray(airs) ? airs : [])
        setCustomPackages(Array.isArray(custom) ? custom : [])
      })
      .catch(() => setError('Failed to load packages.'))
      .finally(() => setLoading(false))
  }, [])

  function handleBook(pkg, type) {
    navigate(`/bookings/new?bookableType=${type}&bookableId=${pkg.id}&adults=1&children=0&infants=0`)
  }

  const filteredUmrah = filterAirline
    ? umrahPackages.filter(p => (p.airlines ?? []).some(a => String(a.airlineId) === filterAirline))
    : umrahPackages

  // Group custom packages by type
  const customGrouped = customPackages.reduce((acc, p) => {
    const t = p.packageType || 'Other'
    if (!acc[t]) acc[t] = []
    acc[t].push(p)
    return acc
  }, {})

  // When group=custom&typeDefId=X, filter custom packages to that type only
  const customGroupedFiltered = typeDefId
    ? Object.fromEntries(Object.entries(customGrouped).filter(([, pkgs]) =>
        pkgs.some(p => String(p.typeDefId) === typeDefId)
      ).map(([type, pkgs]) => [type, pkgs.filter(p => String(p.typeDefId) === typeDefId)]))
    : customGrouped

  const showHajj   = !group || group === 'hajj'
  const showUmrah  = !group || group === 'umrah'
  const showCustom = !group || group === 'custom'

  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          {group && (
            <Link to="/dashboard" className="text-sm text-blue-600 hover:text-blue-800 font-medium">
              ← Back to Dashboard
            </Link>
          )}
          <h1 className="text-xl font-semibold text-gray-900">
            {group === 'umrah' ? 'Umrah Group' : group === 'hajj' ? 'Hajj Group' : group === 'custom' ? 'Packages' : 'All Packages'}
          </h1>
        </div>
        {showUmrah && airlines.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            <label className="text-sm text-gray-600 font-medium">Filter by airline:</label>
            <select
              value={filterAirline}
              onChange={e => setFilterAirline(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">All airlines</option>
              {airlines.map(a => <option key={a.id} value={String(a.id)}>{a.code} – {a.name}</option>)}
            </select>
            {filterAirline && (
              <span className="text-xs text-gray-400 italic">Applies to Umrah packages only</span>
            )}
          </div>
        )}
      </div>
      <ErrorMessage message={error} />

      {/* Hajj + Umrah side by side — non-empty first, empty pushed to end */}
      {(showHajj || showUmrah) && (() => {
        const hajjEmpty  = hajjPackages.length === 0
        const umrahEmpty = filteredUmrah.length === 0

        const hajjCol = showHajj ? (
          <div key="hajj" className="space-y-3">
            <h2 className="text-base font-semibold text-gray-700">Hajj Packages</h2>
            {hajjEmpty ? (
              <p className="text-sm text-gray-500">No Hajj packages available.</p>
            ) : (
              <div className="space-y-3">
                {hajjPackages.map(pkg => (
                  <HajjCard key={pkg.id} pkg={pkg} onBook={handleBook} />
                ))}
              </div>
            )}
          </div>
        ) : null

        const umrahCol = showUmrah ? (
          <div key="umrah" className="space-y-3">
            <h2 className="text-base font-semibold text-gray-700">Umrah Packages</h2>
            {umrahEmpty ? (
              <p className="text-sm text-gray-500">No Umrah packages available.</p>
            ) : (
              <div className="space-y-3">
                {filteredUmrah.map(pkg => (
                  <UmrahCard key={pkg.id} pkg={pkg} onBook={handleBook} />
                ))}
              </div>
            )}
          </div>
        ) : null

        // Sort: non-empty columns first
        const cols = [
          showHajj  && { node: hajjCol,  empty: hajjEmpty  },
          showUmrah && { node: umrahCol, empty: umrahEmpty },
        ].filter(Boolean).sort((a, b) => Number(a.empty) - Number(b.empty))

        const gridCols = cols.length === 1 ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2'
        return (
          <div className={`grid ${gridCols} gap-6 items-start`}>
            {cols.map(c => c.node)}
          </div>
        )
      })()}

      {/* Custom Packages — non-empty types first, 2 columns per group */}
      {showCustom && Object.entries(customGroupedFiltered)
        .sort((a, b) => Number(a[1].length === 0) - Number(b[1].length === 0))
        .map(([type, pkgs]) => (
          <div key={type} className="space-y-3">
            <h2 className="text-base font-semibold text-gray-700">{type}</h2>
            {pkgs.length === 0 ? (
              <p className="text-sm text-gray-500">No packages available.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {pkgs.map(pkg => (
                  <CustomCard key={pkg.id} pkg={pkg} onBook={handleBook} />
                ))}
              </div>
            )}
          </div>
        ))}
    </div>
  )
}
