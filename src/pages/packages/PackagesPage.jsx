import { useEffect, useState } from 'react'
import { getHajjPackages } from '../../api/hajj'
import { getUmrahPackages } from '../../api/umrah'
import client from '../../api/client'
import Card from '../../components/ui/Card'
import Spinner from '../../components/ui/Spinner'
import ErrorMessage from '../../components/ui/ErrorMessage'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import { useNavigate } from 'react-router-dom'

function HajjCard({ pkg, onBook }) {
  return (
    <Card className="p-5 flex flex-col gap-3">
      <div className="flex items-start justify-between">
        <h3 className="font-semibold text-gray-900">{pkg.title}</h3>
        <Badge status={pkg.status || 'active'} />
      </div>
      <div className="text-sm text-gray-600 space-y-1">
        <div className="flex justify-between"><span>Quota</span><span>{pkg.quotaReserved ?? 0} / {pkg.quotaTotal ?? '—'}</span></div>
      </div>
      <div className="text-lg font-bold text-blue-600">PKR {Number(pkg.basePrice || 0).toLocaleString()}</div>
      <Button onClick={() => onBook(pkg, 'hajj')} className="w-full">Book Package</Button>
    </Card>
  )
}

function UmrahCard({ pkg, onBook }) {
  const totalAvailable = (pkg.airlines ?? []).reduce((sum, a) => sum + (a.availableSeats ?? 0), 0)
  const totalAllocated = (pkg.airlines ?? []).reduce((sum, a) => sum + (a.allocatedSeats ?? 0), 0)
  const isFullyBooked  = pkg.airlines && pkg.airlines.length > 0 && totalAvailable === 0

  return (
    <Card className="p-5 flex flex-col gap-3">
      <div className="flex items-start justify-between">
        <h3 className="font-semibold text-gray-900">{pkg.title}</h3>
        <Badge status={pkg.status || 'active'} />
      </div>
      <div className="text-sm text-gray-600 space-y-1">
        {pkg.durationDays && <div className="flex justify-between"><span>Duration</span><span>{pkg.durationDays} days</span></div>}
        {pkg.startDate    && <div className="flex justify-between"><span>Start</span><span>{new Date(pkg.startDate).toLocaleDateString()}</span></div>}
        {pkg.endDate      && <div className="flex justify-between"><span>End</span>  <span>{new Date(pkg.endDate).toLocaleDateString()}</span></div>}
      </div>

      {/* Airlines with seat availability */}
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
      <Button onClick={() => onBook(pkg, 'umrah')} className="w-full" disabled={isFullyBooked}>
        {isFullyBooked ? 'Fully Booked' : 'Book Package'}
      </Button>
    </Card>
  )
}

export default function PackagesPage() {
  const navigate = useNavigate()
  const [hajjPackages, setHajjPackages]   = useState([])
  const [umrahPackages, setUmrahPackages] = useState([])
  const [airlines, setAirlines]           = useState([])
  const [filterAirline, setFilterAirline] = useState('')
  const [loading, setLoading]             = useState(true)
  const [error, setError]                 = useState('')

  useEffect(() => {
    Promise.all([getHajjPackages(), getUmrahPackages(), client.get('/api/airlines').then(r => r.data)])
      .then(([hajj, umrah, airs]) => {
        setHajjPackages(hajj)
        setUmrahPackages(umrah)
        setAirlines(Array.isArray(airs) ? airs : [])
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

  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>

  return (
    <div className="space-y-8">
      <h1 className="text-xl font-semibold text-gray-900">Packages</h1>
      <ErrorMessage message={error} />

      {/* Hajj */}
      <section>
        <h2 className="text-base font-semibold text-gray-700 mb-4">Hajj Packages</h2>
        {hajjPackages.length === 0 ? (
          <p className="text-sm text-gray-500">No Hajj packages available.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {hajjPackages.map(pkg => <HajjCard key={pkg.id} pkg={pkg} onBook={handleBook} />)}
          </div>
        )}
      </section>

      {/* Umrah with airline filter */}
      <section>
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <h2 className="text-base font-semibold text-gray-700">Umrah Packages</h2>
          {airlines.length > 0 && (
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-500">Filter by airline:</label>
              <select
                value={filterAirline}
                onChange={e => setFilterAirline(e.target.value)}
                className="border border-gray-300 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="">All airlines</option>
                {airlines.map(a => <option key={a.id} value={String(a.id)}>{a.code} – {a.name}</option>)}
              </select>
            </div>
          )}
        </div>

        {filteredUmrah.length === 0 ? (
          <p className="text-sm text-gray-500">No Umrah packages available.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredUmrah.map(pkg => <UmrahCard key={pkg.id} pkg={pkg} onBook={handleBook} />)}
          </div>
        )}
      </section>
    </div>
  )
}
