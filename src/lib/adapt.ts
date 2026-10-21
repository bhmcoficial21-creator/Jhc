import type { ExProgress, Exercise, LevelDef, Place, Profile, Workout, WorkoutItem } from './types'

const HARD_EQUIP = ['caixa', 'halteres', 'barra', 'degrau', 'ladeira', 'bola_medicinal', 'escada']
export const baseLevel = (p: Pick<Profile, 'level'>) => (p.level === 'avancado' ? 3 : p.level === 'intermediario' ? 2 : 1)

export interface Ctx {
  ex: Map<string, Exercise>; profile: Profile; place: Place
  progress: Map<string, ExProgress>
  noJumps: boolean          // cautela, dor no último treino ou planner
  supervised: boolean       // tem acompanhamento de profissional (academia)
}
export interface Resolved {
  item: WorkoutItem; ex: Exercise; level: number; levelDef?: LevelDef
  swappedFrom?: string; warnings: string[]
}

function equipmentOk(e: Exercise, place: Place, p: Profile): boolean {
  const have = p.equipment?.[place] ?? []
  if (have.includes('tudo')) return true
  const need = e.equipment.filter((x) => HARD_EQUIP.includes(x))
  return need.every((n) => have.includes(n) || (n === 'degrau' && have.includes('caixa')))
}
function placeOk(e: Exercise, place: Place, p: Profile) { return e.locations.includes(place) && equipmentOk(e, place, p) }

/** Troca o exercício pela versão do local onde o aluno vai treinar hoje. */
export function adaptToPlace(id: string, c: Ctx, depth = 0): Exercise | null {
  const e = c.ex.get(id); if (!e) return null
  if (placeOk(e, c.place, c.profile)) return e
  const alt = e.alternatives[c.place]
  if (alt && depth < 3) { const r = adaptToPlace(alt, c, depth + 1); if (r) return r }
  // peso do corpo cabe na academia e no campo
  if (e.locations.includes('casa') && c.place !== 'casa' && equipmentOk(e, 'casa', c.profile)) return e
  const home = e.alternatives.casa
  if (home && depth < 3) { const r = adaptToPlace(home, { ...c, place: 'casa' }, depth + 1); if (r) return r }
  return e.locations.includes('casa') ? e : null
}

export function levelFor(e: Exercise, c: Ctx): number {
  const pr = c.progress.get(e.id)
  const lv = pr?.forced_level ?? pr?.level ?? baseLevel(c.profile)
  return Math.min(4, Math.max(1, lv))
}

export function resolveItem(item: WorkoutItem, c: Ctx, depth = 0): Resolved | null {
  const id = (item.pos && c.profile.position && item.pos[c.profile.position]) || item.ex
  let e = adaptToPlace(id, c)
  if (!e) return null
  const warnings: string[] = []
  const base = baseLevel(c.profile)

  // Nível mínimo do aluno (academia e exercícios avançados)
  if (e.min_level > base && depth < 3) {
    const alt = e.alternatives.seguro ?? e.alternatives[c.place] ?? e.alternatives.casa
    if (!alt) return null
    return resolveItem({ ...item, ex: alt, pos: undefined }, c, depth + 1)
  }
  // Cautela / dor: sem saltos (troca pela versão segura ou remove)
  if (c.noJumps && e.is_jump) {
    const alt = e.alternatives.seguro
    if (!alt || depth >= 3) return null
    return resolveItem({ ...item, ex: alt, pos: undefined, reps: item.reps ? Math.max(6, item.reps) : item.reps }, c, depth + 1)
  }
  // Sem acompanhamento: prefere a versão sem carga (carga só em step-up e agachamento, sempre leve)
  if (!c.supervised && c.place === 'academia' && e.equipment.some((x) => ['halteres', 'barra'].includes(x)) && depth < 3) {
    const alt = e.alternatives.casa ?? e.alternatives.campo
    if (alt) return resolveItem({ ...item, ex: alt, pos: undefined }, c, depth + 1)
  }
  if (e.needs_supervision) warnings.push('Treine com a orientação de um profissional.')
  if (e.is_jump) warnings.push('Aterrissagem silenciosa, joelhos alinhados com os pés.')
  const level = levelFor(e, c)
  return { item: { ...item, ex: e.id }, ex: e, level, levelDef: e.levels.find((l) => l.n === level), swappedFrom: e.id !== item.ex ? item.ex : undefined, warnings }
}

export function resolveWorkout(w: Workout, c: Ctx) {
  const run = (items: WorkoutItem[]) => items.map((i) => resolveItem(i, c)).filter(Boolean) as Resolved[]
  return { warmup: run(w.warmup), main: run(w.main), cooldown: run(w.cooldown) }
}

/** Expande rotinas (ex.: domínio de bola em 3 min) em passos cronometrados. */
export function expandRoutine(r: Resolved, ex: Map<string, Exercise>): Resolved[] {
  if (!r.ex.routine?.length) return [r]
  return r.ex.routine.map((s) => ({ item: { ex: s.ex, sets: 1, secs: s.secs, rest: s.rest }, ex: ex.get(s.ex)!, level: r.level, warnings: [] })).filter((x) => x.ex)
}

/** Estimativa em minutos (série = tempo de execução + descanso). */
export function estimateMinutes(list: Resolved[]): number {
  let s = 0
  for (const r of list) {
    const sets = r.item.sets ?? 1
    const work = r.item.secs ? r.item.secs * (r.item.side ? 2 : 1) : (r.item.reps ?? 8) * 3
    const routine = r.ex.routine ? r.ex.routine.reduce((a, b) => a + b.secs + b.rest, 0) : 0
    s += routine || sets * work + (sets - 1) * (r.item.rest ?? 0)
    s += 10 // transição
  }
  return Math.round(s / 60)
}
