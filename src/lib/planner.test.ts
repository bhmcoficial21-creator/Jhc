import { describe, expect, it } from 'vitest'
import { dayPlan } from './planner'
import type { Season } from './types'

const season: Season = { mode: 'custom', game_dates: ['2026-06-13'], final_date: '2026-07-04' }
describe('planner', () => {
  it('jogo amanhã: dia LEVE, sem salto intenso nem arrancada máxima', () => {
    const p = dayPlan('2026-06-12', season)
    expect(p).toMatchObject({ load: 'LEVE', tag: 'PRÉ-JOGO', allowJumps: false, allowSprints: false })
  })
  it('48 h antes também é leve', () => expect(dayPlan('2026-06-11', season).load).toBe('LEVE'))
  it('dia seguinte ao jogo: só recuperação', () => expect(dayPlan('2026-06-14', season)).toMatchObject({ recoveryOnly: true, load: 'LEVE', allowJumps: false }))
  it('dia do jogo é PESADO e sem treino', () => expect(dayPlan('2026-06-13', season)).toMatchObject({ load: 'PESADO', gameDay: true }))
  it('semana da final: carga reduzida', () => expect(dayPlan('2026-06-29', season).load).toBe('LEVE'))
  it('semana sem jogo: normal; com treino pesado agendado, PESADO', () => {
    expect(dayPlan('2026-06-17', season).load).toBe('NORMAL')
    expect(dayPlan('2026-06-17', season, { heavyScheduled: true }).load).toBe('PESADO')
  })
  it('todo sábado gera jogos semanais', () => {
    const s: Season = { mode: 'sabado', game_dates: [], final_date: null }
    expect(dayPlan('2026-06-19', s).tag).toBe('PRÉ-JOGO') // sexta
    expect(dayPlan('2026-06-20', s).tag).toBe('JOGO')
    expect(dayPlan('2026-06-21', s).tag).toBe('RECUPERAÇÃO')
  })
})
