import { useEffect, useRef, type ReactNode } from 'react'

interface Props {
  /** Accessible name for the dialog. */
  label: string
  onClose: () => void
  /** `drawer` slides in from the right (long reference content); `modal` is centered (focused explanations). */
  variant?: 'drawer' | 'modal'
  children: ReactNode
}

/**
 * Overlay dialog shared by the Positions drawer and the Why modal: locks body scroll, traps Tab focus,
 * closes on Escape or a backdrop click, and returns focus to the opener when it unmounts.
 */
export function Dialog({ label, onClose, variant = 'modal', children }: Props) {
  const panelRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const panel = panelRef.current
    const focusables = () =>
      Array.from(panel?.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])') ?? [])
    // Focus the panel itself first so a screen reader announces the dialog name before its first control.
    panel?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        onClose()
        return
      }
      if (e.key === 'Tab') {
        const els = focusables()
        if (els.length === 0) {
          e.preventDefault()
          return
        }
        const first = els[0]
        const last = els[els.length - 1]
        const active = document.activeElement
        if (e.shiftKey && (active === first || active === panel)) {
          e.preventDefault()
          last.focus()
        } else if (!e.shiftKey && active === last) {
          e.preventDefault()
          first.focus()
        }
      }
    }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prev
      window.removeEventListener('keydown', onKey)
      opener?.focus?.()
    }
    // onClose is memoized by the caller; the dialog remounts per subject anyway.
  }, [onClose])

  const drawer = variant === 'drawer'
  return (
    <div
      className={`fixed inset-0 z-40 flex bg-ink/40 ${drawer ? 'justify-end' : 'items-end justify-center sm:items-center sm:p-6'}`}
      onClick={onClose}
    >
      <div
        ref={panelRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={label}
        onClick={(e) => e.stopPropagation()}
        className={
          drawer
            ? 'h-full w-full max-w-xl overflow-y-auto bg-card shadow-2xl outline-none'
            : 'max-h-[92vh] w-full overflow-y-auto rounded-t-card shadow-2xl outline-none sm:max-w-3xl sm:rounded-card'
        }
      >
        {children}
      </div>
    </div>
  )
}
