// Lógica pura do webhook de checkout (testável fora do Deno).
export type EventType = 'approved' | 'renewed' | 'late' | 'canceled' | 'refunded'
export interface NormalizedEvent { type: EventType; email: string; plan: 'mensal' | 'anual'; periodEnd: string | null; ref: string | null; provider: string }
export interface SubRow { plan: 'mensal' | 'anual'; status: string; period_end: string | null; price_phase?: number }

// deno-lint-ignore no-explicit-any
type Any = any
const lower = (v: unknown) => String(v ?? '').toLowerCase()

function detectPlan(texts: unknown[], annualMatch: string): 'mensal' | 'anual' {
  const hay = texts.map(lower).join(' | ')
  return hay.includes(annualMatch.toLowerCase()) ? 'anual' : 'mensal'
}
function toIso(v: unknown): string | null {
  if (v === null || v === undefined || v === '') return null
  const n = typeof v === 'number' || /^\d{10,13}$/.test(String(v)) ? Number(v) : NaN
  const d = Number.isFinite(n) ? new Date(n < 1e12 ? n * 1000 : n) : new Date(String(v))
  return isNaN(d.getTime()) ? null : d.toISOString()
}

/**
 * Normaliza os payloads de Hotmart, Kiwify e Hubla (+ um formato genérico {event,email,plan,period_end,ref}).
 * ATENÇÃO: confira os nomes dos campos com um payload de teste real de cada plataforma antes de ir ao ar.
 */
export function normalizeEvent(body: Any, annualMatch = 'anual'): NormalizedEvent | null {
  if (!body || typeof body !== 'object') return null

  // Formato genérico (Zapier/n8n/teste manual)
  if (body.event && body.email && ['approved', 'renewed', 'late', 'canceled', 'refunded'].includes(body.event)) {
    return { type: body.event, email: lower(body.email), plan: body.plan === 'anual' ? 'anual' : 'mensal', periodEnd: toIso(body.period_end), ref: body.ref ?? null, provider: 'generic' }
  }

  // Hotmart (webhook 2.0)
  if (typeof body.event === 'string' && body.data) {
    const d = body.data, email = lower(d.buyer?.email)
    const plan = detectPlan([d.subscription?.plan?.name, d.purchase?.offer?.code, d.product?.name], annualMatch)
    const periodEnd = toIso(d.purchase?.date_next_charge)
    const ref = d.purchase?.transaction ?? null
    const map: Record<string, EventType | undefined> = {
      PURCHASE_APPROVED: (d.purchase?.recurrence_number ?? 1) > 1 ? 'renewed' : 'approved',
      PURCHASE_COMPLETE: undefined,
      PURCHASE_DELAYED: 'late', SUBSCRIPTION_CANCELLATION: 'canceled', PURCHASE_CANCELED: 'canceled',
      PURCHASE_REFUNDED: 'refunded', PURCHASE_CHARGEBACK: 'refunded',
    }
    const type = map[body.event]
    return type && email ? { type, email, plan, periodEnd, ref, provider: 'hotmart' } : null
  }

  // Kiwify
  if (body.webhook_event_type || body.order_status) {
    const email = lower(body.Customer?.email)
    const plan = detectPlan([body.Subscription?.plan?.name, body.Product?.product_name], annualMatch)
    const periodEnd = toIso(body.Subscription?.next_payment)
    const ev = lower(body.webhook_event_type)
    const type: EventType | undefined =
      ev === 'subscription_renewed' ? 'renewed' : ev === 'order_approved' ? 'approved' :
      ev === 'subscription_late' ? 'late' : ev === 'subscription_canceled' ? 'canceled' :
      ev === 'order_refunded' || ev === 'chargeback' ? 'refunded' : undefined
    return type && email ? { type, email, plan, periodEnd, ref: body.order_id ?? null, provider: 'kiwify' } : null
  }

  // Hubla (v2)
  if (typeof body.type === 'string' && body.event) {
    const e = body.event, email = lower(e.user?.email ?? e.payer?.email ?? e.invoice?.payer?.email)
    const plan = detectPlan([e.product?.name, e.invoice?.billingCycle, e.subscription?.billingCycle, e.offer?.name], annualMatch)
    const periodEnd = toIso(e.invoice?.nextBillingDate ?? e.subscription?.nextBillingDate)
    const t = lower(body.type)
    const type: EventType | undefined =
      t === 'invoice.payment_succeeded' ? ((e.invoice?.installment ?? e.invoice?.cycle ?? 1) > 1 ? 'renewed' : 'approved') :
      t === 'invoice.payment_failed' ? 'late' :
      t === 'subscription.deactivated' || t === 'subscription.canceled' ? 'canceled' :
      t === 'invoice.refunded' || t === 'invoice.chargeback' ? 'refunded' : undefined
    return type && email ? { type, email, plan, periodEnd, ref: e.invoice?.id ?? null, provider: 'hubla' } : null
  }
  return null
}

const DAY = 86_400_000
const addPeriod = (plan: 'mensal' | 'anual', from: number) => new Date(from + (plan === 'anual' ? 366 : 31) * DAY).toISOString()

/** Decide o novo estado da assinatura a partir do evento. */
export function applyEvent(prev: SubRow | null, ev: NormalizedEvent, phase: number, now = Date.now()) {
  const keepPhase = prev?.price_phase ?? phase           // quem assinou numa fase mantém o preço dela
  switch (ev.type) {
    case 'approved':
    case 'renewed': {
      const base = ev.periodEnd ?? addPeriod(ev.plan, Math.max(now, prev?.period_end ? Date.parse(prev.period_end) : 0))
      return { plan: ev.plan, status: 'active', period_end: base, price_phase: keepPhase, canceled_at: null }
    }
    case 'late':   // mantém o período; a tolerância de 3 dias é aplicada pela regra de acesso
      return { plan: prev?.plan ?? ev.plan, status: 'past_due', period_end: prev?.period_end ?? new Date(now).toISOString(), price_phase: keepPhase }
    case 'canceled':   // acesso até o fim do período já pago
      return { plan: prev?.plan ?? ev.plan, status: 'canceled', period_end: prev?.period_end ?? ev.periodEnd ?? addPeriod(ev.plan, now), price_phase: keepPhase, canceled_at: new Date(now).toISOString() }
    case 'refunded':   // revoga na hora
      return { plan: prev?.plan ?? ev.plan, status: 'refunded', period_end: new Date(now).toISOString(), price_phase: keepPhase }
  }
}
