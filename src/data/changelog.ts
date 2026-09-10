/** Dated changes to the model or dataset, newest first. Surfaced on the methodology page. */
export const CHANGELOG: Array<{ date: string; summary: string }> = [
  {
    date: '2026-09-09',
    summary:
      'Simple view. The default landing is now a one-question-per-screen flow (household, state and age, income, coverage, who to compare) with large controls and photo cards, ending in a ranked answer where every row opens the "Why?" bridge and the positions and sources. The full comparison (line items, lever matrix, spending, assumptions) is one toggle away and remembered. Fixed the phone layout, where the comparison tables forced the whole page wider than the screen.',
  },
  {
    date: '2026-09-09',
    summary:
      'Sourcing pass. Restored the governors’ tariff positions with specific citations (Beshear and Pritzker: repeal; Moore and Whitmer: targeted, on their own words) and Beshear’s ACA position; Shapiro and Whitmer re-cited to the PA Department of Revenue and Michigan 2023 PA 4 instead of Wikipedia, with Shapiro’s unverified corporate-tax acceleration claim dropped. Added Mark Kelly (five cited positions). Recorded Ossoff’s denial alongside his market standing, and stated the inclusion criterion on the methodology page. Social Security wage base confirmed against IRS Tax Topic 751.',
  },
  {
    date: '2026-09-09',
    summary:
      'Pre-release review fixes. Engine: married-filing-separately filers no longer get the tips, overtime or senior deductions (joint-return rules); Social Security benefits taxed by the §86 provisional-income tiers instead of a flat 85%; Wisconsin adults under 100% of poverty treated as covered (BadgerCare waiver), not in a coverage gap; mixed-age couples priced per adult. Platforms: Sanders/progressive lane now models the full 40/45/50/52% schedule, capital gains as ordinary income above $250k, and the Social Security Expansion Act’s 16.2% investment income tax (verified against S.770); Democratic/Harris NIIT increase applies above $400k; Booker’s exemption sized against income with the 41%/43% offset; Rubio’s 2016 plan recorded as history rather than applied; Vance modeled at the enacted $2,200 credit; Hawley’s tariff rebate not modeled (funding struck down); unfunded platforms (Libertarian, Rand Paul) flagged. Positions without a specific citation were removed pending sources.',
  },
  {
    date: '2026-09-08',
    summary:
      'Added "Beyond your paycheck": an income-tax receipt using National Priorities Project FY2025 federal-funds shares with the borrowed share shown separately (OMB Historical Table 1.4), and spending-side commitments per platform with the scorer named on every figure (CBO, OMB, actuaries, think tank, or sponsor claim). Child ages now collected for age-tiered credits, marketplace child pricing and Medicaid work-requirement exemptions.',
  },
  {
    date: '2026-09-08',
    summary:
      'Initial release. Baseline: tax year 2026 under the One Big Beautiful Bill Act (Rev. Proc. 2025-32, SSA 2026 COLA, CMS 2026 Medicare premiums, HHS 2025/2026 poverty guidelines). Enhanced ACA credits treated as expired (not restored as of Aug 2026). Tariff cost set to ~$840/household after the Feb 2026 Supreme Court IEEPA ruling (Tax Foundation). 20 politicians and 5 party/lane baselines curated with citations.',
  },
]
