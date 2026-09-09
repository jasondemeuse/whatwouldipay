import { usd } from '../lib/format'

/**
 * Signed money change with redundant encoding: color, sign, and a glyph, so gain/loss never depends on color alone.
 */
export function Delta({ v, muted = false }: { v: number; muted?: boolean }) {
  const zero = Math.abs(v) < 0.5
  const gain = v >= 0
  const color = zero ? 'var(--color-ink-3)' : gain ? 'var(--color-gain)' : 'var(--color-loss)'
  const glyph = zero ? '•' : gain ? '▲' : '▼'
  const label = zero ? 'no change' : gain ? 'gain' : 'loss'
  return (
    <span className={`money inline-flex items-baseline gap-1 whitespace-nowrap ${muted ? 'text-ink-2' : ''}`}>
      <span aria-hidden="true" className="text-[0.7em]" style={{ color }}>
        {glyph}
      </span>
      <span className="sr-only">{label} </span>
      {zero ? usd(0) : usd(v, { sign: true })}
    </span>
  )
}
