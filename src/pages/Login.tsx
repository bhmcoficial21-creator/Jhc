import { useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import { DEMO } from '../lib/supabase'
import { Btn, Logo, Notice } from '../components/ui'

export default function Login() {
  const { user, signIn } = useAuth()
  const [email, setEmail] = useState('')
  const [state, setState] = useState<'idle' | 'sending' | 'sent'>('idle')
  const [err, setErr] = useState<string | null>(null)
  if (user) return <Navigate to="/app" replace />
  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setState('sending'); setErr(null)
    const r = await signIn(email.trim().toLowerCase())
    if (r) { setErr(r); setState('idle') } else setState(DEMO ? 'idle' : 'sent')
  }
  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-6 px-4">
      <Link to="/"><Logo className="text-4xl" /></Link>
      {state === 'sent' ? (
        <div className="card space-y-2"><h1 className="text-3xl text-lime">Link enviado</h1><p>Abra o e-mail <b>{email}</b> e toque no link para entrar. Confira o spam se não chegar em 1 minuto.</p><Btn variant="ghost" onClick={() => setState('idle')}>Usar outro e-mail</Btn></div>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          <h1 className="text-4xl">Entrar</h1>
          <p className="muted">Use o mesmo e-mail da compra. Enviamos um link mágico, sem senha.</p>
          <input type="email" required autoComplete="email" inputMode="email" placeholder="seu@email.com" value={email} onChange={(e) => setEmail(e.target.value)} />
          {err && <Notice tone="danger">{err}</Notice>}
          <Btn type="submit" disabled={state === 'sending'} className="w-full">{state === 'sending' ? 'Enviando…' : 'Receber link'}</Btn>
          {DEMO && <Notice tone="info">Modo demo (sem backend): qualquer e-mail entra, com dados salvos só neste navegador.</Notice>}
        </form>
      )}
    </div>
  )
}
