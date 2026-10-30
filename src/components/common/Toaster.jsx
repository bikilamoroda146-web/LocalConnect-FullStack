import { CheckCircle2, AlertCircle, X } from 'lucide-react'
import { useApp } from '../../app/AppContext'
export default function Toaster() {
  const { toasts, dismissToast } = useApp()
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-4 z-[60] flex flex-col items-center gap-2 px-4" aria-live="off">
      {toasts.map((t) => (
        <div key={t.id} role={t.tone === 'error' ? 'alert' : 'status'} aria-live={t.tone === 'error' ? 'assertive' : 'polite'} className="pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-md bg-navy px-4 py-3 text-sm text-white shadow-lift">
          {t.tone === 'error' ? <AlertCircle size={18} className="mt-0.5 shrink-0 text-red-300" aria-hidden="true" /> : <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-emerald-300" aria-hidden="true" />}
          <p className="flex-1">{t.message}</p>
          <button type="button" onClick={() => dismissToast(t.id)} aria-label="Dismiss message" className="rounded text-white/70 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"><X size={16} aria-hidden="true" /></button>
        </div>
      ))}
    </div>
  )
}
