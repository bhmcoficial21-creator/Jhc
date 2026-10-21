// Edge Function (Deno): recebe eventos do checkout e mantém public.subscriptions.
// Deploy: supabase functions deploy checkout-webhook --no-verify-jwt
// Secrets: WEBHOOK_SECRET, PLAN_ANNUAL_MATCH (opcional), SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
// URL no checkout: https://<proj>.functions.supabase.co/checkout-webhook?token=<WEBHOOK_SECRET>
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { applyEvent, normalizeEvent } from '../_shared/webhook.ts'

const enc = new TextEncoder()
function safeEqual(a: string, b: string) {
  if (a.length !== b.length) return false
  let r = 0
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return r === 0
}
async function hmacSha1Hex(key: string, msg: string) {
  const k = await crypto.subtle.importKey('raw', enc.encode(key), { name: 'HMAC', hash: 'SHA-1' }, false, ['sign'])
  const sig = await crypto.subtle.sign('HMAC', k, enc.encode(msg))
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') return new Response('method not allowed', { status: 405 })
  const secret = Deno.env.get('WEBHOOK_SECRET') ?? ''
  if (!secret) return new Response('server misconfigured', { status: 500 })

  const url = new URL(req.url)
  const raw = await req.text()
  // Segredo aceito: ?token=, x-webhook-secret, x-hotmart-hottok, x-hubla-token ou assinatura HMAC-SHA1 da Kiwify (?signature=)
  const provided = url.searchParams.get('token') ?? req.headers.get('x-webhook-secret') ?? req.headers.get('x-hotmart-hottok') ?? req.headers.get('x-hubla-token') ?? ''
  const sigParam = url.searchParams.get('signature')
  let ok = provided !== '' && safeEqual(provided, secret)
  if (!ok && sigParam) ok = safeEqual(sigParam, await hmacSha1Hex(secret, raw))
  if (!ok) return new Response('unauthorized', { status: 401 })

  let body: unknown
  try { body = JSON.parse(raw) } catch { return new Response('bad json', { status: 400 }) }
  const ev = normalizeEvent(body, Deno.env.get('PLAN_ANNUAL_MATCH') ?? 'anual')
  if (!ev) return new Response(JSON.stringify({ ignored: true }), { status: 200 })   // evento que não nos interessa

  const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
  const { data: cfg } = await db.from('app_config').select('phase_number').eq('id', 1).single()
  const { data: prev } = await db.from('subscriptions').select('*').eq('email', ev.email).maybeSingle()

  // Compra aprovada cria o usuário pelo e-mail (se ainda não existir).
  let userId: string | null = prev?.user_id ?? null
  if (ev.type === 'approved' && !userId) {
    const { data: created, error } = await db.auth.admin.createUser({ email: ev.email, email_confirm: true })
    if (created?.user) userId = created.user.id
    else if (error) {
      // já existe no Auth: procura pelo e-mail
      const { data: list } = await db.auth.admin.listUsers({ page: 1, perPage: 1000 })
      userId = list?.users.find((u) => u.email?.toLowerCase() === ev.email)?.id ?? null
    }
  }
  if (!prev && ev.type !== 'approved' && ev.type !== 'renewed') return new Response(JSON.stringify({ ignored: 'no subscription' }), { status: 200 })

  const patch = applyEvent(prev, ev, cfg?.phase_number ?? 1)!
  const { error } = await db.from('subscriptions').upsert({
    email: ev.email, user_id: userId, provider: ev.provider, provider_ref: ev.ref ?? prev?.provider_ref ?? null,
    ...patch, updated_at: new Date().toISOString(),
  }, { onConflict: 'email' })
  if (error) return new Response(error.message, { status: 500 })
  return new Response(JSON.stringify({ ok: true, type: ev.type }), { status: 200 })
})
