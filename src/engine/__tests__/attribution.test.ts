import { describe, expect, it } from 'vitest'
import { attribute } from '../attribution'
import { applyPlatform, calculate } from '../calculate'
import { applyAssumptions, DEFAULT_ASSUMPTIONS } from '../assumptions'
import { BASELINE_2026 } from '../../data/baseline2026'
import { PLATFORMS } from '../../data/platforms'
import type { Household } from '../types'

const h: Household = {
  filingStatus: 'mfj', wages: 65000, spouseWages: 40000, selfEmploymentIncome: 0, tipIncome: 0, overtimeIncome: 0,
  longTermGains: 0, socialSecurityBenefits: 0, age: 38, spouseAge: 36, childrenUnder17: 2, otherDependents: 0,
  state: 'OH', healthCoverage: 'employer', saltPaid: 0, otherItemized: 0,
}

describe('attribution', () => {
  it('steps sum exactly to the platform total for every platform', () => {
    for (const pl of PLATFORMS) {
      const attr = attribute(h, BASELINE_2026, pl, PLATFORMS, DEFAULT_ASSUMPTIONS)
      const direct = calculate(h, applyAssumptions(applyPlatform(BASELINE_2026, pl, PLATFORMS), DEFAULT_ASSUMPTIONS), pl.id)
      const sum = attr.steps.reduce((s, x) => s + x.delta, 0) + attr.noEffect.reduce((s, x) => s + x.delta, 0)
      expect(attr.final.netIncome).toBeCloseTo(direct.netIncome, 2)
      expect(attr.baseline.netIncome + sum).toBeCloseTo(direct.netIncome, 2)
    }
  })

  it('explains why AOC top rate and payroll cap do not bite for a $105k household', () => {
    const aoc = PLATFORMS.find((p) => p.id === 'aoc')!
    const attr = attribute(h, BASELINE_2026, aoc, PLATFORMS, DEFAULT_ASSUMPTIONS)
    const rates = attr.noEffect.find((s) => s.position.area === 'incomeRates')
    const payroll = attr.noEffect.find((s) => s.position.area === 'payroll')
    expect(rates?.zeroReason).toMatch(/\$10,000,000/)
    expect(payroll?.zeroReason).toMatch(/\$250,000/)
    const areas = attr.steps.map((s) => s.position.area)
    expect(areas).toContain('ctc')
    expect(areas).toContain('singlePayer')
  })

  it('employer-premium-to-wages assumption raises gross and taxes under single payer', () => {
    const sanders = PLATFORMS.find((p) => p.id === 'sanders')!
    const off = attribute(h, BASELINE_2026, sanders, PLATFORMS, DEFAULT_ASSUMPTIONS)
    const on = attribute(h, BASELINE_2026, sanders, PLATFORMS, { ...DEFAULT_ASSUMPTIONS, employerPremiumToWages: true })
    expect(on.final.grossIncome).toBeGreaterThan(off.final.grossIncome)
    expect(on.final.netIncome).toBeGreaterThan(off.final.netIncome)
    expect(on.final.federalIncomeTax).toBeGreaterThan(off.final.federalIncomeTax)
  })
})
