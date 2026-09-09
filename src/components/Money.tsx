import NumberFlow from '@number-flow/react'

const FMT = { style: 'currency', currency: 'USD', maximumFractionDigits: 0 } as const

/** Animated whole-dollar figure. Respects prefers-reduced-motion (NumberFlow default). */
export function Money({ value, className = '' }: { value: number; className?: string }) {
  return <NumberFlow value={Math.round(value)} format={FMT} className={`money ${className}`} />
}

/** Animated signed change. */
export function MoneyDelta({ value, className = '' }: { value: number; className?: string }) {
  return (
    <NumberFlow
      value={Math.round(value)}
      format={{ ...FMT, signDisplay: 'exceptZero' }}
      className={`money ${className}`}
    />
  )
}
