import { BadgeCheck } from 'lucide-react'
import { STATUS } from '../../utils/bookings'
const tones = {
  green: 'bg-success-50 text-success-800 ring-success-100', amber: 'bg-warning-50 text-warning-900 ring-warning-100',
  blue: 'bg-info-50 text-info-900 ring-info-100', slate: 'bg-slate-100 text-slate-700 ring-slate-200', red: 'bg-error-50 text-error-800 ring-error-100',
}
export const Badge = ({ tone = 'slate', children }) => (
  <span className={`inline-flex items-center rounded-pill px-2.5 py-1 text-xs font-semibold leading-none ring-1 ring-inset ${tones[tone] ?? tones.slate}`}>{children}</span>
)
export const StatusBadge = ({ status }) => <Badge tone={STATUS[status]?.tone}>{STATUS[status]?.label ?? status}</Badge>
export const VerificationBadge = ({ verified }) =>
  verified ? (
    <span className="inline-flex items-center gap-1 text-xs font-semibold text-brand-800" title="Marked as verified in the demo data. No real verification takes place.">
      <BadgeCheck size={16} aria-hidden="true" /> Verified (demo)
    </span>
  ) : (
    <span className="text-xs text-ink-muted">Not yet verified</span>
  )
