import { Link } from 'react-router-dom'
import { useData } from '../lib/data'
import { streak } from '../lib/schedule'
import { Card, Chip } from '../components/ui'
import { TestChart, testSummary } from './Tests'

export default function Progress() {
  const d = useData()
  const treinos = d.sessions.filter((s) => s.kind === 'treino' || s.kind === 'extra')
  // treinos concluídos nas últimas 8 semanas
  const weeks = Array.from({ length: 8 }, (_, i) => {
    const end = Date.now() - (7 - i) * 7 * 86_400_000, start = end - 7 * 86_400_000
    return treinos.filter((s) => { const t = Date.parse(s.completed_at); return t > start && t <= end }).length
  })
  const max = Math.max(3, ...weeks)
  const levels = [...d.progress.values()].filter((p) => p.level > 1 || p.forced_level)
  const passed = new Set(d.attempts.filter((a) => a.correct / a.total >= 0.8).map((a) => a.lesson_id))
  return (
    <div className="page space-y-4">
      <h1 className="text-5xl leading-none">Progresso</h1>
      <div className="grid grid-cols-2 gap-3">
        <Card><div className="font-display text-6xl font-extrabold leading-none text-lime">{streak(d.sessions)}</div><p className="muted">dias seguidos treinando</p></Card>
        <Card><div className="font-display text-6xl font-extrabold leading-none">{treinos.length}</div><p className="muted">treinos concluídos</p></Card>
      </div>
      <Card className="space-y-2"><h2 className="text-2xl">Treinos por semana</h2>
        <svg viewBox="0 0 240 90" className="w-full" role="img" aria-label="Treinos por semana">{weeks.map((v, i) => <g key={i}><rect x={i * 30 + 4} y={78 - (v / max) * 70} width="22" height={Math.max(1, (v / max) * 70)} rx="3" fill={v ? '#c6ff00' : '#2a2a2a'} /><text x={i * 30 + 15} y="88" fontSize="8" textAnchor="middle" fill="#888">{i === 7 ? 'esta' : `-${7 - i}`}</text>{v > 0 && <text x={i * 30 + 15} y={74 - (v / max) * 70} fontSize="9" textAnchor="middle" fill="#fff">{v}</text>}</g>)}</svg></Card>
      <Card className="space-y-3"><div className="flex items-center justify-between"><h2 className="text-2xl">Testes</h2><Link to="/app/testes" className="btn btn-primary btn-sm">Fazer teste</Link></div>
        {d.tests.length === 0 ? <p className="muted">Faça os testes nas semanas 1, 4 e 8 para ver sua evolução.</p> : <TestChart tests={d.tests} />}
        {testSummary(d.tests).map((s) => <p key={s.kind} className="text-sm">{s.label}: <b className={s.pct >= 0 ? 'text-lime' : 'text-danger'}>{s.pct >= 0 ? '+' : ''}{s.pct.toFixed(1).replace('.', ',')}%</b> <span className="muted">desde a semana 1</span></p>)}
      </Card>
      {levels.length > 0 && <Card className="space-y-2"><h2 className="text-2xl">Níveis que subiram</h2>{levels.map((p) => <p key={p.exercise_id} className="flex justify-between text-sm"><span>{d.exMap.get(p.exercise_id)?.name ?? p.exercise_id}</span><Chip on>Nível {p.forced_level ?? p.level}</Chip></p>)}</Card>}
      <Card><h2 className="text-2xl">Leitura de jogo</h2><p className="muted">{passed.size} lições concluídas no quiz · {d.missions.length} missões registradas</p></Card>
      <Card><h2 className="mb-1 text-2xl">Últimos treinos</h2><ul className="divide-y divide-line text-sm">{treinos.slice(0, 6).map((s) => <li key={s.id} className="flex justify-between py-2"><span>{new Date(s.completed_at).toLocaleDateString('pt-BR')} · {s.location}</span><span className="muted">esforço {s.effort ?? '-'}{s.pain ? ' · dor' : ''}</span></li>)}{treinos.length === 0 && <li className="py-2 muted">Nenhum treino ainda.</li>}</ul></Card>
    </div>
  )
}
