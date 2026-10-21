import { describe, expect, it } from 'vitest'
import { applyEvent, normalizeEvent } from '../../supabase/functions/_shared/webhook'
import { hasAccess } from './access'
import type { Subscription } from './types'

const NOW = Date.parse('2026-06-10T12:00:00Z')
const asSub = (p: ReturnType<typeof applyEvent>): Subscription => ({ email: 'x@y.z', manual_override: null, ...(p as object) } as Subscription)

describe('webhook', () => {
  it('Hotmart: compra anual aprovada', () => {
    const ev = normalizeEvent({ event: 'PURCHASE_APPROVED', data: { buyer: { email: 'A@B.com' }, purchase: { transaction: 'HP1', recurrence_number: 1 }, subscription: { plan: { name: 'Plano Anual' } } } })!
    expect(ev).toMatchObject({ type: 'approved', email: 'a@b.com', plan: 'anual', provider: 'hotmart' })
    const s = asSub(applyEvent(null, ev, 1, NOW))
    expect(s.status).toBe('active'); expect(hasAccess(s, NOW)).toBe(true)
  })
  it('Kiwify: renovação estende o acesso', () => {
    const prev = { plan: 'mensal' as const, status: 'active', period_end: '2026-06-12T00:00:00Z', price_phase: 1 }
    const ev = normalizeEvent({ webhook_event_type: 'subscription_renewed', Customer: { email: 'a@b.com' }, Subscription: { plan: { name: 'Mensal' }, next_payment: '2026-07-10T00:00:00Z' } })!
    const s = applyEvent(prev, ev, 2, NOW)!
    expect(s.period_end).toBe('2026-07-10T00:00:00.000Z'); expect(s.price_phase).toBe(1)   // mantém a fase do aluno
  })
  it('atraso: 3 dias de tolerância e depois bloqueia', () => {
    const prev = { plan: 'mensal' as const, status: 'active', period_end: '2026-06-09T12:00:00Z', price_phase: 1 }
    const s = asSub(applyEvent(prev, { type: 'late', email: 'a', plan: 'mensal', periodEnd: null, ref: null, provider: 'x' }, 1, NOW))
    expect(s.status).toBe('past_due'); expect(hasAccess(s, NOW)).toBe(true)
    expect(hasAccess(s, NOW + 3 * 86_400_000)).toBe(false)
  })
  it('cancelamento mantém até o fim; reembolso revoga na hora', () => {
    const prev = { plan: 'mensal' as const, status: 'active', period_end: '2026-06-25T12:00:00Z', price_phase: 1 }
    const c = asSub(applyEvent(prev, { type: 'canceled', email: 'a', plan: 'mensal', periodEnd: null, ref: null, provider: 'x' }, 1, NOW))
    expect(hasAccess(c, NOW)).toBe(true); expect(hasAccess(c, Date.parse('2026-06-26T00:00:00Z'))).toBe(false)
    const r = asSub(applyEvent(prev, { type: 'refunded', email: 'a', plan: 'mensal', periodEnd: null, ref: null, provider: 'x' }, 1, NOW))
    expect(hasAccess(r, NOW)).toBe(false)
  })
  it('ignora evento desconhecido', () => expect(normalizeEvent({ foo: 1 })).toBeNull())
})
