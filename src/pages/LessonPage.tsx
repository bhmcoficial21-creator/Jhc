import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useData } from '../lib/data'
import Board from '../components/Board'
import { Card, LinkBtn, Lock } from '../components/ui'
import { useLessons } from './Learn'

type Scene = 'situation' | 'error' | 'right'
const TABS: { v: Scene; l: string; c: string }[] = [{ v: 'situation', l: '1 · A situação', c: 'text-zinc-100' }, { v: 'error', l: '2 · Erro comum', c: 'text-danger' }, { v: 'right', l: '3 · Movimento certo', c: 'text-lime' }]

export default function LessonPage() {
  const { id } = useParams(), d = useData(), { lessons, unlocked, passed } = useLessons()
  const [scene, setScene] = useState<Scene>('situation')
  const i = lessons.findIndex((l) => l.id === id), l = lessons[i]
  if (!l) return <div className="page"><Link to="/app/aprender" className="btn btn-ghost">← Lições</Link></div>
  if (!unlocked(i)) return <div className="page space-y-3"><h1 className="text-4xl"><Lock className="mr-2" />Lição bloqueada</h1><p className="text-zinc-300">Acerte 8 em 10 no quiz da lição anterior para liberar.</p><Link to="/app/aprender" className="btn btn-ghost w-full">Voltar</Link></div>
  const text = scene === 'situation' ? l.situation : scene === 'error' ? l.error_text : l.right_text
  const frames = l.board?.scenes[scene] ?? []
  const next = lessons[i + 1]
  return (
    <div className="page space-y-4">
      <Link to="/app/aprender" className="text-sm text-lime underline">← Lições</Link>
      <h1 className="text-4xl leading-none">{l.title}</h1>
      <div className="grid grid-cols-3 gap-1.5">{TABS.map((t) => <button key={t.v} onClick={() => setScene(t.v)} className={`min-h-[52px] rounded-xl border px-1 font-display text-base font-bold uppercase leading-tight ${scene === t.v ? 'border-lime bg-panel2' : 'border-line bg-panel'} ${t.c}`}>{t.l}</button>)}</div>
      {l.board && frames.length > 0 ? <Board field={l.board.field} frames={frames} /> : <Card><p className="muted">Prancheta ainda não cadastrada para esta lição.</p></Card>}
      <Card><p className="text-lg">{text}</p></Card>
      <Card className="space-y-1"><p className="muted">Você é o ponto com anel <b className="text-lime">VOCÊ</b> (verde). Adversários em branco. Ataque para a direita.</p></Card>
      <LinkBtn to={`/app/aprender/${l.id}/quiz`} className="w-full">Quiz: onde você se posiciona?</LinkBtn>
      {passed.has(l.id) && next && <LinkBtn to={`/app/aprender/${next.id}`} variant="ghost" className="w-full">Próxima lição →</LinkBtn>}
      <p className="muted text-center">Conteúdo de orientação geral de tática. Textos revisados por um treinador antes da publicação.</p>
    </div>
  )
}
