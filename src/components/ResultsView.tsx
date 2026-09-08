import { useState } from 'react'
import type { HouseholdResult, Platform } from '../engine/types'
import { usd, pct } from '../lib/format'

interface Props {
  baseline: HouseholdResult
  results: Array<{ platform: Platform; result: HouseholdResult }>
  onShowPositions: (platformId: string) => void
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

export function ResultsView({ baseline, results, onShowPositions }: Props) {
  const [expanded, setExpanded] = useState<string | null>(null)
  const rows = [{ platform: null as Platform | null, result: baseline }, ...results]
  const maxAbsDelta = Math.max(1, ...results.map((r) => Math.abs(r.result.netIncome - baseline.netIncome)))

  return (
    <div className="space-y-6">
      {/* Headline cards */}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {rows.map(({ platform, result }) => {
          const delta = result.netIncome - baseline.netIncome
          const isBase = platform === null
          return (
            <div
              key={result.platformId}
              className={`rounded-xl border p-4 shadow-sm ${isBase ? 'border-slate-300 bg-white' : 'border-slate-200 bg-white'}`}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="text-sm font-semibold text-slate-900">{platform ? platform.name : 'Current law (2026)'}</div>
                  <div className="text-xs text-slate-500">{platform ? platform.role : 'Baseline after the 2025 tax law'}</div>
                </div>
                {platform && (
                  <button
                    type="button"
                    onClick={() => onShowPositions(platform.id)}
                    className="shrink-0 rounded-md border border-slate-200 px-2 py-0.5 text-xs text-slate-600 hover:bg-slate-50"
                  >
                    Positions
                  </button>
                )}
              </div>
              <div className="mt-3">
                <div className="text-xs uppercase tracking-wide text-slate-500">Money left after taxes & healthcare</div>
                <div className="text-2xl font-bold tabular-nums text-slate-900">{usd(result.netIncome)}</div>
                {!isBase && (
                  <div className={`mt-1 text-sm font-semibold tabular-nums ${delta >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                    {usd(delta, { sign: true })} vs. current law
                    <span className="ml-1 font-normal text-slate-500">({delta >= 0 ? '+' : ''}{usd(delta / 12, { sign: false })}/mo)</span>
                  </div>
                )}
              </div>
              {!isBase && (
                <div className="mt-3 h-2 w-full overflow-hidden rounded bg-slate-100">
                  <div className="relative h-full w-full">
                    <div className="absolute left-1/2 top-0 h-full w-px bg-slate-300" />
                    <div
                      className={`absolute top-0 h-full ${delta >= 0 ? 'bg-emerald-500' : 'bg-rose-500'}`}
                      style={{
                        left: delta >= 0 ? '50%' : `${50 - (Math.abs(delta) / maxAbsDelta) * 50}%`,
                        width: `${(Math.abs(delta) / maxAbsDelta) * 50}%`,
                      }}
                    />
                  </div>
                </div>
              )}
              <div className="mt-3 text-xs text-slate-500">
                Coverage: <span className="font-medium text-slate-700">{COVERAGE_LABEL[result.effectiveCoverage] ?? result.effectiveCoverage}</span>
              </div>
              {result.warnings.length > 0 && (
                <ul className="mt-2 space-y-1">
                  {result.warnings.map((w, i) => (
                    <li key={i} className="rounded bg-amber-50 px-2 py-1 text-xs text-amber-800">
                      {w}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )
        })}
      </div>

      {/* Comparison table */}
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full min-w-[640px] text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-2 font-semibold">Line</th>
              {rows.map(({ platform, result }) => (
                <th key={result.platformId} className="px-4 py-2 text-right font-semibold">
                  {platform ? platform.shortName : 'Current law'}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 tabular-nums">
            <Row label="Gross income" rows={rows} get={(r) => r.grossIncome} />
            <Row label="Federal income tax (after credits)" rows={rows} get={(r) => r.federalIncomeTax} cost baselineRow={baseline} />
            <Row label="Payroll taxes (Social Security + Medicare)" rows={rows} get={(r) => r.payrollTax} cost baselineRow={baseline} />
            <Row label="State income tax (approx.)" rows={rows} get={(r) => r.stateIncomeTax} cost baselineRow={baseline} />
            <Row label="Healthcare (premiums + typical out-of-pocket)" rows={rows} get={(r) => r.healthcareCost} cost baselineRow={baseline} />
            <Row label="Tariff cost passed to consumers (est.)" rows={rows} get={(r) => r.tariffCost} cost baselineRow={baseline} />
            <tr className="bg-slate-50 font-semibold">
              <td className="px-4 py-2">Net income</td>
              {rows.map(({ result }) => (
                <td key={result.platformId} className="px-4 py-2 text-right">
                  {usd(result.netIncome)}
                </td>
              ))}
            </tr>
            <tr className="text-xs text-slate-500">
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
        <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Line-item detail</div>
        {rows.map(({ platform, result }) => {
          const id = result.platformId
          const open = expanded === id
          return (
            <div key={id} className="rounded-lg border border-slate-200 bg-white">
              <button
                type="button"
                onClick={() => setExpanded(open ? null : id)}
                className="flex w-full items-center justify-between px-4 py-2 text-left text-sm font-medium text-slate-800 hover:bg-slate-50"
              >
                <span>{platform ? platform.name : 'Current law (2026)'}</span>
                <span className="text-slate-400">{open ? '−' : '+'}</span>
              </button>
              {open && (
                <dl className="grid grid-cols-[1fr_auto] gap-x-4 gap-y-1 border-t border-slate-100 px-4 py-3 text-sm tabular-nums">
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
      <td className="px-4 py-2 text-slate-700">{label}</td>
      {rows.map(({ platform, result }) => {
        const v = get(result)
        const d = baselineRow && platform ? v - get(baselineRow) : 0
        return (
          <td key={result.platformId} className="px-4 py-2 text-right">
            <div>{usd(v)}</div>
            {platform && baselineRow && Math.abs(d) >= 1 && (
              <div className={`text-xs ${(cost ? -d : d) >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>{usd(d, { sign: true })}</div>
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
        {note && <span className="ml-1 text-xs text-slate-400">({note})</span>}
      </Dt>
      <Dd>{usd(amount)}</Dd>
    </>
  )
}
const Dt = ({ children }: { children: React.ReactNode }) => <dt className="text-slate-600">{children}</dt>
const Dd = ({ children }: { children: React.ReactNode }) => <dd className="text-right text-slate-900">{children}</dd>
