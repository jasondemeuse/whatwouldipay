import { useState } from 'react'
import type { FilingStatus, HealthCoverage, Household } from '../engine/types'
import { STATE_LIST } from '../data/states'
import { PERSONAS } from '../data/personas'

interface Props {
  value: Household
  onChange: (h: Household) => void
}

const FILING: Array<{ v: FilingStatus; label: string }> = [
  { v: 'single', label: 'Single' },
  { v: 'mfj', label: 'Married filing jointly' },
  { v: 'mfs', label: 'Married filing separately' },
  { v: 'hoh', label: 'Head of household' },
]

const COVERAGE: Array<{ v: HealthCoverage; label: string }> = [
  { v: 'employer', label: 'Employer plan' },
  { v: 'marketplace', label: 'ACA marketplace' },
  { v: 'medicaid', label: 'Medicaid' },
  { v: 'medicare', label: 'Medicare' },
  { v: 'uninsured', label: 'Uninsured' },
]

/** Parse a typed dollar amount forgivingly: "65k", "$1,200", "2.5m" all work. Returns [value, wasReinterpreted]. */
export function parseMoney(raw: string): [number, boolean] {
  const s = raw.trim().toLowerCase().replace(/[$,\s]/g, '')
  if (s === '') return [0, false]
  const m = s.match(/^(\d*\.?\d+)\s*(k|m)?$/)
  if (!m) return [Number(s.replace(/[^0-9.]/g, '')) || 0, true]
  const n = Number(m[1]) * (m[2] === 'k' ? 1000 : m[2] === 'm' ? 1_000_000 : 1)
  return [Math.round(n), m[2] !== undefined]
}

export function HouseholdForm({ value, onChange }: Props) {
  const set = <K extends keyof Household>(k: K, v: Household[K]) => onChange({ ...value, [k]: v })
  const joint = value.filingStatus === 'mfj' || value.filingStatus === 'mfs'
  const activePersona = PERSONAS.find((p) => JSON.stringify(p.household) === JSON.stringify(value))?.id

  const money = (k: keyof Household, label: string, hint?: string, width: 'sm' | 'md' = 'md') => (
    <MoneyField
      label={label}
      hint={hint}
      width={width}
      value={value[k] as number}
      onCommit={(n) => set(k, n as never)}
    />
  )

  return (
    <div className="space-y-6">
      <Section title="Start from an example">
        <div className="flex flex-wrap gap-1.5" role="group" aria-label="Example households">
          {PERSONAS.map((p) => {
            const on = activePersona === p.id
            return (
              <button
                key={p.id}
                type="button"
                aria-pressed={on}
                title={p.hint}
                onClick={() => onChange(p.household)}
                className={`rounded-full border px-2.5 py-1 text-xs font-medium transition-colors ${
                  on ? 'border-accent bg-accent-2 text-ink' : 'border-rule bg-card text-ink-2 hover:border-ink-4 hover:text-ink'
                }`}
              >
                {p.label}
              </button>
            )
          })}
        </div>
        {activePersona && <p className="text-xs text-ink-3">{PERSONAS.find((p) => p.id === activePersona)?.hint}. Edit anything below.</p>}
      </Section>

      <Section title="Household">
        <Field label="Filing status">
          <select className={inputCls} value={value.filingStatus} onChange={(e) => set('filingStatus', e.target.value as FilingStatus)}>
            {FILING.map((f) => (
              <option key={f.v} value={f.v}>
                {f.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="State">
          <select className={inputCls} value={value.state} onChange={(e) => set('state', e.target.value)}>
            {STATE_LIST.map((s) => (
              <option key={s.code} value={s.code}>
                {s.name}
              </option>
            ))}
          </select>
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <IntField label="Your age" value={value.age} onCommit={(n) => set('age', n)} />
          {joint && <IntField label="Spouse age" value={value.spouseAge} onCommit={(n) => set('spouseAge', n)} />}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <IntField
            label="Children under 17"
            value={value.childrenUnder17}
            onCommit={(n) => {
              const count = Math.min(n, 12)
              const ages = [...(value.childAges ?? [])].slice(0, count)
              while (ages.length < count) ages.push(8)
              onChange({ ...value, childrenUnder17: count, childAges: ages })
            }}
          />
          <IntField label="Other dependents" value={value.otherDependents} onCommit={(n) => set('otherDependents', n)} />
        </div>
        {value.childrenUnder17 > 0 && (
          <fieldset>
            <legend className="mb-1 block text-sm font-medium text-ink-2">Children's ages</legend>
            <div className="flex flex-wrap gap-2">
              {Array.from({ length: value.childrenUnder17 }, (_, i) => (
                <input
                  key={i}
                  className={`${inputCls} w-14 text-center`}
                  inputMode="numeric"
                  aria-label={`Age of child ${i + 1}`}
                  value={(value.childAges ?? [])[i] ?? 8}
                  onChange={(e) => {
                    const ages = [...(value.childAges ?? [])]
                    while (ages.length < value.childrenUnder17) ages.push(8)
                    ages[i] = Math.min(17, Math.max(0, Math.floor(Number(e.target.value.replace(/[^0-9]/g, '')) || 0)))
                    set('childAges', ages)
                  }}
                />
              ))}
            </div>
            <span className="mt-1 block text-xs text-ink-3">Used for age-tiered child credits, marketplace pricing, and Medicaid work-requirement exemptions.</span>
          </fieldset>
        )}
      </Section>

      <Section title="Income (annual)">
        {money('wages', 'Your wages (W-2)')}
        {joint && money('spouseWages', 'Spouse wages (W-2)')}
        {money('selfEmploymentIncome', 'Self-employment income (net)')}
        <details className="group rounded-md border border-rule-2 bg-paper-2/60 px-3 py-2" open={value.tipIncome > 0 || value.overtimeIncome > 0}>
          <summary className="cursor-pointer text-sm font-medium text-ink-2 marker:text-ink-4">Any tips or overtime in those wages?</summary>
          <div className="mt-3 grid grid-cols-2 gap-3">
            {money('tipIncome', 'Tips', 'Included in wages', 'sm')}
            {money('overtimeIncome', 'Overtime premium', "The extra 'half' of time-and-a-half", 'sm')}
          </div>
        </details>
        <details className="group rounded-md border border-rule-2 bg-paper-2/60 px-3 py-2" open={value.longTermGains > 0 || value.socialSecurityBenefits > 0}>
          <summary className="cursor-pointer text-sm font-medium text-ink-2 marker:text-ink-4">Investment or Social Security income?</summary>
          <div className="mt-3 grid grid-cols-2 gap-3">
            {money('longTermGains', 'Long-term capital gains', undefined, 'sm')}
            {money('socialSecurityBenefits', 'Social Security benefits', undefined, 'sm')}
          </div>
        </details>
      </Section>

      <Section title="Health coverage">
        <Field label="How are you covered today?">
          <select className={inputCls} value={value.healthCoverage} onChange={(e) => set('healthCoverage', e.target.value as HealthCoverage)}>
            {COVERAGE.map((c) => (
              <option key={c.v} value={c.v}>
                {c.label}
              </option>
            ))}
          </select>
        </Field>
        {value.healthCoverage === 'employer' && (
          <MoneyField
            label="Your share of premiums per year"
            hint="Leave blank to use the national average"
            value={value.employerPremiumEmployeeShare}
            placeholder="national avg"
            allowBlank
            onCommit={(n) => set('employerPremiumEmployeeShare', n === undefined ? undefined : n)}
          />
        )}
      </Section>

      <details className="group rounded-md border border-rule-2 bg-paper-2/60 px-3 py-2" open={value.saltPaid > 0 || value.otherItemized > 0}>
        <summary className="cursor-pointer text-sm font-medium text-ink-2 marker:text-ink-4">Do you itemize deductions?</summary>
        <div className="mt-3 grid grid-cols-2 gap-3">
          {money('saltPaid', 'State & local taxes paid', 'Property + state income tax', 'sm')}
          {money('otherItemized', 'Other itemized', 'Mortgage interest, charity', 'sm')}
        </div>
      </details>
    </div>
  )
}

const inputCls =
  'w-full rounded-md border border-rule bg-card px-3 py-1.5 text-sm text-ink shadow-none transition-colors hover:border-ink-4'

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset className="space-y-3">
      <legend className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-3">{title}</legend>
      {children}
    </fieldset>
  )
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-ink-2">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-ink-3">{hint}</span>}
    </label>
  )
}

function IntField({ label, value, onCommit }: { label: string; value: number; onCommit: (n: number) => void }) {
  return (
    <Field label={label}>
      <input
        className={`${inputCls} max-w-24`}
        inputMode="numeric"
        value={value}
        onChange={(e) => onCommit(Math.max(0, Math.floor(Number(e.target.value.replace(/[^0-9]/g, '')) || 0)))}
      />
    </Field>
  )
}

/**
 * Money input per GOV.UK guidance: text input, `$` prefix hidden from AT, inputmode numeric, width sized to
 * content. Accepts "65k" style shorthand and shows how it was read.
 */
function MoneyField({
  label,
  hint,
  value,
  onCommit,
  placeholder,
  allowBlank = false,
  width = 'md',
}: {
  label: string
  hint?: string
  value: number | undefined
  onCommit: (n: number | undefined) => void
  placeholder?: string
  allowBlank?: boolean
  width?: 'sm' | 'md'
}) {
  const [draft, setDraft] = useState<string | null>(null)
  const [note, setNote] = useState<string | null>(null)
  const display = draft ?? (value === undefined ? '' : value.toLocaleString('en-US'))

  const commit = (raw: string) => {
    setDraft(null)
    if (raw.trim() === '') {
      setNote(null)
      onCommit(allowBlank ? undefined : 0)
      return
    }
    const [n, reinterpreted] = parseMoney(raw)
    onCommit(n)
    setNote(reinterpreted ? `Read as $${n.toLocaleString('en-US')}` : null)
  }

  return (
    <Field label={label} hint={note ?? hint}>
      <div className={`relative ${width === 'sm' ? 'max-w-36' : 'max-w-48'}`}>
        <span aria-hidden="true" className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-ink-4">
          $
        </span>
        <input
          className={`${inputCls} money pl-7`}
          inputMode="numeric"
          autoComplete="off"
          value={display}
          placeholder={placeholder}
          onChange={(e) => {
            setDraft(e.target.value)
            // Commit live for plain numbers so results update as you type; shorthand commits on blur.
            const [n] = parseMoney(e.target.value)
            if (/^[\d,$\s.]*$/.test(e.target.value)) onCommit(e.target.value.trim() === '' && allowBlank ? undefined : n)
          }}
          onBlur={(e) => commit(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') (e.target as HTMLInputElement).blur()
          }}
        />
      </div>
    </Field>
  )
}
