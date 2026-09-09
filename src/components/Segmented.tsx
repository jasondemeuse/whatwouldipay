import { useRef } from 'react'

interface Props<T extends string> {
  label: string
  value: T
  options: Array<{ v: T; label: string; title?: string }>
  onChange: (v: T) => void
  size?: 'xs' | 'sm'
}

/** Radiogroup with roving tabindex and arrow-key navigation (WAI-ARIA radio group pattern). */
export function Segmented<T extends string>({ label, value, options, onChange, size = 'xs' }: Props<T>) {
  const refs = useRef<Array<HTMLButtonElement | null>>([])
  const idx = Math.max(0, options.findIndex((o) => o.v === value))
  const move = (to: number) => {
    const next = (to + options.length) % options.length
    onChange(options[next].v)
    refs.current[next]?.focus()
  }
  return (
    <div role="radiogroup" aria-label={label} className={`inline-flex rounded-md border border-rule bg-card p-0.5 ${size === 'xs' ? 'text-xs' : 'text-sm'}`}>
      {options.map((o, i) => {
        const on = i === idx
        return (
          <button
            key={o.v}
            ref={(el) => {
              refs.current[i] = el
            }}
            type="button"
            role="radio"
            aria-checked={on}
            aria-label={o.title}
            title={o.title}
            tabIndex={on ? 0 : -1}
            onClick={() => onChange(o.v)}
            onKeyDown={(e) => {
              if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
                e.preventDefault()
                move(idx + 1)
              } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
                e.preventDefault()
                move(idx - 1)
              } else if (e.key === 'Home') {
                e.preventDefault()
                move(0)
              } else if (e.key === 'End') {
                e.preventDefault()
                move(options.length - 1)
              }
            }}
            className={`rounded px-2.5 py-1 font-medium leading-none transition-colors ${on ? 'bg-ink text-card' : 'text-ink-2 hover:bg-paper-2'}`}
          >
            {o.label}
          </button>
        )
      })}
    </div>
  )
}
