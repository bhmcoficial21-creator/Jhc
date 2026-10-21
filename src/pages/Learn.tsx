import { Link } from 'react-router-dom'
import { useData } from '../lib/data'
import { Card, Chip, Lock } from '../components/ui'

export function useLessons() {
  const d = useData(), pos = d.profile!.position!
  const lessons = d.content.lessons.filter((l) => l.published && (!l.positions.length || l.positions.includes(pos))).sort((a, b) => a.order_idx - b.order_idx)
  const passed = new Set(d.attempts.filter((a) => a.total > 0 && a.correct / a.total >= 0.8).map((a) => a.lesson_id))
  // próxima lição libera com 8 acertos em 10 (80%) no quiz da anterior
  const unlocked = (i: number) => i === 0 || passed.has(lessons[i - 1].id)
  return { lessons, passed, unlocked }
}

export default function Learn() {
  const d = useData(), { lessons, passed, unlocked } = useLessons()
  const sem = d.content.exercises.filter((e) => e.category === 'movimento')
  return (
    <div className="page space-y-4">
      <h1 className="text-5xl leading-none">Aprender jogo</h1>
      <p className="muted">Posicionamento e leitura de jogo para a sua função ({d.profile!.position}). Lições curtas de 2 a 4 minutos. Orientação geral de tática, sem promessa de resultado.</p>
      <div className="space-y-2">{lessons.map((l, i) => {
        const open = unlocked(i)
        const card = <Card className={`flex items-start gap-3 ${open ? '' : 'opacity-60'}`}>
          <span className="font-display text-4xl text-lime">{i + 1}</span>
          <div className="flex-1"><h3 className="text-2xl leading-tight">{!open && <Lock className="mr-1" />}{l.title}</h3><p className="muted">{l.summary}</p>
            <div className="mt-2 flex gap-1.5"><Chip>{l.minutes} min</Chip>{passed.has(l.id) && <Chip on>Quiz concluído</Chip>}{!l.reviewed && <Chip>rascunho</Chip>}</div></div></Card>
        return open ? <Link key={l.id} to={`/app/aprender/${l.id}`}>{card}</Link> : <div key={l.id}>{card}</div>
      })}
        {lessons.length === 0 && <Card><p className="muted">Nenhuma lição publicada ainda.</p></Card>}</div>
      <Card className="space-y-2"><h2 className="text-2xl">Treino do movimento sem bola</h2><p className="muted">Circuitos curtos com cones, em casa ou no campo: arrancada de apoio, ruptura em diagonal, toque e contra-movimento, olhar por cima do ombro.</p>
        <div className="grid gap-2">{sem.map((e) => <Link key={e.id} to={`/app/biblioteca/${e.id}`} className="btn btn-ghost btn-sm">{e.name}</Link>)}</div></Card>
    </div>
  )
}
