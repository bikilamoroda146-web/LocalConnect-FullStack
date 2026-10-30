import Button from './Button'
export function EmptyState({ icon: Icon, title, text, actionLabel, actionTo, onAction }) {
  return (
    <div className="card flex flex-col items-center px-6 py-12 text-center">
      {Icon && <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-brand-50 text-brand-800"><Icon size={24} aria-hidden="true" /></span>}
      <h3 className="text-lg font-semibold">{title}</h3>
      {text && <p className="mt-1 max-w-md text-ink-soft">{text}</p>}
      {actionLabel && <Button className="mt-5" to={actionTo} onClick={onAction}>{actionLabel}</Button>}
    </div>
  )
}
export const Skeleton = ({ className = '' }) => <div className={`animate-pulse rounded bg-slate-200/70 ${className}`} aria-hidden="true" />
export const CardSkeleton = () => (
  <div className="card p-4" aria-hidden="true"><Skeleton className="h-36 w-full" /><Skeleton className="mt-4 h-4 w-3/4" /><Skeleton className="mt-2 h-4 w-1/2" /><Skeleton className="mt-4 h-9 w-full" /></div>
)
