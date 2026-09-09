import { usd } from '../lib/format'
import { MoneyDelta } from './Money'

/**
 * Signed money change with redundant encoding: color, sign, and a glyph, so gain/loss never depends on color alone.
 * `animate` swaps the static text for a NumberFlow transition (use on headline figures, not dense tables).
 */
export function Delta({ v, muted = false, animate = false }: { v: number; muted?: boolean; animate?: boolean }) {
  const zero = Math.abs(v) < 0.5
  const gain = v >= 0
  const color = zero ? 'var(--color-ink-3)' : gain ? 'var(--color-gain)' : 'var(--color-loss)'
  const glyph = zero ? '•' : gain ? '▲' : '▼'
  const label = zero ? 'no change' : gain ? 'gain' : 'loss'
  return (
    <span className={`money inline-flex items-baseline gap-1 whitespace-nowrap ${muted ? 'text-ink-2' : ''}`}>
      <span role="img" aria-label={label} className="text-[0.7em]" style={{ color }}>
        {glyph}
      </span>
      {animate ? <MoneyDelta value={zero ? 0 : v} /> : zero ? usd(0) : usd(v, { sign: true })}
    </span>
  )
}
