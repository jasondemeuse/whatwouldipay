/**
 * Income-tax "receipt", FY2025 (final). Method: National Priorities Project's federal-funds shares (income tax does not
 * finance trust-fund programs like Social Security or Medicare Part A), scaled by the share of federal-funds spending that
 * FY2025 receipts actually covered (64.59%, OMB Historical Table 1.4), with the remainder shown as borrowed.
 * Research notes: docs/research/08-spending.md, Part A.
 *
 * Sources:
 *   Treasury Final Monthly Treasury Statement, September 2025, Table 9 (outlays by function; total $7,010.0B)
 *     https://fiscaldata.treasury.gov/static-data/published-reports/mts/MonthlyTreasuryStatement_202509.pdf
 *   OMB Historical Table 1.4, FY2027 Budget (federal funds vs trust funds; FF receipts $3,413.5B, FF outlays $5,284.5B)
 *     https://www.whitehouse.gov/wp-content/uploads/2026/04/hist01z4_fy2027.xlsx
 *   National Priorities Project, Tax Day 2026 (FY2025 federal-funds receipt) and methodology
 *     https://www.nationalpriorities.org/analysis/2026/tax-day-2026/
 *     https://www.nationalpriorities.org/works-on/about-our-numbers/
 */
export const RECEIPT_SOURCE = {
  label: 'National Priorities Project (FY2025 federal funds) and OMB Historical Table 1.4',
  url: 'https://www.nationalpriorities.org/analysis/2026/tax-day-2026/',
}

/** Share of federal-funds outlays covered by federal-funds receipts in FY2025; the rest was borrowed. */
export const FEDERAL_FUNDS_COVERAGE = 0.6459
export const BORROWED_SHARE = 1 - FEDERAL_FUNDS_COVERAGE

export interface ReceiptRow {
  id: string
  label: string
  /** Share of the household's federal income tax. All rows including `borrowed` sum to ~1. */
  share: number
  borrowed?: boolean
  detail?: string
}

/** NPP FY2025 federal-funds shares × coverage, plus the borrowed wedge. */
const npp = (pct: number) => (pct / 100) * FEDERAL_FUNDS_COVERAGE

export const RECEIPT: ReceiptRow[] = [
  { id: 'health', label: 'Health (Medicaid; Medicare Parts B & D)', share: npp(28.89), detail: 'Medicaid 12.3%, Medicare general-fund share 10.9%, other health 5.7% of federal funds' },
  { id: 'interest', label: 'Interest on the debt', share: npp(21.37) },
  { id: 'military', label: 'Military and weapons', share: npp(19.99), detail: 'Pentagon contractors 9.2%, military personnel 3.8%; includes international security assistance' },
  { id: 'veterans', label: 'Veterans', share: npp(6.93) },
  { id: 'income', label: 'Labor and income assistance', share: npp(5.45), detail: 'SSI, unemployment, TANF, refundable EITC/CTC' },
  { id: 'food', label: 'Food and agriculture', share: npp(3.63), detail: 'SNAP 2.0% of federal funds' },
  { id: 'education', label: 'Education', share: npp(3.15) },
  { id: 'housing', label: 'Housing and community', share: npp(2.67) },
  { id: 'other', label: 'Government, science, transportation, international', share: npp(2.3 + 0.77 + 0.93 + 0.8) },
  { id: 'energy', label: 'Energy and environment', share: npp(1.95) },
  { id: 'law', label: 'Law enforcement (incl. ICE and CBP)', share: npp(1.16), detail: 'CBP 0.4%, ICE 0.2% of federal funds' },
  { id: 'borrowed', label: 'Borrowed (charged to future taxpayers)', share: BORROWED_SHARE, borrowed: true },
]

/** FY2025 headline fiscal facts for the disclosure line (Treasury Final MTS Sept 2025; OMB Table 1.4). */
export const FISCAL_2025 = {
  outlaysB: 7010.0,
  receiptsB: 5234.6,
  deficitB: 1775.4,
  spentPerDollar: 1.34,
  unifiedBorrowedShare: 0.2531,
}
