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

// ---------- Efeitos sonoros do replay (sintetizados, sem arquivos) ----------
let muted = (() => { try { return localStorage.getItem('vp:mute') === '1' } catch { return false } })()
export const isMuted = () => muted
export function setMuted(v: boolean) { muted = v; try { localStorage.setItem('vp:mute', v ? '1' : '0') } catch { /* ignore */ } }
function noise(c: AudioContext, dur: number, freq: number, gain: number) {
  const n = Math.floor(c.sampleRate * dur), buf = c.createBuffer(1, n, c.sampleRate), d = buf.getChannelData(0)
  for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n)
  const src = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain()
  src.buffer = buf; f.type = 'bandpass'; f.frequency.value = freq; g.gain.value = gain
  src.connect(f).connect(g).connect(c.destination); src.start()
}
export function sfx(kind: 'kick' | 'goal' | 'swish' | 'touch') {
  if (muted) return
  const c = ac(); if (!c || c.state !== 'running') return
  const t = c.currentTime
  const tone = (f0: number, f1: number, dur: number, vol: number, type: OscillatorType = 'sine', when = 0) => {
    const o = c.createOscillator(), g = c.createGain()
    o.type = type; o.frequency.setValueAtTime(f0, t + when); o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + when + dur)
    g.gain.setValueAtTime(vol, t + when); g.gain.exponentialRampToValueAtTime(0.0001, t + when + dur)
    o.connect(g).connect(c.destination); o.start(t + when); o.stop(t + when + dur + 0.02)
  }
  if (kind === 'kick') { tone(160, 45, 0.18, 0.5); noise(c, 0.08, 1800, 0.25) }
  else if (kind === 'touch') { tone(220, 120, 0.06, 0.18); noise(c, 0.03, 2500, 0.08) }
  else if (kind === 'swish') noise(c, 0.22, 900, 0.18)
  else { [523, 659, 784, 1046].forEach((f, i) => tone(f, f * 1.01, 0.35, 0.18, 'triangle', i * 0.09)); noise(c, 1.1, 2200, 0.1) }
}
