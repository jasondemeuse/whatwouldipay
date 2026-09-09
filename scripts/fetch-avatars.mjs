#!/usr/bin/env node
/**
 * Fetch, license-check, crop and encode politician avatars.
 *
 *   node scripts/fetch-avatars.mjs            # all
 *   node scripts/fetch-avatars.mjs moore aoc  # subset
 *
 * - congress: https://unitedstates.github.io/images/congress/original/{bioguide}.jpg (CC0 mirror of PD portraits)
 * - commons:  resolves the original URL + license via the Commons API (one batched call), serial downloads,
 *             informative User-Agent per Wikimedia policy.
 * - Writes public/avatars/{id}.webp (256x256) and {id}-64.webp, public/avatars/CREDITS.json and CREDITS.md.
 * - FAILS if any Commons file requires attribution and is not already acknowledged in scripts/avatar-credits.json.
 */
import fs from 'node:fs/promises'
import path from 'node:path'
import sharp from 'sharp'

import { fileURLToPath } from 'node:url'
const root = path.resolve(fileURLToPath(new URL('..', import.meta.url)))
const cfg = JSON.parse(await fs.readFile(path.join(root, 'scripts/avatar-sources.json'), 'utf8'))
const ack = JSON.parse(await fs.readFile(path.join(root, 'scripts/avatar-credits.json'), 'utf8').catch(() => '{}'))
const outDir = path.join(root, 'public/avatars')
await fs.mkdir(outDir, { recursive: true })

const only = new Set(process.argv.slice(2))
const people = cfg.people.filter((p) => only.size === 0 || only.has(p.id))
if (!cfg.userAgent || !/https?:\/\//.test(cfg.userAgent)) throw new Error('avatar-sources.json needs a userAgent with a contact URL (Wikimedia policy)')
for (const p of people) {
  if (!/^[a-z0-9][a-z0-9-]{0,31}$/.test(p.id)) throw new Error(`bad id ${JSON.stringify(p.id)}`)
  if (p.kind === 'congress' && !/^[A-Z]\d{6}$/.test(p.bioguide)) throw new Error(`bad bioguide for ${p.id}`)
}
/** Licenses we accept. Anything else (CC BY-NC, ND, all rights reserved, or unknown) fails the build. */
const LICENSE_ALLOW = /^(public domain|pd|cc0|cc by 4\.0|cc by-sa 4\.0|cc by 3\.0|cc by-sa 3\.0|cc by 2\.0)/i
const headers = { 'User-Agent': cfg.userAgent, 'Accept-Encoding': 'gzip' }

async function get(url, as = 'buffer') {
  const res = await fetch(url, { headers, redirect: 'follow' })
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} for ${url}`)
  return as === 'json' ? res.json() : Buffer.from(await res.arrayBuffer())
}

// 1. Resolve Commons metadata in one batched call (max 50 titles).
const commons = people.filter((p) => p.kind === 'commons')
const meta = {}
if (commons.length) {
  const titles = commons.map((p) => `File:${p.file}`).join('|')
  const url =
    'https://commons.wikimedia.org/w/api.php?action=query&format=json&prop=imageinfo&iiprop=url|size|extmetadata' +
    '&iiextmetadatafilter=LicenseShortName|LicenseUrl|Artist|Credit|AttributionRequired|UsageTerms' +
    `&titles=${encodeURIComponent(titles)}`
  const json = await get(url, 'json')
  for (const page of Object.values(json.query.pages)) {
    if (page.missing !== undefined) throw new Error(`Commons file not found: ${page.title}`)
    const ii = page.imageinfo?.[0]
    const em = ii?.extmetadata ?? {}
    const strip = (s) => (s ?? '').replace(/<[^>]+>/g, '').trim()
    meta[page.title.replace(/^File:/, '')] = {
      url: ii.url,
      descriptionUrl: ii.descriptionurl,
      width: ii.width,
      height: ii.height,
      license: strip(em.LicenseShortName?.value),
      licenseUrl: strip(em.LicenseUrl?.value),
      artist: strip(em.Artist?.value),
      attributionRequired: (em.AttributionRequired?.value ?? '').toLowerCase() === 'true',
    }
  }
}

// 2. Download, crop, encode. Serial, per API etiquette.
const credits = {}
const failures = []
for (const p of people) {
  try {
    let buf, info
    if (p.kind === 'congress') {
      const src = `https://unitedstates.github.io/images/congress/original/${p.bioguide}.jpg`
      buf = await get(src)
      info = { source: src, license: 'Public domain (US government work, 17 U.S.C. § 105)', licenseUrl: '', artist: 'US Congress / GPO', attributionRequired: false }
    } else {
      const m = meta[p.file]
      if (!m) throw new Error(`no metadata for ${p.file}`)
      if (!m.license) throw new Error(`"${p.file}" has no LicenseShortName on Commons; refusing to guess`)
      if (!LICENSE_ALLOW.test(m.license)) throw new Error(`"${p.file}" is ${m.license}, which is not on the allowlist`)
      const isPd = /^(public domain|pd|cc0)/i.test(m.license)
      const needsCredit = m.attributionRequired || !isPd // missing AttributionRequired on a CC file counts as required
      if (needsCredit && (!ack[p.id] || ack[p.id].license !== m.license)) {
        throw new Error(`"${p.file}" is ${m.license} and requires attribution; scripts/avatar-credits.json must acknowledge ${p.id} with that exact license`)
      }
      m.attributionRequired = needsCredit
      buf = await get(m.url)
      info = { source: m.descriptionUrl, license: m.license, licenseUrl: m.licenseUrl, artist: m.artist, attributionRequired: m.attributionRequired }
    }
    if (buf.length > 60 * 1024 * 1024) throw new Error(`${p.id}: source image over 60 MB`)
    const img = sharp(buf).rotate()
    const { width, height } = await img.metadata()
    // Default: full-width square from near the top. `box: [x, y, size]` (fractions of width/height/width) overrides it
    // for group shots or off-center subjects.
    let side = Math.min(width, height)
    let top, left
    if (p.box) {
      const [bx, by, bs] = p.box
      side = Math.min(Math.round(width * bs), width, height)
      left = Math.min(Math.max(0, Math.round(width * bx)), width - side)
      top = Math.min(Math.max(0, Math.round(height * by)), height - side)
    } else {
      const cropY = p.cropY ?? (height > width ? 0.06 : 0)
      top = Math.min(Math.max(0, Math.round(height * cropY)), height - side)
      left = Math.round((width - side) / 2)
    }
    const square = img.extract({ left, top, width: side, height: side })
    await square.clone().resize(256, 256).webp({ quality: 82 }).toFile(path.join(outDir, `${p.id}.webp`))
    await square.clone().resize(64, 64).webp({ quality: 80 }).toFile(path.join(outDir, `${p.id}-64.webp`))
    credits[p.id] = {
      name: p.name,
      file: `${p.id}.webp`,
      ...info,
      modified: 'cropped to a square and resized to 256px',
      fetched: new Date().toISOString().slice(0, 10),
    }
    console.log(`✓ ${p.id.padEnd(10)} ${info.license}${info.attributionRequired ? '  (attribution required)' : ''}`)
  } catch (e) {
    failures.push(`${p.id}: ${e.message}`)
    console.error(`✗ ${p.id}: ${e.message}`)
  }
}

// 3. Write credits (merge with existing so partial runs don't drop entries). Skipped entirely if anything failed.
if (failures.length) {
  console.error(`\n${failures.length} failure(s); credits not rewritten.`)
  process.exit(1)
}
const existing = JSON.parse(await fs.readFile(path.join(outDir, 'CREDITS.json'), 'utf8').catch(() => '{}'))
const merged = { ...existing, ...credits }
await fs.writeFile(path.join(outDir, 'CREDITS.json'), JSON.stringify(merged, null, 2) + '\n')

const lines = [
  '# Photo credits',
  '',
  'Avatars in this folder are official portraits. Most are US government works in the public domain (17 U.S.C. § 105) or state works that',
  'California and Florida place in the public domain. Files marked with a license below are used under that Creative Commons license;',
  'each has been cropped to a square and resized. Nobody depicted endorses this tool.',
  '',
  '| Person | License | Author | Source |',
  '|---|---|---|---|',
]
for (const c of Object.values(merged).sort((a, b) => a.name.localeCompare(b.name))) {
  const lic = c.licenseUrl ? `[${c.license}](${c.licenseUrl})` : c.license
  lines.push(`| ${c.name} | ${lic} | ${(c.artist || '—').replace(/\|/g, '\\|')} | [source](${c.source}) |`)
}
const attributed = Object.values(merged).filter((c) => c.attributionRequired)
if (attributed.length) {
  lines.push('', '## Attribution-required files', '')
  for (const c of attributed) {
    lines.push(`- **${c.name}** — ${c.artist}, cropped. Licensed ${c.license} (${c.licenseUrl}). Source: ${c.source}` +
      (/BY-SA/i.test(c.license) ? ` This cropped derivative (\`${c.file}\`) is likewise licensed ${c.license}.` : ''))
  }
}
await fs.writeFile(path.join(outDir, 'CREDITS.md'), lines.join('\n') + '\n')

console.log(`\nWrote ${Object.keys(credits).length} avatars to public/avatars/`)
