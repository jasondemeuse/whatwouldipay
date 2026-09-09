/** Dated changes to the model or dataset, newest first. Surfaced on the methodology page. */
export const CHANGELOG: Array<{ date: string; summary: string }> = [
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
