/* =========================================================
   QUIZ MAPA DA DOR (entrada do funil)
   Pergunta o que acontece no dia da pessoa (posição, pausas,
   dor, sinais, sono, estresse, comida, tentativas, rotina) e
   devolve um diagnóstico personalizado:
   - Índice de Congelamento (0 a 100)
   - Onde ela está no ciclo do Corpo Congelado
   - Tripé Religar (movimento, sono, alimentação)
   - Por que o que ela já tentou não resolveu
   - Plano dos 3 primeiros dias
   - Ofertas recomendadas pelas respostas
   ========================================================= */
(function () {
  const C = window.RELIGAR_CONFIG;
  const D = window.RELIGAR_DADOS;
  const L = window.RELIGAR_LOGICA;

  const r = {
    horas: null, levanta: null, regioes: [], regiaoFoco: null, intensidade: null,
    quando: null, sinais: [], sono: null, estresse: null, comida: [], tentativas: [], rotina: null, tempo: null
  };

  /* ---------- Perguntas ---------- */
  const PERGUNTAS = {
    horas: {
      titulo: "Quantas horas por dia você passa na mesma posição?",
      sub: "Sentado no computador, no volante, em pé no balcão ou repetindo o mesmo movimento.",
      opcoes: [["ate4", "Até 4 horas"], ["4a6", "De 4 a 6 horas"], ["6a8", "De 6 a 8 horas"], ["8a10", "De 8 a 10 horas"], ["mais10", "Mais de 10 horas"]]
    },
    levanta: {
      titulo: "De quanto em quanto tempo você muda de posição ou levanta?",
      opcoes: [["1h", "Mais ou menos a cada hora"], ["2h", "A cada 2 ou 3 horas"], ["almoco", "Só no almoço"], ["nunca", "Quase nunca, quando vejo já passou o dia"]]
    },
    quando: {
      titulo: "Quando a dor aparece?",
      opcoes: [["fim", "Só no fim do dia"], ["manha", "Já acordo com ela"], ["todo", "O dia todo"], ["noite", "À noite, atrapalha meu sono"]]
    },
    sono: {
      titulo: "Como têm sido suas noites?",
      opcoes: [["bem", "😴 Durmo bem e acordo descansado"], ["mais_ou_menos", "😐 Mais ou menos, acordo cansado"], ["mal", "😵 Durmo mal, demoro a pegar no sono ou acordo várias vezes"]]
    },
    estresse: {
      titulo: "E a pressão no trabalho?",
      opcoes: [["baixo", "Tranquila na maior parte do tempo"], ["medio", "Tem dias pesados"], ["alto", "Vivo no limite: prazo, meta, cobrança"]]
    },
    comida: {
      titulo: "Como é a sua comida num dia de trabalho?",
      sub: "Pode marcar mais de uma.",
      multi: true,
      opcoes: [["mesa", "Almoço na frente da tela ou correndo"], ["pulo", "Pulo refeições"], ["belisco", "Belisco besteira ou peço comida rápida"], ["agua", "Bebo pouca água"], ["bem", "Como bem e bebo água"]]
    },
    tempo: {
      titulo: "Quanto tempo por dia você consegue dedicar ao seu corpo?",
      sub: "Somando tudo, ao longo do dia. Seja sincero: o plano é montado em cima disso.",
      opcoes: [["3", "⏱️ 3 minutos: o dia é corrido demais"], ["5", "⏱️ 5 minutos"], ["10", "⏱️ 10 minutos"]]
    },
    tentativas: {
      titulo: "O que você já tentou para a dor?",
      sub: "Pode marcar mais de uma.",
      multi: true,
      opcoes: [["remedio", "💊 Remédio para dor"], ["massagem", "💆 Massagem de vez em quando"], ["youtube", "📱 Alongamento aleatório do YouTube"], ["academia", "🏋️ Academia (e abandonei)"], ["laboral", "🏢 Ginástica laboral da empresa"], ["nada", "Ainda não tentei nada"]]
    }
  };

  /* ---------- Etapas ---------- */
  const ETAPAS = [
    { id: "intro", render: renderIntro, valido: () => true, textoBotao: "Fazer o Mapa da Dor" },
    { id: "horas", render: (el) => renderEscolha(el, "horas"), valido: () => !!r.horas, auto: true },
    { id: "levanta", render: (el) => renderEscolha(el, "levanta"), valido: () => !!r.levanta, auto: true },
    { id: "regioes", render: renderRegioes, valido: () => r.regioes.length > 0 },
    { id: "foco", pular: () => r.regioes.length <= 1, render: renderFoco, valido: () => !!r.regiaoFoco, auto: true },
    { id: "intensidade", render: renderIntensidade, valido: () => r.intensidade !== null },
    { id: "quando", render: (el) => renderEscolha(el, "quando"), valido: () => !!r.quando, auto: true },
    { id: "sinais", render: renderSinais, valido: () => true },
    { id: "sono", render: (el) => renderEscolha(el, "sono"), valido: () => !!r.sono, auto: true },
    { id: "estresse", render: (el) => renderEscolha(el, "estresse"), valido: () => !!r.estresse, auto: true },
    { id: "comida", render: (el) => renderEscolha(el, "comida"), valido: () => r.comida.length > 0 },
    { id: "tentativas", render: (el) => renderEscolha(el, "tentativas"), valido: () => r.tentativas.length > 0 },
    { id: "rotina", render: renderRotina, valido: () => !!r.rotina, auto: true },
    { id: "tempo", render: (el) => renderEscolha(el, "tempo"), valido: () => !!r.tempo, textoBotao: "Montar meu Mapa da Dor" },
    { id: "calculando", render: renderCalculando, valido: () => false, final: true },
    { id: "resultado", render: renderResultado, valido: () => true, final: true }
  ];

  function renderIntro(el) {
    el.innerHTML = `
      <h1>Descubra em 2 minutos o que está congelando o seu corpo</h1>
      <p class="suave">Perguntas rápidas sobre o seu dia de trabalho. No final você recebe:</p>
      <ul class="lista-check">
        <li>O seu Índice de Congelamento, de 0 a 100</li>
        <li>Onde você está no ciclo do Corpo Congelado</li>
        <li>A cor do seu Semáforo dos Sinais</li>
        <li>Por que o que você já tentou não resolveu</li>
        <li>O seu SOS: o ajuste de 2 minutos para a hora que a dor aperta</li>
        <li>O seu plano sob medida para o tempo que você tem por dia</li>
      </ul>
      <p class="pequeno suave">Sem cadastro. Para homens e mulheres que trabalham sentados ou repetindo movimento.</p>`;
  }

  function renderEscolha(el, chave) {
    const q = PERGUNTAS[chave];
    const marcado = (id) => q.multi ? r[chave].includes(id) : r[chave] === id;
    el.innerHTML = `<h2>${q.titulo}</h2>${q.sub ? `<p class="suave">${q.sub}</p>` : ""}
      <div class="opcoes">${q.opcoes.map(([id, t]) => `<button class="opcao" data-id="${id}" aria-pressed="${marcado(id)}">${t}</button>`).join("")}</div>`;
    el.querySelectorAll(".opcao").forEach((b) => b.onclick = () => {
      const id = b.dataset.id;
      if (q.multi) {
        // "nada" / "bem" são exclusivas
        const exclusivas = ["nada", "bem"];
        if (exclusivas.includes(id)) r[chave] = r[chave].includes(id) ? [] : [id];
        else r[chave] = (r[chave].includes(id) ? r[chave].filter((x) => x !== id) : [...r[chave], id]).filter((x) => !exclusivas.includes(x));
        el.querySelectorAll(".opcao").forEach((x) => x.setAttribute("aria-pressed", r[chave].includes(x.dataset.id)));
        atualizarBotoes();
      } else {
        r[chave] = id;
        el.querySelectorAll(".opcao").forEach((x) => x.setAttribute("aria-pressed", x === b));
        avancarAuto();
      }
    });
  }

  function renderRegioes(el) {
    el.innerHTML = `<h2>Onde você sente dor ou desconforto no fim do dia?</h2>
      <p class="suave">Pode marcar mais de uma.</p>
      <div class="opcoes">${Object.entries(D.REGIOES).map(([id, reg]) =>
        `<button class="opcao" data-id="${id}" aria-pressed="${r.regioes.includes(id)}"><span class="emoji">${reg.emoji}</span>${reg.nome}</button>`).join("")}</div>`;
    el.querySelectorAll(".opcao").forEach((b) => b.onclick = () => {
      const id = b.dataset.id;
      r.regioes = r.regioes.includes(id) ? r.regioes.filter((x) => x !== id) : [...r.regioes, id];
      b.setAttribute("aria-pressed", r.regioes.includes(id));
      atualizarBotoes();
    });
  }

  function renderFoco(el) {
    el.innerHTML = `<h2>Qual dessas incomoda mais?</h2>
      <div class="opcoes">${r.regioes.map((id) =>
        `<button class="opcao" data-id="${id}" aria-pressed="${r.regiaoFoco === id}"><span class="emoji">${D.REGIOES[id].emoji}</span>${D.REGIOES[id].nome}</button>`).join("")}</div>`;
    el.querySelectorAll(".opcao").forEach((b) => b.onclick = () => {
      r.regiaoFoco = b.dataset.id;
      el.querySelectorAll(".opcao").forEach((x) => x.setAttribute("aria-pressed", x === b));
      avancarAuto();
    });
  }

  function renderIntensidade(el) {
    el.innerHTML = `<h2>De 0 a 10, qual a intensidade da dor num dia normal de trabalho?</h2>
      <div class="escala">${Array.from({ length: 11 }, (_, i) => `<button data-v="${i}" aria-pressed="${r.intensidade === i}">${i}</button>`).join("")}</div>
      <div class="escala-legenda"><span>Nenhuma</span><span>Insuportável</span></div>`;
    el.querySelectorAll(".escala button").forEach((b) => b.onclick = () => {
      r.intensidade = Number(b.dataset.v);
      el.querySelectorAll(".escala button").forEach((x) => x.setAttribute("aria-pressed", x === b));
      atualizarBotoes();
    });
  }

  function renderSinais(el) {
    el.innerHTML = `<h2>O corpo avisa antes da dor. Você sente algum desses sinais?</h2>
      <p class="suave">Marque todos que acontecem com você. Se nenhum, só continue.</p>
      <div class="opcoes">${L.SINAIS.map((s) => `<button class="opcao" data-id="${s.id}" aria-pressed="${r.sinais.includes(s.id)}">${s.texto}</button>`).join("")}</div>`;
    el.querySelectorAll(".opcao").forEach((b) => b.onclick = () => {
      const id = b.dataset.id;
      r.sinais = r.sinais.includes(id) ? r.sinais.filter((x) => x !== id) : [...r.sinais, id];
      b.setAttribute("aria-pressed", r.sinais.includes(id));
    });
  }

  function renderRotina(el) {
    el.innerHTML = `<h2>Qual dessas é mais parecida com a sua rotina?</h2>
      <div class="opcoes">${L.ROTINAS_TRABALHO.map((o) => `<button class="opcao" data-id="${o.id}" aria-pressed="${r.rotina === o.id}"><span class="emoji">${o.emoji}</span>${o.texto}</button>`).join("")}</div>`;
    el.querySelectorAll(".opcao").forEach((b) => b.onclick = () => {
      r.rotina = b.dataset.id;
      el.querySelectorAll(".opcao").forEach((x) => x.setAttribute("aria-pressed", x === b));
      atualizarBotoes();
    });
  }

  function renderCalculando(el) {
    const passos = ["Lendo as horas que você passa parado…", "Cruzando os sinais com o Semáforo…", "Olhando seu sono, estresse e comida…", "Montando seu plano dos 3 primeiros dias…"];
    el.innerHTML = `<div class="calculando"><h2>Montando seu Mapa da Dor</h2>
      <ul class="calc-lista">${passos.map((p) => `<li>${p}</li>`).join("")}</ul></div>`;
    const itens = el.querySelectorAll(".calc-lista li");
    const rapido = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    itens.forEach((li, k) => setTimeout(() => li.classList.add("feito"), rapido ? 0 : 600 * (k + 1)));
    setTimeout(() => { i = ETAPAS.findIndex((e) => e.id === "resultado"); mostrar(); }, rapido ? 300 : 600 * passos.length + 500);
  }

  /* ---------- Diagnóstico ---------- */
  const PONTOS = {
    horas: { ate4: 5, "4a6": 10, "6a8": 15, "8a10": 20, mais10: 25 },
    levanta: { "1h": 0, "2h": 8, almoco: 15, nunca: 20 },
    quando: { fim: 3, manha: 7, todo: 10, noite: 10 },
    sono: { bem: 0, mais_ou_menos: 5, mal: 10 },
    estresse: { baixo: 0, medio: 4, alto: 8 }
  };
  const HORAS_NUM = { ate4: 4, "4a6": 6, "6a8": 8, "8a10": 9, mais10: 10 };

  function indiceCongelamento() {
    let s = PONTOS.horas[r.horas] + PONTOS.levanta[r.levanta] + r.intensidade * 2 +
      PONTOS.quando[r.quando] + PONTOS.sono[r.sono] + PONTOS.estresse[r.estresse];
    r.sinais.forEach((id) => { const c = L.SINAIS.find((x) => x.id === id).cor; s += c === "vermelho" ? 4 : c === "amarelo" ? 2 : 0; });
    return Math.max(5, Math.min(100, s));
  }
  function nivel(ind) {
    if (ind >= 65) return { nome: "Corpo muito congelado", texto: "Seu corpo está há muito tempo travado e já está dando vários avisos. A boa notícia: é justamente onde as micro-pausas fazem mais diferença nos primeiros dias." };
    if (ind >= 35) return { nome: "Congelamento moderado", texto: "O ciclo já começou: a posição trava o músculo, a dor atrapalha o descanso e o cansaço tira as pausas do seu dia. Dá para quebrar esse ciclo agora, antes de virar lesão." };
    return { nome: "Começando a congelar", texto: "Seu corpo está nos primeiros avisos. É o melhor momento para criar o hábito das pausas, antes da dor ficar." };
  }

  function etapasDoCiclo() {
    const ruimSono = r.sono !== "bem" || r.quando === "noite";
    const ruimComida = r.comida.some((c) => c !== "bem");
    const amareloOuMais = r.sinais.some((id) => L.SINAIS.find((x) => x.id === id).cor !== "verde");
    return [
      ["Horas parado na mesma posição", HORAS_NUM[r.horas] >= 6 || ["almoco", "nunca"].includes(r.levanta)],
      ["Músculos travam e a circulação cai", r.intensidade >= 3 || r.regioes.length > 0],
      ["Sinais silenciosos e depois dor", amareloOuMais || r.intensidade >= 5],
      ["A dor e o estresse atrapalham o sono", ruimSono || r.estresse === "alto"],
      ["Menos energia, mais tensão, fome de comida rápida", r.sono !== "bem" && ruimComida],
      ["Cansado, não faz pausas, e congela mais", ["almoco", "nunca"].includes(r.levanta)]
    ];
  }

  function tripe() {
    const mov = { "1h": "ok", "2h": "atencao", almoco: "ruim", nunca: "ruim" }[r.levanta];
    const sono = { bem: "ok", mais_ou_menos: "atencao", mal: "ruim" }[r.sono];
    const problemasComida = r.comida.filter((c) => c !== "bem").length;
    const ali = problemasComida === 0 ? "ok" : problemasComida === 1 ? "atencao" : "ruim";
    const txt = {
      movimento: { ok: "Você já se mexe com frequência. Vamos colocar a rotina certa nessas pausas.", atencao: "As pausas existem, mas são longe demais uma da outra.", ruim: "Seu corpo fica horas sem trocar de posição. Esse é o centro do Corpo Congelado." },
      sono: { ok: "Seu sono está ajudando a recuperação.", atencao: "Você acorda cansado: o corpo não termina de se recuperar.", ruim: "A noite ruim aumenta a tensão e a dor do dia seguinte." },
      alimentacao: { ok: "Sua alimentação está a favor do corpo.", atencao: "Um ajuste pequeno na comida do trabalho já ajuda.", ruim: "Comida corrida e pouca água deixam o corpo mais inflamado e cansado." }
    };
    return [
      ["Movimento", mov, txt.movimento[mov]],
      ["Sono", sono, txt.sono[sono]],
      ["Alimentação", ali, txt.alimentacao[ali]]
    ];
  }

  const QUEBRAS = {
    remedio: "O remédio cala o aviso, mas não tira o seu corpo da posição que causa a dor. Por isso ela volta no dia seguinte.",
    massagem: "A massagem solta o músculo por algumas horas. No dia seguinte, as mesmas horas parado congelam tudo de novo.",
    youtube: "Alongamento aleatório não é da sua região nem cabe na sua rotina. Por isso você esquece.",
    academia: "Uma hora de academia não compensa nove horas parado. E quem chega moído no fim do dia não aguenta ir.",
    laboral: "Ginástica laboral uma vez por semana é como escovar os dentes uma vez por semana.",
    nada: "Você está no melhor momento: antes de o sinal virar lesão."
  };

  function alivioExpress(res) {
    const local = r.rotina === "escritorio" ? "sentado" : "em_pe";
    return L.montarProtocolo({ regiao: res.regiaoFoco, minutos: 2, local, semaforo: res.cor });
  }

  /* Plano diário pelo tempo disponível (3, 5 ou 10 min) */
  function planoDiario(zonaId) {
    const z = D.TRILHAS_ZONA[zonaId];
    const lanche = D.SNACKS.find((x) => x.zona === zonaId) || D.SNACKS[0];
    const habito = D.HABITOS.find((h) => h.rotinas.includes(r.rotina) && h.zonas.includes(zonaId)) || D.HABITOS.find((h) => h.rotinas.includes(r.rotina));
    const itens = {
      "3": [
        ["Expediente", "3 Lanches de Movimento de 60 s", `Manhã, depois do almoço e fim da tarde. Comece pelo ${lanche.nome.toLowerCase()}.`, 3]
      ],
      "5": [
        ["Ao acordar", "Checklist Matinal", `3 min montados para a trilha ${z.nome}.`, 3],
        ["Expediente", "2 Lanches de Movimento de 60 s", `Comece pelo ${lanche.nome.toLowerCase()}.`, 2]
      ],
      "10": [
        ["Ao acordar", "Checklist Matinal", `3 min montados para a trilha ${z.nome}.`, 3],
        ["Expediente", "2 Lanches de Movimento de 60 s", `Comece pelo ${lanche.nome.toLowerCase()}.`, 2],
        ["Uma vez", `Aula: ${habito.titulo}`, `${habito.min} min para corrigir o vício que mais pesa na sua rotina.`, habito.min],
        ["Antes de dormir", "Checklist Noturno", "3 min para soltar o corpo e dormir melhor.", 3]
      ]
    }[r.tempo];
    return { itens, habito };
  }

  function ofertasRecomendadas() {
    const b = (id) => D.BONUS.find((x) => x.id === id);
    const lista = [];
    if (r.rotina === "escritorio" || HORAS_NUM[r.horas] >= 6)
      lista.push({ ...b("bump1"), porque: r.rotina === "escritorio" ? "Você trabalha no computador: a altura da tela e da cadeira mantém o corpo congelado." : `Você passa ${PERGUNTAS.horas.opcoes.find((o) => o[0] === r.horas)[1].toLowerCase()} na mesma posição: o posto de trabalho conta muito.` });
    if (r.sono !== "bem" || r.estresse === "alto")
      lista.push({ ...b("bump2"), porque: r.sono !== "bem" ? "Você disse que não dorme bem: o ritual de desligar ataca justamente esse ponto do ciclo." : "Você vive no limite: as pausas em áudio funcionam até de câmera desligada, no meio da correria." });
    if (r.comida.some((c) => c !== "bem"))
      lista.push({ ...b("bump3"), porque: "Você marcou que come correndo, pula refeições ou bebe pouca água." });
    return lista;
  }

  function renderResultado(el) {
    const res = L.diagnosticar(r);
    const ind = indiceCongelamento();
    const niv = nivel(ind);
    const reg = D.REGIOES[res.regiaoFoco];
    const sem = D.SEMAFORO[res.cor];
    const trilha = D.TRILHAS[res.trilha];
    const ofertas = ofertasRecomendadas();
    const express = alivioExpress(res);
    const zona = D.TRILHAS_ZONA[D.trilhaDaRegiao(res.regiaoFoco)];
    const plano = planoDiario(D.trilhaDaRegiao(res.regiaoFoco));
    window.RELIGAR_STORE.salvarQuiz({ ...r, ...res, indice: ind, recomendados: ofertas.map((o) => o.id), tempoLivre: express.minutos, localPadrao: express.local, data: new Date().toISOString() });

    const ICONE_TRIPE = { ok: "verde", atencao: "amarelo", ruim: "vermelho" };
    const ROTULO_TRIPE = { ok: "Em dia", atencao: "Atenção", ruim: "Precisa de cuidado" };

    el.innerHTML = `
      <span class="etiqueta">Seu Mapa da Dor</span>
      <h1 style="margin-top:8px">Seu corpo está congelando ${reg.no}</h1>

      <div class="cartao indice">
        <p class="pequeno suave" style="margin:0">Índice de Congelamento</p>
        <div class="indice-numero"><strong>${ind}</strong><span>/100</span></div>
        <div class="indice-barra" role="img" aria-label="Índice ${ind} de 100"><span style="left:${ind}%"></span></div>
        <div class="escala-legenda"><span>Solto</span><span>Congelado</span></div>
        <h3 style="margin-top:12px">${niv.nome}</h3>
        <p class="pequeno" style="margin:0">${niv.texto}</p>
      </div>

      <div class="cartao">
        <h3>Onde você está no ciclo do Corpo Congelado</h3>
        <ol class="ciclo-quiz">${(() => { const et = etapasDoCiclo(); const ultimo = et.map((e) => e[1]).lastIndexOf(true);
          return et.map(([t, ativo], k) => `<li class="${ativo ? "ativo" : ""}">${t}${k === ultimo ? ` <span class="voce">você está aqui</span>` : ""}</li>`).join(""); })()}</ol>
        <p class="pequeno suave" style="margin:8px 0 0">Em destaque: as etapas que você já está vivendo.</p>
        <p class="pequeno" style="margin:12px 0 0">A dor não vem do esforço. Vem de ficar horas na mesma posição. E a dor é o último aviso, não o primeiro.</p>
      </div>

      <div class="cartao">
        <h3><span class="bolinha ${res.cor}"></span> Semáforo dos Sinais: ${sem.nome}</h3>
        <p class="pequeno" style="margin:0">${sem.fazer}</p>
        ${res.cor === "vermelho" ? `<p class="aviso aviso-vermelho" style="margin-top:12px">Os sinais que você marcou pedem avaliação de um médico ou fisioterapeuta antes de fazer exercícios para essa região. O desafio pode entrar depois, como rotina de prevenção.</p>` : ""}
      </div>

      <div class="cartao">
        <h3>Seu Tripé Religar</h3>
        <p class="pequeno suave">A dor do trabalho não vem só da postura.</p>
        ${tripe().map(([nome, st, t]) => `
          <div class="tripe-linha"><span class="bolinha ${ICONE_TRIPE[st]}"></span>
            <div><strong>${nome}</strong> <span class="pequeno suave">· ${ROTULO_TRIPE[st]}</span><br><span class="pequeno">${t}</span></div></div>`).join("")}
      </div>

      <div class="cartao">
        <h3>Por que o que você tentou não resolveu</h3>
        ${r.tentativas.map((t) => `<p class="pequeno"><strong>${PERGUNTAS.tentativas.opcoes.find((o) => o[0] === t)[1]}</strong><br>${QUEBRAS[t]}</p>`).join("")}
        <p class="destaque-quiz">A sua dor não é falta de força. É falta de pausa.</p>
      </div>

      <div class="cartao express">
        <span class="etiqueta">⚡ Seu Alívio Express</span>
        <h3 style="margin-top:8px">Doeu ${reg.no} no meio do trabalho? Um ajuste de 2 minutos, ${{ sentado: "aí na própria cadeira", em_pe: "aí onde você está" }[express.local]}.</h3>
        ${express.aviso ? `<p class="aviso" style="margin:8px 0">${express.aviso}</p>` : ""}
        <ol class="express-lista">${express.passos.map((x) => `<li><span>${x.nome}</span><span class="suave">${x.segundos} s</span></li>`).join("")}</ol>
        <p class="pequeno suave" style="margin:12px 0 0">No painel, cada passo é um microvídeo com cronômetro. Você abre o celular, toca em "Alívio" e segue.</p>
        <div class="trilha-quiz">
          <p class="pequeno" style="margin:0"><strong>Sua trilha na Central de Alívio:</strong> ${zona.emoji} ${zona.nome}</p>
          <p class="pequeno suave" style="margin:4px 0 0">⚡ SOS Rápido 1 min · 🧯 SOS Completo 3 min · ☀️🌙 Checklist Matinal e Noturno</p>
        </div>
      </div>

      <div class="cartao">
        <span class="etiqueta">Plano sob medida</span>
        <h3 style="margin-top:8px">Seu plano de ${r.tempo} minutos por dia</h3>
        <p class="pequeno suave">Zona: ${reg.emoji} ${reg.nome} · Rotina: ${trilha.nome}</p>
        ${plano.itens.map(([quando, t, d]) => `
          <div class="plano-dia"><span class="etiqueta">${quando}</span><div><strong>${t}</strong><br><span class="pequeno">${d}</span></div></div>`).join("")}
        <div class="plano-dia"><span class="etiqueta">Quando doer</span><div><strong>SOS de 2 minutos</strong><br><span class="pequeno">O seu Alívio Express acima, aí mesmo onde você estiver. Não conta no seu tempo do dia.</span></div></div>
        <p class="pequeno" style="margin:12px 0 0"><strong>O primeiro hábito para reprogramar:</strong> ${plano.habito.titulo.toLowerCase()}. ${plano.habito.vicio}</p>
      </div>

      <div class="cartao oferta">
        <span class="etiqueta">Seu próximo passo</span>
        <h2 style="margin-top:8px">Desafio Corpo Descongelado 21 Dias</h2>
        <p>Um assistente de bolso para a dor ${reg.no}: microvídeos de 1 a 3 minutos para abrir no celular na hora que a dor bater, mais o desafio de 21 dias montado para a sua rotina.</p>
        <ul class="lista-check">
          <li>5 aulas curtas + 21 dias de desafio</li>
          <li>Módulo 1, SOS Alívio Imediato: trilha ${zona.nome} e o alívio sob medida de 1 a 3 min</li>
          <li>Módulo 2, Reprogramação de Hábitos: começando por "${plano.habito.titulo}"</li>
          <li>Módulo 3, Lanches de Movimento: pausas invisíveis de 60 s</li>
          <li>Painel no celular que já começa com o seu Mapa da Dor</li>
          <li>Plano que muda pela sua noite e pelo seu semáforo</li>
          <li>Pausas invisíveis para reunião e atendimento</li>
          <li>Bônus: Trava de Segurança Articular e Checklist de Bolso Matinal e Noturno</li>
          <li>PDFs de apoio e certificado no dia 21</li>
        </ul>
        <p><s class="suave">${formatarPreco(C.precos.ancora)}</s> <strong style="font-size:1.5rem">${formatarPreco(C.precos.principal)}</strong></p>
        <div class="cta">
          <a class="botao botao-grande" href="../index.html#oferta">Quero descongelar meu corpo</a>
          <span class="beneficio">2 minutos entre uma tarefa e outra, sem academia</span>
        </div>
      </div>

      ${ofertas.length ? `
      <div class="cartao">
        <h3>Recomendado pelas suas respostas</h3>
        <p class="pequeno suave">Você pode adicionar no checkout, junto com o desafio.</p>
        ${ofertas.map((o) => `
          <div class="recomendado">
            <div class="linha" style="justify-content:space-between;flex-wrap:nowrap"><strong>${o.nome}</strong><span class="etiqueta">+ ${formatarPreco(o.preco)}</span></div>
            <p class="pequeno" style="margin:6px 0 4px"><strong>Por que para você:</strong> ${o.porque}</p>
            <p class="pequeno suave" style="margin:0">${o.descricao}</p>
          </div>`).join("")}
      </div>` : ""}`;
  }

  /* ---------- Navegação ---------- */
  let i = 0;
  const tela = document.getElementById("tela");
  const btnAvancar = document.getElementById("avancar");
  const btnVoltar = document.getElementById("voltar");
  const barra = document.getElementById("barra");

  const perguntas = () => ETAPAS.filter((e) => !e.final && e.id !== "intro" && !(e.pular && e.pular()));

  function mostrar() {
    const etapa = ETAPAS[i];
    etapa.render(tela);
    const ps = perguntas();
    const pos = etapa.final ? ps.length : Math.max(0, ps.indexOf(etapa));
    barra.style.width = Math.round((pos / ps.length) * 100) + "%";
    document.getElementById("acoes").classList.toggle("oculto", !!etapa.final);
    btnVoltar.classList.toggle("oculto", i === 0);
    btnAvancar.textContent = etapa.textoBotao || "Continuar";
    atualizarBotoes();
    window.scrollTo(0, 0);
  }
  function atualizarBotoes() { btnAvancar.disabled = !ETAPAS[i].valido(); }
  function avancarAuto() { atualizarBotoes(); setTimeout(() => mover(1), 250); }

  function mover(passo) {
    do { i += passo; } while (ETAPAS[i] && ETAPAS[i].pular && ETAPAS[i].pular());
    i = Math.max(0, Math.min(ETAPAS.length - 1, i));
    mostrar();
  }
  btnAvancar.onclick = () => {
    if (ETAPAS[i].id === "regioes") {
      if (r.regioes.length === 1) r.regiaoFoco = r.regioes[0];
      else if (!r.regioes.includes(r.regiaoFoco)) r.regiaoFoco = null;
    }
    mover(1);
  };
  btnVoltar.onclick = () => mover(-1);

  mostrar();
})();
