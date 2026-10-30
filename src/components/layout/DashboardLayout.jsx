import { useRef, useState } from 'react'
import { NavLink, Outlet, Link, useNavigate } from 'react-router-dom'
import { LayoutDashboard, CalendarCheck, Heart, UserRound, Briefcase, Clock, Users, ListChecks, BarChart3, Menu, X, LogOut, Globe, Images, Image as ImageIcon } from 'lucide-react'
import Logo from './Logo'
import ProfileAvatar from '../common/ProfileAvatar'
import { useApp } from '../../app/AppContext'
import { profilePath } from '../../data/users'
import useDialogFocus from '../../hooks/useDialogFocus'

const NAV = {
  customer: [['dashboard', 'Dashboard', LayoutDashboard], ['bookings', 'My bookings', CalendarCheck], ['favorites', 'Favorites', Heart], ['profile', 'Profile', UserRound]],
  provider: [['dashboard', 'Dashboard', LayoutDashboard], ['services', 'My services', Briefcase], ['bookings', 'Booking requests', CalendarCheck], ['availability', 'Availability', Clock], ['portfolio', 'My Portfolio', Images], ['profile', 'Profile', UserRound]],
  admin: [['dashboard', 'Dashboard', LayoutDashboard], ['users', 'Users', Users], ['services', 'Services', ListChecks], ['bookings', 'Bookings', CalendarCheck], ['reports', 'Reports', BarChart3], ['appearance', 'Homepage appearance', ImageIcon]],
}
export default function DashboardLayout({ role }) {
  const [open, setOpen] = useState(false)
  const drawerRef = useRef(null)
  const { user, logout } = useApp()
  const nav = useNavigate()
  const items = NAV[role]
  useDialogFocus(drawerRef, open, () => setOpen(false))
  const side = (
    <nav aria-label={`${role} navigation`} className="flex h-full flex-col">
      <div className="px-5 py-4"><Logo /></div>
      <p className="px-5 pb-2 text-xs font-semibold capitalize text-ink-muted">{role} area</p>
      {profilePath[role] && <Link to={profilePath[role]} onClick={() => setOpen(false)} className="mx-3 mb-3 flex items-center gap-3 rounded-md border border-line bg-slate-50 p-3 hover:bg-white">
        <ProfileAvatar userId={user.id} name={user.name} size={40} />
        <span className="min-w-0"><span className="block truncate text-sm font-semibold text-ink">{user.name}</span><span className="text-xs text-ink-muted">Edit profile</span></span>
      </Link>}
      <ul className="flex-1 space-y-1 px-3">
        {items.map(([path, label, Icon]) => (
          <li key={path}><NavLink to={`/${role}/${path}`} onClick={() => setOpen(false)}
            className={({ isActive }) => `flex min-h-11 items-center gap-3 rounded-md px-3 text-sm font-medium ${isActive ? 'bg-brand-50 text-brand-800' : 'text-ink-soft hover:bg-slate-100'}`}>
            <Icon size={18} aria-hidden="true" /> {label}</NavLink></li>
        ))}
      </ul>
      <div className="space-y-1 border-t border-line p-3">
        <Link to="/" className="flex min-h-11 items-center gap-3 rounded-md px-3 text-sm text-ink-soft hover:bg-slate-100"><Globe size={18} /> Public site</Link>
        <button onClick={() => { logout(); nav('/') }} className="flex min-h-11 w-full items-center gap-3 rounded-md px-3 text-sm text-ink-soft hover:bg-slate-100"><LogOut size={18} /> Sign out</button>
      </div>
    </nav>
  )
  return (
    <div className="min-h-screen lg:flex">
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 border-r border-line bg-white lg:block">{side}</aside>
      {open && <div className="fixed inset-0 z-40 lg:hidden"><button type="button" className="absolute inset-0 bg-navy/50" onClick={() => setOpen(false)} aria-label="Close navigation" /><aside ref={drawerRef} role="dialog" aria-modal="true" aria-label={`${role} navigation`} tabIndex={-1} className="relative h-full w-72 max-w-[85%] bg-white shadow-lift">{side}</aside></div>}
      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-line bg-white/95 px-4 backdrop-blur sm:px-6">
          <button type="button" className="-ml-2 rounded p-2 lg:hidden" onClick={() => setOpen(!open)} aria-label={open ? 'Close navigation' : 'Open navigation'} aria-expanded={open}>{open ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}</button>
          <p className="hidden text-sm text-ink-muted lg:block">Demo data stored in this browser only</p>
          {profilePath[role]
            ? <Link to={profilePath[role]} className="flex items-center gap-2 rounded-md px-2 py-1 text-sm font-medium hover:bg-slate-50">
              <ProfileAvatar userId={user.id} name={user.name} size={32} />
              <span className="hidden sm:inline">{user.name}</span>
              <span className="sr-only">Edit profile</span>
            </Link>
            : <p className="text-sm font-medium">{user?.name}</p>}
        </header>
        <main id="main" className="mx-auto w-full max-w-6xl p-4 sm:p-6 lg:p-8"><Outlet /></main>
      </div>
    </div>
  )
}
