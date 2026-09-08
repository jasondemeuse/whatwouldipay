import type { Bracket } from './types'

/** Progressive tax on `taxable` given marginal brackets sorted by `over` ascending. */
export function taxFromBrackets(taxable: number, brackets: Bracket[]): number {
  if (taxable <= 0) return 0
  let tax = 0
  for (let i = 0; i < brackets.length; i++) {
    const b = brackets[i]
    const next = brackets[i + 1]
    const upper = next ? next.over : Infinity
    if (taxable > b.over) {
      tax += (Math.min(taxable, upper) - b.over) * b.rate
    }
  }
  return tax
}
