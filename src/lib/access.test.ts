import { describe, expect, it } from 'vitest'
import { hasAccess, isAnnual, offlineAllowed } from './access'
import type { Subscription } from './types'

const NOW = Date.parse('2026-06-10T12:00:00Z')
const d = (n: number) => new Date(NOW + n * 86_400_000).toISOString()
const sub = (p: Partial<Subscription>): Subscription => ({ email: 'a@b.c', plan: 'mensal', status: 'active', period_end: d(10), manual_override: null, price_phase: 1, ...p })

describe('acesso', () => {
  it('ativo libera', () => expect(hasAccess(sub({}), NOW)).toBe(true))
  it('sem assinatura bloqueia', () => expect(hasAccess(null, NOW)).toBe(false))
  it('atrasado: mantém 3 dias de tolerância e depois bloqueia', () => {
    expect(hasAccess(sub({ status: 'past_due', period_end: d(-2) }), NOW)).toBe(true)
    expect(hasAccess(sub({ status: 'past_due', period_end: d(-4) }), NOW)).toBe(false)
  })
  it('cancelado mantém até o fim do período pago', () => {
    expect(hasAccess(sub({ status: 'canceled', period_end: d(5) }), NOW)).toBe(true)
    expect(hasAccess(sub({ status: 'canceled', period_end: d(-1) }), NOW)).toBe(false)
  })
  it('reembolso revoga na hora, mesmo com período pago', () => expect(hasAccess(sub({ status: 'refunded', period_end: d(20) }), NOW)).toBe(false))
  it('override manual vence tudo', () => {
    expect(hasAccess(sub({ manual_override: 'revoke' }), NOW)).toBe(false)
    expect(hasAccess(sub({ status: 'refunded', manual_override: 'grant' }), NOW)).toBe(true)
  })
  it('brinde só no anual ativo', () => {
    expect(isAnnual(sub({ plan: 'anual' }), NOW)).toBe(true)
    expect(isAnnual(sub({ plan: 'mensal' }), NOW)).toBe(false)
    expect(isAnnual(sub({ plan: 'anual', status: 'refunded' }), NOW)).toBe(false)
  })
  it('máximo de 7 dias offline', () => {
    expect(offlineAllowed(d(-6), NOW)).toBe(true)
    expect(offlineAllowed(d(-8), NOW)).toBe(false)
    expect(offlineAllowed(null, NOW)).toBe(false)
  })
})
