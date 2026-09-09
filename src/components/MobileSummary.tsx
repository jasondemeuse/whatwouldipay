import type { HouseholdResult, Platform } from '../engine/types'
import { Money } from './Money'
import { Delta } from './Delta'

interface Props {
  baseline: HouseholdResult
  results: Array<{ platform: Platform; result: HouseholdResult }>
}

/** Pinned summary under the desktop breakpoint so the answer stays in view while editing the form. */
export function MobileSummary({ baseline, results }: Props) {
  const ranked = [...results].sort((a, b) => b.result.netIncome - a.result.netIncome)
  const best = ranked[0]
  const worst = ranked[ranked.length - 1]
  return (
    <div className="no-print fixed inset-x-0 bottom-0 z-30 border-t border-rule bg-card/95 backdrop-blur-sm lg:hidden" role="status" aria-live="polite">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-2 text-xs">
        <div>
          <div className="uppercase tracking-wide text-ink-3">Current law</div>
          <Money value={baseline.netIncome} className="text-base font-semibold text-ink" />
        </div>
        {best && (
          <div className="text-right">
            <div className="truncate text-ink-3">Best: {best.platform.shortName}</div>
            <Delta v={best.result.netIncome - baseline.netIncome} animate />
          </div>
        )}
        {worst && worst !== best && (
          <div className="text-right">
            <div className="truncate text-ink-3">Least: {worst.platform.shortName}</div>
            <Delta v={worst.result.netIncome - baseline.netIncome} animate />
          </div>
        )}
      </div>
    </div>
  )
}
