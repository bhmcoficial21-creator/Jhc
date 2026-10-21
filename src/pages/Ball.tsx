import { Link } from 'react-router-dom'
import { useData } from '../lib/data'
import { REPLAY_CATS } from '../seed/replays'
import { Card, Chip, LinkBtn } from '../components/ui'

const LVL = ['', 'Iniciante', 'Intermediário', 'Avançado']

export default function Ball() {
  const d = useData()
  const list = d.content.replays.filter((r) => r.published !== false)
  const cats = Object.keys(REPLAY_CATS).filter((c) => list.some((r) => r.category === c))
  return (
    <div className="page space-y-4">
      <h1 className="text-5xl leading-none">Treino com bola</h1>
      <p className="muted">Veja o replay em 3D, entenda cada movimento e depois tente na quadra. Sem treino físico: só bola no pé, cones e vontade.</p>
      <LinkBtn to="/app/bola/montagem" className="w-full">▶ MONTAGEM · todos os treinos</LinkBtn>
      {cats.map((c) => <section key={c} className="space-y-2">
        <h2 className="text-3xl text-lime">{REPLAY_CATS[c]}</h2>
        {list.filter((r) => r.category === c).map((r) => {
          const pr = d.progress.get(r.id)
          return <Link key={r.id} to={`/app/bola/${r.id}`}><Card className="mb-2 space-y-1"><div className="flex items-start justify-between gap-2"><h3 className="text-2xl leading-tight">{r.title}</h3><Chip>{LVL[r.level]}</Chip></div>
            <p className="muted">{r.summary}</p><div className="flex gap-1.5"><Chip on>replay 3D</Chip><Chip>{r.duration} s</Chip>{pr?.scores.length ? <Chip>última nota {pr.scores[pr.scores.length - 1]}/10</Chip> : null}</div></Card></Link>
        })}
      </section>)}
      {list.length === 0 && <Card><p className="muted">Nenhum replay publicado ainda.</p></Card>}
    </div>
  )
}
