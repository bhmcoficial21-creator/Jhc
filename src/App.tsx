import { lazy, Suspense } from 'react'
import { Navigate, NavLink, Outlet, Route, Routes } from 'react-router-dom'
import { useAuth } from './lib/auth'
import { DataProvider, useData } from './lib/data'
import Landing from './pages/Landing'
import Intro from './pages/Intro'
import { DEMO } from './lib/supabase'
import Login from './pages/Login'
import Blocked from './pages/Blocked'
import Onboarding from './pages/Onboarding'
import Today from './pages/Today'
import Workout from './pages/Workout'
import { Privacy, Terms } from './pages/Legal'
import { Spinner } from './components/ui'

const Library = lazy(() => import('./pages/Library'))
const ExercisePage = lazy(() => import('./pages/ExercisePage'))
const Progress = lazy(() => import('./pages/Progress'))
const Tests = lazy(() => import('./pages/Tests'))
const Profile = lazy(() => import('./pages/Profile'))
const Learn = lazy(() => import('./pages/Learn'))
const LessonPage = lazy(() => import('./pages/LessonPage'))
const Quiz = lazy(() => import('./pages/Quiz'))
const Routine = lazy(() => import('./pages/Routine'))
const Planner = lazy(() => import('./pages/Planner'))
const Guide = lazy(() => import('./pages/Guide'))
const Admin = lazy(() => import('./pages/admin/Admin'))

const Icon = ({ d }: { d: string }) => <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d={d} /></svg>
const NAV = [
  { to: '/app', end: true, l: 'Hoje', d: 'M4 12l8-8 8 8M6 10v10h12V10' },
  { to: '/app/aprender', l: 'Jogo', d: 'M3 5h18v14H3zM12 5v14M3 12h18' },
  { to: '/app/biblioteca', l: 'Exercícios', d: 'M6 4v16M18 4v16M6 12h12M3 8v8M21 8v8' },
  { to: '/app/progresso', l: 'Progresso', d: 'M4 20V10M10 20V4M16 20v-8M22 20H2' },
  { to: '/app/perfil', l: 'Perfil', d: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM4 21a8 8 0 0 1 16 0' },
]

function Shell() {
  const { offline } = useAuth(), { fromCache } = useData()
  return (
    <div className="min-h-screen">
      {(offline || fromCache) && <div className="bg-warn px-4 py-1 text-center text-xs font-bold text-black">Sem conexão: usando o último conteúdo carregado. Conecte-se ao menos a cada 7 dias.</div>}
      <Suspense fallback={<Spinner />}><Outlet /></Suspense>
      <nav className="safe-b fixed inset-x-0 bottom-0 z-40 border-t border-line bg-ink/95 backdrop-blur"><div className="mx-auto grid max-w-xl grid-cols-5">
        {NAV.map((n) => <NavLink key={n.to} to={n.to} end={n.end} className={({ isActive }) => `flex min-h-[60px] flex-col items-center justify-center gap-0.5 text-[11px] font-bold uppercase ${isActive ? 'text-lime' : 'text-zinc-500'}`}><Icon d={n.d} />{n.l}</NavLink>)}
      </div></nav>
    </div>
  )
}

function Gate() {
  const { user, loading, access } = useAuth()
  if (loading) return <Spinner label="Carregando…" />
  if (!user) return <Navigate to="/login" replace />
  if (!access) return <Blocked />
  return <DataProvider><Onboarded /></DataProvider>
}
function Onboarded() {
  const { loading, profile, error } = useData()
  if (loading) return <Spinner label="Carregando seu treino…" />
  if (error && !profile) return <div className="page space-y-3"><p className="text-danger">Não foi possível carregar: {error}</p><button className="btn btn-primary" onClick={() => location.reload()}>Tentar de novo</button></div>
  if (!profile?.onboarded) return <Onboarding />
  return <Outlet />
}
function AdminGate() { const { isAdmin } = useAuth(); return isAdmin ? <Outlet /> : <Navigate to="/app" replace /> }

export default function App() {
  return (
    <Routes>
      <Route path="/" element={DEMO ? <Intro /> : <Landing />} />
      <Route path="/vendas" element={<Landing />} />
      <Route path="/entrada" element={<Intro />} />
      <Route path="/login" element={<Login />} />
      <Route path="/termos" element={<Terms />} />
      <Route path="/privacidade" element={<Privacy />} />
      <Route path="/app" element={<Gate />}>
        {/* Telas sem a barra inferior (modo foco) */}
        <Route path="treino" element={<Workout />} />
        <Route path="aquecer-jogo" element={<Suspense fallback={<Spinner />}><Routine kind="aquecimento_jogo" /></Suspense>} />
        <Route path="pos-jogo" element={<Suspense fallback={<Spinner />}><Routine kind="posjogo" /></Suspense>} />
        <Route element={<Shell />}>
          <Route index element={<Today />} />
          <Route path="biblioteca" element={<Library />} />
          <Route path="biblioteca/:id" element={<ExercisePage />} />
          <Route path="progresso" element={<Progress />} />
          <Route path="testes" element={<Tests />} />
          <Route path="perfil" element={<Profile />} />
          <Route path="aprender" element={<Learn />} />
          <Route path="aprender/:id" element={<LessonPage />} />
          <Route path="aprender/:id/quiz" element={<Quiz />} />
          <Route path="planner" element={<Planner />} />
          <Route path="guia" element={<Guide />} />
          <Route path="guia/:id" element={<Guide />} />
          <Route element={<AdminGate />}><Route path="admin/*" element={<Admin />} /></Route>
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
