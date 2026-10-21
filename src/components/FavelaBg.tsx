import { useMemo } from 'react'

// PRNG determinístico para a ilustração ser sempre igual
const rng = (seed: number) => () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296)
const WALLS = ['#e8c9b0', '#d98c6a', '#c96f55', '#f0e6dc', '#e3b89a', '#cf8f78', '#b9c7d6', '#e9d2a6', '#d4a38c']
const ROOFS = ['#6b6f78', '#8a8d94', '#5a5d66', '#9a6a55']

/** Ilustração original de favela vista do alto: morro com casas empilhadas e um campinho de grama no pé do morro. */
export default function FavelaBg({ className = '' }: { className?: string }) {
  const houses = useMemo(() => {
    const r = rng(7), out: { x: number; y: number; w: number; h: number; wall: string; roof: string; win: number }[] = []
    // fileiras do fundo (alto, menores) para a frente (baixo, maiores)
    for (let row = 0; row < 11; row++) {
      const y = 70 + row * 26, scale = 0.55 + row * 0.1
      for (let x = -20; x < 420; x += 18 * scale + r() * 6) {
        const w = (16 + r() * 14) * scale, h = (14 + r() * 22) * scale
        out.push({ x: x + (row % 2) * 6, y: y - h + r() * 8, w, h, wall: WALLS[Math.floor(r() * WALLS.length)], roof: ROOFS[Math.floor(r() * ROOFS.length)], win: Math.floor(r() * 3) })
      }
    }
    return out
  }, [])
  return (
    <svg viewBox="0 0 400 420" preserveAspectRatio="xMidYMid slice" className={className} aria-hidden="true">
      <defs>
        <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#6f8fb5" /><stop offset="1" stopColor="#f2c9a0" /></linearGradient>
        <linearGradient id="grass" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#2f8f3a" /><stop offset="1" stopColor="#1d6a2a" /></linearGradient>
      </defs>
      <rect width="400" height="420" fill="url(#sky)" />
      <path d="M0 70 Q60 40 120 62 T260 50 T400 66 V120 H0Z" fill="#4f7a58" opacity=".85" />
      <path d="M0 90 Q90 60 180 84 T400 80 V140 H0Z" fill="#3c6b4a" />
      {houses.map((h, i) => <g key={i}>
        <rect x={h.x} y={h.y} width={h.w} height={h.h} fill={h.wall} />
        <rect x={h.x - 1} y={h.y - 2.5} width={h.w + 2} height="3.5" fill={h.roof} />
        {h.win > 0 && <rect x={h.x + h.w * 0.2} y={h.y + h.h * 0.3} width={h.w * 0.2} height={h.h * 0.22} fill="#2b3a4a" opacity=".7" />}
        {h.win > 1 && <rect x={h.x + h.w * 0.58} y={h.y + h.h * 0.3} width={h.w * 0.2} height={h.h * 0.22} fill="#2b3a4a" opacity=".7" />}
      </g>)}
      {/* campinho no pé do morro */}
      <path d="M-10 330 L410 318 V420 H-10Z" fill="url(#grass)" />
      <g fill="none" stroke="#e9f5e9" strokeWidth="1.4" opacity=".85"><path d="M-10 330 L410 318" /><path d="M200 324 L210 420" /><ellipse cx="205" cy="372" rx="46" ry="17" /><path d="M-10 350 L60 350 L70 420" /></g>
      <rect y="300" width="400" height="30" fill="#000" opacity=".12" />
    </svg>
  )
}
