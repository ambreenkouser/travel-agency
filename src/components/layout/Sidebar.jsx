import { useEffect, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { getBranding } from '../../api/agencies'
import { getBookingQueue } from '../../api/bookings'
import { getPackageTypeDefs } from '../../api/packageTypeDefs'

const navItems = [
  { to: '/dashboard',     label: 'Dashboard',     icon: '🏠' },
  { to: '/analytics',     label: 'Analytics',     icon: '📊' },
  { to: '/flights',       label: 'Flights',       icon: '✈' },
  { to: '/packages',      label: 'Packages',      icon: '🕌' },
  { to: '/bookings',      label: 'My Bookings',   icon: '📋' },
  { to: '/offers',        label: 'Offers',        icon: '🎁' },
  { to: '/announcements', label: 'News & Announcements', icon: '📢' },
]

const approvalItems = [
  { to: '/bookings/requests', label: 'Booking Requests', icon: '📩',
    roles: ['super_admin', 'master_agent', 'agency_admin'] },
  { to: '/bookings/history', label: 'Booking History', icon: '📜',
    roles: ['super_admin', 'master_agent', 'agency_admin'] },
]

const adminItems = [
  { to: '/agencies',       label: 'Agencies',        icon: '🏢', roles: ['super_admin', 'master_agent'] },
  { to: '/users',          label: 'Users',            icon: '👥', roles: ['super_admin', 'master_agent', 'agency_admin'] },
  { to: '/airlines',       label: 'Airlines',         icon: '🛩', roles: ['super_admin', 'master_agent', 'agency_admin'] },
  { to: '/routes',         label: 'Sectors',          icon: '🗺', roles: ['super_admin', 'master_agent', 'agency_admin'] },
  { to: '/manage/flights', label: 'Manage Flights',   icon: '🛫', roles: ['super_admin', 'master_agent', 'agency_admin'] },
  { to: '/manage/umrah',   label: 'Umrah Packages',   icon: '🕌', roles: ['super_admin', 'master_agent', 'agency_admin'] },
  { to: '/manage/hajj',           label: 'Hajj Packages',   icon: '🕋', roles: ['super_admin', 'master_agent', 'agency_admin'] },
  { to: '/manage/package-types', label: 'Package Types',    icon: '🗂️', roles: ['super_admin'] },
  { to: '/manage/hotels',        label: 'Hotels',           icon: '🏨', roles: ['super_admin', 'master_agent', 'agency_admin'] },
  { to: '/banks',          label: 'Banks',            icon: '🏦', roles: ['super_admin'] },
]

const adminRoles = ['super_admin', 'master_agent', 'agency_admin']

export default function Sidebar({ announcementCount = 0 }) {
  const { user } = useAuth()
  const location = useLocation()
  const [branding, setBranding]         = useState({ agencyName: 'TravelDesk', logoUrl: '' })
  const [queueCount, setQueueCount]     = useState(0)
  const [packageTypes, setPackageTypes] = useState([])

  // Scroll main content area to top on every route change
  useEffect(() => {
    document.getElementById('main-scroll')?.scrollTo({ top: 0 })
  }, [location.pathname])

  useEffect(() => {
    getBranding().then(setBranding).catch(() => {})
  }, [])

  const authorities = user?.authorities ?? []
  const roles = authorities
    .filter(a => a.startsWith('ROLE_'))
    .map(a => a.replace('ROLE_', ''))
  const canApprove  = roles.some(r => ['super_admin', 'master_agent', 'agency_admin'].includes(r))
  const isAgencyAdmin = roles.some(r => ['master_agent', 'agency_admin'].includes(r))
  const canViewLedger = authorities.includes('ledger:view')

  useEffect(() => {
    if (!canApprove) return
    getBookingQueue().then(list => setQueueCount(list.length)).catch(() => {})
    const interval = setInterval(() => {
      getBookingQueue().then(list => setQueueCount(list.length)).catch(() => {})
    }, 60_000)
    return () => clearInterval(interval)
  }, [canApprove])

  // Dynamic package types for agency admin sidebar
  useEffect(() => {
    if (!isAgencyAdmin) return
    getPackageTypeDefs()
      .then(types => setPackageTypes(types.filter(t => t.active)))
      .catch(() => {})
  }, [isAgencyAdmin])

  const isAdmin = roles.some(r => adminRoles.includes(r))

  const visibleAdminItems = adminItems.filter(item =>
    item.roles.some(r => roles.includes(r))
  )

  return (
    <aside className="group w-14 hover:w-56 transition-[width] duration-200 ease-in-out
                      h-screen bg-gray-900 text-white flex flex-col overflow-y-auto
                      overflow-x-hidden shrink-0 print:hidden">
      {/* Branding */}
      <div className="px-3 py-5 border-b border-gray-700 flex items-center gap-3 overflow-hidden">
        {branding.logoUrl ? (
          <img src={branding.logoUrl} alt="logo" className="h-7 w-7 rounded object-cover shrink-0" />
        ) : (
          <div className="h-7 w-7 rounded bg-blue-600 flex items-center justify-center text-xs font-bold shrink-0">
            {branding.agencyName?.charAt(0) ?? 'T'}
          </div>
        )}
        <span className="text-sm font-bold tracking-tight whitespace-nowrap overflow-hidden
                         max-w-0 opacity-0 group-hover:max-w-[160px] group-hover:opacity-100
                         transition-all duration-200">
          {branding.agencyName}
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-4 space-y-1">
        {navItems.map(item => (
          <NavItem
            key={item.to}
            {...item}
            badge={item.to === '/announcements' ? announcementCount : 0}
          />
        ))}

        {/* Ledger — visible only to users with the ledger:view permission */}
        {canViewLedger && (
          <NavItem to="/ledger" label="My Ledger" icon="📒" />
        )}

        {/* Approval queue — visible to admins who can confirm bookings */}
        {approvalItems
          .filter(item => item.roles.some(r => roles.includes(r)))
          .map(item => <NavItem key={item.to} {...item} badge={item.to === '/bookings/requests' ? queueCount : 0} />)}

        {isAdmin && (
          <>
            <div className="pt-4 pb-1 px-1 text-xs text-gray-500 uppercase tracking-wider overflow-hidden">
              <span className="whitespace-nowrap max-w-0 opacity-0 inline-block overflow-hidden
                               group-hover:max-w-[160px] group-hover:opacity-100 transition-all duration-200">
                Admin
              </span>
              <span className="block group-hover:hidden border-t border-gray-700 mt-1" />
            </div>
            {visibleAdminItems.map(item => <NavItem key={item.to} {...item} />)}
            {/* Dynamic package type pages for agency admins */}
            {isAgencyAdmin && packageTypes.map(t => (
              <NavItem
                key={`pkg-type-${t.id}`}
                to={`/manage/custom-packages/${t.id}`}
                label={t.name}
                icon={t.icon}
              />
            ))}
          </>
        )}
      </nav>
    </aside>
  )
}

function NavItem({ to, label, icon, badge = 0 }) {
  return (
    <NavLink
      to={to}
      end
      className={({ isActive }) =>
        `flex items-center gap-2 px-2 py-2 rounded-r-md text-sm font-medium transition-colors border-l-2 ${
          isActive
            ? 'bg-blue-600/20 text-white border-blue-400'
            : 'text-gray-300 hover:bg-gray-800 hover:text-white border-transparent'
        }`
      }
    >
      {({ isActive }) => (
        <>
          <span className={`text-base shrink-0 w-6 text-center${isActive ? ' drop-shadow-[0_0_6px_rgba(147,197,253,1)]' : ''}`}>
            {icon}
          </span>
          <span className="flex-1 whitespace-nowrap overflow-hidden
                           max-w-0 opacity-0
                           group-hover:max-w-[160px] group-hover:opacity-100
                           transition-all duration-200">
            {label}
          </span>
          {badge > 0 && (
            <span className="min-w-[1.25rem] h-5 px-1 bg-red-500 text-white text-xs font-bold
                             rounded-full flex items-center justify-center shrink-0">
              {badge > 99 ? '99+' : badge}
            </span>
          )}
        </>
      )}
    </NavLink>
  )
}
