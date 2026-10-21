import { lsGet, lsSet } from './supabase'

/** Perfil pronto para a demonstração: pula o onboarding e abre direto no app. */
export function seedDemoProfile() {
  if (lsGet<unknown[]>('vp:t:profiles', []).some((p) => (p as { user_id?: string }).user_id === 'demo')) return
  const now = new Date().toISOString()
  lsSet('vp:t:profiles', [{ user_id: 'demo', position: 'meia', level: 'intermediario', days_per_week: 3, locations: ['casa', 'academia', 'campo'], field_type: 'grama', home_space: '3x3',
    equipment: { casa: ['cones', 'degrau'], academia: ['tudo'], campo: ['cones', 'ladeira'] }, health_pain: false, health_areas: [], caution: false, pain_block: false,
    birth_year: 1995, guardian_ok: false, terms_accepted_at: now, health_consent_at: now, onboarded: true }])
}
