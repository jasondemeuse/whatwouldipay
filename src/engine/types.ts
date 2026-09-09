// ---------- Household (user inputs) ----------

export type FilingStatus = 'single' | 'mfj' | 'mfs' | 'hoh'

export type HealthCoverage =
  | 'employer'
  | 'marketplace'
  | 'medicaid'
  | 'medicare'
  | 'uninsured'

export interface Household {
  filingStatus: FilingStatus
  /** Primary earner W-2 wages, annual. */
  wages: number
  /** Spouse W-2 wages (MFJ/MFS only). */
  spouseWages: number
  /** Net self-employment income (Schedule C). */
  selfEmploymentIncome: number
  /** Portion of wages that is qualified tip income. */
  tipIncome: number
  /** Portion of wages that is FLSA overtime premium pay (the "half" in time-and-a-half). */
  overtimeIncome: number
  /** Long-term capital gains + qualified dividends. */
  longTermGains: number
  /** Gross Social Security benefits received (if retired); the taxable share is computed per IRC §86. */
  socialSecurityBenefits: number
  age: number
  spouseAge: number
  /** Qualifying children under 17. */
  childrenUnder17: number
  /** Ages of those children, in any order. Missing entries are assumed to be 8 (school-age). */
  childAges?: number[]
  /** Other dependents (17+ children, parents). */
  otherDependents: number
  /** Two-letter state code, e.g. "CA". */
  state: string
  healthCoverage: HealthCoverage
  /** Annual employee share of employer-plan premium; undefined = use national average. */
  employerPremiumEmployeeShare?: number
  /** State and local taxes paid (for SALT). */
  saltPaid: number
  /** Other itemized deductions (mortgage interest, charity). */
  otherItemized: number
}

// ---------- Policy parameters (what a platform changes) ----------

export interface Bracket {
  /** Marginal rate, e.g. 0.22 */
  rate: number
  /** Taxable income above which this rate applies. */
  over: number
}

export type ByFilingStatus<T> = Record<FilingStatus, T>

export interface IncomeTaxParams {
  brackets: ByFilingStatus<Bracket[]>
  standardDeduction: ByFilingStatus<number>
  /** Additional standard deduction per person 65+ (§63(f)); differs for married vs unmarried filers. */
  additionalDeduction65: { married: number; unmarried: number }
  /** OBBBA senior deduction (2025-2028): amount per 65+ filer, phased out. */
  seniorDeduction: {
    amount: number
    phaseoutStart: ByFilingStatus<number>
    phaseoutRate: number
  }
  /** Extra surtax layered on top of ordinary brackets (e.g. 10% above $10M). */
  surtaxes: Array<{ rate: number; over: ByFilingStatus<number> }>
  /** Fraction of Social Security benefits included in income (0 = exempt). Simplified. */
  socialSecurityBenefitTaxable: boolean
  /** Per-dependent exemption/deduction (0 under current law; used by flat-tax plans). */
  dependentExemption: number
}

export interface CtcParams {
  amountPerChild: number
  /** Max refundable per child (Additional CTC). Ignored if fullyRefundable. */
  refundableMax: number
  /** Earned income above which the refundable portion phases in at refundPhaseInRate. */
  refundEarnedIncomeFloor: number
  refundPhaseInRate: number
  fullyRefundable: boolean
  phaseoutStart: ByFilingStatus<number>
  /** Credit reduction per $1,000 over threshold. */
  phaseoutPer1000: number
  otherDependentCredit: number
  /** Optional young-child bonus (e.g. ARPA $3,600 for under 6). */
  youngChildBonus?: { amount: number; underAge: number }
}

export interface EitcTier {
  maxCredit: number
  phaseInRate: number
  phaseOutRate: number
  /** Income at which phaseout begins (single/HoH). */
  phaseOutStart: number
  /** Additional phaseout-start amount for MFJ. */
  mfjBonus: number
}

export interface EitcParams {
  /** Index 0 = no children, 1, 2, 3+ */
  tiers: [EitcTier, EitcTier, EitcTier, EitcTier]
  investmentIncomeLimit: number
  /** Multiplier applied to max credit (for "expand EITC by X%" proposals). */
  scale: number
  /** Age window for the childless credit (current law 25–64). */
  childlessMinAge: number
  childlessMaxAge: number
}

export interface DeductionParams {
  salt: {
    cap: ByFilingStatus<number>
    /** MAGI above which the cap phases down 30% per dollar to `floor`. */
    phaseDownStart: ByFilingStatus<number>
    floor: ByFilingStatus<number>
    /** false = no cap (full deductibility). */
    enabled: boolean
  }
  tips: { enabled: boolean; cap: number; phaseoutStart: ByFilingStatus<number>; phaseoutRate: number }
  overtime: {
    enabled: boolean
    cap: ByFilingStatus<number>
    phaseoutStart: ByFilingStatus<number>
    phaseoutRate: number
  }
  /** Above-the-line charitable deduction for non-itemizers. */
  charitableNonItemizer: ByFilingStatus<number>
}

export interface CapitalGainsParams {
  /** Thresholds (taxable income) for 0% / 15% / 20%; the top rate applies above the last. */
  brackets: ByFilingStatus<Bracket[]>
  niitRate: number
  niitThreshold: ByFilingStatus<number>
  /** If true, gains above `ordinaryAbove` are taxed at ordinary rates (Biden/Harris style). */
  ordinaryAbove?: number
  /** Extra NIIT rate on investment income for filers with AGI above `over` (Greenbook: +1.2 points above $400k). */
  niitSurcharge?: { rate: number; over: number }
}

export interface PayrollParams {
  ssRateEmployee: number
  ssWageBase: number
  /** "Scrap the cap": re-apply SS tax to wages above this level (donut hole). null = none. */
  ssDonutHoleStart: number | null
  medicareRateEmployee: number
  additionalMedicareRate: number
  additionalMedicareThreshold: ByFilingStatus<number>
  /** Fraction of the employer's share assumed to pass through to wages. Displayed only. */
  seTaxDeductionFraction: number
}

export interface TariffParams {
  /** Estimated annual household cost of tariffs as a share of pre-tax income (Yale Budget Lab / Tax Foundation). */
  pctOfIncome: number
  /** Cap on annual cost so high earners aren't over-estimated. */
  maxAnnualCost: number
  /** Multiplier applied to current-law tariff cost: 0 = repeal all, 1 = current, >1 = expand. */
  multiplier: number
  /** Tariff-funded rebate paid per household member (e.g. Hawley's American Worker Rebate Act). */
  rebatePerPerson: number
  /** User assumption: share of tariff cost reaching consumers (0.5 / 1 / 1.5). Applied at the point of use. */
  passThrough: number
}

export interface AcaParams {
  /** Applicable-percentage schedule: [FPL%, share of income]. Linear between points. */
  applicablePct: Array<[number, number]>
  /** If true, no credit above 400% FPL (pre-ARPA cliff). */
  cliffAt400: boolean
  /** Below this FPL% in non-expansion states, no subsidy (coverage gap). */
  minFplPct: number
  /** Average unsubsidized benchmark silver premium for a 40-year-old, annual. */
  benchmarkPremiumAge40: number
  /** CMS default age curve factors keyed by age (21..64), relative to age-21 = 1.0. */
  ageCurve: Record<number, number>
  /** Age-40 factor in the curve, to normalize benchmarkPremiumAge40. */
  age40Factor: number
  /** Estimated average out-of-pocket spending for marketplace enrollees. */
  avgOutOfPocket: number
}

export interface MedicaidParams {
  /** Eligibility as % FPL for expansion adults. */
  expansionThresholdFpl: number
  /** If true, treat every state as expanded (federal fix for the coverage gap). */
  nationalExpansion: boolean
  /** OBBBA work requirements: assume some share of eligible adults lose coverage. */
  workRequirements: boolean
  /** Share of expansion adults projected to lose coverage under work requirements (CBO ~ 4.8M of ~20M). */
  workRequirementCoverageLossShare: number
  /** OBBBA cost-sharing: annual copays for expansion adults above 100% FPL (starts 2028). */
  annualCostSharing: number
  /** If true, Medicaid expansion is repealed / block-granted: expansion adults lose coverage. */
  repealExpansion: boolean
}

export interface MedicareParams {
  eligibilityAge: number
  partBPremiumMonthly: number
  partBDeductible: number
  partDOopCap: number
  /** Estimated average annual out-of-pocket for a Medicare beneficiary excluding Part B premium. */
  avgOutOfPocket: number
  /** IRMAA tiers: MAGI threshold (single) -> total monthly Part B premium. */
  irmaa: Array<{ single: number; mfj: number; partBMonthly: number }>
}

export interface SinglePayerParams {
  enabled: boolean
  /** Household income-based premium (Sanders option: 4% of income after the standard deduction). */
  householdPremiumRate: number
  /** Flat exemption; when `exemptionIsStandardDeduction` is true the filing-status standard deduction is used instead. */
  householdPremiumExemption: number
  exemptionIsStandardDeduction: boolean
  /** Employer-side payroll tax (7.5%); shown as passthrough if `employerPassthrough` > 0. */
  employerPayrollRate: number
  employerPassthrough: number
  /** If true, the employer's share of today's premium is assumed to return to the worker as taxable wages. */
  employerPremiumToWages: boolean
  /** Marginal-rate surcharge for very high earners (Sanders: 40% above $10M etc.). Simplified as surtaxes in IncomeTaxParams. */
}

export interface EmployerInsuranceParams {
  /** KFF average annual worker contribution, single and family. */
  avgWorkerContributionSingle: number
  avgWorkerContributionFamily: number
  /** KFF average total premium (used for passthrough scenarios). */
  avgTotalPremiumSingle: number
  avgTotalPremiumFamily: number
  /** Average out-of-pocket for ESI enrollees. */
  avgOutOfPocket: number
}

export interface UninsuredParams {
  /** Estimated average annual OOP for the uninsured (medical spending + risk). */
  avgOutOfPocket: number
}

export interface PolicyParams {
  year: number
  incomeTax: IncomeTaxParams
  ctc: CtcParams
  eitc: EitcParams
  deductions: DeductionParams
  capitalGains: CapitalGainsParams
  payroll: PayrollParams
  tariffs: TariffParams
  aca: AcaParams
  medicaid: MedicaidParams
  medicare: MedicareParams
  singlePayer: SinglePayerParams
  employerInsurance: EmployerInsuranceParams
  uninsured: UninsuredParams
  /**
   * Federal poverty guidelines. Marketplace subsidies for plan year 2026 use the 2025 table
   * (45 CFR 155.305(f)); Medicaid eligibility uses the 2026 table.
   */
  fpl: { aca: FplTable; medicaid: FplTable }
  /** Platform-level caveats surfaced to the user as warnings (e.g. "funding side not modeled"). */
  caveats: string[]
  /** True when the platform removes major taxes or programs without a modeled replacement; the UI mutes the headline. */
  unfunded: boolean
}

export interface FplTable {
  year: number
  /** Household sizes 1..8 for the 48 contiguous states + DC. */
  base: number[]
  ak: number[]
  hi: number[]
  perAdditional: { base: number; ak: number; hi: number }
  source: string
}

// ---------- User-adjustable modeling assumptions ----------

export interface Assumptions {
  /** Under single payer, does the employer's premium share become taxable wages? */
  employerPremiumToWages: boolean
  /** Share of a single-payer employer payroll premium passed to workers as lower wages (0, 0.5, 1). */
  employerPayrollPassthrough: number
  /** Multiplier on the share of tariff cost reaching consumers (0.5, 1, 1.5). */
  tariffPassThrough: number
}

// ---------- Platforms (politicians / parties) ----------

export type Confidence = 'high' | 'medium' | 'low' | 'default'

export interface Citation {
  /** Short label, e.g. "Campaign site, Tax plan" */
  label: string
  url: string
  /** ISO date of the source. */
  date?: string
}

export interface PolicyPosition {
  /** Machine id of the policy area, e.g. "ctc", "aca", "topRate". */
  area: PolicyArea
  /** One-sentence human summary of the stance. */
  summary: string
  confidence: Confidence
  citations: Citation[]
  /** Partial override applied to PolicyParams. Use a function so overrides can be relative to baseline. */
  apply?: (p: PolicyParams) => void
  /** If true, this position is a fallback inherited from the party baseline. */
  inherited?: boolean
  /**
   * For positions without `apply`: if true, the politician's stance is "keep current law" and the party
   * default for this area must NOT be applied. If false/undefined, an informational note still lets the
   * party default apply (and the UI shows both).
   */
  holdsCurrentLaw?: boolean
}

export type PolicyArea =
  | 'incomeRates'
  | 'standardDeduction'
  | 'ctc'
  | 'eitc'
  | 'salt'
  | 'payroll'
  | 'tipsOvertime'
  | 'capitalGains'
  | 'tariffs'
  | 'socialSecurityBenefits'
  | 'aca'
  | 'medicaid'
  | 'medicare'
  | 'singlePayer'
  | 'other'

export type Party = 'D' | 'R' | 'I' | 'L' | 'G'

// ---------- Spending side (context, never summed into take-home) ----------

export type SpendingCategory = 'defense' | 'health' | 'education' | 'safetyNet' | 'infrastructure' | 'immigration' | 'deficit'

/** Who produced a budget estimate. Drives the authority label in the UI; never render tiers as equals. */
export type Scorer = 'CBO' | 'JCT' | 'SSA-OACT' | 'CMS-OACT' | 'OMB' | 'thinkTank' | 'sponsor' | 'billText'

export interface SpendingPosition {
  category: SpendingCategory
  /** Direction of federal spending in this category. For `deficit`, "more" means more borrowing. */
  direction: 'more' | 'less' | 'mixed' | 'none'
  summary: string
  /** Budget effect in billions of dollars over `window` where scored: positive = more spending / larger deficit. */
  cost10yr?: number
  /** Who produced the estimate. */
  scorer?: Scorer
  /** Name of the think tank when scorer is 'thinkTank'. */
  scorerName?: string
  /** Scoring window, e.g. "2025–2034". */
  window?: string
  /** "Such sums as may be necessary" authorizations: render as "no stated cost", never $0. */
  openEnded?: boolean
  confidence: Confidence
  citations: Citation[]
}

export interface Platform {
  id: string
  name: string
  shortName: string
  kind: 'politician' | 'party' | 'baseline'
  party: Party
  /** e.g. "Governor of California" or "Party baseline" */
  role: string
  /** Party baseline this platform inherits unstated positions from. */
  inheritsFrom?: string
  description: string
  positions: PolicyPosition[]
  /** Positions on the record but with no household-level effect (corporate rate, estate tax). */
  notes?: string[]
  /** Spending-side commitments by category; inherited from `inheritsFrom` per category when absent. */
  spending?: SpendingPosition[]
}

// ---------- Results ----------

export interface LineItem {
  label: string
  amount: number
  /** Optional explanatory note. */
  note?: string
}

export interface HouseholdResult {
  platformId: string
  grossIncome: number
  agi: number
  taxableIncome: number
  federalIncomeTaxBeforeCredits: number
  nonRefundableCredits: number
  refundableCredits: number
  /** Net federal income tax (can be negative = net refund). */
  federalIncomeTax: number
  payrollTax: number
  stateIncomeTax: number
  /** Premiums + estimated out-of-pocket for the household's coverage path under this platform. */
  healthcareCost: number
  /** Which coverage the household ends up on under this platform. */
  effectiveCoverage: HealthCoverage | 'singlePayer' | 'coverageGap'
  tariffCost: number
  /** Gross minus all of the above. */
  netIncome: number
  effectiveFederalRate: number
  breakdown: LineItem[]
  /** Text warnings surfaced to the user (e.g. "loses Medicaid due to work requirement"). */
  warnings: string[]
  /** Mirrors PolicyParams.unfunded for display. */
  unfunded: boolean
}
