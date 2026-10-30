import { Routes, Route, Navigate } from 'react-router-dom'
import PublicLayout from '../components/layout/PublicLayout'
import DashboardLayout from '../components/layout/DashboardLayout'
import RoleGuard from '../components/layout/RoleGuard'
import Toaster from '../components/common/Toaster'
import Home from '../pages/public/Home'
import Services from '../pages/public/Services'
import ServiceDetail from '../pages/public/ServiceDetail'
import ProviderProfile from '../pages/public/ProviderProfile'
import About from '../pages/public/About'
import NotFound from '../pages/public/NotFound'
import Login from '../pages/auth/Login'
import Register from '../pages/auth/Register'
import CustomerDashboard from '../pages/customer/Dashboard'
import CustomerBookings from '../pages/customer/Bookings'
import Favorites from '../pages/customer/Favorites'
import CustomerProfile from '../pages/customer/Profile'
import ProviderDashboard from '../pages/provider/Dashboard'
import ProviderServices from '../pages/provider/Services'
import ProviderBookings from '../pages/provider/Bookings'
import Availability from '../pages/provider/Availability'
import ProviderProfileEdit from '../pages/provider/Profile'
import ProviderPortfolio from '../pages/provider/Portfolio'
import AdminDashboard from '../pages/admin/Dashboard'
import AdminUsers from '../pages/admin/Users'
import AdminServices from '../pages/admin/Services'
import AdminBookings from '../pages/admin/Bookings'
import AdminReports from '../pages/admin/Reports'
import AdminAppearance from '../pages/admin/Appearance'

const area = (role, routes) => (
  <Route path={`/${role}`} element={<RoleGuard role={role}><DashboardLayout role={role} /></RoleGuard>}>
    <Route index element={<Navigate to="dashboard" replace />} />
    {routes.map(([path, El]) => <Route key={path} path={path} element={<El />} />)}
  </Route>
)

export default function App() {
  return (
    <>
      <Routes>
        <Route element={<PublicLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/services" element={<Services />} />
          <Route path="/services/:id" element={<ServiceDetail />} />
          <Route path="/providers/:id" element={<ProviderProfile />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/about" element={<About />} />
          <Route path="*" element={<NotFound />} />
        </Route>
        {area('customer', [['dashboard', CustomerDashboard], ['bookings', CustomerBookings], ['favorites', Favorites], ['profile', CustomerProfile]])}
        {area('provider', [['dashboard', ProviderDashboard], ['services', ProviderServices], ['bookings', ProviderBookings], ['availability', Availability], ['portfolio', ProviderPortfolio], ['profile', ProviderProfileEdit]])}
        {area('admin', [['dashboard', AdminDashboard], ['users', AdminUsers], ['services', AdminServices], ['bookings', AdminBookings], ['reports', AdminReports], ['appearance', AdminAppearance]])}
      </Routes>
      <Toaster />
    </>
  )
}
