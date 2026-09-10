import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { HouseholdForm } from './components/HouseholdForm'
import { PlatformPicker } from './components/PlatformPicker'
import { ResultsView } from './components/ResultsView'
import { PositionsPanel } from './components/PositionsPanel'
import { WhyPanel } from './components/WhyPanel'
import { Dialog } from './components/Dialog'
import { SimpleFlow } from './components/SimpleFlow'
import { Segmented } from './components/Segmented'
import { LeverMatrix } from './components/LeverMatrix'
import { AssumptionsPanel } from './components/AssumptionsPanel'
import { Verdict } from './components/Verdict'
import { ShareBar } from './components/ShareBar'
import { MobileSummary } from './components/MobileSummary'
import { parse as parseUrl, permalink } from './lib/urlState'
import { ThemeToggle } from './components/ThemeToggle'
import { ShareCard } from './components/ShareCard'
import { MethodologyPage } from './pages/Methodology'
import { BeyondPaycheck } from './components/BeyondPaycheck'
import { applyPlatform, calculate, cloneParams } from './engine/calculate'
import { attribute } from './engine/attribution'
import { applyAssumptions, DEFAULT_ASSUMPTIONS } from './engine/assumptions'
import type { Assumptions, Household } from './engine/types'
import { BASELINE_2026 } from './data/baseline2026'
import { PLATFORMS } from './data/platforms'
import { PERSONAS, URL_DEFAULT_HOUSEHOLD } from './data/personas'
import { SITE } from './lib/labels'

const DEFAULT_HOUSEHOLD: Household = PERSONAS[0].household

const DEFAULT_SELECTION = ['party-dem', 'party-gop']

const STORAGE_KEY = 'wwip:v1'
const VIEW_KEY = 'wwip:view'

type View = 'simple' | 'full'
/** Simple by default; a shared link or a remembered choice can open the full comparison. */
function loadView(): View {
  const v = new URLSearchParams(window.location.search).get('v')
  if (v === 'full' || v === 'simple') return v
  try {
    const s = localStorage.getItem(VIEW_KEY)
    if (s === 'full' || s === 'simple') return s
  } catch {
    /* ignore */
  }
  return 'simple'
}

const PLATFORM_IDS = new Set(PLATFORMS.map((p) => p.id))
/** A shared link carries the answers, so the simple flow can open straight on the results screen. */
const OPENED_FROM_LINK = parseUrl(window.location.search, URL_DEFAULT_HOUSEHOLD, PLATFORM_IDS) !== null
// Dataset facts shown in the hero; module constants because the dataset never changes at runtime.
const POLITICIAN_COUNT = PLATFORMS.filter((p) => p.kind === 'politician').length
const SOURCE_COUNT = new Set(PLATFORMS.flatMap((p) => p.positions.flatMap((x) => x.citations.map((c) => c.url)))).size

/** Initial state: URL beats saved state beats defaults. */
function load(): { household: Household; selected: string[]; assumptions: Assumptions } | null {
  const fromUrl = parseUrl(window.location.search, URL_DEFAULT_HOUSEHOLD, PLATFORM_IDS)
  if (fromUrl) return fromUrl
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    return {
      household: { ...DEFAULT_HOUSEHOLD, ...parsed.household },
      selected: (parsed.selected ?? DEFAULT_SELECTION).filter((id: string) => PLATFORM_IDS.has(id)),
      assumptions: { ...DEFAULT_ASSUMPTIONS, ...parsed.assumptions },
    }
  } catch {
    return null
  }
}

function useHashRoute() {
  const [hash, setHash] = useState(() => window.location.hash)
  useEffect(() => {
    const on = () => setHash(window.location.hash)
    window.addEventListener('hashchange', on)
    return () => window.removeEventListener('hashchange', on)
  }, [])
  return hash
}

export default function App() {
  const route = useHashRoute()
  const [saved] = useState(load)
  const shareCardRef = useRef<HTMLDivElement>(null)
  const [household, setHousehold] = useState<Household>(saved?.household ?? DEFAULT_HOUSEHOLD)
  const [selected, setSelected] = useState<string[]>(saved?.selected ?? DEFAULT_SELECTION)
  const [assumptions, setAssumptions] = useState<Assumptions>(saved?.assumptions ?? DEFAULT_ASSUMPTIONS)
  const [positionsFor, setPositionsFor] = useState<string | null>(null)
  const [explainFor, setExplainFor] = useState<string | null>(null)
  const [guessMode, setGuessMode] = useState(false)
  const [view, setView] = useState<View>(loadView)
  const [revealed, setRevealed] = useState<Record<string, boolean>>({})
  const closePositions = useCallback(() => setPositionsFor(null), [])

  const url = useMemo(
    () => permalink({ household, selected, assumptions }, URL_DEFAULT_HOUSEHOLD, route, view === 'full' ? { v: 'full' } : {}),
    [household, selected, assumptions, route, view],
  )

  useEffect(() => {
    // Persist and keep the address bar in sync so the current view is always a permalink (debounced; no history spam).
    const t = setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ household, selected, assumptions }))
      } catch {
        /* ignore */
      }
      if (window.location.href !== url) window.history.replaceState(null, '', url)
    }, 300)
    return () => clearTimeout(t)
  }, [household, selected, assumptions, url])
  useEffect(() => {
    try {
      localStorage.setItem(VIEW_KEY, view)
    } catch {
      /* ignore */
    }
  }, [view])
  const openFull = useCallback(() => {
    setView('full')
    window.scrollTo({ top: 0 })
  }, [])

  const baseline = useMemo(
    () => calculate(household, applyAssumptions(cloneParams(BASELINE_2026), assumptions), 'baseline'),
    [household, assumptions],
  )
  const results = useMemo(() => {
    const baselineKey = JSON.stringify(applyAssumptions(cloneParams(BASELINE_2026), assumptions))
    const rows = selected
      .map((id) => PLATFORMS.find((p) => p.id === id))
      .filter((p): p is NonNullable<typeof p> => !!p)
      .map((platform) => {
        const params = applyAssumptions(applyPlatform(BASELINE_2026, platform, PLATFORMS), assumptions)
        return {
          platform,
          key: JSON.stringify(params),
          result: calculate(household, params, platform.id),
          attribution: attribute(household, BASELINE_2026, platform, PLATFORMS, assumptions),
        }
      })
    // Flag platforms whose modeled parameters are identical to current law or to an earlier-selected platform.
    return rows.map((r, i) => {
      const twin = rows.slice(0, i).find((o) => o.key === r.key)
      const sameAs = r.key === baselineKey ? 'baseline' : twin?.platform.name
      return { ...r, sameAs }
    })
  }, [household, selected, assumptions])

  const panelPlatform = positionsFor ? PLATFORMS.find((p) => p.id === positionsFor) : undefined
  const explain = explainFor ? results.find((r) => r.platform.id === explainFor) : undefined
  const singlePayerSelected = results.some((r) => r.result.effectiveCoverage === 'singlePayer')
  const closeExplain = useCallback(() => setExplainFor(null), [])

  const isMethodology = route.startsWith('#/methodology')
  const householdLabel = `${household.filingStatus === 'mfj' ? 'Married couple' : household.filingStatus === 'hoh' ? 'Head of household' : 'Single filer'}, ${usdShort(
    baseline.grossIncome,
  )} income${household.childrenUnder17 ? `, ${household.childrenUnder17} ${household.childrenUnder17 === 1 ? 'child' : 'children'}` : ''}, ${household.state}`

  return (
    <div className="min-h-screen">
      <a
        href="#main"
        className="skip-link"
        onClick={(e) => {
          e.preventDefault()
          const main = document.getElementById('main')
          main?.setAttribute('tabindex', '-1')
          main?.focus()
        }}
      >
        Skip to results
      </a>
      <header className="border-b border-rule bg-card">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-x-6 gap-y-2 px-4 py-3">
          <a href="#/" className="font-serif text-xl font-semibold tracking-tight text-ink hover:underline">
            What Would I Pay?
          </a>
          <nav aria-label="Site" className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ink-3">
            <a href="#/methodology" className="underline-offset-2 hover:text-ink hover:underline">
              Methodology<span className="hidden sm:inline"> &amp; sources</span>
            </a>
            <a href={SITE.repo} className="hidden underline-offset-2 hover:text-ink hover:underline sm:inline" target="_blank" rel="noreferrer">
              Source
            </a>
            {!isMethodology && (
              <Segmented<View>
                label="View"
                value={view}
                options={[
                  { v: 'simple', label: 'Simple', title: 'Simple: one question at a time, then a ranked answer' },
                  { v: 'full', label: 'Full', title: 'Full comparison: every line item, lever and source' },
                ]}
                onChange={setView}
              />
            )}
            <ThemeToggle />
          </nav>
        </div>
      </header>

      {!isMethodology && view === 'full' && (
        <div className="border-b border-rule-2 bg-paper">
          <div className="mx-auto max-w-7xl px-4 pb-6 pt-8">
            <h1 className="max-w-3xl font-serif text-3xl font-semibold leading-tight tracking-tight text-ink sm:text-4xl">
              What would each candidate's plan cost you?
            </h1>
            <p className="mt-3 max-w-2xl text-base text-ink-2">
              Enter your household, pick the politicians you want to compare, and see how each one's published tax and healthcare platform
              would change the money you keep each year. Every number has a source, and every result explains itself.
            </p>
            <ul className="mt-4 flex flex-wrap gap-2 text-xs text-ink-2">
              <li className="rounded-full border border-rule bg-card px-2.5 py-1">
                Tax year 2026, current law after the 2025 tax act
              </li>
              <li className="rounded-full border border-rule bg-card px-2.5 py-1">
                {POLITICIAN_COUNT} politicians · 5 party baselines · {SOURCE_COUNT} sources
              </li>
              <li className="rounded-full border border-rule bg-card px-2.5 py-1">
                Updated <time dateTime={SITE.modelUpdated}>{SITE.modelUpdatedLabel}</time>
              </li>
              <li className="rounded-full border border-rule bg-card px-2.5 py-1">Free and open source</li>
            </ul>
          </div>
        </div>
      )}

      {isMethodology ? (
        <MethodologyPage />
      ) : view === 'simple' ? (
        <SimpleFlow
          household={household}
          onHousehold={setHousehold}
          selected={selected}
          onSelected={setSelected}
          baseline={baseline}
          results={results}
          all={PLATFORMS}
          url={url}
          startAtResults={OPENED_FROM_LINK}
          onExplain={setExplainFor}
          onShowPositions={setPositionsFor}
          onFull={openFull}
        />
      ) : (
      <main id="main" className="mx-auto grid max-w-7xl gap-6 px-4 py-6 pb-24 lg:grid-cols-[340px_1fr] lg:pb-6">
        <aside className="card min-w-0 rounded-card border border-rule bg-card p-4 lg:sticky lg:top-4 lg:max-h-[calc(100vh-2rem)] lg:self-start lg:overflow-y-auto">
          <h2 className="sr-only">Your household</h2>
          <HouseholdForm value={household} onChange={setHousehold} />
        </aside>

        <section className="min-w-0 space-y-6">
          <div className="card rounded-card border border-rule bg-card p-4">
            <h2 className="mb-3 font-serif text-lg font-semibold text-ink">Who do you want to compare?</h2>
            <PlatformPicker platforms={PLATFORMS} selected={selected} onChange={setSelected} />
          </div>

          <section className="card rounded-card border border-rule bg-card p-5" aria-labelledby="verdict-h">
            <h2 id="verdict-h" className="sr-only">
              Summary
            </h2>
            <Verdict baseline={baseline} results={results} all={PLATFORMS} hidden={guessMode && results.some((r) => !revealed[r.platform.id])} />
            <div className="mt-3 border-t border-rule-2 pt-3">
              <ShareBar url={url} title="What Would I Pay?" imageNode={results.length ? shareCardRef : undefined} imageName={`what-would-i-pay-${household.state}.png`} />
            </div>
          </section>

          <ResultsView
            baseline={baseline}
            state={household.state}
            filingStatus={household.filingStatus}
            results={results}
            all={PLATFORMS}
            guessMode={guessMode}
            revealed={revealed}
            onGuessModeChange={(on) => {
              setGuessMode(on)
              setRevealed({})
            }}
            onReveal={(id) => setRevealed((r) => ({ ...r, [id]: true }))}
            onRevealAll={() => setRevealed(Object.fromEntries(results.map((r) => [r.platform.id, true])))}
            onShowPositions={setPositionsFor}
            onExplain={setExplainFor}
          />

          <LeverMatrix rows={results} onShowPositions={setPositionsFor} onExplain={setExplainFor} />

          <BeyondPaycheck baseline={baseline} results={results} all={PLATFORMS} onShowPositions={setPositionsFor} />

          <AssumptionsPanel value={assumptions} onChange={setAssumptions} singlePayerSelected={singlePayerSelected} />

          <Methodology />
        </section>
      </main>
      )}

      {!isMethodology && results.length > 0 && (
        <ShareCard ref={shareCardRef} baseline={baseline} results={results} householdLabel={householdLabel} date={SITE.modelUpdatedLabel} url={url} />
      )}
      {explain && (
        <Dialog label={`Why ${explain.platform.name}'s number`} onClose={closeExplain}>
          <WhyPanel
            platform={explain.platform}
            attribution={explain.attribution}
            onClose={closeExplain}
            onShowPositions={(id) => {
              closeExplain()
              setPositionsFor(id)
            }}
          />
        </Dialog>
      )}
      {panelPlatform && <PositionsPanel platform={panelPlatform} all={PLATFORMS} onClose={closePositions} />}
      {!isMethodology && view === 'full' && results.length > 0 && !(guessMode && results.some((r) => !revealed[r.platform.id])) && (
        <MobileSummary baseline={baseline} results={results} />
      )}
    </div>
  )
}

function usdShort(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1000) return `$${Math.round(n / 1000)}k`
  return `$${Math.round(n)}`
}

function Methodology() {
  return (
    <section id="method" className="card rounded-card border border-rule bg-card p-5 text-sm text-ink-2">
      <h2 className="mb-2 font-serif text-lg font-semibold text-ink">
        How this works (and what it isn't){' '}
        <a href="#/methodology" className="ml-2 text-sm font-normal text-accent underline hover:text-ink">
          Full methodology, every parameter and source →
        </a>
      </h2>
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
          <strong>Not modeled:</strong> AMT, itemized deduction detail beyond SALT, most state credits, local income taxes, employer-side payroll incidence, macroeconomic effects, wealth taxes, corporate and estate taxes, and
          what replaces the programs a platform would abolish (see the Libertarian caveat).
        </li>
        <li>
          <strong>Confidence badges</strong> in the Positions panel: <em>High</em> means an explicit numeric proposal, sponsored bill, or signed law;
          <em>Medium</em> a clear stated direction without numbers; <em>Low</em> an inference from votes or general statements; and
          <em>Party default</em> means no personal position was found, so the party or lane baseline is applied.
        </li>
        <li>
          <strong>Photos</strong> are official government portraits in the public domain, except where credited on the{' '}
          <a href="#/methodology" className="underline">
            methodology page
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
