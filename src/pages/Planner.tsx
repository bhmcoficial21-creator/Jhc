import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import { useData } from '../lib/data'
import { dayPlan, iso, type Load } from '../lib/planner'
import type { Season } from '../lib/types'
import { Btn, Card, Chips, Field, Lock, Notice } from '../components/ui'

const STYLE: Record<Load, string> = { LEVE: 'bg-sky-400 text-black', NORMAL: 'bg-zinc-300 text-black', PESADO: 'bg-danger text-black' }

export default function Planner() {
  const d = useData(), { annual } = useAuth()
  const [s, setS] = useState<Season>(d.season ?? { mode: 'custom', game_dates: [], final_date: null })
  const [dt, setDt] = useState('')
  const [saved, setSaved] = useState(false)
  if (!annual) return <div className="page space-y-4"><h1 className="text-5xl"><Lock className="mr-2" />Planner</h1><p className="text-zinc-300">O Planner de temporada faz parte do brinde do plano anual.</p><Link to="/app/perfil" className="btn btn-primary w-full">Migrar para o anual</Link></div>
  const page = d.content.guide.find((g) => g.kind === 'planner')
  const today = new Date(), month = new Date(today.getFullYear(), today.getMonth(), 1)
  const days = Array.from({ length: 35 }, (_, i) => new Date(month.getFullYear(), month.getMonth(), 1 - month.getDay() + i, 12))
  return (
    <div className="page space-y-4">
      <h1 className="text-5xl leading-none">Planner</h1>
      <Card className="space-y-4">
        <Field label="Seus jogos"><Chips value={s.mode} onChange={(v) => setS({ ...s, mode: v })} options={[{ v: 'custom', l: 'Escolher datas' }, { v: 'sabado', l: 'Jogo todo sábado' }, { v: 'domingo', l: 'Jogo todo domingo' }]} /></Field>
        {s.mode === 'custom' && <Field label="Adicionar data de jogo"><div className="flex gap-2"><input type="date" value={dt} onChange={(e) => setDt(e.target.value)} /><Btn small disabled={!dt} onClick={() => { setS({ ...s, game_dates: [...new Set([...s.game_dates, dt])].sort() }); setDt('') }}>Incluir</Btn></div></Field>}
        {s.game_dates.length > 0 && <div className="flex flex-wrap gap-2">{s.game_dates.map((g) => <button key={g} className="chip chip-on !min-h-[40px]" onClick={() => setS({ ...s, game_dates: s.game_dates.filter((x) => x !== g) })}>{new Date(g + 'T12:00').toLocaleDateString('pt-BR')} ✕</button>)}</div>}
        <Field label="Data da final ou do fim do campeonato"><input type="date" value={s.final_date ?? ''} onChange={(e) => setS({ ...s, final_date: e.target.value || null })} /></Field>
        <Btn className="w-full" onClick={async () => { await d.saveSeason(s); setSaved(true); setTimeout(() => setSaved(false), 2000) }}>{saved ? 'Salvo ✓' : 'Salvar'}</Btn>
      </Card>
      <Card className="space-y-2">
        <h2 className="text-2xl">{month.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}</h2>
        <div className="grid grid-cols-7 gap-1 text-center text-[11px] uppercase text-zinc-500">{['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((x, i) => <div key={i}>{x}</div>)}</div>
        <div className="grid grid-cols-7 gap-1">{days.map((x) => { const p = dayPlan(iso(x), s); const out = x.getMonth() !== month.getMonth(); return (
          <div key={x.toISOString()} className={`rounded-lg py-1.5 text-center ${STYLE[p.load]} ${out ? 'opacity-30' : ''}`}><div className="font-display text-lg font-extrabold leading-none">{x.getDate()}</div><div className="text-[8px] font-bold uppercase leading-tight">{p.tag === 'JOGO' ? 'jogo' : p.tag === 'RECUPERAÇÃO' ? 'recup.' : p.load}</div></div>) })}</div>
        <div className="flex gap-2 text-xs"><span className="chip !bg-sky-400 !text-black">LEVE</span><span className="chip !bg-zinc-300 !text-black">NORMAL</span><span className="chip !bg-danger !text-black">PESADO</span></div>
      </Card>
      {page && <Notice tone="info"><span className="whitespace-pre-line">{page.body}</span></Notice>}
    </div>
  )
}
