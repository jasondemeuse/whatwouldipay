export type ThemeChoice = 'system' | 'light' | 'dark'

const KEY = 'wwip:theme'
const mq = () => window.matchMedia('(prefers-color-scheme: dark)')

export function readTheme(): ThemeChoice {
  try {
    const v = localStorage.getItem(KEY)
    return v === 'light' || v === 'dark' ? v : 'system'
  } catch {
    return 'system'
  }
}

/**
 * Apply a theme choice. Explicit choices stamp data-theme; "system" removes it and mirrors the OS setting
 * via a `system-dark` class so the CSS can target both cases with one selector list.
 */
export function applyTheme(choice: ThemeChoice) {
  const root = document.documentElement
  if (choice === 'system') {
    root.removeAttribute('data-theme')
    root.classList.toggle('system-dark', mq().matches)
  } else {
    root.setAttribute('data-theme', choice)
    root.classList.remove('system-dark')
  }
  try {
    if (choice === 'system') localStorage.removeItem(KEY)
    else localStorage.setItem(KEY, choice)
  } catch {
    /* ignore */
  }
}

/** Call once at startup; keeps "system" in sync when the OS setting changes. Returns an unsubscribe. */
export function initTheme(): () => void {
  applyTheme(readTheme())
  const m = mq()
  const onChange = () => {
    if (readTheme() === 'system') applyTheme('system')
  }
  m.addEventListener('change', onChange)
  return () => m.removeEventListener('change', onChange)
}
