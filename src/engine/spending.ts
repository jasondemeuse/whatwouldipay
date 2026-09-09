import type { Platform, Scorer, SpendingCategory, SpendingPosition } from './types'

/** Short authority label per scorer tier. */
export const SCORER_LABEL: Record<Scorer, string> = {
  CBO: 'CBO',
  JCT: 'JCT',
  'SSA-OACT': 'Social Security actuaries',
  'CMS-OACT': 'Medicare actuaries',
  OMB: 'OMB (self-scored)',
  thinkTank: 'think tank',
  sponsor: "sponsor's own claim",
  billText: 'bill text',
}

export function scorerLabel(sp: Pick<SpendingPosition, 'scorer' | 'scorerName'>): string | undefined {
  if (!sp.scorer) return undefined
  return sp.scorer === 'thinkTank' && sp.scorerName ? sp.scorerName : SCORER_LABEL[sp.scorer]
}

export const SPENDING_CATEGORIES: Array<{ id: SpendingCategory; label: string; hint: string }> = [
  { id: 'defense', label: 'Defense & military', hint: 'Pentagon budget, procurement, personnel' },
  { id: 'health', label: 'Health programs', hint: 'Medicare, Medicaid, ACA subsidies, single payer' },
  { id: 'education', label: 'Education & child care', hint: 'Pre-K, child care, K-12, college, student loans' },
  { id: 'safetyNet', label: 'Safety net', hint: 'SNAP, housing, cash aid, refundable credits' },
  { id: 'infrastructure', label: 'Infrastructure, energy & climate', hint: 'Roads, transit, grid, clean energy, disaster aid' },
  { id: 'immigration', label: 'Immigration & border', hint: 'ICE, CBP, wall, detention, processing' },
  { id: 'deficit', label: 'Deficit impact', hint: 'Net ten-year effect of the whole platform on borrowing' },
]

/** Resolve a platform's spending positions with inheritance (nearest ancestor wins per category). */
export function resolvedSpending(platform: Platform, all: Platform[]): Array<SpendingPosition & { inherited: boolean; source: Platform }> {
  const out = new Map<SpendingCategory, SpendingPosition & { inherited: boolean; source: Platform }>()
  const chain: Platform[] = []
  let cur: Platform | undefined = platform
  const seen = new Set<string>()
  while (cur && !seen.has(cur.id)) {
    chain.push(cur)
    seen.add(cur.id)
    cur = cur.inheritsFrom ? all.find((p) => p.id === cur!.inheritsFrom) : undefined
  }
  for (const node of chain) {
    for (const sp of node.spending ?? []) {
      if (!out.has(sp.category)) out.set(sp.category, { ...sp, inherited: node.id !== platform.id, source: node })
    }
  }
  return SPENDING_CATEGORIES.map((c) => out.get(c.id)).filter((x): x is NonNullable<typeof x> => !!x)
}

/** Format a ten-year budget figure in billions as a short string. */
export function fmtBillions(b: number): string {
  const sign = b < 0 ? '−' : '+'
  const abs = Math.abs(b)
  return abs >= 1000 ? `${sign}$${(abs / 1000).toFixed(abs >= 10000 ? 0 : 1)}T` : `${sign}$${Math.round(abs)}B`
}
