import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getPackageTypeDefs } from '../../api/packageTypeDefs'
import Spinner from '../../components/ui/Spinner'

const BUILTIN_GROUPS = [
  { key: 'umrah', label: 'Umrah Group', icon: '🕌', description: 'Umrah pilgrimage packages', gradient: 'from-emerald-500 to-teal-600', href: '/packages?group=umrah' },
  { key: 'hajj',  label: 'Hajj Group',  icon: '🕋', description: 'Hajj pilgrimage packages',  gradient: 'from-amber-500 to-orange-600',  href: '/packages?group=hajj'  },
]
const CUSTOM_GRADIENTS = [
  'from-blue-500 to-indigo-600', 'from-purple-500 to-violet-600',
  'from-rose-500 to-pink-600',   'from-cyan-500 to-sky-600',
  'from-lime-500 to-green-600',  'from-fuchsia-500 to-purple-600',
]

function GroupCard({ group, onClick }) {
  return (
    <button onClick={onClick}
      className="group relative overflow-hidden rounded-2xl shadow-md hover:shadow-xl transition-all duration-200 hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 text-left w-full">
      <div className={`bg-gradient-to-br ${group.gradient} p-8 flex flex-col items-center justify-center min-h-[160px] gap-3`}>
        <span className="text-6xl drop-shadow-sm select-none">{group.icon}</span>
        <div className="text-center">
          <p className="text-white font-bold text-base leading-tight">{group.label}</p>
          <p className="text-white/75 text-xs mt-1">{group.description}</p>
        </div>
      </div>
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-200 rounded-2xl" />
    </button>
  )
}

export default function DashboardPage() {
  const navigate = useNavigate()
  const [customTypes, setCustomTypes] = useState([])
  const [loading, setLoading]         = useState(true)

  useEffect(() => {
    getPackageTypeDefs()
      .then(types => setCustomTypes(types.filter(t => t.active)))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const allGroups = [
    ...BUILTIN_GROUPS,
    ...customTypes.map((t, i) => ({
      key: `custom-${t.id}`,
      label: t.name,
      icon: t.icon || '📦',
      description: t.description || `${t.name} packages`,
      gradient: CUSTOM_GRADIENTS[i % CUSTOM_GRADIENTS.length],
      href: `/packages?group=custom&typeDefId=${t.id}`,
    })),
    { key: 'all', label: 'All Packages', icon: '📦', description: 'Browse all available packages', gradient: 'from-gray-500 to-slate-600', href: '/packages' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-0.5">Select a package group to get started</p>
      </div>

      <div>
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Packages</h2>
        {loading ? (
          <div className="flex justify-center py-10"><Spinner size="lg" /></div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {allGroups.map(group => (
              <GroupCard key={group.key} group={group} onClick={() => navigate(group.href)} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
