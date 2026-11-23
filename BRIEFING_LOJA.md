# BRIEFING — E-commerce de Moda de Grife (v0.4)

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
Cada produto precisa destes campos (já é o formato usado no `loja.html`, array `PRODUTOS`):

| Campo | Exemplo | Quem preenche |
|---|---|---|
| id | `tn-001` | sistema |
| nome | Tênis Runner Pro | loja |
| marca | (grife) | loja |
| categoria | tenis / conjuntos / camisetas / calcas / shorts / cintos / bolsas / oculos | loja |
| preco / precoAntigo | 1299.90 / 1499.90 | loja |
| cores | nome + código hex + fotos de cada cor | loja |
| tamanhos | roupa: PP–GG · tênis: 37–44 · acessórios: Único | loja |
| estoque por tamanho/cor | `{ "M": 3, "G": 0 }` | loja |
| fotos | 4–6 por cor (frente, costas, detalhe, modelo vestindo, look completo) | foto real + modelo IA |
| frase de impacto | 1 linha | **Montanhar** |
| descrição | 2–3 parágrafos curtos | **Montanhar** |
| detalhes | material, caimento, acabamento, origem | **Montanhar** + loja |
| como usar / combina com | sugestões de look | **Montanhar** |
| cuidados | lavagem, conservação | loja |
| tags | lançamento, mais vendido, últimas peças | loja |

## 4. Imagens (padrão de qualidade)
- **Sempre partir da foto real da peça** (fundo neutro, boa luz, alta resolução, mín. 2000px no lado maior).
- Fotos de detalhe obrigatórias: etiqueta, costura, textura, solado (tênis), fecho/ferragem (bolsas, cintos).
- **Modelo artificial (IA):** vestir a peça real em modelo gerado por IA para o cliente imaginar o caimento.
  - A peça na imagem final tem que ser **fiel à real** (cor, logo, estampa, proporção). Nada de "melhorar" a roupa — evita devolução e problema com o Código de Defesa do Consumidor.
  - Manter 2–4 modelos fixos (mesmo rosto/corpo em todo o site) = identidade da marca.
  - Sinalizar discretamente "imagem ilustrativa com modelo digital" na página do produto.
  - Informar altura/tamanho que a modelo "veste" (ex.: modelo 1,72 m veste M).
- Formato no site: WebP, proporção 4:5 (padrão de moda), carregamento lazy.
- **Como as fotos entram no código:** pasta `img/`. Cada cor tem `fotos:[...]` própria; o produto tem `fotos:[...]` gerais (ex.: arara com todas as cores). A última foto da galeria é o espaço do **modelo IA**: preencher `modeloIA:"img/<id>-<cor>-modelo.webp"` na cor (ou no produto).
- **Nome dos arquivos:** `<produto>-<cor>.webp` · ex.: `am270-preto.webp`, `ea7-vermelho-modelo.webp`.
- **Cuidado com erros de IA nas fotos:** na foto de lançamento do Air Max 270 está escrito "AIR27C" e "AI70" em vez de 270; na EA7 os textos pequenos estão embaralhados. Para loja que vende **original**, letra/logo errado faz o cliente desconfiar de réplica → refazer ou corrigir antes de usar como foto principal.

### Fluxo do modelo IA (caimento)
1. Criar a modelo base (sempre a mesma: rosto, corpo, altura, pose neutra, fundo concreto da marca).
2. Para cada peça: enviar a foto real da peça + a modelo → gerar a modelo vestindo.
3. Conferir: cor, logo, estampa e proporção iguais à peça real.
4. Salvar como `<produto>-<cor>-modelo.webp` e mandar aqui → entra no campo `modeloIA`.

## 5. Páginas
1. **Home** — banner/hero, categorias, lançamentos, mais vendidos, looks prontos, prova social (Instagram), newsletter.
2. **Categoria/Catálogo** — filtros (categoria, tamanho, cor, preço, marca), ordenação.
3. **Página do produto** — galeria com zoom, troca de cor muda as fotos, seleção de tamanho com estoque, guia de medidas, descrição completa, "complete o look", frete por CEP.
4. **Sacola (carrinho)** — gaveta lateral, quantidade, cupom, subtotal.
5. **Checkout** — dados, endereço (CEP automático), frete, pagamento (Pix, cartão parcelado, boleto).
6. **Institucional** — sobre, trocas e devoluções, autenticidade/garantia, contato, FAQ.
7. **Minha conta** (fase 2) — pedidos, rastreio, favoritos.

## 6. Funcionalidades
- [x] Grid de produtos com 2ª foto no hover
- [x] Modal de produto: cores, tamanhos, galeria, descrição em abas
- [x] Sacola com localStorage
- [x] Checkout (layout) com Pix / cartão / boleto
- [x] Botão WhatsApp flutuante
- [ ] Integração de pagamento real (ver item 7)
- [ ] Cálculo de frete real (Correios / Melhor Envio)
- [ ] Painel admin para cadastrar produtos
- [ ] Favoritos, busca, cupons
- [ ] Pixel Meta + Google Analytics
- [ ] Integração com feed do Instagram

## 7. Pagamento — decisão pendente
O HTML sozinho **não processa pagamento**. Opções:
- **A) Mercado Pago Checkout Pro / Link de pagamento** — mais rápido; o site manda o cliente para o checkout seguro do MP (Pix, cartão, boleto). Funciona com site simples na HostGator.
- **B) WooCommerce (WordPress) na HostGator** — loja completa com painel, estoque e plugins de MP/PagSeguro; o template vira tema.
- **C) Plataforma pronta (Nuvemshop, Shopify, Yampi)** — menos manutenção; o design é aplicado como tema. Hospedagem fica com a plataforma, HostGator só para o domínio.

## 8. Hospedagem
- Conta HostGator existente. Domínio: _[definir]_.
- Site estático (fase 1): enviar arquivos via Gerenciador de Arquivos do cPanel para `public_html`.
- SSL (https) gratuito ativado no cPanel — obrigatório para loja.

## 9. Referências
- Origem: Instagram (prints/links enviados pelo cliente).
- Organizar em pasta do Google Drive: `Referências/Layout`, `Referências/Produtos`, `Referências/Elementos`.
- Para cada referência, anotar: o que gostou (cor, botão, layout, animação).

## 10. Roadmap
- **Fase 1 (agora):** template visual + estrutura de produtos + briefing ✅
- **Fase 2:** aplicar referências do cliente, identidade visual (logo, cores, fontes)
- **Fase 3:** cadastrar produtos reais, fotos + modelo IA, textos do Montanhar
- **Fase 4:** pagamento + frete reais, testes de compra
- **Fase 5:** publicar na HostGator, domínio, SSL, analytics

## 11. Instrução para outra IA / dev
> "Este é o briefing de um e-commerce de moda de grife. O arquivo `loja.html` é o template atual (HTML + CSS + JS em um arquivo só). Mantenha a estrutura do array `PRODUTOS` e os padrões visuais (tema escuro, dourado #c9a24a, concreto + arara para roupas, vitrine LED para tênis, coroa no logo, serifada nos títulos). Fotos ficam na pasta `img/`. Aplique as alterações pedidas sem quebrar sacola, modal de produto e checkout. Devolva o arquivo completo."

## Histórico
- **v0.1 — 06/11/2026:** base criada (briefing + template inicial).
- **v0.2 — 06/11/2026:** marca Chefiinho das Grifes aplicada (nome, slogan da bio, marcas, dourado #c9a24a, @ do Instagram).
- **v0.3 — 06/11/2026:** identidade dos posts: tema escuro, cenário concreto+arara (roupas) e vitrine LED (tênis), logo com coroa, faixa de marcas rolando, catálogo de exemplo com as peças vistas (Shox TL, Wave Prophecy, Air Max 95, Moncler, Fred Perry, Diesel, Lacoste, Boss, Prada).
- **v0.4 — 06/11/2026:** primeiras fotos reais: Nike Air Max 270 (5 cores, foto recortada por cor + vitrine + lançamento), EA7 (vermelho/branco), Calvin Klein Jeans box logo, Lacoste LCST, Gucci 1921. Galeria com espaço "Modelo IA vestindo". Pacote `chefiinho-site.zip` pronto para HostGator.
