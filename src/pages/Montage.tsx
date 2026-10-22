import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useData } from '../lib/data'
import { REPLAY_CATS } from '../seed/replays'
import ReplayPlayer, { type PlayerApi } from '../components/replay/ReplayPlayer'
import { Btn, Notice } from '../components/ui'

/** Montagem: todos os replays em sequência, com cartela de título; dá para gravar em vídeo (.webm). */
export default function Montage() {
  const d = useData()
  const list = d.content.replays.filter((r) => r.published !== false)
  const [i, setI] = useState(-1)          // -1 = parado
  const [card, setCard] = useState(true)
  const [recording, setRecording] = useState(false)
  const [url, setUrl] = useState<string | null>(null)
  const api = useRef<PlayerApi | null>(null)
  const rec = useRef<{ mr: MediaRecorder; chunks: Blob[]; raf: number } | null>(null)
  const cur = list[i]

  useEffect(() => { if (i < 0) return; setCard(true); const t = setTimeout(() => setCard(false), 1700); return () => clearTimeout(t) }, [i])
  const next = () => setTimeout(() => setI((x) => (x + 1 < list.length ? x + 1 : (stop(), -1))), 700)

  const start = (record: boolean) => {
    setUrl(null); setI(0)
    if (!record) return
    const W = 540, H = 780, cv = document.createElement('canvas'); cv.width = W; cv.height = H
    const ctx = cv.getContext('2d')!
    const stream = cv.captureStream(30)
    const mime = ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm'].find((m) => MediaRecorder.isTypeSupported(m))
    const mr = new MediaRecorder(stream, mime ? { mimeType: mime, videoBitsPerSecond: 3_500_000 } : undefined), chunks: Blob[] = []
    mr.ondataavailable = (e) => e.data.size && chunks.push(e.data)
    mr.onstop = () => setUrl(URL.createObjectURL(new Blob(chunks, { type: 'video/webm' })))
    const draw = () => {
      const st = (window as unknown as { __montage?: { title: string; sub: string; card: boolean } }).__montage
      ctx.fillStyle = '#040a06'; ctx.fillRect(0, 0, W, H)
      const src = api.current?.canvas
      if (st && !st.card && src && src.width) { const s = Math.max(W / src.width, H / src.height); ctx.drawImage(src, (W - src.width * s) / 2, (H - src.height * s) / 2, src.width * s, src.height * s) }
      ctx.fillStyle = '#9fd0ff'; ctx.font = '700 14px sans-serif'; ctx.fillText('VÁRZEA PRO · REPLAY 3D', 18, 28)
      if (st) {
        if (st.card) { ctx.fillStyle = '#c6ff00'; ctx.font = '800 44px "Barlow Condensed", Impact, sans-serif'; wrap(ctx, st.title.toUpperCase(), W / 2, H / 2 - 20, W - 60, 48); ctx.fillStyle = '#cfe0ff'; ctx.font = '600 20px sans-serif'; ctx.textAlign = 'center'; ctx.fillText(st.sub, W / 2, H / 2 + 90); ctx.textAlign = 'left' }
        else { const h = api.current?.hud(); ctx.fillStyle = '#fff'; ctx.font = '800 28px "Barlow Condensed", Impact, sans-serif'; ctx.textAlign = 'right'; ctx.fillText(st.title.toUpperCase(), W - 18, 30); ctx.textAlign = 'left'
          if (h) { ctx.font = '600 17px sans-serif'; ctx.textAlign = 'center'; wrap(ctx, h.step, W / 2, H - 120, W - 40, 22); ctx.textAlign = 'left'; ctx.font = '800 30px "Barlow Condensed", Impact, sans-serif'; ctx.fillText(`${h.t.toFixed(1)} s`, 18, H - 28); ctx.textAlign = 'center'; ctx.fillText(`${Math.round(h.kmh)} km/h`, W / 2, H - 28); ctx.textAlign = 'right'; ctx.fillText(`${Math.round(h.dist)} m`, W - 18, H - 28); ctx.textAlign = 'left' } }
      }
      rec.current!.raf = requestAnimationFrame(draw)
    }
    rec.current = { mr, chunks, raf: 0 }; mr.start(); draw(); setRecording(true)
  }
  const stop = () => { if (rec.current) { cancelAnimationFrame(rec.current.raf); if (rec.current.mr.state !== 'inactive') rec.current.mr.stop(); rec.current = null; setRecording(false) } }
  useEffect(() => stop, [])
  useEffect(() => { (window as unknown as { __montage?: unknown }).__montage = cur ? { title: cur.title, sub: `${i + 1}/${list.length} · ${REPLAY_CATS[cur.category]}`, card } : undefined }, [cur, card, i, list.length])

  return (
    <div className="page space-y-3">
      <Link to="/app/bola" className="text-sm text-lime underline">← Treino com bola</Link>
      <h1 className="text-5xl leading-none">Montagem</h1>
      <p className="muted">Todos os treinos em sequência, no estilo replay 3D. Grave em vídeo para guardar ou compartilhar.</p>
      {cur ? <div className="relative">
        <ReplayPlayer key={cur.id} r={cur} loop={false} showControls={false} onEnd={next} apiRef={api} />
        {card && <div className="absolute inset-0 grid place-items-center bg-[#040a06] p-6 text-center"><div><p className="font-display text-sm font-bold uppercase tracking-widest text-sky-200/70">{i + 1}/{list.length} · {REPLAY_CATS[cur.category]}</p><h2 className="mt-2 text-5xl leading-none text-lime">{cur.title}</h2></div></div>}
      </div> : null}
      <div className="grid gap-2">
        <Btn onClick={() => start(false)} disabled={recording || list.length === 0}>▶ Assistir montagem</Btn>
        <Btn variant="ghost" onClick={() => start(true)} disabled={recording || typeof MediaRecorder === 'undefined' || list.length === 0}>● Gravar montagem em vídeo</Btn>
        {i >= 0 && <Btn variant="ghost" onClick={() => { stop(); setI(-1) }}>■ Parar</Btn>}
      </div>
      {recording && <Notice tone="warn">Gravando… mantenha esta tela aberta até o fim (cerca de {Math.round(list.reduce((a, r) => a + r.duration + 2.4, 0))} s).</Notice>}
      {url && <Notice tone="info">Vídeo pronto. <a className="underline" href={url} download="varzea-pro-montagem.webm">Baixar (.webm)</a></Notice>}
    </div>
  )
}

function wrap(ctx: CanvasRenderingContext2D, text: string, cx: number, y: number, maxW: number, lh: number) {
  const words = text.split(' '); let line = ''; const lines: string[] = []
  for (const w of words) { const t = line ? line + ' ' + w : w; if (ctx.measureText(t).width > maxW && line) { lines.push(line); line = w } else line = t }
  lines.push(line); ctx.textAlign = 'center'; lines.forEach((l, k) => ctx.fillText(l, cx, y + k * lh)); ctx.textAlign = 'left'
}
