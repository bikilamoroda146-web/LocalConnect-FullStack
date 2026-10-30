import { useId } from 'react'
export default function Field({ label, error, hint, as: Tag = 'input', children, className = '', ...props }) {
  const id = useId()
  const describedBy = [hint ? `${id}-hint` : null, error ? `${id}-err` : null].filter(Boolean).join(' ') || undefined
  const required = props.required === true
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-ink">
        {label}{required && <span className="ml-1 text-error" aria-hidden="true">*</span>}
        {required && <span className="sr-only"> (required)</span>}
      </label>
      <Tag id={id} aria-required={required || undefined} aria-invalid={!!error} aria-describedby={describedBy} className={`input ${error ? 'border-error focus:border-error focus:ring-error/20' : ''}`} {...props}>{children}</Tag>
      {hint && <p id={`${id}-hint`} className="mt-1 text-sm text-ink-muted">{hint}</p>}
      {error && <p id={`${id}-err`} role="alert" className="mt-1 text-sm text-error-700">{error}</p>}
    </div>
  )
}
