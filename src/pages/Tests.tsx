import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useData } from '../lib/data'
import { workoutAt } from '../lib/schedule'
import type { TestRow } from '../lib/types'
import { Btn, Card, Chips, Field, Notice } from '../components/ui'

const DEF = {
  salto_horizontal: { label: 'Salto horizontal parado', unit: 'cm', how: 'Fita métrica no chão. Pés atrás da marca, salte o mais longe possível com os dois pés e meça do início até o calcanhar mais próximo. Melhor de 3.', better: 'up' },
  salto_vertical: { label: 'Salto vertical', unit: 'cm', how: 'Marque a ponta dos dedos na parede em pé; salte e marque o ponto mais alto. A diferença em cm é o resultado. Melhor de 3.', better: 'up' },
  agilidade: { label: 'Agilidade 5-10-5', unit: 's', how: 'Cronometre no celular. Sempre o mesmo teste nas três medições.', better: 'down' },
} as const
type Kind = keyof typeof DEF
const VARIANTS = [{ v: '5-10-5', l: '5-10-5 (10 m livres)' }, { v: 'arrancada 5 m', l: 'Arrancada de 5 m' }, { v: 'T-drill reduzido', l: 'T-drill reduzido' }]

export function testSummary(tests: TestRow[]) {
  return (Object.keys(DEF) as Kind[]).flatMap((k) => {
    const rows = tests.filter((t) => t.kind === k).sort((a, b) => a.phase - b.phase)
    if (rows.length < 2) return []
    const first = rows[0].value, last = rows[rows.length - 1].value
    const pct = DEF[k].better === 'up' ? ((last - first) / first) * 100 : ((first - last) / first) * 100
    return [{ kind: k, label: DEF[k].label, pct }]
  })
}

export function TestChart({ tests }: { tests: TestRow[] }) {
  return <div className="grid gap-3">{(Object.keys(DEF) as Kind[]).map((k) => {
    const rows = tests.filter((t) => t.kind === k).sort((a, b) => a.phase - b.phase)
    if (!rows.length) return null
    const vals = rows.map((r) => r.value), lo = Math.min(...vals) * 0.9, hi = Math.max(...vals) * 1.05 || 1
    const X = (p: number) => 20 + ({ 1: 0, 4: 1, 8: 2 }[p as 1 | 4 | 8]) * 100, Y = (v: number) => 70 - ((v - lo) / (hi - lo || 1)) * 55
    return <div key={k}><p className="text-sm font-semibold">{DEF[k].label} <span className="muted">({DEF[k].unit}{rows[0].variant ? ` · ${rows[0].variant}` : ''})</span></p>
      <svg viewBox="0 0 240 85" className="w-full"><polyline fill="none" stroke="#c6ff00" strokeWidth="2" points={rows.map((r) => `${X(r.phase)},${Y(r.value)}`).join(' ')} />
        {[1, 4, 8].map((p) => <text key={p} x={X(p)} y="82" fontSize="8" textAnchor="middle" fill="#888">sem. {p}</text>)}
        {rows.map((r) => <g key={r.phase}><circle cx={X(r.phase)} cy={Y(r.value)} r="4" fill="#c6ff00" /><text x={X(r.phase)} y={Y(r.value) - 8} fontSize="9" textAnchor="middle" fill="#fff">{String(r.value).replace('.', ',')}</text></g>)}</svg></div>
  })}</div>
}

function Stopwatch({ onValue }: { onValue: (s: number) => void }) {
  const [t0, setT0] = useState<number | null>(null), [now, setNow] = useState(0)
  useEffect(() => { if (t0 === null) return; const iv = setInterval(() => setNow(Date.now() - t0), 50); return () => clearInterval(iv) }, [t0])
  return <div className="flex items-center gap-2">
    <Btn small variant="ghost" onClick={() => { if (t0 === null) { setNow(0); setT0(Date.now()) } else { onValue(Math.round(((Date.now() - t0) / 1000) * 100) / 100); setT0(null) } }}>{t0 === null ? 'Iniciar cronômetro' : 'Parar'}</Btn>
    {t0 !== null && <span className="font-display text-3xl">{(now / 1000).toFixed(2).replace('.', ',')}s</span>}
  </div>
}

export default function Tests() {
  const d = useData()
  const at = d.program ? workoutAt(d.program, d.programIdx) : null
  const wk = at?.weekNo ?? 1
  const allowed = ([1, 4, 8] as const).filter((p) => wk >= p)
  const [phase, setPhase] = useState<1 | 4 | 8>(allowed[allowed.length - 1] ?? 1)
  const first = d.tests.find((t) => t.kind === 'agilidade')
  const [variant, setVariant] = useState(first?.variant ?? '5-10-5')
  const [vals, setVals] = useState<Partial<Record<Kind, string>>>({})
  const [msg, setMsg] = useState('')
  const save = async (k: Kind) => {
    const v = Number((vals[k] ?? '').replace(',', '.')); if (!v || v <= 0) return
    await d.saveTest({ kind: k, phase, value: v, variant: k === 'agilidade' ? (first?.variant ?? variant) : null } as TestRow)
    setMsg(`${DEF[k].label} salvo.`); setVals({ ...vals, [k]: '' })
  }
  return (
    <div className="page space-y-4">
      <Link to="/app/progresso" className="text-sm text-lime underline">← Progresso</Link>
      <h1 className="text-5xl leading-none">Testes</h1>
      <p className="muted">Na semana 1, 4 e 8. Faça depois do aquecimento, em dia descansado.</p>
      <Chips value={String(phase)} onChange={(v) => setPhase(Number(v) as 1 | 4 | 8)} options={([1, 4, 8] as const).map((p) => ({ v: String(p), l: `Semana ${p}${allowed.includes(p) ? '' : ' 🔒'}` }))} />
      {!allowed.includes(phase) && <Notice>Este teste libera quando você chegar à semana {phase} do programa (você está na semana {wk}).</Notice>}
      {(Object.keys(DEF) as Kind[]).map((k) => {
        const cur = d.tests.find((t) => t.kind === k && t.phase === phase)
        return <Card key={k} className="space-y-3">
          <h2 className="text-2xl">{DEF[k].label}</h2><p className="muted">{DEF[k].how}</p>
          {k === 'agilidade' && (first ? <p className="muted">Teste fixo: <b>{first.variant}</b> (use sempre o mesmo nas três medições).</p> : <Field label="Escolha o teste (vale para as 3 medições)"><Chips value={variant} onChange={setVariant} options={VARIANTS} /></Field>)}
          {k === 'agilidade' && allowed.includes(phase) && <Stopwatch onValue={(s) => setVals({ ...vals, agilidade: String(s).replace('.', ',') })} />}
          <div className="flex gap-2"><input inputMode="decimal" placeholder={`Resultado (${DEF[k].unit})`} value={vals[k] ?? ''} onChange={(e) => setVals({ ...vals, [k]: e.target.value })} disabled={!allowed.includes(phase)} />
            <Btn disabled={!allowed.includes(phase) || !vals[k]} onClick={() => save(k)}>Salvar</Btn></div>
          {cur && <p className="text-sm text-lime">Registrado na semana {phase}: {String(cur.value).replace('.', ',')} {DEF[k].unit}</p>}
        </Card>
      })}
      {msg && <Notice tone="info">{msg}</Notice>}
      {d.tests.length > 0 && <Card><h2 className="mb-2 text-2xl">Evolução</h2><TestChart tests={d.tests} />{testSummary(d.tests).map((s) => <p key={s.kind} className="mt-1 text-sm">{s.label}: <b className={s.pct >= 0 ? 'text-lime' : 'text-danger'}>{s.pct >= 0 ? '+' : ''}{s.pct.toFixed(1).replace('.', ',')}%</b></p>)}</Card>}
    </div>
  )
}
