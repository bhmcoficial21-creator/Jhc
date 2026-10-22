import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import type { Replay } from '../../lib/replay'
import { isMuted, setMuted } from '../../lib/audio'
import { Spinner } from '../ui'
import type { CamMode, Clock, Hud } from './ReplayScene'

const Scene = lazy(() => import('./ReplayScene'))
const MODES: { v: CamMode; l: string }[] = [{ v: 'tv', l: 'TV' }, { v: 'seguir', l: 'Seguir' }, { v: 'gol', l: 'Gol-cam' }]

export interface PlayerApi { canvas: HTMLCanvasElement | null; hud: () => Hud; reset: () => void }

/** Replay 3D no estilo "scan": jogadores em nuvem de pontos, câmeras e dados na tela. */
export default function ReplayPlayer({ r, autoplay = true, loop = true, onEnd, apiRef, showControls = true, startMode }: {
  r: Replay; autoplay?: boolean; loop?: boolean; onEnd?: () => void; apiRef?: React.MutableRefObject<PlayerApi | null>; showControls?: boolean; startMode?: CamMode
}) {
  const clock = useRef<Clock>({ t: 0, playing: autoplay, speed: 1, loop })
  const hudRef = useRef<Hud>({ t: 0, dist: 0, kmh: 0, step: r.steps[0]?.text ?? '' })
  const canvas = useRef<HTMLCanvasElement | null>(null)
  const [hud, setHud] = useState<Hud>(hudRef.current)
  const [mode, setMode] = useState<CamMode>(startMode ?? r.camera ?? 'tv')
  const [playing, setPlaying] = useState(autoplay)
  const [speed, setSpeed] = useState(1)
  const [mute, setMute] = useState(isMuted())

  useEffect(() => { clock.current = { t: 0, playing: autoplay, speed: 1, loop }; setPlaying(autoplay); setSpeed(1); setMode(startMode ?? r.camera ?? 'tv') }, [r.id]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { clock.current.loop = loop }, [loop])
  useEffect(() => { const iv = setInterval(() => { setHud({ ...hudRef.current }); if (clock.current.playing !== playing) setPlaying(clock.current.playing) }, 100); return () => clearInterval(iv) }, [playing])
  useEffect(() => { if (apiRef) apiRef.current = { get canvas() { return canvas.current }, hud: () => hudRef.current, reset: () => { clock.current.t = 0; clock.current.playing = true } } as PlayerApi }, [apiRef])

  const toggle = () => { const c = clock.current; if (!c.playing && c.t >= r.duration - 0.05) c.t = 0; c.playing = !c.playing; setPlaying(c.playing) }
  const seek = (t: number) => { clock.current.t = t; setHud((h) => ({ ...h, t })) }
  const stepTo = (dir: 1 | -1) => { const ts = r.steps.map((s) => s.t), cur = clock.current.t; const nx = dir > 0 ? ts.find((x) => x > cur + 0.1) ?? 0 : [...ts].reverse().find((x) => x < cur - 0.4) ?? 0; seek(nx) }

  return (
    <div className="overflow-hidden rounded-2xl border border-[#1d2a1d] bg-[#040a06]">
      <div className="relative aspect-[9/13] w-full">
        <Suspense fallback={<Spinner label="Carregando replay…" />}>
          <Scene r={r} clock={clock} mode={mode} hudRef={hudRef} onEnd={onEnd} onCanvas={(c) => { canvas.current = c }} />
        </Suspense>
        {/* vinheta e desfoque nas bordas (efeito tilt-shift) */}
        <div className="pointer-events-none absolute inset-0" style={{ background: 'radial-gradient(ellipse at 50% 48%, rgba(0,0,0,0) 45%, rgba(0,0,0,.55) 100%)' }} />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[22%] backdrop-blur-[2.5px]" style={{ WebkitMaskImage: 'linear-gradient(#000, transparent)', maskImage: 'linear-gradient(#000, transparent)' }} />
        <div className="pointer-events-none absolute inset-x-0 bottom-[22%] h-[16%] backdrop-blur-[2.5px]" style={{ WebkitMaskImage: 'linear-gradient(transparent, #000)', maskImage: 'linear-gradient(transparent, #000)' }} />
        {hud.goal && <><div className="gol-flash pointer-events-none absolute inset-0 bg-white" /><div className="gol-banner pointer-events-none absolute inset-x-0 top-[34%] text-center font-display text-8xl font-extrabold uppercase leading-none text-lime drop-shadow-[0_0_24px_rgba(198,255,0,.8)]">GOL!</div></>}
        {/* HUD no estilo scan */}
        <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between p-3">
          <div className="font-display text-[11px] font-bold uppercase leading-tight tracking-widest text-sky-200/80">VÁRZEA PRO<br />REPLAY 3D</div>
          <div className="text-right font-display text-xl font-extrabold uppercase leading-none text-white">{r.title}</div>
        </div>
        <div className="absolute inset-x-0 top-14 flex justify-center gap-4 text-[11px] font-bold uppercase tracking-widest">
          <button onClick={() => { setMuted(!mute); setMute(!mute) }} className="absolute right-3 px-2 py-2 text-base" aria-label={mute ? 'Ligar som' : 'Desligar som'}>{mute ? '🔇' : '🔊'}</button>
          {MODES.map((m) => <button key={m.v} onClick={() => setMode(m.v)} className={`px-2 py-2 ${mode === m.v ? 'text-white' : 'text-sky-200/40'}`} disabled={m.v === 'gol' && !r.goal}>{m.l}</button>)}
        </div>
        <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#040a06] via-[#040a06]/80 to-transparent p-3 pt-16">
          <p className="mb-2 min-h-[2.6rem] text-center text-[15px] font-semibold leading-tight text-white drop-shadow">{hud.step}</p>
          <div className="grid grid-cols-3 items-end text-white">
            <div><div className="text-[10px] uppercase tracking-widest text-sky-200/60">Tempo</div><div className="font-display text-3xl font-extrabold leading-none">{hud.t.toFixed(1).replace('.', ',')}<span className="ml-0.5 text-xs text-sky-200/60">s</span></div></div>
            <div className="text-center"><div className="text-[10px] uppercase tracking-widest text-sky-200/60">Velocidade</div><div className="font-display text-3xl font-extrabold leading-none">{Math.round(hud.kmh)}<span className="ml-0.5 text-xs text-sky-200/60">km/h</span></div></div>
            <div className="text-right"><div className="text-[10px] uppercase tracking-widest text-sky-200/60">Distância</div><div className="font-display text-3xl font-extrabold leading-none">{Math.round(hud.dist)}<span className="ml-0.5 text-xs text-sky-200/60">m</span></div></div>
          </div>
        </div>
      </div>
      {showControls && <div className="space-y-2 border-t border-[#1d2a1d] bg-[#0a120b] p-3">
        <input type="range" min={0} max={r.duration} step={0.05} value={hud.t} onChange={(e) => seek(Number(e.target.value))} className="!min-h-0 !border-0 !bg-transparent !p-0 accent-lime" aria-label="Linha do tempo" />
        <div className="flex items-center gap-2">
          <button onClick={() => stepTo(-1)} className="btn btn-ghost btn-sm !min-w-[52px]" aria-label="Passo anterior">⏮</button>
          <button onClick={toggle} className="btn btn-primary btn-sm !min-w-[110px]">{playing ? '❚❚ Pausar' : '▶ Tocar'}</button>
          <button onClick={() => stepTo(1)} className="btn btn-ghost btn-sm !min-w-[52px]" aria-label="Próximo passo">⏭</button>
          {[1, 0.5, 0.25].map((s) => <button key={s} onClick={() => { clock.current.speed = s; setSpeed(s) }} className={`btn btn-sm ${speed === s ? 'btn-primary' : 'btn-ghost'}`}>{s === 1 ? '1x' : s === 0.5 ? '0,5x' : '0,25x'}</button>)}
        </div>
      </div>}
    </div>
  )
}
