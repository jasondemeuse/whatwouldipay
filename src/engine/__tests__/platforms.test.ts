import { describe, expect, it } from 'vitest'
import { applyPlatform, calculate } from '../calculate'
import { BASELINE_2026 } from '../../data/baseline2026'
import { PLATFORMS } from '../../data/platforms'
import type { Household } from '../types'

const households: Record<string, Household> = {
  'MFJ $105k, 2 kids, employer, OH': {
    filingStatus: 'mfj', wages: 65000, spouseWages: 40000, selfEmploymentIncome: 0, tipIncome: 0, overtimeIncome: 0,
    longTermGains: 0, socialSecurityBenefits: 0, age: 38, spouseAge: 36, childrenUnder17: 2, otherDependents: 0,
    state: 'OH', healthCoverage: 'employer', saltPaid: 0, otherItemized: 0,
  },
  'Single $32k, marketplace, TX': {
    filingStatus: 'single', wages: 32000, spouseWages: 0, selfEmploymentIncome: 0, tipIncome: 6000, overtimeIncome: 0,
    longTermGains: 0, socialSecurityBenefits: 0, age: 29, spouseAge: 0, childrenUnder17: 0, otherDependents: 0,
    state: 'TX', healthCoverage: 'marketplace', saltPaid: 0, otherItemized: 0,
  },
  'HoH $22k, 1 kid, Medicaid, GA': {
    filingStatus: 'hoh', wages: 22000, spouseWages: 0, selfEmploymentIncome: 0, tipIncome: 0, overtimeIncome: 0,
    longTermGains: 0, socialSecurityBenefits: 0, age: 31, spouseAge: 0, childrenUnder17: 1, otherDependents: 0,
    state: 'GA', healthCoverage: 'medicaid', saltPaid: 0, otherItemized: 0,
  },
  'MFJ $600k + $100k gains, CA': {
    filingStatus: 'mfj', wages: 400000, spouseWages: 200000, selfEmploymentIncome: 0, tipIncome: 0, overtimeIncome: 0,
    longTermGains: 100000, socialSecurityBenefits: 0, age: 50, spouseAge: 48, childrenUnder17: 1, otherDependents: 0,
    state: 'CA', healthCoverage: 'employer', saltPaid: 60000, otherItemized: 20000,
  },
  'Retired couple, Medicare, FL': {
    filingStatus: 'mfj', wages: 0, spouseWages: 0, selfEmploymentIncome: 0, tipIncome: 0, overtimeIncome: 0,
    longTermGains: 15000, socialSecurityBenefits: 48000, age: 70, spouseAge: 68, childrenUnder17: 0, otherDependents: 0,
    state: 'FL', healthCoverage: 'medicare', saltPaid: 0, otherItemized: 0,
  },
}

describe('all platforms produce finite results', () => {
  for (const [label, h] of Object.entries(households)) {
    it(label, () => {
      const base = calculate(h, BASELINE_2026, 'baseline')
      const rows: string[] = [`${label}: baseline net ${Math.round(base.netIncome)}`]
      for (const pl of PLATFORMS) {
        const r = calculate(h, applyPlatform(BASELINE_2026, pl, PLATFORMS), pl.id)
        for (const v of [r.federalIncomeTax, r.payrollTax, r.stateIncomeTax, r.healthcareCost, r.tariffCost, r.netIncome]) {
          expect(Number.isFinite(v)).toBe(true)
        }
        rows.push(`  ${pl.shortName.padEnd(16)} Δ ${String(Math.round(r.netIncome - base.netIncome)).padStart(8)}  fed ${Math.round(r.federalIncomeTax)} pay ${Math.round(r.payrollTax)} hc ${Math.round(r.healthcareCost)} tar ${Math.round(r.tariffCost)} cov ${r.effectiveCoverage}`)
      }
      console.log(rows.join('\n'))
    })
  }
})
