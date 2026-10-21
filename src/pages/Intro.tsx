import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import FavelaBg from '../components/FavelaBg'
import { useAuth } from '../lib/auth'
import { seedDemoProfile } from '../lib/demo'
import { DEMO } from '../lib/supabase'

/** Entrada cinematográfica: celular em cima da trave, no campinho da favela à noite; a câmera entra na tela e abre o app. */
export default function Intro() {
  const nav = useNavigate(), { user, signIn } = useAuth()
  const done = useRef(false)
  const finish = async () => {
    if (done.current) return
    done.current = true
    if (DEMO) { seedDemoProfile(); if (!user) await signIn('demo@varzea.pro'); nav('/app', { replace: true }) }
    else nav(user ? '/app' : '/', { replace: true })
  }
  useEffect(() => { const t = setTimeout(finish, 7500); return () => clearTimeout(t) /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [])

  return (
    <div className="fixed inset-0 overflow-hidden bg-black" onClick={finish} role="button" aria-label="Pular abertura">
      <div className="intro-scene absolute inset-0" style={{ transformOrigin: '50% 53%' }} onAnimationEnd={finish}>
        <FavelaBg night className="absolute inset-0 h-full w-full scale-110 blur-[1.5px]" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/20 to-black/70" />
        {/* refletores desfocados */}
        {[[12, 9], [34, 5], [62, 7], [86, 10], [48, 12]].map(([x, y], i) => <span key={i} className="absolute rounded-full" style={{ left: `${x}%`, top: `${y}%`, width: 46, height: 46, background: 'radial-gradient(circle, rgba(190,215,255,.95), rgba(120,160,255,.0) 70%)' }} />)}

        {/* trave: poste, travessão e rede */}
        <svg className="absolute inset-x-0 bottom-0 h-[44%] w-full" viewBox="0 0 400 370" preserveAspectRatio="none" aria-hidden="true">
          <defs>
            <linearGradient id="bar" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#f4f6f8" /><stop offset=".45" stopColor="#c5c9ce" /><stop offset="1" stopColor="#5b5f66" /></linearGradient>
            <pattern id="net" width="14" height="14" patternUnits="userSpaceOnUse" patternTransform="rotate(18)"><path d="M0 0H14M0 0V14" stroke="#cfd3d8" strokeOpacity=".55" strokeWidth=".8" fill="none" /></pattern>
            <linearGradient id="fade" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#000" stopOpacity="0" /><stop offset="1" stopColor="#000" stopOpacity=".85" /></linearGradient>
          </defs>
          <rect x="0" y="60" width="400" height="310" fill="url(#net)" />
          <rect x="0" y="60" width="400" height="310" fill="url(#fade)" />
          <rect x="-10" y="0" width="420" height="60" rx="30" fill="url(#bar)" />
          <rect x="-10" y="8" width="420" height="10" rx="5" fill="#fff" opacity=".55" />
        </svg>

        {/* celular em pé sobre o travessão */}
        <div className="absolute left-1/2 -translate-x-1/2" style={{ bottom: '41%', width: '23%' }}>
          <div className="relative aspect-[9/19.3] w-full rounded-[18%/8.5%] bg-[#15171a] p-[3.2%] shadow-[0_0_40px_rgba(198,255,0,.25),0_14px_30px_rgba(0,0,0,.7)] ring-1 ring-zinc-500/60">
            <div className="relative h-full w-full overflow-hidden rounded-[15%/7%] bg-black">
              <div className="absolute left-1/2 top-[2.5%] h-[3.2%] w-[28%] -translate-x-1/2 rounded-full bg-black ring-1 ring-zinc-800" />
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-[6%] bg-[radial-gradient(circle_at_50%_40%,#1b2a00,#000_70%)] text-center">
                <svg viewBox="0 0 512 512" className="w-[46%]"><path d="M96 150h92l68 170 68-170h92L296 400h-80z" fill="#c6ff00" /></svg>
                <div className="font-display text-[clamp(10px,3.4vw,18px)] font-extrabold uppercase leading-none tracking-tight text-white">VÁRZEA<span className="text-lime"> PRO</span></div>
                <div className="px-[10%] text-[clamp(4px,1.3vw,7px)] uppercase leading-tight tracking-wider text-zinc-400">explosão · agilidade · jogo</div>
              </div>
              <div className="absolute inset-0 bg-gradient-to-br from-white/15 via-transparent to-transparent" />
            </div>
          </div>
        </div>
      </div>
      {/* flash lima na hora de entrar no app */}
      <div className="intro-flash pointer-events-none absolute inset-0" />
      <button onClick={(e) => { e.stopPropagation(); finish() }} className="absolute right-4 top-4 rounded-full border border-white/25 bg-black/40 px-4 py-2 text-sm font-semibold text-white backdrop-blur">Pular ▸</button>
      <div className="intro-title pointer-events-none absolute inset-x-0 top-[10%] text-center font-display text-5xl font-extrabold uppercase leading-none text-white drop-shadow-lg">Bem-vindo à <span className="text-lime">quebrada</span></div>
    </div>
  )
}
