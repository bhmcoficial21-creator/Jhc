# Religar Trabalho · Desafio Corpo Descongelado 21 Dias

Low ticket da marca **Religar** (R$ 29,90) para quem sente dor por trabalhar sentado ou repetindo movimento.
Base construída a partir do *Briefing Religar Trabalho v1 (05/11/2026)*.

> O design visual (cores, fontes, botões) é **provisório e neutro**. Ele será definido pelo dono do projeto.

## Como abrir

Não precisa instalar nada. Na pasta do projeto:

```bash
python3 -m http.server 8000
```

Depois abra no navegador (de preferência no modo celular):

| Página | Endereço | O que é |
|---|---|---|
| Página de vendas | `http://localhost:8000/` | Estrutura da seção 13 do briefing |
| Quiz Mapa da Dor | `http://localhost:8000/quiz/` | Entrada gratuita do funil |
| Painel do desafio | `http://localhost:8000/app/` | Web app dos 21 dias (seção 14) |

## Onde mudar cada coisa

| Quero mudar… | Arquivo |
|---|---|
| Cores, fontes, raio dos botões, espaçamentos | `assets/css/base.css` (variáveis em `:root`) |
| Preços, links da Cakto, garantia, Regra 50/2, modo de teste | `assets/js/config.js` |
| Exercícios, os 21 dias, aulas, trilhas, semáforo, bônus, PDFs, revisões | `assets/js/data.js` |
| Regras do plano do dia (noite, semáforo, dia caótico, meta de pausas) | `assets/js/logic.js` |
| Perguntas e resultado do quiz | `assets/js/quiz.js` |
| Textos da página de vendas | `index.html` |
| Telas do painel | `app/app.js` e `app/app.css` |
| Onde os dados ficam salvos | `assets/js/storage.js` |

## O que já funciona

**Quiz Mapa da Dor:** regiões (várias), região que mais incomoda, intensidade 0–10, sinais do semáforo, rotina → resultado com região de foco, cor do semáforo, trilha e oferta. O resultado é aproveitado no cadastro do painel.

**Página de vendas:** problema comum → erro e mistério → Corpo Congelado → Método Descongelar → 21 dias → diferenciais → para quem é → oferta e prévia dos order bumps (o total muda) → garantia → FAQ → CTA.

**Central de Alívio Express** (aba ⚡ Alívio do painel):
- 4 trilhas por zona de dor: Descompressão da Lombar e Quadril, Destrava de Ombros, Cervical e Pescoço, Estabilização e Alívio de Joelhos, Alívio de Punho e Mão
- Cada trilha com 3 protocolos prontos: Expediente (3 min), Matinal (5 min) e Noturno (5 min), definidos em `PROTOCOLOS` no `data.js` (cada um fecha o tempo exato)
- Alívio Express sob medida: onde dói + quanto tempo (1 a 3 min) + onde está (cadeira, em pé, reunião)
- Bônus incluídos: Trava de Segurança Articular e Guia de Socorro para Crises Agudas (com sinais de alerta e SAMU 192)

**Painel do desafio:**
- Boas-vindas e Mapa da Dor (região de foco, trilha, Escala da Dor do dia 1, horário de trabalho)
- Hoje: "Como foi sua noite?" → semáforo do dia → plano ajustado, vídeo do dia, contador de pausas, tarefa, Tripé Religar, Escala da Dor (dias 1, 11, 21), revisão (dias 1, 3, 7, 14, 21), dia caótico, check do dia
- Pausa agora: timer de 2 min com os 3 Rs; o "Remexe" vai alternando os exercícios da região de foco; no vermelho, sem exercícios da região
- Pausas invisíveis, lembretes (Regra 50/2 dentro do horário de trabalho), progresso (sequência, calendário, Escala da Dor, pausas por dia), aulas, bônus liberados por compra, Dia 21 (comparação, certificado, upsell e downsell)
- Botão fixo "Senti algo estranho" → Semáforo dos Sinais
- Modo de teste (em **Mais**): avançar dias, simular compras e apagar tudo. **Desligar em `config.js` antes de publicar.**

## O que ainda falta (próximas etapas)

1. **Vídeos e PDFs:** hoje são marcadores (`[Vídeo do dia …]`, `[Microvídeo]`, links `#pdf-…`). A gravação pede: 1 microvídeo de 20 a 40 s por exercício da biblioteca (cerca de 33), 21 vídeos dos dias, 5 aulas e o vídeo de 4 min da Trava de Segurança.
2. **Supabase + login por link mágico:** o progresso hoje fica só no aparelho (localStorage). Esquema pronto em `docs/supabase-schema.sql`; basta trocar as funções de `storage.js`.
3. **Cakto:** links de checkout em `config.js`; liberar acesso e bônus via webhook de compra aprovada (conferir a documentação da Cakto).
4. **Lembretes com o painel fechado:** precisam de push com servidor. Hoje funcionam com o painel aberto ou instalado na tela inicial.
5. **Compliance:** política de privacidade (LGPD), revisão da biblioteca de exercícios e do semáforo por fisioterapeuta, prazo de garantia confirmado.
