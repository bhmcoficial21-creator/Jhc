import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import { useData } from '../lib/data'
import { downloadConeMap } from '../lib/pdf'
import type { Exercise } from '../lib/types'
import { Btn, Card, Chip, Lock } from '../components/ui'

const SEL = 'min-h-[48px]'
const CAT_L: Record<string, string> = { aquecimento: 'Aquecimento', alongamento: 'Alongamento', pliometria: 'Pliometria', agilidade: 'Agilidade', jogo: 'Situação de jogo', prevencao: 'Prevenção', academia: 'Academia', campo: 'Campo ou quadra', habilidade: 'Habilidade com bola', posicao: 'Por posição', movimento: 'Movimento sem bola' }

export function MapButton({ ex }: { ex: Exercise }) {
  if (!ex.circuit) return null
  return <Btn variant="ghost" small onClick={() => downloadConeMap(ex.circuit!, ex.name)}>BAIXAR MAPA</Btn>
}

export default function Library() {
  const d = useData(), { annual } = useAuth()
  const [tab, setTab] = useState<'lib' | 'ref'>('lib')
  const [q, setQ] = useState('')
  const [f, setF] = useState({ level: '', place: '', space: '', equip: '', pos: '', kind: '', cat: '' })
  const [open, setOpen] = useState(false)
  const equipOpts = useMemo(() => [...new Set(d.content.exercises.flatMap((e) => e.equipment))].sort(), [d.content.exercises])
  const list = useMemo(() => d.content.exercises.filter((e) => {
    if (q && !e.name.toLowerCase().includes(q.toLowerCase()) && !e.objective.toLowerCase().includes(q.toLowerCase())) return false
    if (f.level && e.min_level > Number(f.level)) return false
    if (f.place && !e.locations.includes(f.place as never)) return false
    if (f.space && e.min_space !== f.space) return false
    if (f.equip && !e.equipment.includes(f.equip)) return false
    if (f.pos && e.positions.length && !e.positions.includes(f.pos as never)) return false
    if (f.kind && e.kind !== f.kind) return false
    if (f.cat && e.category !== f.cat) return false
    return true
  }), [d.content.exercises, q, f])
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLSelectElement>) => setF({ ...f, [k]: e.target.value })
  const cats = [...new Set(d.content.exercises.map((e) => e.category))]

  return (
    <div className="page space-y-3">
      <h1 className="text-5xl leading-none">Exercícios</h1>
      <div className="grid grid-cols-2 gap-2"><button className={`btn btn-sm ${tab === 'lib' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setTab('lib')}>Biblioteca</button><button className={`btn btn-sm ${tab === 'ref' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setTab('ref')}>Referências</button></div>
      {tab === 'ref' ? (
        <div className="space-y-3">
          <p className="muted">Links externos de outros professores, com crédito do autor. Os vídeos não são baixados nem reenviados pelo app.</p>
          {d.content.refs.length === 0 && <Card><p className="muted">Nenhuma referência cadastrada ainda.</p></Card>}
          {d.content.refs.map((r) => <Card key={r.id} className="space-y-1"><h3 className="text-xl">{r.title}</h3><p className="muted">Crédito: <b>{r.author}</b></p>{r.note && <p className="text-sm text-zinc-300">{r.note}</p>}<a className="btn btn-ghost btn-sm" href={r.url} target="_blank" rel="noopener noreferrer">Abrir link externo ↗</a></Card>)}
        </div>
      ) : <>
        <input placeholder="Buscar exercício…" value={q} onChange={(e) => setQ(e.target.value)} />
        <button className="chip !min-h-[40px]" onClick={() => setOpen(!open)}>{open ? 'Esconder filtros' : 'Filtros'}</button>
        {open && <div className="grid grid-cols-2 gap-2">
          <select className={SEL} value={f.cat} onChange={set('cat')}><option value="">Categoria</option>{cats.map((c) => <option key={c} value={c}>{CAT_L[c] ?? c}</option>)}</select>
          <select className={SEL} value={f.kind} onChange={set('kind')}><option value="">Tipo</option><option value="fisico">Físico</option><option value="habilidade">Habilidade</option></select>
          <select className={SEL} value={f.level} onChange={set('level')}><option value="">Nível</option><option value="1">Iniciante</option><option value="2">Intermediário</option><option value="3">Avançado</option></select>
          <select className={SEL} value={f.place} onChange={set('place')}><option value="">Local</option><option value="casa">Casa</option><option value="academia">Academia</option><option value="campo">Campo ou quadra</option></select>
          <select className={SEL} value={f.space} onChange={set('space')}><option value="">Espaço</option>{['2x2', '3x3', '10m', '20m', '30m'].map((s) => <option key={s} value={s}>{s.includes('x') ? `${s} m` : s.replace('m', ' m')}</option>)}</select>
          <select className={SEL} value={f.equip} onChange={set('equip')}><option value="">Equipamento</option>{equipOpts.map((s) => <option key={s} value={s}>{s}</option>)}</select>
          <select className={`${SEL} col-span-2`} value={f.pos} onChange={set('pos')}><option value="">Posição</option>{['goleiro', 'zagueiro', 'lateral', 'meia', 'atacante'].map((s) => <option key={s} value={s}>{s}</option>)}</select>
        </div>}
        <p className="muted">{list.length} exercícios</p>
        <div className="space-y-2">{list.map((e) => {
          const locked = e.annual_only && !annual
          return <Card key={e.id} className="space-y-2">
            <Link to={locked ? '/app/perfil' : `/app/biblioteca/${e.id}`} className="block">
              <h3 className="text-2xl leading-tight">{locked && <Lock className="mr-1" />}{e.name}</h3>
              <div className="mt-1 flex flex-wrap gap-1.5"><Chip on>{CAT_L[e.category] ?? e.category}</Chip>{e.locations.map((l) => <Chip key={l}>{l}</Chip>)}{e.kind === 'habilidade' && <Chip>habilidade</Chip>}{e.is_jump && <Chip>salto</Chip>}{e.min_level > 1 && <Chip>nível {e.min_level}+</Chip>}</div>
            </Link>
            {e.circuit && <MapButton ex={e} />}
          </Card>
        })}</div>
      </>}
    </div>
  )
}
