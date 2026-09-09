import { describe, expect, it } from 'vitest'
import { parse, serialize } from '../urlState'
import { PERSONAS } from '../../data/personas'
import { DEFAULT_ASSUMPTIONS } from '../../engine/assumptions'

const defaults = PERSONAS[0].household
const ids = new Set(['party-dem', 'party-gop', 'aoc'])

describe('url state', () => {
  it('round-trips a changed household, selection and assumptions', () => {
    const state = {
      household: { ...defaults, wages: 156000, spouseWages: 40000, childrenUnder17: 0, state: 'MI', tipIncome: 0 },
      selected: ['party-dem', 'aoc'],
      assumptions: { ...DEFAULT_ASSUMPTIONS, employerPremiumToWages: true, tariffPassThrough: 1.5 },
    }
    const qs = serialize(state, defaults)
    expect(qs).toContain('w=156000')
    expect(qs).not.toContain('fs=') // unchanged from default
    const back = parse('?' + qs, defaults, ids)!
    expect(back.household).toEqual(state.household)
    expect(back.selected).toEqual(['party-dem', 'aoc'])
    expect(back.assumptions).toEqual(state.assumptions)
  })

  it('returns null for an empty query and ignores junk', () => {
    expect(parse('', defaults, ids)).toBeNull()
    const back = parse('?fs=bogus&w=-5&st=xx&p=nope,aoc&ppt=0.3', defaults, ids)!
    expect(back.household.filingStatus).toBe(defaults.filingStatus)
    expect(back.household.wages).toBe(defaults.wages)
    expect(back.household.state).toBe(defaults.state)
    expect(back.selected).toEqual(['aoc'])
    expect(back.assumptions.employerPayrollPassthrough).toBe(0)
  })
})

describe('url state hardening', () => {
  it('ignores tracking parameters instead of wiping saved state', () => {
    expect(parse('?fbclid=abc&utm_source=x', defaults, ids)).toBeNull()
  })
  it('round-trips an intentionally empty selection', () => {
    const qs = serialize({ household: defaults, selected: [], assumptions: DEFAULT_ASSUMPTIONS }, defaults)
    expect(parse('?' + qs, defaults, ids)!.selected).toEqual([])
  })
  it('clamps counts, dedupes and caps platforms, and rejects malformed ages', () => {
    const back = parse('?k=1000000000&od=99&a=999&p=aoc,aoc,party-dem&ka=5,abc', defaults, ids)!
    expect(back.household.childrenUnder17).toBe(12)
    expect(back.household.otherDependents).toBe(12)
    expect(back.household.age).toBe(120)
    expect(back.selected).toEqual(['aoc', 'party-dem'])
    expect(back.household.childAges).toEqual(defaults.childAges)
  })
})
