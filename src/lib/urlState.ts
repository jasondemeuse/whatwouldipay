import type { Assumptions, FilingStatus, HealthCoverage, Household } from '../engine/types'
import { DEFAULT_ASSUMPTIONS } from '../engine/assumptions'

/**
 * Comparison state in the URL so any view is a shareable permalink.
 * Short keys keep links readable: ?fs=mfj&st=OH&w=52000&sw=31730&a=41&sa=39&k=1&hc=employer&p=party-dem,party-gop
 * Only values that differ from defaults are written.
 */
export interface AppState {
  household: Household
  selected: string[]
  assumptions: Assumptions
}

const H_KEYS: Array<[keyof Household, string]> = [
  ['filingStatus', 'fs'],
  ['state', 'st'],
  ['wages', 'w'],
  ['spouseWages', 'sw'],
  ['selfEmploymentIncome', 'se'],
  ['tipIncome', 'tip'],
  ['overtimeIncome', 'ot'],
  ['longTermGains', 'cg'],
  ['socialSecurityBenefits', 'ss'],
  ['age', 'a'],
  ['spouseAge', 'sa'],
  ['childrenUnder17', 'k'],
  ['otherDependents', 'od'],
  ['healthCoverage', 'hc'],
  ['employerPremiumEmployeeShare', 'ep'],
  ['saltPaid', 'salt'],
  ['otherItemized', 'itm'],
]

const FILING = new Set<FilingStatus>(['single', 'mfj', 'mfs', 'hoh'])
const COVERAGE = new Set<HealthCoverage>(['employer', 'marketplace', 'medicaid', 'medicare', 'uninsured'])

export function serialize(state: AppState, defaults: Household): string {
  const q = new URLSearchParams()
  for (const [key, short] of H_KEYS) {
    const v = state.household[key]
    if (v === undefined || v === defaults[key]) continue
    q.set(short, String(v))
  }
  if (state.selected.length) q.set('p', state.selected.join(','))
  const a = state.assumptions
  if (a.employerPremiumToWages) q.set('epw', '1')
  if (a.employerPayrollPassthrough !== DEFAULT_ASSUMPTIONS.employerPayrollPassthrough) q.set('ppt', String(a.employerPayrollPassthrough))
  if (a.tariffPassThrough !== DEFAULT_ASSUMPTIONS.tariffPassThrough) q.set('tpt', String(a.tariffPassThrough))
  return q.toString()
}

/** Returns null if the URL carries no state at all. */
export function parse(search: string, defaults: Household, validPlatformIds: Set<string>): AppState | null {
  const q = new URLSearchParams(search)
  if ([...q.keys()].length === 0) return null
  const h: Household = { ...defaults }
  for (const [key, short] of H_KEYS) {
    const raw = q.get(short)
    if (raw === null) continue
    if (key === 'filingStatus') {
      if (FILING.has(raw as FilingStatus)) h.filingStatus = raw as FilingStatus
    } else if (key === 'healthCoverage') {
      if (COVERAGE.has(raw as HealthCoverage)) h.healthCoverage = raw as HealthCoverage
    } else if (key === 'state') {
      if (/^[A-Z]{2}$/.test(raw)) h.state = raw
    } else {
      const n = Number(raw)
      if (Number.isFinite(n) && n >= 0) (h as unknown as Record<string, number>)[key] = Math.min(n, 1e9)
    }
  }
  const selected = (q.get('p') ?? '')
    .split(',')
    .filter((id) => validPlatformIds.has(id))
  const num = (k: string, fallback: number, allowed: number[]) => {
    const n = Number(q.get(k))
    return allowed.includes(n) ? n : fallback
  }
  const assumptions: Assumptions = {
    employerPremiumToWages: q.get('epw') === '1',
    employerPayrollPassthrough: num('ppt', DEFAULT_ASSUMPTIONS.employerPayrollPassthrough, [0, 0.5, 1]),
    tariffPassThrough: num('tpt', DEFAULT_ASSUMPTIONS.tariffPassThrough, [0.5, 1, 1.5]),
  }
  return { household: h, selected, assumptions }
}

export function permalink(state: AppState, defaults: Household): string {
  const qs = serialize(state, defaults)
  const base = `${location.origin}${location.pathname}`
  return qs ? `${base}?${qs}` : base
}
