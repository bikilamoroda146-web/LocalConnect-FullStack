import { Navigate, useLocation } from 'react-router-dom'
import { useApp } from '../../app/AppContext'
import { dashboardPath } from '../../data/users'
// UI convenience only. Real access control must be enforced by a backend.
export default function RoleGuard({ role, children }) {
  const { user, authLoading } = useApp()
  const loc = useLocation()
  if (authLoading) return <div className="container-page py-16 text-center text-sm text-ink-soft">Restoring your session…</div>
  if (!user) return <Navigate to="/login" state={{ from: loc.pathname }} replace />
  if (user.role !== role) return <Navigate to={dashboardPath[user.role]} replace />
  return children
}
