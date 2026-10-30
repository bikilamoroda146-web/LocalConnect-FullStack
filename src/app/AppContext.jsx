import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { seedUsers } from '../data/users'
import { seedServices } from '../data/services'
import { seedBookings } from '../data/bookings'
import { seedReviews, seedReports } from '../data/reviews'
import { providers as seedProviders } from '../data/providers'
import { load, save, clearAll } from '../utils/storage'
import { canTransition } from '../utils/bookings'
import { TODAY } from '../utils/format'
import { removeServiceImage } from '../utils/serviceImages'
import { fetchCurrentUser, loginAccount, logoutAccount, registerAccount } from '../api/auth'
import { createBookingRequest, fetchBookings, normalizeBooking } from '../api/bookings'
import { createServiceRequest } from '../api/services'
import { decideProvider, fetchPendingProviders } from '../api/admin'

const Ctx = createContext(null)
export const useApp = () => useContext(Ctx)

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
const defaultAvailability = () =>
  Object.fromEntries(DAYS.map((d, i) => [d, { on: i < 5, slots: [{ start: '09:00', end: '17:00' }] }]))

function appUserFromApi(apiUser) {
  if (!apiUser) return null
  return {
    ...apiUser,
    role: apiUser.role.toLowerCase(),
    status: apiUser.status.toLowerCase(),
    joined: apiUser.createdAt?.slice(0, 10),
    providerId: apiUser.providerProfile?.id,
  }
}

function usePersisted(key, initial, onSaveError) {
  const [v, setV] = useState(() => load(key, initial))
  useEffect(() => {
    if (!save(key, v)) onSaveError()
  }, [key, v, onSaveError])
  return [v, setV]
}

export function AppProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const toast = useCallback((message, tone = 'success') => {
    const id = Math.random().toString(36).slice(2)
    setToasts((current) => [...current, { id, message, tone }])
    setTimeout(() => setToasts((current) => current.filter((item) => item.id !== id)), 4000)
  }, [])
  const onPersistenceError = useCallback(() => {
    toast('Some changes could not be saved in this browser. Check available storage and try again.', 'error')
  }, [toast])
  const [users, setUsers] = usePersisted('users', seedUsers, onPersistenceError)
  const [services, setServices] = usePersisted('services', seedServices, onPersistenceError)
  const [bookings, setBookings] = usePersisted('bookings', seedBookings, onPersistenceError)
  const [providers, setProviders] = usePersisted('providers', seedProviders, onPersistenceError)
  const [portfolios, setPortfolios] = usePersisted('portfolios', {}, onPersistenceError)
  const [favorites, setFavorites] = usePersisted('favorites', ['p1', 's2'], onPersistenceError)
  const [recent, setRecent] = usePersisted('recent', [], onPersistenceError)
  const [availability, setAvailability] = usePersisted('availability', { p1: defaultAvailability() }, onPersistenceError)
  const [reports, setReports] = usePersisted('reports', seedReports, onPersistenceError)
  const [activity, setActivity] = usePersisted('activity', [], onPersistenceError)
  const [user, setUser] = useState(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [remoteBookings, setRemoteBookings] = useState([])
  const [remoteServices, setRemoteServices] = useState([])
  const [pendingProviders, setPendingProviders] = useState([])

  useEffect(() => {
    let active = true
    fetchCurrentUser()
      .then((apiUser) => { if (active) setUser(appUserFromApi(apiUser)) })
      .catch(() => { if (active) setUser(null) })
      .finally(() => { if (active) setAuthLoading(false) })
    return () => { active = false }
  }, [])

  useEffect(() => {
    if (!user) {
      setRemoteBookings([])
      return undefined
    }
    let active = true
    fetchBookings()
      .then((items) => { if (active) setRemoteBookings(items.map(normalizeBooking)) })
      .catch(() => { if (active) setRemoteBookings([]) })
    return () => { active = false }
  }, [user])

  useEffect(() => {
    if (user?.role !== 'admin') { setPendingProviders([]); return undefined }
    let active = true
    fetchPendingProviders().then((items) => { if (active) setPendingProviders(items) }).catch(() => { if (active) setPendingProviders([]) })
    return () => { active = false }
  }, [user])

  useEffect(() => {
    if (user?.role !== 'provider') setRemoteServices([])
  }, [user])

  const dismissToast = (id) => setToasts((t) => t.filter((x) => x.id !== id))
  const log = (text) => setActivity((a) => [{ id: Date.now() + Math.random(), text, at: new Date().toISOString() }, ...a].slice(0, 20))

  // ---- backend authentication ----
  const login = async (email, password) => {
    try {
      const result = await loginAccount(email, password)
      const nextUser = appUserFromApi(result.user)
      setUser(nextUser)
      return { ok: true, user: nextUser }
    } catch (error) {
      return { ok: false, error: error.message }
    }
  }
  const register = async ({ name, email, password, role }) => {
    try {
      const result = await registerAccount({ name, email, password, role })
      const nextUser = appUserFromApi(result.user)
      if (result.authenticated) setUser(nextUser)
      return { ok: true, authenticated: result.authenticated, user: nextUser }
    } catch (error) {
      return { ok: false, error: error.message }
    }
  }
  const logout = async () => {
    try { await logoutAccount() } finally { setUser(null) }
  }

  const createDatabaseBooking = async (input) => {
    const booking = normalizeBooking(await createBookingRequest(input))
    setRemoteBookings((current) => [booking, ...current.filter((item) => item.id !== booking.id)])
    toast('Booking request sent. The provider can accept or decline it.')
    return booking
  }

  const reviewProvider = async (providerId, decision) => {
    const updated = await decideProvider(providerId, decision)
    setPendingProviders((current) => current.filter((provider) => provider.id !== providerId))
    toast(`Provider ${decision === 'approve' ? 'approved' : 'rejected'}.`)
    return updated
  }

  // ---- favorites / recent ----
  const isFavorite = (key) => favorites.includes(key)
  const toggleFavorite = (key) => {
    const has = favorites.includes(key)
    setFavorites((f) => (has ? f.filter((k) => k !== key) : [...f, key]))
    toast(has ? 'Removed from favorites' : 'Saved to favorites')
  }
  const markViewed = useCallback((key) => setRecent((r) => [key, ...r.filter((k) => k !== key)].slice(0, 6)), [setRecent])

  // ---- bookings ----
  const createBooking = ({ serviceId, date, time, note }) => {
    const s = services.find((x) => x.id === serviceId)
    if (!s) throw new Error('This service is not available in the demo data.')
    const id = `BK-${1000 + bookings.length + 1 + Math.floor(Math.random() * 90)}`
    setBookings((b) => [{ id, serviceId, providerId: s.providerId, customerId: user.id, date, time, note, status: 'pending', created: TODAY, updated: TODAY }, ...b])
    log(`Requested “${s.title}” for ${date}`)
    toast('Booking request sent. The provider can accept or decline it.')
    return id
  }
  const changeBookingStatus = (id, to, actor) => {
    const b = bookings.find((x) => x.id === id)
    if (!b || !canTransition(b.status, to, actor)) { toast('That change is not allowed for this booking.', 'error'); return false }
    setBookings((all) => all.map((x) => (x.id === id ? { ...x, status: to, updated: TODAY } : x)))
    log(`Booking ${id} marked ${to}`)
    toast(`Booking ${to === 'rejected' ? 'declined' : to}.`)
    return true
  }
  const rescheduleBooking = (id, date, time) => {
    setBookings((all) => all.map((x) => (x.id === id ? { ...x, date, time, status: 'pending', updated: TODAY } : x)))
    log(`Rescheduled ${id}`)
    toast('New time requested. The provider needs to confirm again.')
  }

  // ---- provider services ----
  const saveService = async (data) => {
    if (data.id) setServices((s) => s.map((x) => (x.id === data.id
      ? { ...x, ...data, updated: TODAY }
      : x)))
    else {
      const saved = await createServiceRequest(data)
      setRemoteServices((current) => [saved, ...current.filter((item) => item.id !== saved.id)])
      toast('Service published')
      return saved
    }
    toast('Service saved')
    return data
  }
  const togglePublish = (id) => {
    const s = services.find((x) => x.id === id)
    if (!s) {
      toast('That service could not be found.', 'error')
      return
    }
    setServices((all) => all.map((x) => (x.id === id ? { ...x, published: !x.published, updated: TODAY } : x)))
    toast(s.published ? 'Unpublished' : 'Published')
  }
  const deleteService = (id) => {
    const service = services.find((item) => item.id === id)
    if (!service) {
      toast('That service could not be found.', 'error')
      return
    }
    setServices((s) => s.filter((x) => x.id !== id))
    removeServiceImage(service.image).catch(() => {})
    toast('Service deleted')
  }

  const updateProvider = (id, patch) => {
    const next = providers.map((x) => (x.id === id ? { ...x, ...patch } : x))
    if (!save('providers', next)) return false
    setProviders(next)
    toast('Profile saved')
    return true
  }
  const updateUser = (id, patch) => {
    const next = users.map((x) => (x.id === id ? { ...x, ...patch } : x))
    if (!save('users', next)) return false
    setUsers(next)
    return true
  }
  const savePortfolio = (providerId, portfolio) => {
    if (user?.role !== 'provider' || user.providerId !== providerId) return false
    const current = portfolios && typeof portfolios === 'object' && !Array.isArray(portfolios) ? portfolios : {}
    const next = { ...current, [providerId]: portfolio }
    if (!save('portfolios', next)) return false
    setPortfolios(next)
    toast('Portfolio saved in this browser.')
    return true
  }
  const saveAvailability = (pid, value) => { setAvailability((a) => ({ ...a, [pid]: value })); toast('Availability saved') }
  const getAvailability = (pid) => availability[pid] ?? defaultAvailability()
  const resolveReport = (id) => { setReports((r) => r.map((x) => (x.id === id ? { ...x, status: 'resolved' } : x))); toast('Report resolved') }
  const resetDemo = () => {
    if (!clearAll()) {
      toast('Demo data could not be cleared from this browser.', 'error')
      return
    }
    window.location.assign('/')
  }

  const value = {
    user, users, services: user?.role === 'provider' ? [...remoteServices, ...services] : services, bookings: [...remoteBookings, ...bookings], providers, portfolios, pendingProviders, reviews: seedReviews, favorites, recent, reports, activity, toasts, DAYS,
    toast, dismissToast, login, register, logout, isFavorite, toggleFavorite, markViewed,
    createBooking, createDatabaseBooking, reviewProvider, changeBookingStatus, rescheduleBooking, saveService, togglePublish, deleteService,
    updateProvider, updateUser, savePortfolio, saveAvailability, getAvailability, resolveReport, resetDemo, setUsers, setServices,
    authLoading,
    providerOf: (id) => providers.find((p) => p.id === id) ?? (user?.providerProfile?.id === id ? { ...user.providerProfile, userId: user.id, name: user.name, rating: 0, reviews: 0, hue: 160 } : undefined),
    serviceOf: (id) => services.find((s) => s.id === id),
    userOf: (id) => users.find((u) => u.id === id),
  }
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}
