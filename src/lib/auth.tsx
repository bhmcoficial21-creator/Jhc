import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { hasAccess, isAnnual, offlineAllowed } from './access'
import { loadConfig } from './content'
import { ADMIN_EMAIL, DEMO, lsGet, lsSet, supabase } from './supabase'
import { flushOutbox } from './store'
import { DEFAULT_CONFIG } from '../seed/config'
import type { AppConfig, Subscription } from './types'

interface User { id: string; email: string }
interface Auth {
  user: User | null; loading: boolean; sub: Subscription | null; access: boolean; annual: boolean
  isAdmin: boolean; config: AppConfig; offline: boolean
  signIn: (email: string) => Promise<string | null>; signOut: () => Promise<void>
  refresh: () => Promise<void>; reloadConfig: () => Promise<void>
  demoSetPlan?: (p: 'mensal' | 'anual' | 'none') => void
}
const Ctx = createContext<Auth>(null!)
export const useAuth = () => useContext(Ctx)

const SUB_CACHE = 'vp:sub', CHECK = 'vp:lastcheck', ADM = 'vp:isadmin'
const demoSub = (plan: 'mensal' | 'anual'): Subscription => ({ email: 'demo@varzea.pro', plan, status: 'active', period_end: new Date(Date.now() + 30 * 86_400_000).toISOString(), manual_override: null, price_phase: 1, started_at: new Date().toISOString() })

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [sub, setSub] = useState<Subscription | null>(null)
  const [isAdmin, setAdmin] = useState(false)
  const [config, setConfig] = useState<AppConfig>(DEFAULT_CONFIG)
  const [offline, setOffline] = useState(false)
  const [tick, setTick] = useState(0)

  const reloadConfig = useCallback(async () => setConfig(await loadConfig()), [])
  useEffect(() => { reloadConfig() }, [reloadConfig])

  const checkSub = useCallback(async (u: User) => {
    if (DEMO) { setSub(lsGet<Subscription | null>('vp:demo:sub', demoSub('anual'))); setAdmin(true); setOffline(false); return }
    try {
      const [s, a] = await Promise.all([
        supabase.from('subscriptions').select('*').eq('user_id', u.id).maybeSingle(),
        supabase.rpc('is_admin'),
      ])
      if (s.error) throw s.error
      setSub((s.data as Subscription) ?? null); setAdmin(!!a.data || (!!ADMIN_EMAIL && u.email.toLowerCase() === ADMIN_EMAIL))
      lsSet(SUB_CACHE, s.data); lsSet(ADM, !!a.data); lsSet(CHECK, new Date().toISOString()); setOffline(false)
      flushOutbox()
    } catch {
      // Sem conexão: usa a última assinatura conhecida, por no máximo 7 dias sem checar.
      setSub(lsGet<Subscription | null>(SUB_CACHE, null)); setAdmin(lsGet(ADM, false)); setOffline(true)
    }
  }, [])

  useEffect(() => {
    let alive = true
    if (DEMO) {
      const u = lsGet<User | null>('vp:demo:user', null)
      setUser(u); if (u) checkSub(u).then(() => alive && setLoading(false)); else setLoading(false)
      return
    }
    supabase.auth.getSession().then(async ({ data }) => {
      const s = data.session
      if (s?.user) { const u = { id: s.user.id, email: s.user.email ?? '' }; setUser(u); await checkSub(u) }
      else if (!navigator.onLine) { const cached = lsGet<User | null>('vp:user', null); if (cached) { setUser(cached); await checkSub(cached) } }
      if (alive) setLoading(false)
    })
    const { data: l } = supabase.auth.onAuthStateChange(async (_e, session) => {
      if (session?.user) { const u = { id: session.user.id, email: session.user.email ?? '' }; lsSet('vp:user', u); setUser(u); await checkSub(u) }
      else setUser(null)
    })
    return () => { alive = false; l.subscription.unsubscribe() }
  }, [checkSub])

  // Reconferir a assinatura ao reconectar e a cada 15 min com o app aberto
  useEffect(() => {
    const re = () => { if (user) { checkSub(user); setTick((t) => t + 1) } }
    window.addEventListener('online', re)
    const iv = setInterval(re, 15 * 60_000)
    return () => { window.removeEventListener('online', re); clearInterval(iv) }
  }, [user, checkSub])

  const value = useMemo<Auth>(() => {
    const lastCheck = DEMO ? new Date().toISOString() : lsGet<string | null>(CHECK, null)
    const access = hasAccess(sub) && (!offline || offlineAllowed(lastCheck))
    return {
      user, loading, sub, access, annual: access && isAnnual(sub), isAdmin, config, offline,
      signIn: async (email) => {
        if (DEMO) { const u = { id: 'demo', email }; lsSet('vp:demo:user', u); setUser(u); await checkSub(u); return null }
        const { error } = await supabase.auth.signInWithOtp({ email, options: { shouldCreateUser: false, emailRedirectTo: `${location.origin}/app` } })
        if (error) return /signups? not allowed|not found/i.test(error.message) ? 'Não encontramos uma assinatura para este e-mail. Use o mesmo e-mail da compra.' : error.message
        return null
      },
      signOut: async () => { if (DEMO) { localStorage.removeItem('vp:demo:user'); setUser(null); setSub(null) } else { await supabase.auth.signOut(); setUser(null); setSub(null) } },
      refresh: async () => { if (user) await checkSub(user) },
      reloadConfig,
      demoSetPlan: DEMO ? (p) => { const s = p === 'none' ? null : demoSub(p); lsSet('vp:demo:sub', s); setSub(s) } : undefined,
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, loading, sub, isAdmin, config, offline, tick, checkSub, reloadConfig])

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}
