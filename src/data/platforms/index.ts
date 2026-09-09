import type { Platform } from '../../engine/types'
import { PARTIES } from './parties'
import { REPUBLICANS } from './republicans'
import { DEMOCRATS } from './democrats'
import { SPENDING } from './spending'

/**
 * Every platform the app can compare. Politicians inherit unstated positions from `inheritsFrom`
 * (a party or lane baseline); the UI marks those as "Party default".
 *
 * Positions were curated 2026-09-08 from campaign/official sites, bill text, and think-tank scoring.
 * See docs/research/04-positions.md and 08-spending.md for the full reports, confidence notes, and the
 * verify-before-shipping lists.
 */
export const PLATFORMS: Platform[] = [...PARTIES, ...REPUBLICANS, ...DEMOCRATS].map((p) => ({
  ...p,
  spending: SPENDING[p.id] ?? p.spending,
}))
