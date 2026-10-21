import { lazy, Suspense } from 'react'
import { Link } from 'react-router-dom'
import FavelaBg from '../components/FavelaBg'
import { useAuth } from '../lib/auth'
import { brl } from '../lib/content'
import { RESULTS, TESTIMONIALS } from '../content/landing'
import { PHASES } from '../seed/config'
import { ExtLink, Logo } from '../components/ui'

const Hero3D = lazy(() => import('../components/Hero3D'))
const go = (id: string) => () => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
const Sec = ({ id, title, children }: { id?: string; title?: string; children: React.ReactNode }) =>
  <section id={id} className="mx-auto w-full max-w-3xl px-4 py-10">{title && <h2 className="mb-5 text-4xl leading-none">{title}</h2>}{children}</section>

export default function Landing() {
  const { config: c, user } = useAuth()
  const economy = c.monthly_price * 12 - c.annual_price
  const next = PHASES.find((p) => p.n === c.phase_number + 1)
  const CTA = ({ label = 'ASSINAR' }: { label?: string }) => <button onClick={go('planos')} className="btn btn-primary w-full sm:w-auto">{label}</button>
  const BONUS = ['Programa bônus PRÉ-TEMPORADA DA VÁRZEA (4 semanas)', 'GUIA DE AQUECIMENTO, MOBILIDADE E ALONGAMENTO', 'PLANNER DE TEMPORADA (ajusta a carga conforme seus jogos)', 'PROTOCOLO DE PÓS-JOGO guiado']

  return (
    <div className="min-h-screen bg-ink">
      <header className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4"><Logo />
        <Link to={user ? '/app' : '/login'} className="rounded-xl border border-line px-4 py-2 text-sm font-semibold">{user ? 'Abrir app' : 'Já sou aluno'}</Link></header>

      <section className="relative isolate overflow-hidden">
        <FavelaBg className="absolute inset-0 -z-20 h-full w-full" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-black/75 via-black/35 to-ink" />
        <div className="mx-auto w-full max-w-3xl px-4 pb-0 pt-10">
          <h1 className="text-[3.1rem] leading-[.95] drop-shadow-lg sm:text-7xl">Joga na várzea e <span className="text-lime">cansa nos primeiros 15 minutos?</span> Treine onde der.</h1>
          <div className="mx-auto -mb-2 mt-2 h-[300px] w-full max-w-sm"><Suspense fallback={null}><Hero3D motion="jump" /></Suspense></div>
          <p className="mt-2 text-lg text-zinc-100">Treino de explosão e agilidade para fazer em casa, na academia, no campo ou na quadra.</p>
          <p className="mt-1 text-sm text-zinc-300">Em casa, até 3x3 metros. O mesmo programa nos três lugares: o app troca os exercícios para onde você vai treinar hoje.</p>
          <div className="mt-6 pb-10"><CTA /></div>
        </div>
      </section>

      <Sec title="Você se reconhece?">
        <div className="grid gap-3">
          {[['Arrancada lenta', 'O zagueiro chega primeiro na bola e você só olha.'], ['Perde no giro', 'Recebe de costas, tenta virar e já perdeu o tempo.'], ['Cansa cedo', 'No começo do segundo tempo as pernas já não respondem como você quer.']].map(([t, d]) =>
            <div key={t} className="card"><h3 className="text-2xl text-lime">{t}</h3><p className="text-zinc-300">{d}</p></div>)}
        </div>
      </Sec>

      <Sec title="Como funciona">
        <ol className="grid gap-3">
          {['Responda o perfil em menos de 1 minuto: posição, nível, dias e onde você treina.', 'Abra o app e escolha o LOCAL DE HOJE: casa, academia, campo ou quadra.', 'Siga o treino guiado, um exercício por vez, com animação 3D, timer e aquecimento obrigatório.'].map((t, i) =>
            <li key={i} className="card flex gap-4"><span className="font-display text-5xl text-lime">{i + 1}</span><span className="self-center">{t}</span></li>)}
        </ol>
      </Sec>

      <Sec title="O que vem no app">
        <ul className="grid gap-2 text-zinc-200">
          {['Programa de 8 semanas: base, explosão e jogo, com 3 treinos por semana de 25 a 35 minutos',
            'Exercícios com animação 3D: erro de iniciante, execução correta e níveis de 1 a 4',
            'TREINOS POR POSIÇÃO: goleiro, zagueiro, lateral, meia e atacante (nos dois planos)',
            'MAPAS DE CONES PARA IMPRIMIR: PDF de uma página com as medidas (nos dois planos)',
            'POSICIONAMENTO E LEITURA DE JOGO: lições, prancheta animada e quiz (nos dois planos)',
            'AQUECER PARA O JOGO: rotina de 10 minutos, sem equipamento (nos dois planos)',
            'Alongamento na volta à calma de todo treino, com timer',
            'Habilidade com bola: domínio em 3 minutos, fintas e giros',
            'Testes de salto e agilidade nas semanas 1, 4 e 8 para você acompanhar sua evolução',
            'Funciona offline depois do primeiro carregamento'].map((t) => <li key={t} className="flex gap-3"><span className="text-lime">▸</span>{t}</li>)}
        </ul>
      </Sec>

      <Sec title="Para quem é">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="card"><h3 className="mb-2 text-xl text-lime">É para você se</h3><ul className="space-y-1 text-zinc-300"><li>Joga futebol amador (várzea, racha, campeonato de fim de semana)</li><li>Tem de 16 a 45 anos e quer treinar sem professor</li><li>Treina em casa, na academia, no campo ou na quadra</li></ul></div>
          <div className="card"><h3 className="mb-2 text-xl text-danger">Não é para você se</h3><ul className="space-y-1 text-zinc-300"><li>Está com dor ou lesão agora e não passou por um profissional de saúde</li><li>Busca tratamento, reabilitação ou dieta</li><li>Espera uma promessa de resultado garantido</li></ul></div>
        </div>
      </Sec>

      {TESTIMONIALS.length > 0 && <Sec title="Quem já treina"><div className="grid gap-3">{TESTIMONIALS.map((t) => <figure key={t.name} className="card"><blockquote>“{t.text}”</blockquote><figcaption className="muted mt-2">{t.name}{t.detail ? ` · ${t.detail}` : ''}</figcaption></figure>)}</div></Sec>}
      {RESULTS.length > 0 && <Sec title="Resultados"><div className="grid grid-cols-2 gap-3">{RESULTS.map((r) => <div key={r.label} className="card"><div className="font-display text-4xl text-lime">{r.value}</div><div>{r.label}</div>{r.note && <div className="muted">{r.note}</div>}</div>)}</div></Sec>}

      <Sec id="planos" title="Escolha seu plano">
        {c.show_launch_badge && <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-lime px-4 py-1 font-display text-lg font-extrabold uppercase text-black">{c.phase_name}</div>}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="card flex flex-col gap-3">
            <h3 className="text-3xl">Mensal</h3>
            <div><span className="font-display text-5xl font-extrabold">{brl(c.monthly_price)}</span><span className="text-zinc-400"> por mês</span></div>
            <ul className="space-y-1 text-sm text-zinc-300"><li>✓ Programa de 8 semanas e novos programas</li><li>✓ Treinos por posição, mapas de cones e leitura de jogo</li><li>✓ Cancele a qualquer momento</li><li>✓ Garantia de 7 dias</li></ul>
            <ExtLink href={c.monthly_url} variant="ghost" className="mt-auto">ASSINAR MENSAL</ExtLink>
          </div>
          <div className="card relative flex flex-col gap-3 !border-lime">
            <span className="absolute -top-3 right-3 rounded-full bg-lime px-3 py-1 text-xs font-extrabold uppercase text-black">Melhor valor</span>
            <h3 className="text-3xl">Anual</h3>
            <div><span className="font-display text-5xl font-extrabold">{brl(c.annual_price)}</span><span className="text-zinc-400"> por ano</span></div>
            <p className="text-sm text-lime">Equivale a {brl(c.annual_price / 12)} por mês · 2 meses grátis · economia de {brl(economy)} frente a 12 mensalidades de {brl(c.monthly_price)}. Em até 12x no cartão.</p>
            <ul className="space-y-1 text-sm text-zinc-300"><li>✓ Tudo do mensal, mais o brinde exclusivo:</li>{BONUS.map((b) => <li key={b} className="pl-4">＋ {b}</li>)}<li>✓ Garantia de 7 dias</li></ul>
            <ExtLink href={c.annual_url} className="mt-auto">ASSINAR ANUAL</ExtLink>
          </div>
        </div>
        {c.show_price_rise_notice && <p className="muted mt-4">O preço sobe por fase conforme o app ganha recursos{next ? ` (a próxima fase: ${brl(next.m)} por mês ou ${brl(next.a)} por ano)` : ''}. Quem assina numa fase mantém o preço dela enquanto a assinatura estiver ativa.</p>}
      </Sec>

      <Sec title="Garantia de 7 dias"><p className="text-zinc-300">Assine, treine e, se não for para você, peça o reembolso em até 7 dias, nos dois planos. Sem burocracia.</p></Sec>

      <Sec title="Perguntas frequentes">
        <div className="grid gap-2">
          {[['Precisa de academia?', 'Não. O programa funciona em casa (até 3x3 m), na academia, no campo ou na quadra. O app troca os exercícios conforme o local escolhido.'],
            ['Funciona no celular?', 'Sim. É feito para celular, instala na tela inicial e o treino do dia abre offline depois do primeiro carregamento.'],
            ['Serve para quem está começando?', 'Sim. Existem 3 níveis, e você começa no que combina com você. Quem tem dor ou lesão deve procurar um profissional de saúde antes.'],
            ['Posso cancelar quando quiser?', 'Pode. Você mantém o acesso até o fim do período já pago.'],
            ['E se eu não gostar?', 'Você tem 7 dias de garantia nos dois planos.']].map(([q, a]) =>
            <details key={q} className="card group"><summary className="cursor-pointer list-none font-display text-xl font-bold uppercase">{q}</summary><p className="mt-2 text-zinc-300">{a}</p></details>)}
        </div>
      </Sec>

      <Sec><div className="card text-center"><h2 className="mb-3 text-4xl">Pronto para treinar?</h2><CTA label="ASSINAR" /></div></Sec>

      <footer className="mx-auto max-w-3xl space-y-2 px-4 pb-24 pt-6 text-xs text-zinc-500">
        <p>Conteúdo de orientação geral de treino. Não substitui orientação médica nem de profissional de educação física e não promete resultados. Menores de 18 anos só com ciência do responsável.</p>
        <p><Link to="/termos" className="underline">Termos</Link> · <Link to="/privacidade" className="underline">Privacidade</Link>{c.whatsapp && <> · <a className="underline" href={`https://wa.me/${c.whatsapp.replace(/\D/g, '')}`}>Suporte no WhatsApp</a></>}</p>
      </footer>
    </div>
  )
}
