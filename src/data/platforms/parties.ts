import type { Platform } from '../../engine/types'
import {
  SRC, TARIFF, cite, closeCoverageGap, ctcAmericanFamilyAct, ctcArpa, ctcHawley, eitcChildlessExpansion,
  medicareForAll, note, pos, removeAcaSubsidies, restoreEnhancedAca, reverseObbbaMedicaid, scrapTheCap, setTopRate, tariffs,
} from './helpers'

/** Republican Party: 2024 platform + OBBBA as enacted. This IS current law, made permanent. */
export const GOP: Platform = {
  id: 'party-gop',
  name: 'Republican Party',
  shortName: 'GOP baseline',
  kind: 'party',
  party: 'R',
  role: 'Party baseline — 2024 platform + the 2025 tax law as enacted',
  description:
    'Current federal law made permanent: the OBBBA/TCJA rate structure, $2,200 child credit, $40,400 SALT cap, tips/overtime/senior deductions (through 2028), the existing tariff regime, Medicaid work requirements from 2027, and no extension of the enhanced ACA subsidies.',
  positions: [
    note('incomeRates', 'Keep the permanent 10–37% OBBBA/TCJA rate structure.', 'high', [SRC.gopPlatform, SRC.obbbaKff]),
    note('standardDeduction', 'Keep the OBBBA standard deduction ($16,100 / $32,200 / $24,150 in 2026).', 'high', [SRC.gopPlatform]),
    note('ctc', 'Keep the $2,200 indexed child tax credit with $1,700 refundable.', 'high', [SRC.obbbaKff]),
    note('eitc', 'No change to the EITC (OBBBA left it untouched).', 'medium', [SRC.obbbaKff]),
    note('salt', 'Keep the $40,000 cap (indexed 1%/yr), reverting to $10,000 in 2030.', 'high', [SRC.obbbaKff]),
    note('payroll', 'No change to payroll taxes or the Social Security wage base; "will not cut one penny from Medicare or Social Security."', 'medium', [SRC.gopPlatform]),
    note('tipsOvertime', 'Keep the tips and overtime deductions (they expire after 2028; no stated plan for extension).', 'high', [SRC.gopPlatform]),
    note('capitalGains', 'No change to capital gains rates; no wealth tax.', 'medium', [SRC.gopPlatform]),
    pos('tariffs', 'Keep the current tariff regime (Section 232/301 tariffs after the Supreme Court struck the IEEPA tariffs); "support baseline tariffs on foreign-made goods."', 'high', [SRC.gopPlatform, SRC.tfTariffs], tariffs(TARIFF.keep)),
    note('socialSecurityBenefits', 'Markets the $6,000 senior deduction as "no tax on Social Security"; benefit taxation itself was not repealed.', 'high', [
      cite('White House — "No tax on Social Security"', 'https://www.whitehouse.gov/releases/2025/07/no-tax-on-social-security-is-a-reality-in-the-one-big-beautiful-bill/', '2025-07-04'),
    ]),
    note('aca', 'Let the enhanced premium tax credits expire (they did, 2025-12-31); the 400% FPL cliff is back.', 'high', [
      cite('KFF — ACA marketplace enrollment changes in 2026', 'https://www.kff.org/affordable-care-act/how-has-aca-marketplace-enrollment-changed-across-states-in-2026/', '2026-07-28'),
    ]),
    note('medicaid', 'Keep OBBBA: 80-hour/month work requirements for expansion adults from 2027, six-month redeterminations, provider-tax phase-down.', 'high', [SRC.obbbaKff]),
    note('medicare', 'No eligibility-age change; IRA drug negotiation kept; eligibility narrowed to citizens and lawful permanent residents.', 'high', [SRC.obbbaKff]),
    note('singlePayer', 'Oppose Medicare for All and a public option.', 'high', [SRC.gopPlatform]),
  ],
  notes: ['Corporate rate 21%, unchanged.', 'Estate tax exemption $15M per person from 2026, permanent.'],
}

/** Democratic Party mainstream: 2024 platform + Biden-Harris FY2025 Greenbook. */
export const DEM: Platform = {
  id: 'party-dem',
  name: 'Democratic Party (mainstream)',
  shortName: 'Dem baseline',
  kind: 'party',
  party: 'D',
  role: 'Party baseline — 2024 platform + FY2025 Treasury Greenbook',
  description:
    'Raise the top rate to 39.6% above $400k/$450k with no increases under $400k; restore the ARPA child credit ($3,000, fully refundable, monthly) and childless EITC; tax gains as ordinary income above $1M; make the enhanced ACA subsidies permanent; close the Medicaid coverage gap and reverse the work requirements; keep targeted China tariffs but oppose broad ones.',
  positions: [
    pos('incomeRates', 'Top rate 37% → 39.6% above $400,000 single / $450,000 joint / $425,000 HoH / $225,000 MFS. No tax increase under $400,000.', 'high', [SRC.greenbook], (p) =>
      setTopRate(p, 0.396, { single: 400000, mfj: 450000, mfs: 225000, hoh: 425000 }),
    ),
    note('standardDeduction', 'No change proposed.', 'low', [SRC.greenbook]),
    pos('ctc', 'Restore the ARPA credit: $3,600 under 6 / $3,000 ages 6–17, fully refundable, paid monthly (modeled as $3,000 fully refundable; child ages not collected).', 'high', [SRC.greenbook], ctcArpa),
    pos('eitc', 'Permanently restore the ARPA childless-worker expansion: max ~$1,749, 15.3% phase rates, eligible from age 19 with no 65 cap.', 'high', [SRC.greenbook], eitcChildlessExpansion),
    note('salt', 'No position in the platform or Greenbook — a genuine intra-party ambiguity.', 'low', [SRC.demPlatform]),
    note('payroll', 'Qualitative only: "ask the wealthiest Americans to pay their fair share" of payroll tax; no numeric wage-base proposal.', 'low', [SRC.demPlatform]),
    note('tipsOvertime', 'Not addressed in the 2024 platform or Greenbook (both predate the proposals).', 'low', [SRC.demPlatform]),
    pos('capitalGains', 'Tax gains as ordinary income above $1M; end stepped-up basis; 25% billionaire minimum tax above $100M net worth; NIIT 3.8% → 5% above $400k.', 'high', [SRC.greenbook], (p) => {
      p.capitalGains.ordinaryAbove = 1000000
      p.capitalGains.niitRate = 0.05
    }),
    pos('tariffs', 'Keep targeted China tariffs (steel, EVs, batteries, solar); explicitly oppose a universal 10% tariff as inflationary.', 'high', [SRC.demPlatform], tariffs(TARIFF.targeted)),
    note('socialSecurityBenefits', 'No change to benefit taxation proposed.', 'low', [SRC.demPlatform]),
    pos('aca', 'Make the enhanced premium tax credits permanent (8.5% cap, no 400% FPL cliff); ~$800/yr average savings per enrollee.', 'high', [SRC.fy25budget, SRC.gallegoAca], restoreEnhancedAca),
    pos('medicaid', 'Medicaid-like coverage for ~2.8M adults in non-expansion states; reverse the OBBBA work requirements and cuts.', 'high', [SRC.fy25budget, SRC.gallegoAca], (p) => {
      closeCoverageGap(p)
      reverseObbbaMedicaid(p)
    }),
    note('medicare', 'Expand IRA drug negotiation to 50 drugs/yr; add dental, vision, hearing; extend the $35 insulin and $2,000 drug caps to all insurance.', 'high', [SRC.demPlatform]),
    note('singlePayer', 'Neither Medicare for All nor a public option appears in the 2024 platform.', 'high', [SRC.demPlatform]),
  ],
  notes: ['Corporate rate 21% → 28%; buyback excise 1% → 4%.', 'No estate tax rate or exemption change proposed.'],
}

/** Progressive / Democratic Socialist: Congressional Progressive Caucus, Sanders, AOC, DSA. */
export const PROGRESSIVE: Platform = {
  id: 'party-progressive',
  name: 'Progressive / Democratic Socialist',
  shortName: 'Progressive',
  kind: 'party',
  party: 'D',
  role: 'Lane baseline — Sanders, AOC, Congressional Progressive Caucus, DSA',
  description:
    'Medicare for All replacing premiums and cost-sharing with an income-based contribution; the American Family Act child credit ($3,600+, fully refundable, monthly); payroll tax on earnings above $250,000; a 5% annual wealth tax on billionaires; 35% corporate rate; opposition to SALT cap relief; targeted rather than broad tariffs.',
  positions: [
    note('incomeRates', 'Much higher top rates on very high incomes (AOC 70% above $10M, 2019; Sanders 52% above $10M, 2020) — historical proposals, not active bills.', 'low', [
      cite('PolitiFact — AOC 70% marginal rate explainer', 'https://www.politifact.com/article/2019/jan/08/explaining-alexandria-ocasio-cortezs-70-percent-ta/', '2019-01-08'),
    ]),
    pos('ctc', 'American Family Act: $6,360 newborns / $4,320 ages 1–5 / $3,600 ages 6–17, fully refundable, monthly (modeled at $3,600).', 'medium', [SRC.afa], ctcAmericanFamilyAct),
    note('salt', 'Oppose SALT cap relief as a giveaway to the wealthy (AOC, Sanders).', 'medium', [
      cite('The Hill — Ocasio-Cortez on SALT', 'https://thehill.com/policy/finance/548542-ocasio-cortez-says-she-disagrees-with-holding-up-infrastructure-over-salt/', '2021-04-13'),
    ]),
    pos('payroll', 'Social Security Expansion Act (S.770/H.R.1700): apply the 12.4% payroll tax to earnings above $250,000 and to investment income; +$2,400/yr benefits; CPI-E.', 'high', [SRC.ssea], (p) => scrapTheCap(p, 250000)),
    pos('capitalGains', '5% annual tax on net worth above $1B (Sanders/Khanna, 2026-03-02); investment income above $250k subject to the 12.4% Social Security tax.', 'high', [
      cite('Sanders/Khanna — Make Billionaires Pay Their Fair Share Act', 'https://www.sanders.senate.gov/press-releases/news-sanders-and-khanna-introduce-legislation-to-tax-billionaire-wealth-and-invest-in-working-families/', '2026-03-02'),
    ]),
    pos('tariffs', 'Support targeted tariffs as anti-outsourcing leverage; oppose across-the-board tariffs as "a blanket and arbitrary sales tax."', 'high', [
      cite('Sanders statement on the trade war', 'https://www.sanders.senate.gov/press-releases/news-sanders-statement-on-trumps-escalating-trade-war-with-the-world/', '2025-04-04'),
    ], tariffs(TARIFF.targeted)),
    pos('aca', 'Extend the enhanced credits as a bridge while Medicare for All remains the goal.', 'medium', [SRC.gallegoAca], restoreEnhancedAca),
    pos('medicaid', 'Oppose all OBBBA Medicaid cuts and work requirements; close the coverage gap.', 'high', [SRC.gallegoAca], (p) => {
      reverseObbbaMedicaid(p)
      closeCoverageGap(p)
    }),
    pos('singlePayer', 'Medicare for All (S.1506/H.R.3069): no premiums, deductibles or copays; replaces employer and private insurance; covers everyone from birth. Financed per Sanders’ options paper: 4% income premium above ~$29k plus a 7.5% employer payroll premium.', 'high', [SRC.m4aBill, SRC.sandersM4aFinance], medicareForAll),
    note('medicare', 'Direct drug price negotiation; Medicare Advantage structurally eliminated under single payer.', 'medium', [SRC.m4aBill]),
  ],
  notes: [
    'Corporate rate 21% → 35% (Corporate Tax Dodging Prevention Act).',
    'Estate tax: $3.5M exemption, 45%–65% rates (For the 99.5% Act).',
    'Single-payer employer payroll premium (7.5%) is shown only if you assume it passes through to wages; the calculator assumes it does not.',
  ],
}

/** Libertarian Party platform — no numeric parameters anywhere; modeled as the mechanical removal of federal taxes. */
export const LIBERTARIAN: Platform = {
  id: 'party-lib',
  name: 'Libertarian Party',
  shortName: 'Libertarian',
  kind: 'party',
  party: 'L',
  role: 'Party baseline — 2026 platform (Jo Jorgensen exploratory committee, May 2026)',
  description:
    'Repeal the federal income tax and abolish the IRS; phase out Social Security toward a private voluntary system; free-market healthcare with no named position on the ACA, Medicaid or Medicare; remove all trade barriers. The platform contains no numbers, so this bundle shows only the mechanical removal of federal income and payroll taxes and of ACA subsidies and Medicaid expansion.',
  positions: [
    pos('incomeRates', '"We call for the repeal of the income tax, the abolishment of the Internal Revenue Service." No replacement schedule.', 'high', [SRC.lpPlatform], (p) => {
      for (const fs of ['single', 'mfj', 'mfs', 'hoh'] as const) {
        p.incomeTax.brackets[fs] = [{ rate: 0, over: 0 }]
        p.capitalGains.brackets[fs] = [{ rate: 0, over: 0 }]
      }
      p.capitalGains.niitRate = 0
      p.incomeTax.surtaxes = []
      p.caveats.push(
        'The Libertarian platform gives no numbers and no funding plan. This shows only the mechanical removal of federal income and payroll taxes, ACA subsidies and Medicaid expansion; it does not model what replaces Social Security, Medicare, or the services those taxes fund.',
      )
    }),
    pos('ctc', 'No credit survives income-tax repeal (inferred).', 'medium', [SRC.lpPlatform], (p) => {
      p.ctc.amountPerChild = 0
      p.ctc.otherDependentCredit = 0
    }),
    pos('eitc', '"The proper and most effective source of help for the poor is the voluntary efforts of private groups and individuals" (inferred repeal).', 'medium', [SRC.lpPlatform], (p) => {
      p.eitc.scale = 0
    }),
    pos('payroll', '"Phase out the current government-sponsored Social Security system and transition to a private voluntary system."', 'high', [SRC.lpPlatform], (p) => {
      p.payroll.ssRateEmployee = 0
      p.payroll.medicareRateEmployee = 0
      p.payroll.additionalMedicareRate = 0
    }),
    pos('tariffs', '"We support the removal of governmental impediments to free trade."', 'high', [SRC.lpPlatform], tariffs(TARIFF.none)),
    pos('aca', 'Platform does not name the ACA; "we favor a free market health care system" (subsidy repeal inferred).', 'medium', [SRC.lpPlatform], removeAcaSubsidies),
    pos('medicaid', 'Not named; phase-out inferred from opposition to programs "not required under the U.S. Constitution."', 'low', [SRC.lpPlatform], (p) => {
      p.medicaid.repealExpansion = true
    }),
    note('medicare', 'Medicare is not named in the platform; no eligibility-age or phase-out plank.', 'low', [SRC.lpPlatform]),
    note('singlePayer', 'Incompatible with the free-market plank (oppose).', 'medium', [SRC.lpPlatform]),
  ],
}

/** MAGA / populist right: GOP baseline plus the Hawley/Vance departures. */
export const MAGA: Platform = {
  id: 'party-maga',
  name: 'Populist Right (MAGA)',
  shortName: 'Populist right',
  kind: 'party',
  party: 'R',
  role: 'Lane baseline — Hawley/Vance departures from the GOP baseline',
  inheritsFrom: 'party-gop',
  description:
    'The GOP baseline plus a $5,000 child credit refundable against payroll taxes, tariff-funded rebate checks, extension of the enhanced ACA credits (Hawley’s vote), reversal of the Medicaid provider-tax cuts, and international reference pricing for drugs.',
  positions: [
    pos('ctc', '$5,000 per child, refundable against payroll tax with no earnings floor, paid monthly (Hawley; Vance floated $5,000 in 2024). Family First Act (H.R.353) is the adjacent vehicle. None enacted.', 'high', [SRC.hawleyCtc], ctcHawley),
    pos('tariffs', 'Keep and expand tariffs, but rebate revenue: American Worker Rebate Act sends at least $600 per adult and per child (~$2,400 for a family of four).', 'high', [SRC.hawleyRebate, SRC.tfTariffs], (p) => {
      p.tariffs.multiplier = TARIFF.keep
      p.tariffs.rebatePerPerson = 600
    }),
    pos('aca', 'Extend the enhanced premium tax credits (Hawley was one of four Republicans voting yes on 2025-12-11); alternative $25,000 medical-expense deduction.', 'medium', [SRC.hawleyAcaVote], restoreEnhancedAca),
    note('medicaid', '"Don’t Cut Medicaid": reverse provider-tax cuts, double the Rural Health Transformation Fund to $100B — but the 2027 work requirement stays.', 'high', [SRC.hawleyMedicaid]),
    note('payroll', 'Keep Our Promises Act: exempt Social Security and Medicare from debt-ceiling negotiations; no wage-base change.', 'medium', [
      cite('Hawley — Keep Our Promises Act', 'https://www.hawley.senate.gov/', '2023-02-01'),
    ]),
    note('medicare', 'International reference pricing: cap U.S. drug list prices at the average of Canada, France, Germany, Italy, Japan and the UK (Hawley/Welch).', 'high', [SRC.hawleyDrugs]),
  ],
  notes: ['No general buyback-tax increase; only a defense-contractor buyback limit (Hawley/Warren, 2026).'],
}

export const PARTIES: Platform[] = [GOP, DEM, PROGRESSIVE, LIBERTARIAN, MAGA]

