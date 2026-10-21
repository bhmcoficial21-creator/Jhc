import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import { useData } from '../lib/data'
import { iso } from '../lib/planner'
import { guideSteps, totalSecs } from '../lib/steps'
import Runner from '../components/Runner'
import { Btn, Lock, Notice } from '../components/ui'

/** Aquecer para o jogo (nos dois planos) e protocolo de pós-jogo (anual). */
export default function Routine({ kind }: { kind: 'aquecimento_jogo' | 'posjogo' }) {
  const d = useData(), { annual } = useAuth(), nav = useNavigate()
  const page = d.content.guide.find((g) => g.kind === kind)
  const [phase, setPhase] = useState<'intro' | 'run' | 'end'>('intro')
  const [feel, setFeel] = useState(0), [pain, setPain] = useState(false), [severe, setSevere] = useState(false)

  if (kind === 'posjogo' && !annual) return (
    <div className="mx-auto max-w-xl space-y-4 px-4 py-10"><h1 className="text-5xl"><Lock className="mr-2" />Pós-jogo</h1><p className="text-zinc-300">O protocolo de pós-jogo e o botão JOGUEI HOJE fazem parte do brinde do plano anual.</p><Link to="/app/perfil" className="btn btn-primary w-full">Migrar para o anual</Link><Link to="/app" className="btn btn-ghost w-full">Voltar</Link></div>)
  if (!page) return <div className="page"><p>Conteúdo indisponível.</p><Link to="/app" className="btn btn-ghost mt-3">Voltar</Link></div>
  const steps = guideSteps(page, d.exMap)

  if (phase === 'run') return <Runner steps={steps} title={page.title} onExit={() => nav('/app', { replace: true })} onDone={() => (kind === 'posjogo' ? setPhase('end') : nav('/app', { replace: true }))} />
  if (phase === 'end') return (
    <div className="mx-auto flex min-h-screen max-w-xl flex-col gap-4 px-4 py-8">
      <h1 className="text-5xl leading-none text-lime">Pós-jogo feito</h1>
      <p>Hidrate-se e durma bem. Como você se sente agora? <span className="muted">(1 mal · 5 ótimo)</span></p>
      <div className="grid grid-cols-5 gap-2">{[1, 2, 3, 4, 5].map((n) => <button key={n} onClick={() => setFeel(n)} className={`min-h-[56px] rounded-xl border font-display text-2xl font-extrabold ${feel === n ? 'border-lime bg-lime text-black' : 'border-line bg-panel2'}`}>{n}</button>)}</div>
      <label className="flex items-center gap-3"><input type="checkbox" className="!h-6 !w-6" checked={pain} onChange={(e) => setPain(e.target.checked)} />Estou com dor</label>
      {pain && <label className="flex items-start gap-3 rounded-xl border border-danger/60 p-3"><input type="checkbox" className="mt-1 !h-6 !w-6" checked={severe} onChange={(e) => setSevere(e.target.checked)} /><span>A dor é <b>forte</b>, há <b>inchaço</b> ou a dor <b>não passa</b>.</span></label>}
      {(severe || pain) && <Notice tone="danger">{severe ? <><b>Procure um profissional de saúde presencialmente.</b> Não faça saltos até ser avaliado.</> : 'Com dor, evite saltos e arrancadas até melhorar. Se ela persistir, procure um profissional.'} Este app não faz diagnóstico.</Notice>}
      <Btn disabled={!feel} className="mt-auto w-full" onClick={async () => { await d.savePostgame({ day: iso(new Date()), feel, pain, severe }); if (pain || severe) await d.saveProfile({ pain_block: true }); nav('/app', { replace: true }) }}>Salvar</Btn>
    </div>)
  return (
    <div className="mx-auto flex min-h-screen max-w-xl flex-col gap-4 px-4 py-8">
      <h1 className="text-5xl leading-none">{page.title}</h1>
      <p className="whitespace-pre-line text-zinc-300">{page.body}</p>
      <p className="muted">{steps.length} passos · cerca de {Math.round(totalSecs(steps) / 60)} min · sem equipamento</p>
      <ol className="space-y-1 text-sm text-zinc-300">{steps.map((s, i) => <li key={i}>{i + 1}. {s.ex.name}{s.label ? ` (${s.label})` : ''} · {s.secs}s</li>)}</ol>
      <div className="mt-auto flex gap-2"><Link to="/app" className="btn btn-ghost">Voltar</Link><Btn className="flex-1" onClick={() => setPhase('run')}>Começar</Btn></div>
    </div>)
}
