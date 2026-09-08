import type {
  Bracket,
  FilingStatus,
  FplTable,
  Household,
  HouseholdResult,
  LineItem,
  Platform,
  PolicyParams,
} from './types'
import { computeStateTax } from './stateTax'
import { taxFromBrackets } from './brackets'
import { NON_EXPANSION_STATE_CODES } from '../data/states'

const NON_EXPANSION_STATES = new Set<string>(NON_EXPANSION_STATE_CODES)

// ---------- helpers ----------

function clamp(n: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, n))
}

function interpolate(points: Array<[number, number]>, x: number): number {
  if (x <= points[0][0]) return points[0][1]
  for (let i = 0; i < points.length - 1; i++) {
    const [x0, y0] = points[i]
    const [x1, y1] = points[i + 1]
    if (x >= x0 && x <= x1) {
      if (x1 === x0) return y1
      return y0 + ((x - x0) / (x1 - x0)) * (y1 - y0)
    }
  }
  return points[points.length - 1][1]
}

export function householdSize(h: Household): number {
  const adults = h.filingStatus === 'mfj' ? 2 : 1
  return adults + h.childrenUnder17 + h.otherDependents
}

export function fplFor(h: Household, table: FplTable): number {
  const n = householdSize(h)
  const region = h.state === 'AK' ? 'ak' : h.state === 'HI' ? 'hi' : 'base'
  const rows = table[region]
  const addl = table.perAdditional[region]
  return n <= rows.length ? rows[n - 1] : rows[rows.length - 1] + (n - rows.length) * addl
}

/** Deep-clone the baseline so platform overrides never mutate it. */
export function cloneParams(p: PolicyParams): PolicyParams {
  return structuredClone(p)
}

export function applyPlatform(baseline: PolicyParams, platform: Platform, all: Platform[]): PolicyParams {
  const params = cloneParams(baseline)
  // Inherited party positions first, then the politician's own overrides.
  const parent = platform.inheritsFrom ? all.find((x) => x.id === platform.inheritsFrom) : undefined
  if (parent) {
    for (const pos of parent.positions) {
      const overridden = platform.positions.some((own) => own.area === pos.area)
      if (!overridden) pos.apply?.(params)
    }
  }
  for (const pos of platform.positions) pos.apply?.(params)
  return params
}

/** Returns the effective positions for a platform, with party fallbacks marked `inherited`. */
export function effectivePositions(platform: Platform, all: Platform[]) {
  const parent = platform.inheritsFrom ? all.find((x) => x.id === platform.inheritsFrom) : undefined
  const own = platform.positions
  const inherited = parent
    ? parent.positions
        .filter((pos) => !own.some((o) => o.area === pos.area))
        .map((pos) => ({ ...pos, inherited: true, confidence: 'default' as const }))
    : []
  return [...own, ...inherited]
}

// ---------- core ----------

export function calculate(h: Household, p: PolicyParams, platformId: string): HouseholdResult {
  const fs: FilingStatus = h.filingStatus
  const warnings: string[] = []
  const breakdown: LineItem[] = []
  const isJoint = fs === 'mfj'

  const wages = h.wages + (isJoint ? h.spouseWages : 0)
  const seIncome = Math.max(0, h.selfEmploymentIncome)
  const grossIncome = wages + seIncome + h.longTermGains + h.socialSecurityBenefits

  // ----- Payroll taxes -----
  const ssWagesPrimary = Math.min(h.wages, p.payroll.ssWageBase)
  const ssWagesSpouse = isJoint ? Math.min(h.spouseWages, p.payroll.ssWageBase) : 0
  let ssTax = (ssWagesPrimary + ssWagesSpouse) * p.payroll.ssRateEmployee
  if (p.payroll.ssDonutHoleStart !== null) {
    const donut = p.payroll.ssDonutHoleStart
    const over = Math.max(0, h.wages - donut) + (isJoint ? Math.max(0, h.spouseWages - donut) : 0)
    ssTax += over * p.payroll.ssRateEmployee
  }
  const medicareTax = wages * p.payroll.medicareRateEmployee
  const addlMedicare =
    Math.max(0, wages + seIncome - p.payroll.additionalMedicareThreshold[fs]) * p.payroll.additionalMedicareRate

  // Self-employment tax (both halves), 92.35% of net earnings
  const seBase = seIncome * 0.9235
  const seSsTaxable = Math.max(0, Math.min(seBase, p.payroll.ssWageBase - ssWagesPrimary))
  let seTax = seSsTaxable * p.payroll.ssRateEmployee * 2 + seBase * p.payroll.medicareRateEmployee * 2
  if (p.payroll.ssDonutHoleStart !== null) {
    seTax += Math.max(0, seBase - p.payroll.ssDonutHoleStart) * p.payroll.ssRateEmployee * 2
  }
  const payrollTax = ssTax + medicareTax + addlMedicare + seTax

  // ----- AGI -----
  const halfSeTax = seTax * p.payroll.seTaxDeductionFraction
  const taxableSS = p.incomeTax.socialSecurityBenefitTaxable ? h.socialSecurityBenefits * 0.85 : 0
  const agi = wages + seIncome + h.longTermGains + taxableSS - halfSeTax

  // ----- Deductions -----
  const ded = p.deductions
  let stdDed = p.incomeTax.standardDeduction[fs]
  const seniors = (h.age >= 65 ? 1 : 0) + (isJoint && h.spouseAge >= 65 ? 1 : 0)
  stdDed += seniors * (isJoint || fs === 'mfs' ? p.incomeTax.additionalDeduction65.married : p.incomeTax.additionalDeduction65.unmarried)

  // Itemized: SALT (capped) + other
  let saltAllowed = h.saltPaid
  if (ded.salt.enabled) {
    let cap = ded.salt.cap[fs]
    if (agi > ded.salt.phaseDownStart[fs]) {
      cap = Math.max(ded.salt.floor[fs], cap - 0.3 * (agi - ded.salt.phaseDownStart[fs]))
    }
    saltAllowed = Math.min(h.saltPaid, cap)
  }
  const itemized = saltAllowed + h.otherItemized
  const itemizes = itemized > stdDed
  let deduction = itemizes ? itemized : stdDed

  // Above/below-the-line OBBBA deductions available to itemizers and non-itemizers alike
  if (ded.tips.enabled && h.tipIncome > 0) {
    let allowed = Math.min(h.tipIncome, ded.tips.cap)
    allowed = Math.max(0, allowed - Math.max(0, agi - ded.tips.phaseoutStart[fs]) * ded.tips.phaseoutRate)
    deduction += allowed
    if (allowed > 0) breakdown.push({ label: 'Tip income deduction', amount: allowed })
  }
  if (ded.overtime.enabled && h.overtimeIncome > 0) {
    let allowed = Math.min(h.overtimeIncome, ded.overtime.cap[fs])
    allowed = Math.max(0, allowed - Math.max(0, agi - ded.overtime.phaseoutStart[fs]) * ded.overtime.phaseoutRate)
    deduction += allowed
    if (allowed > 0) breakdown.push({ label: 'Overtime deduction', amount: allowed })
  }
  // Senior deduction (OBBBA §70103)
  if (seniors > 0 && p.incomeTax.seniorDeduction.amount > 0) {
    const sd = p.incomeTax.seniorDeduction
    let allowed = sd.amount * seniors
    allowed = Math.max(0, allowed - Math.max(0, agi - sd.phaseoutStart[fs]) * sd.phaseoutRate)
    deduction += allowed
    if (allowed > 0) breakdown.push({ label: 'Senior deduction', amount: allowed })
  }

  const taxableIncome = Math.max(0, agi - deduction)

  // ----- Ordinary income tax + preferential gains -----
  const gainsInTaxable = Math.min(h.longTermGains, taxableIncome)
  const ordinaryTaxable = taxableIncome - gainsInTaxable
  let ordinaryTax = taxFromBrackets(ordinaryTaxable, p.incomeTax.brackets[fs])

  // Capital gains stacked on top of ordinary income
  let gainsTax = 0
  if (gainsInTaxable > 0) {
    const cg = p.capitalGains
    if (cg.ordinaryAbove !== undefined && agi > cg.ordinaryAbove) {
      const atOrdinary = Math.min(gainsInTaxable, agi - cg.ordinaryAbove)
      const atPref = gainsInTaxable - atOrdinary
      gainsTax += stackedGainsTax(ordinaryTaxable, atPref, cg.brackets[fs])
      gainsTax +=
        taxFromBrackets(ordinaryTaxable + atPref + atOrdinary, p.incomeTax.brackets[fs]) -
        taxFromBrackets(ordinaryTaxable + atPref, p.incomeTax.brackets[fs])
    } else {
      gainsTax = stackedGainsTax(ordinaryTaxable, gainsInTaxable, cg.brackets[fs])
    }
    const niit = Math.max(0, Math.min(gainsInTaxable, agi - cg.niitThreshold[fs])) * cg.niitRate
    gainsTax += niit
  }

  // Surtaxes (e.g. millionaire surtax) on taxable income above threshold
  let surtax = 0
  for (const s of p.incomeTax.surtaxes) {
    surtax += Math.max(0, taxableIncome - s.over[fs]) * s.rate
  }
  const taxBeforeCredits = ordinaryTax + gainsTax + surtax

  // ----- Credits -----
  const earnedIncome = wages + seIncome - halfSeTax
  // Child Tax Credit
  const ctc = p.ctc
  let ctcGross = h.childrenUnder17 * ctc.amountPerChild + h.otherDependents * ctc.otherDependentCredit
  const ctcPhaseout = Math.max(0, Math.ceil(Math.max(0, agi - ctc.phaseoutStart[fs]) / 1000)) * ctc.phaseoutPer1000
  ctcGross = Math.max(0, ctcGross - ctcPhaseout)
  const ctcNonRefundable = Math.min(ctcGross, taxBeforeCredits)
  let ctcRefundable: number
  if (ctc.fullyRefundable) {
    ctcRefundable = ctcGross - ctcNonRefundable
  } else {
    const actcCap = Math.min(
      h.childrenUnder17 * ctc.refundableMax,
      Math.max(0, earnedIncome - ctc.refundEarnedIncomeFloor) * ctc.refundPhaseInRate,
    )
    // ODC portion is never refundable
    const childPortionRemaining = Math.max(0, Math.min(ctcGross, h.childrenUnder17 * ctc.amountPerChild) - ctcNonRefundable)
    ctcRefundable = Math.min(childPortionRemaining, actcCap)
  }

  // EITC
  let eitc = 0
  const eitcTier = p.eitc.tiers[Math.min(3, h.childrenUnder17)]
  if (h.longTermGains <= p.eitc.investmentIncomeLimit && earnedIncome > 0 && fs !== 'mfs') {
    const maxCredit = eitcTier.maxCredit * p.eitc.scale
    const phaseOutStart = eitcTier.phaseOutStart + (isJoint ? eitcTier.mfjBonus : 0)
    const credit = Math.min(earnedIncome * eitcTier.phaseInRate, maxCredit)
    const income = Math.max(agi, earnedIncome)
    const reduced = credit - Math.max(0, income - phaseOutStart) * eitcTier.phaseOutRate
    eitc = clamp(reduced, 0, maxCredit)
    // Childless EITC has an age window (25–64) under current law
    if (h.childrenUnder17 === 0 && (h.age < 25 || h.age > 64)) eitc = 0
  }

  const nonRefundableCredits = ctcNonRefundable
  const refundableCredits = ctcRefundable + eitc
  const federalIncomeTax = taxBeforeCredits - nonRefundableCredits - refundableCredits

  breakdown.unshift(
    { label: 'Deduction taken', amount: deduction, note: itemizes ? 'Itemized' : 'Standard' },
    { label: 'Ordinary income tax', amount: ordinaryTax },
  )
  if (gainsTax) breakdown.push({ label: 'Capital gains tax (incl. NIIT)', amount: gainsTax })
  if (surtax) breakdown.push({ label: 'Surtax', amount: surtax })
  if (ctcGross) breakdown.push({ label: 'Child tax credit', amount: -(ctcNonRefundable + ctcRefundable) })
  if (eitc) breakdown.push({ label: 'Earned income credit', amount: -eitc })

  // ----- State income tax (rough) -----
  const stateIncomeTax = computeStateTax(h, agi, h.longTermGains)

  // ----- Healthcare -----
  const health = computeHealthcare(h, p, agi, warnings)

  // ----- Tariffs -----
  const tariffCost = Math.min(grossIncome * p.tariffs.pctOfIncome, p.tariffs.maxAnnualCost) * p.tariffs.multiplier

  const netIncome = grossIncome - federalIncomeTax - payrollTax - stateIncomeTax - health.cost - tariffCost

  return {
    platformId,
    grossIncome,
    agi,
    taxableIncome,
    federalIncomeTaxBeforeCredits: taxBeforeCredits,
    nonRefundableCredits,
    refundableCredits,
    federalIncomeTax,
    payrollTax,
    stateIncomeTax,
    healthcareCost: health.cost,
    effectiveCoverage: health.coverage,
    tariffCost,
    netIncome,
    effectiveFederalRate: grossIncome > 0 ? (federalIncomeTax + payrollTax) / grossIncome : 0,
    breakdown: [...breakdown, ...health.items],
    warnings,
  }
}

function stackedGainsTax(ordinaryTaxable: number, gains: number, brackets: Bracket[]): number {
  // Gains fill bracket space above ordinary income.
  return taxFromBrackets(ordinaryTaxable + gains, brackets) - taxFromBrackets(ordinaryTaxable, brackets)
}

// ---------- healthcare ----------

interface HealthOutcome {
  cost: number
  coverage: HouseholdResult['effectiveCoverage']
  items: LineItem[]
}

export function acaPremiumForHousehold(h: Household, p: PolicyParams): number {
  const ages = [h.age, ...(h.filingStatus === 'mfj' ? [h.spouseAge] : [])]
  // Children priced at the under-21 factor; CMS caps at 3 children
  const childCount = Math.min(3, h.childrenUnder17 + h.otherDependents)
  const factorFor = (age: number) => {
    const a = clamp(Math.round(age), 0, 64)
    if (a < 21) return p.aca.ageCurve[0] ?? 0.765
    return p.aca.ageCurve[a] ?? p.aca.ageCurve[64]
  }
  const perUnit = p.aca.benchmarkPremiumAge40 / p.aca.age40Factor
  let total = 0
  for (const a of ages) if (a < p.medicare.eligibilityAge) total += perUnit * factorFor(a)
  total += childCount * perUnit * factorFor(10)
  return total
}

function computeHealthcare(h: Household, p: PolicyParams, agi: number, warnings: string[]): HealthOutcome {
  const items: LineItem[] = []
  const acaFplPct = (agi / fplFor(h, p.fpl.aca)) * 100
  const medicaidFplPct = (agi / fplFor(h, p.fpl.medicaid)) * 100
  const isFamily = householdSize(h) > 1
  const adultsOnMedicare =
    (h.age >= p.medicare.eligibilityAge ? 1 : 0) + (h.filingStatus === 'mfj' && h.spouseAge >= p.medicare.eligibilityAge ? 1 : 0)

  // Single payer replaces everything for under-Medicare-age households.
  if (p.singlePayer.enabled) {
    const sp = p.singlePayer
    const premium = Math.max(0, agi - sp.householdPremiumExemption) * sp.householdPremiumRate
    const passthrough = (h.wages + (h.filingStatus === 'mfj' ? h.spouseWages : 0)) * sp.employerPayrollRate * sp.employerPassthrough
    items.push({ label: 'Single-payer income premium', amount: premium })
    if (passthrough > 0) items.push({ label: 'Employer payroll tax passed to wages (est.)', amount: passthrough })
    return { cost: premium + passthrough, coverage: 'singlePayer', items }
  }

  // Medicare-age households
  if (h.healthCoverage === 'medicare' || adultsOnMedicare > 0) {
    const m = p.medicare
    let partB = m.partBPremiumMonthly
    for (const tier of m.irmaa) {
      const threshold = h.filingStatus === 'mfj' ? tier.mfj : tier.single
      if (agi > threshold) partB = tier.partBMonthly
    }
    const n = Math.max(1, adultsOnMedicare)
    const premiums = partB * 12 * n
    const oop = m.avgOutOfPocket * n
    items.push({ label: `Medicare Part B premium (${n})`, amount: premiums })
    items.push({ label: 'Medicare out-of-pocket (est.)', amount: oop })
    return { cost: premiums + oop, coverage: 'medicare', items }
  }

  // Lowered Medicare eligibility age handled above via eligibilityAge.

  switch (h.healthCoverage) {
    case 'employer': {
      const ei = p.employerInsurance
      const contribution =
        h.employerPremiumEmployeeShare ??
        (isFamily ? ei.avgWorkerContributionFamily : ei.avgWorkerContributionSingle)
      items.push({ label: 'Employer plan premium (your share)', amount: contribution })
      items.push({ label: 'Out-of-pocket (est.)', amount: ei.avgOutOfPocket })
      return { cost: contribution + ei.avgOutOfPocket, coverage: 'employer', items }
    }
    case 'medicaid':
    case 'marketplace':
    case 'uninsured': {
      // Medicaid eligibility check
      const expansionState = p.medicaid.nationalExpansion || !NON_EXPANSION_STATES.has(h.state)
      const medicaidEligible =
        !p.medicaid.repealExpansion && expansionState && medicaidFplPct <= p.medicaid.expansionThresholdFpl
      if (medicaidEligible) {
        let cost = 0
        if (p.medicaid.workRequirements && h.age >= 19 && h.age <= 64 && h.childrenUnder17 === 0) {
          // Expected-value framing: share of enrollees projected to lose coverage.
          const lossShare = p.medicaid.workRequirementCoverageLossShare
          const uninsuredCost = p.uninsured.avgOutOfPocket
          cost += lossShare * uninsuredCost
          warnings.push(
            `Medicaid work requirements apply to you (19–64, no dependents). CBO projects roughly ${Math.round(lossShare * 100)}% of affected adults lose coverage; we include that as an expected cost.`,
          )
          items.push({ label: 'Expected cost of coverage loss (work requirement)', amount: lossShare * uninsuredCost })
        }
        if (p.medicaid.annualCostSharing > 0 && medicaidFplPct > 100) {
          cost += p.medicaid.annualCostSharing
          items.push({ label: 'Medicaid copays (OBBBA cost-sharing)', amount: p.medicaid.annualCostSharing })
        }
        return { cost, coverage: 'medicaid', items }
      }
      if (h.healthCoverage === 'medicaid') {
        if (p.medicaid.repealExpansion) warnings.push('Medicaid expansion is repealed under this platform; you would need to buy coverage.')
        else if (medicaidFplPct > p.medicaid.expansionThresholdFpl) warnings.push('Your income is above the Medicaid threshold; we price a marketplace plan instead.')
        else warnings.push(`${h.state} has not expanded Medicaid; adults below 100% FPL fall in the coverage gap.`)
      }
      // Coverage gap: below 100% FPL in a non-expansion state → no subsidy
      if (!expansionState && acaFplPct < p.aca.minFplPct) {
        items.push({ label: 'Uninsured out-of-pocket (est.)', amount: p.uninsured.avgOutOfPocket })
        return { cost: p.uninsured.avgOutOfPocket, coverage: 'coverageGap', items }
      }
      if (h.healthCoverage === 'uninsured') {
        // Show what a subsidized plan would cost, but assume they stay uninsured unless a plan is ~free.
        const full = acaPremiumForHousehold(h, p)
        const net = acaNetPremium(full, agi, acaFplPct, p)
        if (net.premium < 300) {
          items.push({ label: 'Marketplace premium after subsidy (≈ free)', amount: net.premium })
          items.push({ label: 'Out-of-pocket (est.)', amount: p.aca.avgOutOfPocket })
          return { cost: net.premium + p.aca.avgOutOfPocket, coverage: 'marketplace', items }
        }
        items.push({ label: 'Uninsured out-of-pocket (est.)', amount: p.uninsured.avgOutOfPocket })
        return { cost: p.uninsured.avgOutOfPocket, coverage: 'uninsured', items }
      }
      const full = acaPremiumForHousehold(h, p)
      const net = acaNetPremium(full, agi, acaFplPct, p)
      items.push({ label: 'Marketplace benchmark premium', amount: full })
      if (net.subsidy > 0) items.push({ label: 'Premium tax credit', amount: -net.subsidy })
      if (net.cliff) warnings.push('Income is above 400% of poverty; no premium tax credit under this platform.')
      items.push({ label: 'Out-of-pocket (est.)', amount: p.aca.avgOutOfPocket })
      return { cost: net.premium + p.aca.avgOutOfPocket, coverage: 'marketplace', items }
    }
    default:
      return { cost: 0, coverage: h.healthCoverage, items }
  }
}

export function acaNetPremium(fullPremium: number, agi: number, fplPct: number, p: PolicyParams) {
  if (p.aca.cliffAt400 && fplPct > 400) return { premium: fullPremium, subsidy: 0, cliff: true }
  if (fplPct < p.aca.minFplPct) return { premium: fullPremium, subsidy: 0, cliff: false }
  const pct = interpolate(p.aca.applicablePct, fplPct)
  const expected = agi * pct
  const subsidy = Math.max(0, fullPremium - expected)
  return { premium: fullPremium - subsidy, subsidy, cliff: false }
}
