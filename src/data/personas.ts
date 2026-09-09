import type { Household } from '../engine/types'

export interface Persona {
  id: string
  label: string
  hint: string
  household: Household
}

const base: Household = {
  filingStatus: 'single',
  wages: 0,
  spouseWages: 0,
  selfEmploymentIncome: 0,
  tipIncome: 0,
  overtimeIncome: 0,
  longTermGains: 0,
  socialSecurityBenefits: 0,
  age: 40,
  spouseAge: 40,
  childrenUnder17: 0,
  otherDependents: 0,
  state: 'OH',
  healthCoverage: 'employer',
  saltPaid: 0,
  otherItemized: 0,
}

/**
 * Starting points so the first thing a visitor sees is an answer, not an empty form.
 * Median household income: $83,730 (Census, Income in the United States: 2024, P60-286).
 * https://www.census.gov/library/publications/2025/demo/p60-286.html
 */
export const PERSONAS: Persona[] = [
  {
    id: 'median',
    label: 'Median household',
    hint: 'Married, $83,730 (Census 2024 median), one child, employer plan, Ohio',
    household: { ...base, filingStatus: 'mfj', wages: 52000, spouseWages: 31730, age: 41, spouseAge: 39, childrenUnder17: 1, state: 'OH' },
  },
  {
    id: 'family4',
    label: 'Family of four',
    hint: 'Married, $105,000 combined, two kids, employer plan, Michigan',
    household: { ...base, filingStatus: 'mfj', wages: 65000, spouseWages: 40000, age: 38, spouseAge: 36, childrenUnder17: 2, state: 'MI' },
  },
  {
    id: 'server',
    label: 'Restaurant server',
    hint: 'Single, $34,000 with $12,000 in tips, marketplace plan, Texas',
    household: { ...base, wages: 34000, tipIncome: 12000, age: 27, state: 'TX', healthCoverage: 'marketplace' },
  },
  {
    id: 'singleparent',
    label: 'Single parent on Medicaid',
    hint: 'Head of household, $26,000, one child, Georgia',
    household: { ...base, filingStatus: 'hoh', wages: 26000, age: 31, childrenUnder17: 1, state: 'GA', healthCoverage: 'medicaid' },
  },
  {
    id: 'selfemployed',
    label: 'Self-employed',
    hint: 'Single, $95,000 net business income, marketplace plan, Colorado',
    household: { ...base, selfEmploymentIncome: 95000, age: 45, state: 'CO', healthCoverage: 'marketplace' },
  },
  {
    id: 'retired',
    label: 'Retired couple',
    hint: 'Married, $48,000 Social Security + $15,000 gains, Medicare, Florida',
    household: { ...base, filingStatus: 'mfj', socialSecurityBenefits: 48000, longTermGains: 15000, age: 70, spouseAge: 68, state: 'FL', healthCoverage: 'medicare' },
  },
  {
    id: 'highearner',
    label: 'High earners',
    hint: 'Married, $600,000 wages + $100,000 gains, one child, itemizing, California',
    household: {
      ...base, filingStatus: 'mfj', wages: 400000, spouseWages: 200000, longTermGains: 100000, age: 50, spouseAge: 48,
      childrenUnder17: 1, state: 'CA', saltPaid: 60000, otherItemized: 20000,
    },
  },
]
