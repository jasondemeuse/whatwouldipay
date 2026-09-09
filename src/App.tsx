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

const DEFAULT_HOUSEHOLD: Household = {
  filingStatus: 'mfj',
  wages: 65000,
  spouseWages: 40000,
  selfEmploymentIncome: 0,
  tipIncome: 0,
  overtimeIncome: 0,
  longTermGains: 0,
  socialSecurityBenefits: 0,
  age: 38,
  spouseAge: 36,
  childrenUnder17: 2,
  otherDependents: 0,
  state: 'OH',
  healthCoverage: 'employer',
  saltPaid: 0,
  otherItemized: 0,
}

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

  return (
    <div className="min-h-screen">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-baseline justify-between px-4 py-4">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">What Would I Pay?</h1>
            <p className="text-sm text-slate-500">
              Compare how politicians' tax and healthcare platforms would change your household's bottom line.
            </p>
          </div>
          <a href="#method" className="text-xs text-slate-500 underline hover:text-slate-700">
            Methodology & sources
          </a>
        </div>
      </header>

      <main className="mx-auto grid max-w-7xl gap-6 px-4 py-6 lg:grid-cols-[340px_1fr]">
        <aside className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm lg:sticky lg:top-4 lg:self-start lg:max-h-[calc(100vh-2rem)] lg:overflow-y-auto">
          <HouseholdForm value={household} onChange={setHousehold} />
        </aside>

        <section className="space-y-6">
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-3 text-sm font-semibold text-slate-900">Who do you want to compare?</div>
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
    <section id="method" className="rounded-xl border border-slate-200 bg-white p-5 text-sm text-slate-700 shadow-sm">
      <h2 className="mb-2 text-base font-semibold text-slate-900">How this works (and what it isn't)</h2>
      <ul className="list-disc space-y-1.5 pl-5">
        <li>
          <strong>Baseline</strong> is current federal law for tax year 2026 after the One Big Beautiful Bill Act (P.L. 119-21), using IRS,
          SSA, CMS and HHS published parameters. Sources are listed in <code>src/data/baseline2026.ts</code>.
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
          This is a <strong>prototype for directional comparison</strong>, not tax advice. Platform positions reflect public statements and
          bills as of September 2026 and can change; every position links to its source.
        </li>
      </ul>
    </section>
  )
}
