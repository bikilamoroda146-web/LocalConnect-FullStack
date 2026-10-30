import { useEffect, useRef } from 'react'

const FOCUSABLE_SELECTOR = 'a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"])'

export default function useDialogFocus(ref, open, onClose, lockScroll = false) {
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose

  useEffect(() => {
    if (!open || !ref.current) return

    const dialog = ref.current
    const previousFocus = document.activeElement
    const previousOverflow = document.body.style.overflow
    if (lockScroll) document.body.style.overflow = 'hidden'
    const getFocusable = () => [...dialog.querySelectorAll(FOCUSABLE_SELECTOR)]
      .filter((element) => !element.disabled && element.getAttribute('aria-hidden') !== 'true' && element.getClientRects().length > 0)
    const focusable = getFocusable()
    const initialFocus = focusable[0] ?? dialog
    initialFocus.focus()

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        onCloseRef.current()
        return
      }
      if (event.key !== 'Tab') return

      const currentFocusable = getFocusable()
      if (!currentFocusable.length) {
        event.preventDefault()
        dialog.focus()
        return
      }
      const first = currentFocusable[0]
      const last = currentFocusable[currentFocusable.length - 1]
      if (event.shiftKey && (document.activeElement === first || !dialog.contains(document.activeElement))) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && (document.activeElement === last || !dialog.contains(document.activeElement))) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      if (lockScroll) document.body.style.overflow = previousOverflow
      previousFocus?.focus?.()
    }
  }, [open, lockScroll, ref])
}
