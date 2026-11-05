/* =========================================================
   QUIZ MAPA DA DOR (entrada do funil)
   ========================================================= */
(function () {
  const C = window.RELIGAR_CONFIG;
  const D = window.RELIGAR_DADOS;
  const L = window.RELIGAR_LOGICA;

  const r = { regioes: [], regiaoFoco: null, intensidade: null, sinais: [], rotina: null };

  /* Cada etapa: titulo, render(el), valido(), pular() opcional */
  const ETAPAS = [
    {
      id: "intro",
      render: (el) => {
        el.innerHTML = `
          <h1>Descubra em 1 minuto o que está travando seu corpo</h1>
          <p class="suave">5 perguntas rápidas. No final você recebe a sua região de foco, a cor do seu Semáforo dos Sinais e a trilha certa para a sua rotina.</p>
          <ul class="lista-check">
            <li>Sem cadastro</li>
            <li>Funciona para homens e mulheres</li>
            <li>Pensado para quem trabalha sentado ou repetindo movimento</li>
          </ul>`;
      },
      valido: () => true,
      textoBotao: "Fazer o Mapa da Dor"
    },
    {
      id: "regioes",
      render: (el) => {
        el.innerHTML = `<h2>Onde você sente dor ou desconforto no fim do dia?</h2>
          <p class="suave">Pode marcar mais de uma.</p>
          <div class="opcoes">${Object.entries(D.REGIOES).map(([id, reg]) =>
            `<button class="opcao" data-id="${id}" aria-pressed="${r.regioes.includes(id)}"><span class="emoji">${reg.emoji}</span>${reg.nome}</button>`).join("")}
          </div>`;
        el.querySelectorAll(".opcao").forEach((b) => b.onclick = () => {
          const id = b.dataset.id;
          r.regioes = r.regioes.includes(id) ? r.regioes.filter((x) => x !== id) : [...r.regioes, id];
          b.setAttribute("aria-pressed", r.regioes.includes(id));
          atualizarBotoes();
        });
      },
      valido: () => r.regioes.length > 0
    },
    {
      id: "foco",
      pular: () => r.regioes.length <= 1,
      render: (el) => {
        el.innerHTML = `<h2>Qual dessas incomoda mais?</h2>
          <div class="opcoes">${r.regioes.map((id) =>
            `<button class="opcao" data-id="${id}" aria-pressed="${r.regiaoFoco === id}"><span class="emoji">${D.REGIOES[id].emoji}</span>${D.REGIOES[id].nome}</button>`).join("")}
          </div>`;
        el.querySelectorAll(".opcao").forEach((b) => b.onclick = () => {
          r.regiaoFoco = b.dataset.id;
          el.querySelectorAll(".opcao").forEach((x) => x.setAttribute("aria-pressed", x === b));
          atualizarBotoes();
        });
      },
      valido: () => !!r.regiaoFoco
    },
    {
      id: "intensidade",
      render: (el) => {
        el.innerHTML = `<h2>De 0 a 10, qual a intensidade da dor no fim de um dia normal?</h2>
          <div class="escala">${Array.from({ length: 11 }, (_, i) =>
            `<button data-v="${i}" aria-pressed="${r.intensidade === i}">${i}</button>`).join("")}</div>
          <div class="escala-legenda"><span>Nenhuma</span><span>Insuportável</span></div>`;
        el.querySelectorAll(".escala button").forEach((b) => b.onclick = () => {
          r.intensidade = Number(b.dataset.v);
          el.querySelectorAll(".escala button").forEach((x) => x.setAttribute("aria-pressed", x === b));
          atualizarBotoes();
        });
      },
      valido: () => r.intensidade !== null
    },
    {
      id: "sinais",
      render: (el) => {
        el.innerHTML = `<h2>Você sente algum desses sinais?</h2>
          <p class="suave">Marque todos que acontecem com você. Se nenhum, só continue.</p>
          <div class="opcoes">${L.SINAIS.map((s) =>
            `<button class="opcao" data-id="${s.id}" aria-pressed="${r.sinais.includes(s.id)}">${s.texto}</button>`).join("")}
          </div>`;
        el.querySelectorAll(".opcao").forEach((b) => b.onclick = () => {
          const id = b.dataset.id;
          r.sinais = r.sinais.includes(id) ? r.sinais.filter((x) => x !== id) : [...r.sinais, id];
          b.setAttribute("aria-pressed", r.sinais.includes(id));
        });
      },
      valido: () => true
    },
    {
      id: "rotina",
      render: (el) => {
        el.innerHTML = `<h2>Como é a sua rotina de trabalho?</h2>
          <div class="opcoes">${L.ROTINAS_TRABALHO.map((o) =>
            `<button class="opcao" data-id="${o.id}" aria-pressed="${r.rotina === o.id}"><span class="emoji">${o.emoji}</span>${o.texto}</button>`).join("")}
          </div>`;
        el.querySelectorAll(".opcao").forEach((b) => b.onclick = () => {
          r.rotina = b.dataset.id;
          el.querySelectorAll(".opcao").forEach((x) => x.setAttribute("aria-pressed", x === b));
          atualizarBotoes();
        });
      },
      valido: () => !!r.rotina,
      textoBotao: "Ver meu resultado"
    },
    {
      id: "resultado",
      render: (el) => {
        const res = L.diagnosticar(r);
        window.RELIGAR_STORE.salvarQuiz({ ...r, ...res, data: new Date().toISOString() });
        const reg = D.REGIOES[res.regiaoFoco];
        const sem = D.SEMAFORO[res.cor];
        const trilha = D.TRILHAS[res.trilha];
        const exs = D.EXERCICIOS.filter((e) => e.regiao === res.regiaoFoco);
        el.innerHTML = `
          <span class="etiqueta">Seu resultado</span>
          <h1 style="margin-top:8px">Seu corpo está congelando ${reg.no}</h1>
          <p>A dor não vem do esforço. Vem de passar horas na mesma posição. Antes da dor, o corpo dá sinais, e o seu já está avisando.</p>

          <div class="cartao">
            <h3>Região de foco: ${reg.emoji} ${reg.nome}</h3>
            <p class="pequeno suave">Intensidade hoje: ${r.intensidade}/10</p>
            <p class="pequeno">O que mais ajuda essa região: ${exs.map((e) => e.nome.toLowerCase()).join(", ")}.</p>
          </div>

          <div class="cartao resultado-cor">
            <h3><span class="bolinha ${res.cor}"></span> Semáforo dos Sinais: ${sem.nome}</h3>
            <p class="pequeno">${sem.fazer}</p>
            ${res.cor === "vermelho" ? `<p class="aviso aviso-vermelho">Os sinais que você marcou pedem avaliação de um médico ou fisioterapeuta antes de começar exercícios para essa região. O desafio pode entrar depois, como rotina de prevenção.</p>` : ""}
          </div>

          <div class="cartao">
            <h3>Sua trilha: ${trilha.nome}</h3>
            <p class="pequeno">${trilha.como}</p>
          </div>

          <div class="cartao">
            <h2>O próximo passo: Desafio Corpo Descongelado 21 Dias</h2>
            <p>Micro-pausas de 2 minutos, com a rotina certa ${reg.para} e para a sua trilha. Sem academia.</p>
            <ul class="lista-check">
              <li>5 aulas curtas + 21 dias de desafio</li>
              <li>Painel no celular que ajusta o plano pela sua noite e pelo seu semáforo</li>
              <li>Pausas invisíveis para reunião de câmera ligada</li>
              <li>PDFs de apoio</li>
            </ul>
            <p><s class="suave">${formatarPreco(C.precos.ancora)}</s> <strong style="font-size:1.4rem">${formatarPreco(C.precos.principal)}</strong></p>
            <div class="cta">
              <a class="botao botao-grande" href="../index.html#oferta">Quero descongelar meu corpo</a>
              <span class="beneficio">2 minutos entre uma reunião e outra, sem academia</span>
            </div>
          </div>`;
      },
      valido: () => true,
      final: true
    }
  ];

  let i = 0;
  const tela = document.getElementById("tela");
  const btnAvancar = document.getElementById("avancar");
  const btnVoltar = document.getElementById("voltar");
  const barra = document.getElementById("barra");

  function etapasVisiveis() { return ETAPAS.filter((e) => !(e.pular && e.pular())); }

  function mostrar() {
    const etapa = ETAPAS[i];
    etapa.render(tela);
    const vis = etapasVisiveis();
    barra.style.width = Math.round((vis.indexOf(etapa) / (vis.length - 1)) * 100) + "%";
    document.getElementById("acoes").classList.toggle("oculto", !!etapa.final);
    btnVoltar.classList.toggle("oculto", i === 0);
    btnAvancar.textContent = etapa.textoBotao || "Continuar";
    atualizarBotoes();
    window.scrollTo(0, 0);
  }
  function atualizarBotoes() { btnAvancar.disabled = !ETAPAS[i].valido(); }

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
