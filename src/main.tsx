import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

// Self-hosted fonts (latin subset covers Spanish accents). Precached by the SW.
import '@fontsource/tektur/latin-700.css'
import '@fontsource/tektur/latin-800.css'
import '@fontsource/jetbrains-mono/latin-400.css'
import '@fontsource/jetbrains-mono/latin-500.css'
import '@fontsource/jetbrains-mono/latin-700.css'
import './styles/tokens.css'
import './styles/base.css'
import './styles/motion.css'

import { App } from './App'
import { ensureStartDate } from './db/repo/settings'
import { officialStartReset } from './db/reset'
import { today } from './lib/dates'
import { startSync } from './sync/engine'

// Real orientation lock where the browser allows it (not iOS; the CSS hint covers that).
void (screen.orientation as ScreenOrientation & { lock?: (o: string) => Promise<void> })?.lock?.('portrait').catch(() => undefined)

// Ask iOS not to evict IndexedDB (SPEC §5.5).
void navigator.storage?.persist?.().catch(() => undefined)

// One-time clean start (before 2026-11-04), then the plan start date, then sync.
void (async () => {
  await officialStartReset(today())
  await ensureStartDate(today())
  // supabase-js loads after the first render (separate chunk, still precached for offline).
  const { supabaseRemote } = await import('./sync/remote')
  await startSync(supabaseRemote())
})().catch((e: unknown) => console.error(e))

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
