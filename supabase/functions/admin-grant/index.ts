// Edge Function: o admin libera/revoga acesso manualmente (cria o usuário pelo e-mail, se preciso).
// Deploy com verificação de JWT ligada. O chamador precisa estar na tabela public.admins.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

Deno.serve(async (req) => {
  const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, content-type, apikey, x-client-info' }
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  const url = Deno.env.get('SUPABASE_URL')!
  const asUser = createClient(url, Deno.env.get('SUPABASE_ANON_KEY')!, { global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } } })
  const { data: isAdmin } = await asUser.rpc('is_admin')
  if (!isAdmin) return new Response('forbidden', { status: 403, headers: cors })

  const { email, action, plan, days } = await req.json() as { email: string; action: 'grant' | 'revoke' | 'clear'; plan?: 'mensal' | 'anual'; days?: number }
  const e = String(email ?? '').trim().toLowerCase()
  if (!e || !['grant', 'revoke', 'clear'].includes(action)) return new Response('bad request', { status: 400, headers: cors })
  const db = createClient(url, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
  const { data: prev } = await db.from('subscriptions').select('*').eq('email', e).maybeSingle()
  let userId: string | null = prev?.user_id ?? null
  if (!userId && action === 'grant') {
    const { data: c } = await db.auth.admin.createUser({ email: e, email_confirm: true })
    userId = c?.user?.id ?? (await db.auth.admin.listUsers({ page: 1, perPage: 1000 })).data.users.find((u) => u.email?.toLowerCase() === e)?.id ?? null
  }
  const { data: cfg } = await db.from('app_config').select('phase_number').eq('id', 1).single()
  const row = {
    email: e, user_id: userId, plan: plan ?? prev?.plan ?? 'mensal', status: prev?.status ?? 'active', price_phase: prev?.price_phase ?? cfg?.phase_number ?? 1,
    period_end: prev?.period_end ?? new Date(Date.now() + (days ?? 31) * 86_400_000).toISOString(),
    manual_override: action === 'clear' ? null : action, provider: prev?.provider ?? 'manual', updated_at: new Date().toISOString(),
  }
  const { error } = await db.from('subscriptions').upsert(row, { onConflict: 'email' })
  if (error) return new Response(error.message, { status: 500, headers: cors })
  return new Response(JSON.stringify({ ok: true }), { headers: { ...cors, 'Content-Type': 'application/json' } })
})
