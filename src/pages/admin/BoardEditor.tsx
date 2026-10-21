import { useRef, useState } from 'react'
import { DIMS, FieldSvg } from '../../components/Board'
import type { Board, Frame } from '../../lib/types'
import { Btn, Chips } from '../../components/ui'

type Scene = keyof Board['scenes']
export const emptyBoard = (): Board => ({ field: '11', scenes: { situation: [{ players: [{ id: 'me', team: 'a', x: 50, y: 50, label: 'VOCÊ', me: true }], ball: { x: 50, y: 50 } }], error: [], right: [] } })
const pid = () => 'p' + Math.random().toString(36).slice(2, 6)

/** Editor de prancheta: posicione jogadores, desenhe os movimentos por quadros e salve (sem vídeo). */
export function FrameEditor({ field, frames, onChange, answer, onAnswer }: {
  field: Board['field']; frames: Frame[]; onChange: (f: Frame[]) => void
  answer?: { x: number; y: number; r: number } | null; onAnswer?: (a: { x: number; y: number; r: number }) => void
}) {
  const { w, h } = DIMS[field]
  const [k, setK] = useState(0), [sel, setSel] = useState<string | null>(null), [mode, setMode] = useState<'move' | 'answer'>('move')
  const drag = useRef<string | null>(null)
  const fr = frames[Math.min(k, frames.length - 1)]
  const idx = Math.min(k, frames.length - 1)
  const update = (f: Frame) => onChange(frames.map((x, i) => (i === idx ? f : x)))
  const pt = (e: React.PointerEvent<SVGSVGElement>) => { const s = e.currentTarget, p = s.createSVGPoint(); p.x = e.clientX; p.y = e.clientY; const q = p.matrixTransform(s.getScreenCTM()!.inverse()); return { x: Math.max(0, Math.min(100, (q.x / w) * 100)), y: Math.max(0, Math.min(100, (q.y / h) * 100)) } }
  if (!fr) return <Btn onClick={() => onChange([{ players: [], ball: { x: 50, y: 50 } }])}>Criar primeiro quadro</Btn>
  const R = field === '11' ? 1.9 : field === 'society' ? 1.5 : 1.1
  const addPlayer = (team: 'a' | 'b') => { const id = pid(); onChange(frames.map((f) => ({ ...f, players: [...f.players, { id, team, x: 50, y: 50 }] }))); setSel(id) }
  const removePlayer = () => { if (sel && sel !== 'ball') { onChange(frames.map((f) => ({ ...f, players: f.players.filter((p) => p.id !== sel) }))); setSel(null) } }
  const selP = fr.players.find((p) => p.id === sel)
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-1.5">
        {frames.map((_, i) => <button key={i} type="button" onClick={() => setK(i)} className={`chip !min-h-[40px] ${i === idx ? 'chip-on' : ''}`}>Quadro {i + 1}</button>)}
        <Btn type="button" small variant="ghost" onClick={() => { onChange([...frames.slice(0, idx + 1), JSON.parse(JSON.stringify(fr)), ...frames.slice(idx + 1)]); setK(idx + 1) }}>+ Quadro</Btn>
        {frames.length > 1 && <Btn type="button" small variant="ghost" onClick={() => { onChange(frames.filter((_, i) => i !== idx)); setK(Math.max(0, idx - 1)) }}>Excluir quadro</Btn>}
      </div>
      <div className="flex flex-wrap gap-1.5"><Btn type="button" small variant="ghost" onClick={() => addPlayer('a')}>+ Jogador (time)</Btn><Btn type="button" small variant="ghost" onClick={() => addPlayer('b')}>+ Adversário</Btn>
        <Btn type="button" small variant="ghost" disabled={!sel || sel === 'ball'} onClick={removePlayer}>Remover selecionado</Btn>
        {onAnswer && <Btn type="button" small variant={mode === 'answer' ? 'primary' : 'ghost'} onClick={() => setMode(mode === 'answer' ? 'move' : 'answer')}>Marcar resposta</Btn>}</div>
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full touch-none rounded-xl border border-line"
        onPointerDown={(e) => { if (mode === 'answer' && onAnswer) { const p = pt(e); onAnswer({ ...p, r: answer?.r ?? 10 }) } }}
        onPointerMove={(e) => { if (!drag.current) return; const p = pt(e); if (drag.current === 'ball') update({ ...fr, ball: p }); else update({ ...fr, players: fr.players.map((q) => (q.id === drag.current ? { ...q, ...p } : q)) }) }}
        onPointerUp={() => { drag.current = null }} onPointerLeave={() => { drag.current = null }}>
        <FieldSvg field={field} />
        {answer && <circle cx={(answer.x / 100) * w} cy={(answer.y / 100) * h} r={(answer.r / 100) * w} fill="rgba(198,255,0,.2)" stroke="#c6ff00" strokeWidth=".5" strokeDasharray="1.5 1" />}
        {frames[idx - 1]?.players.map((p) => { const c = fr.players.find((q) => q.id === p.id); return c && Math.hypot(c.x - p.x, c.y - p.y) > 1 ? <line key={'t' + p.id} x1={(p.x / 100) * w} y1={(p.y / 100) * h} x2={(c.x / 100) * w} y2={(c.y / 100) * h} stroke="#999" strokeWidth=".35" strokeDasharray="1 1" /> : null })}
        {fr.players.map((p) => <g key={p.id} onPointerDown={(e) => { if (mode !== 'move') return; e.stopPropagation(); drag.current = p.id; setSel(p.id); (e.target as Element).setPointerCapture?.(e.pointerId) }} style={{ cursor: 'grab' }}>
          <circle cx={(p.x / 100) * w} cy={(p.y / 100) * h} r={R * 1.6} fill="transparent" />
          <circle cx={(p.x / 100) * w} cy={(p.y / 100) * h} r={R} fill={p.team === 'a' ? '#c6ff00' : '#e5e5e5'} stroke={sel === p.id ? '#ff4d4d' : '#000'} strokeWidth={sel === p.id ? 0.6 : 0.25} />
          {p.label && <text x={(p.x / 100) * w} y={(p.y / 100) * h - R * 2.2} fontSize={R * 1.5} textAnchor="middle" fill="#c6ff00" fontWeight="800">{p.label}</text>}
        </g>)}
        <g onPointerDown={(e) => { if (mode !== 'move') return; e.stopPropagation(); drag.current = 'ball'; setSel('ball'); (e.target as Element).setPointerCapture?.(e.pointerId) }} style={{ cursor: 'grab' }}>
          <circle cx={(fr.ball.x / 100) * w} cy={(fr.ball.y / 100) * h} r={R} fill="transparent" /><circle cx={(fr.ball.x / 100) * w} cy={(fr.ball.y / 100) * h} r={R * 0.6} fill="#fff" stroke="#000" strokeWidth=".2" /></g>
      </svg>
      <input placeholder="Texto curto deste quadro" value={fr.note ?? ''} onChange={(e) => update({ ...fr, note: e.target.value })} />
      {selP && <div className="grid grid-cols-2 gap-2"><input placeholder="Rótulo" value={selP.label ?? ''} onChange={(e) => update({ ...fr, players: fr.players.map((p) => (p.id === selP.id ? { ...p, label: e.target.value } : p)) })} />
        <label className="flex items-center gap-2 text-zinc-200"><input type="checkbox" className="!h-6 !w-6" checked={!!selP.me} onChange={(e) => onChange(frames.map((f) => ({ ...f, players: f.players.map((p) => ({ ...p, me: p.id === selP.id ? e.target.checked : e.target.checked ? false : p.me })) })))} />É o aluno (VOCÊ)</label></div>}
      {onAnswer && answer && <label className="block"><span className="muted">Tolerância (raio) da resposta: {answer.r}</span><input type="range" min="3" max="25" value={answer.r} onChange={(e) => onAnswer({ ...answer, r: Number(e.target.value) })} /></label>}
    </div>
  )
}

export function BoardEditor({ value, onChange }: { value: Board | null; onChange: (b: Board) => void }) {
  const b = value ?? emptyBoard()
  const [scene, setScene] = useState<Scene>('situation')
  const frames = b.scenes[scene]
  const seed = (): Frame[] => (b.scenes.situation[0] ? [JSON.parse(JSON.stringify(b.scenes.situation[0]))] : [])
  return <div className="space-y-2">
    <Chips value={b.field} onChange={(v) => onChange({ ...b, field: v })} options={(Object.keys(DIMS) as Board['field'][]).map((f) => ({ v: f, l: DIMS[f].label }))} />
    <Chips value={scene} onChange={setScene} options={[{ v: 'situation', l: 'Situação' }, { v: 'error', l: 'Erro comum' }, { v: 'right', l: 'Movimento certo' }]} />
    {frames.length === 0 ? <Btn type="button" variant="ghost" onClick={() => onChange({ ...b, scenes: { ...b.scenes, [scene]: seed() } })}>Começar a partir da situação</Btn>
      : <FrameEditor field={b.field} frames={frames} onChange={(f) => onChange({ ...b, scenes: { ...b.scenes, [scene]: f } })} />}
  </div>
}
