import type { Assumptions, PolicyParams } from './types'

export const DEFAULT_ASSUMPTIONS: Assumptions = {
  employerPremiumToWages: false,
  employerPayrollPassthrough: 0,
  tariffPassThrough: 1,
}

/** Fields owned by the user's assumptions; platform positions must not write them. */
export const ASSUMPTION_OWNED_PATHS = ['singlePayer.employerPremiumToWages', 'singlePayer.employerPassthrough', 'tariffs.passThrough'] as const

/** Sets assumption-owned fields on `p` in place. Idempotent: applying twice is the same as once. Call after applyPlatform. */
export function applyAssumptions(p: PolicyParams, a: Assumptions): PolicyParams {
  p.singlePayer.employerPremiumToWages = a.employerPremiumToWages
  p.singlePayer.employerPassthrough = a.employerPayrollPassthrough
  p.tariffs.passThrough = a.tariffPassThrough
  return p
}
