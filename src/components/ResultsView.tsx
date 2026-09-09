import { useState } from 'react'
import type { HouseholdResult, Platform } from '../engine/types'
import { usd, pct } from '../lib/format'
import { Delta } from './Delta'
import { Avatar } from './Avatar'
import { Money } from './Money'
import { Segmented } from './Segmented'
import { fmtBillions, resolvedSpending, scorerLabel } from '../engine/spending'

type SortMode = 'impact' | 'selection' | 'name'

interface Props {
  baseline: HouseholdResult
  results: Array<{ platform: Platform; result: HouseholdResult; sameAs?: string }>
  all: Platform[]
  onShowPositions: (platformId: string) => void
  onExplain: (platformId: string) => void
  explaining: string | null
  whyPanel: React.ReactNode
  /** Guess-first state lives in App so every surface can hide numbers together. */
  guessMode: boolean
  revealed: Record<string, boolean>
  onGuessModeChange: (on: boolean) => void
  onReveal: (id: string) => void
  onRevealAll: () => void
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

export function ResultsView({
  baseline,
  results,
  all,
  onShowPositions,
  onExplain,
  explaining,
  whyPanel,
  guessMode,
  revealed,
  onGuessModeChange,
  onReveal,
  onRevealAll,
}: Props) {
  const [expanded, setExpanded] = useState<string | null>(null)
  const [sort, setSort] = useState<SortMode>('impact')
  const [guesses, setGuesses] = useState<Record<string, number>>({})
  const hidden = (id: string) => guessMode && !revealed[id]
  const anyHidden = results.some((r) => hidden(r.platform.id))
  const deficitOf = (platform: Platform) => resolvedSpending(platform, all).find((s) => s.category === 'deficit')
  const sorted = [...results].sort((a, b) => {
    if (sort === 'impact') return b.result.netIncome - a.result.netIncome
    if (sort === 'name') return a.platform.name.localeCompare(b.platform.name)
    return 0
  })
  const rows = [{ platform: null as Platform | null, result: baseline }, ...sorted]
  const maxAbsDelta = Math.max(1, ...results.map((r) => Math.abs(r.result.netIncome - baseline.netIncome)))

  return (
    <div className="space-y-6">
      {results.length > 0 && (
        <div className="no-print flex flex-wrap items-center justify-between gap-2 text-xs text-ink-3">
          <label className="inline-flex items-center gap-2">
            <input
              type="checkbox"
              className="h-3.5 w-3.5 accent-[var(--color-accent)]"
              checked={guessMode}
              onChange={(e) => {
                onGuessModeChange(e.target.checked)
                setGuesses({})
              }}
            />
            <span>
              Guess first <span className="text-ink-4">· predict each effect before you see it</span>
            </span>
          </label>
          {guessMode && anyHidden && (
            <button type="button" onClick={onRevealAll} className="underline hover:text-ink">
              Reveal all
            </button>
          )}
          {results.length > 1 && (
            <span className="ml-auto inline-flex items-center gap-2">
              <span>Order</span>
              <Segmented<SortMode>
                label="Order results"
                value={sort}
                options={[
                  { v: 'impact', label: 'By what you keep' },
                  { v: 'selection', label: 'As selected' },
                  { v: 'name', label: 'By name' },
                ]}
                onChange={setSort}
              />
            </span>
          )}
        </div>
      )}
      {/* Headline cards */}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {rows.map(({ platform, result }) => {
          const delta = result.netIncome - baseline.netIncome
          const isBase = platform === null
          const sameAs = platform ? results.find((r) => r.platform.id === platform.id)?.sameAs : undefined
          const deficit = platform ? deficitOf(platform) : undefined
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
              {platform && hidden(platform.id) ? (
                <GuessControl
                  value={guesses[platform.id] ?? 0}
                  onChange={(v) => setGuesses((g) => ({ ...g, [platform.id]: v }))}
                  onReveal={() => onReveal(platform.id)}
                />
              ) : (
                <div className="mt-3">
                  <div className="text-xs uppercase tracking-wide text-ink-3">Money left after taxes & healthcare</div>
                  <Money value={result.netIncome} className={`block text-2xl font-semibold tracking-tight ${result.unfunded ? 'text-ink-3 line-through decoration-ink-4/60' : 'text-ink'}`} />
                  {result.unfunded && (
                    <div className="mt-1 inline-block rounded bg-caution-2 px-1.5 py-0.5 text-xs text-ink-2">
                      Unfunded: removes taxes without a modeled replacement, so this gain is overstated
                    </div>
                  )}
                  {!isBase && (
                    <div className="mt-1 text-sm font-semibold text-ink">
                      <Delta v={delta} animate /> <span className="font-normal text-ink-2">vs. current law</span>
                      <span className="money ml-1 font-normal text-ink-3">
                        ({delta >= 0 ? '+' : '−'}{usd(Math.abs(delta) / 12)}/mo)
                      </span>
                    </div>
                  )}
                  {platform && guessMode && revealed[platform.id] && guesses[platform.id] !== undefined && (
                    <div className="mt-1 text-xs text-ink-3">
                      You guessed <span className="money text-ink-2">{usd(guesses[platform.id], { sign: true })}</span>; off by{' '}
                      <span className="money text-ink-2">{usd(Math.abs(delta - guesses[platform.id]))}</span>.
                    </div>
                  )}
                </div>
              )}
              {!isBase && !hidden(platform!.id) && (
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
              {!isBase && sameAs && !hidden(platform!.id) && (
                <div className="mt-2 text-xs text-ink-3">
                  {sameAs === 'baseline' ? 'Identical to current law: no modeled tax or health change.' : `Same modeled parameters as ${sameAs}; the number is identical.`}
                </div>
              )}
              {!isBase && deficit && deficit.direction !== 'none' && !hidden(platform!.id) && (
                <div className="mt-1 text-xs text-ink-3" title={deficit.summary}>
                  Deficit effect:{' '}
                  <span className="money text-ink-2">
                    {deficit.cost10yr !== undefined ? `${fmtBillions(deficit.cost10yr)}${deficit.window ? ` over ${deficit.window}` : ''}` : deficit.direction === 'mixed' ? 'unscored' : deficit.direction}
                  </span>
                  {scorerLabel(deficit) && <span> ({scorerLabel(deficit)})</span>}
                  {deficit.inherited && <span> · {deficit.source.shortName} default</span>}
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

      {anyHidden && (
        <p className="text-sm text-ink-3">The comparison table and line items are hidden until you reveal your guesses.</p>
      )}
      {/* Comparison table */}
      {!anyHidden && (
      <div className="card overflow-x-auto rounded-card border border-rule bg-card">
        <table className="w-full min-w-[640px] text-sm">
          <thead className="bg-paper-2 text-left text-xs uppercase tracking-wide text-ink-3">
            <tr>
              <th scope="col" className="px-4 py-2 font-semibold">Line</th>
              {rows.map(({ platform, result }) => (
                <th key={result.platformId} scope="col" className="px-4 py-2 text-right font-semibold">
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

      )}
      {/* Per-platform breakdown */}
      {!anyHidden && (
      <div className="space-y-2">
        <div className="text-xs font-semibold uppercase tracking-wide text-ink-3">Line-item detail</div>
        {rows.map(({ platform, result }) => {
          const id = result.platformId
          const open = expanded === id
          return (
            <div key={id} className="rounded-lg border border-rule bg-card">
              <button
                type="button"
                aria-expanded={open}
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
      )}
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
  const identical = !!baselineRow && rows.length > 2 && rows.every(({ result }) => Math.abs(get(result) - get(baselineRow)) < 1)
  return (
    <tr>
      <td className="px-4 py-2 text-ink-2">
        {label}
        {identical && (
          <span className="mt-0.5 block text-xs text-ink-3">
            Same under every selected platform. Open <em>Why?</em> on a card to see which thresholds you don't reach.
          </span>
        )}
      </td>
      {rows.map(({ platform, result }) => {
        const v = get(result)
        const d = baselineRow && platform ? v - get(baselineRow) : 0
        return (
          <td key={result.platformId} className={`px-4 py-2 text-right ${identical ? 'text-ink-3' : ''}`}>
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

function GuessControl({ value, onChange, onReveal }: { value: number; onChange: (v: number) => void; onReveal: () => void }) {
  return (
    <div className="mt-3 rounded-md border border-dashed border-ink-4 bg-paper-2/60 p-3">
      <div className="text-xs uppercase tracking-wide text-ink-3">Your guess: change vs. current law</div>
      <div className="money mt-1 text-xl font-semibold text-ink">{Math.abs(value) < 1 ? '$0' : usd(value, { sign: true })}</div>
      <input
        type="range"
        min={-10000}
        max={10000}
        step={250}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        aria-label="Your guess for the change versus current law"
        className="mt-2 w-full accent-[var(--color-accent)]"
      />
      <div className="mt-1 flex items-center justify-between text-[10px] text-ink-4">
        <span>−$10,000</span>
        <span>$0</span>
        <span>+$10,000</span>
      </div>
      <button type="button" onClick={onReveal} className="mt-2 rounded-md bg-ink px-3 py-1 text-xs font-medium text-card hover:opacity-90">
        Reveal
      </button>
    </div>
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
