import { Component, Suspense, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Line, OrbitControls, useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import { clone as cloneSkinned } from 'three/examples/jsm/utils/SkeletonUtils.js'
import type { CircuitDef } from '../lib/types'
import { Mannequin, type MannequinApi } from './Mannequin'

export interface ViewerProps {
  src?: string | null; motion?: string | null; mode: 'erro' | 'correto'; level: number
  angle?: string | null; joint?: string | null; circuit?: CircuitDef | null; cones?: boolean
  image?: string | null; video?: string | null; title: string; height?: number; compact?: boolean
}

const webglOk = (() => { try { const c = document.createElement('canvas'); return !!(c.getContext('webgl2') || c.getContext('webgl')) } catch { return false } })()
const ANGLES: Record<string, [number, number, number]> = { lateral: [1, 0.35, 0], frontal: [0, 0.35, 1], traseiro: [0, 0.35, -1], cima: [0, 1, 0.001] }
const ANGLE_LABEL: Record<string, string> = { lateral: 'Lateral', frontal: 'Frontal', traseiro: 'Traseiro', cima: 'De cima' }

class Boundary extends Component<{ fallback: ReactNode; children: ReactNode }, { err: boolean }> {
  state = { err: false }
  static getDerivedStateFromError() { return { err: true } }
  render() { return this.state.err ? this.props.fallback : this.props.children }
}

function Floor({ circuit }: { circuit?: CircuitDef | null }) {
  const shadow = useMemo(() => {
    const c = document.createElement('canvas'); c.width = c.height = 64
    const g = c.getContext('2d')!, gr = g.createRadialGradient(32, 32, 2, 32, 32, 32)
    gr.addColorStop(0, 'rgba(0,0,0,.65)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 64)
    return new THREE.CanvasTexture(c)
  }, [])
  return <>
    <mesh rotation-x={-Math.PI / 2} position-y={-0.001}><circleGeometry args={[6, 48]} /><meshStandardMaterial color="#111" roughness={1} /></mesh>
    <gridHelper args={[8, 16, '#222', '#1a1a1a']} position-y={0.001} />
    <mesh rotation-x={-Math.PI / 2} position-y={0.003}><planeGeometry args={[1.1, 1.1]} /><meshBasicMaterial map={shadow} transparent depthWrite={false} /></mesh>
    {circuit && <CircuitMarks c={circuit} />}
  </>
}
/** Cones e trilha (setas) do circuito, em escala 1 m = 1 unidade, centralizados. */
function CircuitMarks({ c }: { c: CircuitDef }) {
  const cx = c.area[0] / 2, cy = c.area[1] / 2
  const P = (x: number, y: number): [number, number, number] => [x - cx, 0.02, y - cy]
  const by = new Map(c.cones.map((k) => [k.id, k]))
  const pts = c.path.map((id) => by.get(id)).filter(Boolean).map((k) => P(k!.x, k!.y))
  return <group>
    {c.cones.map((k) => <mesh key={k.id} position={[k.x - cx, 0.1, k.y - cy]}><coneGeometry args={[0.07, 0.2, 16]} /><meshStandardMaterial color="#ff8a00" /></mesh>)}
    {pts.length > 1 && <Line points={pts} color="#c6ff00" lineWidth={2.5} dashed dashSize={0.12} gapSize={0.08} />}
  </group>
}

function Ticker({ playing }: { playing: boolean }) {
  const invalidate = useThree((s) => s.invalidate)
  useEffect(() => { if (!playing) { invalidate(); return } const id = setInterval(invalidate, 33); return () => clearInterval(id) }, [playing, invalidate])   // ~30 fps
  return null
}

function Rig({ view, controls, api }: { view: { angle: string; zoom: boolean; n: number }; controls: React.MutableRefObject<{ target: THREE.Vector3; update: () => void } | null>; api: React.MutableRefObject<MannequinApi | null> }) {
  const { camera, invalidate } = useThree()
  useEffect(() => {
    const dir = ANGLES[view.angle] ?? ANGLES.lateral, d = view.zoom ? 1.3 : 3.4
    let target = new THREE.Vector3(0, 0.9, 0)
    if (view.zoom) { const o = api.current?.joint((window as unknown as { __joint?: string }).__joint ?? 'joelho'); if (o) { const v = new THREE.Vector3(); o.getWorldPosition(v); target = v } }
    camera.position.set(target.x + dir[0] * d, target.y + dir[1] * d + (view.angle === 'cima' ? 1.5 : 0), target.z + dir[2] * d)
    camera.lookAt(target)
    if (controls.current) { controls.current.target.copy(target); controls.current.update() }
    invalidate()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view.angle, view.zoom, view.n])
  return null
}

/** Animação GLB própria do exercício. Clips nomeados: erro, correto, n1..n4 (senão usa o primeiro). */
function GlbModel({ url, mode, level, playing, speed, xray, joint }: { url: string; mode: string; level: number; playing: boolean; speed: number; xray: boolean; joint?: string | null }) {
  const gltf = useGLTF(url)
  const scene = useMemo(() => cloneSkinned(gltf.scene), [gltf.scene])
  const mixer = useMemo(() => new THREE.AnimationMixer(scene), [scene])
  useEffect(() => {
    const by = (re: RegExp) => gltf.animations.find((a) => re.test(a.name.toLowerCase()))
    const clip = (mode === 'erro' && by(/erro|error|wrong/)) || by(new RegExp(`(^|[^0-9])n?${level}$|nivel${level}|level${level}`)) || by(/correto|correct|exec/) || gltf.animations[0]
    if (!clip) return
    mixer.stopAllAction(); const a = mixer.clipAction(clip); a.reset().play()
    return () => { a.stop() }
  }, [gltf, mixer, mode, level])
  useFrame((_, dt) => { if (playing) mixer.update(dt * speed) })
  useEffect(() => {
    const helpers: THREE.Object3D[] = []
    scene.traverse((o) => {
      const m = (o as THREE.Mesh).material as THREE.Material | THREE.Material[] | undefined
      if (m) for (const x of Array.isArray(m) ? m : [m]) { x.transparent = xray; x.opacity = xray ? 0.25 : 1; x.needsUpdate = true }
    })
    if (xray) {
      const sk = new THREE.SkeletonHelper(scene); helpers.push(sk); scene.parent?.add(sk)
      if (joint) {
        const re = /joelho|knee/i.test(joint) ? /knee|joelho/i : /tornozelo|ankle/i.test(joint) ? /ankle|tornozelo|foot/i : /hip|quadril|thigh|upleg/i
        const bone = scene.getObjectByProperty('isBone', true) && (() => { let f: THREE.Object3D | undefined; scene.traverse((o) => { if (!f && (o as THREE.Bone).isBone && re.test(o.name)) f = o }); return f })()
        if (bone) { const dot = new THREE.Mesh(new THREE.SphereGeometry(0.07, 12, 8), new THREE.MeshBasicMaterial({ color: '#ff2d2d', depthTest: false })); bone.add(dot); helpers.push(dot) }
      }
    }
    return () => { helpers.forEach((h) => h.parent?.remove(h)) }
  }, [xray, joint, scene])
  useEffect(() => { (window as unknown as { __glbScene?: THREE.Object3D }).__glbScene = scene }, [scene])
  return <primitive object={scene} />
}

function Fallback({ image, video, title, note }: { image?: string | null; video?: string | null; title: string; note?: string }) {
  return <div className="grid h-full w-full place-items-center bg-[#0b0b0b] p-4 text-center">
    {video ? <video src={video} autoPlay loop muted playsInline className="max-h-full max-w-full rounded-xl" />
      : image ? <img src={image} alt={title} className="max-h-full max-w-full rounded-xl object-contain" />
      : <div className="text-zinc-500"><div className="mx-auto mb-2 h-14 w-14 rounded-full border-2 border-dashed border-zinc-600" /><p className="font-display text-xl uppercase text-zinc-300">{title}</p><p className="text-xs">{note ?? 'Animação 3D em produção'}</p></div>}
  </div>
}

export default function Viewer3D(p: ViewerProps) {
  const [playing, setPlaying] = useState(true)
  const [speed, setSpeed] = useState(1)
  const [xray, setXray] = useState(false)
  const [view, setView] = useState({ angle: p.angle && ANGLES[p.angle] ? p.angle : 'lateral', zoom: false, n: 0 })
  const controls = useRef<{ target: THREE.Vector3; update: () => void } | null>(null)
  const api = useRef<MannequinApi | null>(null)
  const hasModel = !!p.src
  useEffect(() => { (window as unknown as { __joint?: string }).__joint = p.joint ?? 'joelho' }, [p.joint])
  useEffect(() => { setView((v) => ({ ...v, angle: p.angle && ANGLES[p.angle] ? p.angle : v.angle, n: v.n + 1 })) }, [p.angle, p.src])

  const fallback = <Fallback image={p.image} video={p.video} title={p.title} />
  const h = p.height ?? (p.compact ? 240 : 320)
  const joint = p.joint
  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-[#0b0b0b]">
      <div style={{ height: h }} className="relative" data-testid="viewer">
        {!webglOk ? fallback : (
          <Boundary fallback={fallback}>
            <Canvas frameloop="demand" dpr={[1, 1.5]} camera={{ fov: 40, position: [3, 1.5, 0] }} gl={{ antialias: false, powerPreference: 'low-power' }} style={{ touchAction: 'none' }}>
              <color attach="background" args={['#070707']} />
              <hemisphereLight args={['#ffffff', '#222222', 0.9]} />
              <directionalLight position={[3, 5, 2]} intensity={1.4} />
              <Suspense fallback={null}>
                <Floor circuit={p.circuit} />
                {hasModel ? <GlbModel url={p.src!} mode={p.mode} level={p.level} playing={playing} speed={speed} xray={xray} joint={joint} />
                  : <Mannequin motion={p.motion} playing={playing} speed={speed} err={p.mode === 'erro'} xray={xray || p.mode === 'erro'} joint={p.mode === 'erro' ? (joint ?? 'joelho') : joint} api={api} />}
              </Suspense>
              <OrbitControls ref={controls as never} makeDefault enablePan={false} minDistance={0.8} maxDistance={7} target={[0, 0.9, 0]} maxPolarAngle={Math.PI / 2 + 0.2} />
              <Rig view={view} controls={controls} api={api} />
              <Ticker playing={playing} />
            </Canvas>
            {!hasModel && <span className="pointer-events-none absolute left-2 top-2 rounded bg-black/70 px-2 py-1 text-[10px] font-bold uppercase text-zinc-400">Pré-visualização · manequim provisório</span>}
            {p.mode === 'erro' && <span className="pointer-events-none absolute right-2 top-2 rounded bg-danger px-2 py-1 text-xs font-extrabold uppercase text-black">Erro de iniciante</span>}
          </Boundary>
        )}
      </div>
      {webglOk && !p.compact && (
        <div className="space-y-2 border-t border-line bg-panel p-3">
          <div className="flex flex-wrap gap-2">
            <button onClick={() => setPlaying((x) => !x)} className="btn btn-primary btn-sm !min-w-[96px]" aria-label={playing ? 'Pausar' : 'Tocar'}>{playing ? '❚❚ Pausar' : '▶ Tocar'}</button>
            {[1, 0.5, 0.25].map((s) => <button key={s} onClick={() => setSpeed(s)} className={`btn btn-sm ${speed === s ? 'btn-primary' : 'btn-ghost'}`}>{s === 1 ? '1x' : s === 0.5 ? '0,5x' : '0,25x'}</button>)}
          </div>
          <div className="flex flex-wrap gap-2">
            {Object.keys(ANGLES).map((a) => <button key={a} onClick={() => setView({ angle: a, zoom: false, n: view.n + 1 })} className={`chip !min-h-[40px] !px-3 ${view.angle === a && !view.zoom ? 'chip-on' : ''}`}>{ANGLE_LABEL[a]}</button>)}
            {joint && <button onClick={() => setView({ ...view, zoom: !view.zoom, n: view.n + 1 })} className={`chip !min-h-[40px] !px-3 ${view.zoom ? 'chip-on' : ''}`}>Zoom: {joint}</button>}
            {joint && <button onClick={() => setXray((x) => !x)} className={`chip !min-h-[40px] !px-3 ${xray ? 'chip-on' : ''}`}>Raio-X</button>}
          </div>
          <p className="text-xs text-zinc-500">Arraste para girar · pinça para zoom · Raio-X só ensina a técnica, não é diagnóstico.</p>
        </div>
      )}
    </div>
  )
}
