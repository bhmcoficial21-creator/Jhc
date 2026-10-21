import type { Position, Program, Workout, WorkoutItem } from '../lib/types'

const POS_SPRINT: Partial<Record<Position, string>> = { goleiro: 'goleiro_saida', zagueiro: 'zag_arrancada', lateral: 'lat_arrancadas', meia: 'meia_ritmo', atacante: 'ata_arrancada' }
const POS_REACT: Partial<Record<Position, string>> = { goleiro: 'goleiro_reacao', zagueiro: 'zag_recuo', lateral: 'lat_apoio_recuo', meia: 'meia_giro', atacante: 'ata_desmarque' }

/** Volume de saltos começa baixo e cresce a cada semana. */
const grow = (base: number, week: number, weeks: number) => Math.max(2, Math.round(base * (0.6 + 0.4 * (week - 1) / Math.max(1, weeks - 1))))
const t = (ex: string, secs: number, extra: Partial<WorkoutItem> = {}): WorkoutItem => ({ ex, sets: 1, secs, ...extra })
const m = (ex: string, sets: number, reps: number, rest = 60, extra: Partial<WorkoutItem> = {}): WorkoutItem => ({ ex, sets, reps, rest, ...extra })

const warmup = (extra: WorkoutItem[] = []): WorkoutItem[] => [
  t('trote_lugar', 45), t('skipping', 30), t('elevacao_joelhos', 30), t('corrida_lateral', 30),
  { ex: 'agachamento_livre', sets: 1, reps: 10 }, { ex: 'afundo_alternado', sets: 1, reps: 10 },
  t('mob_tornozelo', 30, { side: true }), t('mob_quadril', 30, { side: true }), ...extra,
]
// Volta à calma: alongamento parado de 20 a 30 s por lado (somente aqui — nunca antes de saltos e arrancadas)
const cooldown = (): WorkoutItem[] => ['along_quadriceps', 'along_posterior', 'along_gluteos', 'along_panturrilha', 'along_flexores', 'along_adutores'].map((ex) => t(ex, 25, { side: true }))

type Phase = 'BASE' | 'EXPLOSÃO' | 'JOGO'

function workouts(phase: Phase, week: number, weeks: number): Workout[] {
  const g = (b: number) => grow(b, week, weeks)
  if (phase === 'BASE') return [
    { title: 'Base A — aterrissagem e arrancada', heavy: false, warmup: warmup([{ ex: 'ponte_gluteo', sets: 1, reps: 10 }]), cooldown: cooldown(),
      main: [m('pogo', 2, g(8), 45), m('agach_controle_joelho', 3, 10, 45), m('ponte_uma_perna', 2, 8, 45), m('arrancada_5m_lado', 4, 1, 45, { pos: POS_SPRINT }), t('equilibrio_uma_perna', 30, { sets: 2, side: true, rest: 20 })] },
    { title: 'Base B — estabilidade', heavy: false, warmup: warmup([t('prancha', 20)]), cooldown: cooldown(),
      main: [m('salto_horizontal', 3, g(4), 60), m('panturrilha', 3, 12, 40), m('zigzag', 3, 1, 45), m('aducao_deitado', 2, 10, 40), m('mov_olhar_ombro', 2, 4, 30, { pos: POS_REACT })] },
    { title: 'Base C — leve: prevenção e bola', heavy: false, light: true, warmup: warmup(), cooldown: cooldown(),
      main: [{ ex: 'dominio_3min', sets: 1, reps: 1, rate: true }, m('posterior_lento', 2, 6, 45), t('prancha', 20, { sets: 2, rest: 30 }), t('equilibrio_uma_perna', 30, { sets: 2, side: true, rest: 20 })] },
  ]
  if (phase === 'EXPLOSÃO') return [
    { title: 'Explosão A — saltos e arrancadas', heavy: true, warmup: warmup([{ ex: 'ponte_gluteo', sets: 1, reps: 10 }]), cooldown: cooldown(),
      main: [m('agach_salto', 3, g(6), 75), m('salto_cone_frente', 3, g(5), 75), m('arrancada_5m_lado', 5, 1, 60, { pos: POS_SPRINT }), m('shuffle', 3, 1, 45), m('ponte_uma_perna', 2, 8, 40)] },
    { title: 'Explosão B — lateral e passadas', heavy: true, warmup: warmup([t('prancha', 20)]), cooldown: cooldown(),
      main: [m('salto_cone_lateral', 3, g(5), 75), m('bounds', 3, g(4), 75), m('arrancada_5m_costas', 4, 1, 60, { pos: POS_REACT }), m('panturrilha', 3, 12, 40)] },
    { title: 'Explosão C — leve: bola e prevenção', heavy: false, light: true, warmup: warmup(), cooldown: cooldown(),
      main: [m('finta_3passos', 3, 1, 45, { rate: true }), m('aducao_deitado', 2, 10, 40), m('posterior_lento', 2, 6, 45), { ex: 'dominio_3min', sets: 1, reps: 1, rate: true }] },
  ]
  return [
    { title: 'Jogo A — mudança de direção', heavy: true, warmup: warmup([{ ex: 'ponte_gluteo', sets: 1, reps: 10 }]), cooldown: cooldown(),
      main: [m('t_drill', 4, 1, 75), m('drill_5105', 3, 1, 75), m('giro180', 4, 1, 60), m('arrancada_5m_deitado', 3, 1, 60, { pos: POS_SPRINT })] },
    { title: 'Jogo B — reação e fintas', heavy: true, warmup: warmup([t('prancha', 20)]), cooldown: cooldown(),
      main: [m('reacao_comando', 6, 1, 30, { cmd: true }), m('finta_saida', 4, 1, 45, { pos: POS_REACT }), m('marcacao_recuo', 4, 1, 45), m('salto_horizontal', 3, g(4), 60)] },
    { title: 'Jogo C — leve: drible e leitura', heavy: false, light: true, warmup: warmup(), cooldown: cooldown(),
      main: [m('drible_1x1_cones', 3, 1, 45, { rate: true }), m('mov_toque_contra', 3, 4, 40), m('mov_olhar_ombro', 3, 4, 30), m('ponte_uma_perna', 2, 8, 40), m('posterior_lento', 2, 6, 45)] },
  ]
}

const build = (phases: Phase[]) => phases.map((phase, i) => ({ week: i + 1, phase, workouts: workouts(phase, i + 1, phases.length) }))
const FIRST: Phase[] = ['BASE', 'BASE', 'EXPLOSÃO', 'EXPLOSÃO', 'EXPLOSÃO', 'JOGO', 'JOGO', 'JOGO']

export const PROGRAMS: Program[] = [
  { id: 'prog1', name: 'Programa 1 — Base, Explosão e Jogo', order_idx: 1, release_month: 0, annual_only: false, published: true,
    description: '8 semanas, 3 treinos por semana (25 a 35 min). Semanas 1-2 BASE, 3-5 EXPLOSÃO, 6-8 JOGO.', weeks: build(FIRST) },
  { id: 'preseason', name: 'Pré-temporada da Várzea (bônus anual)', order_idx: 100, release_month: 0, annual_only: true, published: true,
    description: '4 semanas, 3 treinos por semana, para chegar bem no início do campeonato.', weeks: build(['BASE', 'EXPLOSÃO', 'EXPLOSÃO', 'JOGO']) },
]
