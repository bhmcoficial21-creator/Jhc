import { expandRoutine, type Resolved } from './adapt'
import type { Exercise, GuidePage } from './types'

export type Block = 'warmup' | 'main' | 'cooldown' | 'routine'
export interface Step {
  kind: 'timed' | 'reps' | 'rest' | 'rate'
  ex: Exercise; level: number; block: Block; key: string
  secs?: number; reps?: number; set?: number; sets?: number; label?: string; cmd?: boolean
  warnings: string[]; nextName?: string
}

const sideLabel = (i: number) => (i === 0 ? '1º lado' : '2º lado')

/** Converte exercícios resolvidos em passos: timers, séries, descansos e notas de habilidade. */
export function buildSteps(list: Resolved[], block: Block, exMap: Map<string, Exercise>): Step[] {
  const out: Step[] = []
  list.forEach((r, ri) => {
    const key = `${block}-${ri}-${r.ex.id}`
    const parts = expandRoutine(r, exMap)
    if (r.ex.routine?.length) {
      parts.forEach((p, i) => {
        out.push({ kind: 'timed', ex: p.ex, level: p.level, block: 'routine', key, secs: p.item.secs ?? 10, label: `Exercício ${i + 1} de ${parts.length}`, warnings: [] })
        if (i < parts.length - 1) out.push({ kind: 'rest', ex: parts[i + 1].ex, level: p.level, block: 'routine', key, secs: p.item.rest ?? 10, warnings: [], nextName: parts[i + 1].ex.name })
      })
    } else {
      const sets = r.item.sets ?? 1, rest = r.item.rest ?? 0
      for (let s = 0; s < sets; s++) {
        if (r.item.secs) {
          const sides = r.item.side ? 2 : 1
          for (let k = 0; k < sides; k++) out.push({ kind: 'timed', ex: r.ex, level: r.level, block, key, secs: r.item.secs, set: s + 1, sets, label: sides === 2 ? sideLabel(k) : undefined, warnings: r.warnings })
        } else out.push({ kind: 'reps', ex: r.ex, level: r.level, block, key, reps: r.item.reps ?? 8, set: s + 1, sets, cmd: r.item.cmd, warnings: r.warnings })
        if (s < sets - 1 && rest > 0) out.push({ kind: 'rest', ex: r.ex, level: r.level, block, key, secs: rest, warnings: [], nextName: `${r.ex.name} · série ${s + 2}` })
      }
    }
    if (r.item.rate) out.push({ kind: 'rate', ex: r.ex, level: r.level, block, key, warnings: [] })
  })
  return out
}

/** Passos de uma página de guia (aquecer p/ jogo, pós-jogo, mobilidade). */
export function guideSteps(page: GuidePage, exMap: Map<string, Exercise>): Step[] {
  const out: Step[] = []
  page.steps.forEach((s, i) => {
    const ex = exMap.get(s.ex); if (!ex) return
    const sides = s.side ? 2 : 1
    for (let k = 0; k < sides; k++) out.push({ kind: 'timed', ex, level: 1, block: 'routine', key: `g-${i}`, secs: s.secs, label: sides === 2 ? sideLabel(k) : undefined, warnings: [] })
  })
  return out
}
export const totalSecs = (steps: Step[]) => steps.reduce((a, s) => a + (s.secs ?? 0), 0)
