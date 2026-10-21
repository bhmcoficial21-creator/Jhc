// Popula o Supabase com o conteúdo inicial (idempotente). Uso:
//   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... npm run seed
import { createClient } from '@supabase/supabase-js'
import { EXERCISES, GUIDE, LESSONS, MISSIONS, PROGRAMS, QUIZ } from '../src/seed'

const url = process.env.SUPABASE_URL, key = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !key) { console.error('Defina SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY'); process.exit(1) }
const db = createClient(url, key, { auth: { persistSession: false } })

async function up(table: string, rows: object[], onConflict = 'id') {
  for (let i = 0; i < rows.length; i += 100) {
    const { error } = await db.from(table).upsert(rows.slice(i, i + 100), { onConflict })
    if (error) { console.error(table, error.message); process.exit(1) }
  }
  console.log(`✓ ${table}: ${rows.length}`)
}

await up('exercises', EXERCISES)
await up('programs', PROGRAMS)
await up('lessons', LESSONS)
await up('quiz_questions', QUIZ)
await up('missions', MISSIONS)
await up('guide_pages', GUIDE)
