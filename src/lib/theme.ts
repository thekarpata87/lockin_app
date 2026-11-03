// Theme: "system" follows iOS; "light"/"dark" force it. Mirrored in localStorage for first paint.
import type { Theme } from '../db/schema'

const KEY = 'bloque.theme'
const BG = { light: '#E4E4E2', dark: '#0D0D0C' }

export function applyTheme(theme: Theme) {
  const root = document.documentElement
  if (theme === 'system') delete root.dataset.theme
  else root.dataset.theme = theme
  for (const m of document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]')) {
    const scheme = m.media.includes('dark') ? 'dark' : 'light'
    m.content = theme === 'system' ? BG[scheme] : BG[theme]
  }
  try {
    localStorage.setItem(KEY, theme)
  } catch {
    // per-device convenience only
  }
}
