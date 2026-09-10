import { forwardRef, useEffect, useRef, useState } from 'react'
import type { Attribution } from '../engine/attribution'
import type { BenefitItem, FilingStatus, HealthCoverage, Household, HouseholdResult, Platform } from '../engine/types'
import { STATE_LIST } from '../data/states'
import { PERSONAS } from '../data/personas'
import { AREA_PHRASE, PARTY_DOT, PARTY_NAME, parseMoney } from '../lib/labels'
import { deficitPhrase, spendingSummary } from '../engine/spending'
import { RECEIPT, RECEIPT_SOURCE } from '../data/spending'
import { usd } from '../lib/format'
import { Avatar } from './Avatar'
import { Delta } from './Delta'
import { ShareBar } from './ShareBar'
import { Icon, type IconName } from './icons'

interface Row {
  platform: Platform
  result: HouseholdResult
  attribution: Attribution
  benefits: BenefitItem[]
  sameAs?: string
}

interface Props {
  household: Household
  onHousehold: (h: Household) => void
  selected: string[]
  onSelected: (ids: string[]) => void
  baseline: HouseholdResult
  results: Row[]
  all: Platform[]
  url: string
  /** Start on the results screen (a shared link already carries the answers). */
  startAtResults?: boolean
  onExplain: (platformId: string) => void
  onShowPositions: (platformId: string) => void
  onFull: () => void
}

type Step = 'household' | 'where' | 'income' | 'coverage' | 'who' | 'results'
const STEPS: Array<{ id: Step; label: string }> = [
  { id: 'household', label: 'You' },
  { id: 'where', label: 'Where' },
  { id: 'income', label: 'Income' },
  { id: 'coverage', label: 'Coverage' },
  { id: 'who', label: 'Compare' },
  { id: 'results', label: 'Results' },
]
const MAX_SELECTED = 8

const FILING_CARDS: Array<{ v: FilingStatus; label: string; hint: string; icon: IconName }> = [
  { v: 'single', label: 'Just me', hint: 'Single, no dependents', icon: 'person' },
  { v: 'mfj', label: 'Married', hint: 'We file a joint return', icon: 'couple' },
  { v: 'hoh', label: 'Single parent', hint: 'I claim a child or dependent', icon: 'parent' },
]

const COVERAGE_CARDS: Array<{ v: HealthCoverage; label: string; hint: string; icon: IconName }> = [
  { v: 'employer', label: 'Through work', hint: 'My or my spouse’s employer plan', icon: 'building' },
  { v: 'marketplace', label: 'Healthcare.gov', hint: 'An Obamacare marketplace plan', icon: 'cart' },
  { v: 'medicaid', label: 'Medicaid', hint: 'State health coverage', icon: 'hospital' },
  { v: 'medicare', label: 'Medicare', hint: 'Age 65+ or disability', icon: 'medicare' },
  { v: 'uninsured', label: 'No insurance', hint: 'I pay out of pocket', icon: 'none' },
]

const INCOME_PICKS = [30_000, 50_000, 75_000, 100_000, 150_000, 250_000]

/**
 * The simple path: one plain question per screen, big controls, progress along the bottom, and a results
 * screen where every explanation and source is one tap away in a dialog.
 */
export function SimpleFlow({
  household,
  onHousehold,
  selected,
  onSelected,
  baseline,
  results,
  all,
  url,
  startAtResults = false,
  onExplain,
  onShowPositions,
  onFull,
}: Props) {
  const [step, setStep] = useState<Step>(startAtResults ? 'results' : 'household')
  const idx = STEPS.findIndex((s) => s.id === step)
  const headingRef = useRef<HTMLHeadingElement>(null)
  const first = useRef(true)
  useEffect(() => {
    if (first.current) {
      first.current = false
      return
    }
    window.scrollTo({ top: 0 })
    headingRef.current?.focus()
  }, [step])

  const married = household.filingStatus === 'mfj' || household.filingStatus === 'mfs'
  const income = household.wages + household.spouseWages
  const go = (to: Step) => setStep(to)
  const next = () => idx < STEPS.length - 1 && go(STEPS[idx + 1].id)
  const back = () => idx > 0 && go(STEPS[idx - 1].id)

  const setFiling = (fs: FilingStatus) => {
    const h = { ...household, filingStatus: fs }
    if (fs === 'mfj') {
      const mine = Math.round(income / 2)
      Object.assign(h, { wages: mine, spouseWages: income - mine, spouseAge: household.spouseAge || household.age })
    } else {
      Object.assign(h, { wages: income, spouseWages: 0 })
    }
    onHousehold(h)
  }
  const setIncome = (total: number) => {
    const t = Math.max(0, Math.round(total))
    if (married) {
      const mine = Math.round(t / 2)
      onHousehold({ ...household, wages: mine, spouseWages: t - mine })
    } else onHousehold({ ...household, wages: t, spouseWages: 0 })
  }
  const setKids = (n: number) => {
    const count = Math.min(12, Math.max(0, n))
    const ages = [...(household.childAges ?? [])].slice(0, count)
    while (ages.length < count) ages.push(8)
    onHousehold({ ...household, childrenUnder17: count, childAges: ages })
  }
  const toggle = (id: string) => {
    if (selected.includes(id)) onSelected(selected.filter((x) => x !== id))
    else if (selected.length < MAX_SELECTED) onSelected([...selected, id])
  }

  const canContinue = step !== 'who' || selected.length > 0

  return (
    <div className="simple-flow text-lg text-ink">
      <main id="main" className="mx-auto max-w-3xl px-4 pb-32 pt-8 sm:pt-12">
        {step === 'household' && (
          <Screen
            ref={headingRef}
            title="Let’s start with your household."
            lead="Five quick questions, then we’ll show what each candidate’s plan would mean for your money."
          >
            <Choices
              label="Which describes you?"
              options={FILING_CARDS.map((c) => ({ ...c, on: c.v === household.filingStatus || (c.v === 'mfj' && household.filingStatus === 'mfs') }))}
              onPick={(v) => setFiling(v as FilingStatus)}
            />
            <Stepper label="Children under 17" value={household.childrenUnder17} min={0} max={12} onChange={setKids} />
            <div className="mt-10 rounded-card border border-dashed border-rule p-5">
              <p className="text-base font-semibold uppercase tracking-wide text-ink-3">In a hurry? Start from an example</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {PERSONAS.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    title={p.hint}
                    onClick={() => {
                      onHousehold(p.household)
                      go('who')
                    }}
                    className="min-h-12 rounded-full border border-rule bg-card px-4 text-base font-medium text-ink transition-colors hover:border-ink-4 hover:bg-paper-2"
                  >
                    {p.label}
                  </button>
                ))}
              </div>
              <p className="mt-2 text-sm text-ink-3">Picking one fills in the answers and skips ahead to choosing candidates.</p>
            </div>
          </Screen>
        )}

        {step === 'where' && (
          <Screen ref={headingRef} title="Where do you live, and how old are you?" lead="State taxes and health prices depend on both.">
            <label className="mt-8 block">
              <span className="block text-xl font-semibold">State</span>
              <select
                className="mt-2 block w-full rounded-lg border-2 border-rule bg-card px-4 py-3 text-xl text-ink hover:border-ink-4"
                value={household.state}
                onChange={(e) => onHousehold({ ...household, state: e.target.value })}
              >
                {STATE_LIST.map((s) => (
                  <option key={s.code} value={s.code}>
                    {s.name}
                  </option>
                ))}
              </select>
            </label>
            <Stepper
              label={married ? 'Your age (we assume your spouse is close in age)' : 'Your age'}
              value={household.age}
              min={18}
              max={110}
              onChange={(n) => onHousehold({ ...household, age: n, spouseAge: married ? n : household.spouseAge })}
            />
          </Screen>
        )}

        {step === 'income' && (
          <Screen
            ref={headingRef}
            title={married ? 'How much do the two of you earn in a year?' : 'How much do you earn in a year?'}
            lead="Wages before taxes. A rough number is fine; you can change it any time."
          >
            <BigMoney value={income} onChange={setIncome} />
            <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label="Common amounts">
              {INCOME_PICKS.map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setIncome(n)}
                  aria-pressed={income === n}
                  className={`min-h-12 rounded-full border px-4 text-base font-medium transition-colors ${
                    income === n ? 'border-ink bg-ink text-card' : 'border-rule bg-card text-ink hover:border-ink-4 hover:bg-paper-2'
                  }`}
                >
                  ${(n / 1000).toLocaleString('en-US')}k
                </button>
              ))}
            </div>
            <p className="mt-6 text-base text-ink-3">
              Self-employment, tips, overtime, investments and Social Security can be added in the{' '}
              <button type="button" onClick={onFull} className="underline hover:text-ink">
                full comparison
              </button>
              .
            </p>
          </Screen>
        )}

        {step === 'coverage' && (
          <Screen ref={headingRef} title="How do you get health insurance today?" lead="Health costs are the biggest single item most plans change.">
            <Choices
              label="Pick the closest match"
              options={COVERAGE_CARDS.map((c) => ({ ...c, on: c.v === household.healthCoverage }))}
              onPick={(v) => onHousehold({ ...household, healthCoverage: v as HealthCoverage })}
              columns={2}
            />
          </Screen>
        )}

        {step === 'who' && (
          <Screen
            ref={headingRef}
            title="Who do you want to compare?"
            lead={`Tap the people or parties you’re curious about. ${selected.length} of ${MAX_SELECTED} chosen.`}
          >
            <CandidateGrid all={all} selected={selected} onToggle={toggle} full={selected.length >= MAX_SELECTED} />
          </Screen>
        )}

        {step === 'results' && (
          <ResultsScreen
            ref={headingRef}
            baseline={baseline}
            results={results}
            all={all}
            url={url}
            onExplain={onExplain}
            onShowPositions={onShowPositions}
            onChangeWho={() => go('who')}
            onEdit={() => go('household')}
            onFull={onFull}
          />
        )}
      </main>

      {/* Progress and navigation, pinned to the bottom like a form wizard. */}
      <nav aria-label="Steps" className="no-print fixed inset-x-0 bottom-0 z-30 border-t border-rule bg-card/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-3">
          <button
            type="button"
            onClick={back}
            disabled={idx === 0}
            className="min-h-12 rounded-lg border border-rule px-4 text-base font-medium text-ink-2 hover:bg-paper-2 disabled:opacity-40"
          >
            ← Back
          </button>
          <ol className="flex items-center gap-1.5 sm:gap-3" aria-label={`Step ${idx + 1} of ${STEPS.length}`}>
            {STEPS.map((s, i) => {
              const done = i < idx
              const here = i === idx
              // Earlier steps are tappable; later ones are not, so nobody skips a question by accident.
              return (
                <li key={s.id} className="flex items-center gap-1.5">
                  <button
                    type="button"
                    disabled={i > idx}
                    onClick={() => go(s.id)}
                    aria-current={here ? 'step' : undefined}
                    aria-label={`${s.label}${done ? ', done' : here ? ', current step' : ''}`}
                    className={`flex h-3 w-3 items-center justify-center rounded-full transition-colors sm:h-auto sm:w-auto sm:rounded-md sm:px-2 sm:py-1 sm:text-sm sm:font-medium ${
                      here ? 'bg-ink text-card' : done ? 'bg-ink/50 text-card sm:bg-transparent sm:text-ink-2 sm:underline' : 'bg-rule text-ink-4'
                    }`}
                  >
                    <span className="hidden sm:inline">{s.label}</span>
                  </button>
                </li>
              )
            })}
          </ol>
          {step !== 'results' ? (
            <button
              type="button"
              onClick={next}
              disabled={!canContinue}
              className="min-h-12 rounded-lg bg-ink px-5 text-base font-semibold text-card transition-colors hover:bg-ink/90 disabled:opacity-40"
            >
              {step === 'who' ? 'See my results' : 'Continue →'}
            </button>
          ) : (
            <button type="button" onClick={onFull} className="min-h-12 rounded-lg border border-rule px-4 text-base font-medium text-ink-2 hover:bg-paper-2">
              Full comparison
            </button>
          )}
        </div>
      </nav>
    </div>
  )
}

/* ---------- Screens and controls ---------- */

const Screen = forwardRef<HTMLHeadingElement, { title: string; lead?: string; children: React.ReactNode }>(function Screen({ title, lead, children }, ref) {
  return (
    <section>
      <h1 ref={ref} tabIndex={-1} className="font-serif text-3xl font-semibold leading-tight tracking-tight outline-none sm:text-4xl">
        {title}
      </h1>
      {lead && <p className="mt-3 text-xl text-ink-2">{lead}</p>}
      <div className="mt-8">{children}</div>
    </section>
  )
})

function Choices({
  label,
  options,
  onPick,
  columns = 3,
}: {
  label: string
  options: Array<{ v: string; label: string; hint: string; icon: IconName; on: boolean }>
  onPick: (v: string) => void
  columns?: 2 | 3
}) {
  return (
    <fieldset>
      <legend className="text-xl font-semibold">{label}</legend>
      <div className={`mt-3 grid gap-3 ${columns === 3 ? 'sm:grid-cols-3' : 'sm:grid-cols-2'}`} role="radiogroup" aria-label={label}>
        {options.map((o) => (
          <button
            key={o.v}
            type="button"
            role="radio"
            aria-checked={o.on}
            onClick={() => onPick(o.v)}
            className={`flex min-h-20 items-center gap-4 rounded-card border-2 px-4 py-3 text-left transition-colors ${
              o.on ? 'border-ink bg-ink text-card' : 'border-rule bg-card hover:border-ink-4 hover:bg-paper-2'
            }`}
          >
            <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${o.on ? 'bg-card/15' : 'bg-paper-2'}`}>
              <Icon name={o.icon} className="h-7 w-7" />
            </span>
            <span className="min-w-0">
              <span className="block text-xl font-semibold leading-tight">{o.label}</span>
              <span className={`block text-base ${o.on ? 'text-card/80' : 'text-ink-3'}`}>{o.hint}</span>
            </span>
            {o.on && <Icon name="check" className="ml-auto h-7 w-7 shrink-0" />}
          </button>
        ))}
      </div>
    </fieldset>
  )
}

function Stepper({ label, value, min, max, onChange }: { label: string; value: number; min: number; max: number; onChange: (n: number) => void }) {
  const [draft, setDraft] = useState<string | null>(null)
  const clamp = (n: number) => Math.min(max, Math.max(min, Math.floor(n)))
  return (
    <div className="mt-8">
      <span id={`stepper-${label}`} className="block text-xl font-semibold">
        {label}
      </span>
      <div className="mt-2 inline-flex items-stretch overflow-hidden rounded-lg border-2 border-rule bg-card" role="group" aria-labelledby={`stepper-${label}`}>
        <button
          type="button"
          onClick={() => onChange(clamp(value - 1))}
          disabled={value <= min}
          aria-label="Fewer"
          className="w-14 text-2xl font-semibold text-ink-2 hover:bg-paper-2 disabled:opacity-30"
        >
          −
        </button>
        <input
          className="money w-20 border-x-2 border-rule bg-card text-center text-2xl font-semibold text-ink outline-none"
          inputMode="numeric"
          aria-label={label}
          value={draft ?? String(value)}
          onChange={(e) => {
            setDraft(e.target.value)
            const n = Number(e.target.value.replace(/[^0-9]/g, ''))
            if (e.target.value.trim() !== '' && Number.isFinite(n)) onChange(clamp(n))
          }}
          onBlur={() => setDraft(null)}
        />
        <button
          type="button"
          onClick={() => onChange(clamp(value + 1))}
          disabled={value >= max}
          aria-label="More"
          className="w-14 text-2xl font-semibold text-ink-2 hover:bg-paper-2 disabled:opacity-30"
        >
          +
        </button>
      </div>
    </div>
  )
}

function BigMoney({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  const [draft, setDraft] = useState<string | null>(null)
  const [note, setNote] = useState<string | null>(null)
  const display = draft ?? value.toLocaleString('en-US')
  return (
    <label className="block">
      <span className="sr-only">Household wages per year</span>
      <span className="relative block max-w-md">
        <span aria-hidden="true" className="pointer-events-none absolute inset-y-0 left-5 flex items-center text-3xl text-ink-4">
          $
        </span>
        <input
          className="money w-full rounded-lg border-2 border-rule bg-card py-4 pl-12 pr-5 text-4xl font-semibold text-ink hover:border-ink-4"
          inputMode="numeric"
          autoComplete="off"
          value={display}
          onChange={(e) => {
            setDraft(e.target.value)
            if (/^[\d,$\s.]*$/.test(e.target.value)) {
              const [n] = parseMoney(e.target.value)
              onChange(n)
            }
          }}
          onBlur={(e) => {
            setDraft(null)
            const [n, reinterpreted] = parseMoney(e.target.value)
            onChange(n)
            setNote(reinterpreted ? `Read as $${n.toLocaleString('en-US')}` : null)
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') (e.target as HTMLInputElement).blur()
          }}
        />
      </span>
      <span className="mt-2 block text-base text-ink-3">{note ?? 'Per year, before taxes. You can type "75k".'}</span>
    </label>
  )
}

function CandidateGrid({ all, selected, onToggle, full }: { all: Platform[]; selected: string[]; onToggle: (id: string) => void; full: boolean }) {
  const groups: Array<{ title: string; hint?: string; items: Platform[] }> = [
    { title: 'Parties', hint: 'What a typical platform from each side does.', items: all.filter((p) => p.kind === 'party') },
    { title: 'Democrats', items: all.filter((p) => p.kind === 'politician' && p.party === 'D') },
    { title: 'Republicans', items: all.filter((p) => p.kind === 'politician' && p.party === 'R') },
    { title: 'Independents', items: all.filter((p) => p.kind === 'politician' && !['D', 'R'].includes(p.party)) },
  ].filter((g) => g.items.length > 0)
  return (
    <div className="space-y-8">
      {full && <p className="rounded-lg bg-paper-2 px-4 py-2 text-base text-ink-2">That’s the most we can compare at once. Unpick one to choose another.</p>}
      {groups.map((g) => (
        <section key={g.title} aria-label={g.title}>
          <h2 className="text-xl font-semibold">{g.title}</h2>
          {g.hint && <p className="text-base text-ink-3">{g.hint}</p>}
          <ul className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {g.items.map((p) => {
              const on = selected.includes(p.id)
              const disabled = !on && full
              return (
                <li key={p.id}>
                  <button
                    type="button"
                    aria-pressed={on}
                    disabled={disabled}
                    onClick={() => onToggle(p.id)}
                    className={`relative flex w-full flex-col items-center rounded-card border-2 px-2 pb-3 pt-4 text-center transition-colors ${
                      on ? 'border-ink bg-ink text-card' : 'border-rule bg-card hover:border-ink-4 hover:bg-paper-2'
                    } disabled:cursor-not-allowed disabled:opacity-40`}
                  >
                    {on && (
                      <span className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-card text-ink">
                        <Icon name="check" className="h-4 w-4" />
                      </span>
                    )}
                    <Avatar platform={p} size={88} />
                    <span className="mt-3 block text-lg font-semibold leading-tight">{p.name.replace(/ \(mainstream\)| \(MAGA\)/, '')}</span>
                    <span className={`mt-0.5 block text-sm leading-tight ${on ? 'text-card/80' : 'text-ink-3'}`}>
                      {p.kind === 'party' ? 'Typical party platform' : p.role.replace(/\s*\(.*\)$/, '')}
                    </span>
                    <span className="mt-2 inline-flex items-center gap-1 text-xs" aria-label={PARTY_NAME[p.party]}>
                      <span aria-hidden="true" className="inline-block h-2 w-2 rounded-full ring-1 ring-card" style={{ background: PARTY_DOT[p.party] }} />
                      <span className={on ? 'text-card/80' : 'text-ink-3'}>{PARTY_NAME[p.party]}</span>
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
        </section>
      ))}
    </div>
  )
}

const ResultsScreen = forwardRef<
  HTMLHeadingElement,
  {
    baseline: HouseholdResult
    results: Row[]
    all: Platform[]
    url: string
    onExplain: (id: string) => void
    onShowPositions: (id: string) => void
    onChangeWho: () => void
    onEdit: () => void
    onFull: () => void
  }
>(function ResultsScreen({ baseline, results, all, url, onExplain, onShowPositions, onChangeWho, onEdit, onFull }, ref) {
  const byNet = (a: Row, b: Row) => b.result.netIncome - a.result.netIncome
  // Platforms that remove taxes without a modeled replacement can't be ranked against the rest: the
  // "gain" is only one side of the ledger. They get their own section with the reason spelled out.
  const ranked = results.filter((r) => !r.result.unfunded).sort(byNet)
  const unranked = results.filter((r) => r.result.unfunded).sort(byNet)
  const best = ranked[0]
  const bestDelta = best ? best.result.netIncome - baseline.netIncome : 0
  const allSame = ranked.length > 0 && ranked.every((r) => Math.abs(r.result.netIncome - baseline.netIncome) < 1)
  const bestSpend = best ? spendingSummary(best.platform, all) : undefined

  let title: React.ReactNode
  if (results.length === 0) title = 'Pick at least one candidate to see your results.'
  else if (ranked.length === 0) title = 'The plans you picked can’t be priced fairly. See why below.'
  else if (allSame) title = 'None of these plans changes what you keep.'
  else if (bestDelta > 0)
    title = (
      <>
        You’d keep about <span className="money whitespace-nowrap text-gain">{usd(bestDelta)} more</span> a year under {best.platform.shortName}.
      </>
    )
  else
    title = (
      <>
        Every plan here leaves you with less. {best.platform.shortName} costs you the least:{' '}
        <span className="money whitespace-nowrap text-loss">{usd(-bestDelta)}</span> a year.
      </>
    )

  return (
    <section>
      <p className="text-base font-semibold uppercase tracking-wide text-ink-3">Your results</p>
      <h1 ref={ref} tabIndex={-1} className="mt-1 font-serif text-3xl font-semibold leading-tight tracking-tight outline-none sm:text-4xl">
        {title}
      </h1>
      {best && bestSpend && !allSame && (
        <p className="mt-3 text-xl text-ink-2">
          The other side of that: {best.platform.shortName}’s plan would {tradeoffSentence(bestSpend)}.
        </p>
      )}
      <p className="mt-3 text-lg text-ink-2">
        Today your household keeps about <span className="money font-semibold text-ink">{usd(baseline.netIncome)}</span> a year after federal and
        state taxes and health costs. Lower taxes and bigger benefits both have a price: programs shrink, or the government borrows. Each card
        below shows both sides.
      </p>

      {ranked.length > 0 && (
        <ol className="mt-6 space-y-3" aria-label="Ranked by money left after taxes and healthcare">
          {ranked.map((row, i) => (
            <ResultCard key={row.platform.id} row={row} rank={i + 1} baseline={baseline} all={all} onExplain={onExplain} onShowPositions={onShowPositions} />
          ))}
        </ol>
      )}

      {unranked.length > 0 && (
        <section className="mt-8" aria-labelledby="unranked-h">
          <h2 id="unranked-h" className="text-xl font-semibold">
            Not ranked: the taxes go away, but so do the programs
          </h2>
          <p className="mt-1 text-base text-ink-2">
            {unranked.length === 1 ? 'This plan' : 'These plans'} would end federal programs (Medicare, Medicaid, Social Security or the income tax
            itself) without saying what replaces them. We can price the taxes you would stop paying, but not the coverage or benefits you would lose,
            so the number below is only half the story and is not compared with the others.
          </p>
          <ol className="mt-3 space-y-3">
            {unranked.map((row) => (
              <ResultCard key={row.platform.id} row={row} baseline={baseline} all={all} onExplain={onExplain} onShowPositions={onShowPositions} muted />
            ))}
          </ol>
        </section>
      )}

      <Receipt baseline={baseline} />

      <div className="mt-8 flex flex-wrap gap-3">
        <button type="button" onClick={onChangeWho} className="min-h-12 rounded-lg border border-rule px-5 text-base font-medium hover:bg-paper-2">
          Change who to compare
        </button>
        <button type="button" onClick={onEdit} className="min-h-12 rounded-lg border border-rule px-5 text-base font-medium hover:bg-paper-2">
          Edit my answers
        </button>
      </div>

      <div className="mt-8 rounded-card border border-rule bg-card p-5">
        <h2 className="text-xl font-semibold">Share or save this</h2>
        <p className="mt-1 text-base text-ink-2">The link remembers your answers and your picks. Nothing is sent to us.</p>
        <div className="mt-3">
          <ShareBar url={url} title="What Would I Pay?" size="lg" />
        </div>
      </div>

      <div className="mt-6 rounded-card border border-dashed border-rule p-5 text-base text-ink-2">
        <p>
          These are estimates for tax year 2026 from each candidate’s published positions, with a source behind every number. Spending figures
          come from the Congressional Budget Office where it has scored a plan, and otherwise from the named scorer or the campaign itself. We
          don’t model anything about character or electability.{' '}
          <a href="#/methodology" className="underline hover:text-ink">
            How the math works
          </a>
          , or open the{' '}
          <button type="button" onClick={onFull} className="underline hover:text-ink">
            full comparison
          </button>{' '}
          for every line item and the full spending table.
        </p>
      </div>
    </section>
  )
})

function list(xs: string[]): string {
  if (xs.length <= 1) return xs.join('')
  if (xs.length === 2) return `${xs[0]} and ${xs[1]}`
  return `${xs.slice(0, -1).join(', ')}, and ${xs[xs.length - 1]}`
}

function tradeoffSentence(s: ReturnType<typeof spendingSummary>): string {
  const parts: string[] = []
  if (s.more.length) parts.push(`spend more on ${list(s.more)}`)
  if (s.less.length) parts.push(`less on ${list(s.less)}`)
  const spend = parts.length ? parts.join(' and ') : 'leave spending about where it is'
  return `${spend}, and ${deficitPhrase(s.deficit)}`
}

function ResultCard({
  row,
  rank,
  baseline,
  all,
  onExplain,
  onShowPositions,
  muted = false,
}: {
  row: Row
  rank?: number
  baseline: HouseholdResult
  all: Platform[]
  onExplain: (id: string) => void
  onShowPositions: (id: string) => void
  muted?: boolean
}) {
  const { platform, result, attribution, benefits, sameAs } = row
  const delta = result.netIncome - baseline.netIncome
  const top = [...attribution.steps].sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))[0]
  const reason = sameAs
    ? sameAs === 'baseline'
      ? 'Nothing in this plan changes your taxes or health costs.'
      : `Same result for you as ${sameAs}.`
    : top
      ? `Mostly because of ${AREA_PHRASE[top.position.area]}.`
      : 'No change for your household.'
  const spend = spendingSummary(platform, all)
  return (
    <li className={`card rounded-card border bg-card ${muted ? 'border-dashed border-rule' : 'border-rule'}`}>
      <div className="flex items-center gap-4 p-4">
        {rank !== undefined && (
          <span className="hidden w-6 text-center text-base font-semibold text-ink-4 sm:block" aria-hidden="true">
            {rank}
          </span>
        )}
        <Avatar platform={platform} size={64} className="shrink-0" />
        <div className="min-w-0">
          <div className="text-xl font-semibold leading-tight">{platform.name}</div>
          <div className="mt-0.5 text-base text-ink-3">{platform.role.replace(/\s*\(.*\)$/, '')}</div>
        </div>
      </div>
      <div className="grid border-t border-rule-2 sm:grid-cols-2 sm:divide-x sm:divide-rule-2">
        <div className="p-4">
          <div className="text-sm font-semibold uppercase tracking-wide text-ink-3">Your wallet</div>
          <div className="mt-1 flex items-baseline gap-3">
            <span className={`text-2xl font-bold leading-none ${muted ? 'opacity-70' : ''}`}>
              <Delta v={delta} animate />
            </span>
            <span className="money text-sm text-ink-3">{usd(result.netIncome)} a year</span>
          </div>
          <div className="mt-1.5 text-base text-ink-2">{muted ? 'Taxes only. What you would lose in coverage or benefits is not priced.' : reason}</div>
        </div>
        <div className="border-t border-rule-2 p-4 sm:border-t-0">
          <div className="text-sm font-semibold uppercase tracking-wide text-ink-3">The budget</div>
          <ul className="mt-1 space-y-1 text-base text-ink-2">
            {spend.more.length > 0 && (
              <li>
                <span className="font-semibold text-gain">▲ More</span> on {list(spend.more)}
              </li>
            )}
            {spend.less.length > 0 && (
              <li>
                <span className="font-semibold text-loss">▼ Less</span> on {list(spend.less)}
              </li>
            )}
            {spend.more.length === 0 && spend.less.length === 0 && <li>No stated change to what the government spends on.</li>}
            <li className="text-ink-3">{capitalize(deficitPhrase(spend.deficit))}.</li>
          </ul>
        </div>
      </div>
      <WhatChanges items={benefits} platform={platform} />
      <div className="flex flex-wrap gap-2 border-t border-rule-2 px-4 py-2.5">
        <button type="button" onClick={() => onExplain(platform.id)} aria-haspopup="dialog" className="min-h-11 rounded-lg border border-rule px-4 text-base font-medium text-ink hover:bg-paper-2">
          Why this number?
        </button>
        <button
          type="button"
          onClick={() => onShowPositions(platform.id)}
          aria-haspopup="dialog"
          className="min-h-11 rounded-lg border border-rule px-4 text-base font-medium text-ink-2 hover:bg-paper-2"
        >
          Positions, spending and sources
        </button>
      </div>
    </li>
  )
}

const KIND: Record<BenefitItem['kind'], { glyph: string; cls: string; label: string }> = {
  gain: { glyph: '✓', cls: 'text-gain', label: 'you gain' },
  loss: { glyph: '✕', cls: 'text-loss', label: 'you lose' },
  change: { glyph: '•', cls: 'text-ink-3', label: 'changes' },
}

/** Concrete consequences for this household, beyond the dollar figure; each declared item links its source. */
function WhatChanges({ items, platform }: { items: BenefitItem[]; platform: Platform }) {
  const order: Record<BenefitItem['kind'], number> = { gain: 0, loss: 1, change: 2 }
  const sorted = [...items].sort((a, b) => order[a.kind] - order[b.kind])
  return (
    <div className="border-t border-rule-2 p-4">
      <div className="text-sm font-semibold uppercase tracking-wide text-ink-3">What changes for you</div>
      {sorted.length === 0 ? (
        <p className="mt-1 text-base text-ink-2">Nothing we can point to for your household beyond the dollar figure above.</p>
      ) : (
        <ul className="mt-1.5 space-y-1.5 text-base text-ink-2">
          {sorted.map((b) => (
            <li key={b.id} className="flex gap-2.5">
              <span aria-hidden="true" className={`w-4 shrink-0 text-center font-bold ${KIND[b.kind].cls}`}>
                {KIND[b.kind].glyph}
              </span>
              <span>
                <span className="sr-only">{KIND[b.kind].label}: </span>
                {b.text}
                {b.inherited && b.source && <span className="text-ink-3"> ({b.source.shortName} default)</span>}
                {b.citations[0] && (
                  <>
                    {' '}
                    <a href={b.citations[0].url} target="_blank" rel="noreferrer" className="whitespace-nowrap text-sm text-ink-3 underline hover:text-ink">
                      source
                    </a>
                  </>
                )}
              </span>
            </li>
          ))}
        </ul>
      )}
      {sorted.some((b) => b.citations.length === 0) && (
        <p className="mt-1.5 text-sm text-ink-3">Items without a source link are computed from the positions as modeled for {platform.shortName}; “Why this number?” shows the sources.</p>
      )}
    </div>
  )
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

/** Where this household's federal income tax goes today, in dollars, so "less tax" has a visible other side. */
function Receipt({ baseline }: { baseline: HouseholdResult }) {
  const incomeTax = Math.max(0, baseline.federalIncomeTax)
  const rows = RECEIPT.map((r) => ({ ...r, dollars: incomeTax * r.share }))
  const spent = rows.filter((r) => !r.borrowed).sort((a, b) => b.share - a.share)
  const borrowed = rows.find((r) => r.borrowed)
  const shown = spent.slice(0, 6)
  const rest = spent.slice(6).reduce((n, r) => n + r.dollars, 0)
  return (
    <section className="mt-8 rounded-card border border-rule bg-card p-5" aria-labelledby="receipt-h">
      <h2 id="receipt-h" className="text-xl font-semibold">
        What your taxes buy today
      </h2>
      {incomeTax <= 0 ? (
        <p className="mt-2 text-base text-ink-2">
          You owe no federal income tax under current law, because your credits are larger than your tax. Your{' '}
          <span className="money font-semibold text-ink">{usd(baseline.payrollTax)}</span> in payroll taxes still fund Social Security and Medicare.
        </p>
      ) : (
        <>
          <p className="mt-1 text-base text-ink-2">
            Your <span className="money font-semibold text-ink">{usd(incomeTax)}</span> in federal income tax is split roughly like this. Another{' '}
            <span className="money font-semibold text-ink">{usd(baseline.payrollTax)}</span> in payroll taxes goes to Social Security and Medicare.
          </p>
          <div className="mt-3 flex h-5 w-full overflow-hidden rounded bg-paper-2" role="img" aria-label="Your federal income tax split by budget function">
            {rows.map((r, i) => (
              <div
                key={r.id}
                title={`${r.label}: ${usd(r.dollars)}`}
                style={{
                  width: `${r.share * 100}%`,
                  background: r.borrowed ? 'repeating-linear-gradient(135deg, var(--color-ink-4) 0 3px, transparent 3px 6px)' : `oklch(${0.8 - i * 0.04} 0.04 ${200 + i * 12})`,
                }}
                className="h-full border-r border-card last:border-r-0"
              />
            ))}
          </div>
          <ul className="money mt-3 grid gap-x-8 gap-y-1 text-base text-ink-2 sm:grid-cols-2">
            {shown.map((r) => (
              <li key={r.id} className="flex justify-between gap-3">
                <span>{shortLabel(r.id, r.label)}</span>
                <span className="font-semibold text-ink">{usd(r.dollars)}</span>
              </li>
            ))}
            {rest > 0 && (
              <li className="flex justify-between gap-3">
                <span>Everything else</span>
                <span className="font-semibold text-ink">{usd(rest)}</span>
              </li>
            )}
            {borrowed && (
              <li className="flex justify-between gap-3 text-ink-3">
                <span>Spent but not paid for (borrowed)</span>
                <span className="font-semibold">{usd(borrowed.dollars)}</span>
              </li>
            )}
          </ul>
          <p className="mt-3 text-sm text-ink-3">
            Shares from the{' '}
            <a href={RECEIPT_SOURCE.url} target="_blank" rel="noreferrer" className="underline hover:text-ink">
              National Priorities Project
            </a>{' '}
            (fiscal 2025) and the Treasury. About a third of what Washington spends is borrowed, so a dollar of tax cut today is a dollar
            someone pays later.
          </p>
        </>
      )}
    </section>
  )
}

function shortLabel(id: string, label: string): string {
  const short: Record<string, string> = {
    health: 'Health care (Medicaid, Medicare)',
    interest: 'Interest on the national debt',
    military: 'Military',
    veterans: 'Veterans',
    income: 'Unemployment, SSI, tax credits',
    food: 'Food aid and farms',
    education: 'Education',
    housing: 'Housing',
    energy: 'Energy and environment',
    law: 'Border, immigration and law enforcement',
  }
  return short[id] ?? label
}
