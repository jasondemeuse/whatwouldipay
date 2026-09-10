/**
 * Small outline icons for the simple flow. 24px grid, 1.75px strokes, `currentColor`, so they follow the
 * text color of whatever card they sit in (light, dark, or selected).
 */
export type IconName = 'person' | 'couple' | 'parent' | 'building' | 'cart' | 'hospital' | 'medicare' | 'none' | 'check'

export function Icon({ name, className = 'h-8 w-8' }: { name: IconName; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      {PATHS[name]}
    </svg>
  )
}

const PATHS: Record<IconName, React.ReactNode> = {
  // One person
  person: (
    <>
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5 20c0-3.6 3.1-6 7-6s7 2.4 7 6" />
    </>
  ),
  // Two people
  couple: (
    <>
      <circle cx="9" cy="8" r="3" />
      <circle cx="16.5" cy="9" r="2.5" />
      <path d="M3 20c0-3.3 2.7-5.5 6-5.5s6 2.2 6 5.5" />
      <path d="M15.5 20c0-2.6 1.6-4.5 4-4.5 1 0 1.8.3 2.5.8" />
    </>
  ),
  // Adult with child
  parent: (
    <>
      <circle cx="9" cy="6.5" r="3" />
      <path d="M3 20c0-3.6 2.7-6 6-6s6 2.4 6 6" />
      <circle cx="17.5" cy="12" r="2" />
      <path d="M14.5 20c0-2.2 1.3-3.8 3-3.8s3 1.6 3 3.8" />
    </>
  ),
  // Office building
  building: (
    <>
      <rect x="5" y="3" width="14" height="18" rx="1" />
      <path d="M9 7h2M13 7h2M9 11h2M13 11h2M9 15h2M13 15h2M10 21v-3h4v3" />
    </>
  ),
  // Shopping cart (marketplace)
  cart: (
    <>
      <path d="M3 4h2l2.4 10.5a1 1 0 0 0 1 .8h8.8a1 1 0 0 0 1-.8L20 8H6.2" />
      <circle cx="9.5" cy="19" r="1.5" />
      <circle cx="16.5" cy="19" r="1.5" />
    </>
  ),
  // Hospital cross
  hospital: (
    <>
      <rect x="4" y="4" width="16" height="16" rx="2" />
      <path d="M12 8v8M8 12h8" />
    </>
  ),
  // Medicare: heart with a pulse line
  medicare: (
    <>
      <path d="M12 20.5s-7.5-4.6-7.5-10A4.2 4.2 0 0 1 12 8a4.2 4.2 0 0 1 7.5 2.5c0 5.4-7.5 10-7.5 10Z" />
      <path d="M7 13h2.5l1.5-2.5 2 5 1.5-2.5H17" />
    </>
  ),
  check: <path d="M5 12.5l4.5 4.5L19 7" />,
  // No insurance: circle with a slash
  none: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M6 6l12 12" />
    </>
  ),
}
