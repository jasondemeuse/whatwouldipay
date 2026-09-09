import type { Platform } from '../../engine/types'
import { SRC, TARIFF, cite, ctcHawley, hold, note, pos, restoreEnhancedAca, tariffs } from './helpers'

export const VANCE: Platform = {
  id: 'vance',
  name: 'JD Vance',
  shortName: 'Vance',
  kind: 'politician',
  party: 'R',
  role: 'Vice President',
  inheritsFrom: 'party-gop',
  description:
    'Owns the OBBBA record (cast the tie-breaking vote). Floated a $5,000 child credit as the 2024 nominee but now touts the enacted $2,200, which is what this model uses. Defends broad tariffs, opposed the enhanced ACA subsidies, and says he has no intention of repealing the ACA itself.',
  positions: [
    note('incomeRates', 'Keep the permanent OBBBA rates; "cutting the top marginal rate is not a high priority for me."', 'medium', [
      cite('Fox Business: Where Vance stands on taxes', 'https://www.foxbusiness.com/politics/where-does-jd-vance-stand-taxes-everything-you-need-know', '2024-07-16'),
    ]),
    hold('ctc', 'Floated $5,000 per child as the 2024 nominee; as Vice President he touts the enacted $2,200 and has not renewed the $5,000 proposal, so current law is modeled.', 'medium', [
      cite('CBS News: Vance $5,000 child tax credit', 'https://www.cbsnews.com/news/jd-vance-child-tax-credit-5000-what-to-know/', '2024-08-12'),
      cite('ATR: Vance touts OBBBA tax cuts', 'https://atr.org/vice-president-vance-touts-big-beautiful-tax-cuts-you-earned-it-you-ought-to-keep-it/', '2026-01-22'),
    ]),
    note('salt', 'Personally favored limiting or eliminating SALT (2024); enacted the $40,000 cap as VP.', 'medium', [
      cite('Fox Business: Where Vance stands on taxes', 'https://www.foxbusiness.com/politics/where-does-jd-vance-stand-taxes-everything-you-need-know', '2024-07-16'),
    ]),
    note('tipsOvertime', 'Promotes the tips and overtime deductions as promises kept; no statement on extending them past 2028.', 'medium', [SRC.gopPlatform]),
    pos('tariffs', 'Expand/keep: sustained public defense of broad tariffs, including in tariff-hit Michigan (March 2025).', 'high', [
      cite('Bridge Michigan: Vance defends tariffs, urges patience', 'https://bridgemi.com/michigan-government/takeaways-fact-checks-vance-defends-tariffs-urges-patience-michigan/', '2025-03-14'),
    ], tariffs(TARIFF.expand)),
    hold('aca', '"No intention of repealing" the ACA, but argued the enhanced credits fuel insurer "waste and fraud"; the administration let them lapse. Current law kept.', 'high', [
      cite('CNBC: Vance on ACA subsidies during the shutdown', 'https://www.cnbc.com/2025/10/12/government-shutdown-vance-aca-democrats.html', '2025-10-12'),
    ]),
    note('medicaid', 'Keep the OBBBA cuts and work requirements. He cast the 51–50 tie-breaking vote and has toured defending the law.', 'high', [SRC.obbbaKff]),
    note('capitalGains', 'Stop Subsidizing Giant Mergers Act (with Whitehouse): end tax deferral on stock-for-stock mergers above $500M revenue. No wealth tax.', 'high', [
      cite('Whitehouse/Vance merger bill', 'https://www.whitehouse.senate.gov/news/release/whitehouse-vance-introduce-bipartisan-legislation-to-eliminate-tax-breaks-for-corporate-consolidation/', '2024-03-21'),
    ]),
  ],
  notes: ['Sponsored a bill raising the large-university endowment tax from 1.4% to 35%.'],
}

export const RUBIO: Platform = {
  id: 'rubio',
  name: 'Marco Rubio',
  shortName: 'Rubio',
  kind: 'politician',
  party: 'R',
  role: 'Secretary of State',
  inheritsFrom: 'party-gop',
  description:
    'No 2025–26 domestic tax or healthcare statements found in his current role, so the model uses the Republican baseline. His 2014–2017 Senate record (the Rubio–Lee plan, the TCJA child credit fight) is recorded below as historical context only, not applied.',
  positions: [
    note('incomeRates', 'Historical: the 2016 Rubio–Lee plan collapsed brackets to 15% / 25% / 35% and replaced the standard deduction with a $2,000 refundable personal credit. Not modeled; the two changes only make sense together.', 'medium', [
      cite('Tax Foundation: Rubio tax plan', 'https://taxfoundation.org/blog/marco-rubio-tax-plan/', '2016-03-16'),
    ]),
    note('ctc', 'Historical: forced the TCJA doubling to $2,000 with refundability against payroll tax (2017); his 2015 plan called for $2,500 per child. Current law ($2,200) modeled.', 'medium', [
      cite('CNBC: Rubio/Lee child tax credit fight', 'https://www.cnbc.com/2017/11/15/senate-gop-raises-child-tax-credit-to-win-over-marco-rubio-mike-lee.html', '2017-11-15'),
    ]),
    note('eitc', '2014: abolish the EITC and replace it with a direct federal wage subsidy (not modeled).', 'medium', [
      cite('Wikipedia: Political positions of Marco Rubio', 'https://en.wikipedia.org/wiki/Political_positions_of_Marco_Rubio'),
    ]),
    note('capitalGains', 'Historical: Rubio–Lee (2016) eliminated individual taxation of capital gains and dividends. Not modeled.', 'medium', [
      cite('Tax Foundation: Rubio tax plan', 'https://taxfoundation.org/blog/marco-rubio-tax-plan/', '2016-03-16'),
    ]),
    pos('tariffs', 'Expand: moved from free trader to tariff advocate; as Secretary of State defends tariffs as trade-deal leverage.', 'high', [
      cite('Reason: Rubio on tariffs', 'https://reason.com/2024/05/10/marco-rubio-used-to-know-how-tariffs-work-what-happened/', '2024-05-10'),
    ], tariffs(TARIFF.expand)),
    note('medicare', '2014: convert Medicare to premium support, exempting everyone then 55+. Historical.', 'medium', [
      cite('CRFB: Rubio retirement reforms', 'https://www.crfb.org/blogs/rubio-proposes-retirement-program-reforms', '2014-05-14'),
    ]),
    note('payroll', '2014: eliminate payroll taxes for workers past full retirement age (not modeled).', 'medium', [
      cite('CRFB: Rubio retirement reforms', 'https://www.crfb.org/blogs/rubio-proposes-retirement-program-reforms', '2014-05-14'),
    ]),
  ],
  notes: ['Rubio–Lee (2016): corporate 25%, full estate tax repeal. Long-time ACA repeal-and-replace supporter (2013–2017).'],
}

export const DESANTIS: Platform = {
  id: 'desantis',
  name: 'Ron DeSantis',
  shortName: 'DeSantis',
  kind: 'politician',
  party: 'R',
  role: 'Governor of Florida (term ends Jan 2027)',
  inheritsFrom: 'party-gop',
  description:
    'No documented federal tax-rate or credit position; Florida has no income tax. His federal fiscal stance is deficit-focused (he pitched a balanced-budget amendment in June 2026). His healthcare record is a decade of refusing Medicaid expansion. Tax parameters fall back to the GOP baseline.',
  positions: [
    note('medicaid', 'Florida has refused ACA Medicaid expansion throughout his tenure; 2026 state bills to add work requirements for existing enrollees died without passage.', 'medium', [
      cite('KFF Health News: Florida Medicaid and OBBBA', 'https://kffhealthnews.org/medicaid/florida-medicaid-work-requirements-expansion-one-big-beautiful-bill-act/'),
    ]),
  ],
  notes: [
    'Pushing a Florida property-tax elimination amendment ($1,000 homestead rebates; exemption to $150k in 2027 and $250k in 2028; needs 60% in Nov 2026).',
  ],
}

export const CRUZ: Platform = {
  id: 'cruz',
  name: 'Ted Cruz',
  shortName: 'Cruz',
  kind: 'politician',
  party: 'R',
  role: 'U.S. Senator, Texas',
  inheritsFrom: 'party-gop',
  description:
    'Author of the No Tax on Tips Act and a bill to make TCJA rates permanent (now law). His 10% flat tax is a 2015–16 plan. Openly calls tariffs "a tax on consumers", which puts him at odds with the administration.',
  positions: [
    note('incomeRates', 'S.2687 to make TCJA individual rates permanent (enacted via OBBBA). Long-standing 10% flat tax plan from 2015–16 not modeled.', 'high', [
      cite('ATR: Cruz permanence bill', 'https://atr.org/senator-cruz-introduces-bill-make-individual-tax-cuts-permanent/'),
      cite('Tax Foundation: Cruz tax plan', 'https://taxfoundation.org/research/all/federal/senator-ted-cruz-tax-plan/', '2015-10-29'),
    ]),
    pos('eitc', 'Flat-tax plan expanded the EITC by 20%. Dated (2016).', 'medium', [
      cite('TPC: Cruz EITC update', 'https://taxpolicycenter.org/taxvox/tpc-updates-analysis-ted-cruzs-tax-proposal-reflect-change-his-eitc-proposal', '2016-02'),
    ], (p) => {
      p.eitc.scale = 1.2
    }),
    note('tipsOvertime', 'Authored the No Tax on Tips Act (passed the Senate by unanimous consent 2025-05-20). No overtime bill.', 'high', [
      cite('Cruz: No Tax on Tips Act', 'https://www.cruz.senate.gov/newsroom/press-releases/sen-cruz-introduces-bipartisan-bicameral-no-tax-on-tips-act', '2025-01-16'),
    ]),
    pos('tariffs', 'Reduce: tariffs are "a tax on consumers"; lobbied the president to cut them; sharper in leaked recordings (Jan 2026).', 'high', [
      cite('Newsweek: Cruz criticizes tariffs', 'https://www.newsweek.com/ted-cruz-criticizes-donald-trump-tariffs-tax-consumers-2055190', '2025-04'),
      cite('Axios: Cruz on leaked tapes', 'https://www.axios.com/2026/01/25/cruz-trump-vance-secret-tapes', '2026-01-25'),
    ], tariffs(TARIFF.targeted)),
    note('payroll', 'Frames Trump Accounts as a step toward diverting "a portion of your payroll taxes" into personal accounts. Aspirational.', 'medium', [
      cite('Axios: Cruz on Trump Accounts and Social Security', 'https://www.axios.com/2026/05/08/cruz-trump-accounts-social-security', '2026-05-08'),
    ]),
  ],
  notes: ['Corporate 15%; full estate tax repeal (Death Tax Repeal Act cosponsor).'],
}

export const PAUL: Platform = {
  id: 'paul',
  name: 'Rand Paul',
  shortName: 'R. Paul',
  kind: 'politician',
  party: 'R',
  role: 'U.S. Senator, Kentucky',
  inheritsFrom: 'party-gop',
  description:
    'A 14.5% flat tax on all income with a $15,000 per-filer deduction and $5,000 per-person exemption, elimination of payroll taxes (replaced by a 14.5% business transfer tax), the strongest anti-tariff record in the GOP, and HSAs for everyone. Voted no on OBBBA over spending.',
  positions: [
    pos('incomeRates', '14.5% flat tax on all individual income including capital gains, dividends and interest; voted no on OBBBA on debt grounds.', 'high', [
      cite('CRFB: Rand Paul flat tax', 'https://www.crfb.org/blogs/senator-rand-paul-releases-flat-tax-plan', '2015-06-18'),
      cite('Paul: Why I said no to OBBBA', 'https://www.paul.senate.gov/op_eds/why-i-said-no-to-the-one-big-beautiful-bill-act/', '2025-07'),
    ], (p) => {
      for (const fs of ['single', 'mfj', 'mfs', 'hoh'] as const) p.incomeTax.brackets[fs] = [{ rate: 0.145, over: 0 }]
      p.incomeTax.seniorDeduction.amount = 0
      p.unfunded = true
      p.caveats.push(
        'Paul’s plan replaces payroll and corporate taxes with a 14.5% business transfer tax, which economists expect to raise prices or lower wages; that cost is not modeled here, so the headline gain is overstated.',
      )
    }),
    pos('standardDeduction', '$15,000 deduction per filer plus $5,000 per person (a family of four owes nothing on the first $50,000).', 'high', [
      cite('CRFB: Rand Paul flat tax', 'https://www.crfb.org/blogs/senator-rand-paul-releases-flat-tax-plan', '2015-06-18'),
    ], (p) => {
      p.incomeTax.standardDeduction = { single: 20000, mfj: 40000, mfs: 20000, hoh: 20000 }
      p.incomeTax.dependentExemption = 5000
      p.incomeTax.additionalDeduction65 = { married: 0, unmarried: 0 }
    }),
    note('ctc', 'Flat-tax plan retains the child tax credit at current parameters.', 'medium', [
      cite('CRFB: Rand Paul flat tax', 'https://www.crfb.org/blogs/senator-rand-paul-releases-flat-tax-plan', '2015-06-18'),
    ]),
    pos('tipsOvertime', 'The flat tax has no special deductions, so the tips and overtime deductions would not exist.', 'medium', [
      cite('CRFB: Rand Paul flat tax', 'https://www.crfb.org/blogs/senator-rand-paul-releases-flat-tax-plan', '2015-06-18'),
    ], (p) => {
      p.deductions.tips.enabled = false
      p.deductions.overtime.enabled = false
    }),
    pos('capitalGains', 'Capital gains, dividends and interest taxed at the same 14.5% flat rate; the 3.8% net investment income tax is repealed.', 'medium', [
      cite('CRFB: Rand Paul flat tax', 'https://www.crfb.org/blogs/senator-rand-paul-releases-flat-tax-plan', '2015-06-18'),
    ], (p) => {
      for (const fs of ['single', 'mfj', 'mfs', 'hoh'] as const) p.capitalGains.brackets[fs] = [{ rate: 0.145, over: 0 }]
      p.capitalGains.niitRate = 0
    }),
    pos('payroll', 'Eliminate payroll taxes entirely (funded by the business transfer tax); has floated gradually raising the retirement age.', 'medium', [
      cite('CRFB: Rand Paul flat tax', 'https://www.crfb.org/blogs/senator-rand-paul-releases-flat-tax-plan', '2015-06-18'),
    ], (p) => {
      p.payroll.ssRateEmployee = 0
      p.payroll.medicareRateEmployee = 0
      p.payroll.additionalMedicareRate = 0
    }),
    pos('tariffs', 'Repeal: sponsored the resolution terminating the Canada tariff emergency (passed 51–48, Apr 2025) and the IEEPA emergency (passed Oct 2025).', 'high', [
      cite('Reason: Senate passes Paul’s Canada tariff resolution', 'https://reason.com/2025/04/02/the-senate-just-passed-rand-pauls-bill-to-block-trumps-tariffs-on-canada/', '2025-04-02'),
    ], tariffs(TARIFF.repeal)),
    note('aca', 'Opposes a clean extension of the enhanced credits; pushed a market/HSA alternative (Dec 2025).', 'medium', [
      cite('Reason: Paul’s ACA alternative', 'https://reason.com/2025/12/15/obamacare-subsidies-cant-fix-a-broken-system-rand-pauls-bill-could/', '2025-12-15'),
    ]),
    note('medicaid', 'Wanted deeper Medicaid cuts than OBBBA, not fewer.', 'high', [
      cite('Paul: Why I said no to OBBBA', 'https://www.paul.senate.gov/op_eds/why-i-said-no-to-the-one-big-beautiful-bill-act/', '2025-07'),
    ]),
    pos('medicare', 'Raise Medicare eligibility from 65 to 70 over 20 years with means-testing (dated proposal).', 'medium', [
      cite('National Memo: Paul Medicare plan', 'https://www.nationalmemo.com/rand-pauls-plan-would-end-medicare-as-we-know-it-for-all-seniors-raise-retirement-age-to-70'),
    ], (p) => {
      p.medicare.eligibilityAge = 70
    }),
    note('other', 'Health Marketplace and Savings Accounts for All Act: HSAs for anyone, $24,500 limit, usable for premiums; Association Health Plans Act of 2025.', 'high', [
      cite('Paul: HSAs for All Act', 'https://www.paul.senate.gov/senator-paul-introduces-the-health-marketplace-and-savings-accounts-for-all-act'),
    ]),
  ],
  notes: ['Eliminate the estate tax; corporate income tax folded into the 14.5% business transfer tax.'],
}

export const HAWLEY: Platform = {
  id: 'hawley',
  name: 'Josh Hawley',
  shortName: 'Hawley',
  kind: 'politician',
  party: 'R',
  role: 'U.S. Senator, Missouri',
  inheritsFrom: 'party-maga',
  description:
    'The most policy-distinctive Republican: $5,000 child credit with no earnings floor, tariff-funded rebate checks, voted to extend the enhanced ACA credits, "Don’t Cut Medicaid," and international reference pricing for drugs. Author of the No Tax on Overtime Act.',
  positions: [
    pos('ctc', '$5,000 per child, no minimum-earnings threshold, refundable against payroll tax, paid monthly, extended to the pregnancy year.', 'high', [SRC.hawleyCtc], ctcHawley),
    note('tipsOvertime', 'Introduced S.1046, No Tax on Overtime Act of 2025 (enacted as a deduction in OBBBA).', 'high', [SRC.hawleyOvertime]),
    pos('tariffs', 'Keep and expand tariffs on China. His American Worker Rebate Act (at least $600 per person from tariff revenue) relied on the IEEPA tariffs struck down in Feb 2026 and was not enacted, so no rebate is modeled.', 'high', [SRC.hawleyRebate, SRC.tfTariffs], tariffs(TARIFF.keep)),
    pos('aca', 'Voted YES on the Democrats’ 3-year enhanced-subsidy extension (2025-12-11); proposed a $25,000 medical-expense deduction with no AGI floor.', 'high', [SRC.hawleyAcaVote], restoreEnhancedAca),
    note('medicaid', '"Don’t Cut Medicaid" (NYT, 2025-05-12); Protect Medicaid and Rural Hospitals Act reverses provider-tax cuts and doubles the rural fund to $100B. Still voted for OBBBA; work requirement stays.', 'high', [SRC.hawleyMedicaid]),
    note('medicare', 'Fair Prescription Drug Prices for Americans Act (with Welch): cap U.S. list prices at the six-country average; ETHIC Act on patent thickets.', 'high', [SRC.hawleyDrugs]),
  ],
  notes: ['Cap Insulin Prices Act (2023); ban on PBM rebates; defense-contractor buyback limits with Warren (2026).'],
}

export const HALEY: Platform = {
  id: 'haley',
  name: 'Nikki Haley',
  shortName: 'Haley',
  kind: 'politician',
  party: 'R',
  role: 'Former UN Ambassador and South Carolina Governor',
  inheritsFrom: 'party-gop',
  description:
    'Eliminate the SALT deduction entirely, raise the Social Security retirement age for today’s twenty-somethings, and repeal broad tariffs. She was the most anti-tariff Republican of the 2024 cycle. Declined Medicaid expansion as governor.',
  positions: [
    pos('salt', 'Eliminate the SALT deduction entirely, an "unfair distortion" that forces low-tax states to subsidize high-tax states.', 'high', [
      cite('Yahoo/Reuters: Haley tax plan', 'https://www.yahoo.com/news/nikki-haley-promising-cut-taxes-140000979.html', '2023-09-22'),
    ], (p) => {
      p.deductions.salt.cap = { single: 0, mfj: 0, mfs: 0, hoh: 0 }
      p.deductions.salt.floor = { single: 0, mfj: 0, mfs: 0, hoh: 0 }
    }),
    note('ctc', 'A child credit "for everyone," rejecting targeted low-income expansion; no amount given.', 'medium', [
      cite('Newsweek: Haley on child tax credits', 'https://www.newsweek.com/what-nikki-haley-said-about-child-tax-credits-1862097', '2024-01-19'),
    ]),
    note('payroll', 'Raise the retirement age to 70–71 for Americans now in their 20s; limit benefit growth for wealthy retirees; chained-CPI COLA. No wage-base change.', 'high', [
      cite('PolitiFact: Haley Social Security plan', 'https://www.politifact.com/factchecks/2024/jan/18/donald-trump/trump-ad-says-nikki-haleys-plan-would-cut-social-s/', '2024-01-18'),
    ]),
    pos('tariffs', 'Opposed a universal tariff during the 2024 primary and criticized the 2025 tariffs on India; consistently pro-trade.', 'medium', [
      cite('KFF Health News: Haley record (campaign profile)', 'https://kffhealthnews.org/elections/nikki-haley-health-policy-governor-president-agenda/'),
    ], tariffs(TARIFF.repeal)),
    note('medicaid', 'Declined ACA Medicaid expansion as South Carolina governor (SC remains non-expansion).', 'high', [
      cite('KFF Health News: Haley health policy record', 'https://kffhealthnews.org/elections/nikki-haley-health-policy-governor-president-agenda/'),
    ]),
    note('aca', 'Loud ACA critic as governor; deliberately avoided a definitive repeal answer in 2024.', 'medium', [
      cite('KFF Health News: Haley health policy record', 'https://kffhealthnews.org/elections/nikki-haley-health-policy-governor-president-agenda/'),
    ]),
  ],
}

export const REPUBLICANS: Platform[] = [VANCE, RUBIO, DESANTIS, CRUZ, PAUL, HAWLEY, HALEY]
