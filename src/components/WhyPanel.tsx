import { useState } from 'react'
import type { Attribution, AttributionStep } from '../engine/attribution'
import type { Platform } from '../engine/types'
import { usd } from '../lib/format'
import { AREA_LABEL } from '../lib/labels'
import { Delta } from './Delta'

interface Props {
  platform: Platform
  attribution: Attribution
  onClose: () => void
  onShowPositions: (platformId: string) => void
}

/**
 * "Why this number?", a bridge from current law to the platform's net income, one bar per position,
 * followed by the positions that were applied but didn't touch this household (with the reason).
 */
export function WhyPanel({ platform, attribution, onClose, onShowPositions }: Props) {
  const { baseline, final, steps, noEffect, unmodeled } = attribution
  const total = final.netIncome - baseline.netIncome
  const ordered = [...steps].sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))
  const maxAbs = Math.max(1, ...steps.map((s) => Math.abs(s.delta)))
  const [hover, setHover] = useState<number | null>(null)

  return (
    <section className="viz-root card rounded-t-card border border-rule bg-card p-5 sm:rounded-card">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="font-serif text-lg font-semibold text-ink">Why {usd(final.netIncome)} under {platform.name}?</h2>
          <p className="mt-0.5 text-sm text-ink-2">
            Starting from current law ({usd(baseline.netIncome)}), each position below is applied in turn. Bars show the change to
            money left after taxes and healthcare. Total: <Delta v={total} />.
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          <button type="button" onClick={() => onShowPositions(platform.id)} className="rounded-md border border-rule px-2 py-1 text-xs text-ink-2 hover:bg-paper-2">
            All positions & sources
          </button>
          <button type="button" onClick={onClose} className="rounded-md px-2 py-1 text-xs text-ink-3 hover:bg-paper-2" aria-label="Close">
            ✕
          </button>
        </div>
      </div>

      {ordered.length === 0 ? (
        <p className="mt-4 text-sm text-ink-2">Nothing in this platform changes your household's number; it matches current law.</p>
      ) : (
        <ol className="mt-4 space-y-2" aria-label="Contribution by position">
          {ordered.map((s, i) => (
            <Bar key={i} step={s} maxAbs={maxAbs} hovered={hover === i} onHover={(on) => setHover(on ? i : null)} platform={platform} />
          ))}
        </ol>
      )}

      <div className="mt-4 grid gap-3 text-xs text-ink-3 sm:grid-cols-3">
        <div className="rounded-md bg-paper-2 px-3 py-2">
          <div className="uppercase tracking-wide">Current law</div>
          <div className="money text-sm font-semibold text-ink">{usd(baseline.netIncome)}</div>
        </div>
        <div className="rounded-md bg-paper-2 px-3 py-2">
          <div className="uppercase tracking-wide">Change</div>
          <div className="money text-sm font-semibold text-ink">
            <Delta v={total} />
          </div>
        </div>
        <div className="rounded-md bg-paper-2 px-3 py-2">
          <div className="uppercase tracking-wide">{platform.shortName}</div>
          <div className="money text-sm font-semibold text-ink">{usd(final.netIncome)}</div>
        </div>
      </div>

      {noEffect.length > 0 && (
        <div className="mt-5">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-ink-3">Didn't affect you (and why)</h3>
          <ul className="mt-2 divide-y divide-rule-2 rounded-lg border border-rule">
            {noEffect.map((s, i) => (
              <li key={i} className="grid gap-1 px-3 py-2 text-sm sm:grid-cols-[180px_1fr]">
                <div className="font-medium text-ink">
                  {AREA_LABEL[s.position.area]}
                  {s.source.id !== platform.id && <span className="ml-1 text-xs font-normal text-ink-3">({s.source.shortName} default)</span>}
                </div>
                <div className="text-ink-2">
                  <span className="text-ink-3">{s.position.summary}</span>
                  <span className="mt-0.5 block text-ink">→ {s.zeroReason}</span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {unmodeled.length > 0 && (
        <details className="mt-4 text-sm">
          <summary className="cursor-pointer text-xs font-semibold uppercase tracking-wide text-ink-3">
            On the record, not modeled ({unmodeled.length})
          </summary>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-ink-2">
            {unmodeled.map((u, i) => (
              <li key={i}>
                <span className="font-medium text-ink">{AREA_LABEL[u.position.area]}:</span> {u.position.summary}
              </li>
            ))}
          </ul>
        </details>
      )}

      <p className="mt-4 text-xs text-ink-3">
        Approximate attribution: each bar is the effect of that position given everything applied before it, so interacting positions
        (a bigger credit against a lower tax bill, for example) can shift value between bars. The bars always sum to the total.
      </p>
    </section>
  )
}

function Bar({
  step,
  maxAbs,
  hovered,
  onHover,
  platform,
}: {
  step: AttributionStep
  maxAbs: number
  hovered: boolean
  onHover: (on: boolean) => void
  platform: Platform
}) {
  const gain = step.delta >= 0
  const width = (Math.abs(step.delta) / maxAbs) * 50
  const inherited = step.source.id !== platform.id
  return (
    <li
      className={`grid items-center gap-3 rounded-md px-2 py-1.5 sm:grid-cols-[200px_1fr_110px] ${hovered ? 'bg-paper-2' : ''}`}
      onMouseEnter={() => onHover(true)}
      onMouseLeave={() => onHover(false)}
    >
      <div className="text-sm">
        <div className="font-medium text-ink">{AREA_LABEL[step.position.area]}</div>
        <div className="truncate text-xs text-ink-3" title={step.position.summary}>
          {inherited ? `${step.source.shortName} default · ` : ''}
          {step.position.summary}
        </div>
      </div>
      <div className="relative h-5 w-full" role="img" aria-label={`${AREA_LABEL[step.position.area]}: ${usd(step.delta, { sign: true })}`}>
        <div className="absolute left-1/2 top-0 h-full w-px bg-rule" />
        <div
          className="absolute top-1 h-3"
          style={{
            left: gain ? '50%' : `${50 - width}%`,
            width: `${width}%`,
            background: gain ? 'var(--gain)' : 'var(--loss)',
            borderRadius: gain ? '0 4px 4px 0' : '4px 0 0 4px',
            transition: 'width 250ms var(--ease-out-soft), left 250ms var(--ease-out-soft)',
          }}
        />
      </div>
      <div className="money text-right text-sm font-semibold text-ink">
        <Delta v={step.delta} />
      </div>
      {hovered && (
        <div className="col-span-full rounded-md border border-rule bg-card px-3 py-2 text-xs text-ink-2 shadow-sm">
          <div>{step.position.summary}</div>
          <div className="mt-1 text-ink-3">
            Running total after this step: <span className="money text-ink">{usd(step.netAfter)}</span>
          </div>
        </div>
      )}
    </li>
  )
}
