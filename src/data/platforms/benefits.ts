import type { BenefitContext, BenefitRule } from '../../engine/types'
import { SRC } from './helpers'
import {
  BOOKER_BONDS,
  BUTTIGIEG_EDU,
  BUTTIGIEG_HEALTH,
  COLLEGE_FOR_ALL,
  CRFB_HARRIS,
  DEM_PLATFORM,
  GALLEGO_HOUSING,
  HAWLEY_RURAL,
  LP,
  OMB_S6,
  SSEA_OACT,
} from './spending'

/**
 * Household-specific benefit rules, keyed by platform id and inherited along `inheritsFrom` (a descendant's rule
 * with the same id replaces the ancestor's). These cover what the calculator does not price: child care caps,
 * paid leave, tuition, benefit increases, and what current law keeps. Coverage changes and the child credit
 * are derived from the model instead (engine/benefits.ts), so they are never stated here.
 *
 * Every rule must return a sentence about THIS household or null. Write the sentence so a reader can tell
 * which of their answers triggered it.
 */

const kids = (c: BenefitContext) => Array.from({ length: c.household.childrenUnder17 }, (_, i) => (c.household.childAges ?? [])[i] ?? 8)
const kidsUnder = (c: BenefitContext, age: number) => kids(c).filter((a) => a < age).length
const kidsBetween = (c: BenefitContext, lo: number, hi: number) => kids(c).filter((a) => a >= lo && a <= hi).length
const hasKids = (c: BenefitContext) => c.household.childrenUnder17 > 0 || c.household.otherDependents > 0
const income = (c: BenefitContext) => c.baseline.grossIncome
const joint = (c: BenefitContext) => c.household.filingStatus === 'mfj'
const onMedicare = (c: BenefitContext) => c.household.healthCoverage === 'medicare' || c.household.age >= 65
const onMedicaid = (c: BenefitContext) => c.household.healthCoverage === 'medicaid'
const onMarketplace = (c: BenefitContext) => c.household.healthCoverage === 'marketplace'
const insured = (c: BenefitContext) => c.household.healthCoverage !== 'uninsured'
const working = (c: BenefitContext) => c.household.age < 65 && c.household.wages + c.household.spouseWages + c.household.selfEmploymentIncome > 0
const nearRetirement = (c: BenefitContext) => c.household.socialSecurityBenefits > 0 || c.household.age >= 62 || c.household.spouseAge >= 62
const plural = (n: number, one: string, many: string) => (n === 1 ? one : `${n} ${many}`)
/** Adults the OBBBA Medicaid work requirement reaches: 19–64 with no child under 14 at home. */
const workRuleReaches = (c: BenefitContext) => c.household.age >= 19 && c.household.age <= 64 && kidsUnder(c, 14) === 0

export const BENEFITS: Record<string, BenefitRule[]> = {
  'party-gop': [
    {
      id: 'medicaidWork',
      kind: 'change',
      confidence: 'high',
      citations: [SRC.obbbaKff],
      applies: (c) =>
        onMedicaid(c) && workRuleReaches(c)
          ? 'Keeps current law: from 2027 you must report 80 hours a month of work, school or volunteering to stay on Medicaid, with eligibility checks every six months.'
          : null,
    },
    {
      id: 'acaExpired',
      kind: 'change',
      confidence: 'high',
      citations: [SRC.obbbaKff],
      applies: (c) =>
        onMarketplace(c) ? 'Keeps current law: the larger pandemic-era premium credits stay expired, and there is no premium help above four times the poverty line.' : null,
    },
  ],

  'party-maga': [
    {
      id: 'ruralHospitals',
      kind: 'change',
      confidence: 'high',
      citations: [HAWLEY_RURAL],
      applies: (c) =>
        onMedicaid(c) ? 'Medicaid’s hospital funding cuts reversed and the rural hospital fund doubled to $100 billion; the 2027 work requirement stays.' : null,
    },
    {
      id: 'drugPrices',
      kind: 'gain',
      confidence: 'medium',
      citations: [SRC.hawleyDrugs],
      applies: (c) => (insured(c) ? 'Prescription drug list prices capped at the average paid in Canada, France, Germany, Italy, Japan and the UK.' : null),
    },
  ],

  'party-dem': [
    {
      id: 'childcare',
      kind: 'gain',
      confidence: 'high',
      citations: [OMB_S6],
      applies: (c) => {
        const n = kidsUnder(c, 5)
        return n > 0 && income(c) <= 200_000 ? `Child care for your ${plural(n, 'child', 'children')} under 5 at about $10 a day (families up to $200,000).` : null
      },
    },
    {
      id: 'preK',
      kind: 'gain',
      confidence: 'high',
      citations: [OMB_S6],
      applies: (c) => {
        const n = kidsBetween(c, 3, 4)
        return n > 0 ? `Free public preschool for your ${n === 1 ? '3- or 4-year-old' : '3- and 4-year-olds'}.` : null
      },
    },
    {
      id: 'paidLeave',
      kind: 'gain',
      confidence: 'high',
      citations: [OMB_S6],
      applies: (c) => (working(c) ? 'Up to 12 weeks of paid family and medical leave when you have a baby, get seriously ill, or care for a relative.' : null),
    },
    {
      id: 'college',
      kind: 'gain',
      confidence: 'high',
      citations: [OMB_S6],
      applies: (c) => (hasKids(c) ? 'Free community college and a doubled Pell Grant when your children reach college.' : null),
    },
    {
      id: 'drugCaps',
      kind: 'gain',
      confidence: 'high',
      citations: [DEM_PLATFORM],
      applies: (c) =>
        insured(c)
          ? `The $35 insulin cap and $2,000-a-year drug cost cap extend to your plan${onMedicare(c) ? ', and Medicare adds dental, vision and hearing coverage' : ''}.`
          : null,
    },
  ],

  'party-progressive': [
    {
      id: 'college',
      kind: 'gain',
      confidence: 'high',
      citations: [COLLEGE_FOR_ALL],
      applies: (c) => {
        const cap = joint(c) ? 300_000 : 150_000
        if (hasKids(c) && income(c) < cap) return `Free tuition at public colleges for your children (College for All covers households under ${usdShort(cap)}), and free community college for everyone.`
        if (hasKids(c)) return 'Free community college for your children; free four-year tuition is limited to households under $150,000 ($300,000 for couples).'
        return c.household.age < 35 ? 'Free community college for anyone in your household.' : null
      },
    },
    {
      id: 'socialSecurity',
      kind: 'gain',
      confidence: 'medium',
      citations: [SSEA_OACT],
      applies: (c) => {
        if (nearRetirement(c)) return 'Your Social Security benefit rises by about $200 a month, roughly $2,400 a year, with the program kept solvent through 2096.'
        if (c.household.age >= 50) return 'Social Security benefits about $2,400 a year higher when you retire, with the program kept solvent through 2096.'
        return null
      },
    },
  ],

  'party-lib': [
    {
      id: 'socialSecurity',
      kind: 'loss',
      confidence: 'high',
      citations: [LP],
      applies: (c) =>
        nearRetirement(c) || c.household.age >= 50
          ? 'Social Security phased out toward a private, voluntary system; the platform gives no transition rules for people at or near retirement.'
          : null,
    },
    {
      id: 'medicare',
      kind: 'change',
      confidence: 'medium',
      citations: [LP],
      applies: (c) => (onMedicare(c) ? 'Medicare is not mentioned in the platform, so what happens to your coverage is not stated.' : null),
    },
  ],

  harris: [
    {
      id: 'childcare',
      kind: 'gain',
      confidence: 'high',
      citations: [CRFB_HARRIS],
      applies: (c) => {
        const n = kidsUnder(c, 5)
        return n > 0 ? `Child care costs for your ${plural(n, 'child', 'children')} under 5 capped at 7% of your income.` : null
      },
    },
    {
      id: 'newborn',
      kind: 'gain',
      confidence: 'high',
      citations: [CRFB_HARRIS],
      applies: (c) => (kidsUnder(c, 1) > 0 ? 'A $6,000 tax credit in your baby’s first year.' : null),
    },
    {
      id: 'homebuyer',
      kind: 'change',
      confidence: 'medium',
      citations: [CRFB_HARRIS],
      applies: () => 'Up to $25,000 in down-payment help if you buy a first home.',
    },
    {
      id: 'medicareHome',
      kind: 'gain',
      confidence: 'high',
      citations: [CRFB_HARRIS],
      applies: (c) => (onMedicare(c) ? 'Medicare would cover long-term care at home, plus hearing and vision.' : null),
    },
  ],

  buttigieg: [
    {
      id: 'childcare',
      kind: 'gain',
      confidence: 'medium',
      citations: [BUTTIGIEG_EDU],
      applies: (c) => {
        const n = kidsUnder(c, 5)
        return n > 0 ? `Child care and pre-K for your ${plural(n, 'child', 'children')} under 5, with costs capped at 7% of your income (2020 plan).` : null
      },
    },
    {
      id: 'college',
      kind: 'gain',
      confidence: 'medium',
      citations: [BUTTIGIEG_EDU],
      applies: (c) =>
        hasKids(c) && income(c) < 100_000
          ? 'Free public college tuition for your children (families under $100,000, 2020 plan).'
          : hasKids(c)
            ? 'Free public college tuition was limited to families under $100,000 in his 2020 plan, so your household would not qualify.'
            : null,
    },
    {
      id: 'publicOption',
      kind: 'change',
      confidence: 'medium',
      citations: [BUTTIGIEG_HEALTH],
      applies: (c) => (!onMedicare(c) ? 'A Medicare-style public plan you could choose to buy into instead of private insurance.' : null),
    },
  ],

  booker: [
    {
      id: 'babyBonds',
      kind: 'gain',
      confidence: 'medium',
      citations: [BOOKER_BONDS],
      applies: (c) =>
        kidsUnder(c, 1) > 0 ? 'A $1,000 “baby bond” savings account for your newborn, growing by up to $2,000 a year depending on income (not reintroduced this Congress).' : null,
    },
  ],

  gallego: [
    {
      id: 'homebuyer',
      kind: 'change',
      confidence: 'medium',
      citations: [GALLEGO_HOUSING],
      applies: () => 'A homebuyer tax credit of up to $15,000 if you buy a home.',
    },
  ],
}

function usdShort(n: number): string {
  return `$${n.toLocaleString('en-US')}`
}
