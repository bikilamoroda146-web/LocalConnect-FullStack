import { useId, useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
export default function PasswordField({ label, error, ...props }) {
  const id = useId()
  const [show, setShow] = useState(false)
  const required = props.required === true
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium">
        {label}{required && <span className="ml-1 text-error" aria-hidden="true">*</span>}
        {required && <span className="sr-only"> (required)</span>}
      </label>
      <div className="relative">
        <input id={id} type={show ? 'text' : 'password'} aria-required={required || undefined} aria-invalid={!!error} aria-describedby={error ? `${id}-e` : undefined} className={`input pr-12 ${error ? 'border-error focus:border-error focus:ring-error/20' : ''}`} {...props} />
        <button type="button" onClick={() => setShow(!show)} aria-label={show ? 'Hide password' : 'Show password'} aria-pressed={show} className="absolute right-1 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded text-ink-muted hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40">{show ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}</button>
      </div>
      {error && <p id={`${id}-e`} role="alert" className="mt-1 text-sm text-red-700">{error}</p>}
    </div>
  )
}
