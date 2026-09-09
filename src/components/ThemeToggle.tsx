import { useEffect, useState } from 'react'
import { applyTheme, initTheme, readTheme, type ThemeChoice } from '../lib/theme'
import { Segmented } from './Segmented'

export function ThemeToggle() {
  const [choice, setChoice] = useState<ThemeChoice>(() => readTheme())
  useEffect(() => initTheme(), [])
  return (
    <Segmented<ThemeChoice>
      label="Color theme"
      value={choice}
      options={[
        { v: 'system', label: '◐', title: 'Match system theme' },
        { v: 'light', label: '○', title: 'Light theme' },
        { v: 'dark', label: '●', title: 'Dark theme' },
      ]}
      onChange={(v) => {
        setChoice(v)
        applyTheme(v)
      }}
    />
  )
}
