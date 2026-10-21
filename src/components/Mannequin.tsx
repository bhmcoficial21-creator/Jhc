import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { PERIOD, poseAt } from './pose'

const BODY = '#7a7a7a', SHIRT = '#9a9a9a', SHORTS = '#4a4a4a', BOOT = '#c6ff00'
const mat = (c: string) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.7, metalness: 0.05 })

export interface MannequinApi { joint: (name: string) => THREE.Object3D | null }

/** Boneco original, cinza escuro, sem rosto, uniforme e chuteira sem marca. */
export function Mannequin({ motion, playing, speed, err, xray, joint, api }: { motion?: string | null; playing: boolean; speed: number; err: boolean; xray: boolean; joint?: string | null; api: { current: MannequinApi | null } }) {
  const R = useRef<Record<string, THREE.Group>>({})
  const time = useRef(0)
  const materials = useMemo(() => ({ body: mat(BODY), shirt: mat(SHIRT), shorts: mat(SHORTS), boot: mat(BOOT) }), [])
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

  const cap = (rad: number, len: number, m: THREE.Material, y = 0) => <mesh position={[0, y, 0]} material={m}><capsuleGeometry args={[rad, len, 4, 10]} /></mesh>
  const leg = (side: 1 | -1) => {
    const k = side === 1 ? 'L' : 'R'
    return <group ref={reg('hip' + k)} position={[0.1 * side, 0, 0]}>
      {cap(0.075, 0.3, materials.shorts, -0.22)}
      <group ref={reg('knee' + k)} position={[0, -0.45, 0]}>
        {cap(0.058, 0.3, materials.body, -0.22)}
        <group ref={reg('ankle' + k)} position={[0, -0.45, 0]}>
          <mesh position={[0, -0.03, 0.07]} material={materials.boot}><boxGeometry args={[0.1, 0.07, 0.26]} /></mesh>
        </group>
      </group>
      {xray && <XrayBone len={0.45} />}
    </group>
  }
  const arm = (side: 1 | -1) => {
    const k = side === 1 ? 'L' : 'R'
    return <group ref={reg('sh' + k)} position={[0.21 * side, 0.52, 0]}>
      {cap(0.045, 0.2, materials.shirt, -0.16)}
      <group ref={reg('el' + k)} position={[0, -0.3, 0]}>{cap(0.04, 0.2, materials.body, -0.15)}</group>
    </group>
  }
  return (
    <group ref={reg('root')}>
      <group ref={reg('pelvis')}>
        <mesh material={materials.shorts}><boxGeometry args={[0.3, 0.16, 0.18]} /></mesh>
        {leg(1)}{leg(-1)}
        <group ref={reg('torso')} position={[0, 0.08, 0]}>
          <mesh position={[0, 0.3, 0]} material={materials.shirt}><boxGeometry args={[0.36, 0.52, 0.2]} /></mesh>
          <mesh position={[0, 0.7, 0]} material={materials.body}><sphereGeometry args={[0.11, 16, 12]} /></mesh>
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
