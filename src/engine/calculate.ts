import type {
  Bracket,
  FilingStatus,
  FplTable,
  Household,
  HouseholdResult,
  LineItem,
  Platform,
  PolicyArea,
  PolicyParams,
  PolicyPosition,
} from './types'
import { computeStateTax } from './stateTax'
import { taxFromBrackets } from './brackets'
import { NON_EXPANSION_STATE_CODES, WAIVER_ADULT_FPL } from '../data/states'

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

/** Child ages, padded to the child count with a school-age default. */
export function childAges(h: Household): number[] {
  const ages = (h.childAges ?? []).slice(0, h.childrenUnder17)
  while (ages.length < h.childrenUnder17) ages.push(8)
  return ages
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

/** Inheritance chain from the root baseline down to (but excluding) the platform itself. */
function ancestors(platform: Platform, all: Platform[]): Platform[] {
  const chain: Platform[] = []
  let cur = platform
  const seen = new Set<string>([platform.id])
  while (cur.inheritsFrom) {
    const parent = all.find((x) => x.id === cur.inheritsFrom)
    if (!parent || seen.has(parent.id)) break
    chain.unshift(parent)
    seen.add(parent.id)
    cur = parent
  }
  return chain
}

/** Positions that take effect for a platform, root-most ancestor first, each tagged with its source platform. */
export function resolvedPositions(platform: Platform, all: Platform[]): Array<{ position: PolicyPosition; source: Platform }> {
  const chain = [...ancestors(platform, all), platform]
  const out: Array<{ position: PolicyPosition; source: Platform }> = []
  chain.forEach((node, i) => {
    const descendants = chain.slice(i + 1)
    for (const position of node.positions) {
      if (!descendants.some((d) => overridesParent(d, position.area))) out.push({ position, source: node })
    }
  })
  return out
}

export function applyPlatform(baseline: PolicyParams, platform: Platform, all: Platform[]): PolicyParams {
  const params = cloneParams(baseline)
  for (const { position } of resolvedPositions(platform, all)) position.apply?.(params)
  return params
}

/** A child position overrides an ancestor's effect only if it changes parameters itself or explicitly holds current law. */
function overridesParent(platform: Platform, area: PolicyArea): boolean {
  return platform.positions.some((own) => own.area === area && (own.apply !== undefined || own.holdsCurrentLaw === true))
}

/** What the drawer shows: exactly what the engine applies, with ancestor positions marked `inherited`. */
export function effectivePositions(platform: Platform, all: Platform[]): PolicyPosition[] {
  return resolvedPositions(platform, all).map(({ position, source }) =>
    source.id === platform.id ? position : { ...position, inherited: true, confidence: 'default' as const },
  )
}

// ---------- core ----------

/** Employer share of premium that would return to the worker as wages under single payer, if that assumption is on. */
export function employerPremiumReturnedAsWages(h: Household, p: PolicyParams): number {
  if (!p.singlePayer.enabled || !p.singlePayer.employerPremiumToWages || h.healthCoverage !== 'employer') return 0
  if (h.age >= p.medicare.eligibilityAge) return 0
  const family = householdSize(h) > 1
  const total = family ? p.employerInsurance.avgTotalPremiumFamily : p.employerInsurance.avgTotalPremiumSingle
  const worker = h.employerPremiumEmployeeShare ?? (family ? p.employerInsurance.avgWorkerContributionFamily : p.employerInsurance.avgWorkerContributionSingle)
  return Math.max(0, total - worker)
}

/** Clamp user-supplied numbers so the engine never sees negatives or absurd magnitudes. */
export function sanitizeHousehold(h: Household): Household {
  const money = (n: unknown) => (Number.isFinite(Number(n)) ? Math.min(Math.max(0, Number(n)), 1e8) : 0)
  const count = (n: unknown, max: number) => (Number.isFinite(Number(n)) ? Math.min(Math.max(0, Math.floor(Number(n))), max) : 0)
  return {
    ...h,
    wages: money(h.wages),
    spouseWages: money(h.spouseWages),
    selfEmploymentIncome: money(h.selfEmploymentIncome),
    tipIncome: money(h.tipIncome),
    overtimeIncome: money(h.overtimeIncome),
    longTermGains: money(h.longTermGains),
    socialSecurityBenefits: money(h.socialSecurityBenefits),
    saltPaid: money(h.saltPaid),
    otherItemized: money(h.otherItemized),
    employerPremiumEmployeeShare: h.employerPremiumEmployeeShare === undefined ? undefined : money(h.employerPremiumEmployeeShare),
    age: count(h.age, 120),
    spouseAge: count(h.spouseAge, 120),
    childrenUnder17: count(h.childrenUnder17, 12),
    otherDependents: count(h.otherDependents, 12),
    childAges: (h.childAges ?? []).slice(0, 12).map((a) => count(a, 17)),
  }
}

export function calculate(raw: Household, p: PolicyParams, platformId: string): HouseholdResult {
  const input = sanitizeHousehold(raw)
  const returnedPremium = employerPremiumReturnedAsWages(input, p)
  const h: Household = returnedPremium > 0 ? { ...input, wages: input.wages + returnedPremium } : input
  const fs: FilingStatus = h.filingStatus
  const warnings: string[] = []
  const breakdown: LineItem[] = []
  const isJoint = fs === 'mfj'
  if (returnedPremium > 0) breakdown.push({ label: 'Employer premium share returned as taxable wages (assumption)', amount: returnedPremium })

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
  const otherIncome = wages + seIncome + h.longTermGains - halfSeTax
  const taxableSS = p.incomeTax.socialSecurityBenefitTaxable ? taxableSocialSecurity(h.socialSecurityBenefits, otherIncome, fs) : 0
  const agi = otherIncome + taxableSS

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

  // OBBBA's tips (§224(f)), overtime (§225(e)) and senior (§151(d)(5)(C)(v)) deductions require a joint return if married.
  const jointReturnOk = fs !== 'mfs'
  // Above/below-the-line OBBBA deductions available to itemizers and non-itemizers alike
  if (jointReturnOk && ded.tips.enabled && h.tipIncome > 0) {
    let allowed = Math.min(h.tipIncome, ded.tips.cap)
    allowed = Math.max(0, allowed - Math.max(0, agi - ded.tips.phaseoutStart[fs]) * ded.tips.phaseoutRate)
    deduction += allowed
    if (allowed > 0) breakdown.push({ label: 'Tip income deduction', amount: allowed })
  }
  if (jointReturnOk && ded.overtime.enabled && h.overtimeIncome > 0) {
    let allowed = Math.min(h.overtimeIncome, ded.overtime.cap[fs])
    allowed = Math.max(0, allowed - Math.max(0, agi - ded.overtime.phaseoutStart[fs]) * ded.overtime.phaseoutRate)
    deduction += allowed
    if (allowed > 0) breakdown.push({ label: 'Overtime deduction', amount: allowed })
  }
  // Senior deduction (OBBBA §70103)
  if (jointReturnOk && seniors > 0 && p.incomeTax.seniorDeduction.amount > 0) {
    const sd = p.incomeTax.seniorDeduction
    let allowed = sd.amount * seniors
    allowed = Math.max(0, allowed - Math.max(0, agi - sd.phaseoutStart[fs]) * sd.phaseoutRate)
    deduction += allowed
    if (allowed > 0) breakdown.push({ label: 'Senior deduction', amount: allowed })
  }

  if (p.incomeTax.dependentExemption > 0) {
    deduction += p.incomeTax.dependentExemption * (h.childrenUnder17 + h.otherDependents)
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
    if (cg.niitSurcharge && agi > cg.niitSurcharge.over) {
      gainsTax += Math.max(0, Math.min(gainsInTaxable, agi - cg.niitSurcharge.over)) * cg.niitSurcharge.rate
    }
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
  const ages = childAges(h)
  const youngBonus = ctc.youngChildBonus ? ages.filter((a) => a < ctc.youngChildBonus!.underAge).length * ctc.youngChildBonus.amount : 0
  let ctcGross = h.childrenUnder17 * ctc.amountPerChild + youngBonus + h.otherDependents * ctc.otherDependentCredit
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
    const childPortionRemaining = Math.max(0, Math.min(ctcGross, h.childrenUnder17 * ctc.amountPerChild + youngBonus) - ctcNonRefundable)
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
    if (h.childrenUnder17 === 0 && (h.age < p.eitc.childlessMinAge || h.age > p.eitc.childlessMaxAge)) eitc = 0
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
  const tariffCost =
    Math.min(grossIncome * p.tariffs.pctOfIncome, p.tariffs.maxAnnualCost) * p.tariffs.passThrough * p.tariffs.multiplier -
    p.tariffs.rebatePerPerson * householdSize(h)
  warnings.push(...p.caveats)

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
    unfunded: p.unfunded,
  }
}

/**
 * IRC §86: Social Security benefits are included in income at 0%, up to 50%, or up to 85% depending on
 * "provisional income" (other income + half of benefits). Thresholds are unindexed: $25k/$34k single, $32k/$44k joint,
 * $0 for married filing separately (living with spouse).
 */
export function taxableSocialSecurity(benefits: number, otherIncome: number, fs: FilingStatus): number {
  if (benefits <= 0) return 0
  const [base, adj] = fs === 'mfj' ? [32000, 44000] : fs === 'mfs' ? [0, 0] : [25000, 34000]
  const provisional = otherIncome + 0.5 * benefits
  if (provisional <= base) return 0
  if (provisional <= adj) return Math.min(0.5 * benefits, 0.5 * (provisional - base))
  const tier1 = Math.min(0.5 * benefits, 0.5 * (adj - base))
  return Math.min(0.85 * benefits, 0.85 * (provisional - adj) + tier1)
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
  const kids = [...childAges(h), ...Array(h.otherDependents).fill(18)].sort((a, b) => b - a).slice(0, 3) // three oldest under 21 count
  const factorFor = (age: number) => {
    const a = clamp(Math.round(age), 0, 64)
    if (a < 21) return p.aca.ageCurve[0] ?? 0.765
    return p.aca.ageCurve[a] ?? p.aca.ageCurve[64]
  }
  const perUnit = p.aca.benchmarkPremiumAge40 / p.aca.age40Factor
  let total = 0
  for (const a of ages) if (a < p.medicare.eligibilityAge) total += perUnit * factorFor(a)
  for (const a of kids) total += perUnit * factorFor(a)
  return total
}

function computeHealthcare(h: Household, p: PolicyParams, agi: number, warnings: string[], skipMedicare = false): HealthOutcome {
  const items: LineItem[] = []
  const acaFplPct = (agi / fplFor(h, p.fpl.aca)) * 100
  const medicaidFplPct = (agi / fplFor(h, p.fpl.medicaid)) * 100
  const adultsOnMedicare0 =
    (h.age >= p.medicare.eligibilityAge ? 1 : 0) + (h.filingStatus === 'mfj' && h.spouseAge >= p.medicare.eligibilityAge ? 1 : 0)
  const isFamily = householdSize(h) - (skipMedicare ? adultsOnMedicare0 : 0) > 1
  const adultsOnMedicare =
    (h.age >= p.medicare.eligibilityAge ? 1 : 0) + (h.filingStatus === 'mfj' && h.spouseAge >= p.medicare.eligibilityAge ? 1 : 0)

  // Single payer replaces everything for under-Medicare-age households.
  if (p.singlePayer.enabled) {
    const sp = p.singlePayer
    const exemption = sp.exemptionIsStandardDeduction ? p.incomeTax.standardDeduction[h.filingStatus] : sp.householdPremiumExemption
    const premium = Math.max(0, agi - exemption) * sp.householdPremiumRate
    const passthrough = (h.wages + (h.filingStatus === 'mfj' ? h.spouseWages : 0)) * sp.employerPayrollRate * sp.employerPassthrough
    items.push({ label: 'Single-payer income premium', amount: premium })
    if (passthrough > 0) items.push({ label: 'Employer payroll tax passed to wages (est.)', amount: passthrough })
    return { cost: premium + passthrough, coverage: 'singlePayer', items }
  }

  // Medicare-age adults. A mixed-age couple gets Medicare for the eligible spouse and the household's declared
  // coverage for the rest.
  if (!skipMedicare && (h.healthCoverage === 'medicare' || adultsOnMedicare > 0)) {
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
    const adults = h.filingStatus === 'mfj' ? 2 : 1
    const othersRemain = adults - adultsOnMedicare > 0 || h.childrenUnder17 + h.otherDependents > 0
    if (h.healthCoverage !== 'medicare' && othersRemain) {
      const rest = computeHealthcare(h, p, agi, warnings, true)
      return { cost: premiums + oop + rest.cost, coverage: 'medicare', items: [...items, ...rest.items] }
    }
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
      // Non-expansion states with a waiver covering childless adults (Wisconsin to 100% FPL) have no coverage gap.
      const waiverFpl = expansionState ? undefined : WAIVER_ADULT_FPL[h.state]
      const medicaidEligible =
        !p.medicaid.repealExpansion &&
        ((expansionState && medicaidFplPct <= p.medicaid.expansionThresholdFpl) || (waiverFpl !== undefined && medicaidFplPct <= waiverFpl))
      if (medicaidEligible) {
        let cost = 0
        const caretakerExempt = childAges(h).some((a) => a < 14)
        if (p.medicaid.workRequirements && h.age >= 19 && h.age <= 64 && !caretakerExempt) {
          // Expected-value framing: share of enrollees projected to lose coverage.
          const lossShare = p.medicaid.workRequirementCoverageLossShare
          const uninsuredCost = p.uninsured.avgOutOfPocket
          cost += lossShare * uninsuredCost
          warnings.push(
            `Medicaid work requirements apply to you (19–64, no child under 14). CBO projects roughly ${Math.round(lossShare * 100)}% of affected adults lose coverage; we include that as an expected cost.`,
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
      if (!expansionState && waiverFpl === undefined && acaFplPct < p.aca.minFplPct) {
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
