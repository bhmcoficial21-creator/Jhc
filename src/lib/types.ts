export type Position = 'goleiro' | 'zagueiro' | 'lateral' | 'meia' | 'atacante'
export type LevelName = 'iniciante' | 'intermediario' | 'avancado'
export type Place = 'casa' | 'academia' | 'campo'
export type Plan = 'mensal' | 'anual'

export interface Subscription {
  email: string; plan: Plan; status: 'active' | 'past_due' | 'canceled' | 'refunded'
  period_end: string | null; manual_override: 'grant' | 'revoke' | null; price_phase: number
  user_id?: string | null; started_at?: string; canceled_at?: string | null
}

export interface Profile {
  user_id: string; position: Position | null; level: LevelName | null; days_per_week: 2 | 3 | 4 | null
  locations: Place[]; field_type: 'sintetico' | 'grama' | 'terra' | null; home_space: '2x2' | '3x3' | 'mais' | null
  equipment: Partial<Record<Place, string[]>>
  health_pain: boolean; health_areas: string[]; caution: boolean; pain_block: boolean
  birth_year: number | null; guardian_ok: boolean
  terms_accepted_at: string | null; health_consent_at: string | null
  onboarded: boolean; last_access_check?: string | null
}

export interface CircuitDef {
  title: string; notes: string
  cones: { id: string; x: number; y: number; label?: string }[]   // metros
  path: string[]                                                  // ordem dos ids
  distances: { from: string; to: string; m: number }[]
  area: [number, number]
}

export interface LevelDef { n: 1 | 2 | 3 | 4; name: string; desc: string }

export interface Exercise {
  id: string; name: string; category: string; kind: 'fisico' | 'habilidade'
  objective: string; steps: string[]; mistakes: string[]
  min_level: number; locations: Place[]; equipment: string[]; min_space: string
  is_jump: boolean; injury_risk: boolean; beginner_error?: string | null
  levels: LevelDef[]; alternatives: Record<string, string>; routine?: { ex: string; secs: number; rest: number }[] | null
  positions: Position[]; annual_only: boolean; needs_supervision: boolean; box_height_cm?: number | null
  anim_url?: string | null; camera_angle?: string | null; xray_joint?: string | null
  image_url?: string | null; video_url?: string | null; motion?: string | null
  timed_secs?: number | null; circuit?: CircuitDef | null; credit?: string | null
}

export interface WorkoutItem {
  ex: string; sets?: number; reps?: number; secs?: number; rest?: number; side?: boolean
  rate?: boolean                                   // pede nota 0-10 (habilidade)
  pos?: Partial<Record<Position, string>>        // troca por exercício da função
  cmd?: boolean                                    // reação a comando (sinal sonoro + seta)
}
export interface Workout {
  title: string; heavy: boolean; light?: boolean
  warmup: WorkoutItem[]; main: WorkoutItem[]; cooldown: WorkoutItem[]
}
export interface ProgramWeek { week: number; phase: 'BASE' | 'EXPLOSÃO' | 'JOGO' | string; workouts: Workout[] }
export interface Program {
  id: string; name: string; description: string; order_idx: number; release_month: number
  annual_only: boolean; published: boolean; weeks: ProgramWeek[]
}

export interface Frame {
  players: { id: string; team: 'a' | 'b'; x: number; y: number; label?: string; me?: boolean }[]
  ball: { x: number; y: number }
  note?: string
}
export interface Board {
  field: '11' | 'society' | 'futsal'
  scenes: { situation: Frame[]; error: Frame[]; right: Frame[] }
}
export interface Lesson {
  id: string; order_idx: number; title: string; positions: Position[]; minutes: number
  summary: string; situation: string; error_text: string; right_text: string
  board: Board | null; published: boolean; reviewed: boolean
}
export interface QuizQuestion {
  id: string; lesson_id: string; prompt: string
  board: { field: Board['field']; frame: Frame }
  answer: { x: number; y: number; r: number }; explanation: string
}
export interface Mission { id: string; title: string; body: string; positions: Position[]; lesson_id: string | null }
export interface GuidePage {
  id: string; kind: 'guia' | 'planner' | 'posjogo' | 'preseason' | 'aquecimento_jogo'
  title: string; order_idx: number; body: string
  steps: { ex: string; secs: number; side?: boolean }[]
}
export interface RefLink { id: string; title: string; url: string; author: string; note: string }

export interface AppConfig {
  phase_number: number; phase_name: string; monthly_price: number; annual_price: number
  monthly_url: string; annual_url: string; manage_url: string; whatsapp: string
  show_launch_badge: boolean; show_price_rise_notice: boolean
}

export interface SessionRow {
  id: string; user_id: string; kind: string; program_id?: string | null; week?: number | null; workout_idx?: number | null
  location?: string | null; effort?: number | null; pain: boolean; heavy: boolean; duration_s?: number | null; completed_at: string
}
export interface ExProgress { exercise_id: string; level: number; scores: number[]; forced_level?: number | null }
export interface TestRow { kind: 'salto_horizontal' | 'salto_vertical' | 'agilidade'; phase: 1 | 4 | 8; value: number; variant?: string | null }
export interface Season { mode: 'custom' | 'sabado' | 'domingo'; game_dates: string[]; final_date: string | null }
