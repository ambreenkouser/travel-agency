import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import AppShell from './components/layout/AppShell'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/dashboard/DashboardPage'
import FlightSearchPage from './pages/flights/FlightSearchPage'
import FlightBookingPage from './pages/flights/FlightBookingPage'
import MyBookingsPage from './pages/bookings/MyBookingsPage'
import BookingConfirmPage from './pages/bookings/BookingConfirmPage'
import PackagesPage from './pages/packages/PackagesPage'
import AgenciesPage from './pages/agencies/AgenciesPage'
import PackageBookingPage from './pages/bookings/PackageBookingPage'
import AirlinesPage from './pages/airlines/AirlinesPage'
import RoutesPage from './pages/routes/RoutesPage'
import FlightManagementPage from './pages/flights/FlightManagementPage'
import UmrahManagementPage from './pages/packages/UmrahManagementPage'
import HajjManagementPage from './pages/packages/HajjManagementPage'
import CustomPackagesManagementPage from './pages/packages/CustomPackagesManagementPage'
import AgencyPackageTypePage from './pages/packages/AgencyPackageTypePage'
import PackageTypeDefsPage from './pages/admin/PackageTypeDefsPage'
import UsersPage from './pages/users/UsersPage'
import LedgerPage from './pages/ledger/LedgerPage'
import HotelsManagementPage from './pages/hotels/HotelsManagementPage'
import BookingRequestsPage from './pages/bookings/BookingRequestsPage'
import AccountSettingsPage from './pages/settings/AccountSettingsPage'
import BanksPage from './pages/banks/BanksPage'
import OffersPage from './pages/offers/OffersPage'
import AnnouncementsPage from './pages/announcements/AnnouncementsPage'
import AnalyticsPage from './pages/analytics/AnalyticsPage'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <AppShell />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="flights" element={<FlightSearchPage />} />
            <Route path="flights/:id/book" element={<FlightBookingPage />} />
            <Route path="bookings"            element={<MyBookingsPage />} />
            <Route path="bookings/new"         element={<PackageBookingPage />} />
            <Route path="bookings/:id/confirm" element={<BookingConfirmPage />} />
            <Route path="packages" element={<PackagesPage />} />
            <Route path="agencies" element={<AgenciesPage />} />
            <Route path="airlines"       element={<AirlinesPage />} />
            <Route path="routes"         element={<RoutesPage />} />
            <Route path="manage/flights" element={<FlightManagementPage />} />
            <Route path="manage/umrah"   element={<UmrahManagementPage />} />
            <Route path="manage/hajj"    element={<HajjManagementPage />} />
            <Route path="manage/custom"           element={<CustomPackagesManagementPage />} />
            <Route path="manage/custom-packages/:typeDefId" element={<AgencyPackageTypePage />} />
            <Route path="manage/package-types"   element={<PackageTypeDefsPage />} />
            <Route path="users"          element={<UsersPage />} />
            <Route path="ledger"         element={<LedgerPage />} />
            <Route path="manage/hotels"    element={<HotelsManagementPage />} />
            <Route path="bookings/requests" element={<BookingRequestsPage />} />
            <Route path="settings" element={<AccountSettingsPage />} />
            <Route path="banks" element={<BanksPage />} />
            <Route path="offers"         element={<OffersPage />} />
            <Route path="announcements"  element={<AnnouncementsPage />} />
            <Route path="analytics"      element={<AnalyticsPage />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
