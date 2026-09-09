import { useState } from 'react'
import type { Platform } from '../engine/types'

interface Props {
  platform: Platform
  /** Pixel size. */
  size?: number
  className?: string
}

/**
 * Politician avatar: a committed WebP in /avatars/{id}.webp when one exists, otherwise deterministic
 * initials on a neutral tint. Photos are progressive enhancement; the initials are the contract.
 * Party baselines always render as initials.
 */
export function Avatar({ platform, size = 40, className = '' }: Props) {
  const [failed, setFailed] = useState(false)
  const initials = initialsFor(platform)
  const hue = hueFor(platform.id)
  const showImage = platform.kind === 'politician' && !failed
  const style = {
    width: size,
    height: size,
    background: `oklch(0.92 0.03 ${hue})`,
    color: `oklch(0.35 0.06 ${hue})`,
    fontSize: Math.max(10, Math.round(size * 0.36)),
  }
  return (
    <span
      className={`relative inline-flex shrink-0 select-none items-center justify-center overflow-hidden rounded-full font-semibold tracking-tight ${className}`}
      style={style}
      aria-hidden="true"
    >
      {initials}
      {showImage && (
        <img
          src={`/avatars/${platform.id}.webp`}
          alt=""
          width={size}
          height={size}
          loading="lazy"
          decoding="async"
          onError={() => setFailed(true)}
          className="absolute inset-0 h-full w-full object-cover"
        />
      )}
    </span>
  )
}

function initialsFor(p: Platform): string {
  if (p.kind !== 'politician') {
    const words = p.shortName.replace(/baseline/i, '').trim().split(/\s+/)
    return words
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase() ?? '')
      .join('')
  }
  const parts = p.name.split(/\s+/).filter((w) => !/^(jr|sr|ii|iii)\.?$/i.test(w))
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  // Hyphenated surnames keep both initials (Ocasio-Cortez → AOC)
  const last = parts[parts.length - 1].split('-').map((s) => s[0]).join('')
  return (parts[0][0] + last).toUpperCase().slice(0, 3)
}

/** Deterministic hue from the id; deliberately unrelated to party colors. */
function hueFor(id: string): number {
  let h = 0
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0
  // Avoid the red (0–40) and blue (230–280) bands so nothing reads as partisan.
  const allowed = [60, 90, 120, 150, 170, 190, 300, 330]
  return allowed[h % allowed.length]
}
