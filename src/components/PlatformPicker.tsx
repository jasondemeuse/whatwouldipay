import type { Platform } from '../engine/types'

interface Props {
  platforms: Platform[]
  selected: string[]
  onChange: (ids: string[]) => void
}

const PARTY_COLOR: Record<string, string> = {
  D: 'border-blue-300 bg-blue-50 text-blue-900 data-[on=true]:bg-blue-600 data-[on=true]:text-white data-[on=true]:border-blue-600',
  R: 'border-red-300 bg-red-50 text-red-900 data-[on=true]:bg-red-600 data-[on=true]:text-white data-[on=true]:border-red-600',
  I: 'border-emerald-300 bg-emerald-50 text-emerald-900 data-[on=true]:bg-emerald-600 data-[on=true]:text-white data-[on=true]:border-emerald-600',
  L: 'border-amber-300 bg-amber-50 text-amber-900 data-[on=true]:bg-amber-600 data-[on=true]:text-white data-[on=true]:border-amber-600',
  G: 'border-green-300 bg-green-50 text-green-900 data-[on=true]:bg-green-700 data-[on=true]:text-white data-[on=true]:border-green-700',
}

export function PlatformPicker({ platforms, selected, onChange }: Props) {
  const toggle = (id: string) =>
    onChange(selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id])

  const groups: Array<{ title: string; items: Platform[] }> = [
    { title: 'Party baselines', items: platforms.filter((p) => p.kind === 'party') },
    { title: 'Democrats', items: platforms.filter((p) => p.kind === 'politician' && p.party === 'D') },
    { title: 'Republicans', items: platforms.filter((p) => p.kind === 'politician' && p.party === 'R') },
    { title: 'Independents & others', items: platforms.filter((p) => p.kind === 'politician' && !['D', 'R'].includes(p.party)) },
  ].filter((g) => g.items.length > 0)

  return (
    <div className="space-y-3">
      {groups.map((g) => (
        <div key={g.title}>
          <div className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">{g.title}</div>
          <div className="flex flex-wrap gap-2">
            {g.items.map((p) => {
              const on = selected.includes(p.id)
              return (
                <button
                  key={p.id}
                  type="button"
                  data-on={on}
                  onClick={() => toggle(p.id)}
                  title={p.role}
                  className={`rounded-full border px-3 py-1 text-sm font-medium transition ${PARTY_COLOR[p.party] ?? PARTY_COLOR.I}`}
                >
                  {p.shortName}
                </button>
              )
            })}
          </div>
        </div>
      ))}
      {selected.length > 0 && (
        <button type="button" onClick={() => onChange([])} className="text-xs text-slate-500 underline hover:text-slate-700">
          Clear selection
        </button>
      )}
    </div>
  )
}
