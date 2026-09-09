import type { Assumptions, PolicyParams } from './types'

export const DEFAULT_ASSUMPTIONS: Assumptions = {
  employerPremiumToWages: false,
  employerPayrollPassthrough: 0,
  tariffPassThrough: 1,
}

/** Mutates `p` in place to reflect the user's modeling assumptions. Call after applyPlatform. */
export function applyAssumptions(p: PolicyParams, a: Assumptions): PolicyParams {
  p.singlePayer.employerPremiumToWages = a.employerPremiumToWages
  p.singlePayer.employerPassthrough = a.employerPayrollPassthrough
  p.tariffs.pctOfIncome *= a.tariffPassThrough
  p.tariffs.maxAnnualCost *= a.tariffPassThrough
  return p
}
