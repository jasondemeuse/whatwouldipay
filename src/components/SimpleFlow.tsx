import { forwardRef, useEffect, useRef, useState } from 'react'
import type { Attribution } from '../engine/attribution'
import type { FilingStatus, HealthCoverage, Household, HouseholdResult, Platform } from '../engine/types'
import { STATE_LIST } from '../data/states'
import { PERSONAS } from '../data/personas'
import { AREA_PHRASE, PARTY_DOT, PARTY_NAME, parseMoney } from '../lib/labels'
import { usd } from '../lib/format'
import { Avatar } from './Avatar'
import { Delta } from './Delta'
import { ShareBar } from './ShareBar'

interface Row {
  platform: Platform
  result: HouseholdResult
  attribution: Attribution
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

const FILING_CARDS: Array<{ v: FilingStatus; label: string; hint: string; icon: string }> = [
  { v: 'single', label: 'Just me', hint: 'Single, no dependents', icon: '👤' },
  { v: 'mfj', label: 'Married', hint: 'We file a joint return', icon: '👥' },
  { v: 'hoh', label: 'Single parent', hint: 'I claim a child or dependent', icon: '👨‍👧' },
]

const COVERAGE_CARDS: Array<{ v: HealthCoverage; label: string; hint: string; icon: string }> = [
  { v: 'employer', label: 'Through work', hint: 'My or my spouse’s employer plan', icon: '🏢' },
  { v: 'marketplace', label: 'Healthcare.gov', hint: 'An Obamacare marketplace plan', icon: '🛒' },
  { v: 'medicaid', label: 'Medicaid', hint: 'State health coverage', icon: '🏥' },
  { v: 'medicare', label: 'Medicare', hint: 'Age 65+ or disability', icon: '🎂' },
  { v: 'uninsured', label: 'No insurance', hint: 'I pay out of pocket', icon: '🚫' },
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
  options: Array<{ v: string; label: string; hint: string; icon: string; on: boolean }>
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
            <span aria-hidden="true" className="text-3xl">
              {o.icon}
            </span>
            <span className="min-w-0">
              <span className="block text-xl font-semibold leading-tight">{o.label}</span>
              <span className={`block text-base ${o.on ? 'text-card/80' : 'text-ink-3'}`}>{o.hint}</span>
            </span>
            {o.on && (
              <span aria-hidden="true" className="ml-auto text-2xl">
                ✓
              </span>
            )}
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
                      <span aria-hidden="true" className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-card text-base font-bold text-ink">
                        ✓
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
    url: string
    onExplain: (id: string) => void
    onShowPositions: (id: string) => void
    onChangeWho: () => void
    onEdit: () => void
    onFull: () => void
  }
>(function ResultsScreen({ baseline, results, url, onExplain, onShowPositions, onChangeWho, onEdit, onFull }, ref) {
  const funded = results.filter((r) => !r.result.unfunded)
  const pool = funded.length ? funded : results
  const ranked = [...results].sort((a, b) => b.result.netIncome - a.result.netIncome)
  const best = [...pool].sort((a, b) => b.result.netIncome - a.result.netIncome)[0]
  const bestDelta = best ? best.result.netIncome - baseline.netIncome : 0
  const allSame = results.every((r) => Math.abs(r.result.netIncome - baseline.netIncome) < 1)

  let title: React.ReactNode
  if (results.length === 0) title = 'Pick at least one candidate to see your results.'
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
      <p className="mt-3 text-xl text-ink-2">
        Today, under current law, your household keeps about <span className="money font-semibold text-ink">{usd(baseline.netIncome)}</span> a year after
        federal and state taxes and health costs. Here is how each plan compares.
      </p>

      {ranked.length > 0 && (
        <ol className="mt-6 space-y-3" aria-label="Ranked by money left after taxes and healthcare">
          {ranked.map(({ platform, result, attribution, sameAs }, i) => {
            const delta = result.netIncome - baseline.netIncome
            const top = [...attribution.steps].sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))[0]
            const reason = sameAs
              ? sameAs === 'baseline'
                ? 'Nothing in this plan changes your taxes or health costs.'
                : `Same result for you as ${sameAs}.`
              : top
                ? `Mostly because of ${AREA_PHRASE[top.position.area]}.`
                : 'No change for your household.'
            return (
              <li key={platform.id} className="card rounded-card border border-rule bg-card">
                <div className="grid grid-cols-[auto_1fr] items-center gap-x-4 gap-y-2 p-4 sm:grid-cols-[auto_auto_1fr_auto]">
                  <span className="hidden w-6 text-center text-base font-semibold text-ink-4 sm:block" aria-hidden="true">
                    {i + 1}
                  </span>
                  <Avatar platform={platform} size={64} className="shrink-0" />
                  <div className="min-w-0">
                    <div className="text-xl font-semibold leading-tight">{platform.name}</div>
                    <div className="mt-0.5 text-base text-ink-2">{reason}</div>
                    {result.unfunded && <div className="mt-0.5 text-sm text-ink-3">Removes taxes without saying what replaces them, so this gain is overstated.</div>}
                  </div>
                  <div className="col-span-2 flex items-baseline justify-between gap-3 border-t border-rule-2 pt-2 sm:col-span-1 sm:block sm:border-0 sm:pt-0 sm:text-right">
                    <div className="text-2xl font-bold leading-none">
                      <Delta v={delta} animate />
                    </div>
                    <div className="money text-sm text-ink-3 sm:mt-1">{usd(result.netIncome)} a year</div>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 border-t border-rule-2 px-4 py-2.5">
                  <button
                    type="button"
                    onClick={() => onExplain(platform.id)}
                    aria-haspopup="dialog"
                    className="min-h-11 rounded-lg border border-rule px-4 text-base font-medium text-ink hover:bg-paper-2"
                  >
                    Why this number?
                  </button>
                  <button
                    type="button"
                    onClick={() => onShowPositions(platform.id)}
                    aria-haspopup="dialog"
                    className="min-h-11 rounded-lg border border-rule px-4 text-base font-medium text-ink-2 hover:bg-paper-2"
                  >
                    Positions and sources
                  </button>
                </div>
              </li>
            )
          })}
        </ol>
      )}

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
          These are estimates for tax year 2026 from each candidate’s published positions, with a source behind every number. We don’t model
          anything about character or electability.{' '}
          <a href="#/methodology" className="underline hover:text-ink">
            How the math works
          </a>
          , or open the{' '}
          <button type="button" onClick={onFull} className="underline hover:text-ink">
            full comparison
          </button>{' '}
          for every line item, the policy lever matrix and what each plan would spend more or less on.
        </p>
      </div>
    </section>
  )
})
