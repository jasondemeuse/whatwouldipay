import { useEffect, useState } from 'react'
import { applyTheme, initTheme, readTheme, type ThemeChoice } from '../lib/theme'

const OPTIONS: Array<{ v: ThemeChoice; label: string; glyph: string }> = [
  { v: 'system', label: 'Match system theme', glyph: '◐' },
  { v: 'light', label: 'Light theme', glyph: '○' },
  { v: 'dark', label: 'Dark theme', glyph: '●' },
]

export function ThemeToggle() {
  const [choice, setChoice] = useState<ThemeChoice>(() => readTheme())
  useEffect(() => initTheme(), [])
  const pick = (v: ThemeChoice) => {
    setChoice(v)
    applyTheme(v)
  }
  return (
    <div role="radiogroup" aria-label="Color theme" className="inline-flex rounded-md border border-rule bg-card p-0.5 text-xs">
      {OPTIONS.map((o) => (
        <button
          key={o.v}
          type="button"
          role="radio"
          aria-checked={choice === o.v}
          aria-label={o.label}
          title={o.label}
          onClick={() => pick(o.v)}
          className={`rounded px-2 py-0.5 leading-none transition-colors ${choice === o.v ? 'bg-ink text-card' : 'text-ink-2 hover:bg-paper-2'}`}
        >
          <span aria-hidden="true">{o.glyph}</span>
        </button>
      ))}
    </div>
  )
}
