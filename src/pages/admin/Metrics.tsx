import { useEffect, useState } from 'react'
import { hasAccess } from '../../lib/access'
import { listRows } from '../../lib/store'
import type { SessionRow, Subscription } from '../../lib/types'
import { Card } from '../../components/ui'

export default function Metrics() {
  const [subs, setSubs] = useState<Subscription[]>([]), [sess, setSess] = useState<SessionRow[]>([])
  useEffect(() => { listRows<Subscription>('subscriptions').then(setSubs); listRows<SessionRow>('sessions').then(setSess) }, [])
  const active = subs.filter((s) => hasAccess(s))
  const by = (p: string) => active.filter((s) => s.plan === p).length
  const cancels = subs.filter((s) => s.status === 'canceled' || s.status === 'refunded')
  const weeks = Array.from({ length: 8 }, (_, i) => { const end = Date.now() - (7 - i) * 7 * 86_400_000, st = end - 7 * 86_400_000; return sess.filter((s) => (s.kind === 'treino' || s.kind === 'extra') && Date.parse(s.completed_at) > st && Date.parse(s.completed_at) <= end).length })
  const max = Math.max(3, ...weeks)
  return <div className="space-y-3">
    <h2 className="text-3xl">Métricas</h2>
    <div className="grid grid-cols-2 gap-3">
      <Card><div className="font-display text-5xl font-extrabold text-lime">{active.length}</div><p className="muted">assinantes ativos</p></Card>
      <Card><div className="font-display text-5xl font-extrabold">{cancels.length}</div><p className="muted">cancelamentos / reembolsos</p></Card>
      <Card><div className="font-display text-5xl font-extrabold">{by('mensal')}</div><p className="muted">ativos no mensal</p></Card>
      <Card><div className="font-display text-5xl font-extrabold">{by('anual')}</div><p className="muted">ativos no anual</p></Card>
    </div>
    <Card className="space-y-2"><h3 className="text-2xl">Treinos concluídos por semana</h3>
      <svg viewBox="0 0 240 90" className="w-full">{weeks.map((v, i) => <g key={i}><rect x={i * 30 + 4} y={78 - (v / max) * 70} width="22" height={Math.max(1, (v / max) * 70)} rx="3" fill={v ? '#c6ff00' : '#2a2a2a'} /><text x={i * 30 + 15} y="88" fontSize="8" textAnchor="middle" fill="#888">{i === 7 ? 'esta' : `-${7 - i}`}</text>{v > 0 && <text x={i * 30 + 15} y={74 - (v / max) * 70} fontSize="9" textAnchor="middle" fill="#fff">{v}</text>}</g>)}</svg></Card>
  </div>
}
