import { Link, useParams } from 'react-router-dom'
import { baseLevel, levelFor } from '../lib/adapt'
import { useData } from '../lib/data'
import ExerciseViewer from '../components/ExerciseViewer'
import { Card, Chip, Notice } from '../components/ui'
import { MapButton } from './Library'

export default function ExercisePage() {
  const { id } = useParams(), d = useData()
  const ex = d.exMap.get(id!)
  if (!ex) return <div className="page"><Link to="/app/biblioteca" className="btn btn-ghost">← Biblioteca</Link><p className="mt-4">Exercício não encontrado.</p></div>
  const ctx = d.ctxFor('casa')
  const level = ctx ? levelFor(ex, ctx) : baseLevel({ level: 'iniciante' })
  return (
    <div className="page space-y-4">
      <Link to="/app/biblioteca" className="text-sm text-lime underline">← Biblioteca</Link>
      <h1 className="text-4xl leading-none">{ex.name}</h1>
      <p className="text-zinc-300">{ex.objective}</p>
      <div className="flex flex-wrap gap-1.5">{ex.locations.map((l) => <Chip key={l} on>{l}</Chip>)}{ex.equipment.map((e) => <Chip key={e}>{e}</Chip>)}<Chip>espaço {ex.min_space}</Chip></div>
      {ex.needs_supervision && <Notice>Treine com a orientação de um profissional.</Notice>}
      {d.profile?.caution && ex.is_jump && <Notice tone="danger">Seu perfil está em cautela: exercícios de salto ficam bloqueados nos treinos.</Notice>}
      <ExerciseViewer ex={ex} level={level} />
      <Card><h3 className="mb-1 text-xl">Erros comuns</h3><ul className="list-disc space-y-1 pl-5 text-zinc-300">{ex.mistakes.map((m, i) => <li key={i}>{m}</li>)}</ul></Card>
      {Object.keys(ex.alternatives).length > 0 && <Card><h3 className="mb-1 text-xl">Versões por local</h3><ul className="space-y-1 text-sm text-zinc-300">{Object.entries(ex.alternatives).map(([k, v]) => <li key={k}><b className="uppercase">{k === 'seguro' ? 'sem salto' : k}:</b> <Link className="underline" to={`/app/biblioteca/${v}`}>{d.exMap.get(v)?.name ?? v}</Link></li>)}</ul></Card>}
      <MapButton ex={ex} />
    </div>
  )
}
