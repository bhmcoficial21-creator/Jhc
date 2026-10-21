import { useState } from 'react'
import { deleteContentRow, saveContentRow, uploadMedia, type ContentKey } from '../../lib/content'
import { useData } from '../../lib/data'
import { Btn, Card, Field, Notice } from '../../components/ui'

export interface FieldDef {
  key: string; label: string; type: 'text' | 'textarea' | 'number' | 'bool' | 'select' | 'tags' | 'lines' | 'json' | 'file' | 'custom'
  options?: string[]; hint?: string; accept?: string; render?: (value: unknown, row: Record<string, unknown>, set: (v: unknown) => void) => React.ReactNode
}
type Row = Record<string, unknown> & { id?: string }

const toTags = (v: unknown) => (Array.isArray(v) ? (v as string[]).join(', ') : '')
const fromTags = (s: string) => s.split(',').map((x) => x.trim()).filter(Boolean)

export default function Crud({ ckey, title, fields, titleOf, blank, validate, rows, subtitleOf }: {
  ckey: ContentKey; title: string; fields: FieldDef[]; titleOf: (r: Row) => string; subtitleOf?: (r: Row) => string
  blank: () => Row; validate?: (r: Row) => string | null; rows?: Row[]
}) {
  const d = useData()
  const list = (rows ?? (d.content[ckey] as unknown as Row[]))
  const [edit, setEdit] = useState<Row | null>(null), [isNew, setNew] = useState(false), [err, setErr] = useState<string | null>(null), [busy, setBusy] = useState(false), [q, setQ] = useState('')
  const [jsonErr, setJsonErr] = useState<Record<string, string>>({})

  const save = async () => {
    if (!edit) return
    const v = validate?.(edit) ?? (!edit.id ? 'Informe o identificador (id).' : null)
    if (v) return setErr(v)
    if (Object.keys(jsonErr).length) return setErr('Corrija o JSON inválido.')
    setBusy(true); setErr(null)
    try { await saveContentRow(ckey, edit as { id?: string }, d.content); await d.reload(); setEdit(null) } catch (e) { setErr((e as Error).message) } finally { setBusy(false) }
  }
  const remove = async (r: Row) => { if (confirm(`Excluir "${titleOf(r)}"?`)) { await deleteContentRow(ckey, r.id as string, d.content); await d.reload() } }

  if (edit) {
    const set = (k: string, v: unknown) => setEdit({ ...edit, [k]: v })
    return (
      <div className="space-y-3">
        <Btn variant="ghost" small onClick={() => setEdit(null)}>← Voltar</Btn>
        <h2 className="text-3xl">{isNew ? 'Novo' : 'Editar'}: {title}</h2>
        {fields.map((f) => {
          const v = edit[f.key]
          return <Field key={f.key} label={f.label} hint={f.hint}>
            {f.type === 'text' && <input value={(v as string) ?? ''} onChange={(e) => set(f.key, e.target.value)} disabled={f.key === 'id' && !isNew} />}
            {f.type === 'textarea' && <textarea value={(v as string) ?? ''} onChange={(e) => set(f.key, e.target.value)} />}
            {f.type === 'number' && <input inputMode="numeric" value={(v as number | null) ?? ''} onChange={(e) => set(f.key, e.target.value === '' ? null : Number(e.target.value))} />}
            {f.type === 'bool' && <label className="flex items-center gap-3 text-zinc-100"><input type="checkbox" className="!h-6 !w-6" checked={!!v} onChange={(e) => set(f.key, e.target.checked)} />Sim</label>}
            {f.type === 'select' && <select value={(v as string) ?? ''} onChange={(e) => set(f.key, e.target.value || null)}><option value="">—</option>{f.options!.map((o) => <option key={o}>{o}</option>)}</select>}
            {f.type === 'tags' && <input value={toTags(v)} placeholder="separe por vírgula" onChange={(e) => set(f.key, fromTags(e.target.value))} />}
            {f.type === 'lines' && <textarea value={Array.isArray(v) ? (v as string[]).join('\n') : ''} placeholder="um item por linha" onChange={(e) => set(f.key, e.target.value.split('\n').filter((x) => x.trim() !== '' || true))} />}
            {f.type === 'json' && <textarea className="font-mono !text-xs" rows={8} defaultValue={v === undefined || v === null ? '' : JSON.stringify(v, null, 2)} onChange={(e) => {
              try { set(f.key, e.target.value.trim() ? JSON.parse(e.target.value) : null); setJsonErr(({ [f.key]: _, ...rest }) => rest) } catch { setJsonErr((x) => ({ ...x, [f.key]: 'JSON inválido' })) }
            }} />}
            {f.type === 'json' && jsonErr[f.key] && <p className="text-sm text-danger">{jsonErr[f.key]}</p>}
            {f.type === 'file' && <div className="space-y-2">
              <input value={(v as string) ?? ''} placeholder="URL (preenchida após o envio)" onChange={(e) => set(f.key, e.target.value)} />
              <input type="file" accept={f.accept} onChange={async (e) => { const file = e.target.files?.[0]; if (!file) return; setBusy(true); try { set(f.key, await uploadMedia(file, f.key)) } catch (x) { setErr((x as Error).message) } finally { setBusy(false) } }} /></div>}
            {f.type === 'custom' && f.render?.(v, edit, (nv) => set(f.key, nv))}
          </Field>
        })}
        {err && <Notice tone="danger">{err}</Notice>}
        <Btn className="w-full" disabled={busy} onClick={save}>{busy ? 'Salvando…' : 'Salvar'}</Btn>
      </div>
    )
  }
  const shown = list.filter((r) => titleOf(r).toLowerCase().includes(q.toLowerCase()))
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2"><h2 className="text-3xl">{title}</h2><Btn small onClick={() => { setEdit(blank()); setNew(true); setErr(null) }}>+ Novo</Btn></div>
      <input placeholder="Buscar…" value={q} onChange={(e) => setQ(e.target.value)} />
      <p className="muted">{shown.length} itens. Alterações aparecem para os alunos sem publicar código.</p>
      {shown.map((r) => <Card key={r.id as string} className="flex items-center gap-2"><div className="min-w-0 flex-1"><p className="truncate font-semibold">{titleOf(r)}</p><p className="muted truncate">{subtitleOf?.(r) ?? (r.id as string)}</p></div>
        <Btn small variant="ghost" onClick={() => { setEdit(JSON.parse(JSON.stringify(r))); setNew(false); setErr(null); setJsonErr({}) }}>Editar</Btn><Btn small variant="ghost" onClick={() => remove(r)}>✕</Btn></Card>)}
    </div>
  )
}
