import type { Attribution } from '../engine/attribution'
import type { HouseholdResult, Platform } from '../engine/types'
import { usd } from '../lib/format'
import { AREA_PHRASE } from './PositionsPanel'
import { Delta } from './Delta'
import { SPENDING_CATEGORIES, resolvedSpending } from '../engine/spending'
import { PLATFORMS } from '../data/platforms'

/** "spend more on X and Y, less on Z" for the spending clause. */
function spendingClause(platform: Platform): string | null {
  const rows = resolvedSpending(platform, PLATFORMS).filter((s) => s.category !== 'deficit')
  const label = (id: string) => SPENDING_CATEGORIES.find((c) => c.id === id)?.label.toLowerCase().replace(' & ', ' and ') ?? id
  const more = rows.filter((s) => s.direction === 'more').map((s) => label(s.category))
  const less = rows.filter((s) => s.direction === 'less').map((s) => label(s.category))
  const deficit = resolvedSpending(platform, PLATFORMS).find((s) => s.category === 'deficit')
  const parts: string[] = []
  if (more.length) parts.push(`spend more on ${list(more)}`)
  if (less.length) parts.push(`less on ${list(less)}`)
  if (parts.length === 0 && !deficit) return null
  let out = parts.length ? parts.join(' and ') : 'leave spending largely unchanged'
  if (deficit && deficit.direction !== 'none') {
    out += deficit.direction === 'more' ? ', and add to the deficit' : deficit.direction === 'less' ? ', and reduce the deficit' : ', with an unscored deficit effect'
  }
  return out
}
function list(xs: string[]): string {
  if (xs.length <= 1) return xs.join('')
  if (xs.length === 2) return `${xs[0]} and ${xs[1]}`
  return `${xs.slice(0, -1).join(', ')}, and ${xs[xs.length - 1]}`
}

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

  const clause = spendingClause(best.platform)
  return (
    <>
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
    {clause && (
      <p className="mt-2 font-serif text-base leading-snug text-ink-3">
        Beyond your paycheck, {best.platform.shortName}'s platform would {clause}. Details and who scored each figure are in the{' '}
        <a href="#beyond-h" className="underline hover:text-ink">
          spending section
        </a>{' '}
        below.
      </p>
    )}
    </>
  )
}
