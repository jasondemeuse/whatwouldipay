import type { FilingStatus, HealthCoverage, Household } from '../engine/types'
import { STATE_LIST } from '../data/states'
import { PERSONAS } from '../data/personas'
import { COVERAGE_OPTIONS as COVERAGE, FILING_OPTIONS as FILING } from '../lib/labels'
import { Field, IntField, MoneyField, Section, inputCls } from './fields'

interface Props {
  value: Household
  onChange: (h: Household) => void
}

/** Field-by-field equality that does not depend on key order (JSON.stringify would). */
function sameHousehold(a: Household, b: Household): boolean {
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]) as Set<keyof Household>
  for (const k of keys) {
    const x = a[k]
    const y = b[k]
    if (Array.isArray(x) || Array.isArray(y)) {
      if (JSON.stringify(x ?? []) !== JSON.stringify(y ?? [])) return false
    } else if (x !== y) return false
  }
  return true
}

export function HouseholdForm({ value, onChange }: Props) {
  const set = <K extends keyof Household>(k: K, v: Household[K]) => onChange({ ...value, [k]: v })
  // Spouse income and age only enter the calculation on a joint return; a separate return is computed for one filer.
  const joint = value.filingStatus === 'mfj'
  const activePersona = PERSONAS.find((p) => sameHousehold(p.household, value))?.id

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
          <IntField label="Your age" value={value.age} max={120} onCommit={(n) => set('age', n)} />
          {joint && <IntField label="Spouse age" value={value.spouseAge} max={120} onCommit={(n) => set('spouseAge', n)} />}
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
