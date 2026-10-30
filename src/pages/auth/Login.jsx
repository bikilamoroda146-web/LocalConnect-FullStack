import { useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import AuthShell from './AuthShell'
import Field from '../../components/common/Field'
import PasswordField from '../../components/forms/PasswordField'
import Button from '../../components/common/Button'
import { useApp } from '../../app/AppContext'
import { dashboardPath } from '../../data/users'
import { isEmail } from '../../utils/validation'

export default function Login() {
  const { login, toast } = useApp()
  const nav = useNavigate()
  const from = useLocation().state?.from
  const [f, setF] = useState({ email: '', password: '' })
  const [err, setErr] = useState({})
  const [loading, setLoading] = useState(false)
  const [formErr, setFormErr] = useState('')
  const submitLock = useRef(false)
  const set = (key) => (e) => {
    setF((current) => ({ ...current, [key]: e.target.value }))
    setErr((current) => {
      if (!current[key]) return current
      const next = { ...current }
      delete next[key]
      return next
    })
    setFormErr('')
  }
  const submit = (e) => {
    e.preventDefault()
    if (submitLock.current) return
    const errors = {}
    if (!isEmail(f.email)) errors.email = 'Enter a valid email address.'
    if (f.password.length < 6) errors.password = 'Password must be at least 6 characters.'
    setErr(errors); setFormErr('')
    if (Object.keys(errors).length) return
    submitLock.current = true
    setLoading(true)
    login(f.email, f.password).then((r) => {
      if (!r.ok) return setFormErr(r.error)
      toast(`Welcome back, ${r.user.name.split(' ')[0]}.`)
      nav(from && from.startsWith(`/${r.user.role}`) ? from : from && !from.match(/^\/(customer|provider|admin)/) ? from : dashboardPath[r.user.role], { replace: true })
    }).catch((error) => setFormErr(`Sign in failed: ${error.message}`)).finally(() => {
      submitLock.current = false
      setLoading(false)
    })
  }
  return (
    <AuthShell title="Sign in" text="Welcome back. Sign in to manage your bookings." footer={<>New to LocalConnect? <Link className="font-semibold text-brand-800 hover:underline" to="/register">Create an account</Link></>}>
      <form onSubmit={submit} noValidate className="space-y-4">
        {formErr && <p role="alert" className="rounded-md bg-red-50 p-3 text-sm text-red-800">{formErr}</p>}
        <Field label="Email" type="email" autoComplete="email" value={f.email} onChange={set('email')} error={err.email} required disabled={loading} />
        <PasswordField label="Password" autoComplete="current-password" value={f.password} onChange={set('password')} error={err.password} required disabled={loading} />
        <Button type="submit" size="lg" className="w-full" loading={loading}>{loading ? 'Signing in…' : 'Sign in'}</Button>
      </form>
      <p className="mt-6 border-t border-line pt-4 text-sm text-ink-muted">Sign in with an account registered on the LocalConnect backend.</p>
    </AuthShell>
  )
}
