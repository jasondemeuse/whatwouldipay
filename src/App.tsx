import { useEffect, useMemo, useState } from 'react'
import { HouseholdForm } from './components/HouseholdForm'
import { PlatformPicker } from './components/PlatformPicker'
import { ResultsView } from './components/ResultsView'
import { PositionsPanel } from './components/PositionsPanel'
import { WhyPanel } from './components/WhyPanel'
import { LeverMatrix } from './components/LeverMatrix'
import { AssumptionsPanel } from './components/AssumptionsPanel'
import { applyPlatform, calculate, cloneParams } from './engine/calculate'
import { attribute } from './engine/attribution'
import { applyAssumptions, DEFAULT_ASSUMPTIONS } from './engine/assumptions'
import type { Assumptions, Household } from './engine/types'
import { BASELINE_2026 } from './data/baseline2026'
import { PLATFORMS } from './data/platforms'
import { PERSONAS } from './data/personas'

const DEFAULT_HOUSEHOLD: Household = PERSONAS[0].household

/** Stamp shown in the trust line. Update when the dataset or baseline changes. */
const MODEL_UPDATED = '2026-09-08'

const DEFAULT_SELECTION = ['party-dem', 'party-gop']

const STORAGE_KEY = 'wwip:v1'

function load(): { household: Household; selected: string[]; assumptions: Assumptions } | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    return {
      household: { ...DEFAULT_HOUSEHOLD, ...parsed.household },
      selected: parsed.selected ?? DEFAULT_SELECTION,
      assumptions: { ...DEFAULT_ASSUMPTIONS, ...parsed.assumptions },
    }
  } catch {
    return null
  }
}

export default function App() {
  const saved = useMemo(load, [])
  const [household, setHousehold] = useState<Household>(saved?.household ?? DEFAULT_HOUSEHOLD)
  const [selected, setSelected] = useState<string[]>(saved?.selected ?? DEFAULT_SELECTION)
  const [assumptions, setAssumptions] = useState<Assumptions>(saved?.assumptions ?? DEFAULT_ASSUMPTIONS)
  const [positionsFor, setPositionsFor] = useState<string | null>(null)
  const [explainFor, setExplainFor] = useState<string | null>(null)

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ household, selected, assumptions }))
    } catch {
      /* ignore */
    }
  }, [household, selected, assumptions])

  const baseline = useMemo(
    () => calculate(household, applyAssumptions(cloneParams(BASELINE_2026), assumptions), 'baseline'),
    [household, assumptions],
  )
  const results = useMemo(
    () =>
      selected
        .map((id) => PLATFORMS.find((p) => p.id === id))
        .filter((p): p is NonNullable<typeof p> => !!p)
        .map((platform) => ({
          platform,
          result: calculate(household, applyAssumptions(applyPlatform(BASELINE_2026, platform, PLATFORMS), assumptions), platform.id),
          attribution: attribute(household, BASELINE_2026, platform, PLATFORMS, assumptions),
        })),
    [household, selected, assumptions],
  )

  const panelPlatform = positionsFor ? PLATFORMS.find((p) => p.id === positionsFor) : undefined
  const explain = explainFor ? results.find((r) => r.platform.id === explainFor) : undefined
  const singlePayerSelected = results.some((r) => r.result.effectiveCoverage === 'singlePayer')
  const closeExplain = () => setExplainFor(null)

  const politicianCount = PLATFORMS.filter((p) => p.kind === 'politician').length
  const sourceCount = new Set(PLATFORMS.flatMap((p) => p.positions.flatMap((x) => x.citations.map((c) => c.url)))).size

  return (
    <div className="min-h-screen">
      <a href="#main" className="skip-link">
        Skip to results
      </a>
      <header className="border-b border-rule bg-card">
        <div className="mx-auto max-w-7xl px-4 py-5">
          <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-2">
            <div>
              <h1 className="font-serif text-3xl font-semibold tracking-tight text-ink">What Would I Pay?</h1>
              <p className="mt-1 max-w-2xl text-sm text-ink-2">
                Enter your household, pick the politicians you want to compare, and see how each one's published tax and healthcare
                platform would change the money you keep each year, and why.
              </p>
            </div>
            <ul className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ink-3">
              <li>
                Model updated <time dateTime={MODEL_UPDATED}>Sept 8, 2026</time>
              </li>
              <li>
                {politicianCount} politicians · {sourceCount} sources
              </li>
              <li>
                <a href="#method" className="underline hover:text-ink">
                  Methodology
                </a>
              </li>
              <li>
                <a href="https://github.com/" className="underline hover:text-ink" rel="noreferrer">
                  Source on GitHub
                </a>
              </li>
            </ul>
          </div>
        </div>
      </header>

      <main id="main" className="mx-auto grid max-w-7xl gap-6 px-4 py-6 lg:grid-cols-[340px_1fr]">
        <aside className="card rounded-card border border-rule bg-card p-4 lg:sticky lg:top-4 lg:max-h-[calc(100vh-2rem)] lg:self-start lg:overflow-y-auto">
          <h2 className="sr-only">Your household</h2>
          <HouseholdForm value={household} onChange={setHousehold} />
        </aside>

        <section className="space-y-6">
          <div className="card rounded-card border border-rule bg-card p-4">
            <h2 className="mb-3 font-serif text-lg font-semibold text-ink">Who do you want to compare?</h2>
            <PlatformPicker platforms={PLATFORMS} selected={selected} onChange={setSelected} />
          </div>

          <ResultsView
            baseline={baseline}
            results={results}
            onShowPositions={setPositionsFor}
            onExplain={(id) => setExplainFor(explainFor === id ? null : id)}
            explaining={explainFor}
            whyPanel={
              explain ? (
                <WhyPanel platform={explain.platform} attribution={explain.attribution} onClose={closeExplain} onShowPositions={setPositionsFor} />
              ) : null
            }
          />

          <LeverMatrix rows={results} onShowPositions={setPositionsFor} onExplain={setExplainFor} />

          <AssumptionsPanel value={assumptions} onChange={setAssumptions} singlePayerSelected={singlePayerSelected} />

          <Methodology />
        </section>
      </main>

      {panelPlatform && <PositionsPanel platform={panelPlatform} all={PLATFORMS} onClose={() => setPositionsFor(null)} />}
    </div>
  )
}

function Methodology() {
  return (
    <section id="method" className="card rounded-card border border-rule bg-card p-5 text-sm text-ink-2">
      <h2 className="mb-2 font-serif text-lg font-semibold text-ink">How this works (and what it isn't)</h2>
      <ul className="max-w-prose list-disc space-y-1.5 pl-5">
        <li>
          <strong>Baseline</strong> is current federal law for tax year 2026 after the One Big Beautiful Bill Act (P.L. 119-21), using IRS,
          SSA, CMS and HHS published parameters. Every parameter is cited in the source file for the baseline.
        </li>
        <li>
          <strong>Each platform</strong> is a set of parameter changes layered onto the baseline. Where a politician has no stated position
          on an item, the calculator falls back to their party's baseline and marks it "Party default" in the Positions panel.
        </li>
        <li>
          <strong>Healthcare</strong> is estimated as premiums plus typical out-of-pocket for your coverage type. Employer plans use KFF
          national averages unless you enter your own premium. Marketplace plans use the national average benchmark premium and the
          statutory subsidy schedule. Medicaid work requirements are shown as an expected cost using CBO's coverage-loss projection.
        </li>
        <li>
          <strong>Tariffs</strong> are included as an estimated consumer cost. After the Supreme Court struck the IEEPA tariffs in February
          2026, the surviving Section 232/301 tariffs cost about $840 per household (Tax Foundation); we model that as 1% of income capped at
          $3,000, then scale by each platform's stance: repeal ×0.25, targeted ×0.5, keep ×1, expand ×1.25. Those multipliers are our
          judgment, not sourced figures. Tariff rebate proposals (Hawley) are subtracted per household member.
        </li>
        <li>
          <strong>Medicare for All</strong> platforms replace your premiums and typical out-of-pocket with the income-based contribution in
          Sanders' financing options (4% of income above about $29,000). The 7.5% employer payroll premium is assumed not to pass through to
          your wages, matching how we treat employer premiums today.
        </li>
        <li>
          <strong>Not modeled:</strong> AMT, itemized deduction detail beyond SALT, most state credits, local income taxes, child ages (age-tiered
          credits use the base amount), employer-side payroll incidence, macroeconomic effects, wealth taxes, corporate and estate taxes, and
          what replaces the programs a platform would abolish (see the Libertarian caveat).
        </li>
        <li>
          <strong>Confidence badges</strong> in the Positions panel: <em>High</em> means an explicit numeric proposal, sponsored bill, or signed law;
          <em>Medium</em> a clear stated direction without numbers; <em>Low</em> an inference from votes or general statements; and
          <em>Party default</em> means no personal position was found, so the party or lane baseline is applied.
        </li>
        <li>
          <strong>Photos</strong> are official government portraits in the public domain, except where credited on the{' '}
          <a href="/avatars/CREDITS.md" className="underline">
            credits page
          </a>
          . Nobody depicted endorses this tool.
        </li>
        <li>
          This is a <strong>prototype for directional comparison</strong>, not tax advice. Platform positions reflect public statements and
          bills as of September 2026 and can change; every position links to its source.
        </li>
      </ul>
    </section>
  )
}
