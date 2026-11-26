import { useCallback, useState } from 'react'

export type Theme = 'light' | 'dark'
// only a theme someone picked is kept: the default can change under it
const KEY = 'kit-theme-picked'

/** The theme picked here before, or the one asked for. */
export function storedTheme(fallback: Theme = 'dark'): Theme {
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
 * The page's theme: the one picked before, else the fallback. It is applied
 * before the first paint when this runs at the top of the app, and a theme
 * set through it is kept for the next visit.
 */
export function useTheme(fallback: Theme = 'dark'): [Theme, (t: Theme) => void] {
  const [theme, setState] = useState<Theme>(() => {
    const t = storedTheme(fallback)
    applyTheme(t)
    return t
  })
  const setTheme = useCallback((t: Theme) => {
    applyTheme(t)
    setState(t)
    try { localStorage.setItem(KEY, t) } catch { /* storage can be off */ }
  }, [])
  return [theme, setTheme]
}
