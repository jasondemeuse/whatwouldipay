import type { Assumptions } from '../engine/types'
import { DEFAULT_ASSUMPTIONS } from '../engine/assumptions'
import { Segmented } from './Segmented'

interface Props {
  value: Assumptions
  onChange: (a: Assumptions) => void
  /** Whether any selected platform enables single payer (controls relevance hints). */
  singlePayerSelected: boolean
}

export function AssumptionsPanel({ value, onChange, singlePayerSelected }: Props) {
  const set = <K extends keyof Assumptions>(k: K, v: Assumptions[K]) => onChange({ ...value, [k]: v })
  const dirty = JSON.stringify(value) !== JSON.stringify(DEFAULT_ASSUMPTIONS)

  return (
    <section className="card rounded-card border border-caution/40 bg-caution-2/40 p-5" aria-labelledby="assumptions-h">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 id="assumptions-h" className="font-serif text-lg font-semibold text-ink">
            Assumptions that move these numbers
          </h2>
          <p className="mt-0.5 text-sm text-ink-2">
            These are judgment calls, not facts. Flip them and watch the results change. Defaults are the conservative reading described in
            the methodology.
          </p>
        </div>
        {dirty && (
          <button type="button" onClick={() => onChange(DEFAULT_ASSUMPTIONS)} className="shrink-0 text-xs text-ink-2 underline hover:text-ink">
            Reset to defaults
          </button>
        )}
      </div>

      <div className="mt-4 space-y-4">
        <Row
          title="Under single payer, does your employer's premium share become wages?"
          detail="Employers pay roughly $20,000 of a family premium today. Economists generally expect most of that to return as pay over time, but it would be taxable. Default: no, which understates single payer's gain for most employer-covered families."
          relevant={singlePayerSelected}
        >
          <Segmented
            label="Employer premium share becomes wages"
            value={value.employerPremiumToWages ? 'yes' : 'no'}
            options={[
              { v: 'no', label: 'No' },
              { v: 'yes', label: 'Yes, as taxable wages' },
            ]}
            onChange={(v) => set('employerPremiumToWages', v === 'yes')}
          />
        </Row>
        <Row
          title="Is the single-payer employer payroll premium (7.5%) passed to workers?"
          detail="Sanders' financing options include a 7.5% employer payroll premium. If employers offset it with lower wages, workers bear it. Default: 0%, which understates single payer's cost. Economists would normally flip these two switches together."
          relevant={singlePayerSelected}
        >
          <Segmented
            label="Employer payroll premium passed to workers"
            value={String(value.employerPayrollPassthrough)}
            options={[
              { v: '0', label: '0%' },
              { v: '0.5', label: '50%' },
              { v: '1', label: '100%' },
            ]}
            onChange={(v) => set('employerPayrollPassthrough', Number(v))}
          />
        </Row>
        <Row
          title="How much of tariff cost reaches consumers?"
          detail="Baseline is Tax Foundation's ~$840 per household for 2026. Studies of the 2018–25 tariffs found pass-through from about half to fully. Default: 100% of that estimate."
          relevant
        >
          <Segmented
            label="Tariff pass-through to consumers"
            value={String(value.tariffPassThrough)}
            options={[
              { v: '0.5', label: 'Half' },
              { v: '1', label: 'Baseline' },
              { v: '1.5', label: '1.5×' },
            ]}
            onChange={(v) => set('tariffPassThrough', Number(v))}
          />
        </Row>
      </div>
    </section>
  )
}

function Row({ title, detail, relevant, children }: { title: string; detail: string; relevant: boolean; children: React.ReactNode }) {
  return (
    <div className={`grid gap-2 md:grid-cols-[1fr_auto] md:items-start ${relevant ? '' : 'opacity-60'}`}>
      <div>
        <div className="text-sm font-medium text-ink">{title}</div>
        <div className="mt-0.5 text-xs text-ink-3">
          {detail}
          {!relevant && ' (No single-payer platform selected, so this has no effect right now.)'}
        </div>
      </div>
      <div>{children}</div>
    </div>
  )
}
