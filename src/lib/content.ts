import { DEFAULT_CONFIG } from '../seed/config'
import { DEMO, lsGet, lsSet, supabase } from './supabase'
import type { Replay } from './replay'
import type { AppConfig, Exercise, GuidePage, Lesson, Mission, Program, QuizQuestion, RefLink } from './types'

export interface Content {
  exercises: Exercise[]; programs: Program[]; lessons: Lesson[]; quiz: QuizQuestion[]
  missions: Mission[]; guide: GuidePage[]; refs: RefLink[]; replays: Replay[]
}
export type ContentKey = keyof Content
export const TABLE: Record<ContentKey, string> = { exercises: 'exercises', programs: 'programs', lessons: 'lessons', quiz: 'quiz_questions', missions: 'missions', guide: 'guide_pages', refs: 'references_links', replays: 'replays' }
const EMPTY: Content = { exercises: [], programs: [], lessons: [], quiz: [], missions: [], guide: [], refs: [], replays: [] }
const CACHE = 'vp:content'

/**
 * Conteúdo vem do banco (protegido por RLS). Offline usa o cache do último carregamento.
 * O seed embutido só existe no modo demo (import dinâmico, não vai no build de produção).
 */
export async function loadContent(): Promise<{ content: Content; fromCache: boolean }> {
  if (DEMO) {
    const seed = await import('../seed')
    const base: Content = { exercises: seed.EXERCISES, programs: seed.PROGRAMS, lessons: seed.LESSONS, quiz: seed.QUIZ, missions: seed.MISSIONS, guide: seed.GUIDE, refs: [], replays: seed.REPLAYS }
    const out = { ...base }
    for (const k of Object.keys(TABLE) as ContentKey[]) { const o = lsGet<unknown[] | null>(`vp:demo:${k}`, null); if (o) (out[k] as unknown[]) = o }
    return { content: out, fromCache: false }
  }
  try {
    const res = await Promise.all((Object.keys(TABLE) as ContentKey[]).map(async (k) => {
      const { data, error } = await supabase.from(TABLE[k]).select('*')
      if (error) throw error
      return [k, data ?? []] as const
    }))
    const content = { ...EMPTY, ...Object.fromEntries(res) } as Content
    content.replays = (content.replays as unknown as { id: string; published: boolean; data: Replay }[]).map((r) => ({ ...r.data, id: r.id, published: r.published }))
    content.lessons.sort((a, b) => a.order_idx - b.order_idx)
    content.programs.sort((a, b) => a.order_idx - b.order_idx)
    lsSet(CACHE, content)
    return { content, fromCache: false }
  } catch (e) {
    const cached = lsGet<Content | null>(CACHE, null)
    if (cached) return { content: cached, fromCache: true }
    throw e
  }
}

export async function saveContentRow(k: ContentKey, row: { id?: string }, current: Content): Promise<void> {
  if (DEMO) {
    const list = [...(current[k] as { id: string }[])], i = list.findIndex((r) => r.id === row.id)
    if (i >= 0) list[i] = row as never; else list.push(row as never)
    lsSet(`vp:demo:${k}`, list); return
  }
  const payload = k === 'replays' ? (({ id, title, category, level, published }) => ({ id, title, category, level, published: published ?? true, data: row, updated_at: new Date().toISOString() }))(row as Replay) : row
  const { error } = await supabase.from(TABLE[k]).upsert(payload)
  if (error) throw error
}
export async function deleteContentRow(k: ContentKey, id: string, current: Content): Promise<void> {
  if (DEMO) { lsSet(`vp:demo:${k}`, (current[k] as { id: string }[]).filter((r) => r.id !== id)); return }
  const { error } = await supabase.from(TABLE[k]).delete().eq('id', id)
  if (error) throw error
}

/** Upload de animação GLB / imagem para o bucket `animations`; devolve a URL pública. */
export async function uploadMedia(file: File, folder = 'anim'): Promise<string> {
  if (DEMO) return URL.createObjectURL(file)
  const path = `${folder}/${Date.now()}-${file.name.replace(/[^\w.-]+/g, '_')}`
  const { error } = await supabase.storage.from('animations').upload(path, file, { upsert: true, cacheControl: '31536000' })
  if (error) throw error
  return supabase.storage.from('animations').getPublicUrl(path).data.publicUrl
}

// ---------- Configuração pública (preços, fase, checkout) ----------
export async function loadConfig(): Promise<AppConfig> {
  if (DEMO) return { ...DEFAULT_CONFIG, ...lsGet<Partial<AppConfig>>('vp:config', {}) }
  try {
    const { data, error } = await supabase.from('app_config').select('*').eq('id', 1).single()
    if (error) throw error
    const cfg = { ...DEFAULT_CONFIG, ...data, monthly_price: Number(data.monthly_price), annual_price: Number(data.annual_price) } as AppConfig
    lsSet('vp:config:cache', cfg); return cfg
  } catch { return { ...DEFAULT_CONFIG, ...lsGet<Partial<AppConfig>>('vp:config:cache', {}) } }
}
export async function saveConfig(c: AppConfig): Promise<void> {
  if (DEMO) { lsSet('vp:config', c); return }
  const { error } = await supabase.from('app_config').update({ ...c, updated_at: new Date().toISOString() }).eq('id', 1)
  if (error) throw error
}

export const brl = (n: number) => n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
