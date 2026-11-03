# Cardápio digital NFC · Brass Brew (Doses e Drinks)

Arquivo base do projeto. Tudo que já foi decidido e levantado está aqui.
Leia inteiro antes de começar e mantenha atualizado conforme o projeto avança.

---

## 0. Andamento

| Etapa | Status | Arquivos |
|---|---|---|
| Entrada (letreiro) + tela inicial | ✅ feito (v1) | `index.html`, `src/styles.css`, `src/app.js` |
| `src/data.js` com todos os itens | ✅ feito (sem fotos, sem preços) | `src/data.js` |
| Lista com abas, busca e grade colorida | ✅ feito (v1) | `src/cardapio.js` |
| Reels de drinks com copo desenhado (enche + inclina em 3D) | ✅ feito (v1) | `src/vessel.js`, `src/cardapio.js` |
| Fotos dos drinks (dguests e site oficial) | ⛔ bloqueado: `www.dguests.com.br` e `framerusercontent.com` fora da rede liberada da sessão | — |
| Sacola | ⏳ (por enquanto "Adicionar" só conta itens) | — |
| Chamado do garçom em tempo real | ⏳ fase 2 (hoje só mostra "Chamado enviado" no celular) | — |

### Doses e Drinks (como funciona)
Referências: dois elementos do Awwwards da Bucks Sauce.
- **"Product grid animation"** → a lista: cada drink é um cartão na cor dele, com o nome grande em cima e o
  copo no meio. Tocar no cartão abre o reels e o copo "cresce" do cartão para a tela cheia (View Transitions,
  onde o navegador suporta).
- **"Bottle stop motion animation"** → o copo no reels: enche **camada por camada**, cada ingrediente caindo
  em passos (stop motion), na ordem da receita. Pedaços (gelo, rodela, casca, hortelã, nibs, melancia,
  abacaxi, espuma) são desenhados como peças; líquidos como faixas.
- Arrastar o copo para os lados **inclina em 3D**; o líquido fica nivelado e balança com atraso, e o copo
  volta balançando. Tocar enche de novo. `touch-action: none` só no copo.
- Atrás do copo, o nome gigante corre em duas faixas (sólida e contorno).
- Copos: `baixo` (clássicos e maquiados), `long` (Gin Tônica, Mojito), `taca` (spritz), `garrafa` (engarrafados).
- Drinks sem ingrediente confirmado (Exclusivos, Seco de Ervas, 3 Spritz) mostram o copo cheio numa cor só
  e o aviso "Ingredientes a confirmar com o bar". Clássicos mostram "Receita clássica · a confirmar".
- Doses, garrafas, combos e sem álcool aparecem como lista simples, com "+".
- Busca procura por nome e por ingrediente, em todas as categorias.
- Rotas: `#drinks/<categoria>` e `#drink/<id>` (link direto pula a entrada).
- **Fotos:** quando chegarem, basta preencher `foto: 'public/img/<id>.png'` no `data.js`; o cartão e o reels
  trocam o desenho pela foto automaticamente (a inclinação continua funcionando).
- As cores de cada drink e de cada ingrediente são só visuais e ficam em `data.js` (`cor` e `BB.camadas`).

### Entrada (como funciona)
Referência: vídeo de um elemento do Awwwards (letreiro "KFC Rewards"). Foi adaptado para o perfil do Brass:
1. Tela noturna com o **letreiro** no centro: moldura preta, painel de latão escovado, linhas de LED
   e o nome "BRASS BREW" pequeno, repetido ao fundo.
2. O nome **BRASS BREW** gigante atravessa o painel da direita para a esquerda e vai apagando.
3. **Três barras** piscam no centro, como um carregamento.
4. Entra a palavra **"SAÚDE!"**.
5. O letreiro sobe para o topo e vira o destaque da tela inicial, com a faixa contínua
   "BRASS BREW ✦ DOSES & DRINKS" e um reflexo metálico passando. O resto do início entra em sequência.

- Duração total ≈ 5 s. Botão **"Pular"** e toque no letreiro encerram a entrada.
- `prefers-reduced-motion`: pula a entrada e mostra o nome parado.
- Mesa lida de `?mesa=7` (vira "07"). Sem parâmetro mostra "Mesa —".
- Saudação muda pelo horário (Bom dia / Boa tarde / Boa noite).
- "Ver drinks" e "Pedir a conta" ainda só mostram um aviso; serão ligados nas próximas etapas.
- Para testar: `python3 -m http.server` na pasta e abrir `http://localhost:8000/?mesa=7`.

---

## 1. O que estamos construindo

Um cardápio digital de **doses e drinks** para o bar **Brass Brew**. O cliente encosta o celular num
**cartão NFC** na mesa (ou lê o QR Code do mesmo cartão) e o cardápio abre direto no navegador, sem app.

Escopo: **somente a seção Doses e Drinks**. Cervejas e cozinha ficam de fora.

Formato principal: **"reels de drinks"**. Cada drink ocupa a tela inteira, o cliente desliza para cima
para ver o próximo, e o drink na tela é **interativo** (dá para mexer com o dedo).

---

## 2. O bar

| Campo | Valor |
|---|---|
| Nome | Brass Brew |
| Tipo | Cervejaria artesanal com bar de drinks, DJ e música ao vivo |
| Local | Casa das Caldeiras, Av. Mário de Andrade, 1820, Barra Funda, São Paulo - SP, 01156-001 |
| Funcionamento (pode estar desatualizado) | Qui 18h–1h · Sex 18h–2h · Sáb 12h–2h · Dom 12h–0h |
| Instagram | @brassbrew |
| Site | https://brassbrew.com |
| Cardápio oficial de drinks | https://brassbrew.com/cardapio-doses-e-drinks (só nomes, sem descrição nem preço) |
| Cardápio do link da bio | dguests.com.br/cardapio/brassbrew (deve ter descrição e preço; ainda não foi lido) |

---

## 3. Dados dos drinks

Legenda de status:
- ✅ **confirmado** pelo bar (site ou matéria)
- ⚠️ **receita padrão**: é a receita clássica do drink, falta confirmar como o Brass faz
- ❌ **pendente**: ainda não temos a informação

**Nenhum preço está confirmado.** Os preços dos engarrafados vêm de uma matéria de lançamento e podem estar desatualizados.

### 3.1 Exclusivos Brass (têm foto no site)
| Drink | Ingredientes | Status | Foto (site oficial) |
|---|---|---|---|
| Raiz da Serra | — | ❌ | https://framerusercontent.com/images/l3kAB8kMArfCUyENwutVvet7W5k.jpg |
| Studebaker | — | ❌ | https://framerusercontent.com/images/5OWQYkjz0RlomycOeCyUkYD5BI0.jpg |
| Areias | — | ❌ | https://framerusercontent.com/images/LSDSv8TSapSHTVbcUcP3kFRhk.jpg |
| Águas Brancas | — | ❌ | https://framerusercontent.com/images/c5MHuZPqF87Iavyrnpef6BNy6Gk.jpg |

A ligação foto → drink foi deduzida pela ordem das imagens no site. Confirmar abrindo as fotos.

### 3.2 Engarrafados (garrafa de 500 ml, serve 5 drinks)
| Drink | Ingredientes | Perfil | Preço na matéria | Status |
|---|---|---|---|---|
| Serra do Mar | rum envelhecido, xarope de coco tostado, suco de abacaxi fresco | levemente doce, tropical | R$ 125 | ✅ ingredientes |
| Santos-Jundiaí | vinho tinto, redução de frutas vermelhas, laranja, abacaxi, toque de amaro | refrescante, frutado | R$ 125 | ✅ ingredientes |
| Mooca | cachaça envelhecida, vermute tinto, Cynar, nibs de cacau | encorpado, notas de chocolate | R$ 155 | ✅ ingredientes |
| Conde Matarazzo | gin, Campari, vermutes dry e bianco infusionados com melancia fresca | seco, leve amargor, refrescante | R$ 155 | ✅ ingredientes |

### 3.3 Clássicos
| Drink | Receita padrão | Status |
|---|---|---|
| Negroni | gin, Campari, vermute tinto, casca de laranja | ⚠️ |
| Rabo de Galo Sour | cachaça, vermute tinto, Cynar, limão, açúcar, clara (espuma) | ⚠️ |
| Caipirinha | cachaça, limão, açúcar, gelo | ⚠️ |
| Caipiroska | vodka, limão, açúcar, gelo | ⚠️ |
| Fitzgerald | gin, limão-siciliano, xarope de açúcar, angostura | ⚠️ |
| Gin Tônica | gin, água tônica, limão ou especiarias | ⚠️ |

### 3.4 Clássicos maquiados (versões da casa)
| Drink | Ingredientes | Status |
|---|---|---|
| Um Old Fashioned | base clássica: bourbon, açúcar, angostura, casca de laranja. Versão da casa desconhecida | ❌ |
| Seco de Ervas | — | ❌ |
| Nosso Mojito | base clássica: rum, hortelã, limão, açúcar, água com gás. Versão da casa desconhecida | ❌ |

### 3.5 Spritzzzz
| Drink | Ingredientes | Status |
|---|---|---|
| La Dona Mala Onda | — | ❌ |
| Il Vero Verde | — | ❌ |
| Tomatto | — | ❌ |
| Clássico | base clássica: Aperol, espumante, água com gás, laranja | ⚠️ |

### 3.6 Doses
Cachaça Saliníssima · Cachaça Arbórea · Rum Bacardi · Cynar · Cinzano Rosso · Aperol · Amaro Ramazzotti

### 3.7 Garrafas
Tequila José Cuervo Prata · Tequila José Cuervo Ouro · Vodka Ketel One · Whisky Jim Beam White ·
Whisky Johnnie Walker Black Label · Whisky Glenlivet · Gin Beefeater · Gin Tanqueray · Campari

### 3.8 Combos (garrafa + 6 energéticos)
Gin Beefeater · Gin Tanqueray · Vodka Ketel One · Whisky Jim Beam White · Whisky Johnnie Walker Black Label · Whisky Glenlivet

### 3.9 Sem álcool
Red Bull Tradicional ou Tropical (250 ml) · Kiro · Baer Mate · Tônica Tradicional ou Zero · Água com ou sem gás

---

## 4. Direção visual

Referência: a mesma linha do protótipo de pizza já feito (projeto `cardapio-nfc`), adaptada para a noite.

**Inspirações**
- **Site da FIX Dessert Chocolatier** (Awwwards): cada produto com cor forte própria, nome gigante
  correndo atrás do produto, ingredientes flutuando em volta.
- **Vídeo de referência (estilo "Chama Aí")**: tela inicial com "Chamar garçom", lista com busca e
  categorias, e "reels do prato" em tela cheia com "deslize para o próximo".
- **Letreiro de entrada** (elemento do Awwwards, "KFC Rewards"): painel com linhas de LED, nome gigante
  atravessando, três barras de carregamento e palavra final. Usado na entrada (ver seção 0).

**Adaptação para bar**
- Fundo noturno, com o **latão (brass)** como cor de assinatura: dourado escovado, brilho metálico.
- Cada drink ganha a cor do próprio líquido: Negroni rubi, Conde Matarazzo melancia, Il Vero Verde verde,
  Serra do Mar âmbar tropical.
- O nome do drink fica gigante atrás do copo, em faixa correndo (marquee).
- Os ingredientes flutuam em volta do copo: rodela de laranja, folha de hortelã, cubo de gelo, nibs de cacau, fatia de melancia.

**Tokens já definidos (`src/styles.css`)**
- Cores: `--night #0d0a07`, `--brass-hi #f4d68f`, `--brass #c9973f`, `--brass-mid #9a6a26`,
  `--brass-lo #5a3812`, `--brass-deep #2a1908`, `--cream #fbefd5`, `--muted #a8977c`.
- Fontes: **Anton** (títulos, letreiro) e **Inter** (interface), via Google Fonts.
  Trocar se o Brass tiver fontes oficiais.

**Interação do drink (diferente da pizza)**
- A pizza é vista de cima, por isso gira. O copo é visto de lado, então **não gira**: ele **balança**.
- Arrastar o dedo inclina o copo e o **líquido se mexe** (superfície ondulando), e o gelo bate e flutua.
- Opcional: o giroscópio do celular inclina o líquido. No iPhone isso exige pedir permissão com um toque.
- Ao trocar de drink, o copo entra com um "splash" leve.
- Respeitar `prefers-reduced-motion` desligando o balanço automático e a faixa correndo.

**Fotos**
- O ideal é cada drink fotografado de frente, com fundo recortado (PNG transparente) e todos no mesmo
  ângulo e altura de câmera.
- Enquanto não houver fotos, desenhar o copo por código (canvas ou SVG), com o tipo certo de copo:
  baixo (Negroni e Old Fashioned), taça (spritz), long drink (Gin Tônica e Mojito) e garrafa (engarrafados).

---

## 5. Telas

1. **Início (abre pelo NFC):** logo do Brass, "Mesa 07", botão grande "Chamar garçom", atalhos "Ver drinks" e "Pedir a conta".
2. **Lista:** busca + abas de categoria (Exclusivos, Engarrafados, Clássicos, Maquiados, Spritz, Doses, Garrafas, Combos, Sem álcool).
3. **Reels do drink:** tela cheia, copo interativo, nome, ingredientes em chips, preço, botão "Adicionar".
   Doses, garrafas, combos e sem álcool aparecem como **lista simples**, porque não precisam de reels.
4. **Sacola:** itens, quantidade, observação, total e "Enviar pedido".
5. **Chamado enviado:** confirmação com opção "Cancelar chamado".

Selos por item: `Exclusivo`, `Mais pedido`, `Novo`, `Indisponível no momento`.

---

## 6. NFC e link

- Gravar no cartão um **link curto que você controla**, ex.: `seudominio.com/m/brass?mesa=7`, para trocar o destino sem regravar.
- Chip **NTAG213** e **travar (lock)** após gravar, com o app NFC Tools.
- **QR Code no mesmo cartão** para quem tem NFC desligado ou um celular antigo.
- Mesa de metal atrapalha a leitura: usar tag anti-metal ou display de acrílico.
- O número da mesa vem de `?mesa=`. O app já lê isso no protótipo da pizza.

---

## 7. Estrutura técnica sugerida

Site estático primeiro, sem build, igual ao protótipo da pizza:
```
index.html
src/data.js      ← todos os drinks (fonte única de verdade)
src/app.js       ← telas, reels, interação do copo, sacola
src/styles.css   ← tokens (cores, fontes) e layout
public/img/      ← fotos recortadas dos drinks
```

Formato de cada item em `data.js`:
```js
{
  id: 'conde-matarazzo',
  nome: 'Conde Matarazzo',
  categoria: 'engarrafados',      // exclusivos | engarrafados | classicos | maquiados | spritz | doses | garrafas | combos | sem-alcool
  ingredientes: ['gin', 'Campari', 'vermute dry', 'vermute bianco', 'melancia'],
  perfil: 'Seco, leve amargor, refrescante',
  preco: null,                    // null = a confirmar
  volume: '500 ml · serve 5',
  copo: 'garrafa',                // baixo | taca | long | garrafa | dose
  cor: '#E2475B',                 // cor do líquido / fundo do slide
  flutuantes: ['melancia', 'gelo'],
  foto: null,                     // 'public/img/conde-matarazzo.png'
  selos: ['Exclusivo'],
  status: { ingredientes: 'confirmado', preco: 'pendente' },
  disponivel: true
}
```
Itens com `preco: null` mostram "Consulte" em vez de quebrar.

Depois (fase 2): **Supabase** com tabelas `itens`, `pedidos` e `chamados`, um painel simples para o dono mudar
preço e marcar esgotado, e chamados do garçom em tempo real. Deploy no Netlify ou Vercel.

---

## 8. Pendências (para resolver com o material que vai chegar)

- [ ] Prints do cardápio dguests com **descrição e preço** de cada drink
- [ ] Ingredientes dos **Exclusivos**, dos **Spritz** e dos **Maquiados**
- [ ] Confirmar como o bar faz os **Clássicos**
- [ ] **Fotos** de cada drink, de preferência recortadas e no mesmo ângulo (liberar `www.dguests.com.br` e `framerusercontent.com` na rede do ambiente, ou enviar os arquivos)
- [ ] Logo do Brass em vetor (SVG) e fontes ou cores oficiais, se existirem
- [ ] Número de mesas, para gerar os links e QR Codes
- [ ] Confirmar a palavra final da entrada ("SAÚDE!") ou trocar por outra do bar

## 9. Regras do projeto

- Mobile first, com 390 px de largura como referência. Testar em iPhone e Android.
- Textos em português do Brasil. Preço com `toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })`.
- **Nunca inventar** ingrediente nem preço. O que não foi confirmado fica marcado como pendente no `data.js`.
- `touch-action: none` só no copo, para o resto da tela continuar rolando.
- Usar sempre o mesmo copo e a mesma escala visual em todos os drinks.
- Bebida alcoólica: incluir no rodapé "Venda proibida para menores de 18 anos" e "Beba com moderação".

## 10. Ordem de trabalho

0. ✅ Entrada (letreiro) e tela inicial.
1. ✅ Montar `src/data.js` com todos os itens da seção 3, marcando o status de cada um.
2. ✅ Criar a tela de reels com o copo desenhado por código (todos os drinks, não só 2).
3. Validar a interação do copo (balançar, líquido e gelo) num celular de verdade.
4. ✅ Fazer a lista com categorias e busca, incluindo doses, garrafas, combos e sem álcool.
5. Fazer a sacola.
6. Trocar os desenhos pelas fotos reais e preencher preços e ingredientes conforme o material chegar.
