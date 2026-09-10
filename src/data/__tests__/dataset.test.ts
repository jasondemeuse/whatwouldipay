import { describe, expect, it } from 'vitest'
import { existsSync } from 'node:fs'
import { PLATFORMS } from '../platforms'
import { ASSUMPTION_OWNED_PATHS } from '../../engine/assumptions'
import { applyPlatform, cloneParams, effectivePositions, resolvedPositions } from '../../engine/calculate'
import { BASELINE_2026 } from '../baseline2026'

const ids = new Set(PLATFORMS.map((p) => p.id))

describe('dataset lint', () => {
  it('every position has at least one citation with a real URL path and no duplicate areas per platform', () => {
    const problems: string[] = []
    for (const p of PLATFORMS) {
      const seen = new Set<string>()
      for (const pos of p.positions) {
        if (seen.has(pos.area)) problems.push(`${p.id}/${pos.area}: duplicate area`)
        seen.add(pos.area)
        if (pos.citations.length === 0) problems.push(`${p.id}/${pos.area}: no citations`)
        for (const c of pos.citations) {
          const u = new URL(c.url)
          if (!/^https?:$/.test(u.protocol)) problems.push(`${p.id}/${pos.area}: non-http url ${c.url}`)
          if (u.pathname === '/' && !u.search && !u.hash) problems.push(`${p.id}/${pos.area}: bare domain ${c.url}`)
        }
      }
      for (const sp of p.spending ?? []) {
        if (sp.citations.length === 0) problems.push(`${p.id}/spending/${sp.category}: no citations`)
      }
    }
    expect(problems).toEqual([])
  })

  it('every benefit rule is cited with a real URL and ids are unique per platform', () => {
    const problems: string[] = []
    for (const p of PLATFORMS) {
      const seen = new Set<string>()
      for (const b of p.benefits ?? []) {
        if (seen.has(b.id)) problems.push(`${p.id}/${b.id}: duplicate benefit id`)
        seen.add(b.id)
        if (b.citations.length === 0) problems.push(`${p.id}/${b.id}: no citations`)
        for (const c of b.citations) {
          const u = new URL(c.url)
          if (u.pathname === '/' && !u.search && !u.hash) problems.push(`${p.id}/${b.id}: bare domain ${c.url}`)
        }
      }
    }
    expect(problems).toEqual([])
  })

  it('inheritance chains resolve and politicians have avatars', () => {
    for (const p of PLATFORMS) {
      if (p.inheritsFrom) expect(ids.has(p.inheritsFrom), `${p.id} inherits from unknown ${p.inheritsFrom}`).toBe(true)
      if (p.kind === 'politician') expect(existsSync(`public/avatars/${p.id}.webp`), `${p.id} avatar missing`).toBe(true)
    }
  })

  it('the drawer shows exactly what the engine applies', () => {
    for (const p of PLATFORMS) {
      const applied = resolvedPositions(p, PLATFORMS).map((x) => `${x.source.id}/${x.position.area}`)
      const shown = effectivePositions(p, PLATFORMS).map((x) => x.area)
      expect(shown.length).toBe(applied.length)
    }
  })

  it('no position writes an assumption-owned field or mutates the shared baseline', () => {
    const get = (o: unknown, path: string) => path.split('.').reduce<unknown>((acc, k) => (acc as Record<string, unknown>)?.[k], o)
    for (const p of PLATFORMS) {
      const params = applyPlatform(BASELINE_2026, p, PLATFORMS)
      for (const path of ASSUMPTION_OWNED_PATHS) {
        expect(get(params, path), `${p.id} wrote ${path}`).toEqual(get(BASELINE_2026, path))
      }
    }
    const before = JSON.stringify(BASELINE_2026)
    for (const p of PLATFORMS) applyPlatform(BASELINE_2026, p, PLATFORMS)
    expect(JSON.stringify(BASELINE_2026)).toBe(before)
    expect(cloneParams(BASELINE_2026).aca.applicablePct).not.toBe(BASELINE_2026.aca.applicablePct)
  })
})
