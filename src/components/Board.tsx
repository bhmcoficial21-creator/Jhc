import { useEffect, useMemo, useRef, useState } from 'react'
import type { Board as BoardT, Frame } from '../lib/types'

export const DIMS: Record<BoardT['field'], { w: number; h: number; label: string }> = {
  '11': { w: 105, h: 68, label: '11 contra 11' }, society: { w: 60, h: 40, label: 'Society' }, futsal: { w: 40, h: 20, label: 'Futsal' },
}
const SEG = 1.5   // segundos por transição de quadro

export function FieldSvg({ field }: { field: BoardT['field'] }) {
  const { w, h } = DIMS[field], s = field === '11' ? 1 : field === 'society' ? 0.7 : 0.5
  const line = { stroke: '#2f4a2f', strokeWidth: 0.35 * (field === 'futsal' ? 0.6 : 1), fill: 'none' }
  const pw = 16.5 * s * 1.0, ph = 40.3 * s * (h / 68 > 0.8 ? 1 : 1.2), sw = 5.5 * s, shh = 18.3 * s
  return <g>
    <rect x="0" y="0" width={w} height={h} fill="#0f1a0f" />
    {Array.from({ length: 8 }, (_, i) => <rect key={i} x={(w / 8) * i} y="0" width={w / 8} height={h} fill={i % 2 ? '#101d10' : '#0d170d'} />)}
    <rect x="0.3" y="0.3" width={w - 0.6} height={h - 0.6} {...line} />
    <line x1={w / 2} y1="0" x2={w / 2} y2={h} {...line} />
    <circle cx={w / 2} cy={h / 2} r={9.15 * s} {...line} />
    {[0, 1].map((side) => {
      const x = side === 0 ? 0.3 : w - 0.3
      return <g key={side}>
        <rect x={side === 0 ? x : x - pw} y={(h - ph) / 2} width={pw} height={ph} {...line} />
        <rect x={side === 0 ? x : x - sw} y={(h - shh) / 2} width={sw} height={shh} {...line} />
      </g>
    })}
  </g>
}

const ease = (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2)
export function interp(frames: Frame[], t: number): Frame {
  const i = Math.min(frames.length - 1, Math.floor(t)), j = Math.min(frames.length - 1, i + 1), k = ease(Math.min(1, Math.max(0, t - i)))
  const a = frames[i], b = frames[j]
  const players = a.players.map((p) => { const q = b.players.find((x) => x.id === p.id) ?? p; return { ...p, x: p.x + (q.x - p.x) * k, y: p.y + (q.y - p.y) * k } })
  return { players, ball: { x: a.ball.x + (b.ball.x - a.ball.x) * k, y: a.ball.y + (b.ball.y - a.ball.y) * k }, note: (k > 0.5 ? b : a).note }
}

interface Props {
  field: BoardT['field']; frames: Frame[]
  tap?: { onTap: (x: number, y: number) => void; marker?: { x: number; y: number } | null; answer?: { x: number; y: number; r: number } | null; correct?: boolean | null }
  hideControls?: boolean; className?: string
}

/** Prancheta animada (vista de cima): tocar, pausar, câmera lenta e passo a passo. */
export default function Board({ field, frames, tap, hideControls, className = '' }: Props) {
  const { w, h } = DIMS[field]
  const [t, setT] = useState(0)
  const [playing, setPlaying] = useState(!tap && frames.length > 1)
  const [speed, setSpeed] = useState(1)
  const raf = useRef(0), last = useRef(0), hold = useRef(0)
  const max = frames.length - 1
  useEffect(() => { setT(0); setPlaying(!tap && frames.length > 1) }, [frames, tap])

  useEffect(() => {
    if (!playing) return
    last.current = performance.now()
    const loop = (now: number) => {
      const dt = (now - last.current) / 1000; last.current = now
      setT((cur) => {
        if (cur >= max) { hold.current += dt; if (hold.current > 1.2) { hold.current = 0; return 0 } return cur }
        return Math.min(max, cur + (dt * speed) / SEG)
      })
      raf.current = requestAnimationFrame(loop)
    }
    raf.current = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf.current)
  }, [playing, speed, max])

  const f = useMemo(() => interp(frames, t), [frames, t])
  const idx = Math.min(max, Math.round(t))
  const seg = Math.min(max - 1, Math.floor(t))
  const X = (v: number) => (v / 100) * w, Y = (v: number) => (v / 100) * h
  const trails = max > 0 ? frames[seg].players.map((p) => { const q = frames[seg + 1]?.players.find((x) => x.id === p.id); return q && Math.hypot(q.x - p.x, q.y - p.y) > 1.5 ? { id: p.id, a: p, b: q, me: p.me } : null }).filter(Boolean) as { id: string; a: Frame['players'][0]; b: Frame['players'][0]; me?: boolean }[] : []
  const ballMoves = max > 0 && frames[seg + 1] && Math.hypot(frames[seg + 1].ball.x - frames[seg].ball.x, frames[seg + 1].ball.y - frames[seg].ball.y) > 1.5
  const R = field === '11' ? 1.9 : field === 'society' ? 1.5 : 1.1

  const onPtr = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!tap) return
    const svg = e.currentTarget, pt = svg.createSVGPoint(); pt.x = e.clientX; pt.y = e.clientY
    const p = pt.matrixTransform(svg.getScreenCTM()!.inverse())
    tap.onTap(Math.max(0, Math.min(100, (p.x / w) * 100)), Math.max(0, Math.min(100, (p.y / h) * 100)))
  }
  return (
    <div className={className}>
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full touch-manipulation rounded-xl border border-line" onPointerDown={onPtr} role="img" aria-label="Prancheta de tática">
        <defs><marker id="arr" viewBox="0 0 6 6" refX="5" refY="3" markerWidth="4" markerHeight="4" orient="auto"><path d="M0 0 6 3 0 6z" fill="#c6ff00" /></marker><marker id="arr2" viewBox="0 0 6 6" refX="5" refY="3" markerWidth="4" markerHeight="4" orient="auto"><path d="M0 0 6 3 0 6z" fill="#999" /></marker></defs>
        <FieldSvg field={field} />
        {trails.map((tr) => <line key={tr.id} x1={X(tr.a.x)} y1={Y(tr.a.y)} x2={X(tr.b.x)} y2={Y(tr.b.y)} stroke={tr.me ? '#c6ff00' : '#999'} strokeWidth="0.45" strokeDasharray="1.4 1" markerEnd={tr.me ? 'url(#arr)' : 'url(#arr2)'} opacity=".9" />)}
        {ballMoves && <line x1={X(frames[seg].ball.x)} y1={Y(frames[seg].ball.y)} x2={X(frames[seg + 1].ball.x)} y2={Y(frames[seg + 1].ball.y)} stroke="#fff" strokeWidth="0.3" strokeDasharray="0.8 0.8" opacity=".6" />}
        {f.players.map((p) => <g key={p.id}>
          {p.me && <circle cx={X(p.x)} cy={Y(p.y)} r={R * 1.9} fill="none" stroke="#c6ff00" strokeWidth="0.35" opacity=".7" />}
          <circle cx={X(p.x)} cy={Y(p.y)} r={R} fill={p.team === 'a' ? '#c6ff00' : '#e5e5e5'} stroke="#000" strokeWidth="0.25" />
          {p.label && <text x={X(p.x)} y={Y(p.y) - R * 2.4} fontSize={R * 1.5} fill="#c6ff00" textAnchor="middle" fontWeight="800">{p.label}</text>}
        </g>)}
        <circle cx={X(f.ball.x)} cy={Y(f.ball.y)} r={R * 0.6} fill="#fff" stroke="#000" strokeWidth="0.2" />
        {tap?.answer && <circle cx={X(tap.answer.x)} cy={Y(tap.answer.y)} r={(tap.answer.r / 100) * w} fill="rgba(198,255,0,.18)" stroke="#c6ff00" strokeWidth="0.5" strokeDasharray="1.5 1" />}
        {tap?.marker && <g><circle cx={X(tap.marker.x)} cy={Y(tap.marker.y)} r={R * 1.1} fill={tap.correct == null ? '#fff' : tap.correct ? '#c6ff00' : '#ff4d4d'} opacity=".95" /><text x={X(tap.marker.x)} y={Y(tap.marker.y) + R * 0.45} fontSize={R * 1.3} textAnchor="middle" fontWeight="800" fill="#000">{tap.correct == null ? '?' : tap.correct ? '✓' : '✗'}</text></g>}
      </svg>
      {f.note && <p className="mt-2 text-center text-sm text-zinc-200">{f.note}</p>}
      {!hideControls && !tap && max > 0 && (
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <button className="btn btn-ghost btn-sm !min-w-[52px]" onClick={() => { setPlaying(false); setT(Math.max(0, idx - 1)) }} aria-label="Quadro anterior">⏮</button>
          <button className="btn btn-primary btn-sm !min-w-[96px]" onClick={() => { if (t >= max) setT(0); setPlaying((p) => !p) }}>{playing ? '❚❚ Pausar' : '▶ Tocar'}</button>
          <button className="btn btn-ghost btn-sm !min-w-[52px]" onClick={() => { setPlaying(false); setT(Math.min(max, idx + 1)) }} aria-label="Próximo quadro">⏭</button>
          <button className={`btn btn-sm ${speed === 0.35 ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setSpeed((s) => (s === 1 ? 0.35 : 1))}>Câmera lenta</button>
          <span className="muted ml-auto">Quadro {idx + 1}/{frames.length}</span>
        </div>
      )}
    </div>
  )
}
