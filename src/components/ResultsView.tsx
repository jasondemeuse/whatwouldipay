import { useState } from 'react'
import type { HouseholdResult, Platform } from '../engine/types'
import { usd, pct } from '../lib/format'
import { Delta } from './Delta'
import { Avatar } from './Avatar'
import { Money } from './Money'

type SortMode = 'impact' | 'selection' | 'name'

interface Props {
  baseline: HouseholdResult
  results: Array<{ platform: Platform; result: HouseholdResult }>
  onShowPositions: (platformId: string) => void
  onExplain: (platformId: string) => void
  explaining: string | null
  whyPanel: React.ReactNode
}

const COVERAGE_LABEL: Record<string, string> = {
  employer: 'Employer plan',
  marketplace: 'ACA marketplace',
  medicaid: 'Medicaid',
  medicare: 'Medicare',
  uninsured: 'Uninsured',
  singlePayer: 'Single payer',
  coverageGap: 'Coverage gap (uninsured)',
}

export function ResultsView({ baseline, results, onShowPositions, onExplain, explaining, whyPanel }: Props) {
  const [expanded, setExpanded] = useState<string | null>(null)
  const [sort, setSort] = useState<SortMode>('impact')
  const sorted = [...results].sort((a, b) => {
    if (sort === 'impact') return b.result.netIncome - a.result.netIncome
    if (sort === 'name') return a.platform.name.localeCompare(b.platform.name)
    return 0
  })
  const rows = [{ platform: null as Platform | null, result: baseline }, ...sorted]
  const maxAbsDelta = Math.max(1, ...results.map((r) => Math.abs(r.result.netIncome - baseline.netIncome)))

  return (
    <div className="space-y-6">
      {results.length > 1 && (
        <div className="no-print flex items-center justify-end gap-2 text-xs text-ink-3">
          <span id="sort-label">Order</span>
          <div role="radiogroup" aria-labelledby="sort-label" className="inline-flex rounded-md border border-rule bg-card p-0.5">
            {(
              [
                ['impact', 'By what you keep'],
                ['selection', 'As selected'],
                ['name', 'By name'],
              ] as Array<[SortMode, string]>
            ).map(([mode, label]) => (
              <button
                key={mode}
                type="button"
                role="radio"
                aria-checked={sort === mode}
                onClick={() => setSort(mode)}
                className={`rounded px-2 py-0.5 font-medium transition-colors ${sort === mode ? 'bg-ink text-card' : 'text-ink-2 hover:bg-paper-2'}`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      )}
      {/* Headline cards */}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {rows.map(({ platform, result }) => {
          const delta = result.netIncome - baseline.netIncome
          const isBase = platform === null
          return (
            <div
              key={result.platformId}
              className={`card rounded-card border p-4 ${isBase ? 'border-ink/30 bg-paper-2/60' : 'border-rule bg-card'}`}
            >
              <div className="flex items-center gap-2.5">
                {platform ? (
                  <Avatar platform={platform} size={40} />
                ) : (
                  <span aria-hidden="true" className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-dashed border-ink-4 text-xs font-semibold text-ink-3">
                    Now
                  </span>
                )}
                <div className="min-w-0">
                  <div className="text-sm font-semibold leading-tight text-ink">{platform ? platform.name : 'Current law (2026)'}</div>
                  <div className="line-clamp-2 text-xs leading-snug text-ink-3">{platform ? platform.role : 'Baseline after the 2025 tax law'}</div>
                </div>
              </div>
              <div className="mt-3">
                <div className="text-xs uppercase tracking-wide text-ink-3">Money left after taxes & healthcare</div>
                <Money value={result.netIncome} className="block text-2xl font-semibold tracking-tight text-ink" />
                {!isBase && (
                  <div className="mt-1 text-sm font-semibold text-ink">
                    <Delta v={delta} animate /> <span className="font-normal text-ink-2">vs. current law</span>
                    <span className="money ml-1 font-normal text-ink-3">
                      ({delta >= 0 ? '+' : '−'}{usd(Math.abs(delta) / 12)}/mo)
                    </span>
                  </div>
                )}
              </div>
              {!isBase && (
                <div className="mt-3 h-2 w-full overflow-hidden rounded bg-paper-2">
                  <div className="relative h-full w-full">
                    <div className="absolute left-1/2 top-0 h-full w-px bg-rule" />
                    <div
                      className="absolute top-0 h-full"
                      style={{
                        background: delta >= 0 ? 'var(--gain)' : 'var(--loss)',
                        transition: 'width 250ms var(--ease-out-soft), left 250ms var(--ease-out-soft)',
                        left: delta >= 0 ? '50%' : `${50 - (Math.abs(delta) / maxAbsDelta) * 50}%`,
                        width: `${(Math.abs(delta) / maxAbsDelta) * 50}%`,
                      }}
                    />
                  </div>
                </div>
              )}
              <div className="mt-3 flex items-center justify-between gap-2 text-xs text-ink-3">
                <span>
                  Coverage: <span className="font-medium text-ink-2">{COVERAGE_LABEL[result.effectiveCoverage] ?? result.effectiveCoverage}</span>
                </span>
                {platform && (
                  <span className="flex shrink-0 gap-1">
                    <button
                      type="button"
                      onClick={() => onExplain(platform.id)}
                      aria-pressed={explaining === platform.id}
                      aria-label={`Why this number for ${platform.name}`}
                      className={`rounded-md border px-2 py-0.5 text-xs transition-colors ${
                        explaining === platform.id ? 'border-ink bg-ink text-card' : 'border-rule text-ink-2 hover:bg-paper-2'
                      }`}
                    >
                      Why?
                    </button>
                    <button
                      type="button"
                      onClick={() => onShowPositions(platform.id)}
                      aria-label={`Positions and sources for ${platform.name}`}
                      className="rounded-md border border-rule px-2 py-0.5 text-xs text-ink-2 hover:bg-paper-2"
                    >
                      Positions
                    </button>
                  </span>
                )}
              </div>
              {result.warnings.length > 0 && (
                <ul className="mt-2 space-y-1">
                  {result.warnings.map((w, i) => (
                    <li key={i} className="rounded bg-caution-2 px-2 py-1 text-xs text-ink-2">
                      {w}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )
        })}
      </div>

      {whyPanel}

      {/* Comparison table */}
      <div className="card overflow-x-auto rounded-card border border-rule bg-card">
        <table className="w-full min-w-[640px] text-sm">
          <thead className="bg-paper-2 text-left text-xs uppercase tracking-wide text-ink-3">
            <tr>
              <th className="px-4 py-2 font-semibold">Line</th>
              {rows.map(({ platform, result }) => (
                <th key={result.platformId} className="px-4 py-2 text-right font-semibold">
                  {platform ? platform.shortName : 'Current law'}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="money divide-y divide-rule-2">
            <Row label="Gross income" rows={rows} get={(r) => r.grossIncome} />
            <Row label="Federal income tax (after credits)" rows={rows} get={(r) => r.federalIncomeTax} cost baselineRow={baseline} />
            <Row label="Payroll taxes (Social Security + Medicare)" rows={rows} get={(r) => r.payrollTax} cost baselineRow={baseline} />
            <Row label="State income tax (approx.)" rows={rows} get={(r) => r.stateIncomeTax} cost baselineRow={baseline} />
            <Row label="Healthcare (premiums + typical out-of-pocket)" rows={rows} get={(r) => r.healthcareCost} cost baselineRow={baseline} />
            <Row label="Tariff cost passed to consumers (est.)" rows={rows} get={(r) => r.tariffCost} cost baselineRow={baseline} />
            <tr className="bg-paper-2 font-semibold">
              <td className="px-4 py-2">Net income</td>
              {rows.map(({ result }) => (
                <td key={result.platformId} className="px-4 py-2 text-right">
                  {usd(result.netIncome)}
                </td>
              ))}
            </tr>
            <tr className="text-xs text-ink-3">
              <td className="px-4 py-2">Effective federal rate (income + payroll)</td>
              {rows.map(({ result }) => (
                <td key={result.platformId} className="px-4 py-2 text-right">
                  {pct(result.effectiveFederalRate)}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>

      {/* Per-platform breakdown */}
      <div className="space-y-2">
        <div className="text-xs font-semibold uppercase tracking-wide text-ink-3">Line-item detail</div>
        {rows.map(({ platform, result }) => {
          const id = result.platformId
          const open = expanded === id
          return (
            <div key={id} className="rounded-lg border border-rule bg-card">
              <button
                type="button"
                onClick={() => setExpanded(open ? null : id)}
                className="flex w-full items-center justify-between px-4 py-2 text-left text-sm font-medium text-ink hover:bg-paper-2"
              >
                <span>{platform ? platform.name : 'Current law (2026)'}</span>
                <span className="text-ink-4">{open ? '−' : '+'}</span>
              </button>
              {open && (
                <dl className="money grid grid-cols-[1fr_auto] gap-x-4 gap-y-1 border-t border-rule-2 px-4 py-3 text-sm">
                  <Dt>AGI</Dt>
                  <Dd>{usd(result.agi)}</Dd>
                  <Dt>Taxable income</Dt>
                  <Dd>{usd(result.taxableIncome)}</Dd>
                  {result.breakdown.map((li, i) => (
                    <BreakdownRow key={i} label={li.label} note={li.note} amount={li.amount} />
                  ))}
                  <Dt>Refundable credits received</Dt>
                  <Dd>{usd(result.refundableCredits)}</Dd>
                </dl>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function Row({
  label,
  rows,
  get,
  cost,
  baselineRow,
}: {
  label: string
  rows: Array<{ platform: Platform | null; result: HouseholdResult }>
  get: (r: HouseholdResult) => number
  cost?: boolean
  baselineRow?: HouseholdResult
}) {
  return (
    <tr>
      <td className="px-4 py-2 text-ink-2">{label}</td>
      {rows.map(({ platform, result }) => {
        const v = get(result)
        const d = baselineRow && platform ? v - get(baselineRow) : 0
        return (
          <td key={result.platformId} className="px-4 py-2 text-right">
            <div>{usd(v)}</div>
            {platform && baselineRow && Math.abs(d) >= 1 && (
              <div className="text-xs text-ink-2">
                <Delta v={cost ? -d : d} />
              </div>
            )}
          </td>
        )
      })}
    </tr>
  )
}

function BreakdownRow({ label, note, amount }: { label: string; note?: string; amount: number }) {
  return (
    <>
      <Dt>
        {label}
        {note && <span className="ml-1 text-xs text-ink-4">({note})</span>}
      </Dt>
      <Dd>{usd(amount)}</Dd>
    </>
  )
}
const Dt = ({ children }: { children: React.ReactNode }) => <dt className="text-ink-2">{children}</dt>
const Dd = ({ children }: { children: React.ReactNode }) => <dd className="text-right text-ink">{children}</dd>
