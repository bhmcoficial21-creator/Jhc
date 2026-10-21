import { useMemo, useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { resolveWorkout } from '../lib/adapt'
import { useAuth } from '../lib/auth'
import { useData } from '../lib/data'
import { buildSteps } from '../lib/steps'
import { workoutAt } from '../lib/schedule'
import type { Place, Workout as W } from '../lib/types'
import Runner from '../components/Runner'
import { Btn, Notice } from '../components/ui'

export default function Workout() {
  const { state } = useLocation() as { state: { place: Place; light?: boolean; programId?: string } | null }
  const d = useData(), { annual } = useAuth(), nav = useNavigate()
  const [started] = useState(() => Date.now())
  const [finished, setFinished] = useState(false)
  const [effort, setEffort] = useState(0), [pain, setPain] = useState(false), [saving, setSaving] = useState(false)

  const prog = state?.programId ? d.content.programs.find((p) => p.id === state.programId) ?? null : d.program
  const idx = prog ? (state?.programId && prog.id !== d.program?.id ? 0 : d.programIdx) : 0
  const at = prog ? workoutAt(prog, idx) : null
  const workout: W | null = at ? (state?.light ? at.week.workouts.find((w) => w.light) ?? at.workout : at.workout) : null
  const ctx = state ? d.ctxFor(state.place) : null
  const steps = useMemo(() => {
    if (!workout || !ctx) return []
    const r = resolveWorkout(workout, ctx)
    return [...buildSteps(r.warmup, 'warmup', d.exMap), ...buildSteps(r.main, 'main', d.exMap), ...buildSteps(r.cooldown, 'cooldown', d.exMap)]
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workout, ctx?.place, ctx?.noJumps])

  if (!state || !workout || !at || !prog || steps.length === 0) return <Navigate to="/app" replace />
  void annual

  if (finished) return (
    <div className="mx-auto flex min-h-screen max-w-xl flex-col gap-5 px-4 py-8">
      <h1 className="text-5xl leading-none text-lime">Treino concluído!</h1>
      <div><p className="mb-2 font-semibold">Qual foi o esforço? (1 leve · 10 máximo)</p>
        <div className="grid grid-cols-5 gap-2">{Array.from({ length: 10 }, (_, i) => i + 1).map((n) => <button key={n} onClick={() => setEffort(n)} className={`min-h-[56px] rounded-xl border font-display text-2xl font-extrabold ${effort === n ? 'border-lime bg-lime text-black' : 'border-line bg-panel2'}`}>{n}</button>)}</div></div>
      <label className="flex items-start gap-3 rounded-xl border border-line p-3 text-zinc-100"><input type="checkbox" className="mt-1 !h-6 !w-6" checked={pain} onChange={(e) => setPain(e.target.checked)} /><span>Senti <b>dor</b> durante ou depois do treino.</span></label>
      {pain && <Notice tone="danger">O próximo treino com saltos fica bloqueado até você confirmar que melhorou. Se a dor se repetir, procure um profissional de saúde presencialmente. Este app não faz diagnóstico.</Notice>}
      <Btn disabled={!effort || saving} className="mt-auto w-full" onClick={async () => {
        setSaving(true)
        await d.addSession({ kind: state.light ? 'extra' : 'treino', program_id: prog.id, week: at.weekNo, workout_idx: at.widx, location: state.place, effort, pain, heavy: workout.heavy && !state.light, duration_s: Math.round((Date.now() - started) / 1000) })
        if (pain) await d.saveProfile({ pain_block: true })
        nav('/app', { replace: true })
      }}>{saving ? 'Salvando…' : 'Salvar treino'}</Btn>
    </div>
  )
  return <Runner steps={steps} title={workout.title} onExit={() => nav('/app', { replace: true })} onDone={() => setFinished(true)} onRate={(id, n) => d.rateExercise(id, n)} />
}
