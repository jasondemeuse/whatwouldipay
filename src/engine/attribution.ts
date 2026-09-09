import { calculate, cloneParams, householdSize, resolvedPositions } from './calculate'
import { applyAssumptions } from './assumptions'
import type { Assumptions, Household, HouseholdResult, Platform, PolicyArea, PolicyParams, PolicyPosition } from './types'
import { usd } from '../lib/format'

/** Below this many dollars a year a position is reported as having had no effect. */
const ZERO_DOLLARS = 0.5

export interface AttributionStep {
  position: PolicyPosition
  /** Platform the position came from (the politician, or an inherited party/lane baseline). */
  source: Platform
  /** Change in net income from applying this position on top of everything before it. */
  delta: number
  netAfter: number
  /** Present when delta is ~0: a household-specific reason the position didn't bite. */
  zeroReason?: string
}

export interface Attribution {
  baseline: HouseholdResult
  final: HouseholdResult
  /** Positions that changed the household's number, in application order. */
  steps: AttributionStep[]
  /** Positions that were applied but changed nothing for this household. */
  noEffect: AttributionStep[]
  /** Positions on the record with no parameter effect in the calculator. */
  unmodeled: Array<{ position: PolicyPosition; source: Platform }>
}

/**
 * Explain a platform's result as a sequence of position-by-position changes. Positions are applied in the
 * same order the calculator uses, so the deltas sum exactly to the total; each delta is "this position, given
 * everything applied before it", which is an approximation when positions interact.
 */
export function attribute(h: Household, base: PolicyParams, platform: Platform, all: Platform[], a: Assumptions): Attribution {
  const start = applyAssumptions(cloneParams(base), a)
  const baseline = calculate(h, start, 'baseline')
  let params = cloneParams(start)
  let prevResult = baseline
  const steps: AttributionStep[] = []
  const noEffect: AttributionStep[] = []
  const unmodeled: Attribution['unmodeled'] = []

  for (const { position, source } of resolvedPositions(platform, all)) {
    if (!position.apply) {
      unmodeled.push({ position, source })
      continue
    }
    const before = params
    params = cloneParams(params)
    position.apply(params)
    applyAssumptions(params, a) // assumptions are authoritative over anything a position might set
    const result = calculate(h, params, platform.id)
    const delta = result.netIncome - prevResult.netIncome
    const step: AttributionStep = { position, source, delta, netAfter: result.netIncome }
    if (Math.abs(delta) < ZERO_DOLLARS) {
      step.zeroReason = explainZero(position.area, h, before, params, prevResult)
      noEffect.push(step)
    } else {
      steps.push(step)
    }
    prevResult = result
  }
  return { baseline, final: prevResult, steps, noEffect, unmodeled }
}

/** Sum of attributed deltas by policy area. */
export function deltasByArea(attr: Attribution): Partial<Record<PolicyArea, number>> {
  const out: Partial<Record<PolicyArea, number>> = {}
  for (const s of attr.steps) out[s.position.area] = (out[s.position.area] ?? 0) + s.delta
  return out
}

// ---------- why a position had no effect for this household ----------

function explainZero(area: PolicyArea, h: Household, before: PolicyParams, after: PolicyParams, r: HouseholdResult): string {
  const fs = h.filingStatus
  const joint = fs === 'mfj'
  const wagesTop = Math.max(h.wages, joint ? h.spouseWages : 0)
  switch (area) {
    case 'incomeRates': {
      const b = before.incomeTax.brackets[fs]
      const aB = after.incomeTax.brackets[fs]
      let threshold: number | undefined
      for (let i = 0; i < Math.max(b.length, aB.length); i++) {
        if (!b[i] || !aB[i] || b[i].rate !== aB[i].rate || b[i].over !== aB[i].over) {
          threshold = Math.min(b[i]?.over ?? Infinity, aB[i]?.over ?? Infinity)
          break
        }
      }
      const surtax = after.incomeTax.surtaxes.find((s) => !before.incomeTax.surtaxes.some((b) => b.rate === s.rate && b.over[fs] === s.over[fs]))
      if (surtax) threshold = Math.min(threshold ?? Infinity, surtax.over[fs])
      if (threshold !== undefined && Number.isFinite(threshold) && r.taxableIncome < threshold)
        return `Rate changes start at ${usd(threshold)} of taxable income; yours is ${usd(r.taxableIncome)}.`
      if (r.taxableIncome <= 0) return 'You owe no federal income tax before credits, so rate changes have nothing to act on.'
      return 'Your taxable income sits in brackets this proposal leaves unchanged.'
    }
    case 'standardDeduction':
      return r.breakdown.some((li) => li.note === 'Itemized')
        ? 'You itemize, so the standard deduction does not apply to you.'
        : 'No change to the standard deduction amount you use.'
    case 'ctc':
      if (h.childrenUnder17 === 0 && h.otherDependents === 0) return 'You have no children under 17 or other dependents.'
      if (r.agi > after.ctc.phaseoutStart[fs]) return `Your income (${usd(r.agi)}) is above the credit's phase-out start (${usd(after.ctc.phaseoutStart[fs])}).`
      return 'You already receive the full credit under current law, and this proposal does not raise the amount.'
    case 'eitc': {
      const tier = after.eitc.tiers[Math.min(3, h.childrenUnder17)]
      const phaseOutEnd = tier.phaseOutStart + (joint ? tier.mfjBonus : 0) + (tier.maxCredit * after.eitc.scale) / tier.phaseOutRate
      if (h.childrenUnder17 === 0 && (h.age < after.eitc.childlessMinAge || h.age > after.eitc.childlessMaxAge))
        return `The childless credit is limited to ages ${after.eitc.childlessMinAge}–${after.eitc.childlessMaxAge}.`
      if (r.agi > phaseOutEnd) return `Your income (${usd(r.agi)}) is above the EITC range (ends near ${usd(phaseOutEnd)}).`
      return 'No change to the EITC parameters that apply to you.'
    }
    case 'salt':
      if (h.saltPaid === 0) return 'You entered no state and local taxes paid.'
      return 'You take the standard deduction, so the SALT cap does not affect you.'
    case 'payroll': {
      const donut = after.payroll.ssDonutHoleStart
      if (donut !== null && wagesTop < donut) return `Applies to wages above ${usd(donut)}; your highest earner makes ${usd(wagesTop)}.`
      if (h.wages + (joint ? h.spouseWages : 0) + h.selfEmploymentIncome === 0) return 'You have no earned income subject to payroll tax.'
      return 'No change to the payroll taxes you pay.'
    }
    case 'tipsOvertime':
      return h.tipIncome === 0 && h.overtimeIncome === 0 ? 'You reported no tip or overtime income.' : 'Your tips/overtime are already fully deductible under current law.'
    case 'capitalGains':
      if (h.longTermGains === 0) return 'You reported no capital gains.'
      if (after.capitalGains.ordinaryAbove && r.agi < after.capitalGains.ordinaryAbove) return `Applies above ${usd(after.capitalGains.ordinaryAbove)} of income; yours is ${usd(r.agi)}.`
      return 'Your gains fall in brackets this proposal leaves unchanged.'
    case 'tariffs':
      return 'Same tariff exposure as current law for your household.'
    case 'aca':
      if (h.healthCoverage !== 'marketplace' && h.healthCoverage !== 'uninsured') return `You're on ${coverageName(h.healthCoverage)}, not a marketplace plan.`
      return 'Your subsidy is unchanged at your income level.'
    case 'medicaid': {
      const fpl = fplPct(h, after)
      if (fpl > after.medicaid.expansionThresholdFpl) return `Your income is about ${Math.round(fpl)}% of poverty, above Medicaid's ${after.medicaid.expansionThresholdFpl}% limit.`
      if (h.healthCoverage === 'employer' || h.healthCoverage === 'medicare') return `You're on ${coverageName(h.healthCoverage)}; Medicaid rules don't change your cost.`
      return 'Your Medicaid eligibility and cost are unchanged.'
    }
    case 'medicare':
      if (h.age < before.medicare.eligibilityAge) return `You're ${h.age}; Medicare changes apply at ${before.medicare.eligibilityAge}+.`
      return 'No change to your Medicare premiums.'
    case 'singlePayer':
      return 'No change to your coverage cost.'
    default:
      return 'No effect on your household.'
  }
}

function coverageName(c: Household['healthCoverage']): string {
  return { employer: 'an employer plan', marketplace: 'a marketplace plan', medicaid: 'Medicaid', medicare: 'Medicare', uninsured: 'no coverage' }[c]
}

function fplPct(h: Household, p: PolicyParams): number {
  const n = householdSize(h)
  const t = p.fpl.medicaid
  const rows = h.state === 'AK' ? t.ak : h.state === 'HI' ? t.hi : t.base
  const addl = h.state === 'AK' ? t.perAdditional.ak : h.state === 'HI' ? t.perAdditional.hi : t.perAdditional.base
  const fpl = n <= rows.length ? rows[n - 1] : rows[rows.length - 1] + (n - rows.length) * addl
  const income = h.wages + (h.filingStatus === 'mfj' ? h.spouseWages : 0) + h.selfEmploymentIncome + h.longTermGains
  return (income / fpl) * 100
}
