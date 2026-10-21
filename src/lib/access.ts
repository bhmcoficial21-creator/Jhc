import type { Subscription } from './types'

export const GRACE_DAYS = 3          // tolerância de pagamento atrasado
export const MAX_OFFLINE_DAYS = 7    // máximo offline sem checar a assinatura
const DAY = 86_400_000

/** Mesma regra de public.sub_access (SQL) e da Edge Function de webhook. */
export function hasAccess(s: Subscription | null | undefined, now = Date.now()): boolean {
  if (!s) return false
  if (s.manual_override === 'revoke') return false
  if (s.manual_override === 'grant') return true
  if (s.status === 'refunded') return false
  const end = s.period_end ? Date.parse(s.period_end) : null
  if (s.status === 'active') return end === null || end + GRACE_DAYS * DAY >= now
  if (s.status === 'canceled') return end !== null && end >= now          // até o fim do período já pago
  if (s.status === 'past_due') return end !== null && end + GRACE_DAYS * DAY >= now
  return false
}

export const isAnnual = (s: Subscription | null | undefined, now = Date.now()) => hasAccess(s, now) && s?.plan === 'anual'

/** Offline: libera se a última checagem online foi há no máximo 7 dias. */
export function offlineAllowed(lastCheckIso: string | null | undefined, now = Date.now()): boolean {
  if (!lastCheckIso) return false
  return now - Date.parse(lastCheckIso) <= MAX_OFFLINE_DAYS * DAY
}
