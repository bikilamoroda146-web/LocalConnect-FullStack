import { useId, useRef } from 'react'
import { X } from 'lucide-react'
import Button from './Button'
import useDialogFocus from '../../hooks/useDialogFocus'

export default function Modal({ open, onClose, title, children, footer }) {
  const ref = useRef(null)
  const titleId = useId()
  useDialogFocus(ref, open, onClose, true)
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-navy/50 p-0 sm:items-center sm:p-4" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div ref={ref} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby={titleId}
        className="max-h-[92vh] w-full overflow-y-auto rounded-t-panel bg-surface shadow-lift focus:outline-none sm:max-w-lg sm:rounded-panel">
        <div className="flex items-start justify-between gap-4 border-b border-line px-5 py-4">
          <h2 id={titleId} className="text-lg font-semibold">{title}</h2>
          <button type="button" onClick={onClose} aria-label="Close dialog" className="-m-2 rounded p-2 text-ink-muted hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50"><X size={20} aria-hidden="true" /></button>
        </div>
        <div className="px-5 py-4">{children}</div>
        {footer && <div className="flex flex-col-reverse gap-2 border-t border-line px-5 py-4 sm:flex-row sm:justify-end">{footer}</div>}
      </div>
    </div>
  )
}

export function ConfirmDialog({ open, onClose, onConfirm, title, message, confirmLabel = 'Confirm', danger }) {
  return (
    <Modal open={open} onClose={onClose} title={title}
      footer={<><Button variant="secondary" onClick={onClose}>Keep as is</Button>
        <Button variant={danger ? 'danger' : 'primary'} onClick={() => { onConfirm(); onClose() }}>{confirmLabel}</Button></>}>
      <p className="text-ink-soft">{message}</p>
    </Modal>
  )
}
