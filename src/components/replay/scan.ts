import * as THREE from 'three'
import { clone as cloneSkinned } from 'three/examples/jsm/utils/SkeletonUtils.js'

const VERT = /* glsl */ `
  uniform float uSize; uniform float uScale; uniform float uTime;
  varying float vShade; varying float vH;
  #include <common>
  #include <skinning_pars_vertex>
  float hash(vec3 p) { return fract(sin(dot(p, vec3(12.9898, 78.233, 37.719))) * 43758.5453); }
  void main() {
    #include <skinbase_vertex>
    #include <begin_vertex>
    #include <skinning_vertex>
    vec4 mv = modelViewMatrix * vec4(transformed, 1.0);
    gl_Position = projectionMatrix * mv;
    float h = hash(position * 91.0);
    vH = clamp(position.y / 1.8, 0.0, 1.0);
    vShade = 0.45 + 0.55 * h;
    gl_PointSize = max(1.2, uSize * (0.7 + 0.6 * h) * uScale / max(0.5, -mv.z));
  }`
const FRAG = /* glsl */ `
  uniform vec3 uColor; uniform float uAlpha;
  varying float vShade; varying float vH;
  void main() {
    vec2 c = gl_PointCoord - 0.5; float d = length(c);
    if (d > 0.5) discard;
    float a = smoothstep(0.5, 0.05, d) * uAlpha * vShade;
    vec3 col = mix(uColor * 0.7, vec3(1.0), vH * 0.25);
    gl_FragColor = vec4(col, a);
  }`

export interface ScanFigure { root: THREE.Object3D; bones: Record<string, THREE.Bone>; mat: THREE.ShaderMaterial }

/**
 * Transforma o modelo rigado numa "nuvem de pontos" animada: cada vértice vira um ponto.
 * O SkinnedMesh é desenhado como GL_POINTS (isPoints) para manter a skinning na GPU.
 */
export function createScanFigure(gltfScene: THREE.Object3D, color: string, opts: { step?: number; jointsStep?: number; size?: number } = {}): ScanFigure {
  const root = cloneSkinned(gltfScene) as THREE.Object3D
  const bones: Record<string, THREE.Bone> = {}
  root.traverse((o) => { if ((o as THREE.Bone).isBone) bones[o.name.replace(/^mixamorig:?/, '')] = o as THREE.Bone })
  const mat = new THREE.ShaderMaterial({
    vertexShader: VERT, fragmentShader: FRAG, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: { uSize: { value: opts.size ?? 0.034 }, uScale: { value: 700 }, uTime: { value: 0 }, uColor: { value: new THREE.Color(color) }, uAlpha: { value: 0.85 } },
  })
  const meshes: THREE.SkinnedMesh[] = []
  root.traverse((o) => { if ((o as THREE.SkinnedMesh).isSkinnedMesh) meshes.push(o as THREE.SkinnedMesh) })
  for (const m of meshes) {
    const surface = /001|Surface/.test(m.name), step = surface ? (opts.step ?? 3) : (opts.jointsStep ?? 5)
    const src = m.geometry, n = Math.ceil(src.getAttribute('position').count / step), geo = new THREE.BufferGeometry()
    for (const name of ['position', 'skinIndex', 'skinWeight'] as const) {
      const a = src.getAttribute(name), arr = new (a.array.constructor as new (n: number) => ArrayLike<number> & { [i: number]: number })(n * a.itemSize)
      for (let i = 0; i < n; i++) for (let c = 0; c < a.itemSize; c++) arr[i * a.itemSize + c] = a.array[i * step * a.itemSize + c]
      geo.setAttribute(name, new THREE.BufferAttribute(arr as never, a.itemSize))
    }
    const pts = new THREE.SkinnedMesh(geo, mat)
    Object.assign(pts, { isMesh: false, isPoints: true })
    pts.frustumCulled = false
    pts.bind(m.skeleton, m.bindMatrix)
    m.parent?.add(pts); m.visible = false
  }
  return { root, bones, mat }
}
