import type { Bracket, Household } from './types'
import { STATE_TAX } from '../data/states'
import { taxFromBrackets } from './brackets'

export interface StateTaxRule {
  code: string
  name: string
  type: 'none' | 'flat' | 'graduated'
  rate?: number
  /** Single-filer brackets. */
  brackets?: Bracket[]
  /** MFJ brackets if they differ; if `mfjDouble` the single thresholds are doubled. */
  bracketsMfj?: Bracket[]
  mfjDouble?: boolean
  standardDeduction?: { single: number; mfj: number } | null
  /** Per adult (and per dependent unless dependentExemption is set). */
  personalExemption?: number
  dependentExemption?: number
  /** State taxes wages but not capital gains (or vice versa). */
  taxesCapitalGainsOnly?: boolean
  notes?: string
  source?: string
}

/**
 * Rough state income tax: applies the state's brackets to federal AGI less the
 * state standard deduction and personal exemptions. Ignores local income taxes
 * and most state credits. Good enough for a directional estimate.
 */
export function computeStateTax(h: Household, agi: number, gains: number): number {
  const rule = STATE_TAX[h.state]
  if (!rule) return 0
  if (rule.taxesCapitalGainsOnly) {
    // Washington: tax applies only to long-term gains above the exclusion encoded in the brackets.
    return rule.brackets ? taxFromBrackets(gains, rule.brackets) : 0
  }
  if (rule.type === 'none') return 0
  const joint = h.filingStatus === 'mfj'
  const adults = joint ? 2 : 1
  const deps = h.childrenUnder17 + h.otherDependents
  const std = rule.standardDeduction ? (joint ? rule.standardDeduction.mfj : rule.standardDeduction.single) : 0
  const exemptions = (rule.personalExemption ?? 0) * adults + (rule.dependentExemption ?? rule.personalExemption ?? 0) * deps
  const taxable = Math.max(0, agi - std - exemptions)
  if (rule.type === 'flat') return taxable * (rule.rate ?? 0)
  let brackets = rule.brackets ?? []
  if (joint) {
    if (rule.bracketsMfj) brackets = rule.bracketsMfj
    else if (rule.mfjDouble) brackets = brackets.map((b) => ({ rate: b.rate, over: b.over * 2 }))
  }
  return taxFromBrackets(taxable, brackets)
}
