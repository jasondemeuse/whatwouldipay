import type { Platform, PolicyArea, PolicyPosition } from '../engine/types'
import { effectivePositions } from '../engine/calculate'

interface Props {
  platform: Platform
  all: Platform[]
  onClose: () => void
}

export const AREA_LABEL: Record<PolicyArea, string> = {
  incomeRates: 'Income tax rates',
  standardDeduction: 'Standard deduction',
  ctc: 'Child tax credit',
  eitc: 'Earned income credit',
  salt: 'SALT deduction cap',
  payroll: 'Payroll taxes / Social Security',
  tipsOvertime: 'No tax on tips & overtime',
  capitalGains: 'Capital gains & investment taxes',
  tariffs: 'Tariffs',
  socialSecurityBenefits: 'Tax on Social Security benefits',
  aca: 'ACA marketplace subsidies',
  medicaid: 'Medicaid',
  medicare: 'Medicare',
  singlePayer: 'Medicare for All / public option',
  other: 'Other',
}

const CONF: Record<PolicyPosition['confidence'], { label: string; cls: string; title: string }> = {
  high: { label: 'High', cls: 'bg-emerald-100 text-emerald-800', title: 'Explicit numeric proposal, sponsored bill, or signed law' },
  medium: { label: 'Medium', cls: 'bg-sky-100 text-sky-800', title: 'Clear stated direction, but without specific numbers' },
  low: { label: 'Low', cls: 'bg-amber-100 text-amber-800', title: 'Inferred from votes or general statements' },
  default: { label: 'Party default', cls: 'bg-slate-100 text-slate-600', title: 'No stated position found; inherited from the party baseline' },
}

export function PositionsPanel({ platform, all, onClose }: Props) {
  const positions = effectivePositions(platform, all)
  const order = Object.keys(AREA_LABEL) as PolicyArea[]
  positions.sort((a, b) => order.indexOf(a.area) - order.indexOf(b.area))

  return (
    <div className="fixed inset-0 z-40 flex justify-end bg-slate-900/40" onClick={onClose}>
      <aside
        className="h-full w-full max-w-xl overflow-y-auto bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label={`${platform.name} positions`}
      >
        <div className="sticky top-0 flex items-start justify-between gap-4 border-b border-slate-200 bg-white px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">{platform.name}</h2>
            <p className="text-sm text-slate-500">{platform.role}</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-md px-2 py-1 text-slate-500 hover:bg-slate-100" aria-label="Close">
            ✕
          </button>
        </div>
        <div className="space-y-5 px-6 py-5">
          <p className="text-sm text-slate-700">{platform.description}</p>
          <ul className="space-y-4">
            {positions.map((pos, i) => {
              const c = CONF[pos.confidence]
              return (
                <li key={`${pos.area}-${i}`} className={`rounded-lg border p-3 ${pos.inherited ? 'border-dashed border-slate-200 bg-slate-50/60' : 'border-slate-200'}`}>
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-sm font-semibold text-slate-900">{AREA_LABEL[pos.area]}</div>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${c.cls}`} title={c.title}>
                      {c.label}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-slate-700">{pos.summary}</p>
                  {pos.citations.length > 0 && (
                    <ul className="mt-2 space-y-0.5">
                      {pos.citations.map((cit, i) => (
                        <li key={i} className="text-xs">
                          <a href={cit.url} target="_blank" rel="noreferrer" className="text-indigo-600 underline hover:text-indigo-800">
                            {cit.label}
                          </a>
                          {cit.date && <span className="ml-1 text-slate-400">({cit.date})</span>}
                        </li>
                      ))}
                    </ul>
                  )}
                  {!pos.apply && !pos.inherited && !pos.holdsCurrentLaw && (
                    <p className="mt-1 text-xs italic text-slate-400">Recorded for context; no direct effect on this calculator.</p>
                  )}
                  {pos.holdsCurrentLaw && (
                    <p className="mt-1 text-xs italic text-slate-400">Current law kept; the party default is not applied here.</p>
                  )}
                  {pos.inherited && pos.apply && (
                    <p className="mt-1 text-xs italic text-slate-400">Applied from the party/lane baseline because no personal position was found.</p>
                  )}
                </li>
              )
            })}
          </ul>
          {platform.notes && platform.notes.length > 0 && (
            <div>
              <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">Also on the record</div>
              <ul className="list-disc space-y-1 pl-5 text-sm text-slate-600">
                {platform.notes.map((n, i) => (
                  <li key={i}>{n}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </aside>
    </div>
  )
}
