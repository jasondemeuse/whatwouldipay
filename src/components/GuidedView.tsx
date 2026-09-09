import { useState } from 'react'
import type { Attribution } from '../engine/attribution'
import type { FilingStatus, HealthCoverage, Household, HouseholdResult, Platform } from '../engine/types'
import { STATE_LIST } from '../data/states'
import { PERSONAS } from '../data/personas'
import { AREA_PHRASE, COVERAGE_OPTIONS as COVERAGE } from '../lib/labels'
import { usd } from '../lib/format'
import { Avatar } from './Avatar'
import { Delta } from './Delta'
import { Dialog } from './Dialog'
import { PlatformPicker } from './PlatformPicker'
import { ShareBar } from './ShareBar'
import { Verdict } from './Verdict'
import { Field, IntField, MoneyField, inputCls } from './fields'

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
  onExplain: (platformId: string) => void
  onShowPositions: (platformId: string) => void
  onFull: () => void
}

/** Three-choice filing status for the guided form; "married" maps to a joint return. */
const SIMPLE_FILING: Array<{ v: FilingStatus; label: string; hint: string }> = [
  { v: 'single', label: 'Single', hint: 'Not married, no dependents' },
  { v: 'mfj', label: 'Married', hint: 'Filing jointly with a spouse' },
  { v: 'hoh', label: 'Single parent', hint: 'Head of household with a dependent' },
]

/**
 * The short path: six questions, a ranked answer, and a way into the detail. Writes to the same household
 * state as the full form, so switching views never loses anything.
 */
export function GuidedView({ household, onHousehold, selected, onSelected, baseline, results, all, url, onExplain, onShowPositions, onFull }: Props) {
  const [picking, setPicking] = useState(false)
  const married = household.filingStatus === 'mfj' || household.filingStatus === 'mfs'
  const income = household.wages + household.spouseWages
  const set = <K extends keyof Household>(k: K, v: Household[K]) => onHousehold({ ...household, [k]: v })

  const setIncome = (n: number | undefined) => {
    const total = Math.max(0, n ?? 0)
    if (married) {
      const mine = Math.round(total / 2)
      onHousehold({ ...household, wages: mine, spouseWages: total - mine })
    } else {
      onHousehold({ ...household, wages: total, spouseWages: 0 })
    }
  }
  const setFiling = (fs: FilingStatus) => {
    const next = { ...household, filingStatus: fs }
    if (fs === 'mfj') {
      // Moving to a joint return: keep the household total, split it evenly, and assume a spouse of the same age.
      const mine = Math.round(income / 2)
      Object.assign(next, { wages: mine, spouseWages: income - mine, spouseAge: household.spouseAge || household.age })
    } else {
      Object.assign(next, { wages: income, spouseWages: 0 })
    }
    onHousehold(next)
  }
  const setKids = (n: number) => {
    const count = Math.min(n, 12)
    const ages = [...(household.childAges ?? [])].slice(0, count)
    while (ages.length < count) ages.push(8)
    onHousehold({ ...household, childrenUnder17: count, childAges: ages })
  }

  const ranked = [...results].sort((a, b) => b.result.netIncome - a.result.netIncome)
  const chosen = selected.map((id) => all.find((p) => p.id === id)).filter((p): p is Platform => !!p)

  return (
    <main id="main" className="mx-auto max-w-2xl space-y-5 px-4 py-6 pb-24 lg:pb-8">
      {/* 1. Household */}
      <section className="card rounded-card border border-rule bg-card p-5" aria-labelledby="g-you">
        <StepHeading n={1} id="g-you">
          About your household
        </StepHeading>
        <div className="mt-3 flex flex-wrap gap-1.5" role="group" aria-label="Start from an example">
          {PERSONAS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => onHousehold(p.household)}
              className="rounded-full border border-rule bg-card px-2.5 py-1 text-xs text-ink-2 transition-colors hover:border-ink-4 hover:bg-paper-2"
              title={p.hint}
            >
              {p.label}
            </button>
          ))}
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <fieldset className="sm:col-span-2">
            <legend className="mb-1 block text-sm font-medium text-ink-2">Filing status</legend>
            <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Filing status">
              {SIMPLE_FILING.map((f) => {
                const on = f.v === household.filingStatus || (f.v === 'mfj' && household.filingStatus === 'mfs')
                return (
                  <button
                    key={f.v}
                    type="button"
                    role="radio"
                    aria-checked={on}
                    title={f.hint}
                    onClick={() => setFiling(f.v)}
                    className={`rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${on ? 'border-ink bg-ink text-card' : 'border-rule bg-card text-ink hover:border-ink-4 hover:bg-paper-2'}`}
                  >
                    {f.label}
                  </button>
                )
              })}
            </div>
            {household.filingStatus === 'mfs' && (
              <p className="mt-1 text-xs text-ink-3">You are set to married filing separately; that only changes in the full comparison.</p>
            )}
          </fieldset>
          <MoneyField
            label={married ? 'Household wages (both of you)' : 'Your wages'}
            hint={married ? 'Split evenly between you here; the full comparison lets you split it yourself.' : 'Before taxes, for the year.'}
            value={income}
            onCommit={setIncome}
            width="lg"
          />
          <Field label="State">
            <select className={inputCls} value={household.state} onChange={(e) => set('state', e.target.value)}>
              {STATE_LIST.map((s) => (
                <option key={s.code} value={s.code}>
                  {s.name}
                </option>
              ))}
            </select>
          </Field>
          <IntField
            label="Your age"
            value={household.age}
            max={120}
            hint={married ? 'We assume your spouse is about the same age.' : undefined}
            onCommit={(n) => onHousehold({ ...household, age: n, spouseAge: married ? n : household.spouseAge })}
          />
          <IntField label="Children under 17" value={household.childrenUnder17} onCommit={setKids} />
          <Field label="Health coverage today">
            <select className={inputCls} value={household.healthCoverage} onChange={(e) => set('healthCoverage', e.target.value as HealthCoverage)}>
              {COVERAGE.map((c) => (
                <option key={c.v} value={c.v}>
                  {c.label}
                </option>
              ))}
            </select>
          </Field>
        </div>
        <p className="mt-3 text-xs text-ink-3">
          Self-employment, tips, overtime, investment income, Social Security and itemized deductions are in the{' '}
          <button type="button" onClick={onFull} className="underline hover:text-ink">
            full comparison
          </button>
          .
        </p>
      </section>

      {/* 2. Who */}
      <section className="card rounded-card border border-rule bg-card p-5" aria-labelledby="g-who">
        <div className="flex items-start justify-between gap-3">
          <StepHeading n={2} id="g-who">
            Who to compare
          </StepHeading>
          <button
            type="button"
            onClick={() => setPicking(true)}
            aria-haspopup="dialog"
            className="shrink-0 rounded-md border border-rule px-2.5 py-1 text-xs font-medium text-ink-2 hover:bg-paper-2"
          >
            {chosen.length ? 'Change' : 'Choose'}
          </button>
        </div>
        {chosen.length === 0 ? (
          <p className="mt-3 text-sm text-ink-2">Nobody selected yet. Choose up to eight politicians or party baselines.</p>
        ) : (
          <ul className="mt-3 flex flex-wrap gap-2">
            {chosen.map((p) => (
              <li key={p.id} className="inline-flex items-center gap-2 rounded-full border border-rule bg-card py-1 pl-1 pr-1 text-sm font-medium text-ink">
                <Avatar platform={p} size={26} />
                <span className="whitespace-nowrap">{p.shortName}</span>
                <button
                  type="button"
                  onClick={() => onSelected(selected.filter((id) => id !== p.id))}
                  aria-label={`Remove ${p.name}`}
                  className="rounded-full px-1.5 text-ink-3 hover:bg-paper-2 hover:text-ink"
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* 3. Answer */}
      <section className="card rounded-card border border-rule bg-card p-5" aria-labelledby="g-answer">
        <StepHeading n={3} id="g-answer">
          What you would keep
        </StepHeading>
        <div className="mt-3">
          <Verdict baseline={baseline} results={results} all={all} onOpenFull={onFull} />
        </div>
        {ranked.length > 0 && (
          <ol className="mt-4 divide-y divide-rule-2 overflow-hidden rounded-lg border border-rule" aria-label="Ranked by money left after taxes and healthcare">
            <li className="flex items-center justify-between gap-3 bg-paper-2 px-3 py-2 text-xs text-ink-3">
              <span>Current law today</span>
              <span className="money text-sm font-semibold text-ink">{usd(baseline.netIncome)}</span>
            </li>
            {ranked.map(({ platform, result, attribution, sameAs }) => {
              const delta = result.netIncome - baseline.netIncome
              const top = [...attribution.steps].sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))[0]
              const reason = sameAs
                ? sameAs === 'baseline'
                  ? 'Nothing in this platform reaches your household'
                  : `Same modeled result as ${sameAs}`
                : top
                  ? `Mostly from ${AREA_PHRASE[top.position.area]}`
                  : 'No modeled change for you'
              return (
                <li key={platform.id}>
                  <button
                    type="button"
                    onClick={() => onExplain(platform.id)}
                    aria-haspopup="dialog"
                    className="flex w-full items-center gap-3 px-3 py-3 text-left transition-colors hover:bg-paper-2"
                  >
                    <Avatar platform={platform} size={40} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-ink">{platform.name}</span>
                      <span className="block truncate text-xs text-ink-3">
                        {reason}
                        {result.unfunded ? ' · removes taxes without a modeled replacement' : ''}
                      </span>
                    </span>
                    <span className="shrink-0 text-right">
                      <span className="block text-base font-semibold">
                        <Delta v={delta} animate />
                      </span>
                      <span className="money block text-xs text-ink-3">{usd(result.netIncome)} a year</span>
                    </span>
                  </button>
                </li>
              )
            })}
          </ol>
        )}
        {ranked.length > 0 && (
          <p className="mt-2 text-xs text-ink-3">
            Tap a name to see which policies move your number, or open{' '}
            <button type="button" onClick={() => onShowPositions(ranked[0].platform.id)} className="underline hover:text-ink">
              positions and sources
            </button>
            .
          </p>
        )}
        <div className="mt-4 border-t border-rule-2 pt-3">
          <ShareBar url={url} title="What Would I Pay?" />
        </div>
      </section>

      <section className="rounded-card border border-dashed border-rule p-5 text-center">
        <h2 className="font-serif text-lg font-semibold text-ink">Want the whole picture?</h2>
        <p className="mx-auto mt-1 max-w-md text-sm text-ink-2">
          The full comparison has every tax and healthcare line item, a matrix of which policy lever moves your number, what each platform
          would spend more or less on, and the assumptions you can change.
        </p>
        <button
          type="button"
          onClick={onFull}
          className="mt-3 rounded-md bg-ink px-4 py-2 text-sm font-medium text-card transition-colors hover:bg-ink/90"
        >
          Open the full comparison
        </button>
      </section>

      {picking && (
        <Dialog label="Choose who to compare" onClose={() => setPicking(false)}>
          <div className="rounded-t-card border border-rule bg-card p-5 sm:rounded-card">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="font-serif text-lg font-semibold text-ink">Who do you want to compare?</h2>
                <p className="mt-0.5 text-sm text-ink-2">Pick up to eight. Party baselines show what a typical platform from each side does.</p>
              </div>
              <button type="button" onClick={() => setPicking(false)} className="rounded-md px-2 py-1 text-xs text-ink-3 hover:bg-paper-2" aria-label="Close">
                ✕
              </button>
            </div>
            <div className="mt-4">
              <PlatformPicker platforms={all} selected={selected} onChange={onSelected} />
            </div>
            <div className="mt-4 flex justify-end">
              <button type="button" onClick={() => setPicking(false)} className="rounded-md bg-ink px-4 py-2 text-sm font-medium text-card hover:bg-ink/90">
                Done
              </button>
            </div>
          </div>
        </Dialog>
      )}
    </main>
  )
}

function StepHeading({ n, id, children }: { n: number; id: string; children: React.ReactNode }) {
  return (
    <h2 id={id} className="flex items-center gap-2 font-serif text-lg font-semibold text-ink">
      <span aria-hidden="true" className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-ink font-sans text-xs font-semibold text-card">
        {n}
      </span>
      {children}
    </h2>
  )
}
