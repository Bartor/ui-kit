import { useEffect, useState } from 'react'

export type Theme = 'light' | 'dark'
const KEY = 'kit-theme'

/** The theme chosen here before, or the one asked for. */
export function storedTheme(fallback: Theme = 'light'): Theme {
  try {
    const v = localStorage.getItem(KEY)
    if (v === 'light' || v === 'dark') return v
  } catch { /* storage can be off */ }
  return fallback
}

/** Put a theme on the page: the colours of the kit follow <html data-theme>. */
export function applyTheme(theme: Theme): void {
  document.documentElement.dataset.theme = theme
}

/**
 * The page's theme, light unless said otherwise, kept for the next visit. The
 * first value is applied before the first paint when this runs at the top of
 * the app.
 */
export function useTheme(fallback: Theme = 'light'): [Theme, (t: Theme) => void] {
  const [theme, setTheme] = useState<Theme>(() => {
    const t = storedTheme(fallback)
    applyTheme(t)
    return t
  })
  useEffect(() => {
    applyTheme(theme)
    try { localStorage.setItem(KEY, theme) } catch { /* storage can be off */ }
  }, [theme])
  return [theme, setTheme]
}
