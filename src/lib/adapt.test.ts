import { describe, expect, it } from 'vitest'
import { EXERCISES } from '../seed/exercises'
import { PROGRAMS } from '../seed/programs'
import { resolveItem, resolveWorkout, type Ctx } from './adapt'
import type { Profile } from './types'
import { SCHEDULE, heavyBlocked } from './schedule'

const ex = new Map(EXERCISES.map((e) => [e.id, e]))
const profile = (p: Partial<Profile> = {}): Profile => ({ user_id: 'u', position: 'meia', level: 'intermediario', days_per_week: 3, locations: ['casa'], field_type: 'grama', home_space: '3x3', equipment: { casa: ['cones'], academia: ['caixa', 'halteres'], campo: ['cones'] }, health_pain: false, health_areas: [], caution: false, pain_block: false, birth_year: 2000, guardian_ok: false, terms_accepted_at: null, health_consent_at: null, onboarded: true, ...p })
const ctx = (o: Partial<Ctx> & { p?: Partial<Profile> } = {}): Ctx => ({ ex, profile: profile(o.p), place: 'casa', progress: new Map(), noJumps: false, supervised: false, ...o })

describe('seed', () => {
  it('todas as alternativas e referências existem', () => {
    for (const e of EXERCISES) {
      for (const [k, id] of Object.entries(e.alternatives)) expect(ex.has(id), `${e.id}.${k} -> ${id}`).toBe(true)
      for (const r of e.routine ?? []) expect(ex.has(r.ex), `${e.id} routine ${r.ex}`).toBe(true)
    }
    for (const p of PROGRAMS) for (const w of p.weeks) for (const wo of w.workouts) for (const it of [...wo.warmup, ...wo.main, ...wo.cooldown]) {
      expect(ex.has(it.ex), `${p.id} ${it.ex}`).toBe(true)
      for (const id of Object.values(it.pos ?? {})) expect(ex.has(id as string), `pos ${id}`).toBe(true)
    }
  })
  it('aquecimento nunca tem alongamento parado; volta à calma sim', () => {
    for (const w of PROGRAMS[0].weeks.flatMap((x) => x.workouts)) {
      expect(w.warmup.some((i) => ex.get(i.ex)!.category === 'alongamento')).toBe(false)
      expect(w.cooldown.map((i) => i.ex)).toEqual(['along_quadriceps', 'along_posterior', 'along_gluteos', 'along_panturrilha', 'along_flexores', 'along_adutores'])
    }
  })
  it('agenda semanal separa os treinos pesados por pelo menos um dia de descanso', () => {
    for (const days of Object.values(SCHEDULE)) {
      const heavyDays = days.slice(0, 3) // os 3 treinos do programa; o 4º dia é extra leve
      for (let i = 1; i < heavyDays.length; i++) expect(heavyDays[i] - heavyDays[i - 1]).toBeGreaterThan(1)
    }
    // sequência 2x/semana (A,B,C,A,B,C...) também fica separada: terça e sexta
    expect(SCHEDULE[2][1] - SCHEDULE[2][0]).toBeGreaterThan(1)
  })
  it('se o último treino pesado foi ontem, o pesado é bloqueado', () => {
    const today = new Date(2026, 5, 10, 12), y = new Date(2026, 5, 9, 12).toISOString()
    expect(heavyBlocked([{ id: '1', user_id: 'u', kind: 'treino', pain: false, heavy: true, completed_at: y }], today)).toBe(true)
    expect(heavyBlocked([{ id: '1', user_id: 'u', kind: 'treino', pain: false, heavy: true, completed_at: new Date(2026, 5, 7, 12).toISOString() }], today)).toBe(false)
  })
  it('nenhuma caixa acima de 60 cm e nenhum drop jump / salto com barra', () => {
    for (const e of EXERCISES) { expect((e.box_height_cm ?? 0) <= 60).toBe(true); expect(/drop jump|barra nas costas/i.test(e.name + e.steps.join())).toBe(false) }
  })
})

describe('adaptação', () => {
  it('salto na caixa vira salto horizontal em casa', () => {
    expect(resolveItem({ ex: 'salto_caixa' }, ctx({ place: 'casa' }))!.ex.id).toBe('salto_horizontal')
    expect(resolveItem({ ex: 'salto_caixa' }, ctx({ place: 'campo' }))!.ex.id).toBe('saltos_horiz_seq')
  })
  it('academia só para intermediário/avançado; iniciante recebe a versão de casa', () => {
    expect(resolveItem({ ex: 'salto_caixa' }, ctx({ place: 'academia' }))!.ex.id).toBe('salto_caixa')
    expect(resolveItem({ ex: 'salto_caixa' }, ctx({ place: 'academia', p: { level: 'iniciante' } }))!.ex.id).not.toBe('salto_caixa')
  })
  it('sem acompanhamento: troca step-up com halteres pela versão sem carga', () => {
    expect(resolveItem({ ex: 'stepup_halteres' }, ctx({ place: 'academia', supervised: false }))!.ex.id).toBe('afundo_alternado')
    expect(resolveItem({ ex: 'stepup_halteres' }, ctx({ place: 'academia', supervised: true }))!.ex.id).toBe('stepup_halteres')
  })
  it('sem equipamento na academia, a caixa é trocada', () => {
    expect(resolveItem({ ex: 'salto_caixa' }, ctx({ place: 'academia', p: { equipment: { academia: ['elasticos'] } } }))!.ex.id).not.toBe('salto_caixa')
  })
  it('perfil de cautela ou dor: nenhum exercício de salto no treino', () => {
    for (const c of [ctx({ noJumps: true }), ctx({ noJumps: true, place: 'campo' }), ctx({ noJumps: true, place: 'academia', supervised: true })]) {
      for (const w of PROGRAMS[0].weeks.flatMap((x) => x.workouts)) {
        const r = resolveWorkout(w, c)
        for (const x of [...r.warmup, ...r.main, ...r.cooldown]) expect(x.ex.is_jump, x.ex.id).toBe(false)
      }
    }
  })
  it('troca por exercício da posição', () => {
    expect(resolveItem({ ex: 'arrancada_5m_lado', pos: { goleiro: 'goleiro_saida' } }, ctx({ p: { position: 'goleiro' } }))!.ex.id).toBe('goleiro_saida')
  })
  it('nível: iniciante 1, intermediário 2, avançado 3; admin força', () => {
    expect(resolveItem({ ex: 'pogo' }, ctx({ p: { level: 'iniciante' } }))!.level).toBe(1)
    expect(resolveItem({ ex: 'pogo' }, ctx({ p: { level: 'avancado' } }))!.level).toBe(3)
    const progress = new Map([['pogo', { exercise_id: 'pogo', level: 2, scores: [], forced_level: 4 }]])
    expect(resolveItem({ ex: 'pogo' }, ctx({ progress }))!.level).toBe(4)
  })
})
