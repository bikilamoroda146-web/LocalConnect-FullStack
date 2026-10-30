import { Link } from 'react-router-dom'
const variants = {
  primary: 'bg-brand text-white shadow-sm hover:bg-brand-700 hover:shadow focus-visible:ring-brand/40',
  secondary: 'border border-line bg-surface text-ink hover:border-slate-300 hover:bg-slate-50 focus-visible:ring-brand/30',
  dark: 'bg-navy text-white hover:bg-navy-700',
  ghost: 'text-ink-soft hover:bg-slate-100',
  danger: 'bg-error text-white shadow-sm hover:bg-error-700 hover:shadow',
  light: 'bg-white text-brand-800 hover:bg-brand-50',
}
const sizes = { sm: 'px-3 py-2 text-sm min-h-10', md: 'px-4 py-2.5 text-sm min-h-11', lg: 'px-5 py-3 text-base min-h-12' }

export default function Button({ as, to, variant = 'primary', size = 'md', className = '', loading, disabled, children, ...rest }) {
  const cls = `inline-flex items-center justify-center gap-2 rounded-control font-semibold transition-all duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 active:translate-y-px disabled:cursor-not-allowed disabled:opacity-60 ${variants[variant]} ${sizes[size]} ${className}`
  if (to) return <Link to={to} className={cls} {...rest}>{children}</Link>
  const Tag = as || 'button'
  return (
    <Tag className={cls} disabled={loading || disabled} aria-busy={loading || undefined} {...(Tag === 'button' ? { type: rest.type || 'button' } : {})} {...rest}>
      {loading && <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" aria-hidden="true" />}
      {children}
    </Tag>
  )
}
