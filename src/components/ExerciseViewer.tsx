import { lazy, Suspense, useState } from 'react'
import type { Exercise } from '../lib/types'
import { Chip, Notice, Spinner } from './ui'

const Viewer3D = lazy(() => import('./Viewer3D'))
export const prefetchViewer = () => import('./Viewer3D')

/** Estrutura da tela de exercício: (1) ERRO DE INICIANTE (só com risco de lesão), (2) EXECUÇÃO CORRETA, (3) NÍVEIS 1 A 4. */
export default function ExerciseViewer({ ex, level, compact }: { ex: Exercise; level: number; compact?: boolean }) {
  const showError = ex.injury_risk && !!ex.beginner_error
  const [tab, setTab] = useState<'erro' | 'correto'>(showError ? 'erro' : 'correto')
  const [lv, setLv] = useState(level)
  const def = ex.levels.find((l) => l.n === lv)
  const mode = showError ? tab : 'correto'

  const viewer = (
    <Suspense fallback={<Spinner label="Carregando animação…" />}>
      <Viewer3D src={ex.anim_url} motion={ex.motion} mode={mode} level={lv} angle={ex.camera_angle} joint={ex.xray_joint}
        circuit={ex.circuit} image={ex.image_url} video={ex.video_url} title={ex.name} compact={compact} />
    </Suspense>
  )
  if (compact) {
    return <div className="space-y-2">
      {showError && <div className="flex gap-2">
        <button onClick={() => setTab('erro')} className={`chip !min-h-[40px] ${tab === 'erro' ? '!bg-danger !text-black' : ''}`}>1 · Erro de iniciante</button>
        <button onClick={() => setTab('correto')} className={`chip !min-h-[40px] ${tab === 'correto' ? 'chip-on' : ''}`}>2 · Execução correta</button>
      </div>}
      {viewer}
      {showError && tab === 'erro' && <Notice tone="danger"><b>Erro comum:</b> {ex.beginner_error}</Notice>}
      {def && <p className="text-sm"><Chip on>Nível {def.n}</Chip> <b className="ml-1">{def.name}</b> <span className="text-zinc-400">{def.desc}</span></p>}
    </div>
  }
  return (
    <div className="space-y-4">
      {showError && (
        <section className="space-y-2">
          <h3 className="text-xl text-danger">1 · Erro de iniciante</h3>
          <div className="flex gap-2">
            <button onClick={() => setTab('erro')} className={`chip !min-h-[44px] ${tab === 'erro' ? '!bg-danger !text-black' : ''}`}>Ver o erro</button>
            <button onClick={() => setTab('correto')} className={`chip !min-h-[44px] ${tab === 'correto' ? 'chip-on' : ''}`}>Ver o correto</button>
          </div>
        </section>
      )}
      {viewer}
      {showError && <Notice tone="danger"><b>Erro de iniciante:</b> {ex.beginner_error}</Notice>}
      <section className="space-y-2">
        <h3 className="text-xl">{showError ? '2 · Execução correta' : 'Execução correta'}</h3>
        <ol className="list-decimal space-y-1 pl-5 text-zinc-200">{ex.steps.map((s, i) => <li key={i}>{s}</li>)}</ol>
        {ex.is_jump && <Notice>Aterrissagem silenciosa, joelhos alinhados com os pés.</Notice>}
      </section>
      <section className="space-y-2">
        <h3 className="text-xl">{showError ? '3 · Níveis 1 a 4' : 'Níveis 1 a 4'}</h3>
        <div className="grid gap-2">
          {ex.levels.map((l) => (
            <button key={l.n} onClick={() => setLv(l.n)} className={`rounded-xl border p-3 text-left ${lv === l.n ? 'border-lime bg-lime/10' : 'border-line bg-panel2'}`}>
              <span className="font-display text-lg font-extrabold uppercase">Nível {l.n} · {l.name}</span>
              {l.desc && <span className="block text-sm text-zinc-400">{l.desc}</span>}
              {l.n === level && <Chip on className="mt-1">Seu nível</Chip>}
            </button>
          ))}
        </div>
      </section>
    </div>
  )
}
