import { describe, expect, it } from 'vitest'
import { PLATFORMS } from '../../data/platforms'
import { BASELINE_2026 } from '../../data/baseline2026'
import { PERSONAS } from '../../data/personas'
import { DEFAULT_ASSUMPTIONS, applyAssumptions } from '../assumptions'
import { whatYouGet } from '../benefits'
import { applyPlatform, calculate, cloneParams } from '../calculate'
import type { Household } from '../types'

function get(household: Household, id: string) {
  const platform = PLATFORMS.find((p) => p.id === id)!
  const baseParams = applyAssumptions(cloneParams(BASELINE_2026), DEFAULT_ASSUMPTIONS)
  const params = applyAssumptions(applyPlatform(BASELINE_2026, platform, PLATFORMS), DEFAULT_ASSUMPTIONS)
  const baseline = calculate(household, baseParams, 'baseline')
  const result = calculate(household, params, id)
  return whatYouGet({ household, baseline, result, baseParams, params }, platform, PLATFORMS)
}

const median = PERSONAS.find((p) => p.id === 'median')!.household
const medicaidParent = PERSONAS.find((p) => p.id === 'singleparent')!.household

describe('what you would get', () => {
  it('derives single payer and the child credit from the model for a progressive platform', () => {
    const items = get(median, 'aoc')
    expect(items.find((b) => b.id === 'singlePayer')?.kind).toBe('gain')
    expect(items.find((b) => b.id === 'ctc')?.text).toMatch(/\$2,200 to \$3,600/)
  })

  it('shows current law as a change, not a gain, for the Republican baseline', () => {
    const items = get({ ...median, healthCoverage: 'marketplace' }, 'party-gop')
    expect(items.every((b) => b.kind !== 'gain')).toBe(true)
    expect(items.find((b) => b.id === 'acaExpired')).toBeTruthy()
  })

  it('inherits party rules and labels them, and overrides by id', () => {
    const kelly = get(median, 'kelly')
    const paidLeave = kelly.find((b) => b.id === 'paidLeave')
    expect(paidLeave?.inherited).toBe(true)
    expect(paidLeave?.source?.id).toBe('party-dem')
    const toddler = { ...median, childrenUnder17: 1, childAges: [2] }
    expect(get(toddler, 'harris').find((b) => b.id === 'childcare')?.text).toMatch(/7%/)
    expect(get(toddler, 'party-dem').find((b) => b.id === 'childcare')?.text).toMatch(/\$10 a day/)
  })

  it('reports losses when a platform removes coverage', () => {
    const items = get(medicaidParent, 'party-lib')
    expect(items.some((b) => b.kind === 'loss')).toBe(true)
  })

  it('never returns an empty sentence', () => {
    for (const p of PLATFORMS) for (const persona of PERSONAS) for (const b of get(persona.household, p.id)) expect(b.text.trim().length).toBeGreaterThan(10)
  })
})
