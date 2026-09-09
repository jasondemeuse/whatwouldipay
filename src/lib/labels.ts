import type { Party, PolicyArea } from '../engine/types'

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

/** Party identity as a small dot only. Fills stay neutral so the control never reads as a judgment. */
export const PARTY_DOT: Record<Party, string> = {
  D: 'var(--color-party-d)',
  R: 'var(--color-party-r)',
  I: 'var(--color-party-i)',
  L: 'var(--color-party-l)',
  G: 'var(--color-party-g)',
}

export const PARTY_NAME: Record<Party, string> = {
  D: 'Democrat',
  R: 'Republican',
  I: 'Independent',
  L: 'Libertarian',
  G: 'Green',
}

/** Parse a typed dollar amount forgivingly: "65k", "$1,200", "2.5m" all work. Returns [value, wasReinterpreted]. */
export function parseMoney(raw: string): [number, boolean] {
  const s = raw.trim().toLowerCase().replace(/[$,\s]/g, '')
  if (s === '') return [0, false]
  const m = s.match(/^(\d*\.?\d+)\s*(k|m)?$/)
  if (!m) return [Number(s.replace(/[^0-9.]/g, '')) || 0, true]
  const n = Number(m[1]) * (m[2] === 'k' ? 1000 : m[2] === 'm' ? 1_000_000 : 1)
  return [Math.round(n), m[2] !== undefined]
}

/** Repository and site constants. */
export const SITE = {
  repo: 'https://github.com/jasondemeuse/whatwouldipay',
  modelUpdated: '2026-09-09',
  modelUpdatedLabel: 'Sept 9, 2026',
}
