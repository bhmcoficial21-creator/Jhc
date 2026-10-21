import { useAuth } from '../lib/auth'
import { brl } from '../lib/content'
import { Btn, Card, ExtLink, Logo, Notice } from '../components/ui'

export default function Blocked() {
  const { config: c, signOut, refresh, sub, offline } = useAuth()
  const why = !sub ? 'Não encontramos uma assinatura ativa para este e-mail.'
    : sub.status === 'refunded' ? 'Esta assinatura foi reembolsada.'
    : sub.status === 'past_due' ? 'Seu pagamento está em atraso e a tolerância de 3 dias acabou.'
    : sub.status === 'canceled' ? 'Sua assinatura foi cancelada e o período pago terminou.' : 'Seu acesso está bloqueado.'
  return (
    <div className="mx-auto min-h-screen max-w-xl space-y-5 px-4 py-8">
      <Logo className="text-3xl" />
      <h1 className="text-5xl leading-none">Acesso <span className="text-danger">bloqueado</span></h1>
      <Notice tone="warn">{offline ? 'Você ficou mais de 7 dias sem conexão. Conecte-se à internet para conferir sua assinatura.' : why}</Notice>
      <div className="grid gap-3">
        <Card><h3 className="text-2xl">Mensal</h3><p className="mb-3"><b className="font-display text-3xl">{brl(c.monthly_price)}</b> por mês</p><ExtLink href={c.monthly_url} variant="ghost" className="w-full">ASSINAR MENSAL</ExtLink></Card>
        <Card className="!border-lime"><h3 className="text-2xl">Anual <span className="chip chip-on ml-2">Melhor valor</span></h3><p className="mb-3"><b className="font-display text-3xl">{brl(c.annual_price)}</b> por ano · {brl(c.annual_price / 12)} por mês</p><ExtLink href={c.annual_url} className="w-full">ASSINAR ANUAL</ExtLink></Card>
      </div>
      <div className="flex gap-2"><Btn variant="ghost" className="flex-1" onClick={refresh}>Já paguei: conferir</Btn><Btn variant="ghost" className="flex-1" onClick={signOut}>Sair</Btn></div>
    </div>
  )
}
