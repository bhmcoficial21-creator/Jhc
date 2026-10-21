import { describe, expect, it } from 'vitest'
import { REPLAYS } from '../seed/replays'
import { ballAt, distanceAt, posAt, velAt } from './replay'

describe('replays', () => {
  it('todos têm herói, passos dentro da duração e bola cobrindo o tempo todo', () => {
    for (const r of REPLAYS) {
      expect(r.tracks.filter((t) => t.hero).length, r.id).toBe(1)
      expect(r.steps.every((s) => s.t >= 0 && s.t <= r.duration), r.id).toBe(true)
      for (const t of r.tracks) { expect(t.keys[0].t, `${r.id}/${t.id}`).toBe(0); expect(t.keys.every((k, i) => i === 0 || k.t > t.keys[i - 1].t), `${r.id}/${t.id} tempos`).toBe(true) }
      for (let s = 0; s <= r.duration; s += 0.25) { const b = ballAt(r, s); expect(Number.isFinite(b.x + b.y + b.z), `${r.id}@${s}`).toBe(true) }
    }
  })
  it('velocidades plausíveis (nenhum jogador passa de 10 m/s)', () => {
    for (const r of REPLAYS) for (const t of r.tracks) for (let s = 0.2; s < r.duration; s += 0.2) expect(velAt(t, s).speed, `${r.id}/${t.id}@${s}`).toBeLessThan(10)
  })
  it('posição interpola e distância acumula', () => {
    const tr = { id: 'a', team: 'a' as const, role: '', keys: [{ t: 0, x: 0, y: 0 }, { t: 2, x: 10, y: 0 }] }
    expect(posAt(tr, 1).x).toBeCloseTo(5); expect(distanceAt(tr, 2)).toBeCloseTo(10, 0)
  })
})
