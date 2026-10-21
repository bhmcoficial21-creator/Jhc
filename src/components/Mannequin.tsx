import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { PERIOD, poseAt } from './pose'

const BODY = '#8a959a', SHIRT = '#8a959a', SHORTS = '#e2453b', BOOT = '#1b1b1b'
const mat = (c: string, r = 0.45, m = 0.12) => new THREE.MeshStandardMaterial({ color: c, roughness: r, metalness: m })

export interface MannequinApi { joint: (name: string) => THREE.Object3D | null }

/** Boneco original, cinza escuro, sem rosto, uniforme e chuteira sem marca. */
export function Mannequin({ motion, playing, speed, err, xray, joint, api }: { motion?: string | null; playing: boolean; speed: number; err: boolean; xray: boolean; joint?: string | null; api: { current: MannequinApi | null } }) {
  const R = useRef<Record<string, THREE.Group>>({})
  const time = useRef(0)
  const materials = useMemo(() => ({ body: mat(BODY), shirt: mat(SHIRT), shorts: mat(SHORTS, 0.35, 0.05), boot: mat(BOOT, 0.6, 0.1) }), [])
  const reg = (k: string) => (g: THREE.Group | null) => { if (g) R.current[k] = g }

  useEffect(() => {
    api.current = {
      joint: (name) => {
        const n = name.toLowerCase()
        if (/joelho|knee/.test(n)) return R.current.kneeL ?? null
        if (/tornozelo|ankle/.test(n)) return R.current.ankleL ?? null
        if (/quadril|hip/.test(n)) return R.current.hipL ?? null
        return R.current.pelvis ?? null
      },
    }
  }, [api])
  useEffect(() => {
    for (const m of Object.values(materials)) { m.transparent = xray; m.opacity = xray ? 0.35 : 1; m.wireframe = false; m.needsUpdate = true }
  }, [xray, materials])

  useFrame((_, dt) => {
    if (playing) time.current += dt * speed
    const p = poseAt(motion, time.current, err), r = R.current
    if (!r.root) return
    r.root.position.set(p.rootX, 0.95 + p.rootY, p.rootZ)
    r.root.rotation.set(p.rotX, p.rotY, p.rotZ)
    r.torso.rotation.x = p.lean
    r.hipL.rotation.set(p.hipL, 0, -p.valgus + p.hipAbL); r.hipR.rotation.set(p.hipR, 0, p.valgus - p.hipAbR)
    r.kneeL.rotation.x = p.kneeL; r.kneeR.rotation.x = p.kneeR
    r.shL.rotation.x = p.shL; r.shR.rotation.x = p.shR; r.elL.rotation.x = -p.elL; r.elR.rotation.x = -p.elR
  })
  void PERIOD

  const cap = (rad: number, len: number, m: THREE.Material, y = 0) => <mesh position={[0, y, 0]} material={m}><capsuleGeometry args={[rad, len, 6, 14]} /></mesh>
  const ball = (r: number, m: THREE.Material, pos: [number, number, number], sc: [number, number, number] = [1, 1, 1]) => <mesh position={pos} scale={sc} material={m}><sphereGeometry args={[r, 18, 14]} /></mesh>
  const leg = (side: 1 | -1) => {
    const k = side === 1 ? 'L' : 'R'
    return <group ref={reg('hip' + k)} position={[0.11 * side, 0, 0]}>
      {cap(0.092, 0.26, materials.shorts, -0.2)}
      <group ref={reg('knee' + k)} position={[0, -0.45, 0]}>
        {ball(0.062, materials.body, [0, 0, 0])}
        {cap(0.065, 0.24, materials.body, -0.22)}
        {ball(0.07, materials.body, [0, -0.15, -0.025], [1, 1.4, 1])}
        <group ref={reg('ankle' + k)} position={[0, -0.45, 0]}>
          <mesh position={[0, -0.03, 0.07]} material={materials.boot}><boxGeometry args={[0.1, 0.07, 0.27]} /></mesh>
        </group>
      </group>
      {xray && <XrayBone len={0.45} />}
    </group>
  }
  const arm = (side: 1 | -1) => {
    const k = side === 1 ? 'L' : 'R'
    return <group ref={reg('sh' + k)} position={[0.25 * side, 0.54, 0]}>
      {ball(0.085, materials.body, [0, 0, 0])}
      {cap(0.058, 0.18, materials.body, -0.16)}
      <group ref={reg('el' + k)} position={[0, -0.3, 0]}>{cap(0.05, 0.17, materials.body, -0.15)}{ball(0.05, materials.body, [0, -0.32, 0])}</group>
    </group>
  }
  return (
    <group ref={reg('root')}>
      <group ref={reg('pelvis')}>
        <mesh material={materials.shorts}><boxGeometry args={[0.34, 0.2, 0.21]} /></mesh>
        {leg(1)}{leg(-1)}
        <group ref={reg('torso')} position={[0, 0.08, 0]}>
          {/* tronco em V: abdômen fino, peito e ombros largos */}
          <mesh position={[0, 0.16, 0]} material={materials.body}><cylinderGeometry args={[0.2, 0.15, 0.3, 18]} /></mesh>
          {ball(0.2, materials.body, [0, 0.42, 0.01], [1.2, 0.85, 0.75])}
          {ball(0.1, materials.body, [0.1, 0.42, 0.08], [1, 0.8, 0.6])}{ball(0.1, materials.body, [-0.1, 0.42, 0.08], [1, 0.8, 0.6])}
          <mesh position={[0, 0.62, 0]} material={materials.body}><cylinderGeometry args={[0.05, 0.06, 0.1, 10]} /></mesh>
          {ball(0.105, materials.body, [0, 0.74, 0.01], [0.9, 1.1, 1])}
          {arm(1)}{arm(-1)}
        </group>
      </group>
      {xray && joint && <JointDot r={R} joint={joint} />}
    </group>
  )
}

function XrayBone({ len }: { len: number }) {
  return <mesh position={[0, -len / 2, 0]}><cylinderGeometry args={[0.012, 0.012, len, 6]} /><meshBasicMaterial color="#e8e8e8" /></mesh>
}
/** Esfera vermelha na articulação em foco (somente para ensinar a técnica — sem diagnóstico). */
function JointDot({ r, joint }: { r: React.MutableRefObject<Record<string, THREE.Group>>; joint: string }) {
  const ref = useRef<THREE.Mesh>(null)
  useFrame(() => {
    const n = joint.toLowerCase(), g = /joelho|knee/.test(n) ? r.current.kneeL : /tornozelo|ankle/.test(n) ? r.current.ankleL : r.current.hipL
    if (g && ref.current) { const v = new THREE.Vector3(); g.getWorldPosition(v); ref.current.position.copy(v); ref.current.parent?.worldToLocal(ref.current.position) }
  })
  return <mesh ref={ref}><sphereGeometry args={[0.07, 16, 12]} /><meshBasicMaterial color="#ff2d2d" depthTest={false} transparent opacity={0.9} /></mesh>
}
