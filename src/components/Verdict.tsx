import type { Attribution } from '../engine/attribution'
import type { HouseholdResult, Platform } from '../engine/types'
import { usd } from '../lib/format'
import { AREA_PHRASE } from './PositionsPanel'
import { Delta } from './Delta'

interface Props {
  baseline: HouseholdResult
  results: Array<{ platform: Platform; result: HouseholdResult; attribution: Attribution }>
}

/** The answer as a sentence with the numbers inside it. */
export function Verdict({ baseline, results }: Props) {
  if (results.length === 0) {
    return (
      <p className="font-serif text-lg text-ink-2">
        Under current law your household keeps <span className="money font-semibold text-ink">{usd(baseline.netIncome)}</span> a year after
        federal and state taxes and healthcare. Pick a politician or party above to compare.
      </p>
    )
  }
  const ranked = [...results].sort((a, b) => b.result.netIncome - a.result.netIncome)
  const best = ranked[0]
  const worst = ranked[ranked.length - 1]
  const bestDelta = best.result.netIncome - baseline.netIncome
  const worstDelta = worst.result.netIncome - baseline.netIncome
  const topLever = [...best.attribution.steps].sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))[0]
  const allSame = results.every((r) => Math.abs(r.result.netIncome - baseline.netIncome) < 1)

  if (allSame) {
    return (
      <p className="font-serif text-lg leading-snug text-ink-2">
        None of the selected platforms changes what your household keeps: <span className="money font-semibold text-ink">{usd(baseline.netIncome)}</span>{' '}
        a year either way. Open <em>Why?</em> on any card to see which thresholds you don't reach.
      </p>
    )
  }

  return (
    <p className="font-serif text-lg leading-snug text-ink-2">
      Compared with current law (<span className="money font-semibold text-ink">{usd(baseline.netIncome)}</span> a year), your household would keep
      the most under <span className="font-semibold text-ink">{best.platform.name}</span> (<Delta v={bestDelta} animate />
      {topLever && bestDelta > 0 ? <>, mostly from {AREA_PHRASE[topLever.position.area]}</> : null})
      {results.length > 1 && (
        <>
          {' '}
          and {worstDelta > 0 ? 'the smallest gain' : worstDelta < 0 ? 'the biggest loss' : 'no change'} under{' '}
          <span className="font-semibold text-ink">{worst.platform.name}</span> (<Delta v={worstDelta} animate />)
        </>
      )}
      .
    </p>
  )
}
