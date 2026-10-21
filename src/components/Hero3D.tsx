import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { useRef } from 'react'
import { Mannequin, type MannequinApi } from './Mannequin'

/** Boneco 3D em loop sobre o fundo da entrada (transparente, gira devagar). */
export default function Hero3D({ motion = 'jump' }: { motion?: string }) {
  const api = useRef<MannequinApi | null>(null)
  return (
    <Canvas dpr={[1, 1.5]} camera={{ fov: 38, position: [3.2, 1.5, 4.4] }} gl={{ alpha: true, antialias: true, powerPreference: 'low-power' }} style={{ touchAction: 'pan-y' }}>
      <hemisphereLight args={['#dfe6ff', '#301818', 0.9]} />
      <directionalLight position={[3, 5, 2]} intensity={1.7} />
      <directionalLight position={[-3, 2, -3]} intensity={1.1} color="#ff5a4a" />
      <Mannequin motion={motion} playing speed={1} err={false} xray={false} api={api} />
      <mesh rotation-x={-Math.PI / 2} position-y={0.001}><circleGeometry args={[0.8, 32]} /><meshBasicMaterial color="#000" transparent opacity={0.35} /></mesh>
      <OrbitControls enablePan={false} enableZoom={false} autoRotate autoRotateSpeed={1.4} target={[0, 0.8, 0]} minPolarAngle={1.2} maxPolarAngle={1.6} />
    </Canvas>
  )
}
