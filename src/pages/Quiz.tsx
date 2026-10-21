import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useData } from '../lib/data'
import Board, { DIMS } from '../components/Board'
import { Btn, Card, LinkBtn, Notice } from '../components/ui'
import { useLessons } from './Learn'

const ROUND = 10
const shuffle = <T,>(a: T[]) => [...a].sort(() => Math.random() - 0.5)

/** QUIZ ONDE VOCÊ SE POSICIONA? — toque no ponto do campo; a rodada libera a próxima lição com 80% (8 em 10). */
export default function Quiz() {
  const { id } = useParams(), d = useData(), { lessons, unlocked } = useLessons()
  const lesson = lessons.find((l) => l.id === id), li = lessons.findIndex((l) => l.id === id)
  const questions = useMemo(() => shuffle(d.content.quiz.filter((q) => q.lesson_id === id)).slice(0, ROUND), [d.content.quiz, id])
  const [i, setI] = useState(0), [hits, setHits] = useState(0), [pick, setPick] = useState<{ x: number; y: number } | null>(null), [done, setDone] = useState(false)
  if (!lesson || !unlocked(li)) return <div className="page"><Link to="/app/aprender" className="btn btn-ghost">← Lições</Link></div>
  if (questions.length === 0) return <div className="page space-y-3"><h1 className="text-4xl">Quiz</h1><Notice>Esta lição ainda não tem perguntas cadastradas.</Notice><Link to={`/app/aprender/${id}`} className="btn btn-ghost w-full">Voltar</Link></div>

  const q = questions[i], right = pick ? Math.hypot(pick.x - q.answer.x, (pick.y - q.answer.y) * (DIMS[q.board.field].h / DIMS[q.board.field].w)) <= q.answer.r : null
  const need = Math.ceil(questions.length * 0.8)
  const next = async () => {
    const h = hits + (right ? 1 : 0)
    if (i + 1 >= questions.length) { setHits(h); setDone(true); await d.saveAttempt({ lesson_id: lesson.id, correct: h, total: questions.length }); return }
    setHits(h); setI(i + 1); setPick(null)
  }
  if (done) {
    const ok = hits >= need, nextL = lessons[li + 1]
    return <div className="page space-y-4"><h1 className="text-5xl leading-none">{ok ? <span className="text-lime">Passou!</span> : 'Quase lá'}</h1>
      <Card><p className="font-display text-6xl font-extrabold">{hits}<span className="text-zinc-500"> / {questions.length}</span></p><p className="muted">Acertos salvos. {ok ? (nextL ? 'A próxima lição foi liberada.' : 'Você concluiu todas as lições.') : `Faça pelo menos ${need} acertos para liberar a próxima lição.`}</p></Card>
      {ok && nextL ? <LinkBtn to={`/app/aprender/${nextL.id}`} className="w-full">Próxima lição</LinkBtn> : <Btn className="w-full" onClick={() => location.reload()}>Tentar de novo</Btn>}
      <Link to="/app/aprender" className="btn btn-ghost w-full">Voltar às lições</Link></div>
  }
  return (
    <div className="page space-y-3">
      <div className="flex items-center justify-between"><Link to={`/app/aprender/${id}`} className="text-sm text-lime underline">← {lesson.title}</Link><span className="muted">{i + 1}/{questions.length} · {hits} acertos</span></div>
      <h1 className="text-3xl leading-tight">Onde você se posiciona?</h1>
      <p className="text-zinc-200">{q.prompt}</p>
      <Board field={q.board.field} frames={[q.board.frame]} tap={{ onTap: (x, y) => !pick && setPick({ x, y }), marker: pick, answer: pick ? q.answer : null, correct: right }} />
      {!pick && <p className="muted text-center">Toque no ponto do campo onde você ficaria (ataque para a direita).</p>}
      {pick && <><Notice tone={right ? 'info' : 'danger'}><b>{right ? 'Acertou!' : 'Não foi dessa vez.'}</b> {q.explanation}</Notice><Btn className="w-full" onClick={next}>{i + 1 >= questions.length ? 'Ver resultado' : 'Próxima'}</Btn></>}
    </div>
  )
}
