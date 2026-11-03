// Short beeps with oscillators (SPEC §7). iOS needs the AudioContext created/resumed inside a tap.
let ctx: AudioContext | null = null

type WebkitWindow = Window & { webkitAudioContext?: typeof AudioContext }

/** Call from a user tap (e.g. "Iniciar sesión"). Safe to call many times. */
export function unlockAudio(): void {
  try {
    if (!ctx) {
      const Ctor = window.AudioContext ?? (window as WebkitWindow).webkitAudioContext
      if (!Ctor) return
      ctx = new Ctor()
    }
    if (ctx.state === 'suspended') void ctx.resume()
    // A silent blip finishes the unlock on older iOS.
    const g = ctx.createGain()
    g.gain.value = 0
    g.connect(ctx.destination)
    const o = ctx.createOscillator()
    o.connect(g)
    o.start()
    o.stop(ctx.currentTime + 0.01)
  } catch {
    // Audio is optional.
  }
}

export function beep(freq = 880, ms = 120, volume = 0.25): void {
  if (!ctx) return
  try {
    if (ctx.state === 'suspended') void ctx.resume()
    const t = ctx.currentTime
    const o = ctx.createOscillator()
    const g = ctx.createGain()
    o.type = 'square'
    o.frequency.value = freq
    g.gain.setValueAtTime(volume, t)
    g.gain.exponentialRampToValueAtTime(0.0001, t + ms / 1000)
    o.connect(g)
    g.connect(ctx.destination)
    o.start(t)
    o.stop(t + ms / 1000 + 0.02)
  } catch {
    // ignore
  }
}

/** Countdown tick (3-2-1) and the change beep. */
export const tickBeep = () => beep(660, 90)
export const changeBeep = () => beep(1040, 260, 0.3)
