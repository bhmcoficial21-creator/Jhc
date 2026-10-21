import { useEffect, useMemo, useRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Html, useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import { type Replay, ballAt, focusAt, posAt, velAt } from '../../lib/replay'
import { actPose, type ActName } from '../pose'
import { applyPose, modelUrl } from '../RiggedMannequin'
import { createScanFigure, type ScanFigure } from './scan'

export interface Clock { t: number; playing: boolean; speed: number; loop: boolean }
export type CamMode = 'tv' | 'seguir' | 'gol'
export interface Hud { t: number; dist: number; kmh: number; step: string }

const BG = '#040914', LINE = '#7f9bd6', TEAM = { a: '#9fd0ff', b: '#d9dde6' }
const HERO = '#c6ff00'

function Pitch({ r }: { r: Replay }) {
  const geo = useMemo(() => {
    const pts: number[] = []
    const rect = (x0: number, y0: number, x1: number, y1: number) => pts.push(x0, 0, y0, x1, 0, y0, x1, 0, y0, x1, 0, y1, x1, 0, y1, x0, 0, y1, x0, 0, y1, x0, 0, y0)
    const circle = (cx: number, cy: number, rad: number, a0 = 0, a1 = Math.PI * 2, n = 48) => { for (let i = 0; i < n; i++) { const p = a0 + ((a1 - a0) * i) / n, q = a0 + ((a1 - a0) * (i + 1)) / n; pts.push(cx + rad * Math.cos(p), 0, cy + rad * Math.sin(p), cx + rad * Math.cos(q), 0, cy + rad * Math.sin(q)) } }
    if (r.pitch === 'full') {
      rect(-52.5, -34, 52.5, 34); pts.push(0, 0, -34, 0, 0, 34); circle(0, 0, 9.15)
      for (const s of [1, -1]) { rect(s * 52.5, -20.15, s * (52.5 - 16.5), 20.15); rect(s * 52.5, -9.16, s * (52.5 - 5.5), 9.16); circle(s * (52.5 - 11), 0, 9.15, s > 0 ? Math.PI - 0.93 : -0.93, s > 0 ? Math.PI + 0.93 : 0.93, 18) }
    } else if (r.pitch === 'court') {
      rect(-20, -10, 20, 10); pts.push(0, 0, -10, 0, 0, 10); circle(0, 0, 3)
      for (const s of [1, -1]) circle(s * 20, 0, 6, s > 0 ? Math.PI / 2 : -Math.PI / 2, s > 0 ? Math.PI * 1.5 : Math.PI / 2, 24)
    }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3)); return g
  }, [r.pitch])
  // grão no gramado (pontos tênues), concentrado perto do foco
  const grain = useMemo(() => {
    const n = 2600, a = new Float32Array(n * 3); let s = 11
    const rnd = () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296)
    for (let i = 0; i < n; i++) { a[i * 3] = r.focus.x + (rnd() - 0.5) * 80; a[i * 3 + 1] = 0; a[i * 3 + 2] = r.focus.y + (rnd() - 0.5) * 55 }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(a, 3)); return g
  }, [r.focus.x, r.focus.y])
  const goal = r.goal
  return <>
    <lineSegments geometry={geo} position-y={0.01}><lineBasicMaterial color={LINE} transparent opacity={0.8} /></lineSegments>
    <points geometry={grain}><pointsMaterial color="#3a5a9a" size={0.09} transparent opacity={0.55} sizeAttenuation depthWrite={false} /></points>
    {goal && <group position={[goal.x, 0, 0]}>
      <lineSegments><edgesGeometry args={[new THREE.BoxGeometry(2.2, 2.44, 7.32)]} /><lineBasicMaterial color="#e8eeff" /></lineSegments>
      <mesh position={[0.4, 1.22, 0]}><boxGeometry args={[1.6, 2.44, 7.32]} /><meshBasicMaterial color="#8fa8d8" wireframe transparent opacity={0.25} /></mesh>
    </group>}
    {r.cones?.map(([x, y], i) => <mesh key={i} position={[x, 0.16, y]}><coneGeometry args={[0.16, 0.32, 14]} /><meshBasicMaterial color="#ff9a3c" /></mesh>)}
  </>
}

function World({ r, clock, mode, hudRef, onEnd }: { r: Replay; clock: React.MutableRefObject<Clock>; mode: CamMode; hudRef: React.MutableRefObject<Hud>; onEnd?: () => void }) {
  const gltf = useGLTF(modelUrl())
  const { size, camera, gl } = useThree()
  const figs = useMemo<(ScanFigure & { id: string })[]>(() => r.tracks.map((t) => ({ id: t.id, ...createScanFigure(gltf.scene, t.hero ? HERO : TEAM[t.team]) })), [r, gltf.scene])
  const rest = useMemo(() => figs.map((f) => ({ hipsX: f.bones.Hips?.position.x ?? 0, hipsY: f.bones.Hips?.position.y ?? 104, hipsZ: f.bones.Hips?.position.z ?? 0 })), [figs])
  const groups = useRef<THREE.Group[]>([]), ball = useRef<THREE.Group>(null), trail = useRef<THREE.Line>(null)
  const phases = useRef<number[]>([]), yaws = useRef<number[]>([]), trailPts = useRef<THREE.Vector3[]>([]), cam = useRef({ tx: r.focus.x, ty: r.focus.y, d: 0, init: false }), heroDist = useRef({ d: 0, lastT: 0, prev: null as null | [number, number] })
  const endHold = useRef(0)
  const trailGeo = useMemo(() => new THREE.BufferGeometry().setFromPoints(Array.from({ length: 28 }, () => new THREE.Vector3())), [])
  useEffect(() => { phases.current = r.tracks.map(() => 0); yaws.current = r.tracks.map(() => 0); heroDist.current = { d: 0, lastT: 0, prev: null } }, [r])

  useFrame((_, dt) => {
    const c = clock.current
    if (c.playing) {
      c.t += dt * c.speed
      if (c.t >= r.duration) { if (c.loop) { endHold.current += dt; if (endHold.current > 1.2) { c.t = 0; endHold.current = 0 } else c.t = r.duration } else { c.t = r.duration; c.playing = false; onEnd?.() } }
    }
    const t = Math.min(Math.max(0, c.t), r.duration)
    for (const f of figs) f.mat.uniforms.uScale.value = (size.height * gl.getPixelRatio()) / (2 * Math.tan(((camera as THREE.PerspectiveCamera).fov * Math.PI) / 360))
    const b = ballAt(r, t)
    const hero = r.tracks.find((x) => x.hero)!
    r.tracks.forEach((tr, i) => {
      const g = groups.current[i], f = figs[i]; if (!g) return
      const p = posAt(tr, t), v = velAt(tr, t)
      const act: ActName = (p.act === 'run' && v.speed < 0.35 ? 'idle' : p.act === 'run' && v.speed < 3.2 ? 'jog' : p.act) as ActName
      const moving = act === 'run' || act === 'jog' || act === 'jockey' || act === 'celebrate'
      if (c.playing && moving) phases.current[i] += dt * c.speed * Math.PI * 2 * (0.6 + 0.1 * Math.min(8, v.speed + 1))
      else if (c.playing) phases.current[i] += dt * c.speed * 1.2
      // orientação: pela velocidade; marcador/jockey olha para o herói/bola; gestos usam `face`
      let target = v.speed > 0.6 ? Math.atan2(v.vx, v.vy) : yaws.current[i]
      if (p.face !== undefined && (v.speed < 0.6 || act === 'feint' || act === 'pedal' || act === 'turn' || act === 'receive' || act === 'kick')) target = Math.atan2(Math.cos((p.face * Math.PI) / 180), Math.sin((p.face * Math.PI) / 180))
      if (act === 'jockey' && tr.team !== hero.team) { const h = posAt(hero, t); target = Math.atan2(h.x - p.x, h.y - p.y) }
      else if (act === 'jockey' && tr.hero) { const o = r.tracks.find((x) => x.team !== tr.team); if (o) { const q = posAt(o, t); target = Math.atan2(q.x - p.x, q.y - p.y) } }
      let dy = target - yaws.current[i]; dy = Math.atan2(Math.sin(dy), Math.cos(dy))
      yaws.current[i] += dy * Math.min(1, dt * 9)
      const yaw = yaws.current[i]
      // lado do gesto/mergulho: componente lateral do deslocamento em relação ao corpo
      const lat = v.vx * Math.cos(yaw) - v.vy * Math.sin(yaw)
      const side = (act === 'dive' ? Math.sign(lat || 1) : Math.sign(lat || (i % 2 ? 1 : -1))) as 1 | -1
      g.position.set(p.x, 0, p.y); g.rotation.y = yaw
      applyPose(f.bones, rest[i], actPose(act, v.speed, phases.current[i], p.actT, side))
    })
    if (ball.current) { ball.current.position.set(b.x, b.z, b.y) }
    // rastro da bola
    const tp = trailPts.current; tp.unshift(new THREE.Vector3(b.x, b.z, b.y)); if (tp.length > 28) tp.pop()
    const posAttr = trailGeo.getAttribute('position') as THREE.BufferAttribute
    for (let i = 0; i < 28; i++) { const q = tp[Math.min(i, tp.length - 1)]; posAttr.setXYZ(i, q.x, q.y, q.z) }
    posAttr.needsUpdate = true
    // dados do HUD
    const hp = posAt(hero, t), hv = velAt(hero, t), H = heroDist.current
    if (H.prev && t > H.lastT) H.d += Math.hypot(hp.x - H.prev[0], hp.y - H.prev[1]); if (t < H.lastT - 0.5) H.d = 0
    H.prev = [hp.x, hp.y]; H.lastT = t
    const step = [...r.steps].reverse().find((s) => t >= s.t - 0.05)?.text ?? r.steps[0]?.text ?? ''
    hudRef.current = { t, dist: H.d, kmh: hv.speed * 3.6, step }
    // câmera
    const f = focusAt(r, t), hd = Math.atan2(hv.vx, hv.vy), cs = cam.current
    const k = 1 - Math.exp(-dt * 3.2), S = r.focus.size
    let px: number, py: number, pz: number, lx: number, ly: number, lz: number
    const m: CamMode = mode === 'gol' && !r.goal ? 'tv' : mode
    if (m === 'seguir') {
      const dirx = hv.speed > 0.6 ? Math.sin(hd) : Math.sin(yaws.current[r.tracks.indexOf(hero)]), dirz = hv.speed > 0.6 ? Math.cos(hd) : Math.cos(yaws.current[r.tracks.indexOf(hero)])
      px = hp.x - dirx * 7 + dirz * 1.5; py = 3.4; pz = hp.y - dirz * 7 - dirx * 1.5; lx = hp.x + dirx * 5; ly = 1.1; lz = hp.y + dirz * 5
    } else if (m === 'gol') {
      px = r.goal!.x + 12; py = 2.4; pz = b.y * 0.4 + 6; lx = (f.cx + r.goal!.x) / 2; ly = 1.0; lz = f.cy
    } else {
      // enquadra herói, bola e quem está por perto, respeitando o formato vertical da tela
      const pts: [number, number][] = [[f.ball.x, f.ball.y]]
      for (const tr of r.tracks) { const q = posAt(tr, t); if (tr.hero || Math.hypot(q.x - hp.x, q.y - hp.y) < 20) pts.push([q.x, q.y]) }
      const xs = pts.map((q) => q[0]), zs = pts.map((q) => q[1])
      const w = Math.max(...xs) - Math.min(...xs) + 5.5, h = Math.max(...zs) - Math.min(...zs) + 6
      const cx = (Math.max(...xs) + Math.min(...xs)) / 2, cz = (Math.max(...zs) + Math.min(...zs)) / 2
      const asp = size.width / size.height, vf = ((camera as THREE.PerspectiveCamera).fov * Math.PI) / 180, hf = 2 * Math.atan(Math.tan(vf / 2) * asp)
      const need = Math.max(w / (2 * Math.tan(hf / 2)), (h * 0.8) / (2 * Math.tan(vf / 2)), 7)
      cs.tx += (cx - cs.tx) * k; cs.ty += (cz - cs.ty) * k; cs.d = cs.d === 0 ? need : cs.d + (need - cs.d) * k * 0.7
      px = cs.tx; py = cs.d * 0.72; pz = cs.ty + cs.d * 0.78; lx = cs.tx; ly = 0.9; lz = cs.ty
    }
    if (!cs.init) { camera.position.set(px, py, pz); cs.init = true } else camera.position.lerp(new THREE.Vector3(px, py, pz), m === 'tv' ? 0.2 : 0.12)
    camera.lookAt(lx, ly, lz)
  })

  return <>
    <Pitch r={r} />
    {figs.map((f, i) => <group key={f.id} ref={(g) => { if (g) groups.current[i] = g }}><primitive object={f.root} />
      <Html position={[0, 2.1, 0]} center zIndexRange={[5, 0]} style={{ pointerEvents: 'none' }}>
        <span className={`whitespace-nowrap rounded px-1.5 py-0.5 font-display text-[10px] font-extrabold uppercase tracking-wide ${r.tracks[i].hero ? 'bg-lime text-black' : 'bg-black/55 text-zinc-200'}`}>{r.tracks[i].role}</span>
      </Html></group>)}
    <group ref={ball}><mesh><sphereGeometry args={[0.13, 14, 10]} /><meshBasicMaterial color="#ffffff" /></mesh>
      <mesh><sphereGeometry args={[0.42, 12, 8]} /><meshBasicMaterial color="#9fd0ff" transparent opacity={0.22} depthWrite={false} blending={THREE.AdditiveBlending} /></mesh></group>
    <primitive object={useMemo(() => new THREE.Line(trailGeo, new THREE.LineBasicMaterial({ color: '#cfe6ff', transparent: true, opacity: 0.55 })), [trailGeo])} ref={trail as never} />
  </>
}

export default function ReplayScene({ r, clock, mode, hudRef, onEnd, onCanvas }: { r: Replay; clock: React.MutableRefObject<Clock>; mode: CamMode; hudRef: React.MutableRefObject<Hud>; onEnd?: () => void; onCanvas?: (c: HTMLCanvasElement) => void }) {
  return (
    <Canvas dpr={[1, 1.5]} camera={{ fov: 42, position: [r.focus.x, r.focus.size * 0.6, r.focus.y + r.focus.size], near: 0.3, far: 220 }}
      gl={{ antialias: false, powerPreference: 'low-power', preserveDrawingBuffer: true }} onCreated={({ gl }) => onCanvas?.(gl.domElement)} style={{ touchAction: 'none' }}>
      <color attach="background" args={[BG]} /><fog attach="fog" args={[BG, 40, 120]} />
      <World r={r} clock={clock} mode={mode} hudRef={hudRef} onEnd={onEnd} />
    </Canvas>
  )
}
