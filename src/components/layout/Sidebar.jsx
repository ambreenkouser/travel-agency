import { useEffect, useState } from 'react'
import { NavLink } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { getBranding } from '../../api/agencies'

const navItems = [
  { to: '/flights',  label: 'Flights',     icon: '✈' },
  { to: '/packages', label: 'Packages',    icon: '🕌' },
  { to: '/bookings', label: 'My Bookings', icon: '📋' },
  { to: '/ledger',   label: 'My Ledger',   icon: '📒' },
  { to: '/offers',   label: 'Offers',      icon: '🎁' },
]

const approvalItems = [
  { to: '/bookings/requests', label: 'Booking Requests', icon: '📩',
    roles: ['super_admin', 'master_agent', 'agency_admin'] },
]

const adminItems = [
  { to: '/agencies',       label: 'Agencies',        icon: '🏢', roles: ['super_admin', 'master_agent'] },
  { to: '/users',          label: 'Users',            icon: '👥', roles: ['super_admin', 'master_agent', 'agency_admin'] },
  { to: '/airlines',       label: 'Airlines',         icon: '🛩', roles: ['super_admin', 'master_agent', 'agency_admin'] },
  { to: '/routes',         label: 'Routes',           icon: '🗺', roles: ['super_admin', 'master_agent', 'agency_admin'] },
  { to: '/manage/flights', label: 'Manage Flights',   icon: '🛫', roles: ['super_admin', 'master_agent', 'agency_admin'] },
  { to: '/manage/umrah',   label: 'Umrah Packages',   icon: '🕌', roles: ['super_admin', 'master_agent', 'agency_admin'] },
  { to: '/manage/hajj',    label: 'Hajj Packages',    icon: '🕋', roles: ['super_admin', 'master_agent', 'agency_admin'] },
  { to: '/manage/hotels',  label: 'Hotels',           icon: '🏨', roles: ['super_admin', 'master_agent', 'agency_admin'] },
  { to: '/banks',          label: 'Banks',            icon: '🏦', roles: ['super_admin'] },
]

const adminRoles = ['super_admin', 'master_agent', 'agency_admin']

export default function Sidebar() {
  const { user } = useAuth()
  const [branding, setBranding] = useState({ agencyName: 'TravelDesk', logoUrl: '' })

  useEffect(() => {
    getBranding().then(setBranding).catch(() => {})
  }, [])

  // authorities contains "ROLE_super_admin", "flights:view", etc.
  const roles = (user?.authorities ?? [])
    .filter(a => a.startsWith('ROLE_'))
    .map(a => a.replace('ROLE_', ''))

  const isAdmin = roles.some(r => adminRoles.includes(r))

  const visibleAdminItems = adminItems.filter(item =>
    item.roles.some(r => roles.includes(r))
  )

  return (
    <aside className="w-56 min-h-screen bg-gray-900 text-white flex flex-col">
      {/* Branding */}
      <div className="px-6 py-5 border-b border-gray-700 flex items-center gap-3">
        {branding.logoUrl ? (
          <img src={branding.logoUrl} alt="logo" className="h-7 w-7 rounded object-cover" />
        ) : (
          <div className="h-7 w-7 rounded bg-blue-600 flex items-center justify-center text-xs font-bold">
            {branding.agencyName?.charAt(0) ?? 'T'}
          </div>
        )}
        <span className="text-sm font-bold tracking-tight truncate">{branding.agencyName}</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map(item => <NavItem key={item.to} {...item} />)}

        {/* Approval queue — visible to admins who can confirm bookings */}
        {approvalItems
          .filter(item => item.roles.some(r => roles.includes(r)))
          .map(item => <NavItem key={item.to} {...item} />)}

        {isAdmin && (
          <>
            <div className="pt-4 pb-1 px-3 text-xs text-gray-500 uppercase tracking-wider">Admin</div>
            {visibleAdminItems.map(item => <NavItem key={item.to} {...item} />)}
          </>
        )}
      </nav>
    </aside>
  )
}

function NavItem({ to, label, icon }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
          isActive ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-800 hover:text-white'
        }`
      }
    >
      <span>{icon}</span>
      {label}
    </NavLink>
  )
}
