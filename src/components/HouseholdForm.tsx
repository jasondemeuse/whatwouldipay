import type { FilingStatus, HealthCoverage, Household } from '../engine/types'
import { STATE_LIST } from '../data/states'

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

export function HouseholdForm({ value, onChange }: Props) {
  const set = <K extends keyof Household>(k: K, v: Household[K]) => onChange({ ...value, [k]: v })
  const num = (k: keyof Household) => (e: React.ChangeEvent<HTMLInputElement>) =>
    set(k, (Number(e.target.value.replace(/[^0-9.]/g, '')) || 0) as never)
  const joint = value.filingStatus === 'mfj' || value.filingStatus === 'mfs'

  return (
    <div className="space-y-5">
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
          <Field label="Your age">
            <input className={inputCls} inputMode="numeric" value={value.age} onChange={num('age')} />
          </Field>
          {joint && (
            <Field label="Spouse age">
              <input className={inputCls} inputMode="numeric" value={value.spouseAge} onChange={num('spouseAge')} />
            </Field>
          )}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Children under 17">
            <input className={inputCls} inputMode="numeric" value={value.childrenUnder17} onChange={num('childrenUnder17')} />
          </Field>
          <Field label="Other dependents">
            <input className={inputCls} inputMode="numeric" value={value.otherDependents} onChange={num('otherDependents')} />
          </Field>
        </div>
      </Section>

      <Section title="Income (annual)">
        <Field label="Your wages (W-2)">
          <Money value={value.wages} onChange={num('wages')} />
        </Field>
        {joint && (
          <Field label="Spouse wages (W-2)">
            <Money value={value.spouseWages} onChange={num('spouseWages')} />
          </Field>
        )}
        <Field label="Self-employment income (net)">
          <Money value={value.selfEmploymentIncome} onChange={num('selfEmploymentIncome')} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="…of which tips" hint="Included in wages">
            <Money value={value.tipIncome} onChange={num('tipIncome')} />
          </Field>
          <Field label="…of which overtime premium" hint="The extra 'half' of time-and-a-half">
            <Money value={value.overtimeIncome} onChange={num('overtimeIncome')} />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Long-term capital gains">
            <Money value={value.longTermGains} onChange={num('longTermGains')} />
          </Field>
          <Field label="Social Security benefits">
            <Money value={value.socialSecurityBenefits} onChange={num('socialSecurityBenefits')} />
          </Field>
        </div>
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
          <Field label="Your share of premiums per year" hint="Leave blank to use the national average">
            <Money
              value={value.employerPremiumEmployeeShare ?? ''}
              placeholder="national avg"
              onChange={(e) => {
                const raw = e.target.value.replace(/[^0-9.]/g, '')
                set('employerPremiumEmployeeShare', raw === '' ? undefined : Number(raw))
              }}
            />
          </Field>
        )}
      </Section>

      <Section title="Deductions (optional)">
        <div className="grid grid-cols-2 gap-3">
          <Field label="State & local taxes paid" hint="Property + state income tax, for SALT">
            <Money value={value.saltPaid} onChange={num('saltPaid')} />
          </Field>
          <Field label="Other itemized" hint="Mortgage interest, charity">
            <Money value={value.otherItemized} onChange={num('otherItemized')} />
          </Field>
        </div>
      </Section>
    </div>
  )
}

const inputCls =
  'w-full rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500'

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset className="space-y-3">
      <legend className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">{title}</legend>
      {children}
    </fieldset>
  )
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-slate-700">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-slate-500">{hint}</span>}
    </label>
  )
}

function Money({
  value,
  onChange,
  placeholder,
}: {
  value: number | string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  placeholder?: string
}) {
  const display = typeof value === 'number' ? value.toLocaleString('en-US') : value
  return (
    <div className="relative">
      <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-slate-400">$</span>
      <input className={`${inputCls} pl-7`} inputMode="numeric" value={display} placeholder={placeholder} onChange={onChange} />
    </div>
  )
}
