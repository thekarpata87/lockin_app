// Keep the screen on (SPEC §7). Re-acquired on visibilitychange; iOS releases it when hidden.
type Sentinel = { release: () => Promise<void>; released: boolean }
type WakeNav = Navigator & { wakeLock?: { request: (t: 'screen') => Promise<Sentinel> } }

export const wakeLockSupported = () => typeof navigator !== 'undefined' && 'wakeLock' in navigator

export const WAKE_LOCK_HINT = 'Para que la pantalla no se apague, ajusta el bloqueo automático en Ajustes de iOS.'

/** Returns a release function. Holders are reference-counted so screens can overlap. */
let holders = 0
let sentinel: Sentinel | null = null

async function acquire() {
  if (!wakeLockSupported() || document.visibilityState !== 'visible') return
  if (sentinel && !sentinel.released) return
  try {
    sentinel = (await (navigator as WakeNav).wakeLock!.request('screen')) ?? null
  } catch {
    sentinel = null
  }
}

function onVisible() {
  if (holders > 0 && document.visibilityState === 'visible') void acquire()
}

export function holdWakeLock(): () => void {
  holders++
  if (holders === 1) document.addEventListener('visibilitychange', onVisible)
  void acquire()
  let released = false
  return () => {
    if (released) return
    released = true
    holders--
    if (holders === 0) {
      document.removeEventListener('visibilitychange', onVisible)
      void sentinel?.release().catch(() => undefined)
      sentinel = null
    }
  }
}
