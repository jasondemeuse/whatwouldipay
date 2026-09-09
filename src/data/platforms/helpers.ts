import type { ByFilingStatus, Citation, Confidence, PolicyArea, PolicyParams, PolicyPosition } from '../../engine/types'
import { ENHANCED_ACA_SCHEDULE } from '../baseline2026'

export const cite = (label: string, url: string, date?: string): Citation => ({ label, url, date })

export const pos = (
  area: PolicyArea,
  summary: string,
  confidence: Confidence,
  citations: Citation[],
  apply?: (p: PolicyParams) => void,
): PolicyPosition => ({ area, summary, confidence, citations, apply })

/** Position that is on the record but has no household-level effect in this calculator. The party default still applies. */
export const note = (area: PolicyArea, summary: string, confidence: Confidence, citations: Citation[]): PolicyPosition =>
  pos(area, summary, confidence, citations)

/** Politician keeps current law on this area, blocking the party default (e.g. a documented non-cosponsorship). */
export const hold = (area: PolicyArea, summary: string, confidence: Confidence, citations: Citation[]): PolicyPosition => ({
  ...pos(area, summary, confidence, citations),
  holdsCurrentLaw: true,
})

// ---------- reusable parameter changes ----------

/** Replace the top of the bracket schedule: everything above `threshold` is taxed at `rate`. */
export function setTopRate(p: PolicyParams, rate: number, threshold: ByFilingStatus<number>) {
  for (const fs of ['single', 'mfj', 'mfs', 'hoh'] as const) {
    const t = threshold[fs]
    const kept = p.incomeTax.brackets[fs].filter((b) => b.over < t)
    p.incomeTax.brackets[fs] = [...kept, { rate, over: t }]
  }
}

/** Add a surtax on taxable income above a threshold (same threshold for all statuses). */
export function addSurtax(p: PolicyParams, rate: number, over: number) {
  p.incomeTax.surtaxes.push({ rate, over: { single: over, mfj: over, mfs: over / 2, hoh: over } })
}

export function restoreEnhancedAca(p: PolicyParams) {
  p.aca.applicablePct = [...ENHANCED_ACA_SCHEDULE]
  p.aca.cliffAt400 = false
}

export function removeAcaSubsidies(p: PolicyParams) {
  p.aca.applicablePct = [[0, 1], [5000, 1]]
  p.aca.cliffAt400 = true
}

export function reverseObbbaMedicaid(p: PolicyParams) {
  p.medicaid.workRequirements = false
  p.medicaid.annualCostSharing = 0
}

export function closeCoverageGap(p: PolicyParams) {
  p.medicaid.nationalExpansion = true
}

export function scrapTheCap(p: PolicyParams, above: number) {
  p.payroll.ssDonutHoleStart = above
}

/** ARPA-style CTC: $3,000 base ($3,600 under 6 not modeled — no child ages), fully refundable, monthly. */
export function ctcArpa(p: PolicyParams) {
  p.ctc.amountPerChild = 3000
  p.ctc.fullyRefundable = true
  p.ctc.youngChildBonus = { amount: 600, underAge: 6 }
}

/** American Family Act (Bennet/Booker, 2025-04-09): $3,600 ages 6–17, $4,320 ages 1–5, $6,360 newborns; fully refundable, monthly. */
export function ctcAmericanFamilyAct(p: PolicyParams) {
  p.ctc.amountPerChild = 3600
  p.ctc.fullyRefundable = true
  p.ctc.youngChildBonus = { amount: 720, underAge: 6 }
}

/** Hawley: $5,000 per child, refundable against payroll tax with no earnings floor (modeled as fully refundable). */
export function ctcHawley(p: PolicyParams) {
  p.ctc.amountPerChild = 5000
  p.ctc.fullyRefundable = true
}

/** ARPA childless-worker EITC expansion, per the FY2025 Greenbook (2024 dollars): max $1,749, 15.3% rates, ages 19+ with no 65 cap. */
export function eitcChildlessExpansion(p: PolicyParams) {
  p.eitc.tiers[0] = { maxCredit: 1749, phaseInRate: 0.153, phaseOutRate: 0.153, phaseOutStart: 13650, mfjBonus: 7280 }
  p.eitc.childlessMinAge = 19
  p.eitc.childlessMaxAge = 200
}

export function medicareForAll(p: PolicyParams) {
  p.singlePayer.enabled = true
}

/** Tariff stance → multiplier on the current-law household cost (~$840/yr average). */
export const TARIFF = {
  /** Repeal the 2025+ tariffs; only the pre-2025 Section 301 China tariffs remain. */
  repeal: 0.25,
  /** Keep targeted China/strategic tariffs, drop broad ones. */
  targeted: 0.5,
  keep: 1,
  expand: 1.25,
  /** Full free trade. */
  none: 0,
}
export const tariffs = (multiplier: number) => (p: PolicyParams) => {
  p.tariffs.multiplier = multiplier
}

export const SRC = {
  obbbaKff: cite('KFF — Health provisions in the 2025 reconciliation law', 'https://www.kff.org/medicaid/health-provisions-in-the-2025-federal-budget-reconciliation-law/'),
  tfTariffs: cite('Tax Foundation — Trump tariffs tracker (updated 2026-09-02)', 'https://taxfoundation.org/research/all/federal/trump-tariffs-trade-war/', '2026-09-02'),
  gopPlatform: cite('2024 Republican Party Platform', 'https://www.presidency.ucsb.edu/documents/2024-republican-party-platform', '2024-07-08'),
  demPlatform: cite('2024 Democratic Party Platform', 'https://democrats.org/where-we-stand/party-platform/', '2024-08-19'),
  greenbook: cite('Treasury FY2025 Greenbook (Biden-Harris revenue proposals)', 'https://home.treasury.gov/system/files/131/General-Explanations-FY2025.pdf', '2024-03-11'),
  fy25budget: cite('FY2025 President’s Budget', 'https://www.whitehouse.gov/wp-content/uploads/2024/03/budget_fy2025.pdf', '2024-03-11'),
  afa: cite('Bennet/Booker — American Family Act reintroduction', 'https://www.bennet.senate.gov/2025/04/09/bennet-booker-warnock-cortez-masto-durbin-wyden-senate-colleagues-reintroduce-the-american-family-act-to-expand-the-child-tax-credit/', '2025-04-09'),
  ssea: cite('Sanders — Social Security Expansion Act one-pager', 'https://www.sanders.senate.gov/wp-content/uploads/Social-Security-Expansion-Act-one-pager-Final.pdf'),
  m4aBill: cite('S.1506 Medicare for All Act (119th) — bill text', 'https://www.govinfo.gov/content/pkg/BILLS-119s1506is/html/BILLS-119s1506is.htm', '2025-04-29'),
  m4aHouse: cite('H.R.3069 Medicare for All Act — cosponsors', 'https://www.congress.gov/bill/119th-congress/house-bill/3069/cosponsors', '2025-04-29'),
  gallegoAca: cite('Gallego — Protecting Healthcare And Lowering Costs Act', 'https://www.gallego.senate.gov/news/press-releases/gallego-colleagues-introduce-legislation-to-reverse-devastating-health-care-cuts-in-republicans-big-beautiful-bill/', '2025-08-19'),
  lpPlatform: cite('Libertarian Party Platform', 'https://www.lp.org/platform/', '2026-05-25'),
  sandersM4aFinance: cite('Sanders — Options to Finance Medicare for All', 'https://www.sanders.senate.gov/wp-content/uploads/options-to-finance-medicare-for-all.pdf', '2019-04-10'),
  hawleyCtc: cite('Hawley — child tax credit proposal', 'https://www.hawley.senate.gov/hawley-unveils-new-child-tax-credit-proposal-to-support-working-families', '2024-12-17'),
  hawleyRebate: cite('Hawley — American Worker Rebate Act', 'https://www.hawley.senate.gov/hawley-introduces-legislation-to-send-rebate-checks-to-working-americans/', '2025-07-28'),
  hawleyMedicaid: cite('Hawley — "Don’t Cut Medicaid" op-ed and Protect Medicaid and Rural Hospitals Act', 'https://www.hawley.senate.gov/hawley-op-ed-dont-cut-medicaid/', '2025-05-12'),
  hawleyAcaVote: cite('ATR — Hawley voted for the Democratic enhanced-subsidy extension', 'https://www.atr.org/senator-hawley-to-the-left-of-wapo-on-obamacare-subsidies/', '2025-12-11'),
  hawleyDrugs: cite('Hawley/Welch — Fair Prescription Drug Prices for Americans Act', 'https://www.hawley.senate.gov/in-bipartisan-push-hawley-welch-introduce-major-legislation-to-lower-prescription-drug-prices/', '2025-05-05'),
}
