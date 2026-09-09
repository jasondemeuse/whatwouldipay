import { forwardRef } from 'react'
import type { Attribution } from '../engine/attribution'
import type { HouseholdResult, Platform } from '../engine/types'
import { usd } from '../lib/format'
import { AREA_PHRASE } from './PositionsPanel'

interface Props {
  baseline: HouseholdResult
  results: Array<{ platform: Platform; result: HouseholdResult; attribution: Attribution }>
  householdLabel: string
  date: string
  url: string
}

/**
 * Off-screen 1200×630 social card rendered to PNG by modern-screenshot. Kept in plain inline styles and
 * literal colors so the capture is deterministic regardless of the page theme.
 */
export const ShareCard = forwardRef<HTMLDivElement, Props>(function ShareCard({ baseline, results, householdLabel, date, url }, ref) {
  const ranked = [...results].sort((a, b) => b.result.netIncome - a.result.netIncome).slice(0, 5)
  const maxAbs = Math.max(1, ...ranked.map((r) => Math.abs(r.result.netIncome - baseline.netIncome)))
  const paper = '#faf9f6'
  const ink = '#1b1c22'
  const ink2 = '#5c5e66'
  const gain = '#1a9a6c'
  const loss = '#d9682f'
  return (
    <div
      ref={ref}
      aria-hidden="true"
      style={{
        position: 'fixed',
        left: -20000,
        top: 0,
        width: 1200,
        height: 630,
        padding: 56,
        boxSizing: 'border-box',
        background: paper,
        color: ink,
        fontFamily: '"Inter Variable", Inter, system-ui, sans-serif',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
      }}
    >
      <div>
        <div style={{ fontFamily: '"Source Serif 4 Variable", "Source Serif 4", Georgia, serif', fontSize: 44, fontWeight: 600, letterSpacing: -0.5 }}>
          What would I pay?
        </div>
        <div style={{ marginTop: 8, fontSize: 22, color: ink2 }}>
          {householdLabel} · keeps <b style={{ color: ink }}>{usd(baseline.netIncome)}</b> a year under current law
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr 170px', rowGap: 18, columnGap: 20, alignItems: 'center' }}>
        {ranked.map(({ platform, result, attribution }) => {
          const d = result.netIncome - baseline.netIncome
          const w = (Math.abs(d) / maxAbs) * 50
          const top = [...attribution.steps].sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))[0]
          return (
            <div key={platform.id} style={{ display: 'contents' }}>
              <div>
                <div style={{ fontSize: 24, fontWeight: 600 }}>{platform.name}</div>
                <div style={{ fontSize: 16, color: ink2 }}>{top ? `mostly ${AREA_PHRASE[top.position.area]}` : 'no change'}</div>
              </div>
              <div style={{ position: 'relative', height: 26 }}>
                <div style={{ position: 'absolute', left: '50%', top: 0, bottom: 0, width: 2, background: '#d9d7d0' }} />
                <div
                  style={{
                    position: 'absolute',
                    top: 4,
                    height: 18,
                    left: d >= 0 ? '50%' : `${50 - w}%`,
                    width: `${w}%`,
                    background: d >= 0 ? gain : loss,
                    borderRadius: d >= 0 ? '0 6px 6px 0' : '6px 0 0 6px',
                  }}
                />
              </div>
              <div style={{ fontSize: 26, fontWeight: 700, textAlign: 'right', fontVariantNumeric: 'tabular-nums', color: Math.abs(d) < 0.5 ? ink2 : d >= 0 ? gain : loss }}>
                {Math.abs(d) < 0.5 ? '$0' : usd(d, { sign: true })}
              </div>
            </div>
          )
        })}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 16, color: ink2 }}>
        <span>Change vs. current law · taxes + healthcare · published platforms as of {date}</span>
        <span>{url.replace(/^https?:\/\//, '').split('?')[0]}</span>
      </div>
    </div>
  )
})
