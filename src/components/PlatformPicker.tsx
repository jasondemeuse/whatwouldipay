import type { Party, Platform } from '../engine/types'
import { Avatar } from './Avatar'

interface Props {
  platforms: Platform[]
  selected: string[]
  onChange: (ids: string[]) => void
}

/** Party identity as a small dot only. Fills stay neutral so the control never reads as a judgment. */
export const PARTY_DOT: Record<Party, string> = {
  D: 'var(--color-party-d)',
  R: 'var(--color-party-r)',
  I: 'var(--color-party-i)',
  L: 'var(--color-party-l)',
  G: 'var(--color-party-g)',
}

export const PARTY_NAME: Record<Party, string> = {
  D: 'Democrat',
  R: 'Republican',
  I: 'Independent',
  L: 'Libertarian',
  G: 'Green',
}

export function PlatformPicker({ platforms, selected, onChange }: Props) {
  const toggle = (id: string) => onChange(selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id])

  const groups: Array<{ title: string; items: Platform[] }> = [
    { title: 'Party baselines', items: platforms.filter((p) => p.kind === 'party') },
    { title: 'Democrats', items: platforms.filter((p) => p.kind === 'politician' && p.party === 'D') },
    { title: 'Republicans', items: platforms.filter((p) => p.kind === 'politician' && p.party === 'R') },
    { title: 'Independents & others', items: platforms.filter((p) => p.kind === 'politician' && !['D', 'R'].includes(p.party)) },
  ].filter((g) => g.items.length > 0)

  return (
    <div className="space-y-4">
      {groups.map((g) => (
        <div key={g.title}>
          <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-3">{g.title}</div>
          <div className="flex flex-wrap gap-2" role="group" aria-label={g.title}>
            {g.items.map((p) => {
              const on = selected.includes(p.id)
              return (
                <button
                  key={p.id}
                  type="button"
                  aria-pressed={on}
                  aria-label={`${p.name}, ${p.role}${on ? ', selected' : ''}`}
                  onClick={() => toggle(p.id)}
                  className={`group inline-flex min-h-9 items-center gap-2 rounded-full border py-1 pl-1 pr-3 text-sm font-medium transition-colors duration-150 ${
                    on
                      ? 'border-ink bg-ink text-card'
                      : 'border-rule bg-card text-ink hover:border-ink-4 hover:bg-paper-2'
                  }`}
                >
                  <Avatar platform={p} size={28} />
                  <span className="whitespace-nowrap">{p.shortName}</span>
                  <span
                    aria-hidden="true"
                    className="inline-block h-2 w-2 rounded-full ring-1 ring-white/60"
                    style={{ background: PARTY_DOT[p.party] }}
                    title={PARTY_NAME[p.party]}
                  />
                </button>
              )
            })}
          </div>
        </div>
      ))}
      <div className="flex items-center gap-4 text-xs text-ink-3">
        <span className="inline-flex items-center gap-3">
          <Legend party="D" />
          <Legend party="R" />
          <Legend party="I" />
          <Legend party="L" />
        </span>
        {selected.length > 0 && (
          <button type="button" onClick={() => onChange([])} className="ml-auto underline hover:text-ink">
            Clear selection
          </button>
        )}
      </div>
    </div>
  )
}

function Legend({ party }: { party: Party }) {
  return (
    <span className="inline-flex items-center gap-1">
      <span aria-hidden="true" className="inline-block h-2 w-2 rounded-full" style={{ background: PARTY_DOT[party] }} />
      {PARTY_NAME[party]}
    </span>
  )
}
