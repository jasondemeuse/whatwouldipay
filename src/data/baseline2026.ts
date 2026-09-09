import type { ByFilingStatus, PolicyParams } from '../engine/types'

/**
 * CURRENT-LAW BASELINE — tax year 2026 / plan year 2026, after the One Big Beautiful Bill Act
 * (P.L. 119-21, enacted 2025-07-04). Compiled 2026-09-08. Full research notes: docs/research/03-baseline-2026.md
 *
 * Primary sources:
 *  [RP32]  IRS Rev. Proc. 2025-32 (2026 inflation adjustments, post-OBBBA)  https://www.irs.gov/pub/irs-drop/rp-25-32.pdf
 *  [RP25]  IRS Rev. Proc. 2025-25 (2026 ACA applicable percentages)          https://www.irs.gov/pub/irs-drop/rp-25-25.pdf
 *  [IRS-TO] IRS, No tax on tips and overtime                                 https://www.irs.gov/newsroom/one-big-beautiful-bill-how-to-take-advantage-of-no-tax-on-tips-and-overtime
 *  [IRS-SR] IRS, Enhanced deduction for seniors                              https://www.irs.gov/newsroom/check-your-eligibility-for-the-new-enhanced-deduction-for-seniors
 *  [SSA]   SSA 2026 COLA fact sheet                                          https://www.ssa.gov/news/en/cola/factsheets/2026.html
 *  [IRS-AM] IRS Additional Medicare Tax Q&A                                  https://www.irs.gov/businesses/small-businesses-self-employed/questions-and-answers-for-the-additional-medicare-tax
 *  [HHS25] 2025 HHS poverty guidelines (govern 2026 marketplace subsidies)   https://aspe.hhs.gov/sites/default/files/documents/dd73d4f00d8a819d10b2fdb70d254f7b/detailed-guidelines-2025.pdf
 *  [HHS26] 2026 HHS poverty guidelines, 91 FR 1797                           https://www.federalregister.gov/documents/2026/01/15/2026-00755/annual-update-of-the-hhs-poverty-guidelines
 *  [KFF-BM] KFF average marketplace benchmark premiums (age 40)              https://www.kff.org/other/state-indicator/average-marketplace-premiums-by-metal-tier/
 *  [CMS-AGE] CMS default federal standard age curve (2016 guidance)          https://www.cms.gov/CCIIO/Resources/Regulations-and-Guidance/Downloads/Final-Guidance-Regarding-Age-Curves-and-State-Reporting-12-16-16.pdf
 *  [KFF-EHBS] KFF 2025 Employer Health Benefits Survey                       https://files.kff.org/attachment/Employer-Health-Benefits-Survey-2025-Annual-Survey-Summary-of-Findings.pdf
 *  [CMS-MED] CMS 2026 Medicare Parts A & B premiums and deductibles          https://www.cms.gov/newsroom/fact-sheets/2026-medicare-parts-b-premiums-deductibles
 *  [CRS-WR] CRS R48755, Medicaid community engagement requirement           https://www.congress.gov/crs-product/R48755
 *  [CBPP-WR] CBPP on CBO coverage-loss estimate (~5.3M uninsured by 2034)   https://www.cbpp.org/research/health/medicaid-work-requirements-will-take-away-coverage-from-millions-state-and
 *  [PK-ACA] Peterson-KFF, enhanced credits not restored (updated 2026-08-03) https://www.healthsystemtracker.org/brief/how-much-and-why-aca-marketplace-premiums-are-going-up-in-2027/
 *  [SANDERS] Sanders, Options to Finance Medicare for All (2019)             https://www.sanders.senate.gov/wp-content/uploads/options-to-finance-medicare-for-all.pdf
 *  [YALE-T] Yale Budget Lab tariff distributional analyses                   https://budgetlab.yale.edu/research/combined-distributional-effects-one-big-beautiful-bill-act-and-tariffs
 */

const by = <T,>(single: T, mfj: T, mfs: T, hoh: T): ByFilingStatus<T> => ({ single, mfj, mfs, hoh })

export const BASELINE_2026: PolicyParams = {
  year: 2026,

  incomeTax: {
    // [RP32] §4.01 Tables 1–4. Rates made permanent by OBBBA §70101.
    brackets: {
      single: [
        { rate: 0.1, over: 0 }, { rate: 0.12, over: 12400 }, { rate: 0.22, over: 50400 }, { rate: 0.24, over: 105700 },
        { rate: 0.32, over: 201775 }, { rate: 0.35, over: 256225 }, { rate: 0.37, over: 640600 },
      ],
      mfj: [
        { rate: 0.1, over: 0 }, { rate: 0.12, over: 24800 }, { rate: 0.22, over: 100800 }, { rate: 0.24, over: 211400 },
        { rate: 0.32, over: 403550 }, { rate: 0.35, over: 512450 }, { rate: 0.37, over: 768700 },
      ],
      mfs: [
        { rate: 0.1, over: 0 }, { rate: 0.12, over: 12400 }, { rate: 0.22, over: 50400 }, { rate: 0.24, over: 105700 },
        { rate: 0.32, over: 201775 }, { rate: 0.35, over: 256225 }, { rate: 0.37, over: 384350 },
      ],
      hoh: [
        { rate: 0.1, over: 0 }, { rate: 0.12, over: 17700 }, { rate: 0.22, over: 67450 }, { rate: 0.24, over: 105700 },
        { rate: 0.32, over: 201750 }, { rate: 0.35, over: 256200 }, { rate: 0.37, over: 640600 },
      ],
    },
    // [RP32] §4.14
    standardDeduction: by(16100, 32200, 16100, 24150),
    // [RP32] §4.14(3): $1,650 per married person 65+, $2,050 unmarried
    additionalDeduction65: { married: 1650, unmarried: 2050 },
    // [IRS-SR] OBBBA §70103: $6,000 per 65+ filer, 2025–2028, 6% phaseout above $75k/$150k MAGI. Not indexed.
    seniorDeduction: { amount: 6000, phaseoutStart: by(75000, 150000, 75000, 75000), phaseoutRate: 0.06 },
    surtaxes: [],
    socialSecurityBenefitTaxable: true,
    dependentExemption: 0,
  },

  ctc: {
    // [RP32] §4.05; OBBBA §70104
    amountPerChild: 2200,
    refundableMax: 1700,
    refundEarnedIncomeFloor: 2500,
    refundPhaseInRate: 0.15,
    fullyRefundable: false,
    phaseoutStart: by(200000, 400000, 200000, 200000),
    phaseoutPer1000: 50,
    otherDependentCredit: 500,
  },

  eitc: {
    // [RP32] §4.06. mfjBonus = MFJ phaseout start − single phaseout start.
    tiers: [
      { maxCredit: 664, phaseInRate: 0.0765, phaseOutRate: 0.0765, phaseOutStart: 10860, mfjBonus: 7280 },
      { maxCredit: 4427, phaseInRate: 0.34, phaseOutRate: 0.1598, phaseOutStart: 23890, mfjBonus: 7270 },
      { maxCredit: 7316, phaseInRate: 0.4, phaseOutRate: 0.2106, phaseOutStart: 23890, mfjBonus: 7270 },
      { maxCredit: 8231, phaseInRate: 0.45, phaseOutRate: 0.2106, phaseOutStart: 23890, mfjBonus: 7270 },
    ],
    investmentIncomeLimit: 12200,
    scale: 1,
    childlessMinAge: 25,
    childlessMaxAge: 64,
  },

  deductions: {
    // OBBBA §70120: $40,000 cap in 2025 rising 1%/yr → $40,400 in 2026 ($20,200 MFS); phase-down 30% of MAGI
    // over $505,000 ($252,500 MFS) to a $10,000 ($5,000) floor. Statutory arithmetic; not in RP32.
    salt: {
      enabled: true,
      cap: by(40400, 40400, 20200, 40400),
      phaseDownStart: by(505000, 505000, 252500, 505000),
      floor: by(10000, 10000, 5000, 10000),
    },
    // [IRS-TO] §224: $25,000 cap, $100 per $1,000 of MAGI over $150k/$300k. 2025–2028.
    tips: { enabled: true, cap: 25000, phaseoutStart: by(150000, 300000, 150000, 150000), phaseoutRate: 0.1 },
    // [IRS-TO] §225: $12,500 / $25,000 MFJ cap; only the FLSA premium "half" qualifies. 2025–2028.
    overtime: {
      enabled: true,
      cap: by(12500, 25000, 12500, 12500),
      phaseoutStart: by(150000, 300000, 150000, 150000),
      phaseoutRate: 0.1,
    },
    // OBBBA: permanent non-itemizer charitable deduction from TY2026 (not applied in the engine yet)
    charitableNonItemizer: by(1000, 2000, 1000, 1000),
  },

  capitalGains: {
    // [RP32] §4.03: 0% / 15% / 20% breakpoints (taxable income)
    brackets: {
      single: [{ rate: 0, over: 0 }, { rate: 0.15, over: 49450 }, { rate: 0.2, over: 545500 }],
      mfj: [{ rate: 0, over: 0 }, { rate: 0.15, over: 98900 }, { rate: 0.2, over: 613700 }],
      mfs: [{ rate: 0, over: 0 }, { rate: 0.15, over: 49450 }, { rate: 0.2, over: 306850 }],
      hoh: [{ rate: 0, over: 0 }, { rate: 0.15, over: 66200 }, { rate: 0.2, over: 579600 }],
    },
    // IRC §1411, thresholds not indexed
    niitRate: 0.038,
    niitThreshold: by(200000, 250000, 125000, 200000),
  },

  payroll: {
    // [SSA] 2026 wage base $184,500; [IRS-AM] 0.9% thresholds not indexed
    ssRateEmployee: 0.062,
    ssWageBase: 184500,
    ssDonutHoleStart: null,
    medicareRateEmployee: 0.0145,
    additionalMedicareRate: 0.009,
    additionalMedicareThreshold: by(200000, 250000, 125000, 200000),
    seTaxDeductionFraction: 0.5,
  },

  tariffs: {
    // [TF-TARIFF] After the Supreme Court struck the IEEPA tariffs (Learning Resources v. Trump, 2026-02-20), the
    // surviving Section 232/301/201 tariffs cost ~$840 per household in 2026 (was ~$1,000 in 2025); average
    // effective rate 7.2%. Modeled as a FLAT 1.0% of gross income capped at $3,000, so a median household lands near
    // $840. This is a proportional approximation; actual incidence is regressive (a larger share of low incomes).
    // https://taxfoundation.org/research/all/federal/trump-tariffs-trade-war/ (updated 2026-09-02)
    pctOfIncome: 0.01,
    maxAnnualCost: 3000,
    multiplier: 1,
    rebatePerPerson: 0,
    passThrough: 1,
  },

  aca: {
    // [RP25] 2026 applicable percentages under current law — enhanced (ARPA/IRA) credits expired 2025-12-31 and
    // had not been restored as of 2026-08-03 [PK-ACA]. The 400% FPL cliff is back.
    applicablePct: [
      [100, 0.021], [133, 0.021],
      [133, 0.0314], [150, 0.0419],
      [200, 0.066], [250, 0.0844], [300, 0.0996], [400, 0.0996],
    ],
    cliffAt400: true,
    minFplPct: 100,
    // [KFF-BM] 2026 national average benchmark (second-lowest silver) premium, age 40: $625/mo
    benchmarkPremiumAge40: 625 * 12,
    // [CMS-AGE] default federal standard age curve
    age40Factor: 1.278,
    ageCurve: {
      0: 0.765, 15: 0.833, 16: 0.859, 17: 0.885, 18: 0.913, 19: 0.941, 20: 0.97,
      21: 1.0, 22: 1.0, 23: 1.0, 24: 1.0, 25: 1.004, 26: 1.024, 27: 1.048, 28: 1.087, 29: 1.119, 30: 1.135,
      31: 1.159, 32: 1.183, 33: 1.198, 34: 1.214, 35: 1.222, 36: 1.23, 37: 1.238, 38: 1.246, 39: 1.262, 40: 1.278,
      41: 1.302, 42: 1.325, 43: 1.357, 44: 1.397, 45: 1.444, 46: 1.5, 47: 1.563, 48: 1.635, 49: 1.706, 50: 1.786,
      51: 1.865, 52: 1.952, 53: 2.04, 54: 2.135, 55: 2.23, 56: 2.333, 57: 2.437, 58: 2.548, 59: 2.603, 60: 2.714,
      61: 2.81, 62: 2.873, 63: 2.952, 64: 3.0,
    },
    // ASSUMPTION: typical annual out-of-pocket spending (deductible/copays) for a silver-plan household. Not sourced
    // to a single survey; silver deductibles average >$5,000 but realized spending is far lower for most enrollees.
    avgOutOfPocket: 1500,
  },

  medicaid: {
    // 133% FPL + 5-point disregard = 138% effective (MACPAC)
    expansionThresholdFpl: 138,
    nationalExpansion: false,
    // [CRS-WR] OBBBA work requirement: 80 hrs/month, expansion adults 19–64, effective 2027-01-01 (CMS-2454-IFC, 2026-06-01).
    // Exempts parents/caretakers of children under 14 (verify in IFC text), pregnant, medically frail, etc.
    workRequirements: true,
    // [CBPP-WR] CBO: ~5.3M more uninsured by 2034 out of roughly 20M expansion adults ≈ 25%.
    workRequirementCoverageLossShare: 0.25,
    // OBBBA cost sharing ($1–$35/service, 5% income cap) begins 2028-10-01; not in effect for 2026.
    annualCostSharing: 0,
    repealExpansion: false,
  },

  medicare: {
    eligibilityAge: 65,
    // [CMS-MED]
    partBPremiumMonthly: 202.9,
    partBDeductible: 283,
    partDOopCap: 2100,
    // ASSUMPTION: average beneficiary out-of-pocket for Part D premium, deductibles, coinsurance, dental/vision,
    // excluding the Part B premium. KFF puts total OOP incl. premiums near $6,500; ~$4,000 after removing Part B.
    avgOutOfPocket: 4000,
    // [CMS-MED] 2026 IRMAA tiers (based on 2024 MAGI). Total monthly Part B premium per tier.
    irmaa: [
      { single: 109000, mfj: 218000, partBMonthly: 284.1 },
      { single: 137000, mfj: 274000, partBMonthly: 405.8 },
      { single: 171000, mfj: 342000, partBMonthly: 527.5 },
      { single: 205000, mfj: 410000, partBMonthly: 649.2 },
      { single: 500000, mfj: 750000, partBMonthly: 689.9 },
    ],
  },

  singlePayer: {
    enabled: false,
    // [SANDERS] options paper: 4% household income premium above ~$29,000 (family of four); 7.5% employer payroll
    // premium with the first $2M of payroll exempt. Employer passthrough to wages assumed 0 in baseline display.
    householdPremiumRate: 0.04,
    householdPremiumExemption: 29000,
    exemptionIsStandardDeduction: true,
    employerPayrollRate: 0.075,
    employerPassthrough: 0,
    employerPremiumToWages: false,
  },

  employerInsurance: {
    // [KFF-EHBS] 2025 survey (2026 survey publishes Oct 2026)
    avgWorkerContributionSingle: 1440,
    avgWorkerContributionFamily: 6850,
    avgTotalPremiumSingle: 9325,
    avgTotalPremiumFamily: 26993,
    // ASSUMPTION: average realized out-of-pocket for ESI enrollees (Peterson-KFF tracker reports ~$1,100–$1,300/person-year
    // for large-employer plans); $1,200 used for a household.
    avgOutOfPocket: 1200,
  },

  uninsured: {
    // ASSUMPTION: expected annual cost of being uninsured (direct out-of-pocket spending plus the expected value of
    // uncompensated-care risk). Not sourced to a single survey. Deliberately conservative.
    avgOutOfPocket: 2500,
  },

  fpl: {
    // [HHS25] — 2026 marketplace subsidies use the 2025 guidelines (45 CFR 155.305(f))
    aca: {
      year: 2025,
      base: [15650, 21150, 26650, 32150, 37650, 43150, 48650, 54150],
      ak: [19550, 26430, 33310, 40190, 47070, 53950, 60830, 67710],
      hi: [17990, 24320, 30650, 36980, 43310, 49640, 55970, 62300],
      perAdditional: { base: 5500, ak: 6880, hi: 6330 },
      source: 'https://aspe.hhs.gov/sites/default/files/documents/dd73d4f00d8a819d10b2fdb70d254f7b/detailed-guidelines-2025.pdf',
    },
    // [HHS26] — Medicaid eligibility uses the 2026 guidelines
    medicaid: {
      year: 2026,
      base: [15960, 21640, 27320, 33000, 38680, 44360, 50040, 55720],
      ak: [19950, 27050, 34150, 41250, 48350, 55450, 62550, 69650],
      hi: [18360, 24890, 31420, 37950, 44480, 51010, 57540, 64070],
      perAdditional: { base: 5680, ak: 7100, hi: 6530 },
      source: 'https://www.federalregister.gov/documents/2026/01/15/2026-00755/annual-update-of-the-hhs-poverty-guidelines',
    },
  },
  caveats: [],
  unfunded: false,
}

/** Enhanced (ARPA/IRA, 2021–2025) applicable-percentage schedule, for "restore the enhanced credits" platforms. IRC §36B(b)(3)(A)(iii). */
export const ENHANCED_ACA_SCHEDULE: Array<[number, number]> = [
  [0, 0], [150, 0], [200, 0.02], [250, 0.04], [300, 0.06], [400, 0.085], [2000, 0.085],
]
