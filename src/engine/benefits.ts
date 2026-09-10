import type { BenefitContext, BenefitItem, HealthCoverage, Platform, PolicyArea } from './types'
import { usd } from '../lib/format'

/**
 * "What you'd get": concrete, household-specific consequences of a platform beyond the take-home number.
 * Two sources, merged:
 *  1. Derived from the modeled parameters and results (coverage changes, child credit size), so they are
 *     always consistent with the dollar figures and need no separate citation.
 *  2. Declared rules on the platform (or inherited from its party/lane baseline), each cited, for things
 *     the calculator does not price: child care caps, paid leave, free tuition, benefit increases.
 */
export function whatYouGet(ctx: BenefitContext, platform: Platform, all: Platform[]): BenefitItem[] {
  return [...derived(ctx), ...declared(ctx, platform, all)]
}

const COVERAGE_NAME: Record<HealthCoverage | 'singlePayer' | 'coverageGap', string> = {
  employer: 'your employer plan',
  marketplace: 'your marketplace plan',
  medicaid: 'Medicaid',
  medicare: 'Medicare',
  uninsured: 'care without insurance',
  singlePayer: 'Medicare for All',
  coverageGap: 'care without insurance',
}

function childAges(ctx: BenefitContext): number[] {
  const { childrenUnder17, childAges: ages = [] } = ctx.household
  return Array.from({ length: childrenUnder17 }, (_, i) => ages[i] ?? 8)
}

/** Expansion adults the OBBBA work requirement reaches: 19–64 with no child under 14 at home. */
function workRequirementReaches(ctx: BenefitContext): boolean {
  const { age } = ctx.household
  return age >= 19 && age <= 64 && !childAges(ctx).some((a) => a < 14)
}

function derived(ctx: BenefitContext): BenefitItem[] {
  const { household: h, baseline: b, result: r, baseParams: bp, params: p } = ctx
  const out: BenefitItem[] = []
  const item = (id: string, kind: BenefitItem['kind'], text: string, area: PolicyArea) => out.push({ id, kind, text, inherited: false, citations: [], area })
  const healthDelta = b.healthcareCost - r.healthcareCost

  // Coverage path changes.
  if (r.effectiveCoverage === 'singlePayer' && b.effectiveCoverage !== 'singlePayer') {
    item(
      'singlePayer',
      'gain',
      `Everyone in your household is covered by Medicare for All, with no premiums, deductibles or copays. Today you pay about ${usd(b.healthcareCost)} a year for ${COVERAGE_NAME[b.effectiveCoverage]}.`,
      'singlePayer',
    )
  } else if (b.effectiveCoverage === 'coverageGap' && r.effectiveCoverage === 'medicaid') {
    item(
      'coverageGap',
      'gain',
      `You would qualify for Medicaid. Today you fall in ${h.state}'s coverage gap: too much income for Medicaid, too little for marketplace help.`,
      'medicaid',
    )
  } else if (b.effectiveCoverage === 'medicaid' && (r.effectiveCoverage === 'uninsured' || r.effectiveCoverage === 'coverageGap')) {
    item('loseMedicaid', 'loss', `You would lose Medicaid and pay for care yourself, about ${usd(r.healthcareCost)} a year at typical costs.`, 'medicaid')
  } else if (h.healthCoverage === 'medicaid' && r.effectiveCoverage === 'medicaid' && bp.medicaid.workRequirements && !p.medicaid.workRequirements && workRequirementReaches(ctx)) {
    item(
      'workRequirement',
      'gain',
      'No 80-hour-a-month work reporting to keep Medicaid. Current law requires it from 2027, with eligibility checks every six months.',
      'medicaid',
    )
  }

  // Marketplace subsidy size.
  if (h.healthCoverage === 'marketplace' && b.effectiveCoverage === 'marketplace' && r.effectiveCoverage === 'marketplace') {
    const subsidyGone = p.aca.applicablePct.every(([, pct]) => pct >= 1)
    if (subsidyGone && healthDelta < -1) {
      item('acaEnds', 'loss', `Your marketplace premium help ends; you would pay full price, about ${usd(-healthDelta)} more a year.`, 'aca')
    } else if (bp.aca.cliffAt400 && !p.aca.cliffAt400) {
      item(
        'acaEnhanced',
        'gain',
        healthDelta > 1
          ? `Bigger marketplace premium help: about ${usd(healthDelta)} a year less for the same plan, with premiums capped at 8.5% of income and no income cutoff.`
          : 'Marketplace premium help capped at 8.5% of income with no income cutoff, so a raise cannot cost you the whole subsidy.',
        'aca',
      )
    }
  }

  // Child tax credit size.
  if (h.childrenUnder17 > 0) {
    const bonus = p.ctc.youngChildBonus
    const youngest = bonus ? childAges(ctx).filter((a) => a < bonus.underAge).length : 0
    if (p.ctc.amountPerChild === 0 && bp.ctc.amountPerChild > 0) {
      item('ctcEnds', 'loss', `The ${usd(bp.ctc.amountPerChild)}-per-child tax credit ends along with the income tax.`, 'ctc')
    } else if (p.ctc.amountPerChild !== bp.ctc.amountPerChild || (bonus && youngest > 0)) {
      const up = p.ctc.amountPerChild >= bp.ctc.amountPerChild
      const young =
        bonus && youngest > 0
          ? ` (${usd(p.ctc.amountPerChild + bonus.amount)} for ${youngest === 1 ? 'your child' : `each of your ${youngest} children`} under ${bonus.underAge})`
          : ''
      const refundable = p.ctc.fullyRefundable && !bp.ctc.fullyRefundable ? ', paid in full even if you owe little income tax' : ''
      item(
        'ctc',
        up ? 'gain' : 'loss',
        `Your child tax credit goes from ${usd(bp.ctc.amountPerChild)} to ${usd(p.ctc.amountPerChild)} per child${young}${refundable}.`,
        'ctc',
      )
    }
  }

  return out
}

/** Declared rules along the inheritance chain; a descendant's rule with the same id replaces the ancestor's. */
function declared(ctx: BenefitContext, platform: Platform, all: Platform[]): BenefitItem[] {
  const chain: Platform[] = []
  let cur: Platform | undefined = platform
  const seen = new Set<string>()
  while (cur && !seen.has(cur.id)) {
    seen.add(cur.id)
    chain.unshift(cur)
    cur = cur.inheritsFrom ? all.find((p) => p.id === cur!.inheritsFrom) : undefined
  }
  const rules = new Map<string, { rule: NonNullable<Platform['benefits']>[number]; source: Platform }>()
  for (const source of chain) for (const rule of source.benefits ?? []) rules.set(rule.id, { rule, source })
  const out: BenefitItem[] = []
  for (const { rule, source } of rules.values()) {
    const text = rule.applies(ctx)
    if (text) out.push({ id: rule.id, kind: rule.kind, text, source, inherited: source.id !== platform.id, citations: rule.citations })
  }
  return out
}
