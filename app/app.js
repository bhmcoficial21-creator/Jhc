/* =========================================================
   PAINEL DO DESAFIO (seção 14 do briefing)
   Telas: boas-vindas, hoje, pausa, invisiveis, lembretes,
   progresso, aulas, bonus, dia21, mais.
   ========================================================= */
(function () {
  const C = window.RELIGAR_CONFIG;
  const D = window.RELIGAR_DADOS;
  const L = window.RELIGAR_LOGICA;
  const S = window.RELIGAR_STORE;

  let estado = S.carregar();
  const salvar = () => S.salvar(estado);
  const tela = document.getElementById("tela");
  const $ = (sel, el = document) => el.querySelector(sel);
  const $$ = (sel, el = document) => Array.from(el.querySelectorAll(sel));

  /* ---------- Datas e dia atual ---------- */
  const hojeISO = () => {
    const d = new Date();
    return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
  };
  function diaAtual() {
    if (!estado.dataInicio) return 1;
    const inicio = new Date(estado.dataInicio + "T00:00:00");
    const hoje = new Date(hojeISO() + "T00:00:00");
    const n = Math.round((hoje - inicio) / 86400000) + 1 + (estado.deslocamentoDias || 0);
    return Math.max(1, n);
  }
  function registroDia(n) {
    if (!estado.dias[n]) {
      estado.dias[n] = { noite: null, semaforo: null, caotico: false, pausas: 0, pilares: { movimento: false, sono: false, alimentacao: false }, tarefa: false, revisao: null, feito: false };
    }
    return estado.dias[n];
  }
  function sequencia() {
    let n = Math.min(diaAtual(), 21);
    if (!estado.dias[n]?.feito) n -= 1; // hoje ainda pode ser feito
    let s = 0;
    while (n >= 1 && estado.dias[n]?.feito) { s++; n--; }
    return s;
  }
  const diasFeitos = () => Object.values(estado.dias).filter((d) => d.feito).length;

  /* ---------- Roteamento ---------- */
  const ROTAS = { boasvindas, hoje, pausa, alivio, invisiveis, lembretes, progresso, aulas, bonus, dia21, mais };
  function navegar() {
    pararTimer();
    let rota = (location.hash || "#hoje").slice(1);
    if (!estado.perfil && rota !== "boasvindas") return (location.hash = "#boasvindas");
    if (rota === "hoje" && diaAtual() > 21) rota = "dia21";
    (ROTAS[rota] || hoje)();
    $$("#nav a").forEach((a) => a.classList.toggle("ativo", a.dataset.r === rota));
    $("#nav").classList.toggle("oculto", rota === "boasvindas");
    $("#botao-estranho").classList.toggle("oculto", rota === "boasvindas");
    $("#topo-dia").textContent = estado.perfil ? (diaAtual() > 21 ? "Desafio concluído" : `Dia ${diaAtual()} de 21`) : "";
    window.scrollTo(0, 0);
  }
  window.addEventListener("hashchange", navegar);

  /* =========================================================
     1. BOAS-VINDAS E MAPA DA DOR
     ========================================================= */
  function boasvindas() {
    const q = S.lerQuiz() || {};
    const p = {
      regioes: q.regioes || [], regiaoFoco: q.regiaoFoco || null,
      intensidadeInicial: q.intensidade ?? null, sinais: q.sinais || [],
      rotina: q.rotina || null, inicioTrabalho: "09:00", fimTrabalho: "18:00",
      intervaloMin: C.intervaloPadraoMin,
      tempoLivre: q.tempoLivre || 2, localPadrao: q.localPadrao || "sentado"
    };
    tela.innerHTML = `
      <h1>Boas-vindas ao Desafio Corpo Descongelado</h1>
      <p class="suave">Vamos montar o seu plano. ${q.regioes ? "Já trouxemos as respostas do seu Mapa da Dor; confira e ajuste se quiser." : "Leva 1 minuto."}</p>
      <div class="aviso" style="margin-bottom:16px">Se você tem diagnóstico, dor forte ou está em tratamento, converse com seu médico ou fisioterapeuta antes de começar.</div>

      <div class="cartao">
        <h3>1. Onde dói?</h3>
        <p class="pequeno suave">Pode marcar mais de uma.</p>
        <div class="opcoes" id="bv-regioes">${Object.entries(D.REGIOES).map(([id, r]) =>
          `<button class="opcao" data-id="${id}" aria-pressed="${p.regioes.includes(id)}"><span class="emoji">${r.emoji}</span>${r.nome}</button>`).join("")}</div>
        <div id="bv-foco-wrap" style="margin-top:12px"></div>
      </div>

      <div class="cartao">
        <h3>2. Intensidade da dor hoje (0 a 10)</h3>
        <p class="pequeno suave">Essa é a sua Escala da Dor do dia 1.</p>
        <div class="escala" id="bv-escala">${Array.from({ length: 11 }, (_, i) =>
          `<button data-v="${i}" aria-pressed="${p.intensidadeInicial === i}">${i}</button>`).join("")}</div>
        <div class="escala-legenda"><span>Nenhuma</span><span>Insuportável</span></div>
      </div>

      <div class="cartao">
        <h3>3. Sua rotina de trabalho</h3>
        <div class="opcoes" id="bv-rotina">${L.ROTINAS_TRABALHO.map((o) =>
          `<button class="opcao" data-id="${o.id}" aria-pressed="${p.rotina === o.id}"><span class="emoji">${o.emoji}</span>${o.texto}</button>`).join("")}</div>
      </div>

      <div class="cartao">
        <h3>4. Horário de trabalho</h3>
        <div class="grade-2">
          <label>Começo<br><input type="time" id="bv-ini" value="${p.inicioTrabalho}" class="opcao"></label>
          <label>Fim<br><input type="time" id="bv-fim" value="${p.fimTrabalho}" class="opcao"></label>
        </div>
      </div>

      <button class="botao botao-grande" id="bv-ok" style="margin-top:16px">Ver meu plano</button>
    `;

    function renderFoco() {
      const w = $("#bv-foco-wrap");
      if (p.regioes.length <= 1) { p.regiaoFoco = p.regioes[0] || null; w.innerHTML = ""; return; }
      if (!p.regioes.includes(p.regiaoFoco)) p.regiaoFoco = null;
      w.innerHTML = `<p class="pequeno"><strong>Qual incomoda mais?</strong></p>
        <div class="linha">${p.regioes.map((id) =>
          `<button class="opcao" style="width:auto;min-height:40px" data-id="${id}" aria-pressed="${p.regiaoFoco === id}">${D.REGIOES[id].nome}</button>`).join("")}</div>`;
      $$("button", w).forEach((b) => b.onclick = () => { p.regiaoFoco = b.dataset.id; renderFoco(); validar(); });
    }
    function validar() {
      $("#bv-ok").disabled = !(p.regioes.length && p.regiaoFoco && p.intensidadeInicial !== null && p.rotina);
    }
    $$("#bv-regioes .opcao").forEach((b) => b.onclick = () => {
      const id = b.dataset.id;
      p.regioes = p.regioes.includes(id) ? p.regioes.filter((x) => x !== id) : [...p.regioes, id];
      b.setAttribute("aria-pressed", p.regioes.includes(id));
      renderFoco(); validar();
    });
    $$("#bv-escala button").forEach((b) => b.onclick = () => {
      p.intensidadeInicial = Number(b.dataset.v);
      $$("#bv-escala button").forEach((x) => x.setAttribute("aria-pressed", x === b)); validar();
    });
    $$("#bv-rotina .opcao").forEach((b) => b.onclick = () => {
      p.rotina = b.dataset.id;
      $$("#bv-rotina .opcao").forEach((x) => x.setAttribute("aria-pressed", x === b)); validar();
    });
    $("#bv-ok").onclick = () => {
      p.inicioTrabalho = $("#bv-ini").value || "09:00";
      p.fimTrabalho = $("#bv-fim").value || "18:00";
      const diag = L.diagnosticar({ ...p, intensidade: p.intensidadeInicial });
      estado.perfil = { ...p, trilha: diag.trilha, corInicial: diag.cor };
      estado.dataInicio = hojeISO();
      estado.escalaDor[1] = p.intensidadeInicial;
      salvar();
      mostrarResultadoMapa(diag);
    };
    renderFoco(); validar();
  }

  function mostrarResultadoMapa(diag) {
    const reg = D.REGIOES[diag.regiaoFoco], trilha = D.TRILHAS[diag.trilha], sem = D.SEMAFORO[diag.cor];
    tela.innerHTML = `
      <span class="etiqueta">Seu plano</span>
      <h1 style="margin-top:8px">Região de foco: ${reg.emoji} ${reg.nome}</h1>
      <div class="cartao"><h3>Trilha: ${trilha.nome}</h3><p class="pequeno">${trilha.dica}</p></div>
      <div class="cartao"><h3><span class="bolinha ${diag.cor}"></span> Semáforo inicial: ${sem.nome}</h3><p class="pequeno">${sem.fazer}</p></div>
      <div class="cartao">
        <h3>Antes de começar: salve o painel na tela inicial</h3>
        <p class="pequeno">iPhone: botão Compartilhar → "Adicionar à Tela de Início".<br>Android: menu ⋮ → "Adicionar à tela inicial".</p>
      </div>
      <button class="botao botao-grande" onclick="location.hash='#hoje'">Começar o dia 1</button>`;
    $("#nav").classList.add("oculto");
  }

  /* =========================================================
     2. HOJE (tela principal)
     ========================================================= */
  function hoje() {
    const n = diaAtual();
    const reg = registroDia(n);
    const info = D.DIAS[n - 1];
    const semana = D.SEMANAS[n <= 7 ? 0 : n <= 14 ? 1 : 2];

    // Passo 1: como foi a noite?
    if (!reg.noite) {
      tela.innerHTML = `
        <span class="etiqueta">Semana ${semana.n} · ${semana.nome}</span>
        <h1 style="margin-top:8px">Bom dia! Como foi sua noite?</h1>
        <p class="suave">O plano de hoje se ajusta à sua resposta.</p>
        <div class="opcoes">
          <button class="opcao" data-v="bem"><span class="emoji">😴</span>Dormi bem</button>
          <button class="opcao" data-v="mais_ou_menos"><span class="emoji">😐</span>Mais ou menos</button>
          <button class="opcao" data-v="horrivel"><span class="emoji">😵</span>Noite horrível</button>
        </div>`;
      $$(".opcao", tela).forEach((b) => b.onclick = () => { reg.noite = b.dataset.v; salvar(); hoje(); });
      return;
    }
    // Passo 2: semáforo do dia
    if (!reg.semaforo) {
      tela.innerHTML = `
        <h1>Qual é a cor do seu semáforo hoje?</h1>
        ${semaforoExplicado()}
        <div class="semaforo" style="margin-top:16px">
          <button class="verde" data-v="verde"><span class="bolinha verde"></span> Verde</button>
          <button class="amarelo" data-v="amarelo"><span class="bolinha amarelo"></span> Amarelo</button>
          <button class="vermelho" data-v="vermelho"><span class="bolinha vermelho"></span> Vermelho</button>
        </div>`;
      $$(".semaforo button", tela).forEach((b) => b.onclick = () => { reg.semaforo = b.dataset.v; salvar(); hoje(); });
      return;
    }

    const plano = L.planoDoDia({ dia: n, noite: reg.noite, semaforo: reg.semaforo, caotico: reg.caotico, perfil: estado.perfil });
    const pctPausas = Math.min(100, Math.round((reg.pausas / plano.metaPausas) * 100));
    const podeConcluir = reg.pausas >= plano.minimoPausas;
    const nomeNoite = { bem: "Dormi bem", mais_ou_menos: "Mais ou menos", horrivel: "Noite horrível" }[reg.noite];

    tela.innerHTML = `
      <span class="etiqueta">Semana ${semana.n} · ${semana.nome}</span>
      <h1 style="margin-top:8px">Dia ${n}: ${info.titulo}</h1>
      <p class="pequeno suave">
        🌙 ${nomeNoite} · <span class="bolinha ${reg.semaforo}"></span> ${D.SEMAFORO[reg.semaforo].nome}
        · <a href="#" id="refazer">alterar</a>
      </p>

      ${plano.avisos.map((a) => `<div class="aviso ${plano.versao === "vermelho" ? "aviso-vermelho" : ""}" style="margin-bottom:8px">${a}</div>`).join("")}

      <a class="cartao express-atalho" href="#alivio">
        <span style="font-size:1.6rem">⚡</span>
        <span><strong>Doeu agora? Alívio Express</strong><br><span class="pequeno suave">Protocolo de 1 a 3 minutos para a dor de agora, aí na cadeira</span></span>
      </a>

      <div class="cartao">
        <div class="video-placeholder">[Vídeo do dia ${n} · 2 a 5 min]<br>${info.titulo}</div>
      </div>

      <div class="cartao">
        <div class="linha" style="justify-content:space-between">
          <div>
            <p class="pequeno suave" style="margin:0">Pausas de hoje (Regra 50/2)</p>
            <div class="contador"><strong id="n-pausas">${reg.pausas}</strong><span class="suave">/ ${plano.metaPausas}</span></div>
          </div>
          <a class="botao" href="#pausa">⏱️ Pausa agora</a>
        </div>
        <div class="barra" style="margin-top:10px"><span style="width:${pctPausas}%"></span></div>
        <p class="pequeno suave" style="margin:8px 0 0">Mínimo para o check do dia: ${plano.minimoPausas} pausas. <a href="#" id="pausa-manual">+1 pausa feita sem o timer</a></p>
      </div>

      <div class="cartao">
        <h3>Plano de hoje</h3>
        ${plano.blocos.map(renderBloco).join("")}
        <label class="check-linha bloco" style="border:0">
          <input type="checkbox" class="check" id="tarefa" ${reg.tarefa ? "checked" : ""}>
          <span><strong>Tarefa do dia:</strong> ${info.tarefa}</span>
        </label>
      </div>

      <div class="cartao">
        <h3>Tripé Religar</h3>
        ${[["movimento", "Movimento", "Fiz as pausas e me mexi"], ["sono", "Sono", "Vou dormir no horário / fiz o ritual de desligar"], ["alimentacao", "Alimentação", "Bebi água e comi comida de verdade"]].map(([k, t, d]) => `
          <label class="check-linha"><input type="checkbox" class="check" data-pilar="${k}" ${reg.pilares[k] ? "checked" : ""}><span><strong>${t}</strong> <span class="pequeno suave">${d}</span></span></label>`).join("")}
      </div>

      ${C.diasEscalaDor.includes(n) ? `
      <div class="cartao">
        <h3>Escala da Dor do dia ${n}</h3>
        <div class="escala" id="escala">${Array.from({ length: 11 }, (_, i) =>
          `<button data-v="${i}" aria-pressed="${estado.escalaDor[n] === i}">${i}</button>`).join("")}</div>
        <div class="escala-legenda"><span>Nenhuma</span><span>Insuportável</span></div>
        ${n > 1 && estado.escalaDor[1] != null ? `<p class="pequeno suave" style="margin-top:8px">Dia 1: ${estado.escalaDor[1]}/10</p>` : ""}
      </div>` : ""}

      ${D.REVISOES[n] ? renderRevisao(n, reg) : ""}

      <div class="cartao">
        <label class="check-linha"><input type="checkbox" class="check" id="caotico" ${reg.caotico ? "checked" : ""}>
          <span><strong>Hoje é um dia caótico</strong><br><span class="pequeno suave">${D.DIA_CAOTICO.como}</span></span></label>
      </div>

      <button class="botao botao-grande" id="concluir" ${podeConcluir && !reg.feito ? "" : "disabled"} style="margin-top:12px">
        ${reg.feito ? "✓ Dia concluído" : podeConcluir ? "Marcar dia como feito" : `Faltam ${plano.minimoPausas - reg.pausas} pausas para o check`}
      </button>

      <p class="centro suave" style="margin-top:24px"><em>${info.gancho}</em></p>
    `;

    $("#refazer").onclick = (e) => { e.preventDefault(); reg.noite = null; reg.semaforo = null; salvar(); hoje(); };
    $("#pausa-manual").onclick = (e) => { e.preventDefault(); reg.pausas++; salvar(); hoje(); };
    $("#tarefa").onchange = (e) => { reg.tarefa = e.target.checked; salvar(); };
    $("#caotico").onchange = (e) => { reg.caotico = e.target.checked; salvar(); hoje(); };
    $$("[data-pilar]").forEach((c) => c.onchange = () => { reg.pilares[c.dataset.pilar] = c.checked; salvar(); });
    $$("#escala button").forEach((b) => b.onclick = () => {
      estado.escalaDor[n] = Number(b.dataset.v); salvar();
      $$("#escala button").forEach((x) => x.setAttribute("aria-pressed", x === b));
    });
    $$("[data-rev]").forEach((b) => b.onclick = () => { reg.revisao = Number(b.dataset.rev); salvar(); hoje(); });
    $("#concluir").onclick = () => {
      reg.feito = true; salvar();
      abrirModal(`<h2>🎉 Dia ${n} feito!</h2><p>Sequência: <strong>${sequencia()} dia(s)</strong>. ${n === 21 ? "Hoje é a celebração!" : "Amanhã tem mais 2 minutos de cada vez."}</p>
        <button class="botao botao-bloco" onclick="this.closest('dialog').close()">Fechar</button>`);
      if (n === 21) location.hash = "#dia21"; else hoje();
    };
  }

  function renderBloco(b) {
    let detalhe = "";
    if (b.tipo === "rotina") {
      let ids = D.ROTINAS[b.rotina].exercicios;
      if (b.curta) ids = ids.slice(0, b.rotina === "forca8" ? 2 : 3);
      detalhe = `<ul class="lista-ex">${ids.map((id) => { const e = D.ex(id); return `<li><strong>${e.nome}</strong> · ${e.passos}</li>`; }).join("")}</ul>`;
    } else if (b.tipo === "regiao") {
      let lista = D.EXERCICIOS.filter((e) => e.regiao === b.regiao);
      if (b.curta) lista = lista.slice(0, 2);
      detalhe = `<ul class="lista-ex">${lista.map((e) => `<li><strong>${e.nome}</strong> · ${e.passos}</li>`).join("")}</ul>`;
    } else if (b.tipo === "ritual") {
      detalhe = `<ol class="lista-ex">${D.ROTINAS.ritualDesligar.passos.map((p) => `<li>${p}</li>`).join("")}</ol>`;
    }
    const icone = { pausas: "⏱️", rotina: "🧘", regiao: "🎯", ritual: "🌙", caminhada: "🚶" }[b.tipo];
    return `<div class="bloco"><span>${icone}</span><div style="flex:1"><strong>${b.texto}</strong>${detalhe ? `<details><summary class="pequeno">ver exercícios</summary>${detalhe}</details>` : ""}</div></div>`;
  }

  function renderRevisao(n, reg) {
    const r = D.REVISOES[n];
    if (reg.revisao !== null && reg.revisao !== undefined) {
      const acertou = reg.revisao === r.certa;
      return `<div class="cartao"><h3>🧠 Revisão</h3><p>${r.pergunta}</p>
        <p class="aviso" style="border-color:var(${acertou ? "--cor-verde" : "--cor-amarelo"})">${acertou ? "Isso mesmo! " : "Quase. "}${r.explica}</p></div>`;
    }
    return `<div class="cartao"><h3>🧠 Revisão rápida</h3><p>${r.pergunta}</p>
      <div class="opcoes">${r.opcoes.map((o, i) => `<button class="opcao" data-rev="${i}">${o}</button>`).join("")}</div></div>`;
  }

  function semaforoExplicado() {
    return Object.entries(D.SEMAFORO).map(([k, s]) => `
      <div class="cartao"><strong><span class="bolinha ${k}"></span> ${s.nome}</strong>
      <p class="pequeno" style="margin:4px 0 0"><span class="suave">O que sente:</span> ${s.sente}<br><span class="suave">O que fazer:</span> ${s.fazer}</p></div>`).join("");
  }

  /* =========================================================
     3. PAUSA AGORA (timer de 2 minutos com os 3 Rs)
     ========================================================= */
  let timerId = null;
  function pararTimer() { if (timerId) { clearInterval(timerId); timerId = null; } }

  function pausa() {
    const n = Math.min(diaAtual(), 21);
    const reg = registroDia(n);
    const vermelho = reg.semaforo === "vermelho";
    const exercicio = L.exercicioRemexe(estado.perfil.regiaoFoco, reg.pausas);
    const etapas = D.OS_3_RS.map((r, i) => {
      if (i === 2 && vermelho) return { ...r, nome: "Respira mais", texto: "Semáforo vermelho: sem exercícios da região. Continue respirando devagar e mexa suavemente o resto do corpo." };
      if (i === 2) return { ...r, texto: `<strong>${exercicio.nome}</strong><br>${exercicio.passos}` };
      return r;
    });
    const total = etapas.reduce((s, e) => s + e.segundos, 0);
    let restante = total, rodando = false;

    tela.innerHTML = `
      <h1>Pausa de 2 minutos</h1>
      <p class="suave">Pausa ${reg.pausas + 1} de hoje · região de foco: ${D.REGIOES[estado.perfil.regiaoFoco].nome}</p>
      <div class="etapas-r">${etapas.map((e) => `<div>${e.nome}</div>`).join("")}</div>
      <div class="cartao">
        <div class="timer" id="timer">${fmt(total)}</div>
        <h3 id="etapa-nome">${etapas[0].nome}</h3>
        <p id="etapa-texto">${etapas[0].texto}</p>
      </div>
      <button class="botao botao-grande" id="play" style="margin-top:12px">Começar</button>
      <p class="centro" style="margin-top:12px"><a href="#invisiveis">Está em reunião? Veja as pausas invisíveis</a></p>`;

    function atualizar() {
      const decorrido = total - restante;
      let acc = 0, idx = 0;
      for (let i = 0; i < etapas.length; i++) { if (decorrido >= acc + etapas[i].segundos) { acc += etapas[i].segundos; idx = i + 1; } }
      idx = Math.min(idx, etapas.length - 1);
      $("#timer").textContent = fmt(restante);
      $("#etapa-nome").textContent = etapas[idx].nome;
      $("#etapa-texto").innerHTML = etapas[idx].texto;
      $$(".etapas-r div").forEach((d, i) => { d.className = i < idx ? "feita" : i === idx ? "atual" : ""; });
    }
    function concluir() {
      pararTimer();
      reg.pausas++; salvar(); ultimaPausa = Date.now();
      tela.innerHTML = `<div class="centro"><h1>✓ Pausa feita!</h1>
        <p>${reg.pausas} pausa(s) hoje. Seu corpo agradece.</p>
        <a class="botao botao-grande" href="#hoje">Voltar para Hoje</a></div>`;
    }
    $("#play").onclick = () => {
      if (rodando) { pararTimer(); rodando = false; $("#play").textContent = "Continuar"; return; }
      rodando = true; $("#play").textContent = "Pausar";
      timerId = setInterval(() => { restante--; if (restante <= 0) return concluir(); atualizar(); }, 1000);
      atualizar();
    };
    atualizar();
  }
  const fmt = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  /* =========================================================
     3b. ALÍVIO EXPRESS (protocolo sob medida na hora da dor)
     ========================================================= */
  function alivio() {
    const p = estado.perfil;
    const n = Math.min(diaAtual(), 21);
    const reg = registroDia(n);
    const esc = { regiao: p.regiaoFoco, minutos: p.tempoLivre || 2, local: p.localPadrao || "sentado" };

    tela.innerHTML = `
      <span class="etiqueta">Alívio Express</span>
      <h1 style="margin-top:8px">Doeu agora? Monte seu alívio</h1>
      <p class="suave">Três toques e o protocolo cabe no tempo que você tem, aí mesmo onde você está.</p>

      <div class="cartao">
        <h3>Onde está doendo agora?</h3>
        <div class="grade-2" id="ae-regiao">${Object.entries(D.REGIOES).map(([id, r]) =>
          `<button class="opcao" data-id="${id}" aria-pressed="${esc.regiao === id}"><span class="emoji">${r.emoji}</span>${r.nome}</button>`).join("")}</div>
      </div>
      <div class="cartao">
        <h3>Quanto tempo você tem?</h3>
        <div class="opcoes" id="ae-tempo">${L.TEMPOS_EXPRESS.map((t) =>
          `<button class="opcao" data-id="${t.min}" aria-pressed="${esc.minutos === t.min}"><strong>${t.nome}</strong><span class="pequeno suave">${t.texto}</span></button>`).join("")}</div>
      </div>
      <div class="cartao">
        <h3>Onde você está?</h3>
        <div class="opcoes" id="ae-local">${L.LOCAIS_EXPRESS.map((l) =>
          `<button class="opcao" data-id="${l.id}" aria-pressed="${esc.local === l.id}"><span class="emoji">${l.emoji}</span><span><strong>${l.nome}</strong><br><span class="pequeno suave">${l.texto}</span></span></button>`).join("")}</div>
      </div>
      <button class="botao botao-grande" id="ae-ok" style="margin-top:12px">Montar meu alívio</button>`;

    const grupo = (sel, chave, conv) => $$(sel + " .opcao").forEach((b) => b.onclick = () => {
      esc[chave] = conv ? conv(b.dataset.id) : b.dataset.id;
      $$(sel + " .opcao").forEach((x) => x.setAttribute("aria-pressed", x === b));
    });
    grupo("#ae-regiao", "regiao");
    grupo("#ae-tempo", "minutos", Number);
    grupo("#ae-local", "local");
    $("#ae-ok").onclick = () => {
      p.tempoLivre = esc.minutos; p.localPadrao = esc.local; salvar();
      executarProtocolo(L.montarProtocolo({ ...esc, semaforo: reg.semaforo }), reg);
    };
  }

  function executarProtocolo(prot, reg) {
    const passos = prot.passos;
    let k = 0, restante = passos[0].segundos, rodando = false;
    const total = passos.reduce((s, x) => s + x.segundos, 0);

    tela.innerHTML = `
      <span class="etiqueta">Alívio Express · ${prot.minutos} min · ${D.REGIOES[prot.regiao].nome}</span>
      ${prot.aviso ? `<div class="aviso ${reg.semaforo === "vermelho" ? "aviso-vermelho" : ""}" style="margin-top:12px">${prot.aviso}</div>` : ""}
      <div class="cartao" style="margin-top:12px">
        <div class="video-placeholder vertical" id="ae-video"></div>
        <p class="pequeno suave" style="margin:12px 0 0" id="ae-contagem"></p>
        <h2 id="ae-nome" style="margin:4px 0"></h2>
        <p id="ae-passos"></p>
        <div class="timer" id="ae-timer"></div>
        <div class="barra"><span id="ae-barra" style="width:0%"></span></div>
      </div>
      <div class="linha" style="margin-top:12px;flex-wrap:nowrap">
        <button class="botao botao-secundario" id="ae-pular" style="flex:1">Próximo</button>
        <button class="botao" id="ae-play" style="flex:2">Começar</button>
      </div>
      <div class="cartao">
        <h3>Seu protocolo</h3>
        <ol class="lista-ex" id="ae-lista">${passos.map((x) => `<li>${x.nome} <span class="suave">· ${x.segundos} s</span></li>`).join("")}</ol>
      </div>`;

    function mostrarPasso() {
      const x = passos[k];
      $("#ae-video").innerHTML = `[Microvídeo]<br>${x.nome}<br>${x.segundos} s`;
      $("#ae-contagem").textContent = `Passo ${k + 1} de ${passos.length}`;
      $("#ae-nome").textContent = x.nome;
      $("#ae-passos").textContent = x.passos;
      $("#ae-timer").textContent = fmt(restante);
      const feito = passos.slice(0, k).reduce((s, y) => s + y.segundos, 0) + (x.segundos - restante);
      $("#ae-barra").style.width = Math.round((feito / total) * 100) + "%";
      $$("#ae-lista li").forEach((li, i) => li.style.fontWeight = i === k ? "700" : "400");
    }
    function proximo() {
      k++;
      if (k >= passos.length) return concluir();
      restante = passos[k].segundos; mostrarPasso();
    }
    function concluir() {
      pararTimer();
      reg.pausas++; reg.alivios = (reg.alivios || 0) + 1; salvar(); ultimaPausa = Date.now();
      tela.innerHTML = `<div class="centro">
        <h1>✓ Alívio feito</h1>
        <p>Conta como pausa de hoje: ${reg.pausas} pausa(s).</p>
        <div class="cartao" style="text-align:left">
          <h3>Como está agora?</h3>
          <div class="opcoes" id="ae-depois">
            <button class="opcao" data-v="melhor">😌 Aliviou</button>
            <button class="opcao" data-v="igual">😐 Ficou igual</button>
            <button class="opcao" data-v="pior">😣 Piorou</button>
          </div>
          <p class="pequeno" id="ae-resposta" style="margin:12px 0 0"></p>
        </div>
        <a class="botao botao-grande" href="#hoje" style="margin-top:12px">Voltar para Hoje</a></div>`;
      const RESP = {
        melhor: "Ótimo. Esse protocolo fica salvo como seu atalho para a próxima vez.",
        igual: "Normal no começo: o alívio vem da repetição ao longo do dia, não de uma pausa só. Tente de novo daqui a 50 minutos.",
        pior: "Pare os exercícios dessa região hoje e confira o Semáforo dos Sinais. Se a dor for forte, irradiar ou vier com dormência, procure um médico ou fisioterapeuta."
      };
      $$("#ae-depois .opcao").forEach((b) => b.onclick = () => {
        $$("#ae-depois .opcao").forEach((x) => x.setAttribute("aria-pressed", x === b));
        $("#ae-resposta").textContent = RESP[b.dataset.v];
        if (b.dataset.v === "pior") abrirSemaforo();
      });
    }
    $("#ae-play").onclick = () => {
      if (rodando) { pararTimer(); rodando = false; $("#ae-play").textContent = "Continuar"; return; }
      rodando = true; $("#ae-play").textContent = "Pausar";
      timerId = setInterval(() => { restante--; if (restante <= 0) return proximo(); mostrarPasso(); }, 1000);
    };
    $("#ae-pular").onclick = proximo;
    mostrarPasso();
  }

  /* =========================================================
     4. PAUSAS INVISÍVEIS
     ========================================================= */
  function invisiveis() {
    const lista = D.EXERCICIOS.filter((e) => e.invisivel);
    tela.innerHTML = `
      <h1>Pausas invisíveis</h1>
      <p class="suave">Para reunião de câmera ligada ou atendimento. Ninguém percebe e o corpo descongela.</p>
      ${lista.map((e) => `<div class="cartao"><h3>${e.nome}</h3><p class="pequeno" style="margin:0">${e.passos}</p></div>`).join("")}
      <div class="cartao"><h3>3 respirações profundas</h3><p class="pequeno" style="margin:0">Solte os ombros na saída do ar.</p></div>
      <button class="botao botao-bloco" id="inv-ok" style="margin-top:12px">Fiz uma pausa invisível (+1)</button>`;
    $("#inv-ok").onclick = () => { registroDia(Math.min(diaAtual(), 21)).pausas++; salvar(); ultimaPausa = Date.now(); location.hash = "#hoje"; };
  }

  /* =========================================================
     5. LEMBRETES (Regra 50/2 no horário de trabalho)
     Observação: lembretes com o painel FECHADO exigem push
     com servidor (versão futura). Hoje funcionam com o painel
     aberto em uma aba ou instalado na tela inicial.
     ========================================================= */
  let ultimaPausa = Date.now();
  function lembretes() {
    const p = estado.perfil;
    const perm = "Notification" in window ? Notification.permission : "indisponivel";
    tela.innerHTML = `
      <h1>Lembretes</h1>
      <p class="suave">O painel lembra você de pausar dentro do seu horário de trabalho.</p>
      <div class="cartao">
        <label>Intervalo entre pausas (minutos)<br>
          <select id="lb-int" class="opcao">${[30, 40, 50, 60, 90].map((m) => `<option ${p.intervaloMin === m ? "selected" : ""}>${m}</option>`).join("")}</select></label>
        <div class="grade-2" style="margin-top:12px">
          <label>Começo do trabalho<br><input type="time" id="lb-ini" value="${p.inicioTrabalho}" class="opcao"></label>
          <label>Fim do trabalho<br><input type="time" id="lb-fim" value="${p.fimTrabalho}" class="opcao"></label>
        </div>
        <p class="pequeno suave" style="margin-top:8px">Meta de hoje pela Regra 50/2: <strong id="lb-meta">${L.metaPausas(p)}</strong> pausas.</p>
        <button class="botao botao-bloco" id="lb-salvar">Salvar</button>
      </div>
      <div class="cartao">
        <h3>Notificações</h3>
        <p class="pequeno">${perm === "granted" ? "✓ Notificações ativadas." : perm === "denied" ? "Notificações bloqueadas no navegador. Libere nas configurações do celular." : perm === "indisponivel" ? "Este navegador não suporta notificações. O lembrete aparece como aviso no topo do painel." : "Ative para receber o lembrete mesmo com outra aba aberta."}</p>
        ${perm === "default" ? `<button class="botao botao-secundario botao-bloco" id="lb-perm">Ativar notificações</button>` : ""}
      </div>
      <div class="cartao"><h3>Em breve</h3><p class="pequeno" style="margin:0">Pausas na agenda: micro-pausas sugeridas nos intervalos entre reuniões, integradas ao calendário.</p></div>`;
    $("#lb-salvar").onclick = () => {
      p.intervaloMin = Number($("#lb-int").value);
      p.inicioTrabalho = $("#lb-ini").value; p.fimTrabalho = $("#lb-fim").value;
      salvar(); $("#lb-meta").textContent = L.metaPausas(p);
      abrirModal(`<p>Lembretes salvos.</p><button class="botao botao-bloco" onclick="this.closest('dialog').close()">Ok</button>`);
    };
    const bp = $("#lb-perm");
    if (bp) bp.onclick = () => Notification.requestPermission().then(lembretes);
  }

  function verificarLembrete() {
    const p = estado.perfil;
    if (!p || diaAtual() > 21) return;
    const agora = new Date();
    const min = agora.getHours() * 60 + agora.getMinutes();
    const dentro = min >= L.paraMinutos(p.inicioTrabalho) && min < L.paraMinutos(p.fimTrabalho);
    const passou = (Date.now() - ultimaPausa) / 60000 >= (p.intervaloMin || C.intervaloPadraoMin);
    const banner = $("#lembrete-banner");
    if (dentro && passou) {
      banner.innerHTML = `⏱️ Já se passaram ${p.intervaloMin} minutos. Hora da pausa de 2 minutos! <a href="#pausa">Pausar agora</a>`;
      banner.classList.remove("oculto");
      if ("Notification" in window && Notification.permission === "granted" && document.hidden) {
        new Notification("Hora de descongelar", { body: "2 minutos: Reposiciona, Respira, Remexe.", icon: "../assets/img/icone.svg" });
      }
      ultimaPausa = Date.now(); // evita repetir o aviso a cada verificação
    } else if (!dentro) {
      banner.classList.add("oculto");
    }
  }
  setInterval(verificarLembrete, 30000);
  window.addEventListener("hashchange", () => { if (location.hash === "#pausa") $("#lembrete-banner").classList.add("oculto"); });

  /* =========================================================
     6. PROGRESSO
     ========================================================= */
  function progresso() {
    const n = Math.min(diaAtual(), 21);
    const e = estado.escalaDor;
    const totalPausas = Object.values(estado.dias).reduce((s, d) => s + (d.pausas || 0), 0);
    tela.innerHTML = `
      <h1>Seu progresso</h1>
      <div class="grade-2" style="grid-template-columns:repeat(3,1fr)">
        <div class="cartao stat"><strong>${sequencia()}</strong><span class="pequeno suave">dias seguidos</span></div>
        <div class="cartao stat" style="margin-top:0"><strong>${diasFeitos()}/21</strong><span class="pequeno suave">dias feitos</span></div>
        <div class="cartao stat" style="margin-top:0"><strong>${totalPausas}</strong><span class="pequeno suave">pausas</span></div>
      </div>
      <div class="cartao">
        <h3>Calendário de checks</h3>
        <div class="calendario">${Array.from({ length: 21 }, (_, i) => {
          const d = i + 1, r = estado.dias[d];
          const cls = [r?.feito ? "feito" : "", d === n ? "hoje" : "", d > n ? "futuro" : ""].join(" ");
          return `<div class="${cls}" title="${r ? r.pausas + " pausas" : ""}">${d}</div>`;
        }).join("")}</div>
      </div>
      <div class="cartao">
        <h3>Escala da Dor</h3>
        <table class="tabela"><thead><tr><th>Dia 1</th><th>Dia 11</th><th>Dia 21</th></tr></thead>
          <tbody><tr>${[1, 11, 21].map((d) => `<td><strong>${e[d] ?? "–"}</strong>${e[d] != null ? "/10" : ""}</td>`).join("")}</tr></tbody></table>
      </div>
      <div class="cartao">
        <h3>Pausas por dia</h3>
        ${Array.from({ length: n }, (_, i) => {
          const d = i + 1, p = estado.dias[d]?.pausas || 0;
          return `<div class="linha pequeno" style="flex-wrap:nowrap"><span style="width:52px">Dia ${d}</span><div class="barra" style="flex:1"><span style="width:${Math.min(100, p * 10)}%"></span></div><span style="width:24px;text-align:right">${p}</span></div>`;
        }).join("")}
      </div>`;
  }

  /* =========================================================
     7. AULAS
     ========================================================= */
  function aulas() {
    tela.innerHTML = `
      <h1>Mini curso</h1>
      <p class="suave">5 aulas curtas, cerca de 45 minutos no total.</p>
      ${D.AULAS.map((a) => `
        <div class="cartao">
          <span class="etiqueta">Aula ${a.n} · ${a.min} min</span>
          <h3 style="margin-top:8px">${a.titulo}</h3>
          <div class="video-placeholder">[Vídeo da aula ${a.n}]</div>
          <p class="pequeno" style="margin:12px 0 0"><strong>Ideia:</strong> ${a.ideia}<br><strong>Analogia:</strong> ${a.analogia}<br><strong>Ação para hoje:</strong> ${a.acao}</p>
          <p class="pequeno suave" style="margin:8px 0 0"><em>${a.gancho}</em></p>
        </div>`).join("")}`;
  }

  /* =========================================================
     8. BÔNUS (liberados por compra) + PDFs
     ========================================================= */
  function bonus() {
    const bumps = D.BONUS.filter((b) => b.id.startsWith("bump"));
    tela.innerHTML = `
      <h1>Materiais e bônus</h1>
      <div class="cartao">
        <h3>PDFs de apoio</h3>
        ${D.PDFS.map((p) => `<p style="margin:6px 0">📄 <a href="${p.arquivo}">${p.nome}</a></p>`).join("")}
      </div>
      ${bumps.map((b) => estado.compras[b.id] ? `
        <div class="cartao"><span class="etiqueta">Liberado</span><h3 style="margin-top:8px">${b.nome}</h3><p class="pequeno">${b.descricao}</p>
          <div class="video-placeholder">[Conteúdo do bônus]</div></div>` : `
        <div class="cartao bloqueado"><span class="etiqueta">🔒 Não adquirido</span><h3 style="margin-top:8px">${b.nome}</h3><p class="pequeno">${b.descricao}</p>
          <a class="botao botao-secundario" href="#">Adicionar por ${formatarPreco(b.preco)}</a></div>`).join("")}`;
  }

  /* =========================================================
     9. DIA 21: comparação, certificado e oferta
     ========================================================= */
  function dia21() {
    const e = estado.escalaDor;
    const reg21 = registroDia(21);
    const precisaEscala = e[21] == null;
    const diff = e[1] != null && e[21] != null ? e[1] - e[21] : null;
    tela.innerHTML = `
      <h1>🎉 Dia 21: seu corpo descongelado</h1>
      ${precisaEscala ? `
        <div class="cartao"><h3>Marque sua Escala da Dor final</h3>
          <div class="escala" id="escala21">${Array.from({ length: 11 }, (_, i) => `<button data-v="${i}">${i}</button>`).join("")}</div>
          <div class="escala-legenda"><span>Nenhuma</span><span>Insuportável</span></div></div>` : `
        <div class="cartao">
          <h3>Sua evolução</h3>
          <table class="tabela"><thead><tr><th>Dia 1</th><th>Dia 11</th><th>Dia 21</th></tr></thead>
            <tbody><tr>${[1, 11, 21].map((d) => `<td><strong>${e[d] ?? "–"}</strong></td>`).join("")}</tr></tbody></table>
          <p style="margin-top:12px">${diff > 0 ? `Sua dor caiu <strong>${diff} ponto(s)</strong> na escala.` : diff === 0 ? "Sua dor ficou estável, e você criou o hábito das pausas, que é o que impede a dor de piorar." : "Sua dor não diminuiu. Vale conversar com um médico ou fisioterapeuta e levar este registro."}</p>
          <p class="pequeno suave">Você fez ${diasFeitos()} de 21 dias e ${Object.values(estado.dias).reduce((s, d) => s + (d.pausas || 0), 0)} pausas.</p>
        </div>
        <div class="certificado" id="certificado">
          <p class="pequeno suave">Religar · Certificado</p>
          <h2>Desafio Corpo Descongelado 21 Dias</h2>
          <p>Concluído por</p>
          <p><input id="cert-nome" placeholder="Seu nome" class="opcao" style="text-align:center;font-size:1.2rem;font-weight:700" value="${estado.perfil.nome || ""}"></p>
          <p class="pequeno">${new Date().toLocaleDateString("pt-BR")}</p>
        </div>
        <button class="botao botao-secundario botao-bloco" id="imprimir" style="margin-top:12px">Salvar certificado (imprimir / PDF)</button>

        <div class="cartao" style="margin-top:24px">
          <span class="etiqueta">Próximo passo</span>
          <h2 style="margin-top:8px">${D.BONUS.find((b) => b.id === "upsell").nome}</h2>
          <p>${D.BONUS.find((b) => b.id === "upsell").descricao}</p>
          <p class="preco" style="font-size:1.6rem;font-weight:800">${formatarPreco(C.precos.upsell)}</p>
          <a class="botao botao-grande" href="${C.checkout.upsell}">Quero continuar por 60 dias</a>
          <p class="centro pequeno" style="margin-top:12px"><a href="${C.checkout.downsell}">Prefiro a versão Essencial por ${formatarPreco(C.precos.downsell)} (sem comunidade e sem encontros ao vivo)</a></p>
        </div>`}`;
    $$("#escala21 button").forEach((b) => b.onclick = () => {
      e[21] = Number(b.dataset.v); reg21.feito = reg21.feito || reg21.pausas >= C.pausasMinimasDiaCaotico; salvar(); dia21();
    });
    const nome = $("#cert-nome");
    if (nome) nome.onchange = () => { estado.perfil.nome = nome.value; salvar(); };
    const imp = $("#imprimir");
    if (imp) imp.onclick = () => window.print();
  }

  /* =========================================================
     10. MAIS / CONFIGURAÇÕES
     ========================================================= */
  function mais() {
    const p = estado.perfil;
    tela.innerHTML = `
      <h1>Mais</h1>
      <div class="cartao">
        <p style="margin:6px 0"><a href="#invisiveis">👀 Pausas invisíveis</a></p>
        <p style="margin:6px 0"><a href="#lembretes">🔔 Lembretes</a></p>
        <p style="margin:6px 0"><a href="#bonus">🎁 Materiais e bônus</a></p>
        <p style="margin:6px 0"><a href="#" id="ver-semaforo">🚦 Semáforo dos Sinais</a></p>
      </div>
      <div class="cartao">
        <h3>Minha trilha</h3>
        <div class="opcoes" id="cfg-trilha">${Object.entries(D.TRILHAS).map(([id, t]) =>
          `<button class="opcao" data-id="${id}" aria-pressed="${p.trilha === id}">${t.nome}</button>`).join("")}</div>
        <h3 style="margin-top:16px">Região de foco</h3>
        <div class="opcoes" id="cfg-regiao">${Object.entries(D.REGIOES).map(([id, r]) =>
          `<button class="opcao" data-id="${id}" aria-pressed="${p.regiaoFoco === id}">${r.emoji} ${r.nome}</button>`).join("")}</div>
      </div>
      <div class="cartao pequeno suave">
        Este desafio é educação, prevenção e rotina, não tratamento. Não substitui médico ou fisioterapeuta.
        Seus dados ficam salvos neste aparelho. <a href="#">Política de privacidade (LGPD)</a>
      </div>
      ${C.modoTeste ? `
      <div class="cartao" style="border:2px dashed var(--cor-amarelo)">
        <h3>🧪 Modo de teste</h3>
        <p class="pequeno">Só aparece com <code>modoTeste: true</code> em config.js. Desligar antes de publicar.</p>
        <div class="linha">
          <button class="botao botao-secundario" id="t-ant">− 1 dia</button>
          <button class="botao botao-secundario" id="t-prox">+ 1 dia</button>
          <button class="botao botao-secundario" id="t-21">Ir ao dia 21</button>
        </div>
        <p class="pequeno" style="margin-top:12px">Simular compras:</p>
        ${["bump1", "bump2", "bump3", "upsell"].map((id) => `<label class="check-linha"><input type="checkbox" class="check" data-compra="${id}" ${estado.compras[id] ? "checked" : ""}> ${D.BONUS.find((b) => b.id === id).nome}</label>`).join("")}
        <button class="botao botao-bloco" id="t-zerar" style="margin-top:12px;background:var(--cor-vermelho)">Apagar tudo e recomeçar</button>
      </div>` : ""}`;
    $("#ver-semaforo").onclick = (e) => { e.preventDefault(); abrirSemaforo(); };
    $$("#cfg-trilha .opcao").forEach((b) => b.onclick = () => { p.trilha = b.dataset.id; salvar(); mais(); });
    $$("#cfg-regiao .opcao").forEach((b) => b.onclick = () => { p.regiaoFoco = b.dataset.id; salvar(); mais(); });
    if (C.modoTeste) {
      const mover = (d) => { estado.deslocamentoDias = (estado.deslocamentoDias || 0) + d; salvar(); navegar(); };
      $("#t-ant").onclick = () => mover(-1);
      $("#t-prox").onclick = () => mover(1);
      $("#t-21").onclick = () => mover(21 - diaAtual());
      $$("[data-compra]").forEach((c) => c.onchange = () => { estado.compras[c.dataset.compra] = c.checked; salvar(); });
      $("#t-zerar").onclick = () => { if (confirm("Apagar todo o progresso?")) { S.zerar(); estado = S.carregar(); location.hash = "#boasvindas"; navegar(); } };
    }
  }

  /* ---------- Modal e botão "Senti algo estranho" ---------- */
  function abrirModal(html) {
    const m = $("#modal");
    m.innerHTML = html;
    if (m.showModal) m.showModal(); else m.setAttribute("open", "");
  }
  function abrirSemaforo() {
    abrirModal(`<h2>🚦 Semáforo dos Sinais</h2>${semaforoExplicado()}
      <p class="aviso aviso-vermelho" style="margin-top:12px">Sentiu algo do vermelho? Pare os exercícios da região e procure um médico ou fisioterapeuta.</p>
      <button class="botao botao-bloco" onclick="this.closest('dialog').close()" style="margin-top:12px">Entendi</button>`);
  }
  $("#botao-estranho").onclick = abrirSemaforo;

  navegar();
})();
