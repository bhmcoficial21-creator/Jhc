# BRIEFING — E-commerce de Moda de Grife (v0.5)

> Documento-base do projeto. Atualizar a cada rodada. Pode ser colado em qualquer IA ou entregue a um dev junto com `loja.html`.

## 1. Visão
Loja online de moda de grife (streetwear/luxo): tênis, conjuntos, camisetas, calças, shorts, cintos, bolsas (bags) e óculos (lupas).
Experiência premium: visual limpo, fotos grandes e realistas, descrições ricas (não só preço e tamanho), compra rápida no celular.

**Nome da loja:** Chefiinho das Grifes · Instagram: @chefiinhodasgrife (≈3,2 mil seguidores)
**Posicionamento (da bio):** artigos de luxo premium · produtos legítimos e originais ® · +2 mil clientes satisfeitos.
**Marcas trabalhadas:** Lacoste, Boss, Gucci, Louis Vuitton (confirmar lista completa).
**Identidade visual (tirada dos posts do Instagram):**
- Fundo escuro, **parede de concreto** e **arara de metal suspensa** com as peças em cabide e etiqueta (roupas).
- **Vitrine/estante preta com LED quente** embaixo de cada prateleira (tênis).
- Logo com **coroa** + "CHEFIINHO DAS GRIFES"; marca d'água @chefiinhodasgrife nas fotos.
- Fotos de estúdio/IA, sem pessoa na maioria; algumas com "modelo invisível" (roupa sentada na cadeira com óculos flutuando).
- Posts de lifestyle: frases de motivação ("a vida é um jogo…"), moto, cidade à noite — vibe streetwear de quebrada com luxo.
**Marcas vistas nos posts:** Nike (Shox TL, Air Max 95, Air Max Plus), Mizuno (Wave Prophecy), Adidas (Yeezy 350, Adizero), Moncler, Boss, Lacoste, Fred Perry, EA7 Emporio Armani, Armani Exchange, Diesel, Prada, Gucci, Calvin Klein Jeans, Tommy Hilfiger.
**Categoria forte:** camisetas/polos de marca e tênis. Conjuntos (Boss, Prada) em seguida.
> ⚠️ O avatar atual lembra um personagem de filme protegido por direitos autorais. Não usar no site — criar um mascote **original** da marca (designer ou IA), mantendo a ideia do "chefinho". Também não usar logotipos oficiais das grifes como elementos de design; citar o nome da marca no produto é ok.

## 2. Público e tom
- Público jovem/adulto que acompanha moda e marcas pelo Instagram. Forte apelo de **autenticidade** (medo de réplica) — reforçar garantia em todo o site.
- Tom: confiante, exclusivo, direto. Textos feitos pelo copywriter (Montanhar).
- Prioridade: **mobile first** (a maioria das vendas vem do Instagram, pelo celular).

## 3. Catálogo — estrutura de cada produto
Cada produto precisa destes campos (formato do array `PRODUTOS` no `loja.html`):

| Campo | Exemplo | Quem preenche |
|---|---|---|
| id | `am270` | sistema |
| nome | Air Max 270 | loja |
| marca | Nike | loja |
| categoria | tenis / conjuntos / camisetas / calcas / shorts / cintos / bolsas / oculos | loja |
| preco / precoAntigo | 1299.90 / 1499.90 | loja |
| cores | `{nome, hex, fotos:[...], estoque:{...}, modeloIA}` | loja |
| tamanhos + estoque (por cor) | `estoque:{ "M": 3, "G": 0 }` · tênis 37–44 · acessórios `"Único"` | loja |
| fotos (gerais) | `fotos:[...]` — vitrine, lançamento, arara com todas as cores | foto real + modelo IA |
| frase | 1 linha | **Montanhar** |
| descricao | array de 2–3 parágrafos curtos | **Montanhar** |
| detalhes | lista: material, caimento, acabamento, origem | **Montanhar** + loja |
| comoUsar / combina | texto + ids de produtos para "Complete o look" | **Montanhar** |
| cuidados | lavagem, conservação | loja |
| tags | lançamento, mais vendido, últimas peças | loja |

Textos com a marca `[Montanhar]` no `loja.html` são provisórios.

## 4. Imagens (padrão de qualidade)
- **Sempre partir da foto real da peça** (fundo neutro, boa luz, alta resolução, mín. 2000px no lado maior).
- Fotos de detalhe obrigatórias: etiqueta, costura, textura, solado (tênis), fecho/ferragem (bolsas, cintos).
- **Modelo artificial (IA):** vestir a peça real em modelo gerado por IA para o cliente imaginar o caimento.
  - A peça na imagem final tem que ser **fiel à real** (cor, logo, estampa, proporção). Nada de "melhorar" a roupa — evita devolução e problema com o Código de Defesa do Consumidor.
  - Manter 2–4 modelos fixos (mesmo rosto/corpo em todo o site) = identidade da marca.
  - Sinalizar discretamente "imagem ilustrativa com modelo digital" na página do produto (já automático no site).
  - Informar altura/tamanho que a modelo "veste" (campo `modeloInfo`, ex.: "modelo 1,72 m veste M").
- Formato no site: WebP, proporção 4:5, carregamento lazy.
- **Como as fotos entram no código:** pasta `img/` (ver `img/LEIA-ME.md`). Enquanto a foto não existe, o site mostra um cenário provisório (concreto + arara ou vitrine LED) com "foto em breve".
- **Nome dos arquivos:** `<produto>-<cor>.webp` · ex.: `am270-preto.webp`, `ea7-vermelho-modelo.webp`.
- **Cuidado com erros de IA nas fotos:** na foto de lançamento do Air Max 270 está escrito "AIR27C" e "AI70" em vez de 270; na EA7 os textos pequenos estão embaralhados. Para loja que vende **original**, letra/logo errado faz o cliente desconfiar de réplica → refazer ou corrigir antes de usar como foto principal.

### Fluxo do modelo IA (caimento)
1. Criar a modelo base (sempre a mesma: rosto, corpo, altura, pose neutra, fundo concreto da marca).
2. Para cada peça: enviar a foto real da peça + a modelo → gerar a modelo vestindo.
3. Conferir: cor, logo, estampa e proporção iguais à peça real.
4. Salvar como `<produto>-<cor>-modelo.webp` e mandar aqui → entra no campo `modeloIA`.

## 5. Páginas
1. **Home** — banner/hero, faixa de marcas, categorias, lançamentos, garantias, mais vendidos, looks prontos, catálogo, prova social (Instagram), newsletter. ✅
2. **Catálogo** — filtros (categoria, tamanho, marca, preço), busca, ordenação. ✅
3. **Página do produto** — galeria com zoom, troca de cor muda as fotos, tamanho com estoque, guia de medidas, abas de descrição, "complete o look", frete por CEP, link direto `loja.html#p-<id>`. ✅
4. **Sacola** — gaveta lateral, quantidade (limitada ao estoque), cupom, barra de frete grátis. ✅
5. **Checkout** — dados, endereço (CEP automático via ViaCEP), frete, pagamento (Pix, cartão parcelado, boleto). ✅ layout — na fase 1 envia o pedido pelo WhatsApp.
6. **Institucional** — sobre, trocas e devoluções, autenticidade/garantia, FAQ. ✅ (textos provisórios)
7. **Minha conta** (fase 2) — pedidos, rastreio, favoritos.

## 6. Funcionalidades
- [x] Grid de produtos com 2ª foto no hover
- [x] Modal de produto: cores, tamanhos, galeria, descrição em abas
- [x] Sacola com localStorage
- [x] Checkout (layout) com Pix / cartão / boleto → pedido enviado ao WhatsApp
- [x] Botão WhatsApp flutuante
- [x] Busca, favoritos (localStorage), cupons (`LOJA.cupons`)
- [x] Frete estimado por CEP (ViaCEP + tabela simulada)
- [ ] Integração de pagamento real (ver item 7)
- [ ] Cálculo de frete real (Correios / Melhor Envio)
- [ ] Painel admin para cadastrar produtos
- [ ] Pixel Meta + Google Analytics
- [ ] Integração com feed do Instagram

## 7. Pagamento — decisão pendente
O HTML sozinho **não processa pagamento**. Opções:
- **A) Mercado Pago Checkout Pro / Link de pagamento** — mais rápido; o site manda o cliente para o checkout seguro do MP (Pix, cartão, boleto). Funciona com site simples na HostGator.
- **B) WooCommerce (WordPress) na HostGator** — loja completa com painel, estoque e plugins de MP/PagSeguro; o template vira tema.
- **C) Plataforma pronta (Nuvemshop, Shopify, Yampi)** — menos manutenção; o design é aplicado como tema. Hospedagem fica com a plataforma, HostGator só para o domínio.

## 8. Hospedagem
- Conta HostGator existente. Domínio: _[definir]_.
- Site estático (fase 1): enviar `loja.html` (pode renomear para `index.html`) + pasta `img/` via Gerenciador de Arquivos do cPanel para `public_html`.
- SSL (https) gratuito ativado no cPanel — obrigatório para loja.

## 9. Configuração rápida (topo do `<script>` no `loja.html`)
- `LOJA.whatsapp` — número com DDI+DDD, só dígitos **[definir]**
- `LOJA.freteGratisAcima`, `LOJA.descontoPix`, `LOJA.parcelasSemJuros`, `LOJA.cupons`
- `MARCAS` — faixa rolando · `LOOKS` — looks prontos da home
- Cores e fontes: variáveis no `:root` do CSS (`--gold`, `--bg`, `--serif` etc.)

## 10. Referências
- Origem: Instagram (prints/links enviados pelo cliente).
- Organizar em pasta do Google Drive: `Referências/Layout`, `Referências/Produtos`, `Referências/Elementos`.
- Para cada referência, anotar: o que gostou (cor, botão, layout, animação).

## 11. Roadmap
- **Fase 1 (agora):** template visual + estrutura de produtos + briefing ✅
- **Fase 2:** aplicar referências do cliente (botões, template, layout, branding), logo final, mascote original
- **Fase 3:** cadastrar produtos reais, fotos + modelo IA, textos do Montanhar
- **Fase 4:** pagamento + frete reais, testes de compra
- **Fase 5:** publicar na HostGator, domínio, SSL, analytics

## 12. Instrução para outra IA / dev
> "Este é o briefing de um e-commerce de moda de grife. O arquivo `loja.html` é o template atual (HTML + CSS + JS em um arquivo só). Mantenha a estrutura do array `PRODUTOS` e os padrões visuais (tema escuro, dourado #c9a24a, concreto + arara para roupas, vitrine LED para tênis, coroa no logo, serifada nos títulos). Fotos ficam na pasta `img/`. Aplique as alterações pedidas sem quebrar sacola, modal de produto e checkout. Devolva o arquivo completo."

## Histórico
- **v0.1 — 06/11/2026:** base criada (briefing + template inicial).
- **v0.2 — 06/11/2026:** marca Chefiinho das Grifes aplicada (nome, slogan da bio, marcas, dourado #c9a24a, @ do Instagram).
- **v0.3 — 06/11/2026:** identidade dos posts: tema escuro, cenário concreto+arara (roupas) e vitrine LED (tênis), logo com coroa, faixa de marcas rolando, catálogo de exemplo.
- **v0.4 — 06/11/2026:** primeiras fotos reais (Air Max 270, EA7, CK Jeans, Lacoste, Gucci 1921). Galeria com espaço "Modelo IA vestindo".
- **v0.5 — 07/11/2026:** template reconstruído no repositório: `loja.html` completo (home, catálogo com filtros/busca, modal de produto, guia de medidas, sacola com cupom e barra de frete grátis, checkout com CEP automático → pedido no WhatsApp, páginas institucionais), cenários provisórios automáticos enquanto as fotos não chegam, pasta `img/` com padrão de nomes. Aguardando referências de botão, template, layout e branding.
