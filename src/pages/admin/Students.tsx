import { useEffect, useState } from 'react'
import { hasAccess } from '../../lib/access'
import { DEMO, lsGet, lsSet, supabase } from '../../lib/supabase'
import { listRows } from '../../lib/store'
import type { Profile, Subscription } from '../../lib/types'
import { Btn, Card, Chip, Field, Notice } from '../../components/ui'

export default function Students() {
  const [subs, setSubs] = useState<Subscription[]>([]), [profiles, setProfiles] = useState<Profile[]>([]), [msg, setMsg] = useState(''), [email, setEmail] = useState(''), [plan, setPlan] = useState<'mensal' | 'anual'>('mensal'), [q, setQ] = useState('')
  const load = async () => { setSubs(await listRows<Subscription>('subscriptions')); setProfiles(await listRows<Profile>('profiles')) }
  useEffect(() => { load() }, [])

  const act = async (e: string, action: 'grant' | 'revoke' | 'clear', p?: 'mensal' | 'anual') => {
    setMsg('')
    try {
      if (DEMO) {
        const rows = lsGet<Subscription[]>('vp:t:subscriptions', []), i = rows.findIndex((r) => r.email === e)
        const base: Subscription = i >= 0 ? rows[i] : { email: e, plan: p ?? 'mensal', status: 'active', period_end: new Date(Date.now() + 31 * 86_400_000).toISOString(), manual_override: null, price_phase: 1 }
        const next = { ...base, plan: p ?? base.plan, manual_override: action === 'clear' ? null : action }
        if (i >= 0) rows[i] = next; else rows.push(next); lsSet('vp:t:subscriptions', rows)
      } else {
        const { error } = await supabase.functions.invoke('admin-grant', { body: { email: e, action, plan: p } })
        if (error) throw error
      }
      setMsg('Atualizado.'); await load()
    } catch (x) { setMsg('Erro: ' + (x as Error).message) }
  }
  const shown = subs.filter((s) => s.email.includes(q.toLowerCase()))
  return (
    <div className="space-y-3">
      <h2 className="text-3xl">Alunos e assinaturas</h2>
      <Card className="space-y-2"><Field label="Liberar acesso manual (cria o aluno pelo e-mail)"><input type="email" placeholder="email@aluno.com" value={email} onChange={(e) => setEmail(e.target.value)} /></Field>
        <div className="flex gap-2"><select value={plan} onChange={(e) => setPlan(e.target.value as never)}><option value="mensal">Mensal</option><option value="anual">Anual</option></select><Btn disabled={!email} onClick={() => { act(email.trim().toLowerCase(), 'grant', plan); setEmail('') }}>Liberar</Btn></div></Card>
      {msg && <Notice tone="info">{msg}</Notice>}
      <input placeholder="Buscar e-mail…" value={q} onChange={(e) => setQ(e.target.value)} />
      <p className="muted">{shown.length} assinaturas</p>
      {shown.map((s) => { const ok = hasAccess(s), p = profiles.find((x) => x.user_id === s.user_id); return (
        <Card key={s.email} className="space-y-2">
          <div className="flex items-start justify-between gap-2"><div className="min-w-0"><p className="truncate font-semibold">{s.email}</p><p className="muted">{s.plan} · fase {s.price_phase} · {s.status} · fim {s.period_end ? new Date(s.period_end).toLocaleDateString('pt-BR') : '—'}</p>{p && <p className="muted">{p.position} · {p.level}{p.caution ? ' · cautela' : ''}</p>}</div>
            <div className="flex flex-col items-end gap-1"><Chip on={ok}>{ok ? 'com acesso' : 'bloqueado'}</Chip>{s.manual_override && <Chip>manual: {s.manual_override}</Chip>}</div></div>
          <div className="grid grid-cols-3 gap-2"><Btn small variant="ghost" onClick={() => act(s.email, 'grant')}>Liberar</Btn><Btn small variant="ghost" onClick={() => act(s.email, 'revoke')}>Revogar</Btn><Btn small variant="ghost" onClick={() => act(s.email, 'clear')}>Automático</Btn></div>
        </Card>) })}
    </div>
  )
}
