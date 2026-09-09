import type { HouseholdResult, Platform, SpendingPosition } from '../engine/types'
import { SPENDING_CATEGORIES, fmtBillions, resolvedSpending, scorerLabel } from '../engine/spending'
import { FISCAL_2025, RECEIPT, RECEIPT_SOURCE } from '../data/spending'
import { usd } from '../lib/format'
import { Avatar } from './Avatar'

interface Props {
  baseline: HouseholdResult
  results: Array<{ platform: Platform; result: HouseholdResult }>
  all: Platform[]
  onShowPositions: (platformId: string) => void
}

const DIR: Record<SpendingPosition['direction'], { glyph: string; label: string; color: string }> = {
  more: { glyph: '▲', label: 'more', color: 'var(--color-accent)' },
  less: { glyph: '▼', label: 'less', color: 'var(--color-loss)' },
  mixed: { glyph: '◆', label: 'mixed', color: 'var(--color-caution)' },
  none: { glyph: '—', label: 'no stated position', color: 'var(--color-ink-4)' },
}

/** "+$150B over 2025–2034, CBO" / "no stated cost" */
function costText(sp: SpendingPosition): string | null {
  if (sp.openEnded) return 'open-ended authorization, no stated cost'
  if (sp.cost10yr === undefined) return null
  const who = scorerLabel(sp)
  return `${fmtBillions(sp.cost10yr)}${sp.window ? ` over ${sp.window}` : ' / 10 yrs'}${who ? `, ${who}` : ''}`
}

/**
 * "Beyond your paycheck": where the household's federal taxes go today, and what each platform changes on the
 * spending side. Nothing here is summed into the headline number.
 */
export function BeyondPaycheck({ baseline, results, all, onShowPositions }: Props) {
  const incomeTax = Math.max(0, baseline.federalIncomeTax)
  const payroll = baseline.payrollTax
  const receiptRows = RECEIPT.map((r) => ({ ...r, dollars: incomeTax * r.share }))

  return (
    <section className="card rounded-card border border-rule bg-card p-5" aria-labelledby="beyond-h">
      <h2 id="beyond-h" className="font-serif text-lg font-semibold text-ink">
        Beyond your paycheck
      </h2>
      <p className="mt-0.5 max-w-prose text-sm text-ink-2">
        "Keeps more money" is one side of the ledger. Taxes also buy things, and platforms change what gets bought. This section shows where your
        federal taxes go today and what each platform would change on the spending side. None of it is added into the numbers above.
      </p>

      {/* Receipt */}
      <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_1fr]">
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-ink-3">Where your federal income tax goes today</h3>
          {incomeTax <= 0 ? (
            <p className="mt-2 text-sm text-ink-2">
              You owe no federal income tax under current law (refundable credits exceed your tax), so there is no income-tax receipt to show.
              Your payroll taxes still fund Social Security and Medicare, below.
            </p>
          ) : (
            <>
              <div className="mt-2 flex h-4 w-full overflow-hidden rounded bg-paper-2" role="img" aria-label="Your federal income tax split by budget function">
                {receiptRows.map((r, i) => (
                  <div
                    key={r.id}
                    title={`${r.label}: ${usd(r.dollars)} (${Math.round(r.share * 100)}%)`}
                    style={{
                      width: `${r.share * 100}%`,
                      background: r.borrowed
                        ? 'repeating-linear-gradient(135deg, var(--color-ink-4) 0 3px, transparent 3px 6px)'
                        : `oklch(${0.8 - i * 0.04} 0.04 ${200 + i * 12})`,
                    }}
                    className="h-full border-r border-card last:border-r-0"
                  />
                ))}
              </div>
              <ul className="money mt-2 grid grid-cols-1 gap-x-6 gap-y-0.5 text-xs text-ink-2 sm:grid-cols-2">
                {receiptRows.map((r, i) => (
                  <li key={r.id} className="flex items-center gap-1.5">
                    <span
                      aria-hidden="true"
                      className="inline-block h-2 w-2 shrink-0 rounded-sm"
                      style={{
                        background: r.borrowed
                          ? 'repeating-linear-gradient(135deg, var(--color-ink-4) 0 2px, transparent 2px 4px)'
                          : `oklch(${0.8 - i * 0.04} 0.04 ${200 + i * 12})`,
                      }}
                    />
                    <span title={r.detail} className={r.borrowed ? 'italic' : ''}>{r.label}</span>
                    <span className="ml-auto text-ink">{usd(r.dollars)}</span>
                  </li>
                ))}
              </ul>
            </>
          )}
          <p className="mt-2 text-xs text-ink-3">
            Your <span className="money text-ink-2">{usd(incomeTax)}</span> of federal income tax is allocated by the FY2025 federal-funds shares
            from the{' '}
            <a href={RECEIPT_SOURCE.url} target="_blank" rel="noreferrer" className="underline hover:text-ink">
              National Priorities Project
            </a>
            . The striped slice is the part of that spending paid for by borrowing: in FY2025 the government spent about $
            {FISCAL_2025.spentPerDollar.toFixed(2)} for every $1 it collected, so {Math.round(RECEIPT.find((r) => r.borrowed)!.share * 100)}% of spending outside the
            Social Security and Medicare trust funds was borrowed (OMB Historical Table 1.4).
          </p>
          <p className="mt-1 text-xs text-ink-3">
            Your payroll taxes of <span className="money text-ink-2">{usd(payroll)}</span> go separately to the Social Security and Medicare Part A
            trust funds. Medicare appears in both places because it is financed twice: Part A by the payroll tax, Parts B and D about 55% from
            general revenue.
          </p>
        </div>

        {/* Spending matrix */}
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-ink-3">What each platform changes</h3>
          {results.length === 0 ? (
            <p className="mt-2 text-sm text-ink-2">Select a platform above to see its spending commitments.</p>
          ) : (
            <div className="mt-2 overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="text-left uppercase tracking-wide text-ink-3">
                  <tr>
                    <th className="py-1.5 pr-2 font-semibold">Category</th>
                    {results.map(({ platform }) => (
                      <th key={platform.id} className="px-1 py-1.5 text-center font-semibold">
                        <button type="button" onClick={() => onShowPositions(platform.id)} className="inline-flex flex-col items-center gap-0.5 hover:text-ink" title={platform.name}>
                          <Avatar platform={platform} size={24} />
                          <span className="max-w-16 truncate normal-case">{platform.shortName}</span>
                        </button>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-rule-2">
                  {SPENDING_CATEGORIES.map((cat) => (
                    <tr key={cat.id}>
                      <td className="py-1.5 pr-2 text-ink-2" title={cat.hint}>
                        {cat.label}
                      </td>
                      {results.map(({ platform }) => {
                        const sp = resolvedSpending(platform, all).find((x) => x.category === cat.id)
                        const d = DIR[sp?.direction ?? 'none']
                        const cost = sp ? costText(sp) : null
                        const tip = sp
                          ? `${sp.summary}${cost ? ` (${cost})` : ''}${sp.inherited ? ` — ${sp.source.shortName} default` : ''}`
                          : 'No stated position'
                        return (
                          <td key={platform.id} className="px-1 py-1.5 text-center">
                            <span className="inline-flex flex-col items-center leading-tight" title={tip}>
                              <span role="img" aria-label={d.label} style={{ color: d.color }} className="text-sm">
                                {d.glyph}
                              </span>
                              {sp?.cost10yr !== undefined && !sp.openEnded && <span className="money text-[10px] text-ink-3">{fmtBillions(sp.cost10yr)}</span>}
                              {sp?.openEnded && <span className="text-[10px] text-ink-3">open</span>}
                              <span className="sr-only">{tip}</span>
                            </span>
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <p className="mt-2 text-xs text-ink-3">
            ▲ more spending · ▼ less · ◆ mixed · — no stated position. Figures are budget estimates in billions over the stated window; each
            names who scored it, because a CBO score and a sponsor's own claim are not the same kind of number. For the deficit row, ▲ means more
            borrowing. Hover or open Positions for the source.
          </p>
        </div>
      </div>

      {/* Per-platform narrative */}
      {results.length > 0 && (
        <ul className="mt-5 grid gap-3 md:grid-cols-2">
          {results.map(({ platform }) => {
            const rows = resolvedSpending(platform, all).filter((s) => s.direction !== 'none')
            return (
              <li key={platform.id} className="rounded-lg border border-rule-2 p-3 text-sm">
                <div className="flex items-center gap-2">
                  <Avatar platform={platform} size={24} />
                  <span className="font-semibold text-ink">{platform.name}</span>
                </div>
                {rows.length === 0 ? (
                  <p className="mt-1 text-ink-3">No spending commitments on the record.</p>
                ) : (
                  <ul className="mt-1.5 space-y-1 text-ink-2">
                    {rows.map((s) => (
                      <li key={s.category} className="flex gap-2">
                        <span aria-hidden="true" style={{ color: DIR[s.direction].color }}>
                          {DIR[s.direction].glyph}
                        </span>
                        <span>
                          <span className="font-medium text-ink">{SPENDING_CATEGORIES.find((c) => c.id === s.category)?.label}:</span> {s.summary}
                          {costText(s) && <span className="money text-ink-3"> ({costText(s)})</span>}
                          {s.inherited && <span className="text-xs text-ink-3"> · {s.source.shortName} default</span>}
                          {s.citations[0] && (
                            <>
                              {' '}
                              <a href={s.citations[0].url} target="_blank" rel="noreferrer" className="text-accent underline hover:text-ink">
                                source
                              </a>
                            </>
                          )}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
