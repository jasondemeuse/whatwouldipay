import { describe, expect, it } from 'vitest'
import { calculate, acaNetPremium, acaPremiumForHousehold } from '../calculate'
import { BASELINE_2026 } from '../../data/baseline2026'
import type { Household } from '../types'

const base: Household = {
  filingStatus: 'single',
  wages: 60000,
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
  state: 'TX',
  healthCoverage: 'employer',
  saltPaid: 0,
  otherItemized: 0,
}

describe('federal income tax 2026', () => {
  it('single $60k, no kids', () => {
    const r = calculate(base, BASELINE_2026, 'b')
    expect(r.taxableIncome).toBe(43900)
    expect(r.federalIncomeTax).toBeCloseTo(1240 + (43900 - 12400) * 0.12, 0) // 5,020
    expect(r.payrollTax).toBeCloseTo(60000 * 0.0765, 0)
    expect(r.stateIncomeTax).toBe(0)
  })

  it('MFJ $105k, 2 kids gets full CTC', () => {
    const r = calculate({ ...base, filingStatus: 'mfj', wages: 65000, spouseWages: 40000, childrenUnder17: 2 }, BASELINE_2026, 'b')
    expect(r.taxableIncome).toBe(105000 - 32200)
    const gross = 2480 + (72800 - 24800) * 0.12 // 8,240
    expect(r.federalIncomeTaxBeforeCredits).toBeCloseTo(gross, 0)
    expect(r.nonRefundableCredits).toBe(4400)
    expect(r.federalIncomeTax).toBeCloseTo(gross - 4400, 0)
  })

  it('low-income HoH gets refundable CTC + EITC', () => {
    const r = calculate({ ...base, filingStatus: 'hoh', wages: 25000, childrenUnder17: 1, healthCoverage: 'medicaid' }, BASELINE_2026, 'b')
    expect(r.federalIncomeTaxBeforeCredits).toBeCloseTo(85, 0) // 25000-24150 = 850 * 10%
    // ACTC = min(1700, 15% * (25000-2500)) = 1700 ; EITC 1 child: max 4427, phaseout starts 23,890 → 4427 - (25000-23890)*.1598
    expect(r.refundableCredits).toBeCloseTo(1700 + (4427 - 1110 * 0.1598), 0)
    expect(r.federalIncomeTax).toBeLessThan(0)
  })

  it('tips deduction reduces taxable income', () => {
    const r = calculate({ ...base, tipIncome: 10000 }, BASELINE_2026, 'b')
    expect(r.taxableIncome).toBe(33900)
  })

  it('SS wage base caps OASDI', () => {
    const r = calculate({ ...base, wages: 300000 }, BASELINE_2026, 'b')
    const expected = 184500 * 0.062 + 300000 * 0.0145 + (300000 - 200000) * 0.009
    expect(r.payrollTax).toBeCloseTo(expected, 0)
  })

  it('state tax applies flat rate with exemptions (IL)', () => {
    const r = calculate({ ...base, state: 'IL' }, BASELINE_2026, 'b')
    expect(r.stateIncomeTax).toBeCloseTo((60000 - 2925) * 0.0495, 0)
  })
})

describe('ACA 2026', () => {
  it('subsidy for single age 40 at ~192% FPL', () => {
    const h = { ...base, wages: 30000, healthCoverage: 'marketplace' as const }
    const full = acaPremiumForHousehold(h, BASELINE_2026)
    expect(full).toBeCloseTo(7500, 0)
    const fplPct = (30000 / 15650) * 100
    const net = acaNetPremium(full, 30000, fplPct, BASELINE_2026)
    const pct = 0.0419 + ((fplPct - 150) / 50) * (0.066 - 0.0419)
    expect(net.premium).toBeCloseTo(30000 * pct, 0)
  })

  it('cliff above 400% FPL under current law', () => {
    const net = acaNetPremium(7500, 70000, 447, BASELINE_2026)
    expect(net.subsidy).toBe(0)
    expect(net.cliff).toBe(true)
  })

  it('Medicaid eligible adult in expansion state has no premium', () => {
    const r = calculate({ ...base, wages: 18000, state: 'CA', healthCoverage: 'medicaid' }, BASELINE_2026, 'b')
    expect(r.effectiveCoverage).toBe('medicaid')
  })

  it('coverage gap in non-expansion state below 100% FPL', () => {
    const r = calculate({ ...base, wages: 12000, state: 'TX', healthCoverage: 'medicaid' }, BASELINE_2026, 'b')
    expect(r.effectiveCoverage).toBe('coverageGap')
  })
})
