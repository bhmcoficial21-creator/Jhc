import { useEffect, useRef, useState, type ButtonHTMLAttributes, type ReactNode } from 'react'
import { Link } from 'react-router-dom'

export function Btn({ variant = 'primary', small, className = '', ...p }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'ghost' | 'danger'; small?: boolean }) {
  return <button {...p} className={`btn btn-${variant} ${small ? 'btn-sm' : ''} ${className}`} />
}
export const LinkBtn = ({ to, variant = 'primary', children, className = '', small }: { to: string; variant?: 'primary' | 'ghost'; children: ReactNode; className?: string; small?: boolean }) =>
  <Link to={to} className={`btn btn-${variant} ${small ? 'btn-sm' : ''} ${className}`}>{children}</Link>
export const ExtLink = ({ href, variant = 'primary', children, className = '' }: { href: string; variant?: 'primary' | 'ghost'; children: ReactNode; className?: string }) =>
  <a href={href || '#'} target="_blank" rel="noopener noreferrer" className={`btn btn-${variant} ${className}`}>{children}</a>

export const Card = ({ children, className = '' }: { children: ReactNode; className?: string }) => <div className={`card ${className}`}>{children}</div>
export const Chip = ({ children, on, className = '' }: { children: ReactNode; on?: boolean; className?: string }) => <span className={`chip ${on ? 'chip-on' : ''} ${className}`}>{children}</span>
export const Spinner = ({ label }: { label?: string }) => <div className="flex flex-col items-center justify-center gap-3 py-16 text-zinc-400"><div className="h-9 w-9 animate-spin rounded-full border-4 border-line border-t-lime" />{label && <span>{label}</span>}</div>
export const Notice = ({ tone = 'warn', children }: { tone?: 'warn' | 'danger' | 'info'; children: ReactNode }) =>
  <div className={`rounded-xl border px-4 py-3 text-sm ${tone === 'danger' ? 'border-danger/60 bg-danger/10 text-red-200' : tone === 'info' ? 'border-lime/40 bg-lime/5 text-zinc-200' : 'border-warn/50 bg-warn/10 text-amber-100'}`}>{children}</div>
export const Lock = ({ className = '' }: { className?: string }) => <svg className={`inline h-4 w-4 ${className}`} viewBox="0 0 24 24" fill="currentColor"><path d="M17 9h-1V7a4 4 0 0 0-8 0v2H7a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-8a2 2 0 0 0-2-2Zm-7-2a2 2 0 0 1 4 0v2h-4Z" /></svg>

export function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return <div className="space-y-1.5"><label>{label}</label>{children}{hint && <p className="muted">{hint}</p>}</div>
}

export function Chips<T extends string>({ options, value, onChange, multi }: { options: { v: T; l: string }[]; value: T[] | T | null; onChange: (v: T) => void; multi?: boolean }) {
  const on = (v: T) => (multi ? (value as T[] | null)?.includes(v) : value === v)
  return <div className="flex flex-wrap gap-2">{options.map((o) => (
    <button key={o.v} type="button" onClick={() => onChange(o.v)} className={`min-h-[48px] rounded-xl border px-4 text-base font-semibold ${on(o.v) ? 'border-lime bg-lime text-black' : 'border-line bg-panel2 text-zinc-200'}`}>{o.l}</button>
  ))}</div>
}

export function Modal({ children, onClose, title }: { children: ReactNode; onClose: () => void; title?: string }) {
  return <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 sm:items-center" onClick={onClose}>
    <div className="max-h-[90vh] w-full max-w-xl overflow-auto rounded-t-3xl border border-line bg-panel p-5 sm:rounded-3xl" onClick={(e) => e.stopPropagation()}>
      {title && <h3 className="mb-3 text-2xl">{title}</h3>}{children}
    </div></div>
}

/** Contagem regressiva baseada em relógio (não atrasa com a tela bloqueada). */
export function useCountdown(secs: number, running: boolean, onDone?: () => void) {
  const [left, setLeft] = useState(secs)
  const end = useRef<number>(0), done = useRef(onDone)
  done.current = onDone
  useEffect(() => { setLeft(secs) }, [secs])
  useEffect(() => {
    if (!running) return
    end.current = Date.now() + left * 1000
    const iv = setInterval(() => {
      const l = Math.max(0, Math.ceil((end.current - Date.now()) / 1000))
      setLeft(l)
      if (l <= 0) { clearInterval(iv); done.current?.() }
    }, 200)
    return () => clearInterval(iv)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running, secs])
  return [left, setLeft] as const
}
export const mmss = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`

export function Ring({ left, total, size = 160, children }: { left: number; total: number; size?: number; children?: ReactNode }) {
  const r = size / 2 - 8, c = 2 * Math.PI * r, p = total > 0 ? left / total : 0
  return <div className="relative grid place-items-center" style={{ width: size, height: size }}>
    <svg width={size} height={size} className="-rotate-90"><circle cx={size / 2} cy={size / 2} r={r} stroke="#2a2a2a" strokeWidth="8" fill="none" />
      <circle cx={size / 2} cy={size / 2} r={r} stroke="#c6ff00" strokeWidth="8" fill="none" strokeDasharray={c} strokeDashoffset={c * (1 - p)} strokeLinecap="round" style={{ transition: 'stroke-dashoffset .25s linear' }} /></svg>
    <div className="absolute inset-0 grid place-items-center">{children}</div>
  </div>
}
export const Logo = ({ className = '' }: { className?: string }) => <span className={`font-display text-2xl font-extrabold uppercase tracking-tight ${className}`}>VÁRZEA<span className="text-lime"> PRO</span></span>
