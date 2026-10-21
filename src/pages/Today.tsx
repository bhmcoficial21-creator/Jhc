import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { estimateMinutes, resolveWorkout } from '../lib/adapt'
import { useAuth } from '../lib/auth'
import { useData } from '../lib/data'
import { dayPlan, iso, nextDays, type Load } from '../lib/planner'
import { PER_WEEK, heavyBlocked, workoutAt } from '../lib/schedule'
import { FIELD_TIPS, TIP_NOTE } from '../lib/tips'
import { lsGet, lsSet } from '../lib/supabase'
import type { Place, Workout } from '../lib/types'
import { Btn, Card, Chip, LinkBtn, Lock, Notice, Spinner } from '../components/ui'

const PLACES: { v: Place; l: string }[] = [{ v: 'casa', l: 'Casa' }, { v: 'academia', l: 'Academia' }, { v: 'campo', l: 'Campo ou quadra' }]
const LOAD_STYLE: Record<Load, string> = { LEVE: 'bg-sky-400 text-black', NORMAL: 'bg-zinc-300 text-black', PESADO: 'bg-danger text-black' }
const WD = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb']

export default function Today() {
  const d = useData(), { annual } = useAuth(), nav = useNavigate()
  const profile = d.profile!
  const [place, setPlaceS] = useState<Place>(() => { const s = lsGet<Place | null>('vp:place', null); return s ?? profile.locations[0] ?? 'casa' })
  const setPlace = (p: Place) => { setPlaceS(p); lsSet('vp:place', p) }
  const today = iso(new Date())
  const at = d.program ? workoutAt(d.program, d.programIdx) : null

  const plan = useMemo(() => dayPlan(today, annual ? d.season : null, { heavyScheduled: !!at?.workout.heavy }), [today, annual, d.season, at])
  const lightOf = (): Workout | null => d.program && at ? (at.week.workouts.find((w) => w.light) ?? null) : null
  const blockedHeavy = !!at?.workout.heavy && heavyBlocked(d.sessions)
  const noJumps = profile.caution || profile.pain_block || (annual && !plan.allowJumps)
  const useLight = !!at && (blockedHeavy || (annual && (plan.load === 'LEVE')) )
  const chosen: Workout | null = at ? (useLight ? lightOf() ?? at.workout : at.workout) : null
  const ctx = d.ctxFor(place, { noJumps })
  const resolved = chosen && ctx ? resolveWorkout(chosen, ctx) : null
  const minutes = resolved ? estimateMinutes([...resolved.warmup, ...resolved.main, ...resolved.cooldown]) : 0
  const doneToday = d.sessions.some((s) => iso(new Date(s.completed_at)) === today && (s.kind === 'treino' || s.kind === 'extra'))
  const check = d.checks.find((c) => c.day === today)
  const [feel, setFeel] = useState(0), [checkPain, setCheckPain] = useState(false)

  if (d.loading) return <Spinner />
  const mission = d.content.missions.find((m) => m.positions.includes(profile.position!)) ?? d.content.missions[0]
  const lesson = mission && d.content.lessons.find((l) => l.id === mission.lesson_id)
  const lastLog = mission && d.missions.filter((m) => m.mission_id === mission.id).sort((a, b) => b.day.localeCompare(a.day))[0]
  const upcoming = annual ? nextDays(today, 7, d.season) : []
  const gameSoon = annual && upcoming.slice(0, 3).some((u) => u.gameDay || u.tag === 'PRÉ-JOGO')
  const start = () => nav('/app/treino', { state: { place, light: useLight } })
  const supervisedNeeded = place === 'academia'

  return (
    <div className="page space-y-4">
      <div className="flex items-end justify-between">
        <div><p className="muted">{new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}</p><h1 className="text-5xl leading-none">Hoje</h1></div>
        {d.program && at && <div className="text-right"><Chip on>{at.week.phase}</Chip><p className="muted mt-1">Semana {at.weekNo} de {d.program.weeks.length}</p></div>}
      </div>

      {profile.caution && <Notice tone="danger"><b>Perfil em cautela:</b> sem exercícios de salto até você confirmar a liberação de um profissional de saúde.
        <Btn small variant="ghost" className="mt-2 w-full" onClick={() => confirm('Confirmo que fui liberado(a) por um profissional de saúde para treinar com saltos.') && d.saveProfile({ caution: false })}>Fui liberado por um profissional</Btn></Notice>}
      {profile.pain_block && <Notice tone="danger"><b>Você marcou dor no último treino.</b> Saltos bloqueados até confirmar que melhorou. Se a dor se repetir, procure um profissional de saúde presencialmente.
        <Btn small variant="ghost" className="mt-2 w-full" onClick={() => d.saveProfile({ pain_block: false })}>Melhorei, liberar saltos</Btn></Notice>}

      {/* Planner (anual) ou convite (mensal) */}
      {annual ? (
        <Card className="space-y-3">
          <div className="flex items-center justify-between"><h2 className="text-2xl">Sua semana</h2><Link to="/app/planner" className="text-sm text-lime underline">Editar datas</Link></div>
          <div className="grid grid-cols-7 gap-1.5">{upcoming.map((u) => { const dt = new Date(u.date + 'T12:00:00'); return (
            <div key={u.date} className="text-center"><div className="text-[11px] uppercase text-zinc-400">{WD[dt.getDay()]}</div>
              <div className={`mt-1 rounded-lg py-1 font-display text-lg font-extrabold ${LOAD_STYLE[u.load]}`}>{dt.getDate()}</div>
              <div className="mt-0.5 text-[9px] font-bold uppercase leading-tight text-zinc-300">{u.tag === 'JOGO' ? 'JOGO' : u.load}</div></div>) })}</div>
          <p className="muted">{plan.reason}</p>
          <div className="flex gap-2"><LinkBtn to="/app/pos-jogo" small className="flex-1">JOGUEI HOJE</LinkBtn></div>
        </Card>
      ) : (
        <Card className="space-y-2 opacity-90"><div className="flex items-center justify-between"><h2 className="text-2xl"><Lock className="mr-1 text-zinc-500" />Calendário de jogos</h2><Chip>Plano anual</Chip></div>
          <p className="muted">LEVE, NORMAL ou PESADO conforme seus jogos, e o botão JOGUEI HOJE com o protocolo de pós-jogo, ficam no plano anual.</p>
          <LinkBtn to="/app/perfil" variant="ghost" small className="w-full">Conhecer o plano anual</LinkBtn></Card>
      )}

      <LinkBtn to="/app/aquecer-jogo" variant="ghost" className="w-full">AQUECER PARA O JOGO · 10 min</LinkBtn>
      <LinkBtn to="/app/bola" className="w-full">TREINO COM BOLA · REPLAYS 3D</LinkBtn>

      {/* Dia seguinte ao jogo: só recuperação */}
      {annual && plan.recoveryOnly ? (
        <Card className="space-y-3">
          <h2 className="text-3xl">Como você acordou hoje?</h2>
          {check ? <Notice tone="info">Registrado: {check.feel}/5{check.pain ? ' · com dor' : ''}.</Notice> : <>
            <div className="grid grid-cols-5 gap-2">{[1, 2, 3, 4, 5].map((n) => <button key={n} onClick={() => setFeel(n)} className={`min-h-[56px] rounded-xl border font-display text-2xl font-extrabold ${feel === n ? 'border-lime bg-lime text-black' : 'border-line bg-panel2'}`}>{n}</button>)}</div>
            <p className="muted">1 = muito mal · 5 = ótimo</p>
            <label className="flex items-center gap-3 text-zinc-100"><input type="checkbox" className="!h-6 !w-6" checked={checkPain} onChange={(e) => setCheckPain(e.target.checked)} />Estou com dor</label>
            <Btn disabled={!feel} className="w-full" onClick={async () => { await d.saveCheck({ day: today, feel, pain: checkPain }); if (checkPain) await d.saveProfile({ pain_block: true }) }}>Registrar</Btn></>}
          {(checkPain || (check?.pain)) && <Notice tone="danger">Com dor, evite saltos e arrancadas e procure um profissional de saúde se ela persistir. Este app não faz diagnóstico.</Notice>}
          <p className="muted">Hoje é dia de recuperação: sem treino pesado. Faça o protocolo leve abaixo.</p>
          <LinkBtn to="/app/pos-jogo" className="w-full">Protocolo de recuperação</LinkBtn>
        </Card>
      ) : annual && plan.gameDay ? (
        <Card className="space-y-2"><h2 className="text-3xl">Dia de jogo</h2><p className="text-zinc-300">Sem treino hoje. Faça o aquecimento de jogo e, depois da partida, o pós-jogo.</p><LinkBtn to="/app/pos-jogo" className="w-full">JOGUEI HOJE</LinkBtn></Card>
      ) : d.program && at && chosen ? (
        <Card className="space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div><p className="muted">{d.program.name}</p><h2 className="text-3xl leading-none">{chosen.title}</h2></div>
            <div className="text-right"><Chip on={!chosen.heavy}>{chosen.heavy ? 'Pesado' : 'Leve'}</Chip><p className="muted mt-1">~{minutes} min</p></div>
          </div>
          {(useLight && (blockedHeavy || plan.load === 'LEVE')) && <Notice tone="info">{blockedHeavy ? 'Você fez um treino pesado ontem: hoje o app oferece a versão leve, nunca dois pesados em dias seguidos.' : plan.reason}</Notice>}

          <div><p className="muted mb-2">LOCAL DE HOJE</p>
            <div className="grid grid-cols-3 gap-2">{PLACES.map((p) => <button key={p.v} onClick={() => setPlace(p.v)} className={`min-h-[56px] rounded-xl border px-1 font-display text-lg font-bold uppercase leading-tight ${place === p.v ? 'border-lime bg-lime text-black' : 'border-line bg-panel2'}`}>{p.l}</button>)}</div></div>

          {supervisedNeeded && <label className="flex items-start gap-3 rounded-xl border border-line p-3 text-sm text-zinc-200"><input type="checkbox" className="mt-0.5 !h-5 !w-5" checked={d.supervised} onChange={(e) => d.setSupervised(e.target.checked)} /><span>Hoje tenho acompanhamento de um profissional na academia. <span className="text-zinc-500">Sem acompanhamento, o app prefere versões sem carga.</span></span></label>}
          {supervisedNeeded && <Notice>Exercícios de caixa, carga ou barra: treine com a orientação de um profissional. Nada de drop jump, salto com barra nas costas ou caixa acima de 60 cm.</Notice>}
          {noJumps && <Notice tone="warn">Hoje o treino não tem saltos{profile.caution ? ' (perfil em cautela)' : profile.pain_block ? ' (dor marcada)' : ' (planner)'}.</Notice>}

          {resolved && <ul className="divide-y divide-line rounded-xl border border-line">
            {resolved.main.map((r, k) => <li key={k} className="flex items-center justify-between gap-2 px-3 py-2.5">
              <div><div className="font-semibold">{r.ex.name}</div><div className="muted">{r.swappedFrom ? 'versão do local · ' : ''}Nível {r.level}</div></div>
              <div className="font-display text-xl font-bold text-lime">{r.item.sets && r.item.sets > 1 ? `${r.item.sets}×` : ''}{r.item.secs ? `${r.item.secs}s` : r.item.reps}</div></li>)}
          </ul>}
          {doneToday && <Notice tone="info">Você já treinou hoje. Pode treinar de novo, mas descanse se estiver cansado.</Notice>}
          <Btn className="w-full !min-h-[64px] !text-2xl" onClick={start}>COMEÇAR</Btn>
          <p className="muted text-center">Aquecimento dinâmico obrigatório · alongamento parado só na volta à calma</p>
          {profile.days_per_week === 4 && <p className="muted text-center">4º dia: opcional e leve, feito pelo botão "treino leve" abaixo.</p>}
        </Card>
      ) : d.programDone ? (
        <Card className="space-y-2"><h2 className="text-3xl">Programa concluído 🎉</h2><p className="text-zinc-300">{d.nextProgram ? `O próximo programa (${d.nextProgram.name}) é liberado em breve.` : 'Novos programas são liberados ao longo da assinatura.'}</p></Card>
      ) : <Card><p className="text-zinc-300">Nenhum programa disponível ainda. Fale com o suporte.</p></Card>}

      {profile.days_per_week === 4 && at && !doneToday && <Btn variant="ghost" className="w-full" onClick={() => nav('/app/treino', { state: { place, light: true } })}>Treino leve extra</Btn>}

      {/* Brinde do plano anual */}
      <Card className="space-y-2">
        <div className="flex items-center justify-between"><h2 className="text-2xl">{annual ? 'Brinde do plano anual' : <><Lock className="mr-1 text-zinc-500" />Brinde do plano anual</>}</h2>{!annual && <Chip>Bloqueado</Chip>}</div>
        {annual ? <div className="grid gap-2">
          {d.bonus.map((p) => <Btn key={p.id} variant="ghost" className="w-full" onClick={async () => { await d.startProgram(p.id); nav('/app/treino', { state: { place, light: false, programId: p.id } }) }}>Pré-temporada da Várzea</Btn>)}
          <LinkBtn to="/app/guia" variant="ghost" className="w-full">Guia de aquecimento, mobilidade e alongamento</LinkBtn>
          <LinkBtn to="/app/planner" variant="ghost" className="w-full">Planner de temporada</LinkBtn>
          <LinkBtn to="/app/pos-jogo" variant="ghost" className="w-full">Protocolo de pós-jogo</LinkBtn></div>
          : <><ul className="muted list-disc pl-5"><li>Programa bônus Pré-temporada da Várzea</li><li>Guia de aquecimento, mobilidade e alongamento</li><li>Planner de temporada</li><li>Protocolo de pós-jogo</li></ul><LinkBtn to="/app/perfil" small className="w-full">MIGRAR PARA O ANUAL</LinkBtn></>}
      </Card>

      {/* Missão do jogo e dica de campo */}
      {mission && <Card className="space-y-2">
        <div className="flex items-center justify-between"><h2 className="text-2xl">Missão do jogo</h2>{gameSoon && <Chip on>Jogo perto</Chip>}</div>
        <p className="font-semibold">{mission.title}</p><p className="muted">{mission.body}</p>
        <p className="muted mt-1">Depois do jogo: conseguiu?</p>
        <div className="grid grid-cols-3 gap-2">{([['sim', 'Sim'], ['mais_ou_menos', 'Mais ou menos'], ['nao', 'Não']] as const).map(([v, l]) =>
          <button key={v} onClick={() => d.saveMission({ mission_id: mission.id, day: today, result: v })} className={`min-h-[52px] rounded-xl border text-sm font-bold ${lastLog?.day === today && lastLog.result === v ? 'border-lime bg-lime text-black' : 'border-line bg-panel2'}`}>{l}</button>)}</div>
        {lastLog && lesson && <Link to={`/app/aprender/${lesson.id}`} className="block text-sm text-lime underline">Próxima lição sugerida: {lesson.title}</Link>}
      </Card>}
      {profile.field_type && <Card><h3 className="text-xl">Antes do jogo · {profile.field_type}</h3><p className="mt-1 text-sm text-zinc-300">{FIELD_TIPS[profile.field_type]}</p><p className="muted mt-1">{TIP_NOTE}</p></Card>}
      <p className="muted text-center">Treino {Math.min(d.programIdx + 1, (d.program?.weeks.length ?? 8) * PER_WEEK)} de {(d.program?.weeks.length ?? 8) * PER_WEEK}</p>
    </div>
  )
}
