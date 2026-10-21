// Edge Function: o próprio aluno apaga a conta (LGPD). Deploy com verificação de JWT ligada.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

Deno.serve(async (req) => {
  const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, content-type, apikey, x-client-info' }
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  const auth = req.headers.get('Authorization') ?? ''
  const url = Deno.env.get('SUPABASE_URL')!
  const asUser = createClient(url, Deno.env.get('SUPABASE_ANON_KEY')!, { global: { headers: { Authorization: auth } } })
  const { data: { user } } = await asUser.auth.getUser()
  if (!user) return new Response('unauthorized', { status: 401, headers: cors })
  const admin = createClient(url, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
  // user_* têm ON DELETE CASCADE; a linha de assinatura é desvinculada para manter o registro fiscal do checkout.
  await admin.from('subscriptions').update({ user_id: null }).eq('user_id', user.id)
  const { error } = await admin.auth.admin.deleteUser(user.id)
  if (error) return new Response(error.message, { status: 500, headers: cors })
  return new Response(JSON.stringify({ ok: true }), { headers: { ...cors, 'Content-Type': 'application/json' } })
})
