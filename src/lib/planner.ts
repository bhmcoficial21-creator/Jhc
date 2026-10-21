import type { Season } from './types'

export type Load = 'LEVE' | 'NORMAL' | 'PESADO'
export interface DayPlan {
  date: string; load: Load; tag: 'JOGO' | 'PRÉ-JOGO' | 'RECUPERAÇÃO' | 'FINAL' | null
  allowJumps: boolean; allowSprints: boolean; recoveryOnly: boolean; gameDay: boolean; reason: string
}
const DAY = 86_400_000
export const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
const parse = (s: string) => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d, 12) }
const addDays = (s: string, n: number) => iso(new Date(parse(s).getTime() + n * DAY))
const diffDays = (a: string, b: string) => Math.round((parse(a).getTime() - parse(b).getTime()) / DAY)

/** Conjunto de datas de jogo (inclui "todo sábado/domingo" até a final e a própria final). */
export function gameDates(season: Season | null, from: string, horizonDays = 120): Set<string> {
  const set = new Set<string>(season?.game_dates ?? [])
  if (!season) return set
  if (season.final_date) set.add(season.final_date)
  if (season.mode === 'sabado' || season.mode === 'domingo') {
    const want = season.mode === 'sabado' ? 6 : 0
    const end = season.final_date ?? addDays(from, horizonDays)
    for (let d = addDays(from, -7); d <= end; d = addDays(d, 1)) if (parse(d).getDay() === want) set.add(d)
  }
  return set
}

export function dayPlan(date: string, season: Season | null, opts: { heavyScheduled?: boolean } = {}): DayPlan {
  const games = gameDates(season, date)
  const base = { date, allowJumps: true, allowSprints: true, recoveryOnly: false, gameDay: false }
  if (games.has(date)) return { ...base, load: 'PESADO', tag: 'JOGO', allowJumps: false, allowSprints: false, gameDay: true, reason: 'Dia de jogo: só aquecimento de jogo e, depois, o pós-jogo.' }
  if (games.has(addDays(date, -1))) return { ...base, load: 'LEVE', tag: 'RECUPERAÇÃO', allowJumps: false, allowSprints: false, recoveryOnly: true, reason: 'Dia seguinte ao jogo: só recuperação. Muita lesão só aparece depois que o músculo esfria.' }
  if (games.has(addDays(date, 1)) || games.has(addDays(date, 2))) return { ...base, load: 'LEVE', tag: 'PRÉ-JOGO', allowJumps: false, allowSprints: false, reason: 'Nas 48 horas antes do jogo: sem saltos intensos nem arrancadas máximas. Só aquecimento, mobilidade e treino leve.' }
  const fin = season?.final_date
  if (fin && diffDays(fin, date) >= 0 && diffDays(fin, date) <= 6) return { ...base, load: 'LEVE', tag: 'FINAL', reason: 'Semana da final: carga reduzida.' }
  return { ...base, load: opts.heavyScheduled ? 'PESADO' : 'NORMAL', tag: null, reason: 'Semana normal.' }
}

export function nextDays(from: string, n: number, season: Season | null) {
  return Array.from({ length: n }, (_, i) => dayPlan(addDays(from, i), season))
}
export { addDays }
