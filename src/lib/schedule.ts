import type { Program, ProgramWeek, SessionRow, Workout } from './types'
import { iso } from './planner'

/** Dias da semana de treino (0=dom). Nunca dois treinos pesados em dias seguidos. */
export const SCHEDULE: Record<2 | 3 | 4, number[]> = { 2: [2, 5], 3: [1, 3, 5], 4: [1, 3, 5, 6] }
export const PER_WEEK = 3

export function workoutAt(p: Program, idx: number): { week: ProgramWeek; workout: Workout; weekNo: number; widx: number } | null {
  const weekNo = Math.floor(idx / PER_WEEK) + 1, widx = idx % PER_WEEK
  const week = p.weeks[weekNo - 1]
  return week?.workouts[widx] ? { week, workout: week.workouts[widx], weekNo, widx } : null
}
export const totalWorkouts = (p: Program) => p.weeks.length * PER_WEEK
export const doneCount = (sessions: SessionRow[], programId: string) => sessions.filter((s) => s.kind === 'treino' && s.program_id === programId).length

/** Bloqueia treino pesado se o último treino pesado foi ontem (ou hoje). */
export function heavyBlocked(sessions: SessionRow[], today = new Date()): boolean {
  const y = new Date(today.getTime() - 86_400_000)
  return sessions.some((s) => (s.kind === 'treino' || s.kind === 'extra') && s.heavy && [iso(y), iso(today)].includes(iso(new Date(s.completed_at))))
}

/** Sequência de dias treinados. */
export function streak(sessions: SessionRow[], today = new Date()): number {
  const days = new Set(sessions.map((s) => iso(new Date(s.completed_at))))
  let n = 0, d = new Date(today)
  if (!days.has(iso(d))) d = new Date(d.getTime() - 86_400_000)
  while (days.has(iso(d))) { n++; d = new Date(d.getTime() - 86_400_000) }
  return n
}
