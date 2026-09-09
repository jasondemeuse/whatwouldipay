import { useState } from 'react'
import { parseMoney } from '../lib/labels'

/** Form primitives shared by the full household form and the guided view. */

export const inputCls =
  'w-full rounded-md border border-rule bg-card px-3 py-1.5 text-sm text-ink shadow-none transition-colors hover:border-ink-4'

export function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset className="space-y-3">
      <legend className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-3">{title}</legend>
      {children}
    </fieldset>
  )
}

export function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-ink-2">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-ink-3">{hint}</span>}
    </label>
  )
}

export function IntField({ label, value, onCommit, max = 12, hint }: { label: string; value: number; onCommit: (n: number) => void; max?: number; hint?: string }) {
  const [draft, setDraft] = useState<string | null>(null)
  const clamp = (raw: string) => Math.min(max, Math.max(0, Math.floor(Number(raw.replace(/[^0-9]/g, '')) || 0)))
  return (
    <Field label={label} hint={hint}>
      <input
        className={`${inputCls} max-w-24`}
        inputMode="numeric"
        value={draft ?? String(value)}
        onChange={(e) => {
          setDraft(e.target.value)
          if (e.target.value.trim() !== '') onCommit(clamp(e.target.value))
        }}
        onBlur={(e) => {
          setDraft(null)
          onCommit(clamp(e.target.value))
        }}
      />
    </Field>
  )
}

/**
 * Money input per GOV.UK guidance: text input, `$` prefix hidden from AT, inputmode numeric, width sized to
 * content. Accepts "65k" style shorthand and shows how it was read.
 */
export function MoneyField({
  label,
  hint,
  value,
  onCommit,
  placeholder,
  allowBlank = false,
  width = 'md',
}: {
  label: string
  hint?: string
  value: number | undefined
  onCommit: (n: number | undefined) => void
  placeholder?: string
  allowBlank?: boolean
  width?: 'sm' | 'md' | 'lg'
}) {
  const [draft, setDraft] = useState<string | null>(null)
  const [note, setNote] = useState<string | null>(null)
  const display = draft ?? (value === undefined ? '' : value.toLocaleString('en-US'))

  const commit = (raw: string) => {
    setDraft(null)
    if (raw.trim() === '') {
      setNote(null)
      onCommit(allowBlank ? undefined : 0)
      return
    }
    const [n, reinterpreted] = parseMoney(raw)
    onCommit(n)
    setNote(reinterpreted ? `Read as $${n.toLocaleString('en-US')}` : null)
  }

  const widthCls = width === 'sm' ? 'max-w-36' : width === 'md' ? 'max-w-48' : 'max-w-full'
  return (
    <Field label={label} hint={note ?? hint}>
      <div className={`relative ${widthCls}`}>
        <span aria-hidden="true" className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-ink-4">
          $
        </span>
        <input
          className={`${inputCls} money pl-7`}
          inputMode="numeric"
          autoComplete="off"
          value={display}
          placeholder={placeholder}
          onChange={(e) => {
            setDraft(e.target.value)
            // Commit live for plain numbers so results update as you type; shorthand commits on blur.
            const [n] = parseMoney(e.target.value)
            if (/^[\d,$\s.]*$/.test(e.target.value)) onCommit(e.target.value.trim() === '' && allowBlank ? undefined : n)
          }}
          onBlur={(e) => commit(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') (e.target as HTMLInputElement).blur()
          }}
        />
      </div>
    </Field>
  )
}
