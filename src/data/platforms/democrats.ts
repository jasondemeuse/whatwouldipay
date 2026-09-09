import type { Platform } from '../../engine/types'
import {
  SRC, TARIFF, addSurtax, cite, closeCoverageGap, ctcAmericanFamilyAct, ctcArpa, eitcChildlessExpansion, hold, medicareForAll, note,
  pos, restoreEnhancedAca, reverseObbbaMedicaid, scrapTheCap, setTopRate, tariffs,
} from './helpers'

const reverseHealthCuts = (p: import('../../engine/types').PolicyParams) => {
  reverseObbbaMedicaid(p)
  closeCoverageGap(p)
}

export const AOC: Platform = {
  id: 'aoc',
  name: 'Alexandria Ocasio-Cortez',
  shortName: 'Ocasio-Cortez',
  kind: 'politician',
  party: 'D',
  role: 'U.S. Representative, New York · 2028 Democratic market leader',
  inheritsFrom: 'party-progressive',
  description:
    'Original cosponsor of Medicare for All; "scrap the cap" on Social Security; a 70% marginal rate above $10 million (2019, never legislated); opposes SALT cap repeal as a giveaway to the rich; calls the OBBBA tips/overtime deduction "a scam"; tariffs are paid by consumers.',
  positions: [
    pos('incomeRates', '70% marginal rate on income above $10 million (60 Minutes, Jan 2019). Never introduced as a bill; no 2025–26 restatement.', 'low', [
      cite('PolitiFact — AOC 70% rate explainer', 'https://www.politifact.com/article/2019/jan/08/explaining-alexandria-ocasio-cortezs-70-percent-ta/', '2019-01-08'),
    ], (p) => addSurtax(p, 0.33, 10000000)),
    note('salt', 'Opposes full repeal of the cap ("a gift to the billionaires"); voted against the 2019 repeal; open to raising it for middle-income families.', 'high', [
      cite('The Hill — Ocasio-Cortez on SALT', 'https://thehill.com/policy/finance/548542-ocasio-cortez-says-she-disagrees-with-holding-up-infrastructure-over-salt/', '2021-04-13'),
    ]),
    pos('payroll', 'Original cosponsor of the Social Security Expansion Act and Social Security 2100 Act: payroll tax on earnings above $250,000.', 'high', [
      cite('Larson/Ocasio-Cortez — Social Security 2100 Act', 'https://larson.house.gov/media-center/press-releases/larson-ocasio-cortez-call-vote-social-security-2100-act'),
    ], (p) => scrapTheCap(p, 250000)),
    note('tipsOvertime', 'Called the OBBBA tips/overtime deduction "a scam" and "a deal with the devil" paired with SNAP/Medicaid/ACA cuts. No repeal bill.', 'high', [
      cite('The Hill — Ocasio-Cortez on no tax on tips', 'https://thehill.com/homenews/house/5381734-alexandria-ocasio-cortez-no-tax-on-tips/', '2025-07-02'),
    ]),
    pos('tariffs', 'Repeal: "WE pay the tariffs"; introduced the NO GOUGE Act against tariff-driven price gouging.', 'high', [
      cite('Ocasio-Cortez — NO GOUGE Act', 'https://ocasio-cortez.house.gov/media/press-releases/ocasio-cortez-delauro-craig-introduce-no-gouge-act-stop-corporate-abuse'),
    ], tariffs(TARIFF.repeal)),
    pos('singlePayer', 'Original cosponsor of H.R.3069, Medicare for All Act (119th Congress).', 'high', [SRC.m4aHouse], medicareForAll),
    note('capitalGains', 'Supports taxing unrealized gains of the ultra-wealthy; federal Billionaire Minimum Income Tax cosponsorship not confirmed.', 'medium', []),
    note('medicare', 'Bill limiting compensation for Medicare Advantage agents (June 2026); cites the IRA $35 insulin cap as an accomplishment.', 'medium', []),
  ],
}

export const OSSOFF: Platform = {
  id: 'ossoff',
  name: 'Jon Ossoff',
  shortName: 'Ossoff',
  kind: 'politician',
  party: 'D',
  role: 'U.S. Senator, Georgia',
  inheritsFrom: 'party-dem',
  description:
    'The clearest moderate contrast in the Democratic field, with the thinnest tax record. Supports restoring the ACA credits and a public option, explicitly opposes Medicare for All, is not a cosponsor of the American Family Act or the Social Security Expansion Act, and opposes broad tariffs while backing targeted ones on Chinese solar.',
  positions: [
    hold('ctc', 'Not a cosponsor of the American Family Act (Apr 2025); no affirmative proposal found. Current law kept here rather than the party default.', 'low', [SRC.afa]),
    hold('payroll', 'No cosponsorship of the Social Security Expansion Act found; no position on the wage base.', 'low', []),
    pos('tariffs', 'Opposes broad consumer-cost tariffs (a "$29 billion tax on consumers" for the 2025 holidays) but urged higher tariffs on Chinese solar (2024).', 'high', [
      cite('Ossoff — Georgia Democrats on tariffs', 'https://www.ossoff.senate.gov/press-releases/georgia-democrats-press-gop-over-trump-tariffs/', '2025-12-15'),
    ], tariffs(TARIFF.targeted)),
    pos('aca', 'Restore the enhanced credits; published "After Expiration of ACA Tax Credits, Georgians Are Delaying Necessary Care" (2026-07-06).', 'high', [
      cite('Ossoff — ACA tax credit expiration report', 'https://www.ossoff.senate.gov/', '2026-07-06'),
    ], restoreEnhancedAca),
    pos('medicaid', 'Tied OBBBA cuts to a Georgia hospital ending obstetrics; supports the caucus reversal bill.', 'high', [SRC.gallegoAca], reverseHealthCuts),
    note('singlePayer', 'Explicitly opposes Medicare for All; supports the ACA plus "a strong Public Option" while keeping private insurance.', 'high', [
      cite('Wikipedia — Jon Ossoff', 'https://en.wikipedia.org/wiki/Jon_Ossoff'),
    ]),
  ],
}

export const NEWSOM: Platform = {
  id: 'newsom',
  name: 'Gavin Newsom',
  shortName: 'Newsom',
  kind: 'politician',
  party: 'D',
  role: 'Governor of California (term ends Jan 2027)',
  inheritsFrom: 'party-dem',
  description:
    'Suing to end the tariffs; the most detailed critic of OBBBA’s Medicaid cuts (3.4M Californians at risk) while restricting state-funded Medi-Cal for undocumented adults at home; criticizes the OBBBA rate structure but proposes no alternative top rate. Once campaigned on single payer; has not advanced it as governor.',
  positions: [
    note('incomeRates', 'Criticizes OBBBA as skewed to the top 0.1% ($309,000 average cut) but proposes no alternative rate.', 'medium', [
      cite('Gov. Newsom — how Trump’s tax cuts will hurt you', 'https://www.gov.ca.gov/2025/07/02/heres-how-president-trumps-tax-cuts-for-the-ultra-rich-will-hurt-you/', '2025-07-02'),
    ]),
    pos('tariffs', 'Repeal: filed suit to end the tariffs (Apr 2025, renewed Mar 2026); "tariffs are taxes on American families."', 'high', [
      cite('Gov. Newsom — lawsuit to end tariffs', 'https://www.gov.ca.gov/2025/04/16/governor-newsom-files-lawsuit-to-end-president-trumps-tariffs/', '2025-04-16'),
    ], tariffs(TARIFF.repeal)),
    pos('medicaid', 'Reverse OBBBA: warns of 3.4M Californians losing coverage and $28.4B in lost federal funding; calls the law "cruel, costly."', 'high', [
      cite('Gov. Newsom — OBBBA health coverage cuts', 'https://www.gov.ca.gov/2025/06/27/governor-newsom-slams-trump-over-bill-that-would-cut-millions-in-health-coverage-food-assistance-for-california/', '2025-06-27'),
      cite('KFF — California work requirements and budget', 'https://www.kff.org/medicaid/a-closer-look-at-californias-plans-to-implement-work-requirements-while-facing-major-budget-shortfalls-amid-cuts-in-federal-medicaid-funding/', '2026-04-06'),
    ], reverseHealthCuts),
    note('tipsOvertime', 'Criticizes the OBBBA version: "many workers will see little to no benefit," temporary, paired with healthcare cuts.', 'medium', [
      cite('Gov. Newsom — how Trump’s tax cuts will hurt you', 'https://www.gov.ca.gov/2025/07/02/heres-how-president-trumps-tax-cuts-for-the-ultra-rich-will-hurt-you/', '2025-07-02'),
    ]),
    note('singlePayer', 'Backed single payer in 2018 ("tired of politicians saying it’s too soon"); has not advanced CalCare as governor.', 'medium', []),
  ],
  notes: ['California’s 2025–26 budget paused Medi-Cal enrollment for undocumented adults and added cost-sharing amid a structural deficit.'],
}

export const HARRIS: Platform = {
  id: 'harris',
  name: 'Kamala Harris',
  shortName: 'Harris',
  kind: 'politician',
  party: 'D',
  role: 'Former Vice President · 2024 nominee',
  inheritsFrom: 'party-dem',
  description:
    'Her 2024 platform is the most complete off-the-shelf Democratic bundle: 39.6% above $400k, a $6,000 newborn credit with $3,600/$3,000 tiers, permanent childless EITC expansion, 28% capital gains above $1M, a 25% billionaire minimum tax, tips exemption, and permanent enhanced ACA credits. All figures are from the 2024 campaign, not a 2026 restatement.',
  positions: [
    pos('incomeRates', 'Top rate 39.6% above $400,000 single / $450,000 joint (2024 plan).', 'high', [
      cite('Tax Foundation — Harris 2024 tax plan', 'https://taxfoundation.org/research/all/federal/kamala-harris-tax-plan-2024/', '2024-11-12'),
    ], (p) => setTopRate(p, 0.396, { single: 400000, mfj: 450000, mfs: 225000, hoh: 425000 })),
    pos('ctc', '$6,000 for newborns, $3,600 ages 2–5, $3,000 ages 6+, fully refundable (modeled at $3,000; child ages not collected).', 'high', [
      cite('Tax Foundation — Harris 2024 tax plan', 'https://taxfoundation.org/research/all/federal/kamala-harris-tax-plan-2024/', '2024-11-12'),
    ], ctcArpa),
    pos('eitc', 'Permanently extend the ARPA childless-worker EITC expansion.', 'high', [
      cite('Tax Foundation — Harris 2024 tax plan', 'https://taxfoundation.org/research/all/federal/kamala-harris-tax-plan-2024/', '2024-11-12'),
    ], eitcChildlessExpansion),
    pos('capitalGains', '28% on capital gains above $1M taxable income; 25% billionaire minimum tax on unrealized gains; tax unrealized gains at death above $5M/$10M.', 'high', [
      cite('Tax Foundation — Harris 2024 tax plan', 'https://taxfoundation.org/research/all/federal/kamala-harris-tax-plan-2024/', '2024-11-12'),
    ], (p) => {
      for (const fs of ['single', 'mfj', 'mfs', 'hoh'] as const) p.capitalGains.brackets[fs].push({ rate: 0.28, over: 1000000 })
      p.capitalGains.niitRate = 0.05
    }),
    note('tipsOvertime', 'Proposed exempting tipped income (Las Vegas, Aug 2024) — consistent with keeping the OBBBA tips deduction.', 'high', [
      cite('Tax Foundation — Harris 2024 tax plan', 'https://taxfoundation.org/research/all/federal/kamala-harris-tax-plan-2024/', '2024-11-12'),
    ]),
    pos('aca', 'Make the enhanced premium tax credits permanent (Biden-Harris budget).', 'high', [SRC.fy25budget], restoreEnhancedAca),
    pos('medicaid', 'Close the coverage gap in non-expansion states (Biden-Harris budget); opposes OBBBA cuts.', 'high', [SRC.fy25budget], reverseHealthCuts),
  ],
  notes: ['Corporate 21% → 28%; corporate AMT 15% → 21%.', 'Needs a dedicated 2026 research pass; positions are 2024-vintage.'],
}

export const SHAPIRO: Platform = {
  id: 'shapiro',
  name: 'Josh Shapiro',
  shortName: 'Shapiro',
  kind: 'politician',
  party: 'D',
  role: 'Governor of Pennsylvania',
  inheritsFrom: 'party-dem',
  description:
    'Essentially no federal tax or healthcare record. Pennsylvania keeps its 3.07% flat tax; his most distinctive position is accelerating the state corporate tax cut toward 4.99%. Everything federal falls back to the Democratic baseline.',
  positions: [
    note('incomeRates', 'No federal position; no proposal to change Pennsylvania’s 3.07% flat income tax.', 'low', [
      cite('Wikipedia — Josh Shapiro', 'https://en.wikipedia.org/wiki/Josh_Shapiro'),
    ]),
    note('other', 'Supports accelerating Pennsylvania’s corporate net income tax phase-down toward 4.99% (cuts to his right).', 'high', [
      cite('Wikipedia — Josh Shapiro', 'https://en.wikipedia.org/wiki/Josh_Shapiro'),
    ]),
  ],
  notes: ['Pennsylvania state CTC/EITC parameters could not be verified this session.'],
}

export const BUTTIGIEG: Platform = {
  id: 'buttigieg',
  name: 'Pete Buttigieg',
  shortName: 'Buttigieg',
  kind: 'politician',
  party: 'D',
  role: 'Former Transportation Secretary',
  inheritsFrom: 'party-dem',
  description:
    '"Medicare for All Who Want It": a voluntary public option alongside private insurance, plus a Medicare buy-in at 50–64. 2020 plan: 39.6% top rate, capital gains as ordinary income for top earners, corporate 35%. "More inclined than not" to run (Aug 2026).',
  positions: [
    pos('incomeRates', 'Restore the 39.6% top rate (2020 plan, via TCJA repeal for high earners).', 'medium', [
      cite('ATR — Buttigieg tax proposals list', 'https://atr.org/list-buttigieg-tax-hike-proposals/', '2020-02'),
    ], (p) => setTopRate(p, 0.396, { single: 400000, mfj: 450000, mfs: 225000, hoh: 425000 })),
    pos('capitalGains', 'Tax capital gains as ordinary income for top earners; floated mark-to-market for the top 1% (2020).', 'high', [
      cite('ATR — Buttigieg tax proposals list', 'https://atr.org/list-buttigieg-tax-hike-proposals/', '2020-02'),
    ], (p) => {
      p.capitalGains.ordinaryAbove = 1000000
    }),
    note('singlePayer', '"Medicare for All Who Want It" public option; Medicare buy-in for ages 50–64; endorsed single payer in 2018 before shifting.', 'high', [
      cite('Wikipedia — Political positions of Pete Buttigieg', 'https://en.wikipedia.org/wiki/Political_positions_of_Pete_Buttigieg'),
    ]),
    note('ctc', '2020 plan expanded child care support; specific CTC parameters not re-verified — party default applied.', 'low', [
      cite('CNBC — 2020 candidates on child care', 'https://www.cnbc.com/2020/02/25/how-top-2020-presidential-candidates-want-to-help-ease-child-care-costs.html', '2020-02-25'),
    ]),
  ],
  notes: ['Corporate 21% → 35% to finance his health plan (2020).'],
}

export const WHITMER: Platform = {
  id: 'whitmer',
  name: 'Gretchen Whitmer',
  shortName: 'Whitmer',
  kind: 'politician',
  party: 'D',
  role: 'Governor of Michigan',
  inheritsFrom: 'party-dem',
  description:
    'State record: raised Michigan’s EITC from 6% to 30% of the federal credit and repealed the state retirement tax (2023). No federal tax positions; her tariff stance could not be verified this session, so the party default applies.',
  positions: [
    note('eitc', 'Raised Michigan’s EITC from 6% to 30% of the federal credit in a $1B 2023 package (state-level; federal position not stated).', 'high', [
      cite('Wikipedia — Gretchen Whitmer', 'https://en.wikipedia.org/wiki/Gretchen_Whitmer'),
    ]),
    note('socialSecurityBenefits', 'Repealed Michigan’s "retirement tax" on pension income (2023).', 'high', [
      cite('Wikipedia — Gretchen Whitmer', 'https://en.wikipedia.org/wiki/Gretchen_Whitmer'),
    ]),
    note('singlePayer', 'Opposed Michigan-only single payer as "unrealistic" (2018) while calling federal Medicare for All "a good opportunity."', 'medium', []),
    note('medicaid', 'Expanded coverage to 1M+ via the Healthy Michigan Plan; no retrievable 2025–26 statement on OBBBA work requirements.', 'low', []),
  ],
  notes: ['Tariff stance unverified this session — do not attribute a quote.'],
}

export const PRITZKER: Platform = {
  id: 'pritzker',
  name: 'JB Pritzker',
  shortName: 'Pritzker',
  kind: 'politician',
  party: 'D',
  role: 'Governor of Illinois',
  inheritsFrom: 'party-dem',
  description:
    'Championed a graduated income tax (4.75%–7.99%) that Illinois voters rejected in 2020; signed the state’s first child tax credit and a $35 insulin cap; demanded $1,700-per-household tariff refunds. Declined to propose a state wealth or capital-gains surtax in 2026.',
  positions: [
    note('incomeRates', 'Failed 2020 "Fair Tax" amendment: 4.75% to 7.99% graduated brackets (state-level; no federal position).', 'high', [
      cite('Ballotpedia — Illinois graduated income tax amendment', 'https://ballotpedia.org/Illinois_Allow_for_Graduated_Income_Tax_Amendment_(2020)', '2020-11-03'),
    ]),
    note('ctc', 'Signed Illinois’ first state CTC (P.A. 103-0592): 20% of the state EITC in 2024, 40% in 2025, for children under 12.', 'high', [
      cite('Illinois Department of Revenue — Child Tax Credit', 'https://tax.illinois.gov/individuals/credits/child-tax-credit.html'),
    ]),
    pos('tariffs', 'Repeal: executive order on tariff impacts ("a tax increase on consumers"); Aug 2026 letter demanding $1,700-per-household refunds.', 'high', [
      cite('Gov. Pritzker — tariff executive order', 'https://gov.illinois.gov/', '2025-07-14'),
    ], tariffs(TARIFF.repeal)),
    pos('medicaid', 'Opposes OBBBA cuts; issued $400 payments to 100k+ residents dropped from SNAP; also cut a state-funded immigrant-adult health program.', 'high', [], reverseHealthCuts),
    note('capitalGains', 'Did not include a state wealth tax or capital-gains surtax in the Feb 2026 budget despite progressive pressure.', 'medium', []),
    note('medicare', 'Signed HB 2189 (2023) capping insulin at $35 per 30-day supply.', 'high', []),
  ],
}

export const BESHEAR: Platform = {
  id: 'beshear',
  name: 'Andy Beshear',
  shortName: 'Beshear',
  kind: 'politician',
  party: 'D',
  role: 'Governor of Kentucky',
  inheritsFrom: 'party-dem',
  description:
    'The most fiscally moderate Democrat researched: signed Kentucky’s flat-tax cuts from 5% to 3.5%, while holding the strongest anti-work-requirement Medicaid record in the field (rescinded the Bevin waiver in 2019, vetoed a 2025 state bill, joined the 25-state suit). Called on Congress to extend the ACA credits.',
  positions: [
    note('incomeRates', 'Signed Kentucky income-tax cuts 5% → 4.5% → 4.0% → 3.5% (2026) after vetoing the first; no federal position.', 'high', [
      cite('Kentucky Legislature — HB 1 (2025)', 'https://apps.legislature.ky.gov/record/25RS/hb1.html', '2025-02-06'),
    ]),
    pos('tariffs', 'Repeal: tariffs "could cripple" bourbon; Kentucky joined 20+ states suing (Mar 2026); letter urging rescission (Sep 2026).', 'high', [
      cite('Kentucky Lantern — Beshear on tariffs', 'https://kentuckylantern.com/', '2026-09-04'),
    ], tariffs(TARIFF.repeal)),
    pos('aca', 'Called on Congress to extend the enhanced subsidies (Oct 2025), citing ~100,000 Kentuckians facing steep premium hikes.', 'medium', [
      cite('WKYT — Beshear urges ACA subsidy extension', 'https://www.wkyt.com', '2025-10-28'),
    ], restoreEnhancedAca),
    pos('medicaid', 'Rescinded Kentucky’s work-requirement waiver (2019); vetoed a 2025 state work-requirement bill; joined the 25-state suit against the federal rule; reversed a 4% provider cut (2026).', 'high', [
      cite('Kentucky Lantern — Beshear Medicaid veto', 'https://kentuckylantern.com/', '2025-03-26'),
    ], reverseHealthCuts),
    note('medicare', 'Signed HB 95 (2021) capping insulin at $35 per 30-day supply for state-regulated plans.', 'high', []),
  ],
}

export const MOORE: Platform = {
  id: 'moore',
  name: 'Wes Moore',
  shortName: 'Moore',
  kind: 'politician',
  party: 'D',
  role: 'Governor of Maryland',
  inheritsFrom: 'party-dem',
  description:
    'The only figure here who has signed a tax increase on high earners: new 6.25% and 6.5% Maryland brackets above $500k/$1M plus a 2% capital-gains surtax above $350k AGI (2025). Demanded tariff reimbursement (~$1,744 per Maryland household).',
  positions: [
    note('incomeRates', 'Signed HB 352 (2025): new Maryland brackets of 6.25% above $500k and 6.5% above $1M (state-level; no federal position).', 'high', [
      cite('Maryland General Assembly — HB 352 fiscal note', 'https://mgaleg.maryland.gov', '2025-05-20'),
    ]),
    note('capitalGains', 'Maryland 2% surtax on net capital gains for filers with federal AGI over $350,000 (2025).', 'high', [
      cite('Maryland General Assembly — HB 352 fiscal note', 'https://mgaleg.maryland.gov', '2025-05-20'),
    ]),
    note('ctc', 'Smoothed Maryland’s $500 refundable child credit phase-out ($15k–$24k AGI).', 'high', [
      cite('Maryland General Assembly — HB 352 fiscal note', 'https://mgaleg.maryland.gov', '2025-05-20'),
    ]),
    pos('tariffs', 'Repeal: demanded Trump reimburse Maryland ~$4B in tariff costs (~$1,744 per household); Maryland joined the 25-state Section 301 suit.', 'high', [
      cite('Maryland Comptroller/Governor tariff statement', 'https://governor.maryland.gov/', '2026-02-27'),
    ], tariffs(TARIFF.repeal)),
  ],
  notes: ['Maryland corporate rate unchanged at 8.25%; retains both an estate tax and an inheritance tax.'],
}

export const BOOKER: Platform = {
  id: 'booker',
  name: 'Cory Booker',
  shortName: 'Booker',
  kind: 'politician',
  party: 'D',
  role: 'U.S. Senator, New Jersey',
  inheritsFrom: 'party-dem',
  description:
    'Lead sponsor (with Bennet) of the American Family Act child credit; cosponsor of Medicare for All and the Social Security Expansion Act; fought the enhanced ACA credit expiration. Penn Wharton scored his Keep Your Pay Act (exempt the first $75k joint / $37.5k single from income tax).',
  positions: [
    pos('ctc', 'American Family Act lead sponsor: $6,360 newborns / $4,320 ages 1–5 / $3,600 ages 6–17, monthly, fully refundable (modeled at $3,600).', 'high', [SRC.afa], ctcAmericanFamilyAct),
    pos('incomeRates', 'Keep Your Pay Act: exempt the first $75,000 (joint) / $37,500 (single) from federal income tax, offset by a higher top rate (Penn Wharton: −$5T net over 10 years).', 'high', [
      cite('Penn Wharton Budget Model — Keep Your Pay Act', 'https://budgetmodel.wharton.upenn.edu/p/2026-03-11-the-keep-your-pay-act-budgetary-and-distributional-effects/', '2026-03-11'),
    ], (p) => {
      // Zero bracket on the first $37,500 / $75,000 of taxable income; the existing schedule resumes above the
      // exemption line. Offset: top rate 39.6% above $400k/$450k (Booker pairs the cut with a top-rate increase).
      for (const fs of ['single', 'mfj', 'mfs', 'hoh'] as const) {
        const exempt = fs === 'mfj' ? 75000 : 37500
        const old = p.incomeTax.brackets[fs]
        const rateAtExempt = [...old].reverse().find((b) => b.over <= exempt)?.rate ?? old[0].rate
        p.incomeTax.brackets[fs] = [{ rate: 0, over: 0 }, { rate: rateAtExempt, over: exempt }, ...old.filter((b) => b.over > exempt)]
      }
      setTopRate(p, 0.396, { single: 400000, mfj: 450000, mfs: 225000, hoh: 425000 })
    }),
    pos('payroll', 'Cosponsor of the Social Security Expansion Act (2022, 2023): payroll tax above $250,000 including investment income.', 'medium', [SRC.ssea], (p) => scrapTheCap(p, 250000)),
    pos('tariffs', 'Oppose: pressed the FTC on tariff-exemption price gouging (Dec 2025); joined tariff price-gouging letters.', 'medium', [
      cite('Booker — tariff exemptions and grocery costs', 'https://www.booker.senate.gov/news/press/-booker-gallego-whitehouse-push-administration-to-ensure-tariff-exemptions-actually-result-in-lowering-grocery-costs', '2025-12-18'),
    ], tariffs(TARIFF.targeted)),
    pos('aca', '"They are not renewing these subsidies which will cause tens of millions of people to see… massive premium increases" (Dec 2025); supports permanent extension.', 'high', [SRC.gallegoAca], restoreEnhancedAca),
    pos('medicaid', 'Supports reversing OBBBA cuts via the caucus bill.', 'high', [SRC.gallegoAca], reverseHealthCuts),
    pos('singlePayer', 'Current cosponsor of S.1506, Medicare for All Act (119th Congress).', 'high', [SRC.m4aBill], medicareForAll),
  ],
  notes: ['No stated SALT position despite New Jersey’s high-SALT profile.'],
}

export const GALLEGO: Platform = {
  id: 'gallego',
  name: 'Ruben Gallego',
  shortName: 'Gallego',
  kind: 'politician',
  party: 'D',
  role: 'U.S. Senator, Arizona',
  inheritsFrom: 'party-dem',
  description:
    'Lead sponsor of the Protecting Healthcare And Lowering Costs Act (permanent ACA credits, reverse OBBBA health cuts), cosponsor of the American Family Act, and one of the Senate’s most active anti-tariff voices. Walked back his earlier Medicare for All support.',
  positions: [
    pos('ctc', 'Cosponsor of the American Family Act: $6,360 / $4,320 / $3,600, monthly, fully refundable (modeled at $3,600).', 'high', [SRC.afa], ctcAmericanFamilyAct),
    pos('tariffs', 'Repeal: "a tax on Arizona families"; pressed for tariff refunds to families (Feb 2026); campaigned against the trade war in Canada (Sep 2026).', 'high', [
      cite('Gallego — slams tariffs', 'https://www.gallego.senate.gov/news/press-releases/gallego-slams-trumps-tariffs-stands-up-for-arizona-families-and-businesses/', '2025-02-20'),
    ], tariffs(TARIFF.repeal)),
    pos('aca', 'Lead sponsor: permanently extend the enhanced premium tax credits (entire Senate Democratic caucus).', 'high', [SRC.gallegoAca], restoreEnhancedAca),
    pos('medicaid', 'Same bill reverses OBBBA Medicaid cuts and work requirements (~750,000 Arizonans at risk).', 'high', [SRC.gallegoAca], reverseHealthCuts),
    note('singlePayer', 'Cosponsored Medicare for All in the House; distanced himself in the 2024 Senate race; not a cosponsor of S.1506.', 'medium', [
      cite('Wikipedia — Ruben Gallego', 'https://en.wikipedia.org/wiki/Ruben_Gallego'),
    ]),
    hold('payroll', 'No cosponsorship of the Social Security Expansion Act found.', 'low', []),
  ],
}

export const SANDERS: Platform = {
  id: 'sanders',
  name: 'Bernie Sanders',
  shortName: 'Sanders',
  kind: 'politician',
  party: 'I',
  role: 'U.S. Senator, Vermont (I) · progressive pole',
  inheritsFrom: 'party-progressive',
  description:
    'The canonical progressive platform: Medicare for All (S.1506), the Social Security Expansion Act, a 5% wealth tax on billionaires, a 35% corporate rate, a 45–65% estate tax, the American Family Act child credit, and a 52% top rate above $10M (2020). Supports targeted tariffs, opposes blanket ones.',
  positions: [
    pos('incomeRates', '52% top rate above $10 million (2020 campaign plan; not re-verified against a current document).', 'medium', [
      cite('Tax Foundation — Sanders wealth tax and plans', 'https://taxfoundation.org/blog/bernie-sanders-wealth-tax/', '2019-09-25'),
    ], (p) => addSurtax(p, 0.15, 10000000)),
    pos('ctc', 'Cosponsor of the American Family Act; wants ARPA’s $300/month restored ("cut child poverty by more than 40%").', 'high', [SRC.afa], ctcAmericanFamilyAct),
    note('salt', 'Opposes relieving the SALT cap as a giveaway to the wealthy.', 'medium', [
      cite('Sanders — SALT cap repeal "beyond unacceptable"', 'https://www.sanders.senate.gov/in-the-news/sanders-proposed-five-year-salt-cap-repeal-beyond-unacceptable/'),
    ]),
    pos('payroll', 'Lead sponsor, Social Security Expansion Act (S.770/H.R.1700): 12.4% payroll tax on earnings above $250,000 and on investment income; +$2,400/yr benefits; CPI-E COLA.', 'high', [SRC.ssea], (p) => scrapTheCap(p, 250000)),
    note('capitalGains', 'Make Billionaires Pay Their Fair Share Act (2026-03-02): 5% annual tax on net worth above $1B (~$4.4T/10yr).', 'high', [
      cite('Sanders/Khanna — billionaire wealth tax', 'https://www.sanders.senate.gov/press-releases/news-sanders-and-khanna-introduce-legislation-to-tax-billionaire-wealth-and-invest-in-working-families/', '2026-03-02'),
    ]),
    pos('tariffs', 'Supports targeted tariffs; opposes Trump’s across-the-board tariffs as "a blanket and arbitrary sales tax."', 'high', [
      cite('Sanders statement on the trade war', 'https://www.sanders.senate.gov/press-releases/news-sanders-statement-on-trumps-escalating-trade-war-with-the-world/', '2025-04-04'),
    ], tariffs(TARIFF.targeted)),
    pos('aca', 'Supports permanent extension as a near-term protection while Medicare for All remains the goal.', 'high', [SRC.gallegoAca], restoreEnhancedAca),
    pos('singlePayer', 'Lead sponsor of S.1506: no premiums, deductibles, copays or networks; covers long-term care, dental, vision; replaces private and employer insurance.', 'high', [SRC.m4aBill, SRC.sandersM4aFinance], medicareForAll),
  ],
  notes: [
    'Corporate 21% → 35% (Corporate Tax Dodging Prevention Act).',
    'For the 99.5% Act: $3.5M estate exemption, 45%–65% rates.',
  ],
}

export const DEMOCRATS: Platform[] = [AOC, OSSOFF, NEWSOM, HARRIS, SHAPIRO, BUTTIGIEG, WHITMER, PRITZKER, BESHEAR, MOORE, BOOKER, GALLEGO, SANDERS]
