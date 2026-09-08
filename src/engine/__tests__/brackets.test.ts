import { describe, expect, it } from 'vitest'
import { taxFromBrackets } from '../brackets'

const b = [
  { rate: 0.1, over: 0 },
  { rate: 0.12, over: 10000 },
  { rate: 0.22, over: 40000 },
]

describe('taxFromBrackets', () => {
  it('returns 0 for non-positive income', () => {
    expect(taxFromBrackets(0, b)).toBe(0)
    expect(taxFromBrackets(-5, b)).toBe(0)
  })
  it('applies marginal rates progressively', () => {
    expect(taxFromBrackets(5000, b)).toBeCloseTo(500)
    expect(taxFromBrackets(10000, b)).toBeCloseTo(1000)
    expect(taxFromBrackets(20000, b)).toBeCloseTo(1000 + 1200)
    expect(taxFromBrackets(50000, b)).toBeCloseTo(1000 + 3600 + 2200)
  })
})
