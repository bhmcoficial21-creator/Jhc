// Replays 3D de treino com bola: trajetórias dos jogadores (metros), bola e dados de HUD.
export type Act = 'idle' | 'run' | 'jog' | 'jockey' | 'feint' | 'pedal' | 'kick' | 'turn' | 'receive' | 'dive' | 'celebrate'
export interface Key { t: number; x: number; y: number; act?: Act; face?: number }   // face em graus (0 = +x)
export interface Track { id: string; team: 'a' | 'b'; role: string; hero?: boolean; keys: Key[] }
export type BallSeg =
  | { type: 'carry'; by: string; from: number; to: number }
  | { type: 'travel'; from: number; to: number; a: [number, number] | string; b: [number, number] | string; arc?: number }
  | { type: 'at'; from: number; to: number; at: [number, number] | string }
export interface Step { t: number; text: string }
export interface Replay {
  id: string; title: string; category: 'drible' | 'marcacao' | 'desmarque' | 'chute' | 'conducao'
  summary: string; duration: number; level: 1 | 2 | 3
  pitch: 'full' | 'court' | 'none'; focus: { x: number; y: number; size: number }
  goal?: { x: number; side: 1 | -1 }; cones?: [number, number][]
  tracks: Track[]; ball: BallSeg[]; steps: Step[]
  how: string[]; setup: string; tips: string[]; mistakes: string[]
  camera?: 'tv' | 'seguir' | 'gol'; hud?: { label: string }
  published?: boolean
}

const smooth = (u: number) => u * u * (3 - 2 * u)
const lerp = (a: number, b: number, u: number) => a + (b - a) * u

export function posAt(tr: Track, t: number): { x: number; y: number; act: Act; actT: number; face?: number } {
  const k = tr.keys
  if (t <= k[0].t) return { x: k[0].x, y: k[0].y, act: k[0].act ?? 'idle', actT: 0, face: k[0].face }
  const last = k[k.length - 1]
  if (t >= last.t) return { x: last.x, y: last.y, act: last.act ?? 'idle', actT: 1, face: last.face }
  let i = 0; while (k[i + 1].t < t) i++
  const a = k[i], b = k[i + 1], u = (t - a.t) / (b.t - a.t)
  const e = a.act === b.act || !a.act ? u : u        // movimento linear entre pontos (velocidade constante)
  return { x: lerp(a.x, b.x, e), y: lerp(a.y, b.y, e), act: a.act ?? 'run', actT: u, face: a.face !== undefined && b.face !== undefined ? lerp(a.face, b.face, smooth(u)) : a.face }
}
export function velAt(tr: Track, t: number, dt = 0.12): { vx: number; vy: number; speed: number } {
  const p0 = posAt(tr, Math.max(0, t - dt)), p1 = posAt(tr, t + dt), d = Math.max(1e-3, t + dt - Math.max(0, t - dt))
  const vx = (p1.x - p0.x) / d, vy = (p1.y - p0.y) / d
  return { vx, vy, speed: Math.hypot(vx, vy) }
}
/** Distância percorrida por um jogador até o instante t. */
export function distanceAt(tr: Track, t: number): number {
  let d = 0, prev = posAt(tr, 0)
  for (let s = 0.1; s <= t + 1e-9; s += 0.1) { const p = posAt(tr, Math.min(s, t)); d += Math.hypot(p.x - prev.x, p.y - prev.y); prev = p }
  return d
}

export function ballAt(r: Replay, t: number): { x: number; y: number; z: number } {
  const resolve = (v: [number, number] | string, tt: number): [number, number] => {
    if (typeof v !== 'string') return v
    const tr = r.tracks.find((x) => x.id === v)!; const p = posAt(tr, tt); return [p.x, p.y]
  }
  let seg = r.ball.find((s) => t >= s.from && t <= s.to)
  if (!seg) seg = t < r.ball[0].from ? r.ball[0] : r.ball[r.ball.length - 1]
  if (seg.type === 'at') { const [x, y] = resolve(seg.at, t); return { x, y, z: 0.11 } }
  if (seg.type === 'carry') {
    const tr = r.tracks.find((x) => x.id === seg!.by)!, p = posAt(tr, t), v = velAt(tr, t)
    const sp = v.speed, hx = sp > 0.3 ? v.vx / sp : Math.cos(((p.face ?? 0) * Math.PI) / 180), hy = sp > 0.3 ? v.vy / sp : Math.sin(((p.face ?? 0) * Math.PI) / 180)
    // drible por TOQUES: a bola é empurrada à frente (rola rápido e desacelera) e o jogador a alcança para o toque seguinte
    const period = sp < 0.5 ? 1.2 : Math.max(0.42, 0.78 - sp * 0.05), cyc = ((t - seg.from) / period) % 1, k = Math.floor((t - seg.from) / period)
    const reach = Math.min(1, sp / 4.5)
    const off = sp < 0.5 ? 0.36 : 0.38 + 0.5 * reach * (cyc < 0.22 ? 1 - Math.pow(1 - cyc / 0.22, 2) : 1 - ((cyc - 0.22) / 0.78) * 0.93)
    const sw = (k % 2 ? 1 : -1) * 0.13 * (1 - cyc * 0.6)
    const bounce = cyc < 0.12 ? Math.sin((cyc / 0.12) * Math.PI) * 0.05 : 0
    return { x: p.x + hx * off - hy * sw, y: p.y + hy * off + hx * sw, z: 0.11 + bounce }
  }
  const u = Math.min(1, Math.max(0, (t - seg.from) / Math.max(1e-3, seg.to - seg.from)))
  const a = resolve(seg.a, seg.from), b = resolve(seg.b, seg.to)
  const e = (seg.arc ?? 0) < 0.6 ? 1 - Math.pow(1 - u, 1.5) : u            // bola rasteira desacelera pelo atrito; chute alto mantém a velocidade
  return { x: lerp(a[0], b[0], e), y: lerp(a[1], b[1], e), z: 0.11 + (seg.arc ?? 0) * 4 * u * (1 - u) }
}

/** Troca de câmera automática: centroide de interesse (herói + bola). */
export function focusAt(r: Replay, t: number) {
  const hero = r.tracks.find((x) => x.hero) ?? r.tracks[0], h = posAt(hero, t), b = ballAt(r, t)
  return { hero: h, ball: b, cx: (h.x * 2 + b.x) / 3, cy: (h.y * 2 + b.y) / 3 }
}
export const kmh = (ms: number) => ms * 3.6
