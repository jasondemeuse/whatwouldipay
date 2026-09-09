import { useEffect, useState } from 'react'

interface Props {
  url: string
  title: string
}

export function ShareBar({ url, title }: Props) {
  const [copied, setCopied] = useState(false)
  const canShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function'

  useEffect(() => {
    if (!copied) return
    const t = setTimeout(() => setCopied(false), 2000)
    return () => clearTimeout(t)
  }, [copied])

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
    } catch {
      // Fallback: select-and-copy is not available here; show the URL instead.
      window.prompt('Copy this link', url)
    }
  }

  const share = async () => {
    try {
      await navigator.share({ title, text: 'How would each candidate change what my household keeps?', url })
    } catch {
      /* user cancelled */
    }
  }

  return (
    <div className="no-print flex flex-wrap items-center gap-2 text-xs text-ink-3">
      <span>This comparison has its own link.</span>
      <button
        type="button"
        onClick={copy}
        className="rounded-md border border-rule bg-card px-2.5 py-1 font-medium text-ink-2 hover:bg-paper-2"
        aria-live="polite"
      >
        {copied ? 'Copied ✓' : 'Copy link'}
      </button>
      {canShare && (
        <button type="button" onClick={share} className="rounded-md border border-rule bg-card px-2.5 py-1 font-medium text-ink-2 hover:bg-paper-2">
          Share…
        </button>
      )}
      <button type="button" onClick={() => window.print()} className="rounded-md border border-rule bg-card px-2.5 py-1 font-medium text-ink-2 hover:bg-paper-2">
        Print
      </button>
    </div>
  )
}
