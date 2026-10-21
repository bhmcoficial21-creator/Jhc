import { DEMO, lsGet, lsSet, supabase, uid } from './supabase'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Row = Record<string, any>
const key = (t: string) => `vp:t:${t}`

/** Lista linhas do usuário (a RLS restringe ao próprio aluno; o admin enxerga todas). */
export async function listRows<T = Row>(table: string, opts: { userId?: string; order?: string } = {}): Promise<T[]> {
  if (DEMO) {
    const rows = lsGet<Row[]>(key(table), [])
    const out = opts.userId ? rows.filter((r) => !r.user_id || r.user_id === opts.userId) : rows
    return out as T[]
  }
  let q = supabase.from(table).select('*')
  if (opts.order) q = q.order(opts.order, { ascending: false })
  const { data, error } = await q
  if (error) throw error
  return (data ?? []) as T[]
}

// ---- Fila de escrita offline: o treino concluído sem internet é enviado quando a conexão volta ----
interface Op { op: 'upsert' | 'insert'; table: string; row: Row; conflict?: string }
const OUTBOX = 'vp:outbox'
const isNet = (e: unknown) => !navigator.onLine || (e instanceof TypeError) || /fetch|network|failed to load/i.test(String((e as Error)?.message ?? e))
function enqueue(o: Op) { lsSet(OUTBOX, [...lsGet<Op[]>(OUTBOX, []), o]) }
export const pendingWrites = () => lsGet<Op[]>(OUTBOX, []).length
export async function flushOutbox(): Promise<void> {
  if (DEMO || !navigator.onLine) return
  const ops = lsGet<Op[]>(OUTBOX, []); lsSet(OUTBOX, [])
  for (const o of ops) {
    try {
      const { error } = o.op === 'upsert' ? await supabase.from(o.table).upsert(o.row, { onConflict: o.conflict }) : await supabase.from(o.table).insert(o.row)
      if (error) throw error
    } catch (e) { if (isNet(e)) enqueue(o) }
  }
}

export async function upsertRow(table: string, row: Row, conflict: string): Promise<void> {
  if (DEMO) {
    const rows = lsGet<Row[]>(key(table), []), cols = conflict.split(',')
    const i = rows.findIndex((r) => cols.every((c) => r[c] === row[c]))
    if (i >= 0) rows[i] = { ...rows[i], ...row }; else rows.push(row)
    lsSet(key(table), rows); return
  }
  try {
    const { error } = await supabase.from(table).upsert(row, { onConflict: conflict })
    if (error) throw error
  } catch (e) { if (isNet(e)) enqueue({ op: 'upsert', table, row, conflict }); else throw e }
}

export async function insertRow(table: string, row: Row): Promise<void> {
  const r = { id: uid(), ...row }
  if (DEMO) { lsSet(key(table), [...lsGet<Row[]>(key(table), []), r]); return }
  try {
    const { error } = await supabase.from(table).insert(row)
    if (error) throw error
  } catch (e) { if (isNet(e)) enqueue({ op: 'insert', table, row }); else throw e }
}

export async function deleteWhere(table: string, match: Row): Promise<void> {
  if (DEMO) { lsSet(key(table), lsGet<Row[]>(key(table), []).filter((r) => !Object.entries(match).every(([k, v]) => r[k] === v))); return }
  const { error } = await supabase.from(table).delete().match(match)
  if (error) throw error
}
