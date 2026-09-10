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

/** Plain-language digest of a platform's spending side for compact displays. */
export function spendingSummary(platform: Platform, all: Platform[]): { more: string[]; less: string[]; deficit?: SpendingPosition } {
  const rows = resolvedSpending(platform, all)
  const label = (id: string) => SPENDING_CATEGORIES.find((c) => c.id === id)?.label.toLowerCase().replace(' & ', ' and ') ?? id
  return {
    more: rows.filter((s) => s.category !== 'deficit' && s.direction === 'more').map((s) => label(s.category)),
    less: rows.filter((s) => s.category !== 'deficit' && s.direction === 'less').map((s) => label(s.category)),
    deficit: rows.find((s) => s.category === 'deficit'),
  }
}

/** "adds $4.1T to the deficit over 2025–2034, per CBO", or "its deficit effect is unscored, per Urban Institute". */
export function deficitPhrase(sp: SpendingPosition | undefined): string {
  if (!sp || sp.direction === 'none') return 'has no stated deficit effect'
  const who = scorerLabel(sp)
  const per = who ? `, per ${who}` : ''
  if (sp.cost10yr === undefined) {
    if (sp.direction === 'mixed') return `its deficit effect is unscored${per}`
    return `${sp.direction === 'more' ? 'adds to' : 'reduces'} the deficit by an unscored amount${per}`
  }
  const amt = fmtBillions(Math.abs(sp.cost10yr)).replace(/^\+/, '')
  // Windows come in three shapes: "2025–2034", "through FY2035", and notes like "2020 plan, 10 years".
  const w = sp.window
  const window = !w ? ' over ten years' : /^\d{4}\s*[–-]\s*\d{4}$/.test(w) || /^\d+ years$/.test(w) ? ` over ${w}` : /^(through|vs|by)\b/i.test(w) ? ` ${w}` : ` (${w})`
  return sp.cost10yr >= 0 ? `adds ${amt} to the deficit${window}${per}` : `cuts the deficit by ${amt}${window}${per}`
}
