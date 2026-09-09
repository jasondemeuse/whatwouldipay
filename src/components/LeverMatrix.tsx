import type { Attribution } from '../engine/attribution'
import { deltasByArea } from '../engine/attribution'
import type { Platform, PolicyArea } from '../engine/types'
import { AREA_LABEL } from './PositionsPanel'
import { Delta } from './Delta'

interface Props {
  rows: Array<{ platform: Platform; attribution: Attribution }>
  onShowPositions: (platformId: string) => void
  onExplain: (platformId: string) => void
}

/** Policy lever × platform matrix: the dollar effect of each lever on this household, per platform. */
export function LeverMatrix({ rows, onShowPositions, onExplain }: Props) {
  if (rows.length === 0) return null
  const byPlatform = rows.map((r) => ({ ...r, deltas: deltasByArea(r.attribution) }))
  const order = Object.keys(AREA_LABEL) as PolicyArea[]
  const areas = order.filter((a) => byPlatform.some((p) => Math.abs(p.deltas[a] ?? 0) >= 1))
  const silent = order.filter((a) => !areas.includes(a) && byPlatform.some((p) => p.attribution.noEffect.some((s) => s.position.area === a)))

  return (
    <section className="viz-root card rounded-card border border-rule bg-card">
      <div className="px-5 pt-4">
        <h2 className="font-serif text-lg font-semibold text-ink">Which policies move your number</h2>
        <p className="mt-0.5 text-sm text-ink-2">
          Effect on money left after taxes and healthcare, by policy lever. Click a platform to see how its bars add up.
        </p>
      </div>
      <div className="mt-3 overflow-x-auto">
        <table className="w-full min-w-[560px] text-sm">
          <thead className="bg-paper-2 text-left text-xs uppercase tracking-wide text-ink-3">
            <tr>
              <th className="px-5 py-2 font-semibold">Policy lever</th>
              {byPlatform.map((p) => (
                <th key={p.platform.id} className="px-3 py-2 text-right font-semibold">
                  <button type="button" onClick={() => onExplain(p.platform.id)} className="underline decoration-dotted hover:text-ink">
                    {p.platform.shortName}
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-rule-2">
            {areas.map((a) => (
              <tr key={a}>
                <td className="px-5 py-2 text-ink-2">{AREA_LABEL[a]}</td>
                {byPlatform.map((p) => {
                  const v = p.deltas[a] ?? 0
                  const step = p.attribution.steps.find((s) => s.position.area === a)
                  return (
                    <td key={p.platform.id} className="money px-3 py-2 text-right">
                      {Math.abs(v) >= 1 ? (
                        <button
                          type="button"
                          onClick={() => onShowPositions(p.platform.id)}
                          aria-label={`${AREA_LABEL[a]} under ${p.platform.shortName}: ${step?.position.summary ?? ''}`}
                          className="font-medium text-ink hover:underline"
                        >
                          <Delta v={v} />
                        </button>
                      ) : (
                        <span className="text-ink-4" title={p.attribution.noEffect.find((s) => s.position.area === a)?.zeroReason ?? 'No position'}>
                          <span className="sr-only">{p.attribution.noEffect.find((s) => s.position.area === a)?.zeroReason ?? 'No effect'}</span>
                          <span aria-hidden="true">—</span>
                        </span>
                      )}
                    </td>
                  )
                })}
              </tr>
            ))}
            <tr className="bg-paper-2 font-semibold">
              <td className="px-5 py-2">Total vs. current law</td>
              {byPlatform.map((p) => (
                <td key={p.platform.id} className="money px-3 py-2 text-right">
                  <Delta v={p.attribution.final.netIncome - p.attribution.baseline.netIncome} />
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
      {silent.length > 0 && (
        <p className="px-5 pb-4 pt-3 text-xs text-ink-3">
          No effect on your household from any selected platform: {silent.map((a) => AREA_LABEL[a]).join(', ')}. Hover a dash for the reason.
        </p>
      )}
    </section>
  )
}
