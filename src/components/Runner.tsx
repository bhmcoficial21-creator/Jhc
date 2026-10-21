import { useEffect, useRef, useState } from 'react'
import { beep, unlockAudio } from '../lib/audio'
import type { Step } from '../lib/steps'
import ExerciseViewer, { prefetchViewer } from './ExerciseViewer'
import { Btn, Chip, Notice, Ring, mmss, useCountdown } from './ui'

const BLOCK_L: Record<string, string> = { warmup: 'Aquecimento', main: 'Bloco principal', cooldown: 'Volta à calma', routine: 'Rotina' }
const ARROWS = [{ a: '←', n: 'esquerda' }, { a: '→', n: 'direita' }, { a: '↑', n: 'frente' }, { a: '↓', n: 'trás' }]

function Timed({ s, onDone, canSkip, onSkip }: { s: Step; onDone: () => void; canSkip: boolean; onSkip: () => void }) {
  const [run, setRun] = useState(true)
  const [left] = useCountdown(s.secs!, run, () => { beep('done'); onDone() })
  useEffect(() => { if (run && left > 0 && left <= 3) beep('tick') }, [left, run])
  return <div className="flex flex-col items-center gap-3">
    <Ring left={left} total={s.secs!} size={150}><span className="font-display text-5xl font-extrabold">{mmss(left)}</span></Ring>
    {s.label && <Chip on>{s.label}</Chip>}
    <div className="flex w-full gap-2">
      <Btn variant="ghost" className="flex-1" onClick={() => setRun((r) => !r)}>{run ? 'Pausar' : 'Continuar'}</Btn>
      {canSkip && <Btn variant="ghost" className="flex-1" onClick={onSkip}>Pular</Btn>}
    </div>
  </div>
}
function Rest({ s, onDone }: { s: Step; onDone: () => void }) {
  const [left] = useCountdown(s.secs!, true, () => { beep('go'); onDone() })
  useEffect(() => { if (left > 0 && left <= 3) beep('tick') }, [left])
  return <div className="flex flex-col items-center gap-3 py-4">
    <h2 className="text-3xl text-lime">Descanso</h2>
    <Ring left={left} total={s.secs!} size={170}><span className="font-display text-6xl font-extrabold">{left}</span></Ring>
    <p className="muted">A seguir: <b className="text-zinc-200">{s.nextName}</b></p>
    <Btn variant="ghost" onClick={onDone} className="w-full">Pular descanso</Btn>
  </div>
}
/** Reação a comando: o app toca um sinal e mostra a seta; o aluno sai para o lado indicado. */
function Reaction({ onDone, label }: { onDone: () => void; label: string }) {
  const [state, setState] = useState<'idle' | 'wait' | 'go'>('idle')
  const [arrow, setArrow] = useState(ARROWS[0])
  const t = useRef<number>()
  useEffect(() => () => clearTimeout(t.current), [])
  const arm = () => {
    unlockAudio(); setState('wait')
    t.current = window.setTimeout(() => { setArrow(ARROWS[Math.floor(Math.random() * ARROWS.length)]); setState('go'); beep('go') }, 2000 + Math.random() * 2500)
  }
  return <div className="space-y-3 text-center">
    <div className={`grid h-44 place-items-center rounded-2xl border-2 ${state === 'go' ? 'border-lime bg-lime/10' : 'border-line bg-panel'}`}>
      {state === 'go' ? <span className="font-display text-9xl leading-none text-lime" aria-live="assertive">{arrow.a}</span> : <span className="font-display text-2xl text-zinc-400">{state === 'wait' ? 'Atento ao sinal…' : 'Fique em posição de base'}</span>}
    </div>
    {state === 'idle' && <Btn className="w-full" onClick={arm}>Pronto — dar o sinal</Btn>}
    {state === 'wait' && <Btn variant="ghost" className="w-full" disabled>Aguarde…</Btn>}
    {state === 'go' && <><p className="text-zinc-300">Saia para {arrow.n}!</p><Btn className="w-full" onClick={() => { setState('idle'); onDone() }}>{label}</Btn></>}
  </div>
}
function Rate({ s, onPick }: { s: Step; onPick: (n: number) => void }) {
  return <div className="space-y-3">
    <h2 className="text-3xl">Quantas saíram certas?</h2>
    <p className="muted">{s.ex.name} — de 0 a 10 repetições. Com 8 em 10 em duas sessões seguidas, o app sugere subir de nível.</p>
    <div className="grid grid-cols-6 gap-2">{Array.from({ length: 11 }, (_, i) => <button key={i} onClick={() => onPick(i)} className="min-h-[56px] rounded-xl border border-line bg-panel2 font-display text-2xl font-extrabold active:bg-lime active:text-black">{i}</button>)}</div>
  </div>
}

export default function Runner({ steps, title, onDone, onExit, onRate }: { steps: Step[]; title: string; onDone: () => void; onExit: () => void; onRate?: (exId: string, n: number) => void }) {
  const [i, setI] = useState(0)
  const wake = useRef<{ release: () => void } | null>(null)
  useEffect(() => {
    prefetchViewer()
    ;(navigator as never as { wakeLock?: { request: (t: string) => Promise<{ release: () => void }> } }).wakeLock?.request('screen').then((w) => { wake.current = w }).catch(() => undefined)
    return () => { wake.current?.release() }
  }, [])
  const s = steps[i]
  const advance = () => (i + 1 >= steps.length ? onDone() : setI(i + 1))
  const skipItem = () => { let j = i; while (j < steps.length && steps[j].key === s.key) j++; j >= steps.length ? onDone() : setI(j) }
  if (!s) { onDone(); return null }
  const exercisePart = s.kind !== 'rest' && s.kind !== 'rate'
  const canSkip = s.block !== 'warmup' && s.block !== 'routine'

  return (
    <div className="mx-auto flex min-h-screen max-w-xl flex-col px-4 pb-8 pt-3">
      <div className="mb-3 flex items-center gap-3">
        <button onClick={() => confirm('Sair do treino? O progresso desta sessão será perdido.') && onExit()} className="grid h-11 w-11 place-items-center rounded-xl border border-line text-xl" aria-label="Sair">✕</button>
        <div className="flex-1"><div className="flex justify-between text-xs uppercase text-zinc-400"><span>{BLOCK_L[s.block]}</span><span>{i + 1}/{steps.length}</span></div>
          <div className="mt-1 h-2 overflow-hidden rounded-full bg-panel2"><div className="h-full bg-lime transition-all" style={{ width: `${((i + 1) / steps.length) * 100}%` }} /></div></div>
      </div>
      <p className="text-xs uppercase text-zinc-500">{title}</p>

      {s.kind === 'rest' ? <Rest key={i} s={s} onDone={advance} /> : s.kind === 'rate' ? <Rate s={s} onPick={(n) => { onRate?.(s.ex.id, n); advance() }} /> : (
        <div className="mt-1 space-y-3">
          <h1 className="text-4xl leading-none">{s.ex.name}</h1>
          <ExerciseViewer key={s.ex.id} ex={s.ex} level={s.level} compact />
          {s.warnings.map((w) => <Notice key={w} tone={w.includes('profissional') ? 'warn' : 'info'}>{w}</Notice>)}
          {s.kind === 'reps' && <div className="text-center">
            <div className="font-display text-7xl font-extrabold leading-none text-lime">{s.sets && s.sets > 1 ? `${s.sets} × ` : ''}{s.reps}</div>
            <p className="muted">{s.sets && s.sets > 1 ? `Série ${s.set} de ${s.sets} · ` : ''}repetições</p>
          </div>}
          {s.kind === 'timed' && <Timed key={i} s={s} onDone={advance} canSkip={canSkip} onSkip={skipItem} />}
          {s.kind === 'reps' && (s.cmd ? <Reaction key={i} label={s.set === s.sets ? 'Concluir exercício' : 'Série feita'} onDone={advance} />
            : <div className="flex gap-2"><Btn className="flex-1" onClick={advance}>{s.set === s.sets ? 'Concluir' : 'Série feita'}</Btn>{canSkip && <Btn variant="ghost" onClick={skipItem}>Pular</Btn>}</div>)}
          {exercisePart && s.block === 'warmup' && <p className="muted text-center">Aquecimento obrigatório: não pode ser pulado.</p>}
        </div>
      )}
    </div>
  )
}
