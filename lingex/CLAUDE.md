# LINGEX — contexto do projeto

Micro-SaaS freemium de aprendizado de idiomas, em **um único arquivo HTML** (`index.html`, ~377 KB: HTML + CSS + JS em IIFE, sem build). Publicado em lingex.online (Hostinger, `public_html/`).

## Arquivos
- `index.html` — o app inteiro. Versão atual: "v6 · 16/10" (aparece em Perfil → "Versão do app"; atualize ao mexer).
- `nexus_proxy.php` — proxy PHP da Nexus (chat de dúvidas). Chave da Anthropic fica SÓ aqui (linha 26, em branco neste pacote). NUNCA commitar chave real. No servidor existe uma cópia com a chave real — não sobrescrever.
- `assets/nebula-4k.jpg` (1,8 MB) e `nebula-2k.jpg` (0,5 MB) — skybox da entrada. **Subir a pasta `assets/` junto com o index.html** no Hostinger; sem ela o app usa só a miniatura embutida (borrada). Créditos obrigatórios (CC BY 4.0): "Alien Space Nebula 1 (Skybox)" de Jungle Jim, sketchfab.com/3d-models/alien-space-nebula-1-skybox-4a4e7aec37c04320a09ac4c7434b8810 — já aparecem em Perfil → Créditos.
- `assets/cycle.bin` (110 KB: malha + keyframes do modelo "Cycle", gerado a partir do .glb) e `cycle-mask.png` — animação de entrada do planeta. Créditos (CC BY 4.0): "Cycle" de tamminen, sketchfab.com/3d-models/cycle-b2c3b1d1630d40f8b7a75ffe7d8409eb (em Perfil → Créditos).
- `tests/` — testes Playwright (ver abaixo).

## Como o app funciona
- Entrada do planeta: objeto `intro` no IIFE. 32 discos do modelo "Cycle" são renderizados em WebGL offscreen; a silhueta vira máscara (`destination-in`) do planeta 2D na splash e o brilho ciano entra por cima (`lighter`). Dura 4,2 s (o ritmo original do modelo, 24 quadros/s), na splash (também para quem já tem progresso salvo), só com o céu 3D ativo; sem WebGL, sem `prefers-reduced-motion` ou sem os arquivos em `assets/` o planeta aparece normal. A splash espera a intro acabar antes de ir às boas-vindas.
- Conquistas são "livros 3D" (CSS 3D: capa, lombada, bloco de páginas; inclinam com o dedo/cursor). Conquistas só por prova: situações exigem o teste de domínio; as conquistas de escuta exigem **provinha de escuta aprovada** (Praticar → treino, 80%+ de acerto; `counters.quizPass/quizPerfect`). Ouvir, gravar ou perguntar não destrava nada. `earnedBadges` é sempre recalculado do estado, nunca restaurado do salvo. Teste: `tests/conquistas.js`.
- Representante das conquistas (`COMPANIONS`, `openCompanion`): após o nível, tela com carrossel deslizável (scroll-snap) para escolher Lumo (anfitrião), Nexus (tira-dúvidas) ou Orbit (mestre das conquistas; padrão). Cada personagem continua no seu lugar (Lumo na Home, Nexus no chat, Orbit na escolha de destino). O escolhido fica em `lingex.v1.companion` e comenta as conquistas em Perfil (`renderGuide`: próxima conquista + melhor caminho, só com dados que o app mede). "Trocar representante" reabre o carrossel em modo `profile`.
- Escrita LINGEX viva (`makeWordmark`): na splash e nas boas-vindas o texto é um canvas de partículas que fogem do dedo/cursor e voltam por mola, e se montam da esquerda pra direita. O texto HTML continua (transparente) para leitores de tela; com `prefers-reduced-motion` vale só o texto.
- Buraco negro da escolha de destino: dentro do shader do `sky` (uniform `uBH`): lente gravitacional + disco de acreção + anel de fótons. Ao tocar "Começar", `sky.hole()` faz o buraco engolir a tela (1,5 s) e pousar embaixo do globo; só aparece na cena `destino`.
- Universo 3D da entrada: `<canvas id="sky">` (WebGL cru, sem biblioteca) atrás do `<canvas id="scene">` do globo 2D. Objeto `sky` no IIFE: shader de skybox equirretangular + 420 estrelas 3D com paralaxe real; câmera por cena (`SCENES`), arrastar no destino gira/inclina o céu, o "mergulho" ao confirmar o país faz zoom + voo. Textura: miniatura base64 embutida → `assets/nebula-4k.jpg` (cai para 2k). Sem WebGL/contexto perdido: `sky.ok=false` e o fundo 2D antigo (`drawBackground`) volta. O céu 3D aparece em todas as telas (na Home fica escurecido e parado, sem gastar bateria); o fundo 2D antigo só entra se não houver WebGL.
- Estado em `localStorage`: `lingex.v1` (progresso) e `lingex.paid` (desbloqueio premium).
- Globo (canvas) → escolhe país/variante → objetivo/nível → trilha de 10 situações + 1 bônus secreta. 14 variantes (en-US/GB/CA/ZA/NG, es-MX/ES/AR, fr-FR, it-IT, ja-JP, zh-CN, ru-RU, ar-EG) × 33 falas (3 por situação). Dados em `SITU_LIBRARY`/`SITU_PACK*`; `buildSituationsFor(variant)` monta a lista.
- Grátis: cafe, aeroporto, direcoes, apresentar. Pagas: restaurante, hotel, compras, transporte, balada, medico. Bônus: emergencia.
- Progressão real: ouvir TODAS as falas (🔊/🐢) → "teste de domínio" (listen/read/speak/pron/order; passa com ≤1 erro, `MASTERY_MAX_MISSES=1`) → só então conclui e libera a próxima (`blockingSitu`). ja/zh usam pergunta de pronúncia em vez de ordenar palavras (`NO_SPACE_VARIANTS`).
- Nexus: `askNexus()` tenta `window.claude.use("sample")` (prévia no claude.ai) e cai para `fetch("nexus_proxy.php")` (POST `{messages}`). O microfone 🎙️ só transcreve (Web Speech API, pt-BR) para o campo de texto; a Nexus responde com a frase no idioma-alvo entre aspas, e o 🔊 fala essa frase. Erros mapeados em `sendDuvida` (404/405 = PHP ausente; `not_configured`; 401; crédito; modelo; 429; rede).
- TTS: `speechSynthesis`, lang = variante, lento = rate 0.55. Sem voz do país → usa outro sotaque e avisa.

## Pendências para lançar
1. `PAYMENT_CHECK_URL` ainda é placeholder → precisa da URL `/exec` do Google Apps Script (webhook da Cakto grava e-mails pagos).
2. Falta link de checkout da Cakto na tela de paywall.
3. Revisão por falantes nativos das 462 falas (ja, zh, ar, ru principalmente).
4. Testar microfone/ditado e layout em iPhone real (Safari).

## Testes (Playwright + Chromium)
Rodam com o HTML servido por rota mockada (`https://lingex.test/`), stubs de speechSynthesis/SpeechRecognition/window.claude.
- `tests/e2e1.js` fluxo básico · `e2e2.js` 14 variantes × 11 situações com teste de domínio · `e2e3.js` Nexus (ok/405/sem chave/chave ruim/modelo/crédito/claude.ai), microfone, free vs premium · `layout.js` 4 tamanhos de celular · `globe.js` rótulos do globo · `sky.js` universo 3D (WebGL ligado, fallback sem WebGL, arrasto, sem estouro horizontal) · `lines/lines_ui.js` confere as 462 falas na tela + áudio (texto/idioma/rate).
- `tests/lib.js` lê `../index.html`. Ajuste o `require('playwright')` do topo para o seu caminho (`npm i -D playwright`). `lines/dump.js` injeta `window.__L` numa cópia do HTML para exportar `all.json`; `lines/check.py` valida a estrutura das falas.
- Rodar lentamente em segundo plano (os testes de 14 idiomas levam ~3–4 min).

## Convenções
- Interface em português do Brasil. Mobile-first (testar 320×568, 375×667, 390×844, 430×932). `100dvh`, `visualViewport` só quando o teclado realmente encolhe a tela.
- Ao mudar conteúdo de idioma: rodar `lines_ui.js` e `check.py`.
- Não colocar a chave da Anthropic em nenhum arquivo versionado.

## Fluxo de abertura
Splash (intro do planeta) → boas-vindas → destino/objetivo/nível/representante/resumo → Home. Quem já tem progresso salvo vê as mesmas boas-vindas: "Começar" refaz país/objetivo/nível (escolhas em branco; o progresso é mantido se o idioma for o mesmo e zerado se mudar) e "Continuar de onde parei" atravessa o buraco negro direto pra Home. "Trocar destino e recomeçar" (Perfil) apaga tudo. Teste: `tests/retorno.js`.
