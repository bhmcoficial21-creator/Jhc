import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useData } from '../lib/data'
import type { Place, Position, Profile } from '../lib/types'
import { Btn, Chips, Field, Notice } from '../components/ui'

const EQUIP: Record<Place, { v: string; l: string }[]> = {
  casa: [{ v: 'cones', l: 'Cones / chapéus' }, { v: 'corda', l: 'Corda' }, { v: 'degrau', l: 'Degrau ou caixa estável' }, { v: 'nenhum', l: 'Nenhum' }],
  academia: [{ v: 'caixa', l: 'Caixa pliométrica' }, { v: 'barra', l: 'Barra' }, { v: 'halteres', l: 'Halteres' }, { v: 'elasticos', l: 'Elásticos' }, { v: 'anilhas', l: 'Anilhas' }, { v: 'tudo', l: 'Tem de tudo' }],
  campo: [{ v: 'cones', l: 'Cones' }, { v: 'ladeira', l: 'Ladeira' }, { v: 'escada', l: 'Escada' }],
}
const PLACE_L: Record<Place, string> = { casa: 'Em casa', academia: 'Academia', campo: 'Campo ou quadra' }
const AREAS = [{ v: 'joelhos', l: 'Joelhos' }, { v: 'tornozelos', l: 'Tornozelos' }, { v: 'quadril', l: 'Quadril' }, { v: 'costas', l: 'Costas' }]

export default function Onboarding() {
  const { saveProfile, profile } = useData()
  const [d, setD] = useState<Partial<Profile>>({ locations: [], equipment: {}, health_areas: [], health_pain: undefined as never, ...(profile ?? {}) })
  const [step, setStep] = useState(0)
  const [terms, setTerms] = useState(false), [consent, setConsent] = useState(false)
  const [saving, setSaving] = useState(false)
  const set = (p: Partial<Profile>) => setD((x) => ({ ...x, ...p }))
  const toggle = <T,>(list: T[] | undefined, v: T) => ((list ?? []).includes(v) ? (list ?? []).filter((x) => x !== v) : [...(list ?? []), v])
  const age = d.birth_year ? new Date().getFullYear() - d.birth_year : null
  const locs = d.locations ?? []

  const steps: { title: string; ok: boolean; body: React.ReactNode }[] = [
    { title: 'Qual sua posição?', ok: !!d.position, body: <Chips<Position> value={d.position ?? null} onChange={(v) => set({ position: v })} options={[{ v: 'goleiro', l: 'Goleiro' }, { v: 'zagueiro', l: 'Zagueiro' }, { v: 'lateral', l: 'Lateral' }, { v: 'meia', l: 'Meia' }, { v: 'atacante', l: 'Atacante' }]} /> },
    { title: 'Qual seu nível?', ok: !!d.level, body: <Chips value={d.level ?? null} onChange={(v) => set({ level: v })} options={[{ v: 'iniciante', l: 'Iniciante' }, { v: 'intermediario', l: 'Intermediário' }, { v: 'avancado', l: 'Avançado' }]} /> },
    { title: 'Quantos dias por semana?', ok: !!d.days_per_week, body: <Chips value={d.days_per_week ? String(d.days_per_week) : null} onChange={(v) => set({ days_per_week: Number(v) as 2 | 3 | 4 })} options={[{ v: '2', l: '2 dias' }, { v: '3', l: '3 dias' }, { v: '4', l: '4 dias' }]} /> },
    { title: 'Onde você costuma treinar?', ok: locs.length > 0, body: <><p className="muted mb-3">Pode marcar mais de um.</p><Chips<Place> multi value={locs} onChange={(v) => set({ locations: toggle(locs, v) })} options={(['casa', 'academia', 'campo'] as Place[]).map((p) => ({ v: p, l: PLACE_L[p] }))} /></> },
    { title: 'Em que campo você joga?', ok: !!d.field_type, body: <Chips value={d.field_type ?? null} onChange={(v) => set({ field_type: v })} options={[{ v: 'sintetico', l: 'Sintético' }, { v: 'grama', l: 'Grama' }, { v: 'terra', l: 'Terra' }]} /> },
    ...(locs.includes('casa') ? [{ title: 'Espaço disponível em casa', ok: !!d.home_space, body: <Chips value={d.home_space ?? null} onChange={(v) => set({ home_space: v })} options={[{ v: '2x2', l: '2x2 m' }, { v: '3x3', l: '3x3 m' }, { v: 'mais', l: 'Mais que isso' }]} /> }] : []),
    { title: 'Equipamentos que você tem', ok: locs.every((p) => (d.equipment?.[p]?.length ?? 0) > 0), body: <div className="space-y-5">{locs.map((p) => <Field key={p} label={PLACE_L[p]}><Chips multi value={d.equipment?.[p] ?? []} options={EQUIP[p]} onChange={(v) => {
      const cur = d.equipment?.[p] ?? []
      const next = v === 'nenhum' ? ['nenhum'] : toggle(cur.filter((x) => x !== 'nenhum'), v)
      set({ equipment: { ...d.equipment, [p]: next } })
    }} /></Field>)}</div> },
    { title: 'Você sente dor ou tem lesão agora?', ok: d.health_pain !== undefined && (!d.health_pain || (d.health_areas?.length ?? 0) > 0), body: <div className="space-y-4">
      <p className="muted">Joelhos, tornozelos, quadril ou costas.</p>
      <Chips value={d.health_pain === undefined ? null : d.health_pain ? 'sim' : 'nao'} onChange={(v) => set({ health_pain: v === 'sim', caution: v === 'sim', health_areas: v === 'sim' ? d.health_areas : [] })} options={[{ v: 'nao', l: 'Não' }, { v: 'sim', l: 'Sim' }]} />
      {d.health_pain && <><Chips multi value={d.health_areas ?? []} onChange={(v) => set({ health_areas: toggle(d.health_areas, v) })} options={AREAS} />
        <Notice tone="danger"><b>Procure um médico ou outro profissional de saúde, presencialmente, antes de treinar.</b> Seu perfil ficará em <b>cautela</b>: sem exercícios de salto até você confirmar a liberação.</Notice></>}
    </div> },
    { title: 'Sua idade', ok: !!d.birth_year && age !== null && age >= 16 && age < 100 && (age >= 18 || !!d.guardian_ok), body: <div className="space-y-3">
      <Field label="Ano de nascimento"><input inputMode="numeric" placeholder="1995" value={d.birth_year ?? ''} onChange={(e) => set({ birth_year: Number(e.target.value.replace(/\D/g, '').slice(0, 4)) || null })} /></Field>
      {age !== null && d.birth_year! > 1900 && age < 16 && <Notice tone="danger">O app é para quem tem 16 anos ou mais.</Notice>}
      {age !== null && age >= 16 && age < 18 && <label className="flex items-start gap-3 rounded-xl border border-warn/50 p-3 text-zinc-100"><input type="checkbox" className="mt-1 !h-6 !w-6" checked={!!d.guardian_ok} onChange={(e) => set({ guardian_ok: e.target.checked })} /><span>Sou menor de 18 anos e meu responsável está ciente e de acordo com o uso do app.</span></label>}
    </div> },
    { title: 'Termos e consentimento', ok: terms && consent, body: <div className="space-y-3">
      <label className="flex items-start gap-3 text-zinc-100"><input type="checkbox" className="mt-1 !h-6 !w-6" checked={terms} onChange={(e) => setTerms(e.target.checked)} /><span>Entendo que o app <b>não substitui orientação médica nem de profissional de educação física</b> e aceito os <Link to="/termos" target="_blank" className="underline">termos</Link>.</span></label>
      <label className="flex items-start gap-3 text-zinc-100"><input type="checkbox" className="mt-1 !h-6 !w-6" checked={consent} onChange={(e) => setConsent(e.target.checked)} /><span>Consinto com o tratamento dos meus <b>dados de saúde</b> (dor, lesão) para adaptar o treino, conforme a <Link to="/privacidade" target="_blank" className="underline">política de privacidade</Link>.</span></label>
    </div> },
  ]
  const s = steps[step], last = step === steps.length - 1
  const finish = async () => {
    setSaving(true)
    await saveProfile({ ...d, onboarded: true, terms_accepted_at: new Date().toISOString(), health_consent_at: new Date().toISOString(), caution: !!d.health_pain || !!d.caution } as Partial<Profile>)
    setSaving(false)
  }
  return (
    <div className="mx-auto flex min-h-screen max-w-xl flex-col px-4 py-6">
      <div className="mb-6 h-2 overflow-hidden rounded-full bg-panel2"><div className="h-full bg-lime transition-all" style={{ width: `${((step + 1) / steps.length) * 100}%` }} /></div>
      <h1 className="mb-5 text-4xl leading-none">{s.title}</h1>
      <div className="flex-1">{s.body}</div>
      <div className="flex gap-2 pt-6">
        {step > 0 && <Btn variant="ghost" onClick={() => setStep(step - 1)}>Voltar</Btn>}
        <Btn className="flex-1" disabled={!s.ok || saving} onClick={() => (last ? finish() : setStep(step + 1))}>{last ? (saving ? 'Salvando…' : 'Começar') : 'Continuar'}</Btn>
      </div>
    </div>
  )
}
