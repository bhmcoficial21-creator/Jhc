import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

/** Sem backend configurado (ou VITE_DEMO=true) o app roda local, com dados no navegador — só para desenvolvimento. */
export const DEMO: boolean = import.meta.env.VITE_DEMO === 'true' || !url || !key
export const ADMIN_EMAIL = ((import.meta.env.VITE_ADMIN_EMAIL as string | undefined) ?? '').toLowerCase()
export const supabase = !DEMO ? createClient(url!, key!, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } }) : null!

export function lsGet<T>(k: string, d: T): T { try { const v = localStorage.getItem(k); return v ? (JSON.parse(v) as T) : d } catch { return d } }
export function lsSet(k: string, v: unknown) { try { localStorage.setItem(k, JSON.stringify(v)) } catch { /* sem espaço / modo privado */ } }
export const uid = () => (crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2) + Date.now().toString(36))
