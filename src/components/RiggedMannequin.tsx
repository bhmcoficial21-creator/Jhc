import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import { clone as cloneSkinned } from 'three/examples/jsm/utils/SkeletonUtils.js'
import type { MannequinApi } from './Mannequin'
import { poseAt } from './pose'

const BASE_URL_GLB = `${import.meta.env.BASE_URL}models/xbot.glb`
// Na demo publicada o .glb vai embutido em base64 num .json (a plataforma só serve tipos de texto/mídia).
let blobUrl: string | undefined, pending: Promise<void> | undefined
function modelUrl(): string {
  if (import.meta.env.VITE_DEMO !== 'true') return BASE_URL_GLB
  if (blobUrl) return blobUrl
  pending ??= fetch(`${import.meta.env.BASE_URL}models/xbot.json`).then((r) => r.json()).then((j: { b64: string }) => {
    const bin = atob(j.b64), bytes = new Uint8Array(bin.length)
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
    blobUrl = URL.createObjectURL(new Blob([bytes], { type: 'model/gltf-binary' }))
  })
  throw pending
}
const qx = (a: number) => new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), a)
const qy = (a: number) => new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), a)
const qz = (a: number) => new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), a)
const mul = (...q: THREE.Quaternion[]) => q.reduce((a, b) => a.multiply(b))

/** Modelo humano rigado (cinza-escuro, short vermelho) movido pelas mesmas poses do manequim procedural. */
export function RiggedMannequin({ motion, playing, speed, err, xray, joint, api }: { motion?: string | null; playing: boolean; speed: number; err: boolean; xray: boolean; joint?: string | null; api: { current: MannequinApi | null } }) {
  const gltf = useGLTF(modelUrl())
  const { scene, bones, mats } = useMemo(() => {
    const sc = cloneSkinned(gltf.scene) as THREE.Group
    const b: Record<string, THREE.Bone> = {}
    sc.traverse((o) => { if ((o as THREE.Bone).isBone) b[o.name.replace(/^mixamorig:?/, '')] = o as THREE.Bone })
    const m: THREE.MeshStandardMaterial[] = []
    sc.traverse((o) => {
      const mesh = o as THREE.SkinnedMesh
      if (!mesh.isSkinnedMesh) return
      mesh.frustumCulled = false
      const geo = mesh.geometry.clone(); mesh.geometry = geo
      const pos = geo.getAttribute('position'), col = new Float32Array(pos.count * 3)
      const base = new THREE.Color(mesh.name.includes('001') || /Surface/.test(mesh.name) ? '#6d777b' : '#2a2f31'), red = new THREE.Color('#e2453b')
      for (let i = 0; i < pos.count; i++) {
        const y = pos.getY(i), shorts = /Surface/.test(mesh.name) || mesh.name.includes('001') ? y > 0.7 && y < 1.07 : false
        const c = shorts ? red : base; col.set([c.r, c.g, c.b], i * 3)
      }
      geo.setAttribute('color', new THREE.BufferAttribute(col, 3))
      const mat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.42, metalness: 0.18 })
      mesh.material = mat; m.push(mat)
    })
    return { scene: sc, bones: b, mats: m }
  }, [gltf.scene])
  const rest = useMemo(() => ({ hipsY: bones.Hips?.position.y ?? 104, hipsX: bones.Hips?.position.x ?? 0, hipsZ: bones.Hips?.position.z ?? 0 }), [bones])
  const time = useRef(0)
  const helper = useRef<THREE.SkeletonHelper | null>(null)

  useEffect(() => { for (const m of mats) { m.transparent = xray; m.opacity = xray ? 0.3 : 1; m.needsUpdate = true } }, [xray, mats])
  useEffect(() => {
    if (!xray) return
    const h = new THREE.SkeletonHelper(scene); helper.current = h; scene.parent?.add(h)
    return () => { h.parent?.remove(h) }
  }, [xray, scene])
  useEffect(() => {
    api.current = { joint: (n) => (/joelho|knee/i.test(n) ? bones.LeftLeg : /tornozelo|ankle/i.test(n) ? bones.LeftFoot : bones.LeftUpLeg) ?? null }
  }, [api, bones])
  useEffect(() => {
    if (!xray || !joint) return
    const b = /joelho|knee/i.test(joint) ? bones.LeftLeg : /tornozelo|ankle/i.test(joint) ? bones.LeftFoot : bones.LeftUpLeg
    if (!b) return
    const dot = new THREE.Mesh(new THREE.SphereGeometry(7, 14, 10), new THREE.MeshBasicMaterial({ color: '#ff2d2d', depthTest: false, transparent: true, opacity: 0.95 }))
    dot.renderOrder = 10; b.add(dot); return () => { b.remove(dot) }
  }, [xray, joint, bones])

  useFrame((_, dt) => {
    if (playing) time.current += dt * speed
    const p = poseAt(motion, time.current, err), B = bones
    if (!B.Hips) return
    B.Hips.position.set(rest.hipsX + p.rootX * 100, rest.hipsY + p.rootY * 100, rest.hipsZ + p.rootZ * 100)
    B.Hips.quaternion.copy(mul(qy(p.rotY), qz(p.rotZ), qx(p.rotX)))
    const spine = p.lean / 3
    for (const k of ['Spine', 'Spine1', 'Spine2'] as const) B[k]?.quaternion.copy(qx(spine))
    B.LeftUpLeg?.quaternion.copy(mul(qz(-p.valgus + p.hipAbL), qx(p.hipL)))
    B.RightUpLeg?.quaternion.copy(mul(qz(p.valgus - p.hipAbR), qx(p.hipR)))
    B.LeftLeg?.quaternion.copy(qx(p.kneeL)); B.RightLeg?.quaternion.copy(qx(p.kneeR))
    B.LeftFoot?.quaternion.copy(qx(-p.kneeL * 0.25 - p.hipL * 0.15)); B.RightFoot?.quaternion.copy(qx(-p.kneeR * 0.25 - p.hipR * 0.15))
    // braços: do T-pose para baixo (±90° em Z) e depois balanço para frente/trás em X
    B.LeftArm?.quaternion.copy(mul(qx(p.shL), qz(-Math.PI / 2 + 0.12))); B.RightArm?.quaternion.copy(mul(qx(p.shR), qz(Math.PI / 2 - 0.12)))
    B.LeftForeArm?.quaternion.copy(qy(-p.elL)); B.RightForeArm?.quaternion.copy(qy(p.elR))
  })
  return <primitive object={scene} />
}
