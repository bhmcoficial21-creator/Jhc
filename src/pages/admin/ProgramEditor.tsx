import { useState } from 'react'
import { useData } from '../../lib/data'
import type { Program, ProgramWeek, Workout, WorkoutItem } from '../../lib/types'
import { Btn, Card, Chip } from '../../components/ui'
import Crud from './Crud'

const BLOCKS: { k: 'warmup' | 'main' | 'cooldown'; l: string }[] = [{ k: 'warmup', l: 'Aquecimento (obrigatório)' }, { k: 'main', l: 'Bloco principal' }, { k: 'cooldown', l: 'Volta à calma (alongamento parado)' }]
const num = (v: string) => (v === '' ? undefined : Number(v))

function ItemRow({ it, onChange, onDel, ids }: { it: WorkoutItem; onChange: (i: WorkoutItem) => void; onDel: () => void; ids: string }) {
  const f = (k: keyof WorkoutItem) => (e: React.ChangeEvent<HTMLInputElement>) => onChange({ ...it, [k]: num(e.target.value) })
  return <div className="space-y-1.5 rounded-xl border border-line p-2">
    <div className="flex gap-1.5"><input list={ids} value={it.ex} onChange={(e) => onChange({ ...it, ex: e.target.value })} placeholder="id do exercício" /><Btn type="button" small variant="ghost" onClick={onDel}>✕</Btn></div>
    <div className="grid grid-cols-4 gap-1.5">
      <label className="muted">Séries<input inputMode="numeric" value={it.sets ?? ''} onChange={f('sets')} /></label>
      <label className="muted">Reps<input inputMode="numeric" value={it.reps ?? ''} onChange={f('reps')} /></label>
      <label className="muted">Seg.<input inputMode="numeric" value={it.secs ?? ''} onChange={f('secs')} /></label>
      <label className="muted">Descanso<input inputMode="numeric" value={it.rest ?? ''} onChange={f('rest')} /></label>
    </div>
    <div className="flex flex-wrap gap-3 text-sm text-zinc-300">{(['side', 'rate', 'cmd'] as const).map((k) => <label key={k} className="flex items-center gap-1.5"><input type="checkbox" className="!h-5 !w-5" checked={!!it[k]} onChange={(e) => onChange({ ...it, [k]: e.target.checked || undefined })} />{k === 'side' ? 'por lado' : k === 'rate' ? 'nota 0-10' : 'reação a comando'}</label>)}</div>
    <input placeholder='Troca por posição, ex.: {"goleiro":"goleiro_saida","meia":"meia_giro"}' defaultValue={it.pos ? JSON.stringify(it.pos) : ''} onChange={(e) => { try { onChange({ ...it, pos: e.target.value ? JSON.parse(e.target.value) : undefined }) } catch { /* aguarda JSON válido */ } }} />
  </div>
}

function WeeksEditor({ weeks, onChange }: { weeks: ProgramWeek[]; onChange: (w: ProgramWeek[]) => void }) {
  const d = useData()
  const [open, setOpen] = useState<string | null>('0-0')
  const setW = (wi: number, patch: Partial<ProgramWeek>) => onChange(weeks.map((w, i) => (i === wi ? { ...w, ...patch } : w)))
  const setWo = (wi: number, oi: number, patch: Partial<Workout>) => setW(wi, { workouts: weeks[wi].workouts.map((o, j) => (j === oi ? { ...o, ...patch } : o)) })
  const blank = (): Workout => ({ title: 'Novo treino', heavy: false, warmup: [], main: [], cooldown: [] })
  return <div className="space-y-3">
    <datalist id="ex-ids">{d.content.exercises.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}</datalist>
    {weeks.map((w, wi) => <Card key={wi} className="space-y-2">
      <div className="flex items-center gap-2"><b className="font-display text-2xl">Semana {w.week}</b><input value={w.phase} onChange={(e) => setW(wi, { phase: e.target.value })} className="!w-40" /><Btn type="button" small variant="ghost" onClick={() => onChange(weeks.filter((_, i) => i !== wi).map((x, i) => ({ ...x, week: i + 1 })))}>✕</Btn></div>
      {w.workouts.map((o, oi) => { const key = `${wi}-${oi}`; return <div key={oi} className="rounded-xl border border-line p-2">
        <button type="button" className="flex w-full items-center justify-between text-left" onClick={() => setOpen(open === key ? null : key)}><span className="font-semibold">{o.title}</span><span>{o.heavy ? <Chip>pesado</Chip> : <Chip on>leve</Chip>}</span></button>
        {open === key && <div className="mt-2 space-y-3">
          <input value={o.title} onChange={(e) => setWo(wi, oi, { title: e.target.value })} />
          <div className="flex gap-4 text-sm"><label className="flex items-center gap-2"><input type="checkbox" className="!h-5 !w-5" checked={o.heavy} onChange={(e) => setWo(wi, oi, { heavy: e.target.checked })} />Treino pesado</label><label className="flex items-center gap-2"><input type="checkbox" className="!h-5 !w-5" checked={!!o.light} onChange={(e) => setWo(wi, oi, { light: e.target.checked })} />Versão leve (usada em dias LEVE)</label></div>
          {BLOCKS.map((b) => <div key={b.k} className="space-y-1.5"><p className="font-display text-lg font-bold uppercase text-lime">{b.l}</p>
            {o[b.k].map((it, ii) => <ItemRow key={ii} it={it} ids="ex-ids" onChange={(n) => setWo(wi, oi, { [b.k]: o[b.k].map((x, j) => (j === ii ? n : x)) })} onDel={() => setWo(wi, oi, { [b.k]: o[b.k].filter((_, j) => j !== ii) })} />)}
            <Btn type="button" small variant="ghost" onClick={() => setWo(wi, oi, { [b.k]: [...o[b.k], { ex: '', sets: 1, reps: 8, rest: 45 }] })}>+ Exercício</Btn></div>)}
          <Btn type="button" small variant="ghost" onClick={() => setW(wi, { workouts: w.workouts.filter((_, j) => j !== oi) })}>Excluir treino</Btn></div>}
      </div> })}
      <Btn type="button" small variant="ghost" onClick={() => setW(wi, { workouts: [...w.workouts, blank()] })}>+ Treino na semana</Btn>
    </Card>)}
    <Btn type="button" variant="ghost" className="w-full" onClick={() => onChange([...weeks, { week: weeks.length + 1, phase: 'JOGO', workouts: [blank()] }])}>+ Semana</Btn>
  </div>
}

export default function ProgramEditor() {
  const d = useData()
  return <Crud ckey="programs" title="Programas" titleOf={(r) => (r as unknown as Program).name} subtitleOf={(r) => { const p = r as unknown as Program; return `${p.weeks.length} semanas · libera no mês ${p.release_month}${p.annual_only ? ' · anual' : ''}${p.published ? '' : ' · rascunho'}` }}
    blank={() => ({ id: '', name: '', description: '', order_idx: d.content.programs.length + 1, release_month: d.content.programs.length, annual_only: false, published: false, weeks: [] })}
    validate={(r) => (!r.id ? 'Informe o id (ex.: prog3).' : !(r.name as string) ? 'Informe o nome.' : (r.weeks as ProgramWeek[]).some((w) => w.workouts.some((o) => [...o.warmup, ...o.main, ...o.cooldown].some((i) => !d.exMap.has(i.ex)))) ? 'Há exercício com id inexistente.' : (r.weeks as ProgramWeek[]).some((w) => w.workouts.some((o) => o.warmup.length === 0)) ? 'Todo treino precisa de aquecimento.' : null)}
    fields={[
      { key: 'id', label: 'Id (único)', type: 'text' }, { key: 'name', label: 'Nome', type: 'text' }, { key: 'description', label: 'Descrição', type: 'textarea' },
      { key: 'order_idx', label: 'Ordem', type: 'number' }, { key: 'release_month', label: 'Libera após N meses de assinatura (um programa por mês)', type: 'number' },
      { key: 'annual_only', label: 'Exclusivo do plano anual', type: 'bool' }, { key: 'published', label: 'Publicado', type: 'bool' },
      { key: 'weeks', label: 'Semanas, treinos e exercícios (séries, repetições e descanso)', type: 'custom', render: (v, _r, set) => <WeeksEditor weeks={(v as ProgramWeek[]) ?? []} onChange={set} /> },
    ]} />
}
