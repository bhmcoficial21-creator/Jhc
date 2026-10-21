import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import { useData } from '../lib/data'
import { guideSteps } from '../lib/steps'
import Runner from '../components/Runner'
import { Btn, Card, Lock } from '../components/ui'

export default function Guide() {
  const d = useData(), { annual } = useAuth(), { id } = useParams(), nav = useNavigate()
  const [run, setRun] = useState(false)
  if (!annual) return <div className="page space-y-4"><h1 className="text-5xl"><Lock className="mr-2" />Guia</h1><p className="text-zinc-300">O Guia de aquecimento, mobilidade e alongamento faz parte do brinde do plano anual.</p><Link to="/app/perfil" className="btn btn-primary w-full">Migrar para o anual</Link></div>
  const pages = d.content.guide.filter((g) => g.kind === 'guia').sort((a, b) => a.order_idx - b.order_idx)
  const page = pages.find((p) => p.id === id)
  if (page && run) return <div className="fixed inset-0 z-50 overflow-auto bg-ink"><Runner steps={guideSteps(page, d.exMap)} title={page.title} onExit={() => setRun(false)} onDone={() => { setRun(false); nav('/app/guia') }} /></div>
  if (page) return (
    <div className="page space-y-4"><Link to="/app/guia" className="text-sm text-lime underline">← Guia</Link><h1 className="text-4xl leading-none">{page.title}</h1>
      <p className="whitespace-pre-line text-zinc-300">{page.body}</p>
      <ol className="space-y-1 text-sm text-zinc-300">{page.steps.map((s, i) => <li key={i}>{i + 1}. {d.exMap.get(s.ex)?.name ?? s.ex} · {s.secs}s{s.side ? ' por lado' : ''}</li>)}</ol>
      {page.steps.length > 0 && <Btn className="w-full" onClick={() => setRun(true)}>Fazer guiado</Btn>}</div>)
  return <div className="page space-y-3"><h1 className="text-5xl leading-none">Guia</h1><p className="muted">Aquecimento, mobilidade e alongamento do jogador amador. Orientação geral, sem tratamento de lesão.</p>
    {pages.map((p) => <Link key={p.id} to={`/app/guia/${p.id}`}><Card className="mb-2"><h3 className="text-2xl">{p.title}</h3></Card></Link>)}</div>
}
