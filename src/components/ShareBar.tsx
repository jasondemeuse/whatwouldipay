import { useEffect, useState, type RefObject } from 'react'

interface Props {
  url: string
  title: string
  /** Off-screen node to rasterize for "Save as image". */
  imageNode?: RefObject<HTMLDivElement | null>
  imageName?: string
  /** `lg` for the simple flow: bigger buttons, no lead-in sentence. */
  size?: 'sm' | 'lg'
}

export function ShareBar({ url, title, imageNode, imageName = 'what-would-i-pay.png', size = 'sm' }: Props) {
  const btn =
    size === 'lg'
      ? 'min-h-11 rounded-lg border border-rule bg-card px-4 text-base font-medium text-ink hover:bg-paper-2'
      : 'rounded-md border border-rule bg-card px-2.5 py-1 font-medium text-ink-2 hover:bg-paper-2'
  const [copied, setCopied] = useState(false)
  const [busy, setBusy] = useState(false)
  const canShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function'

  const saveImage = async () => {
    const node = imageNode?.current
    if (!node) return
    setBusy(true)
    try {
      const { domToBlob } = await import('modern-screenshot')
      const blob = await domToBlob(node, { scale: 1, width: 1200, height: 630, backgroundColor: '#faf9f6' })
      if (!blob) throw new Error('no image')
      const file = new File([blob], imageName, { type: 'image/png' })
      if (canShare && navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title, url })
      } else {
        const a = document.createElement('a')
        a.href = URL.createObjectURL(blob)
        a.download = imageName
        a.click()
        setTimeout(() => URL.revokeObjectURL(a.href), 5000)
      }
    } catch {
      /* cancelled or unsupported */
    } finally {
      setBusy(false)
    }
  }

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
    <div className={`no-print flex flex-wrap items-center gap-2 text-ink-3 ${size === 'lg' ? 'text-base' : 'text-xs'}`}>
      {size === 'sm' && <span>This comparison has its own link.</span>}
      <button
        type="button"
        onClick={copy}
        className={btn}
        aria-live="polite"
      >
        {copied ? 'Copied ✓' : 'Copy link'}
      </button>
      {canShare && (
        <button type="button" onClick={share} className={btn}>
          Share…
        </button>
      )}
      {imageNode && (
        <button
          type="button"
          onClick={saveImage}
          disabled={busy}
          className={`${btn} disabled:opacity-60`}
        >
          {busy ? 'Rendering…' : 'Save as image'}
        </button>
      )}
      <button type="button" onClick={() => window.print()} className={btn}>
        Print
      </button>
    </div>
  )
}
