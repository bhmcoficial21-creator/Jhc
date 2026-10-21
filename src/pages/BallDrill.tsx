import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useData } from '../lib/data'
import { posAt, type Replay } from '../lib/replay'
import type { Frame } from '../lib/types'
import Board from '../components/Board'
import ReplayPlayer from '../components/replay/ReplayPlayer'
import { Btn, Card, Chip, Notice } from '../components/ui'

/** Vista de cima (prancheta 2D) montada a partir das trajetórias do replay. */
function framesOf(r: Replay): Frame[] {
  const w = r.pitch === 'court' ? 40 : 105, h = r.pitch === 'court' ? 20 : 68
  const times = [0, ...r.steps.map((s) => s.t), r.duration].filter((t, i, a) => a.indexOf(t) === i).sort((a, b) => a - b)
  return times.map((t) => {
    const hero = r.tracks.find((x) => x.hero)!
    return {
      players: r.tracks.map((tr) => { const p = posAt(tr, t); return { id: tr.id, team: tr.team, x: ((p.x + w / 2) / w) * 100, y: ((p.y + h / 2) / h) * 100, label: tr.hero ? 'VOCÊ' : undefined, me: tr.hero } }),
      ball: (() => { const p = posAt(hero, t); return { x: ((p.x + 0.6 + w / 2) / w) * 100, y: ((p.y + h / 2) / h) * 100 } })(),
      note: r.steps.filter((s) => s.t <= t + 0.01).slice(-1)[0]?.text,
    }
  })
}

export default function BallDrill() {
  const { id } = useParams(), d = useData()
  const r = d.content.replays.find((x) => x.id === id)
  const [top, setTop] = useState(false), [score, setScore] = useState<number | null>(null)
  const frames = useMemo(() => (r ? framesOf(r) : []), [r])
  if (!r) return <div className="page"><Link to="/app/bola" className="btn btn-ghost">← Treino com bola</Link></div>
  const pr = d.progress.get(r.id)
  return (
    <div className="page space-y-4">
      <Link to="/app/bola" className="text-sm text-lime underline">← Treino com bola</Link>
      <h1 className="text-4xl leading-none">{r.title}</h1>
      <p className="text-zinc-300">{r.summary}</p>
      <ReplayPlayer r={r} />
      <div className="flex gap-2"><Btn small variant={top ? 'ghost' : 'primary'} onClick={() => setTop(false)}>Replay 3D</Btn><Btn small variant={top ? 'primary' : 'ghost'} onClick={() => setTop(true)}>Vista de cima</Btn></div>
      {top && <Board field={r.pitch === 'court' ? 'futsal' : '11'} frames={frames} />}
      <Card className="space-y-2"><h2 className="text-2xl">Como fazer</h2><ol className="list-decimal space-y-1 pl-5 text-zinc-200">{r.how.map((s, i) => <li key={i}>{s}</li>)}</ol></Card>
      <Card className="space-y-1"><h2 className="text-2xl">Material e espaço</h2><p className="text-zinc-300">{r.setup}</p></Card>
      <Card className="space-y-1"><h2 className="text-2xl text-lime">Dicas</h2><ul className="list-disc space-y-1 pl-5 text-zinc-300">{r.tips.map((s, i) => <li key={i}>{s}</li>)}</ul></Card>
      <Card className="space-y-1"><h2 className="text-2xl text-danger">Erros comuns</h2><ul className="list-disc space-y-1 pl-5 text-zinc-300">{r.mistakes.map((s, i) => <li key={i}>{s}</li>)}</ul></Card>
      <Card className="space-y-3">
        <h2 className="text-2xl">Tente na quadra</h2>
        <p className="muted">Faça 10 repetições, primeiro devagar e depois no ritmo. Quantas saíram certas? Com 8 em 10 em duas sessões seguidas, o app sugere o próximo nível.</p>
        <div className="grid grid-cols-6 gap-2">{Array.from({ length: 11 }, (_, i) => <button key={i} onClick={async () => { setScore(i); await d.rateExercise(r.id, i) }} className={`min-h-[52px] rounded-xl border font-display text-2xl font-extrabold ${score === i ? 'border-lime bg-lime text-black' : 'border-line bg-panel2'}`}>{i}</button>)}</div>
        {score !== null && <Notice tone="info">Nota {score}/10 salva.{pr && pr.level > 1 ? ` Nível ${pr.level}.` : ''} Orientação geral de treino: pare se sentir dor.</Notice>}
        <div className="flex flex-wrap gap-1.5"><Chip>Parado</Chip><Chip>Em movimento</Chip><Chip>Com marcação leve</Chip><Chip>Velocidade de jogo</Chip></div>
      </Card>
    </div>
  )
}
