import type { SpendingPosition } from '../../engine/types'
import { cite } from './helpers'

/**
 * Spending-side commitments by platform id. Merged into PLATFORMS in index.ts. Politicians inherit per category from
 * their lane baseline. Sign convention: positive = more spending / larger deficit, in billions over `window`.
 * Research and every correction behind these figures: docs/research/08-spending.md (Part B).
 */

const CBO_61570 = cite('CBO — Estimated budgetary effects of P.L. 119-21 (OBBBA), by title', 'https://www.cbo.gov/publication/61570', '2025-07-21')
const CBO_61837 = cite('CBO — Medicaid provisions of P.L. 119-21: −$914.6B outlays, +7.5M uninsured', 'https://www.cbo.gov/publication/61837', '2025-10-28')
const CBO_61466 = cite('CBO — Deficit effects of P.L. 119-21 incl. debt service', 'https://www.cbo.gov/publication/61466', '2025-08-04')
const OMB_S6 = cite('OMB — FY2025 Budget, Table S-6 (mandatory and receipt proposals)', 'https://bidenwhitehouse.archives.gov/wp-content/uploads/2024/03/budget_fy2025.pdf', '2024-03-11')
const OMB_S2 = cite('White House — FY2025 Budget cuts the deficit by $3 trillion', 'https://bidenwhitehouse.archives.gov/omb/briefing-room/2024/03/11/fact-sheet-the-presidents-budget-cuts-the-deficit-by-3-trillion-over-10-years/', '2024-03-11')
const CRFB_FY25 = cite('CRFB — Analysis of the President’s FY2025 budget', 'https://www.crfb.org/papers/analysis-presidents-fy2025budget', '2024-03')
const CBO_60041 = cite('CBO — Discretionary spending under the FY2025 President’s budget', 'https://www.cbo.gov/publication/60041', '2024')
const CBO_61734 = cite('CBO — Permanent extension of enhanced ACA premium tax credits: +$349.8B (2026–2035)', 'https://www.cbo.gov/publication/61734', '2025')
const DEM_PLATFORM = cite('2024 Democratic Party Platform', 'https://democrats.org/wp-content/uploads/2025/07/2024-Democratic-Party-Platform.pdf', '2024-08-19')
const CRFB_HARRIS = cite('CRFB — Fiscal impact of the Harris and Trump campaign plans', 'https://www.crfb.org/papers/fiscal-impact-harris-and-trump-campaign-plans', '2024-10-28')
const URBAN_M4A = cite('Urban Institute — Sanders single-payer plan: effect on national and federal spending', 'https://www.urban.org/research/publication/sanders-single-payer-health-care-plan-effect-national-health-expenditures-and-federal-and-private-spending', '2016-05')
const RAND_M4A = cite('RAND — National single-payer: federal spending +221%, national health spending +1.8%', 'https://www.rand.org/pubs/research_reports/RR3106.html', '2019')
const SANDERS_PENTAGON = cite('Sanders — cut the Pentagon by 10% (amendment rejected 23–77, 2020-07-22)', 'https://www.sanders.senate.gov/press-releases/sanders-cut-the-pentagon-by-10-to-hire-more-teachers-build-more-homes-and-create-more-jobs/', '2020-07')
const SANDERS_ICE = cite('Sanders — amendment to cut $75B in ICE funding and redirect to Medicaid', 'https://www.sanders.senate.gov/press-releases/news-sanders-secures-vote-on-his-amendment-to-cut-75-billion-in-ice-funding-and-redirect-those-funds-to-medicaid/', '2026-01')
const COLLEGE_FOR_ALL = cite('College for All Act of 2025, S.1832 — bill text', 'https://www.govinfo.gov/content/pkg/BILLS-119s1832is/html/BILLS-119s1832is.htm', '2025')
const SSEA_OACT = cite('SSA Chief Actuary — Social Security Expansion Act: solvent through 2096', 'https://www.sanders.senate.gov/wp-content/uploads/SandersLetter-2023-0213.pdf', '2023-02-13')
const GND_RES = cite('H.Res.109, Green New Deal resolution (non-binding; no CBO score)', 'https://www.govinfo.gov/app/details/BILLS-116hres109ih', '2019-02')
const SANDERS_GND = cite('Sanders 2020 — Green New Deal, $16.3T (campaign claim)', 'https://web.archive.org/web/20200301/https://berniesanders.com/issues/how-does-bernie-pay-his-major-plans/', '2020')
const SANDERS_HOUSING = cite('Sanders 2020 — Housing for All, $2.5T (campaign claim)', 'https://web.archive.org/web/20200301091520/https://berniesanders.com/issues/housing-all/', '2020')
const LP = cite('Libertarian Party Platform', 'https://www.lp.org/platform/', '2026-05-25')
const HAWLEY_RURAL = cite('Hawley — Protect Medicaid and Rural Hospitals Act (double Rural Health fund to $100B)', 'https://www.hawley.senate.gov/hawley-introduces-legislation-to-prevent-future-medicaid-cuts-invest-in-rural-hospitals/', '2025-07-15')
const HAWLEY_CTC = cite('Hawley — $5,000 child tax credit proposal', 'https://www.hawley.senate.gov/hawley-unveils-new-child-tax-credit-proposal-to-support-working-families/', '2024-12-17')
const HAWLEY_REBATE = cite('Hawley — American Worker Rebate Act ($600+ per person)', 'https://www.hawley.senate.gov/hawley-introduces-legislation-to-send-rebate-checks-to-working-americans/', '2025-07-28')
const PAUL_NO = cite('Rand Paul — Why I said no to the One Big Beautiful Bill', 'https://www.paul.senate.gov/why-i-said-no-to-the-one-big-beautiful-bill/', '2025-07')
const BUTTIGIEG_HEALTH = cite('CRFB — Estimating Democratic candidates’ health plans (2020)', 'https://www.crfb.org/papers/primary-care-estimating-democratic-candidates-health-plans', '2020')
const BUTTIGIEG_CLIMATE = cite('CRFB — Pete Buttigieg’s climate change plan', 'https://www.crfb.org/blogs/pete-buttigiegs-climate-change-plan', '2019')
const BUTTIGIEG_EDU = cite('Buttigieg 2020 — education plan (archived)', 'https://web.archive.org/web/20200201193954/https://peteforamerica.com/policies/education/', '2020')
const BOOKER_BONDS = cite('Booker — Baby Bonds (American Opportunity Accounts Act), design only; no cost estimate exists', 'https://www.booker.senate.gov/news/press/booker-pressley-reintroduce-bicameral-baby-bonds-legislation-to-tackle-wealth-inequality', '2023')
const BOOKER_JOBS = cite('Booker — jobs guarantee pilot, S.3864 (“such sums as may be necessary”)', 'https://www.govinfo.gov/content/pkg/BILLS-119s3864is/html/BILLS-119s3864is.htm', '2026-02-12')
const GALLEGO_HOUSING = cite('Gallego — “The Path Home” housing framework (no total, no score)', 'https://www.gallego.senate.gov/wp-content/uploads/2026/01/Housing-Plan.pdf', '2026-01-14')
const OSSOFF_ACA = cite('Ossoff — floor speech urging extension of ACA tax credits', 'https://www.ossoff.senate.gov/press-releases/watch-in-floor-speech-sen-ossoff-urges-senate-to-extend-affordable-care-act-tax-credits/', '2025-12')
const WHITMER_BUILD = cite('Whitmer — “Build, America, Build” address (national shipbuilding/aviation strategy)', 'https://www.michigan.gov/whitmer/news/press-releases/2025/04/09/whitmers-build-america-build-address-as-prepared-for-delivery', '2025-04-09')
const AOC_NDAA = cite('Ocasio-Cortez — 11 NDAA amendments (oversight, no cuts)', 'https://ocasio-cortez.house.gov/media/press-releases/ocasio-cortez-submits-11-amendments-national-defense-authorization-act', '2026')
const VANCE_WALL = cite('Wikipedia — Political positions of JD Vance (finish the wall)', 'https://en.wikipedia.org/wiki/Political_positions_of_JD_Vance')

export const SPENDING: Record<string, SpendingPosition[]> = {
  'party-gop': [
    { category: 'defense', direction: 'more', summary: 'OBBBA adds shipbuilding ($29B), Golden Dome missile defense ($25B), munitions ($25B), Coast Guard ($25B), Indo-Pacific ($12B).', cost10yr: 149.5, scorer: 'CBO', window: '2025–2034', confidence: 'high', citations: [CBO_61570] },
    { category: 'health', direction: 'less', summary: 'Medicaid work requirements, six-month redeterminations and provider-tax limits cut Medicaid $914.6B (7.5M more uninsured); ACA credit restrictions −$213B; $50B rural health fund; the −$1,058B figure is CBO’s published health-subtitle subtotal after interactions.', cost10yr: -1058.4, scorer: 'CBO', window: '2025–2034', confidence: 'high', citations: [CBO_61837, CBO_61570] },
    { category: 'education', direction: 'less', summary: 'Graduate loan caps, end of Grad PLUS and a repayment overhaul cut federal student-aid spending.', cost10yr: -284.0, scorer: 'CBO', window: '2025–2034', confidence: 'high', citations: [CBO_61570] },
    { category: 'safetyNet', direction: 'less', summary: 'SNAP work requirements to age 64, state cost-sharing and benefit-formula limits (−$186.7B on SNAP; the agriculture title nets −$121B after higher farm supports).', cost10yr: -186.7, scorer: 'CBO', window: '2025–2034', confidence: 'high', citations: [CBO_61570] },
    { category: 'infrastructure', direction: 'less', summary: 'Repeals or phases out most clean-energy tax credits and trims energy, transportation and environment programs.', cost10yr: -68.7, scorer: 'CBO', window: '2025–2034', confidence: 'medium', citations: [CBO_61570] },
    { category: 'immigration', direction: 'more', summary: 'Border wall (~$46.5B), detention capacity (~$45B), ICE hiring (~$30B), state grants; new immigration fees offset part of it.', cost10yr: 175.0, scorer: 'CBO', window: '2025–2034', confidence: 'high', citations: [CBO_61570] },
    { category: 'deficit', direction: 'more', summary: 'OBBBA adds $3.4T to primary deficits, $4.1T with interest; $5.0T if its temporary provisions are made permanent.', cost10yr: 4100, scorer: 'CBO', window: '2025–2034', confidence: 'high', citations: [CBO_61466] },
  ],
  'party-dem': [
    { category: 'defense', direction: 'less', summary: 'FY2025 request of $895B growing about 1% a year, below inflation; CBO put it $59B below 2024 in real terms. The 2024 platform names no defense topline.', cost10yr: -59, scorer: 'CBO', window: 'vs 2024, real', confidence: 'medium', citations: [CBO_60041, DEM_PLATFORM] },
    { category: 'health', direction: 'more', summary: 'Make enhanced ACA credits permanent (CBO: +$349.8B), close the Medicaid coverage gap (+$200B), home care (+$150B); partly offset by expanded Medicare drug negotiation (−$200B).', cost10yr: 659, scorer: 'OMB', window: '2025–2034', confidence: 'high', citations: [OMB_S6, CBO_61734] },
    { category: 'education', direction: 'more', summary: 'Child care at $10 a day for families up to $200,000 and universal preschool (+$600B), plus doubled Pell, free community college and HBCU support (+$290B).', cost10yr: 890, scorer: 'OMB', window: '2025–2034', confidence: 'high', citations: [OMB_S6] },
    { category: 'safetyNet', direction: 'more', summary: 'National paid family leave (+$325B), restored child credit with permanent full refundability (+$310B), childless EITC (+$163B), housing (+$183B).', cost10yr: 980, scorer: 'OMB', window: '2025–2034', confidence: 'high', citations: [OMB_S6] },
    { category: 'infrastructure', direction: 'more', summary: 'Defend the Inflation Reduction Act’s clean-energy credits; American Climate Corps (+$8B). No large new climate program proposed.', cost10yr: 8, scorer: 'OMB', window: '2025–2034', confidence: 'medium', citations: [OMB_S6, DEM_PLATFORM] },
    { category: 'immigration', direction: 'more', summary: 'More enforcement: $62B for DHS (+2%), 34,000 detention beds, 375 new immigration judge teams; endorsed the bipartisan 2024 border bill (+$20B).', scorer: 'OMB', window: 'FY2025', confidence: 'high', citations: [OMB_S6, CRFB_FY25] },
    { category: 'deficit', direction: 'less', summary: 'Budget claims −$3.2T over ten years from higher taxes on corporations and incomes above $400k. CRFB cautions that extending expiring tax cuts without offsets could erase most of it; CBO never scored the whole budget.', cost10yr: -3227, scorer: 'OMB', window: '2025–2034', confidence: 'medium', citations: [OMB_S2, CRFB_FY25] },
  ],
  'party-progressive': [
    { category: 'defense', direction: 'less', summary: 'Cut the Pentagon budget 10% and redirect to high-poverty communities (Sanders amendment, rejected 23–77 in 2020).', cost10yr: -740, scorer: 'sponsor', window: '2021–2030', confidence: 'medium', citations: [SANDERS_PENTAGON] },
    { category: 'health', direction: 'more', summary: 'Medicare for All moves premiums and out-of-pocket costs onto the federal budget: roughly $32–34T in new federal spending over ten years (Urban). Total national health spending changes far less (RAND: +1.8%; Yale/Lancet: −13%). Sanders’ financing menu covers about half.', cost10yr: 32000, scorer: 'thinkTank', scorerName: 'Urban Institute', window: '10 years', confidence: 'high', citations: [URBAN_M4A, RAND_M4A] },
    { category: 'education', direction: 'more', summary: 'College for All: free community college for everyone and free public four-year tuition under $150k/$300k; universal child care with copays capped at 7%. Neither bill has a CBO score.', openEnded: true, scorer: 'billText', confidence: 'high', citations: [COLLEGE_FOR_ALL] },
    { category: 'safetyNet', direction: 'more', summary: 'Social Security Expansion Act raises benefits ~$2,400/yr and keeps the program solvent through 2096 by taxing earnings above $250k (SSA actuaries); Housing for All ($2.5T, 2020 campaign figure).', cost10yr: 2500, scorer: 'sponsor', window: '10 years', confidence: 'medium', citations: [SSEA_OACT, SANDERS_HOUSING] },
    { category: 'infrastructure', direction: 'more', summary: 'Green New Deal. The House resolution is non-binding and unscoreable; Sanders’ 2020 campaign version was $16.3T. The “$93T” figure often cited is a summed think-tank range that mostly counts health care and a jobs guarantee, and PolitiFact rated it False.', cost10yr: 16300, scorer: 'sponsor', window: '10 years', confidence: 'medium', citations: [GND_RES, SANDERS_GND] },
    { category: 'immigration', direction: 'less', summary: 'Cut $75B in ICE funding and redirect it to Medicaid (Sanders amendment, Jan 2026).', cost10yr: -75, scorer: 'sponsor', confidence: 'medium', citations: [SANDERS_ICE] },
    { category: 'deficit', direction: 'mixed', summary: 'No aggregate score exists. Urban found Sanders’ taxes would raise $15.3T against a $32T federal health cost; his wealth tax adds $4.35T (Saez & Zucman).', scorer: 'thinkTank', scorerName: 'Urban Institute', confidence: 'low', citations: [URBAN_M4A] },
  ],
  'party-lib': [
    { category: 'defense', direction: 'less', summary: '“Sufficient military to defend the United States”; no number.', confidence: 'high', citations: [LP] },
    { category: 'health', direction: 'less', summary: 'Free-market health care; phase out Social Security toward a private system. Medicare and Medicaid are not named.', confidence: 'medium', citations: [LP] },
    { category: 'education', direction: 'less', summary: 'Repeal federal programs “not required under the Constitution.”', confidence: 'high', citations: [LP] },
    { category: 'safetyNet', direction: 'less', summary: '“The proper and most effective source of help for the poor is the voluntary efforts of private groups and individuals.”', confidence: 'high', citations: [LP] },
    { category: 'infrastructure', direction: 'less', summary: 'No federal climate or energy spending.', confidence: 'high', citations: [LP] },
    { category: 'immigration', direction: 'less', summary: 'Open-immigration principles; no enforcement figure.', confidence: 'high', citations: [LP] },
    { category: 'deficit', direction: 'less', summary: 'Balanced Budget Amendment “balanced exclusively by cutting expenditures”; repeal the income tax. No dollar figures anywhere in the platform.', confidence: 'high', citations: [LP] },
  ],
  'party-maga': [
    { category: 'health', direction: 'more', summary: 'Reverse OBBBA’s Medicaid provider-tax cuts and double the Rural Health Transformation Fund to $100B (Hawley). No CBO score.', scorer: 'sponsor', confidence: 'high', citations: [HAWLEY_RURAL] },
    { category: 'safetyNet', direction: 'more', summary: '$5,000 child credit refundable against payroll tax; tariff-funded rebate checks of at least $600 per person (Hawley). No cost estimates exist.', scorer: 'sponsor', confidence: 'high', citations: [HAWLEY_CTC, HAWLEY_REBATE] },
  ],
  vance: [
    { category: 'immigration', direction: 'more', summary: 'Finish the border wall (about $3B), on top of OBBBA’s enforcement funding.', cost10yr: 178, scorer: 'CBO', window: '2025–2034', confidence: 'medium', citations: [CBO_61570, VANCE_WALL] },
  ],
  paul: [
    { category: 'defense', direction: 'less', summary: 'Long-standing support for defense cuts (a 2011 plan cut 6.5%); no current figure.', confidence: 'low', citations: [PAUL_NO] },
    { category: 'deficit', direction: 'less', summary: 'Six Penny Plan: cut spending 6% a year to balance the budget in five years (failed 39–56). Voted no on OBBBA, saying it adds $270B to the debt in 2026 and over $500B in five years.', scorer: 'sponsor', confidence: 'high', citations: [PAUL_NO] },
  ],
  aoc: [
    { category: 'defense', direction: 'none', summary: 'Her 2026 NDAA amendments are oversight measures, not cuts; no current dollar position of her own (the progressive lane’s 10% cut is Sanders’).', confidence: 'medium', citations: [AOC_NDAA] },
  ],
  harris: [
    { category: 'health', direction: 'more', summary: '“Medicare at Home” long-term care plus hearing and vision benefits (CRFB central estimate $500B; range $400–600B).', cost10yr: 500, scorer: 'thinkTank', scorerName: 'CRFB', window: 'through FY2035', confidence: 'high', citations: [CRFB_HARRIS] },
    { category: 'education', direction: 'more', summary: 'Child care capped at 7% of family income (CRFB central $700B; range $400–950B).', cost10yr: 700, scorer: 'thinkTank', scorerName: 'CRFB', window: 'through FY2035', confidence: 'high', citations: [CRFB_HARRIS] },
    { category: 'safetyNet', direction: 'more', summary: '$6,000 newborn credit and restored $3,000/$3,600 child credit (~$1.2T), paid family leave (~$350B), 3M housing units and a $25,000 first-time buyer credit (~$350B).', cost10yr: 1900, scorer: 'thinkTank', scorerName: 'CRFB', window: 'through FY2035', confidence: 'high', citations: [CRFB_HARRIS] },
    { category: 'immigration', direction: 'more', summary: '“Improve border security” (CRFB central $100B; range $0–200B).', cost10yr: 100, scorer: 'thinkTank', scorerName: 'CRFB', window: 'through FY2035', confidence: 'medium', citations: [CRFB_HARRIS] },
    { category: 'deficit', direction: 'more', summary: 'CRFB central estimate +$3.95T through FY2035 (range $0.3–8.3T); the same paper put the 2024 Trump platform at +$7.75T.', cost10yr: 3950, scorer: 'thinkTank', scorerName: 'CRFB', window: 'through FY2035', confidence: 'high', citations: [CRFB_HARRIS] },
  ],
  buttigieg: [
    { category: 'health', direction: 'mixed', summary: '“Medicare for All Who Want It” public option (~$1.5T component); CRFB scored his full 2020 health plan as a net $450B saving once drug and provider savings are counted.', cost10yr: -450, scorer: 'thinkTank', scorerName: 'CRFB', window: '2020 plan, 10 years', confidence: 'medium', citations: [BUTTIGIEG_HEALTH] },
    { category: 'education', direction: 'more', summary: 'Universal child care and pre-K capped at 7% of income (~$700B, campaign figure); free public tuition for families under $100k (no total published).', cost10yr: 700, scorer: 'sponsor', window: '2020 plan, 10 years', confidence: 'medium', citations: [BUTTIGIEG_EDU] },
    { category: 'infrastructure', direction: 'more', summary: '2020 climate plan (~$1.5T, corroborated by CRFB).', cost10yr: 1500, scorer: 'thinkTank', scorerName: 'CRFB', window: '2020 plan, 10 years', confidence: 'medium', citations: [BUTTIGIEG_CLIMATE] },
  ],
  booker: [
    { category: 'safetyNet', direction: 'more', summary: 'Baby Bonds ($1,000 at birth plus up to $2,000/yr; no cost estimate exists; not reintroduced this Congress) and a jobs-guarantee pilot authorized as “such sums as may be necessary.”', openEnded: true, scorer: 'billText', confidence: 'medium', citations: [BOOKER_BONDS, BOOKER_JOBS] },
  ],
  gallego: [
    { category: 'safetyNet', direction: 'more', summary: '“The Path Home” housing framework: 8.5M units over a decade and a homebuyer credit capped at $15,000. No total cost, pay-fors or score.', scorer: 'sponsor', confidence: 'medium', citations: [GALLEGO_HOUSING] },
  ],
  ossoff: [
    { category: 'health', direction: 'more', summary: 'Extend the enhanced ACA premium tax credits (the only individual item here with an official score: CBO +$349.8B for a permanent extension).', cost10yr: 349.8, scorer: 'CBO', window: '2026–2035', confidence: 'high', citations: [OSSOFF_ACA, CBO_61734] },
  ],
  whitmer: [
    { category: 'defense', direction: 'more', summary: 'Calls for a national shipbuilding and aviation strategy; no dollar figure attached.', scorer: 'sponsor', confidence: 'medium', citations: [WHITMER_BUILD] },
  ],
}
