import { useState } from 'react'
import { Link } from 'react-router-dom'
import { PHASES } from '../../seed/config'
import { saveConfig } from '../../lib/content'
import { useAuth } from '../../lib/auth'
import { useData } from '../../lib/data'
import type { AppConfig, Exercise, Lesson, LevelDef, QuizQuestion } from '../../lib/types'
import { Btn, Card, Chips, Field, Notice } from '../../components/ui'
import { FrameEditor, BoardEditor } from './BoardEditor'
import Crud, { type FieldDef } from './Crud'
import Metrics from './Metrics'
import ProgramEditor from './ProgramEditor'
import Students from './Students'

type Tab = 'replays' | 'metricas' | 'alunos' | 'config' | 'exercicios' | 'programas' | 'licoes' | 'quiz' | 'missoes' | 'guia' | 'refs'
const TABS: { v: Tab; l: string }[] = [{ v: 'metricas', l: 'Métricas' }, { v: 'alunos', l: 'Alunos' }, { v: 'config', l: 'Preços' }, { v: 'exercicios', l: 'Exercícios' }, { v: 'programas', l: 'Programas' }, { v: 'replays', l: 'Replays 3D' }, { v: 'licoes', l: 'Lições' }, { v: 'quiz', l: 'Quiz' }, { v: 'missoes', l: 'Missões' }, { v: 'guia', l: 'Guia anual' }, { v: 'refs', l: 'Referências' }]
const POS = ['goleiro', 'zagueiro', 'lateral', 'meia', 'atacante']
const CATS = ['aquecimento', 'alongamento', 'pliometria', 'agilidade', 'jogo', 'prevencao', 'academia', 'campo', 'habilidade', 'posicao', 'movimento']
const MOTIONS = ['march', 'squat', 'lunge', 'jump', 'jump_small', 'jump_forward', 'jump_lateral', 'jump_single', 'jump_box', 'bound', 'sprint', 'zigzag', 'tdrill', 'shuttle', 'reaction', 'turn', 'feint', 'shuffle', 'calf', 'balance', 'bridge', 'plank', 'adduction', 'nordic', 'ankle', 'hip', 'scan', 'breath', 'stretch_quad', 'stretch_ham', 'stretch_glute', 'stretch_calf', 'stretch_hipflex', 'stretch_adductor']

function ConfigForm() {
  const { config, reloadConfig } = useAuth()
  const [c, setC] = useState<AppConfig>(config), [msg, setMsg] = useState('')
  const set = <K extends keyof AppConfig>(k: K, v: AppConfig[K]) => setC({ ...c, [k]: v })
  const phase = (n: number) => { const p = PHASES.find((x) => x.n === n); if (p) setC({ ...c, phase_number: n, monthly_price: p.m, annual_price: p.a }) }
  return <div className="space-y-3">
    <h2 className="text-3xl">Fase de preço e checkout</h2>
    <Notice tone="info">Trocar a fase muda o preço exibido e as URLs para novos clientes. Quem já assinou mantém o preço da fase em que assinou (campo <code>price_phase</code> na assinatura).</Notice>
    <Field label="Fase"><Chips value={String(c.phase_number)} onChange={(v) => phase(Number(v))} options={PHASES.map((p) => ({ v: String(p.n), l: `Fase ${p.n}` }))} /></Field>
    <Field label="Nome da fase (selo)"><input value={c.phase_name} onChange={(e) => set('phase_name', e.target.value)} /></Field>
    <div className="grid grid-cols-2 gap-2"><Field label="Mensal (R$)"><input inputMode="decimal" value={c.monthly_price} onChange={(e) => set('monthly_price', Number(e.target.value.replace(',', '.')) || 0)} /></Field><Field label="Anual (R$)"><input inputMode="decimal" value={c.annual_price} onChange={(e) => set('annual_price', Number(e.target.value.replace(',', '.')) || 0)} /></Field></div>
    <Field label="URL do checkout MENSAL"><input value={c.monthly_url} onChange={(e) => set('monthly_url', e.target.value)} /></Field>
    <Field label="URL do checkout ANUAL"><input value={c.annual_url} onChange={(e) => set('annual_url', e.target.value)} /></Field>
    <Field label="URL para gerenciar/cancelar assinatura"><input value={c.manage_url} onChange={(e) => set('manage_url', e.target.value)} /></Field>
    <Field label="WhatsApp do suporte (com DDI)"><input value={c.whatsapp} onChange={(e) => set('whatsapp', e.target.value)} placeholder="5511999999999" /></Field>
    <label className="flex items-center gap-3 text-zinc-100"><input type="checkbox" className="!h-6 !w-6" checked={c.show_launch_badge} onChange={(e) => set('show_launch_badge', e.target.checked)} />Mostrar selo de lançamento</label>
    <label className="flex items-center gap-3 text-zinc-100"><input type="checkbox" className="!h-6 !w-6" checked={c.show_price_rise_notice} onChange={(e) => set('show_price_rise_notice', e.target.checked)} />Mostrar aviso de que o preço sobe (só enquanto for verdade)</label>
    <Btn className="w-full" onClick={async () => { try { await saveConfig(c); await reloadConfig(); setMsg('Salvo. A landing já mostra os novos valores.') } catch (e) { setMsg('Erro: ' + (e as Error).message) } }}>Salvar</Btn>
    {msg && <Notice tone="info">{msg}</Notice>}
  </div>
}

function LevelsEditor({ v, set }: { v: unknown; set: (x: LevelDef[]) => void }) {
  const lv = ((v as LevelDef[]) ?? []).length ? (v as LevelDef[]) : []
  const rows = [1, 2, 3, 4].map((n) => lv.find((l) => l.n === n) ?? { n: n as 1, name: '', desc: '' })
  const up = (n: number, p: Partial<LevelDef>) => set(rows.map((r) => (r.n === n ? { ...r, ...p } : r)).filter((r) => r.name))
  return <div className="space-y-2">{rows.map((r) => <div key={r.n} className="grid grid-cols-5 gap-1.5"><span className="self-center font-display text-xl">N{r.n}</span><input className="col-span-2" placeholder="Nome" value={r.name} onChange={(e) => up(r.n, { name: e.target.value })} /><input className="col-span-2" placeholder="Descrição" value={r.desc} onChange={(e) => up(r.n, { desc: e.target.value })} /></div>)}</div>
}

const exFields: FieldDef[] = [
  { key: 'id', label: 'Id (único, sem espaços)', type: 'text' }, { key: 'name', label: 'Nome', type: 'text' }, { key: 'category', label: 'Categoria', type: 'select', options: CATS },
  { key: 'kind', label: 'Tipo', type: 'select', options: ['fisico', 'habilidade'] }, { key: 'objective', label: 'Objetivo', type: 'textarea' },
  { key: 'steps', label: 'Passo a passo', type: 'lines' }, { key: 'mistakes', label: 'Erros comuns', type: 'lines' },
  { key: 'min_level', label: 'Nível mínimo do aluno (1 a 4)', type: 'number' }, { key: 'locations', label: 'Locais (casa, academia, campo)', type: 'tags' },
  { key: 'equipment', label: 'Equipamentos (cones, caixa, halteres, barra, degrau, ladeira…)', type: 'tags' }, { key: 'min_space', label: 'Espaço mínimo (2x2, 3x3, 10m, 20m, 30m)', type: 'text' },
  { key: 'is_jump', label: 'É salto (bloqueado em cautela/dor; mostra lembrete de aterrissagem)', type: 'bool' }, { key: 'injury_risk', label: 'Risco de lesão (mostra o ERRO DE INICIANTE antes da execução)', type: 'bool' },
  { key: 'beginner_error', label: 'Texto do erro de iniciante', type: 'textarea' },
  { key: 'levels', label: 'Níveis 1 a 4', type: 'custom', render: (v, _r, set) => <LevelsEditor v={v} set={set} /> },
  { key: 'alternatives', label: 'Versões por local (JSON: {"casa":"id","academia":"id","campo":"id","seguro":"id sem salto"})', type: 'json' },
  { key: 'positions', label: 'Posições (vazio = todas)', type: 'tags' }, { key: 'annual_only', label: 'Exclusivo do plano anual', type: 'bool' },
  { key: 'needs_supervision', label: 'Treinar com orientação de profissional', type: 'bool' }, { key: 'box_height_cm', label: 'Altura da caixa (cm, máximo 60)', type: 'number' },
  { key: 'anim_url', label: 'Animação 3D (GLB até 2 MB; clips: erro, correto, n1..n4)', type: 'file', accept: '.glb,.gltf,model/gltf-binary' },
  { key: 'camera_angle', label: 'Ângulo inicial da câmera', type: 'select', options: ['lateral', 'frontal', 'traseiro', 'cima'] }, { key: 'xray_joint', label: 'Articulação do raio-X', type: 'select', options: ['joelho', 'tornozelo', 'quadril'] },
  { key: 'image_url', label: 'Imagem própria (se não houver animação)', type: 'file', accept: 'image/*' }, { key: 'video_url', label: 'Vídeo curto próprio (se não houver animação)', type: 'file', accept: 'video/*' },
  { key: 'motion', label: 'Movimento da pré-visualização do manequim', type: 'select', options: MOTIONS }, { key: 'timed_secs', label: 'Duração (segundos), se cronometrado', type: 'number' },
  { key: 'circuit', label: 'Mapa de cones (JSON: title, notes, area, cones[], path[], distances[])', type: 'json' }, { key: 'routine', label: 'Rotina (JSON: [{ex,secs,rest}])', type: 'json' },
]

export default function Admin() {
  const [tab, setTab] = useState<Tab>('metricas')
  const d = useData()
  return (
    <div className="page space-y-4">
      <div className="flex items-center justify-between"><h1 className="text-5xl leading-none">Admin</h1><Link to="/app/perfil" className="text-sm text-lime underline">← Perfil</Link></div>
      <div className="-mx-4 flex gap-1.5 overflow-x-auto px-4 pb-1">{TABS.map((t) => <button key={t.v} onClick={() => setTab(t.v)} className={`chip !min-h-[44px] shrink-0 !px-4 ${tab === t.v ? 'chip-on' : ''}`}>{t.l}</button>)}</div>
      {tab === 'metricas' && <Metrics />}{tab === 'alunos' && <Students />}{tab === 'config' && <ConfigForm />}{tab === 'programas' && <ProgramEditor />}
      {tab === 'exercicios' && <Crud ckey="exercises" title="Exercícios" fields={exFields} titleOf={(r) => (r as unknown as Exercise).name} subtitleOf={(r) => `${(r as unknown as Exercise).category} · ${(r as unknown as Exercise).id}`}
        blank={() => ({ id: '', name: '', category: 'pliometria', kind: 'fisico', objective: '', steps: [], mistakes: [], min_level: 1, locations: ['casa'], equipment: [], min_space: '2x2', is_jump: false, injury_risk: false, beginner_error: '', levels: [], alternatives: {}, positions: [], annual_only: false, needs_supervision: false, box_height_cm: null, camera_angle: 'lateral' })}
        validate={(r) => (!(r.id as string) || /\s/.test(r.id as string) ? 'Id obrigatório e sem espaços.' : !(r.name as string) ? 'Informe o nome.' : Number(r.box_height_cm ?? 0) > 60 ? 'Regra de segurança: caixa acima de 60 cm não é permitida.' : /drop jump|barra nas costas/i.test(String(r.name) + String(r.objective) + ((r.steps as string[]) ?? []).join()) ? 'Regra de segurança: sem drop jump nem salto com barra nas costas no lançamento.' : r.injury_risk && !(r.beginner_error as string) ? 'Exercício com risco de lesão precisa do texto do erro de iniciante.' : null)} />}
      {tab === 'replays' && <Crud ckey="replays" title="Replays 3D (treino com bola)" titleOf={(r) => String(r.title)} subtitleOf={(r) => `${String(r.category)} · ${(r.duration as number) ?? 0}s`}
        blank={() => ({ id: '', title: '', category: 'drible', summary: '', duration: 8, level: 1, pitch: 'court', focus: { x: 0, y: 0, size: 16 }, tracks: [], ball: [], steps: [], how: [], setup: '', tips: [], mistakes: [], camera: 'tv', published: false })}
        fields={[{ key: 'id', label: 'Id (único)', type: 'text' }, { key: 'title', label: 'Título', type: 'text' }, { key: 'category', label: 'Categoria', type: 'select', options: ['drible', 'marcacao', 'desmarque', 'chute', 'conducao'] }, { key: 'summary', label: 'Resumo', type: 'textarea' }, { key: 'level', label: 'Nível (1 a 3)', type: 'number' }, { key: 'duration', label: 'Duração (s)', type: 'number' }, { key: 'pitch', label: 'Campo', type: 'select', options: ['full', 'court', 'none'] }, { key: 'camera', label: 'Câmera inicial', type: 'select', options: ['tv', 'seguir', 'gol'] },
          { key: 'focus', label: 'Foco da câmera (JSON {x,y,size})', type: 'json' }, { key: 'goal', label: 'Gol (JSON {x:52.5,side:1}) ou vazio', type: 'json' }, { key: 'cones', label: 'Cones (JSON [[x,y],...])', type: 'json' },
          { key: 'tracks', label: 'Jogadores e trajetórias (JSON: id, team, role, hero, keys[{t,x,y,act,face}])', type: 'json' }, { key: 'ball', label: 'Bola (JSON: carry / travel / at)', type: 'json' }, { key: 'steps', label: 'Legendas por tempo (JSON [{t,text}])', type: 'json' },
          { key: 'how', label: 'Como fazer', type: 'lines' }, { key: 'setup', label: 'Material e espaço', type: 'textarea' }, { key: 'tips', label: 'Dicas', type: 'lines' }, { key: 'mistakes', label: 'Erros comuns', type: 'lines' }, { key: 'published', label: 'Publicado (revisado por um treinador)', type: 'bool' }]} />}
      {tab === 'licoes' && <Crud ckey="lessons" title="Lições de posicionamento" titleOf={(r) => (r as unknown as Lesson).title} subtitleOf={(r) => `#${(r as unknown as Lesson).order_idx} · ${((r as unknown as Lesson).positions.join(', ') || 'todas as posições')}${(r as unknown as Lesson).reviewed ? '' : ' · aguardando revisão'}`}
        blank={() => ({ id: '', order_idx: d.content.lessons.length + 1, title: '', positions: [], minutes: 3, summary: '', situation: '', error_text: '', right_text: '', board: null, published: false, reviewed: false })}
        fields={[{ key: 'id', label: 'Id (único)', type: 'text' }, { key: 'title', label: 'Título', type: 'text' }, { key: 'order_idx', label: 'Ordem de dificuldade', type: 'number' }, { key: 'positions', label: 'Posições (vazio = todas)', type: 'tags', hint: POS.join(', ') }, { key: 'minutes', label: 'Minutos', type: 'number' }, { key: 'summary', label: 'Resumo', type: 'textarea' },
          { key: 'situation', label: '1 · A situação (texto curto)', type: 'textarea' }, { key: 'error_text', label: '2 · Erro comum (texto curto)', type: 'textarea' }, { key: 'right_text', label: '3 · Movimento certo (texto curto)', type: 'textarea' },
          { key: 'board', label: 'Prancheta animada', type: 'custom', render: (v, _r, set) => <BoardEditor value={v as never} onChange={set} /> },
          { key: 'reviewed', label: 'Revisado por um treinador', type: 'bool' }, { key: 'published', label: 'Publicado (só publique depois da revisão)', type: 'bool' }]} />}
      {tab === 'quiz' && <Crud ckey="quiz" title="Perguntas do quiz" titleOf={(r) => (r as unknown as QuizQuestion).prompt} subtitleOf={(r) => (r as unknown as QuizQuestion).lesson_id}
        blank={() => ({ id: '', lesson_id: d.content.lessons[0]?.id ?? '', prompt: '', board: { field: '11', frame: { players: [], ball: { x: 50, y: 50 } } }, answer: { x: 50, y: 50, r: 10 }, explanation: '' })}
        fields={[{ key: 'id', label: 'Id (único)', type: 'text' }, { key: 'lesson_id', label: 'Id da lição', type: 'select', options: d.content.lessons.map((l) => l.id) }, { key: 'prompt', label: 'Pergunta', type: 'textarea' },
          { key: 'board', label: 'Situação e ponto certo (use "Marcar resposta" e toque no campo)', type: 'custom', render: (v, row, set) => {
            const b = v as QuizQuestion['board']
            return <div className="space-y-2"><Chips value={b.field} onChange={(f) => set({ ...b, field: f })} options={[{ v: '11', l: '11 contra 11' }, { v: 'society', l: 'Society' }, { v: 'futsal', l: 'Futsal' }]} />
              <FrameEditor field={b.field} frames={[b.frame]} onChange={(fs) => set({ ...b, frame: fs[0] })} answer={row.answer as never} onAnswer={(a) => { row.answer = a; set({ ...b }) }} /></div> } },
          { key: 'explanation', label: 'Explicação em uma frase', type: 'textarea' }]} />}
      {tab === 'missoes' && <Crud ckey="missions" title="Missões do jogo" titleOf={(r) => String(r.title)} blank={() => ({ id: '', title: '', body: '', positions: [], lesson_id: null })}
        fields={[{ key: 'id', label: 'Id', type: 'text' }, { key: 'title', label: 'Título', type: 'text' }, { key: 'body', label: 'Tarefa tática simples', type: 'textarea' }, { key: 'positions', label: 'Posições (vazio = todas)', type: 'tags', hint: POS.join(', ') }, { key: 'lesson_id', label: 'Lição sugerida', type: 'select', options: d.content.lessons.map((l) => l.id) }]} />}
      {tab === 'guia' && <Crud ckey="guide" title="Guia, planner, pós-jogo e aquecimento de jogo" titleOf={(r) => String(r.title)} subtitleOf={(r) => String(r.kind)} blank={() => ({ id: '', kind: 'guia', title: '', order_idx: 1, body: '', steps: [] })}
        fields={[{ key: 'id', label: 'Id', type: 'text' }, { key: 'kind', label: 'Tipo', type: 'select', options: ['guia', 'planner', 'posjogo', 'preseason', 'aquecimento_jogo'] }, { key: 'title', label: 'Título', type: 'text' }, { key: 'order_idx', label: 'Ordem', type: 'number' }, { key: 'body', label: 'Texto (inclua o aviso: não substitui orientação profissional)', type: 'textarea' }, { key: 'steps', label: 'Passos (JSON: [{"ex":"id","secs":30,"side":true}])', type: 'json' }]} />}
      {tab === 'refs' && <Crud ckey="refs" title="Referências externas" titleOf={(r) => String(r.title)} subtitleOf={(r) => `por ${String(r.author)}`} blank={() => ({ id: crypto.randomUUID(), title: '', url: '', author: '', note: '' })} validate={(r) => (!r.url || !r.author ? 'Link e crédito do autor são obrigatórios.' : null)}
        fields={[{ key: 'title', label: 'Título', type: 'text' }, { key: 'url', label: 'Link externo', type: 'text' }, { key: 'author', label: 'Crédito do autor', type: 'text' }, { key: 'note', label: 'Observação', type: 'textarea' }]} />}
      <Card><p className="muted">Textos de lição, guia e protocolo: orientação geral, sem promessa de resultado e revisados por um treinador antes de publicar.</p></Card>
    </div>
  )
}
