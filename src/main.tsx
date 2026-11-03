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

import { App } from './App'

// Ask iOS not to evict IndexedDB (SPEC §5.5).
void navigator.storage?.persist?.().catch(() => undefined)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
