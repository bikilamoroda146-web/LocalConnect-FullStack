import { useEffect, useRef, useState } from 'react'
import { NavLink, Link, useNavigate } from 'react-router-dom'
import { Menu, X, LogOut } from 'lucide-react'
import Logo from './Logo'
import Button from '../common/Button'
import ProfileAvatar from '../common/ProfileAvatar'
import { useApp } from '../../app/AppContext'
import { dashboardPath, profilePath } from '../../data/users'

const links = [
  { to: '/services', label: 'Browse services' },
  { to: '/about', label: 'About' },
  { to: '/#how-it-works', label: 'How it works' },
  { to: '/register?role=provider', label: 'Become a provider' },
]

const linkClass = ({ isActive }) => [
  'flex min-h-11 items-center rounded-control px-3 text-sm font-semibold transition-colors',
  isActive
    ? 'bg-brand-50 text-brand-800'
    : 'text-ink-soft hover:bg-slate-100 hover:text-ink',
].join(' ')
const anchorLinkClass = 'flex min-h-11 items-center rounded-control px-3 text-sm font-semibold text-ink-soft transition-colors hover:bg-slate-100 hover:text-ink'

export default function Header() {
  const [open, setOpen] = useState(false)
  const menuRef = useRef(null)
  const toggleRef = useRef(null)
  const { user, logout } = useApp()
  const nav = useNavigate()
  const close = () => setOpen(false)
  const out = () => {
    logout()
    close()
    nav('/')
  }
  const renderLink = (link) => link.to.includes('#')
    ? <Link key={link.to} to={link.to} onClick={close} className={anchorLinkClass}>{link.label}</Link>
    : <NavLink key={link.to} to={link.to} onClick={close} className={linkClass}>{link.label}</NavLink>

  useEffect(() => {
    if (!open) return undefined

    const firstLink = menuRef.current?.querySelector('a, button')
    firstLink?.focus()

    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        setOpen(false)
        toggleRef.current?.focus()
      }
    }
    const onResize = () => {
      if (window.matchMedia('(min-width: 1280px)').matches) setOpen(false)
    }

    document.addEventListener('keydown', onKeyDown)
    window.addEventListener('resize', onResize)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('resize', onResize)
    }
  }, [open])

  const accountLinks = user ? (
    <>
      {profilePath[user.role] && (
        <Link to={profilePath[user.role]} onClick={close} className="flex min-h-11 items-center gap-2 rounded-control px-3 text-sm font-medium text-ink-soft hover:bg-slate-50 hover:text-ink">
          <ProfileAvatar userId={user.id} name={user.name} size={32} />
          <span>Edit profile</span>
        </Link>
      )}
      <Link to={dashboardPath[user.role]} onClick={close} className="flex min-h-11 items-center rounded-control px-3 text-sm font-medium text-ink-soft hover:bg-slate-50 hover:text-ink">
        My dashboard
      </Link>
      <button type="button" onClick={out} className="flex min-h-11 items-center gap-2 rounded-control px-3 text-left text-sm font-medium text-ink-soft hover:bg-slate-50 hover:text-ink">
        <LogOut size={16} aria-hidden="true" /> Sign out
      </button>
    </>
  ) : (
    <>
      <NavLink to="/login" onClick={close} className={linkClass}>Sign in</NavLink>
      <Button to="/register" onClick={close} size="md" className="w-full lg:w-auto">Create account</Button>
    </>
  )

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-canvas/95 backdrop-blur">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-2 focus:z-50 focus:rounded-control focus:bg-white focus:px-3 focus:py-2">
        Skip to content
      </a>
      <div className="container-page flex min-h-16 items-center justify-between gap-3">
        <Logo />
        <nav className="hidden items-center gap-0.5 xl:flex" aria-label="Main navigation">
          {links.map(renderLink)}
        </nav>
        <div className="hidden items-center gap-2 xl:flex">
          {accountLinks}
          <Button to="/services" size="md">Find a service</Button>
        </div>
        <button
          ref={toggleRef}
          type="button"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-control text-ink hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 xl:hidden"
          onClick={() => setOpen((current) => !current)}
          aria-expanded={open}
          aria-controls="mobile-menu"
          aria-label={open ? 'Close navigation menu' : 'Open navigation menu'}
        >
          {open ? <X size={22} aria-hidden="true" /> : <Menu size={22} aria-hidden="true" />}
        </button>
      </div>
      <nav
        id="mobile-menu"
        ref={menuRef}
        aria-label="Mobile navigation"
        aria-hidden={!open}
        className={`${open ? 'block' : 'hidden'} border-t border-line bg-white px-4 pb-5 pt-3 xl:hidden`}
      >
        <div className="container-page flex flex-col gap-1">
          {links.map(renderLink)}
          <div className="mt-2 flex flex-col gap-1 border-t border-line pt-3">
            {accountLinks}
          </div>
          {user && <Button to="/services" onClick={close} size="lg" className="mt-2 w-full">Find a service</Button>}
        </div>
      </nav>
    </header>
  )
}
