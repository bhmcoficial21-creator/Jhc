let ctx: AudioContext | null = null
function ac() { try { ctx = ctx ?? new (window.AudioContext || (window as never as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)(); if (ctx.state === 'suspended') ctx.resume(); return ctx } catch { return null } }
/** Bip curto (fim de timer) ou sinal de reação (mais agudo e longo). */
export function beep(kind: 'tick' | 'go' | 'done' = 'tick') {
  const c = ac(); if (!c) return
  const o = c.createOscillator(), g = c.createGain()
  o.frequency.value = kind === 'go' ? 1100 : kind === 'done' ? 660 : 880; o.type = 'square'
  g.gain.setValueAtTime(0.0001, c.currentTime); g.gain.exponentialRampToValueAtTime(0.25, c.currentTime + 0.01)
  g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + (kind === 'go' ? 0.5 : 0.18))
  o.connect(g).connect(c.destination); o.start(); o.stop(c.currentTime + (kind === 'go' ? 0.55 : 0.2))
  try { navigator.vibrate?.(kind === 'go' ? 200 : 60) } catch { /* sem vibração */ }
}
export const unlockAudio = () => { ac() }
