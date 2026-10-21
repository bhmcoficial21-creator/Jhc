// Manequim procedural: poses por família de movimento (pré-visualização até os GLBs próprios chegarem).
export interface Pose {
  rootY: number; rootX: number; rootZ: number; rotY: number; rotX: number; rotZ: number; lean: number
  hipL: number; hipR: number; kneeL: number; kneeR: number; shL: number; shR: number; elL: number; elR: number
  valgus: number; hipAbL: number; hipAbR: number
}
const Z = (): Pose => ({ rootY: 0, rootX: 0, rootZ: 0, rotY: 0, rotX: 0, rotZ: 0, lean: 0, hipL: 0, hipR: 0, kneeL: 0, kneeR: 0, shL: 0, shR: 0, elL: 0.15, elR: 0.15, valgus: 0, hipAbL: 0, hipAbR: 0 })
export const PERIOD = 2.4
const TAU = Math.PI * 2
const smooth = (u: number) => (1 - Math.cos(TAU * u)) / 2          // 0→1→0
const pos = (x: number) => Math.max(0, x)

export function familyOf(m?: string | null): string {
  const s = m ?? 'march'
  if (s.startsWith('stretch_')) return s
  if (s.startsWith('jump') || s === 'bound') return s
  if (s.startsWith('nordic')) return 'nordic'
  return s
}

export function poseAt(motion: string | null | undefined, t: number, err = false): Pose {
  const m = familyOf(motion), u = (t % PERIOD) / PERIOD, p = Z(), s = smooth(u), ph = TAU * u
  switch (m) {
    case 'squat': case 'stepup': case 'lunge': {
      if (m === 'lunge' || m === 'stepup') {
        const side = Math.floor(t / PERIOD) % 2 === 0 ? 1 : -1
        p.rootY = -0.3 * s; p.hipL = side * -0.95 * s; p.kneeL = side > 0 ? 1.25 * s : 0.5 * s; p.hipR = side * 0.45 * s + (side < 0 ? -0.95 * s : 0); p.kneeR = side > 0 ? 1.3 * s : 1.25 * s
        if (side < 0) { p.hipL = 0.45 * s; p.kneeL = 1.3 * s; p.hipR = -0.95 * s; p.kneeR = 1.25 * s }
        p.shL = -0.3 * s; p.shR = -0.3 * s
      } else { p.rootY = -0.32 * s; p.hipL = p.hipR = -1.0 * s; p.kneeL = p.kneeR = 1.55 * s; p.lean = 0.45 * s; p.shL = p.shR = -1.3 * s }
      break
    }
    case 'jump': case 'jump_small': case 'jump_forward': case 'jump_lateral': case 'jump_single': case 'jump_box': case 'bound': {
      const amp = m === 'jump_small' ? 0.4 : 1
      let ground = 0, air = 0
      if (u < 0.35) ground = smooth(u / 0.35 / 2)          // agacha
      else if (u < 0.65) air = Math.sin(((u - 0.35) / 0.3) * Math.PI)
      else if (u < 0.85) ground = smooth(0.5 + (u - 0.65) / 0.2 / 2) * 0.9      // aterrissa
      else ground = Math.max(0, 1 - (u - 0.85) / 0.15) * 0.15
      const crouch = Math.min(1, ground * 1.4) * amp
      p.rootY = -0.28 * crouch + 0.35 * air * amp
      p.hipL = p.hipR = -0.9 * crouch - 0.35 * air * amp; p.kneeL = p.kneeR = 1.4 * crouch + 0.7 * air * amp; p.lean = 0.4 * crouch
      p.shL = p.shR = -1.1 * crouch + (air > 0.1 ? -2.4 * air : 0)
      if (m === 'jump_forward') p.rootZ = (u < 0.65 ? (u > 0.35 ? (u - 0.35) / 0.3 : 0) : 1) * 0.5 - 0.25
      if (m === 'jump_lateral') p.rootX = (u < 0.65 ? (u > 0.35 ? (u - 0.35) / 0.3 : 0) : 1) * 0.6 - 0.3
      if (m === 'jump_single') { p.kneeR = 1.6; p.hipR = -0.2 }
      if (m === 'jump_box') p.rootY += air > 0 || u > 0.65 ? 0.18 : 0
      if (err && ground > 0.2) p.valgus = 0.42 * ground
      break
    }
    case 'sprint': case 'zigzag': case 'tdrill': case 'shuttle': case 'reaction': case 'turn': case 'feint': case 'dive': {
      const w = TAU * 2 * u
      p.lean = 0.35; p.hipL = -Math.sin(w) * 1.0 - 0.15; p.hipR = Math.sin(w) * 1.0 - 0.15
      p.kneeL = pos(Math.sin(w + 1.2)) * 1.7 + 0.3; p.kneeR = pos(Math.sin(w + 1.2 + Math.PI)) * 1.7 + 0.3
      p.shL = Math.sin(w) * 1.0; p.shR = -Math.sin(w) * 1.0; p.elL = p.elR = 1.2
      p.rootY = -Math.abs(Math.sin(w)) * 0.05
      if (m === 'zigzag' || m === 'feint') p.rootX = Math.sin(ph) * 0.45
      if (m === 'turn') p.rotY = s * Math.PI
      if (m === 'tdrill' || m === 'shuttle') p.rootX = Math.sin(ph) * 0.5
      if (err) p.valgus = 0.3 * Math.abs(Math.sin(w))
      break
    }
    case 'shuffle': p.rootX = Math.sin(ph) * 0.55; p.rootY = -0.2; p.hipL = p.hipR = -0.55; p.kneeL = p.kneeR = 0.95; p.lean = 0.25; p.shL = p.shR = -0.5; p.rotZ = Math.cos(ph) * 0.08; break
    case 'calf': p.rootY = s * 0.1; p.shL = p.shR = 0; break
    case 'balance': p.hipR = -0.5; p.kneeR = 1.1; p.rootX = Math.sin(ph * 2) * 0.02; p.shL = 0.6; p.shR = -0.6; break
    case 'bridge': p.rotX = -Math.PI / 2; p.rootY = 0.14 + 0.28 * s; p.hipL = p.hipR = -1.35 + 0.9 * s; p.kneeL = p.kneeR = 1.55 - 0.35 * s; p.lean = 0.4 * s; p.rootZ = 0.0; break
    case 'plank': p.rotX = Math.PI / 2; p.rootY = 0.2; p.shL = p.shR = -Math.PI / 2; p.elL = p.elR = 0; p.lean = 0; break
    case 'adduction': case 'copenhagen': p.rotZ = Math.PI / 2; p.rootY = 0.14; p.hipAbL = s * 0.35; p.shL = -0.9; break
    case 'nordic': case 'nordic_easy': p.rootY = -0.28; p.hipL = p.hipR = 0; p.kneeL = p.kneeR = 1.5; p.rotX = 0.1 + 0.9 * s; p.rootZ = 0.3 * s; p.shL = p.shR = -1.2 * s; break
    case 'ankle': p.rootY = -0.02; p.hipL = -0.5; p.kneeL = 0.9 * s; p.shL = p.shR = -0.4; p.lean = 0.25 * s; break
    case 'hip': p.hipL = -0.9 * pos(Math.sin(ph)); p.kneeL = 1.0 * pos(Math.sin(ph)); p.hipAbL = 0.5 * Math.sin(ph * 2); p.shL = 0.5; p.shR = -0.5; break
    case 'scan': p.rotY = Math.sin(ph) * 0.9; p.hipL = p.hipR = -0.25; p.kneeL = p.kneeR = 0.5; p.rootY = -0.07; p.lean = 0.15; break
    case 'breath': p.rotX = -Math.PI / 2; p.rootY = 0.14; p.lean = 0.02 * s; p.shL = p.shR = 0.1; p.elL = p.elR = 0.1; break
    case 'stretch_quad': p.hipR = 0.15; p.kneeR = 2.5 + 0.05 * s; p.shR = 0.9; p.elR = 1.8; p.shL = -0.5; break
    case 'stretch_ham': p.lean = 0.8 + 0.05 * s; p.hipL = -1.3; p.kneeL = 0; p.hipR = -0.1; p.kneeR = 0.2; p.shL = p.shR = -1.3; p.elL = p.elR = 0; break
    case 'stretch_glute': p.rotX = -Math.PI / 2; p.rootY = 0.14; p.hipL = -1.5 - 0.04 * s; p.kneeL = 1.5; p.hipR = -1.0; p.kneeR = 2.0; break
    case 'stretch_calf': p.lean = 0.35; p.shL = p.shR = -1.5; p.elL = p.elR = 0; p.hipL = -0.5; p.kneeL = 0.7; p.hipR = 0.5; p.kneeR = 0; p.rootZ = 0.0; break
    case 'stretch_hipflex': p.rootY = -0.3; p.hipL = -1.6; p.kneeL = 1.6; p.hipR = 0.35 + 0.03 * s; p.kneeR = 1.65; p.shL = p.shR = -0.4; break
    case 'stretch_adductor': p.rootY = -0.25; p.hipAbL = 0.8; p.hipAbR = -0.8; p.hipL = p.hipR = -0.3; p.kneeL = 1.0 * (0.4 + 0.6 * s); p.kneeR = 0.1; p.shL = p.shR = -0.5; p.rootX = 0.12 * s; break
    case 'march': default: {
      const w = TAU * 2 * u
      p.hipL = -pos(Math.sin(w)) * 1.1; p.kneeL = pos(Math.sin(w)) * 1.4; p.hipR = -pos(Math.sin(w + Math.PI)) * 1.1; p.kneeR = pos(Math.sin(w + Math.PI)) * 1.4
      p.shL = Math.sin(w) * 0.6; p.shR = -Math.sin(w) * 0.6; p.elL = p.elR = 0.9; p.rootY = -0.02
    }
  }
  return p
}
