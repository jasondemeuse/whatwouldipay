import { useEffect, useRef } from 'react'
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

/** Mid-sentence phrasing for each area ("mostly from …"), preserving proper nouns. */
export const AREA_PHRASE: Record<PolicyArea, string> = {
  incomeRates: 'income tax rates',
  standardDeduction: 'the standard deduction',
  ctc: 'the child tax credit',
  eitc: 'the earned income credit',
  salt: 'the SALT cap',
  payroll: 'payroll taxes',
  tipsOvertime: 'the tips and overtime deductions',
  capitalGains: 'investment taxes',
  tariffs: 'tariffs',
  socialSecurityBenefits: 'taxes on Social Security benefits',
  aca: 'ACA subsidies',
  medicaid: 'Medicaid',
  medicare: 'Medicare',
  singlePayer: 'Medicare for All',
  other: 'other changes',
}

const CONF: Record<PolicyPosition['confidence'], { label: string; cls: string; title: string }> = {
  high: { label: 'High', cls: 'bg-ink text-card', title: 'Explicit numeric proposal, sponsored bill, or signed law' },
  medium: { label: 'Medium', cls: 'bg-ink/70 text-card', title: 'Clear stated direction, but without specific numbers' },
  low: { label: 'Low', cls: 'border border-ink-4 bg-card text-ink-2', title: 'Inferred from votes or general statements' },
  default: { label: 'Party default', cls: 'border border-dashed border-ink-4 bg-paper-2 text-ink-3', title: 'No stated position found; inherited from the party baseline' },
}

export function PositionsPanel({ platform, all, onClose }: Props) {
  const panelRef = useRef<HTMLElement>(null)
  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const panel = panelRef.current
    const focusables = () =>
      Array.from(panel?.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])') ?? [])
    focusables()[0]?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
        return
      }
      if (e.key === 'Tab') {
        // Keep focus inside the dialog.
        const els = focusables()
        if (els.length === 0) return
        const first = els[0]
        const last = els[els.length - 1]
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault()
          last.focus()
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault()
          first.focus()
        }
      }
    }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prev
      window.removeEventListener('keydown', onKey)
      opener?.focus?.()
    }
  }, [onClose])
  const positions = effectivePositions(platform, all)
  const order = Object.keys(AREA_LABEL) as PolicyArea[]
  positions.sort((a, b) => order.indexOf(a.area) - order.indexOf(b.area))

  return (
    <div className="fixed inset-0 z-40 flex justify-end bg-ink/40" onClick={onClose}>
      <aside
        ref={panelRef}
        className="h-full w-full max-w-xl overflow-y-auto bg-card shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={`${platform.name} positions`}
      >
        <div className="sticky top-0 flex items-start justify-between gap-4 border-b border-rule bg-card px-6 py-4">
          <div>
            <h2 className="font-serif text-xl font-semibold text-ink">{platform.name}</h2>
            <p className="text-sm text-ink-3">{platform.role}</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-md px-2 py-1 text-ink-3 hover:bg-paper-2" aria-label="Close">
            ✕
          </button>
        </div>
        <div className="space-y-5 px-6 py-5">
          <p className="text-sm text-ink-2">{platform.description}</p>
          <ul className="space-y-4">
            {positions.map((pos, i) => {
              const c = CONF[pos.confidence]
              return (
                <li key={`${pos.area}-${i}`} className={`rounded-lg border p-3 ${pos.inherited ? 'border-dashed border-rule bg-paper-2/60' : 'border-rule'}`}>
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-sm font-semibold text-ink">{AREA_LABEL[pos.area]}</div>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${c.cls}`} title={c.title}>
                      {c.label}
                      <span className="sr-only">: {c.title}</span>
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-ink-2">{pos.summary}</p>
                  {pos.citations.length > 0 && (
                    <ul className="mt-2 space-y-0.5">
                      {pos.citations.map((cit, i) => (
                        <li key={i} className="text-xs">
                          <a href={cit.url} target="_blank" rel="noreferrer" className="text-accent underline hover:text-ink">
                            {cit.label}
                          </a>
                          {cit.date && <span className="ml-1 text-ink-3">({cit.date})</span>}
                        </li>
                      ))}
                    </ul>
                  )}
                  {!pos.apply && !pos.inherited && !pos.holdsCurrentLaw && (
                    <p className="mt-1 text-xs italic text-ink-3">Recorded for context; no direct effect on this calculator.</p>
                  )}
                  {pos.holdsCurrentLaw && (
                    <p className="mt-1 text-xs italic text-ink-3">Current law kept; the party default is not applied here.</p>
                  )}
                  {pos.inherited && pos.apply && (
                    <p className="mt-1 text-xs italic text-ink-3">Applied from the party/lane baseline because no personal position was found.</p>
                  )}
                </li>
              )
            })}
          </ul>
          {platform.notes && platform.notes.length > 0 && (
            <div>
              <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-ink-3">Also on the record</div>
              <ul className="list-disc space-y-1 pl-5 text-sm text-ink-2">
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
