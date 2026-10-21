import { Link } from 'react-router-dom'
import { Logo } from '../components/ui'

const Wrap = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="mx-auto max-w-2xl space-y-4 px-4 py-8"><Link to="/"><Logo /></Link><h1 className="text-5xl">{title}</h1>
    <p className="rounded-xl border border-warn/50 bg-warn/10 p-3 text-sm text-amber-100">Texto-modelo: peça a revisão de um advogado antes de publicar (dados do controlador, CNPJ e canal de contato).</p>
    <div className="space-y-4 text-zinc-300 [&_h2]:mt-6 [&_h2]:text-2xl [&_h2]:text-lime [&_li]:ml-5 [&_li]:list-disc">{children}</div></div>
)

export function Terms() {
  return <Wrap title="Termos de uso">
    <h2>1. O que é o serviço</h2><p>O VÁRZEA PRO oferece programas de treino físico e conteúdo de posicionamento e leitura de jogo para jogadores amadores de futebol, por assinatura mensal ou anual.</p>
    <h2>2. Não é orientação médica</h2><p>O conteúdo é de orientação geral de treino. Não substitui orientação médica nem de profissional de educação física, não faz diagnóstico, não trata lesões e não promete resultados. Se sentir dor forte, inchaço ou dor que não passa, pare e procure um profissional de saúde presencialmente. Quem tem dor ou lesão atual deve ter liberação antes de treinar.</p>
    <h2>3. Menores de idade</h2><p>Menores de 18 anos só podem usar com ciência e autorização de um responsável.</p>
    <h2>4. Assinatura, cancelamento e reembolso</h2><p>A cobrança é feita pela plataforma de checkout. Você pode cancelar a qualquer momento e mantém o acesso até o fim do período já pago. Há garantia de 7 dias nos dois planos. Em caso de reembolso ou chargeback o acesso é encerrado imediatamente. Pagamento em atraso tem tolerância de 3 dias.</p>
    <h2>5. Preços por fase</h2><p>O preço pode subir por fase. Quem assina numa fase mantém o preço dela enquanto a assinatura estiver ativa.</p>
    <h2>6. Uso da conta</h2><p>O acesso é pessoal e intransferível. Não é permitido copiar ou redistribuir o conteúdo.</p>
  </Wrap>
}
export function Privacy() {
  return <Wrap title="Política de privacidade">
    <h2>Dados que coletamos</h2><ul><li>E-mail (login por link mágico e identificação da assinatura).</li><li>Perfil de treino: posição, nível, local, equipamentos, tipo de campo.</li><li><b>Dados de saúde</b>: respostas sobre dor ou lesão e registros de dor após treinos e jogos.</li><li>Registros de uso: treinos concluídos, testes físicos e respostas de quiz.</li></ul>
    <h2>Para que usamos</h2><p>Adaptar o treino, proteger sua segurança (por exemplo, bloquear saltos quando há dor) e manter a assinatura. Os dados de saúde só são tratados mediante seu consentimento específico, dado no cadastro.</p>
    <h2>Compartilhamento</h2><p>Não vendemos seus dados. Eles são tratados por provedores de infraestrutura (banco de dados e e-mail) e pela plataforma de checkout, apenas para operar o serviço.</p>
    <h2>Seus direitos (LGPD)</h2><p>Você pode acessar, corrigir e <b>apagar sua conta</b> a qualquer momento em Perfil, e retirar o consentimento. O apagamento remove seus dados de treino e saúde.</p>
    <h2>Contato</h2><p>Fale com o suporte pelo WhatsApp indicado no app.</p>
  </Wrap>
}
