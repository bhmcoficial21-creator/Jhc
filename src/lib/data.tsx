import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { useAuth } from './auth'
import { loadContent, type Content } from './content'
import { baseLevel, type Ctx } from './adapt'
import { PER_WEEK, doneCount, totalWorkouts } from './schedule'
import { insertRow, listRows, upsertRow, flushOutbox } from './store'
import { lsGet, lsSet } from './supabase'
import { iso } from './planner'
import type { ExProgress, Place, Profile, Program, Season, SessionRow, TestRow } from './types'

interface DailyCheck { day: string; feel: number; pain: boolean }
interface PostGame { id?: string; day: string; feel: number; pain: boolean; severe: boolean }
interface QuizAttempt { lesson_id: string; correct: number; total: number; created_at: string }
interface MissionLog { mission_id: string; day: string; result: 'sim' | 'mais_ou_menos' | 'nao' }

interface Data {
  loading: boolean; error: string | null; fromCache: boolean
  content: Content; profile: Profile | null
  sessions: SessionRow[]; progress: Map<string, ExProgress>; tests: TestRow[]; season: Season | null
  checks: DailyCheck[]; postgames: PostGame[]; attempts: QuizAttempt[]; missions: MissionLog[]
  exMap: Map<string, Content['exercises'][number]>
  program: Program | null; programIdx: number; programDone: boolean; nextProgram: Program | null; bonus: Program[]
  reload: () => Promise<void>
  saveProfile: (p: Partial<Profile>) => Promise<void>
  addSession: (s: Partial<SessionRow>) => Promise<void>
  rateExercise: (exId: string, score: number) => Promise<void>
  saveTest: (t: TestRow) => Promise<void>
  saveSeason: (s: Season) => Promise<void>
  saveCheck: (c: DailyCheck) => Promise<void>
  savePostgame: (p: PostGame) => Promise<void>
  saveAttempt: (a: Omit<QuizAttempt, 'created_at'>) => Promise<void>
  saveMission: (m: MissionLog) => Promise<void>
  startProgram: (id: string) => Promise<void>
  ctxFor: (place: Place, o?: { noJumps?: boolean }) => Ctx | null
  supervised: boolean; setSupervised: (v: boolean) => void
}
const D = createContext<Data>(null!)
export const useData = () => useContext(D)

const EMPTY: Content = { exercises: [], programs: [], lessons: [], quiz: [], missions: [], guide: [], refs: [], replays: [] }

export function DataProvider({ children }: { children: ReactNode }) {
  const { user, annual } = useAuth()
  const uid = user!.id
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [fromCache, setFromCache] = useState(false)
  const [content, setContent] = useState<Content>(EMPTY)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [sessions, setSessions] = useState<SessionRow[]>([])
  const [progress, setProgress] = useState<Map<string, ExProgress>>(new Map())
  const [tests, setTests] = useState<TestRow[]>([])
  const [season, setSeason] = useState<Season | null>(null)
  const [checks, setChecks] = useState<DailyCheck[]>([])
  const [postgames, setPostgames] = useState<PostGame[]>([])
  const [attempts, setAttempts] = useState<QuizAttempt[]>([])
  const [missions, setMissions] = useState<MissionLog[]>([])
  const [ups, setUps] = useState<{ program_id: string; started_at: string; completed_at?: string | null }[]>([])
  const [supervised, setSup] = useState(() => lsGet('vp:supervised', false))

  const reload = useCallback(async () => {
    try {
      await flushOutbox()
      const [c, pr, se, xp, te, ss, dc, pg, qa, ml, up] = await Promise.all([
        loadContent(), listRows<Profile>('profiles', { userId: uid }), listRows<SessionRow>('sessions', { userId: uid, order: 'completed_at' }),
        listRows<ExProgress>('exercise_progress', { userId: uid }), listRows<TestRow>('tests', { userId: uid }), listRows<Season & { user_id: string }>('season', { userId: uid }),
        listRows<DailyCheck>('daily_checks', { userId: uid }), listRows<PostGame>('postgame', { userId: uid }), listRows<QuizAttempt>('quiz_attempts', { userId: uid }),
        listRows<MissionLog>('mission_logs', { userId: uid }), listRows<{ program_id: string; started_at: string; completed_at?: string | null }>('user_programs', { userId: uid }),
      ])
      setContent(c.content); setFromCache(c.fromCache)
      setProfile(pr.find((p) => p.user_id === uid) ?? null)
      setSessions([...se].sort((a, b) => b.completed_at.localeCompare(a.completed_at)))
      setProgress(new Map(xp.map((x) => [x.exercise_id, x]))); setTests(te)
      setSeason(ss[0] ?? null); setChecks(dc); setPostgames(pg); setAttempts(qa); setMissions(ml); setUps(up)
      setError(null)
      lsSet('vp:cache:user', { profile: pr[0] ?? null })
    } catch (e) { setError((e as Error).message ?? 'Erro ao carregar') } finally { setLoading(false) }
  }, [uid])
  useEffect(() => { reload() }, [reload])
  useEffect(() => { const f = () => reload(); window.addEventListener('online', f); return () => window.removeEventListener('online', f) }, [reload])

  const exMap = useMemo(() => new Map(content.exercises.map((e) => [e.id, e])), [content.exercises])

  // ----- Programa atual: o último iniciado e não concluído; senão o próximo liberado (1 por mês, definido pelo admin) -----
  const { program, programIdx, programDone, nextProgram, bonus } = useMemo(() => {
    const started = profile?.terms_accepted_at ? new Date(profile.terms_accepted_at) : new Date()
    const months = Math.max(0, Math.floor((Date.now() - started.getTime()) / (30 * 86_400_000)))
    const avail = content.programs.filter((p) => p.published && (!p.annual_only || annual))
    const regular = avail.filter((p) => !p.annual_only && p.release_month <= months).sort((a, b) => a.order_idx - b.order_idx)
    const bonusList = avail.filter((p) => p.annual_only)
    const finished = (p: Program) => doneCount(sessions, p.id) >= totalWorkouts(p)
    const active = [...ups].sort((a, b) => b.started_at.localeCompare(a.started_at)).map((u) => avail.find((p) => p.id === u.program_id)).find((p) => p && !finished(p))
    const cur = active ?? regular.find((p) => !finished(p)) ?? null
    const done = !cur && regular.length > 0
    const nxt = content.programs.filter((p) => p.published && !p.annual_only && !regular.includes(p) && !finished(p)).sort((a, b) => a.release_month - b.release_month)[0] ?? null
    return { program: cur, programIdx: cur ? doneCount(sessions, cur.id) : 0, programDone: done, nextProgram: nxt, bonus: bonusList }
  }, [content.programs, sessions, ups, profile?.terms_accepted_at, annual])

  const saveProfile = useCallback(async (p: Partial<Profile>) => {
    const row = { ...(profile ?? { equipment: {}, locations: [], health_areas: [], caution: false, pain_block: false, onboarded: false, guardian_ok: false, health_pain: false }), ...p, user_id: uid }
    setProfile(row as Profile)
    await upsertRow('profiles', row, 'user_id')
  }, [profile, uid])

  const addSession = useCallback(async (s: Partial<SessionRow>) => {
    const row = { kind: 'treino', pain: false, heavy: false, completed_at: new Date().toISOString(), ...s, user_id: uid } as SessionRow
    setSessions((x) => [{ ...row, id: row.id ?? crypto.randomUUID() }, ...x])
    await insertRow('sessions', row)
  }, [uid])

  // 8 em 10 em duas sessões seguidas sobe o nível (máx. 4)
  const rateExercise = useCallback(async (exId: string, score: number) => {
    const cur = progress.get(exId) ?? { exercise_id: exId, level: profile ? baseLevel(profile) : 1, scores: [] as number[], forced_level: null }
    const scores = [...cur.scores, score].slice(-2)
    const up = scores.length === 2 && scores.every((x) => x >= 8)
    const row = { ...cur, user_id: uid, scores: up ? [] : scores, level: up ? Math.min(4, cur.level + 1) : cur.level }
    setProgress((m) => new Map(m).set(exId, row))
    await upsertRow('exercise_progress', row, 'user_id,exercise_id')
  }, [progress, profile, uid])

  const saveTest = useCallback(async (t: TestRow) => { setTests((x) => [...x.filter((y) => !(y.kind === t.kind && y.phase === t.phase)), t]); await upsertRow('tests', { ...t, user_id: uid }, 'user_id,kind,phase') }, [uid])
  const saveSeason = useCallback(async (s: Season) => { setSeason(s); await upsertRow('season', { ...s, user_id: uid }, 'user_id') }, [uid])
  const saveCheck = useCallback(async (c: DailyCheck) => { setChecks((x) => [...x.filter((y) => y.day !== c.day), c]); await upsertRow('daily_checks', { ...c, user_id: uid }, 'user_id,day') }, [uid])
  const savePostgame = useCallback(async (p: PostGame) => { setPostgames((x) => [...x, p]); await insertRow('postgame', { ...p, user_id: uid }) }, [uid])
  const saveAttempt = useCallback(async (a: Omit<QuizAttempt, 'created_at'>) => { const row = { ...a, created_at: new Date().toISOString() }; setAttempts((x) => [...x, row]); await insertRow('quiz_attempts', { ...row, user_id: uid }) }, [uid])
  const saveMission = useCallback(async (m: MissionLog) => { setMissions((x) => [...x, m]); await insertRow('mission_logs', { ...m, user_id: uid }) }, [uid])
  const startProgram = useCallback(async (id: string) => {
    const row = { program_id: id, started_at: new Date().toISOString() }
    setUps((x) => [...x.filter((u) => u.program_id !== id), row]); await upsertRow('user_programs', { ...row, user_id: uid }, 'user_id,program_id')
  }, [uid])

  const setSupervised = (v: boolean) => { setSup(v); lsSet('vp:supervised', v) }
  const ctxFor = useCallback((place: Place, o: { noJumps?: boolean } = {}): Ctx | null => profile ? ({
    ex: exMap, profile, place, progress, supervised,
    noJumps: !!(o.noJumps || profile.caution || profile.pain_block),
  }) : null, [exMap, profile, progress, supervised])

  const value: Data = { loading, error, fromCache, content, profile, sessions, progress, tests, season, checks, postgames, attempts, missions, exMap, program, programIdx, programDone, nextProgram, bonus, reload, saveProfile, addSession, rateExercise, saveTest, saveSeason, saveCheck, savePostgame, saveAttempt, saveMission, startProgram, ctxFor, supervised, setSupervised }
  return <D.Provider value={value}>{children}</D.Provider>
}
export { PER_WEEK, iso }
