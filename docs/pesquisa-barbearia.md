# Pesquisa: site de agendamento para barbearia

> Documento de base para o projeto. A parte visual (capa, botões, entradas) será montada a partir das referências que o cliente vai enviar.

---

## 1. Panorama: o que já existe no mercado

| Plataforma | O que faz bem | Onde deixa a desejar para o barbeiro |
|---|---|---|
| **Booksy** | Marketplace grande, lembretes, pagamentos | O cliente "é do app": a barbearia aparece ao lado dos concorrentes, e há reclamações de clientes que não recebem as comunicações do agendamento |
| **Trinks** | Gestão completa para salões, clínicas e barbearias (mais de 16 mil estabelecimentos) | Feito para salão de beleza em geral, não para barbearia. Muitas telas, curva de aprendizado alta |
| **AppBarber / BestBarbers / Cash Barber** | Agenda, caixa, estoque, fidelidade | Visual genérico (o site de todo mundo fica igual), mensalidade por profissional, pouco conteúdo sobre os cortes |
| **Agenda pelo WhatsApp / Instagram** | Zero custo, o cliente já usa | Barbeiro perde tempo respondendo, horário marcado errado, faltas sem aviso, nenhum histórico |

**Conclusão:** os sistemas atuais são **ferramentas de agenda genéricas**. Nenhum trata o **corte** como o centro: a ficha técnica do cliente, o tipo de cabelo (principalmente crespo e cacheado), a duração real de cada combo e a cultura de barbearia brasileira (nevou, pezinho, risco, mullet, waves, twist).

---

## 2. Diferenciais propostos (o que os outros não têm)

### Para o barbeiro
1. **Ficha técnica do corte por cliente.** O barbeiro registra o pente/altura da máquina (ex.: *"low fade 0 → 1,5, topo tesoura 4 cm, risco lado esquerdo"*) e uma foto. Na próxima visita, qualquer barbeiro da casa repete o corte idêntico. **Nenhum concorrente brasileiro faz isso direito.**
2. **Agenda que calcula a duração real.** O horário bloqueado é a soma dos serviços (degradê 40 min + barba 30 min + pigmentação 20 min = 1h30). Acabam os buracos e os atrasos.
3. **Anti-falta (no-show):**
   - Confirmação por WhatsApp com 1 toque, 24 h e 2 h antes.
   - **Sinal via Pix opcional** só para horários disputados (sexta à noite, sábado).
   - **Lista de espera automática:** se alguém cancela, o próximo da fila recebe a vaga na hora.
4. **Horário de baixa = promoção automática.** Terça de manhã vazia? O sistema pode oferecer um desconto nesses horários e encher a agenda.
5. **Painel do barbeiro:** ganhos do dia/semana, comissão, clientes que sumiram há mais de 45 dias (para chamar de volta).
6. **O cliente é da barbearia, não do app:** sem marketplace mostrando concorrente e sem taxa por agendamento.

### Para o cliente
7. **"Repetir meu último corte" em 1 toque.**
8. **Lembrete de retorno inteligente** pelo tipo de corte: fade/navalhado precisa voltar em ~15 dias, social em ~30, barba desenhada em ~10.
9. **Catálogo visual filtrado por tipo de cabelo** (liso, ondulado, cacheado, crespo) com indicação do barbeiro especialista em cada estilo. Quem tem cabelo crespo vê os cortes que funcionam para ele: o catálogo não fica limitado a fotos de cabelo liso.
10. **Escolher o barbeiro** pelas especialidades e pelo portfólio de cada um (freestyle, nevou, tranças, waves).
11. **Agendamento em grupo:** pai e filho juntos, noivo e padrinhos.
12. **Clube de assinatura** (corte ilimitado ou X cortes/mês) e **cartão fidelidade digital** (ex.: o 10º corte sai grátis).
13. **Funciona como app sem baixar nada (PWA):** abre pelo link do Instagram e do WhatsApp, leve no 4G fraco, pode ser "instalado" na tela inicial.

---

## 3. Guia completo de cortes masculinos

### 3.1 Base técnica: alturas da máquina (pentes)
| Pente | Altura aprox. | Uso |
|---|---|---|
| Navalha / "zero" sem pente | 0 mm | Skin fade, navalhado, pezinho |
| 0,5 | 1,5 mm | Começo do degradê |
| 1 | 3 mm | Laterais curtas |
| 1,5 | 4,5 mm | Transição |
| 2 | 6 mm | Militar, laterais |
| 3 | 9 mm | Social curto |
| 4 | 12 mm | Topo curto, buzz |
| 6 / 8 | 19 / 25 mm | Topo mais cheio na máquina |

### 3.2 Família do degradê (fade / "disfarçado")
- **Low fade:** o degradê começa baixo, perto da orelha e da nuca. É discreto e o mais pedido para trabalho.
- **Mid fade:** a transição fica na altura das têmporas. É o equilíbrio clássico.
- **High fade:** o degradê sobe até perto do topo. Visual marcante.
- **Skin fade / navalhado:** a base vai a zero na navalha, com a pele aparecendo.
- **Taper fade:** só as costeletas e a nuca são degradadas e as laterais ficam mais cheias. Muito pedido por cacheados e crespos.
- **Drop fade:** o degradê "cai" atrás da orelha, em curva.
- **Burst fade:** degradê em meia-lua ao redor da orelha. Combina com mullet e moicano.
- **Degradê na tesoura:** sem máquina, com transição suave. Para quem não gosta de lateral raspada.

> **Tendência 2026:** fades mais suaves e naturais, com transições menos marcadas que nos anos anteriores.

### 3.3 Cortes clássicos e populares
- **Social:** tesoura e máquina, laterais curtas e topo penteável.
- **Militar / reco:** tudo curto, máquina 1 a 3.
- **Corte americano:** laterais em fade e topo médio. Segue líder no Brasil.
- **Crop francês / crop texturizado:** franja curta reta ou texturizada, laterais em fade. Uma das maiores tendências de 2026.
- **Buzz cut com degradê:** máquina uniforme no topo e fade nas laterais.
- **Undercut:** lateral raspada sem transição, topo longo.
- **Pompadour / topete:** volume alto na frente, com pomada ou spray.
- **Side part / risca lateral:** clássico com risca feita na máquina.
- **Slick back:** cabelo penteado para trás com acabamento brilhante.
- **Mullet moderno:** curto na frente e nas laterais (muitas vezes em burst ou drop fade) e longo na nuca. Segundo lugar no Brasil.
- **Moicano / moicano disfarçado:** faixa central com degradê nas laterais.
- **Franja / cabelo médio:** cabelo masculino mais longo ganhou força, inclusive com risca central.
- **Grisalho valorizado:** cortes que destacam o prateado em vez de pintar.

### 3.4 Estilos brasileiros (cultura de quebrada, funk e futebol)
- **Nevou (platinado):** descoloração global até o loiro quase branco, muitas vezes com degradê. Precisa de descoloração e matização, de 1h30 a 3h. **Cobrar à parte e ter duração própria na agenda.**
- **Luzes / reflexo:** mechas descoloridas só no topo, comum em cacheados.
- **Pezinho:** acabamento na nuca e nas costeletas na navalha. É o serviço rápido entre um corte e outro, e dá para vender como **"manutenção" de 15 min**.
- **Risco / freestyle:** desenhos na lateral feitos na navalha ou no trimmer (riscos simples, nomes, formas). O preço varia com a complexidade.
- **Sobrancelha riscada:** um a três riscos na sobrancelha, feitos na navalha.
- **"Na régua" (line up):** contorno da testa e das têmporas perfeitamente reto. Essencial em crespos.
- **Mullet com degradê e pezinho:** a combinação "assinatura" das barbearias de periferia.
- **Cortes inspirados em jogadores:** em ano de Copa (2026) os pedidos disparam. Vale uma seção "em alta" no catálogo que o barbeiro atualiza.
- **Progressiva / selagem masculina:** alisamento, ou redução de volume, muito comum no Brasil.

### 3.4.1 Pesquisa regional: cortes da quebrada em São Paulo
Pesquisa feita em novembro de 2026 em tabelas de barbearias paulistanas e guias de estilo. **O perfil do Instagram de referência (@messin_do_corte) não pôde ser acessado neste ambiente**; os cortes dele entram quando as fotos forem enviadas.

| Estilo | Como é | Observação |
|---|---|---|
| **Corte disfarçado** | Topo com mais volume, laterais bem curtas descendo num degradê suave até a nuca, finalizada na navalha | Popular no Brasil desde os anos 2010; muitas vezes é o nome popular do degradê |
| **Corte do Jaca** | Mid fade começando cerca de dois dedos acima da orelha, normalmente com risco freestyle | Origem atribuída ao Jacarezinho (RJ); ganhou força em 2025 nas barbearias de SP e RJ |
| **Degradê navalhado** | Degradê com acabamento na navalha em vez da máquina | Citado entre os mais pedidos nas barbearias de SP |
| **Corte chavoso** | Visual inspirado em MCs de funk: mullet, burst fade, luzes ou nevou, pezinho na régua | Estilo jovem da periferia |
| **Cabelo blindado** | Topete alto e firme (estilo pompadour) | Fonte aponta criação na periferia de São Paulo |
| **Nevou / platinado** | Descoloração global até o branco | Preços em SP de R$ 80 a R$ 120 só o platinado; combos com corte e barba vão até R$ 280 |
| **Luzes / luzes brancas** | Mechas no topo | Corte + luzes chega a R$ 160 na Zona Leste |
| **Pezinho / perfil** | Contorno na navalha | R$ 10 a R$ 20 em SP |

**Faixa de preço na periferia de SP:** a barbearia popular de bairro cobra R$ 25 a R$ 45 pelo corte, contra R$ 80 a R$ 150 em regiões nobres.

**Fontes:** [Los Campos Barbearia (Jardim Helena, ZL) – Booksy](https://booksy.com/pt-br/265132_los-campos-barbearia_barbearias_1047773_sao-paulo) · [Barbearia KS Cortes – Booksy](https://booksy.com/pt-br/268999_barbearia-ks-cortes_barbearias_1047773_sao-paulo) · [Ribeiro Cortes](https://ribeirocortes.netlify.app/) · [Fresha – São Paulo](https://www.fresha.com/lp/en/tt/men's-haircuts/in/br-s%C3%A3o-paulo) · [Preço do corte em SP 2026 – Barbearia 215](https://barbearia215.com.br/blog/quanto-custa-corte-cabelo-masculino-sao-paulo) · [Corte do Jaca – Cortevibe](https://cortevibe.com.br/corte-jaca/) · [Corte do Jaca – All Things Hair](https://www.allthingshair.com/br/cabelos-masculinos/corte-do-jaca.html) · [Corte chavoso – All Things Hair](https://www.allthingshair.com/br/cabelos-masculinos/cabelo-chavoso.html) · [Corte disfarçado – Daquidali](https://daquidali.com.br/cortes-de-cabelo-masculino-disfarcado/)

### Tabela adotada no site (Barbe Skin)
| Pacote | Preço |
|---|---|
| Só corte | R$ 50 |
| Só barba | R$ 40 |
| Só sobrancelha | R$ 40 |
| Corte + Sobrancelha | R$ 60 |
| Corte + Barba | R$ 70 |
| Corte + Barba + Sobrancelha | R$ 80 |
| Platinado + Corte (sem progressiva) | R$ 120 |
| Platinado + Corte + Barba (sem progressiva) | R$ 130 |

### 3.5 Estilos afro: cabelo crespo e cacheado (tipos 3A a 4C)
**Classificação rápida:** 3A–3C são cachos (de largos a fechados); 4A–4C são crespos (de molas definidas ao zigue-zague bem fechado). O tipo muda a técnica, o tempo e o produto, por isso **o agendamento deve perguntar o tipo de cabelo**.

- **Afro / black power:** volume natural arredondado, moldado na tesoura ou na máquina com garfo.
- **Afro com taper ou degradê:** volume no topo com laterais e nuca degradadas. Moderno e muito pedido.
- **High top / flat top:** topo alto e reto ("caixa"), laterais em fade. Exige precisão.
- **Caesar cut:** curto e uniforme, com franja curta reta e contorno na régua.
- **360 waves:** ondas em espiral no cabelo curto. É fruto de escovação diária e uso de durag (touca). A barbearia corta curto e uniforme e pode vender kit (escova, pomada, durag).
- **Twist de esponja (sponge twist):** pequenas torções feitas com esponja própria no topo, com degradê nas laterais. Serviço rápido e muito procurado.
- **Twist de dedo / two-strand twist:** torções maiores e definidas, feitas à mão.
- **Dreads / locs:** começo (starter locs, por twist, crochê ou entrelace), manutenção da raiz e locs com degradê nas laterais. **Manutenção periódica = cliente recorrente.**
- **Tranças nagô (cornrows):** tranças rentes ao couro, retas ou desenhadas.
- **Box braids masculinas:** tranças soltas, quadradas na raiz.
- **Corte curto na máquina (low cut):** máquina baixa com régua bem feita.
- **Texturização / finalização de cachos:** definição com creme e fitagem, para quem quer manter o cacho.
- **Hidratação e umectação:** fios crespos são mais ressecados, então dá para oferecer como adicional.

**Cuidados técnicos que mostram autoridade (para colocar no site):**
- **Pseudofoliculite (pelo encravado)** é muito comum em pele negra com pelo crespo. A recomendação é evitar raspar rente demais na barba, usar máquina ou trimmer em vez de lâmina e esfoliar antes. **Oferecer "barba sem encravar" como serviço específico** é um diferencial real e raro.
- Usar navalha só no contorno (régua), não na área toda, em quem tem tendência a encravar.
- Óleo e loção calmante pós-barba.

### 3.6 Estilos de barba
- **Barba completa / lenhador:** cheia e longa, modelada na tesoura.
- **Barba média desenhada:** comprimento médio com contorno na navalha (bochecha e pescoço).
- **Barba por fazer (stubble):** 3 a 5 mm na máquina. Segue entre as preferidas em 2026.
- **Degradê na barba (beard fade):** a costeleta degrada até se fundir com o fade do cabelo.
- **Cavanhaque:** só queixo e bigode.
- **Van Dyke:** cavanhaque pontudo com bigode separado.
- **Barba fina / chin strap:** linha fina acompanhando o maxilar.
- **Bigode:** chevron (grosso), handlebar (pontas viradas), lápis (fino).
- **Barba na navalha / barboterapia:** toalha quente, espuma e navalha. É uma experiência premium.
- **Pigmentação de barba:** preenche falhas e escurece.
- **Barba afro / sem encravar:** veja a seção 3.5.

### 3.7 Serviços adicionais
Sobrancelha (pinça, navalha ou riscada) · depilação de nariz e orelha com cera · limpeza de pele · hidratação · pigmentação capilar · luzes · nevou · progressiva/selagem · relaxamento · corte infantil · dia do noivo · combos.

---

## 4. Tabela de preços sugerida (referência 2026)

Valores de referência de mercado. **Substituir pelos preços reais da barbearia.** Em 2026 o corte simples custa de R$ 25 a R$ 35 em barbearias populares, de R$ 40 a R$ 60 nas intermediárias e de R$ 70 a R$ 120 nas premium. A barba fica entre R$ 20 e R$ 90 conforme o padrão. Em Belo Horizonte, o preço médio do corte chegou a R$ 73 em junho de 2026.

| Serviço | Duração | Popular | Intermediária | Premium |
|---|---|---|---|---|
| Corte social / máquina | 30 min | R$ 30 | R$ 45 | R$ 80 |
| Degradê (low/mid/high/taper) | 40 min | R$ 35 | R$ 50 | R$ 90 |
| Navalhado / skin fade | 45 min | R$ 40 | R$ 55 | R$ 95 |
| Corte na tesoura | 45 min | R$ 40 | R$ 60 | R$ 100 |
| Corte afro / crespo | 45 min | R$ 35 | R$ 55 | R$ 90 |
| Pezinho / manutenção | 15 min | R$ 15 | R$ 20 | R$ 35 |
| Risco / freestyle (simples) | +10 min | R$ 10 | R$ 15 | R$ 25 |
| Sobrancelha | 10 min | R$ 10 | R$ 15 | R$ 25 |
| Barba simples / desenhada | 30 min | R$ 25 | R$ 35 | R$ 60 |
| Barboterapia (toalha quente) | 40 min | R$ 35 | R$ 50 | R$ 90 |
| Barba sem encravar (afro) | 35 min | R$ 30 | R$ 40 | R$ 70 |
| Pigmentação (cabelo ou barba) | 20 min | R$ 20 | R$ 30 | R$ 50 |
| Twist de esponja | 40 min | R$ 40 | R$ 60 | R$ 100 |
| Nevou / platinado | 2h–3h | R$ 120 | R$ 180 | R$ 300 |
| Luzes | 1h30 | R$ 80 | R$ 120 | R$ 200 |
| Tranças nagô | 1h–2h | R$ 60 | R$ 100 | R$ 180 |
| Manutenção de dreads | 1h–2h | R$ 80 | R$ 130 | R$ 220 |
| Progressiva masculina | 1h30 | R$ 70 | R$ 110 | R$ 180 |
| **Combo corte + barba** | 1h10 | R$ 55 | R$ 75 | R$ 130 |
| **Combo corte + barba + sobrancelha** | 1h20 | R$ 65 | R$ 85 | R$ 145 |
| Corte infantil | 30 min | R$ 25 | R$ 40 | R$ 70 |

---

## 5. Como funciona o agendamento (fluxo proposto)

1. **Escolher serviços:** um ou vários, com a soma do preço e do tempo na hora.
2. **Tipo de cabelo** (opcional): liso, ondulado, cacheado ou crespo. Filtra os barbeiros especialistas.
3. **Escolher o barbeiro**, ou "qualquer um disponível".
4. **Escolher o dia da semana** num calendário que mostra só os dias abertos, com os lotados em cinza.
5. **Escolher o horário:** só aparecem os horários em que cabe a duração total do combo.
6. **Nome + WhatsApp** (sem cadastro obrigatório; login rápido opcional para ver o histórico).
7. **Confirmação**, com botão "adicionar ao calendário" e mensagem de WhatsApp. Sinal Pix opcional.
8. Lembretes 24 h e 2 h antes, com botões confirmar, remarcar e cancelar.

**Configurações do dono:** dias e horários de funcionamento por barbeiro, intervalo de almoço, folgas e feriados, antecedência mínima e máxima, política de cancelamento.

### Estrutura de dados (resumo)
- `barbeiros`: nome, foto, especialidades, horários de trabalho.
- `servicos`: nome, categoria (cabelo, barba, química, afro, extra), preço, duração.
- `clientes`: nome, WhatsApp, tipo de cabelo, **ficha técnica** (notas + fotos).
- `agendamentos`: cliente, barbeiro, serviços, início, fim, status (pendente, confirmado, concluído, faltou, cancelado).
- `bloqueios`: folgas, feriados, intervalos.

---

## 6. Sugestão de tecnologia
- **Front-end:** site responsivo e PWA (abre como app no celular), foco em mobile, porque a maior parte dos clientes chega pelo link do Instagram e do WhatsApp.
- **Back-end:** Supabase (banco Postgres + login + armazenamento das fotos da ficha), com custo zero no início.
- **Hospedagem:** Netlify ou Vercel (grátis no começo).
- **WhatsApp:** fase 1 com links de mensagem pronta (grátis); fase 2 com a API oficial para lembretes automáticos.

---

## 7. Próximos passos
1. **Aguardando as referências visuais** do cliente: capa (hero), botões, entradas e animações.
2. Informações da barbearia: nome, logo e cores, endereço, WhatsApp, Instagram, barbeiros e especialidades, horários de funcionamento e preços reais.
3. Decidir se haverá sinal via Pix e clube de assinatura na primeira versão.
4. Montar o protótipo do site com o visual das referências e a agenda funcionando.

---

### Fontes
- [Booksy Brasil](https://biz.booksy.com/pt-br) · [Avaliações Booksy – Capterra](https://www.capterra.com/p/142741/Booksy/reviews/?page=2) · [Trinks – App Store](https://apps.apple.com/ng/app/trinks-com/id628518776) · [AppBarber PRO](https://apps.apple.com/app/id1602535418) · [BestBarbers](https://apps.apple.com/br/app/bestbarbers/id1501336370)
- [Melhores apps de barbeiro 2026 – Goldie](https://heygoldie.com/blog/best-booking-apps-for-barbers) · [Zenoti – Barber booking apps](https://www.zenoti.com/blog/best-barber-booking-apps)
- [Tendências de cortes masculinos 2026 – Beleza na Web](https://www.belezanaweb.com.br/loucas-por-beleza/tendencias-de-cortes-masculinos-para-2026/) · [Tendências de barbearia 2026 – Beleza na Web](https://www.belezanaweb.com.br/loucas-por-beleza/tendencias-de-barbearia-para-2026/) · [5 cortes em alta 2026 – Catraca Livre](https://catracalivre.com.br/saude-bem-estar/5-cortes-de-cabelo-masculino-em-alta-em-2026/) · [Cortes de Carnaval – Metrópoles](https://www.metropoles.com/vida-e-estilo/cortes-masculinos-carnaval) · [Cortes inspirados em jogadores – Portal Tela](https://www.portaltela.com/entretenimento/celebridades/2026/06/09/copa-do-mundo-5-cortes-de-cabelo-inspirados-em-jogadores/)
- [Tabela de preços de barbearia – FreelaSemCrise](https://www.freelasemcrise.com.br/blog/tabela-precos-barbearia) · [Preço do corte em BH – Portal Tela](https://www.portaltela.com/noticias/economia/2026/06/22/corte-masculino-em-bh-fica-mais-caro-media-supera-r-70/) · [Barbearia Morais – Booksy](https://booksy.com/pt-br/130450_barbearia-morais_cabelo_861476_joinville) · [Barbearia Salve Man – Booksy](https://booksy.com/pt-br/9507_barbearia-salve-man_barbearias_1047773_sao-paulo)
