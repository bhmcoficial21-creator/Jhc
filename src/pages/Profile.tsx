import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import { brl } from '../lib/content'
import { useData } from '../lib/data'
import { DEMO, supabase } from '../lib/supabase'
import type { Position } from '../lib/types'
import { Btn, Card, Chips, ExtLink, Field, Lock, Notice } from '../components/ui'

export default function Profile() {
  const { user, sub, annual, config: c, signOut, isAdmin, demoSetPlan } = useAuth(), d = useData()
  const p = d.profile!
  const [del, setDel] = useState(false)
  const end = sub?.period_end ? new Date(sub.period_end).toLocaleDateString('pt-BR') : null
  const wa = c.whatsapp.replace(/\D/g, '')
  const status = !sub ? '—' : sub.status === 'canceled' ? `Cancelada · acesso até ${end}` : sub.status === 'past_due' ? `Pagamento em atraso (tolerância de 3 dias) · venceu em ${end}` : sub.status === 'refunded' ? 'Reembolsada' : `Ativa · próxima cobrança em ${end}`

  const remove = async () => {
    if (!confirm('Apagar sua conta e todos os seus dados de treino e saúde? Isso não pode ser desfeito.')) return
    setDel(true)
    try {
      if (DEMO) Object.keys(localStorage).filter((k) => k.startsWith('vp:')).forEach((k) => localStorage.removeItem(k))
      else { const { error } = await supabase.functions.invoke('delete-account'); if (error) throw error }
      await signOut(); location.href = '/'
    } catch (e) { alert('Não foi possível apagar agora: ' + (e as Error).message); setDel(false) }
  }
  return (
    <div className="page space-y-4">
      <h1 className="text-5xl leading-none">Perfil</h1>
      <p className="muted">{user?.email}</p>

      <Card className="space-y-2">
        <h2 className="text-2xl">Plano {sub?.plan === 'anual' ? 'anual' : 'mensal'}</h2>
        <p className="text-zinc-300">{status}</p>
        {sub && <p className="muted">Você mantém o preço da fase em que assinou (fase {sub.price_phase}) enquanto a assinatura estiver ativa.</p>}
        {c.manage_url && <ExtLink href={c.manage_url} variant="ghost" className="w-full">Gerenciar ou cancelar assinatura</ExtLink>}
      </Card>
      {!annual && <Card className="space-y-2 !border-lime"><h2 className="text-2xl"><Lock className="mr-1" />Migrar para o anual</h2>
        <p className="text-zinc-300">{brl(c.annual_price)} por ano ({brl(c.annual_price / 12)} por mês, 2 meses grátis) e o brinde: Pré-temporada da Várzea, Guia de aquecimento, mobilidade e alongamento, Planner de temporada e Protocolo de pós-jogo.</p>
        <ExtLink href={c.annual_url} className="w-full">MIGRAR PARA O ANUAL</ExtLink></Card>}

      <Card className="space-y-4"><h2 className="text-2xl">Seus dados</h2>
        <Field label="Posição"><Chips<Position> value={p.position} onChange={(v) => d.saveProfile({ position: v })} options={[{ v: 'goleiro', l: 'Goleiro' }, { v: 'zagueiro', l: 'Zagueiro' }, { v: 'lateral', l: 'Lateral' }, { v: 'meia', l: 'Meia' }, { v: 'atacante', l: 'Atacante' }]} /></Field>
        <p className="muted">Nível: <b>{p.level}</b> · {p.days_per_week} dias por semana · locais: {p.locations.join(', ')} · campo: {p.field_type}{p.home_space ? ` · casa ${p.home_space} m` : ''}</p>
        <Btn variant="ghost" small className="w-full" onClick={() => d.saveProfile({ onboarded: false })}>Editar perfil e equipamentos</Btn>
        {p.caution && <Notice tone="danger">Perfil em cautela (dor ou lesão informada): sem saltos até a liberação de um profissional.</Notice>}
      </Card>

      <Card className="space-y-2"><h2 className="text-2xl">Ajuda</h2>
        {wa && <ExtLink href={`https://wa.me/${wa}`} variant="ghost" className="w-full">Suporte por WhatsApp</ExtLink>}
        <Link to="/termos" className="btn btn-ghost w-full">Termos de uso</Link><Link to="/privacidade" className="btn btn-ghost w-full">Privacidade (LGPD)</Link></Card>

      {isAdmin && <Link to="/app/admin" className="btn btn-primary w-full">Painel admin</Link>}
      {DEMO && demoSetPlan && <Card className="space-y-2"><h2 className="text-xl">Modo demo: simular plano</h2><div className="grid grid-cols-3 gap-2"><Btn small variant="ghost" onClick={() => demoSetPlan('mensal')}>Mensal</Btn><Btn small variant="ghost" onClick={() => demoSetPlan('anual')}>Anual</Btn><Btn small variant="ghost" onClick={() => demoSetPlan('none')}>Sem plano</Btn></div></Card>}
      <Btn variant="ghost" className="w-full" onClick={signOut}>Sair</Btn>
      <Btn variant="danger" small className="w-full" disabled={del} onClick={remove}>Apagar minha conta</Btn>
    </div>
  )
}
