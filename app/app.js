/* =========================================================
   PAINEL DO DESAFIO (seção 14 do briefing)
   Telas: boas-vindas, hoje, pausa, invisiveis, lembretes,
   progresso, aulas, bonus, final, mais.
   ========================================================= */
(function () {
  const C = window.RELIGAR_CONFIG;
  const D = window.RELIGAR_DADOS;
  const L = window.RELIGAR_LOGICA;
  const S = window.RELIGAR_STORE;

  const TOTAL = C.totalDias;
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
    let n = Math.min(diaAtual(), TOTAL);
    if (!estado.dias[n]?.feito) n -= 1; // hoje ainda pode ser feito
    let s = 0;
    while (n >= 1 && estado.dias[n]?.feito) { s++; n--; }
    return s;
  }
  const diasFeitos = () => Object.values(estado.dias).filter((d) => d.feito).length;

  /* ---------- Roteamento ---------- */
  const ROTAS = { boasvindas, hoje, pausa, alivio: central, montar: alivio, seguranca, socorro, habitos, snacks, checklist, invisiveis, lembretes, progresso, aulas, bonus, final, mais, medico: telaMedico, "relatorio-medico": relatorioMedico };
  function navegar() {
    pararTimer();
    let rota = (location.hash || "#hoje").slice(1);
    if (!estado.perfil && rota !== "boasvindas") return (location.hash = "#boasvindas");
    if (rota === "hoje" && diaAtual() > TOTAL) rota = "final";
    if (rota.startsWith("trilha-") && D.TRILHAS_ZONA[rota.slice(7)]) trilha(rota.slice(7));
    else (ROTAS[rota] || hoje)();
    const aba = ["medico", "relatorio-medico"].includes(rota) ? "mais" : rota.startsWith("trilha-") || ["montar", "seguranca", "socorro", "habitos", "snacks", "checklist"].includes(rota) ? "alivio" : rota;
    $$("#nav a").forEach((a) => a.classList.toggle("ativo", a.dataset.r === aba));
    $("#nav").classList.toggle("oculto", rota === "boasvindas");
    $("#botao-estranho").classList.toggle("oculto", rota === "boasvindas");
    $("#topo-dia").textContent = estado.perfil ? (diaAtual() > TOTAL ? "Desafio concluído" : `Dia ${diaAtual()} de ${TOTAL}`) : "";
    window.scrollTo(0, 0);
  }
  window.addEventListener("hashchange", navegar);

  /* =========================================================
     1. BOAS-VINDAS E MAPA DA DOR
     ========================================================= */
  function boasvindas() {
    const q = S.lerQuiz() || {};
    const temQuiz = !!q.regiaoFoco;
    const p = {
      regioes: q.regioes || [], regiaoFoco: q.regiaoFoco || null,
      sinais: q.sinais || [], rotina: q.rotina || null,
      inicioTrabalho: "09:00", fimTrabalho: "18:00", intervaloMin: C.intervaloPadraoMin,
      tempoLivre: q.tempoLivre || 2, localPadrao: q.localPadrao || "sentado"
    };
    const a = { dor: q.intensidade ?? null, trava: null, remedio: null };
    let editando = !temQuiz;

    function render() {
      tela.innerHTML = `
        <span class="etiqueta">Avaliação inicial · 1 minuto</span>
        <h1 style="margin-top:8px">Seu ponto de partida</h1>
        <p class="suave">Estas respostas são o primeiro ponto do seu gráfico. Daqui a 30 dias você compara e vê o quanto mudou.</p>
        <div class="aviso" style="margin-bottom:16px">Se você tem diagnóstico, dor forte ou está em tratamento, converse com seu médico ou fisioterapeuta antes de começar.</div>

        ${temQuiz && !editando ? `
        <div class="cartao">
          <div class="linha" style="justify-content:space-between"><h3 style="margin:0">✓ Seu Mapa da Dor</h3><a href="#" id="bv-editar" class="pequeno">alterar</a></div>
          <p class="pequeno" style="margin:8px 0 0">Região de foco: <strong>${D.REGIOES[p.regiaoFoco].emoji} ${D.REGIOES[p.regiaoFoco].nome}</strong><br>
          Rotina: <strong>${(L.ROTINAS_TRABALHO.find((o) => o.id === p.rotina) || {}).texto || "não informada"}</strong></p>
        </div>` : `
        <div class="cartao">
          <h3>Onde dói mais?</h3>
          <div class="opcoes" id="bv-regiao">${Object.entries(D.REGIOES).map(([id, r]) =>
            `<button class="opcao" data-id="${id}" aria-pressed="${p.regiaoFoco === id}"><span class="emoji">${r.emoji}</span>${r.nome}</button>`).join("")}</div>
        </div>
        <div class="cartao">
          <h3>Sua rotina de trabalho</h3>
          <div class="opcoes" id="bv-rotina">${L.ROTINAS_TRABALHO.map((o) =>
            `<button class="opcao" data-id="${o.id}" aria-pressed="${p.rotina === o.id}"><span class="emoji">${o.emoji}</span>${o.texto}</button>`).join("")}</div>
        </div>`}

        <div class="cartao avaliacao">
          <h3>📊 Como você está hoje</h3>
          <p class="pequeno" style="margin:0 0 6px"><strong>1. Dor${p.regiaoFoco ? " " + D.REGIOES[p.regiaoFoco].no : ""} (0 a 10)</strong></p>
          <div class="escala" id="bv-dor">${Array.from({ length: 11 }, (_, i) => `<button data-v="${i}" aria-pressed="${a.dor === i}">${i}</button>`).join("")}</div>
          <div class="escala-legenda"><span>Nenhuma</span><span>Insuportável</span></div>
          <p class="pequeno" style="margin:14px 0 6px"><strong>2. Quanto o corpo trava num dia normal?</strong></p>
          <div class="av-opcoes" id="bv-trava">${D.AVALIACAO.trava.map(([v, t]) => `<button class="opcao" data-v="${v}" aria-pressed="${a.trava === v}">${t}</button>`).join("")}</div>
          <p class="pequeno" style="margin:14px 0 6px"><strong>3. Nos últimos dias, precisou de remédio para dor?</strong></p>
          <div class="av-opcoes" id="bv-remedio">${D.AVALIACAO.remedio.map(([v, t]) => `<button class="opcao" data-v="${v}" aria-pressed="${a.remedio === v}">${t}</button>`).join("")}</div>
        </div>

        <div class="cartao">
          <h3>Horário de trabalho</h3>
          <p class="pequeno suave">Para lembrar você das pausas só no expediente.</p>
          <div class="grade-2">
            <label>Começo<br><input type="time" id="bv-ini" value="${p.inicioTrabalho}" class="opcao"></label>
            <label>Fim<br><input type="time" id="bv-fim" value="${p.fimTrabalho}" class="opcao"></label>
          </div>
        </div>

        <button class="botao botao-grande" id="bv-ok" style="margin-top:16px">Ver meu plano</button>`;

      const guardarHorario = () => { p.inicioTrabalho = $("#bv-ini").value || p.inicioTrabalho; p.fimTrabalho = $("#bv-fim").value || p.fimTrabalho; };
      const redesenhar = () => { guardarHorario(); const y = window.scrollY; render(); window.scrollTo(0, y); };
      const ed = $("#bv-editar");
      if (ed) ed.onclick = (e) => { e.preventDefault(); editando = true; redesenhar(); };
      $$("#bv-regiao .opcao").forEach((b) => b.onclick = () => { p.regiaoFoco = b.dataset.id; if (!p.regioes.includes(p.regiaoFoco)) p.regioes = [p.regiaoFoco, ...p.regioes]; redesenhar(); });
      $$("#bv-rotina .opcao").forEach((b) => b.onclick = () => { p.rotina = b.dataset.id; redesenhar(); });
      $$("#bv-dor button").forEach((b) => b.onclick = () => { a.dor = Number(b.dataset.v); redesenhar(); });
      $$("#bv-trava .opcao").forEach((b) => b.onclick = () => { a.trava = Number(b.dataset.v); redesenhar(); });
      $$("#bv-remedio .opcao").forEach((b) => b.onclick = () => { a.remedio = b.dataset.v === "true"; redesenhar(); });
      $("#bv-ok").disabled = !(p.regiaoFoco && p.rotina && a.dor !== null && a.trava !== null && a.remedio !== null);
      $("#bv-ok").onclick = () => {
        guardarHorario();
        p.intensidadeInicial = a.dor;
        const diag = L.diagnosticar({ ...p, intensidade: a.dor });
        estado.perfil = { ...p, trilha: diag.trilha, corInicial: diag.cor };
        estado.dataInicio = hojeISO();
        estado.inicial = { ...a, data: hojeISO() };
        salvar();
        mostrarResultadoMapa(diag);
      };
    }
    render();
  }

  function mostrarResultadoMapa(diag) {
    const reg = D.REGIOES[diag.regiaoFoco], trilha = D.TRILHAS[diag.trilha], sem = D.SEMAFORO[diag.cor];
    tela.innerHTML = `
      <span class="etiqueta">Seu plano</span>
      <h1 style="margin-top:8px">Região de foco: ${reg.emoji} ${reg.nome}</h1>
      <div class="cartao"><h3>Sua trilha de alívio: ${D.TRILHAS_ZONA[D.trilhaDaRegiao(diag.regiaoFoco)].nome}</h3><p class="pequeno">Na aba Alívio: SOS Rápido (1 min), SOS Completo (3 min) e o seu Checklist Matinal e Noturno.</p></div>
      <div class="cartao"><h3>Sua rotina: ${trilha.nome}</h3><p class="pequeno">${trilha.dica}</p></div>
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
    const semana = D.SEMANAS[n <= 7 ? 0 : n <= 14 ? 1 : n <= 21 ? 2 : 3];

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

    const plano = L.planoDoDia({ dia: n, noite: reg.noite, semaforo: semaforoMedico(reg, estado.perfil.regiaoFoco), caotico: reg.caotico, perfil: estado.perfil });
    const motivoMedico = bloqueadoPeloMedico(estado.perfil.regiaoFoco);
    if (motivoMedico) plano.avisos[0] = motivoMedico;
    const pctPausas = Math.min(100, Math.round((reg.pausas / plano.metaPausas) * 100));
    reg.avaliacao = reg.avaliacao || { dor: null, trava: null, remedio: null };
    if (n === 1 && reg.avaliacao.dor === null && estado.inicial) reg.avaliacao = { dor: estado.inicial.dor, trava: estado.inicial.trava, remedio: estado.inicial.remedio };
    const av = reg.avaliacao;
    const avaliacaoOk = av.dor !== null && av.trava !== null && av.remedio !== null;
    const pausasOk = reg.pausas >= plano.minimoPausas;
    const podeConcluir = pausasOk && avaliacaoOk;
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

      <div class="cartao avaliacao ${avaliacaoOk ? "ok" : ""}" id="avaliacao">
        <div class="linha" style="justify-content:space-between"><h3 style="margin:0">📊 Avaliação do dia</h3><span class="etiqueta">${avaliacaoOk ? "✓ feita" : "30 segundos"}</span></div>
        <p class="pequeno suave" style="margin:4px 0 12px">Responda no fim do expediente. É assim que você enxerga sua evolução.</p>
        <p class="pequeno" style="margin:0 0 6px"><strong>1. Dor hoje ${D.REGIOES[estado.perfil.regiaoFoco].no} (0 a 10)</strong></p>
        <div class="escala" id="av-dor">${Array.from({ length: 11 }, (_, i) => `<button data-v="${i}" aria-pressed="${av.dor === i}">${i}</button>`).join("")}</div>
        <div class="escala-legenda"><span>Nenhuma</span><span>Insuportável</span></div>
        <p class="pequeno" style="margin:14px 0 6px"><strong>2. Quanto o corpo travou hoje?</strong></p>
        <div class="av-opcoes" id="av-trava">${D.AVALIACAO.trava.map(([v, t]) => `<button class="opcao" data-v="${v}" aria-pressed="${av.trava === v}">${t}</button>`).join("")}</div>
        <p class="pequeno" style="margin:14px 0 6px"><strong>3. ${remediosHoje().length ? "Precisou de remédio para dor além do que o médico receitou?" : "Precisou de remédio para dor hoje?"}</strong></p>
        <div class="av-opcoes" id="av-remedio">${D.AVALIACAO.remedio.map(([v, t]) => `<button class="opcao" data-v="${v}" aria-pressed="${av.remedio === v}">${t}</button>`).join("")}</div>
        ${avaliacaoOk ? resumoComparacao(n) : ""}
        ${avaliacaoOk && ![7, 14, 21, 30].includes(n) ? `<div class="av-mini">${graficoSemanal()}<p class="pequeno" style="margin:6px 0 0"><a href="#progresso">ver a evolução completa</a></p></div>` : ""}
      </div>
      ${avaliacaoOk ? relatorioSemana(n) : ""}

      ${D.REVISOES[n] ? renderRevisao(n, reg) : ""}

      ${cartoesMedicoHoje(reg)}

      <div class="cartao">
        <label class="check-linha"><input type="checkbox" class="check" id="caotico" ${reg.caotico ? "checked" : ""}>
          <span><strong>Hoje é um dia caótico</strong><br><span class="pequeno suave">${D.DIA_CAOTICO.como}</span></span></label>
      </div>

      <button class="botao botao-grande" id="concluir" ${podeConcluir && !reg.feito ? "" : "disabled"} style="margin-top:12px">
        ${reg.feito ? "✓ Dia concluído" : podeConcluir ? "Marcar dia como feito" : !pausasOk ? `Faltam ${plano.minimoPausas - reg.pausas} pausas para o check` : "Falta a avaliação do dia"}
      </button>

      <p class="centro suave" style="margin-top:24px"><em>${info.gancho}</em></p>
    `;

    $("#refazer").onclick = (e) => { e.preventDefault(); reg.noite = null; reg.semaforo = null; salvar(); hoje(); };
    $("#pausa-manual").onclick = (e) => { e.preventDefault(); reg.pausas++; salvar(); hoje(); };
    $("#tarefa").onchange = (e) => { reg.tarefa = e.target.checked; salvar(); };
    $("#caotico").onchange = (e) => { reg.caotico = e.target.checked; salvar(); hoje(); };
    $$("[data-rem]").forEach((c) => c.onchange = () => { reg.remediosTomados = reg.remediosTomados || {}; reg.remediosTomados[c.dataset.rem] = c.checked; salvar(); });
    $$("[data-pilar]").forEach((c) => c.onchange = () => { reg.pilares[c.dataset.pilar] = c.checked; salvar(); });
    const responder = (campo, valor) => {
      av[campo] = valor;
      if (campo === "dor") estado.escalaDor[n] = valor;
      salvar();
      const y = window.scrollY; hoje(); window.scrollTo(0, y);
    };
    $$("#av-dor button").forEach((b) => b.onclick = () => responder("dor", Number(b.dataset.v)));
    $$("#av-trava .opcao").forEach((b) => b.onclick = () => responder("trava", Number(b.dataset.v)));
    $$("#av-remedio .opcao").forEach((b) => b.onclick = () => responder("remedio", b.dataset.v === "true"));
    $$("[data-rev]").forEach((b) => b.onclick = () => { reg.revisao = Number(b.dataset.rev); salvar(); hoje(); });
    $("#concluir").onclick = () => {
      reg.feito = true; salvar();
      abrirModal(`<h2>🎉 Dia ${n} feito!</h2><p>Sequência: <strong>${sequencia()} dia(s)</strong>. ${n === TOTAL ? "Hoje é a celebração!" : "Amanhã tem mais 2 minutos de cada vez."}</p>
        <button class="botao botao-bloco" onclick="this.closest('dialog').close()">Fechar</button>`);
      if (n === TOTAL) location.hash = "#final"; else hoje();
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
    if (b.tipo === "checklist") detalhe = "";
    const icone = { pausas: "⏱️", rotina: "🧘", regiao: "🎯", ritual: "🌙", caminhada: "🚶", checklist: "📋", lanches: "🍎" }[b.tipo];
    const link = { checklist: "#checklist", lanches: "#snacks" }[b.tipo];
    if (link) return `<div class="bloco"><span>${icone}</span><div style="flex:1"><strong>${b.texto}</strong> <a class="pequeno" href="${link}">abrir</a></div></div>`;
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
  function pararTimer() { if (timerId) { clearInterval(timerId); timerId = null; } voz.parar(); }

  /* Guia por voz + vibração: a pessoa faz o exercício sem olhar a tela.
     Hoje usa a voz do próprio celular (grátis). Depois dá para trocar por
     áudios gravados ou gerados com uma voz profissional. */
  const voz = {
    ligada: () => estado.perfil?.voz !== false,
    falar(texto) {
      if (!this.ligada() || !("speechSynthesis" in window)) return;
      try {
        speechSynthesis.cancel();
        const u = new SpeechSynthesisUtterance(texto.replace(/<[^>]+>/g, " "));
        u.lang = "pt-BR"; u.rate = 0.95;
        const v = speechSynthesis.getVoices().find((x) => (x.lang || "").toLowerCase().startsWith("pt"));
        if (v) u.voice = v;
        speechSynthesis.speak(u);
      } catch (e) { /* sem voz neste aparelho */ }
    },
    vibrar(padrao = 150) { try { if (navigator.vibrate) navigator.vibrate(padrao); } catch (e) {} },
    parar() {
      try { if ("speechSynthesis" in window) speechSynthesis.cancel(); } catch (e) {}
      if (this.audio) { try { this.audio.pause(); } catch (e) {} this.audio = null; }
    },
    /* Toca o áudio profissional do exercício (assets/audio/<id>.mp3).
       Se o arquivo não existir, cai para a voz do celular com o texto. */
    tocar(id, textoReserva, trilha) {
      if (!this.ligada()) return;
      this.parar();
      if (!id) return this.falar(textoReserva);
      const pasta = (C.vozes || {})[trilha] || "masculina";
      const a = new Audio(`../assets/audio/${pasta}/${id}.mp3`);
      this.audio = a;
      a.onerror = () => { if (this.audio === a) { this.audio = null; this.falar(textoReserva); } };
      a.play().catch(() => { if (this.audio === a) { this.audio = null; this.falar(textoReserva); } });
    }
  };
  /* Ilustração do exercício (assets/img/exercicios/<id>.png). Sem arquivo, mostra o espaço reservado. */
  function midiaExercicio(x) {
    const reserva = `<div class="video-placeholder vertical">[Ilustração]<br>${x.nome}<br>${x.segundos} s</div>`;
    if (!x.id) return reserva;
    return `<img class="ilustracao" src="../assets/img/exercicios/${x.id}.webp" alt="${x.nome}"
      onerror="this.outerHTML=this.dataset.reserva" data-reserva="${reserva.replace(/"/g, "&quot;")}">`;
  }
  const botaoVoz = () => `<button class="botao-voz" id="btn-voz" aria-pressed="${voz.ligada()}">${voz.ligada() ? "🔊 Guia por voz ligado" : "📳 Só vibração"}</button>`;
  function ligarBotaoVoz() {
    const b = $("#btn-voz");
    if (b) b.onclick = () => { estado.perfil.voz = !voz.ligada(); salvar(); if (!voz.ligada()) voz.parar(); b.outerHTML = botaoVoz(); ligarBotaoVoz(); };
  }

  function pausa() {
    const n = Math.min(diaAtual(), TOTAL);
    const reg = registroDia(n);
    const vermelho = semaforoMedico(reg, estado.perfil.regiaoFoco) === "vermelho";
    const exercicio = L.exercicioRemexe(estado.perfil.regiaoFoco, reg.pausas);
    const etapas = D.OS_3_RS.map((r, i) => {
      if (i === 2 && vermelho) return { ...r, nome: "Respira mais", texto: "Semáforo vermelho: sem exercícios da região. Continue respirando devagar e mexa suavemente o resto do corpo." };
      if (i === 2) return { ...r, texto: `<strong>${exercicio.nome}</strong><br>${exercicio.passos}` };
      return r;
    });
    const total = etapas.reduce((s, e) => s + e.segundos, 0);
    let restante = total, rodando = false, faladoP = -1;

    tela.innerHTML = `
      <div class="linha" style="justify-content:space-between"><h1 style="margin:0">Pausa de 2 minutos</h1>${botaoVoz()}</div>
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
      if (rodando && idx !== faladoP) { faladoP = idx; voz.vibrar(); voz.falar(`${etapas[idx].nome}. ${etapas[idx].texto}`); }
    }
    function concluir() {
      pararTimer();
      reg.pausas++; salvar(); ultimaPausa = Date.now();
      voz.vibrar([120, 60, 120]); voz.falar("Pausa feita. Seu corpo agradece.");
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
    ligarBotaoVoz();
    atualizar();
  }
  const fmt = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  /* =========================================================
     3a. CENTRAL DE ALÍVIO EXPRESS
     Trilhas por zona de dor × formatos (expediente, matinal, noturno)
     ========================================================= */
  function central() {
    const minha = D.trilhaDaRegiao(estado.perfil.regiaoFoco);
    const ordem = [minha, ...Object.keys(D.TRILHAS_ZONA).filter((k) => k !== minha)];
    const B = D.BONUS_INCLUSOS;
    tela.innerHTML = `
      <span class="etiqueta">Central de Microvídeos Express</span>
      <h1 style="margin-top:8px">Qual alívio você precisa agora?</h1>

      <a class="cartao socorro-atalho" href="#socorro">
        <span style="font-size:1.6rem">🚨</span>
        <span><strong>Travou agora?</strong><br><span class="pequeno">Guia de Crise: o que fazer nos primeiros minutos</span></span>
      </a>

      <h2 class="modulo-titulo"><span class="etiqueta">Módulo 1</span> SOS Alívio Imediato</h2>
      <p class="pequeno suave">Vídeos por zona de dor para apagar o incêndio na hora da crise.</p>
      <a class="cartao express-atalho" href="#montar">
        <span style="font-size:1.6rem">⚡</span>
        <span><strong>Montar meu alívio agora</strong><br><span class="pequeno suave">Onde dói, quanto tempo você tem e onde está: de 1 a 3 minutos</span></span>
      </a>
      ${ordem.map((k) => { const t = D.TRILHAS_ZONA[k]; return `
        <a class="cartao trilha-card" href="#trilha-${k}">
          <span style="font-size:1.8rem">${t.emoji}</span>
          <span style="flex:1;min-width:0">
            ${k === minha ? `<span class="etiqueta">Sua trilha</span><br>` : ""}
            <strong>Trilha ${t.nome}</strong> <span class="pequeno suave">· ${t.apelido}</span><br><span class="pequeno suave">${t.dor}</span>
          </span>
          <span aria-hidden="true">›</span>
        </a>`; }).join("")}

      <h2 class="modulo-titulo"><span class="etiqueta">Módulo 2</span> Reprogramação de Hábitos</h2>
      <a class="cartao trilha-card" href="#habitos">
        <span style="font-size:1.6rem">🧠</span>
        <span style="flex:1"><strong>Postura viciada: ${D.HABITOS.length} aulas de 1 a 3 min</strong><br><span class="pequeno suave">Como sentar, ajustar a mesa, usar o celular, caminhar e dormir sem agredir as articulações.</span></span>
        <span aria-hidden="true">›</span>
      </a>

      <h2 class="modulo-titulo"><span class="etiqueta">Módulo 3</span> Lanches de Movimento</h2>
      <a class="cartao trilha-card" href="#snacks">
        <span style="font-size:1.6rem">🍎</span>
        <span style="flex:1"><strong>${D.SNACKS.length} micro-pausas invisíveis de 60 segundos</strong><br><span class="pequeno suave">Para fazer durante o expediente, até em reunião de câmera ligada.</span></span>
        <span aria-hidden="true">›</span>
      </a>

      <h2 class="modulo-titulo"><span class="etiqueta">Bônus</span> Para não ter medo de errar</h2>
      <a class="cartao trilha-card" href="#seguranca">
        <span style="font-size:1.6rem">🛡️</span>
        <span style="flex:1"><strong>${B.seguranca.nome}</strong><br><span class="pequeno suave">${B.seguranca.promessa}</span></span>
        <span aria-hidden="true">›</span>
      </a>
      <a class="cartao trilha-card" href="#checklist">
        <span style="font-size:1.6rem">📋</span>
        <span style="flex:1"><strong>${B.checklist.nome}</strong><br><span class="pequeno suave">${B.checklist.promessa}</span></span>
        <span aria-hidden="true">›</span>
      </a>`;
  }

  function cartaoProtocolo(trilhaId, f, destaque) {
    const fm = D.FORMATOS[f], passos = D.PROTOCOLOS[trilhaId][f];
    return `
      <div class="cartao formato ${destaque ? "sugerido" : ""}">
        <div class="linha" style="justify-content:space-between;flex-wrap:nowrap;align-items:flex-start">
          <div><span style="font-size:1.4rem">${fm.emoji}</span> <strong>${fm.nome}</strong></div>
          <span class="etiqueta" style="white-space:nowrap">${fm.min} min</span>
        </div>
        <p class="pequeno suave" style="margin:6px 0 8px">${fm.texto}</p>
        <details><summary class="pequeno">ver os ${passos.length} microvídeos</summary>
          <ol class="lista-ex">${passos.map(([ex, seg]) => `<li>${ex === "respira" ? "3 respirações profundas" : D.ex(ex).nome} <span class="suave">· ${seg} s</span></li>`).join("")}</ol>
        </details>
        <button class="botao botao-bloco" data-t="${trilhaId}" data-f="${f}" style="margin-top:10px">Começar ${fm.curto.toLowerCase()}</button>
      </div>`;
  }
  function ligarProtocolos(reg, aoConcluir) {
    $$("[data-f]").forEach((b) => b.onclick = () => executarProtocolo(aplicarMedico(L.protocoloDaTrilha(b.dataset.t, b.dataset.f, semaforoMedico(reg, D.TRILHAS_ZONA[b.dataset.t].regioes[0]))), reg, aoConcluir && (() => aoConcluir(b.dataset.f))));
  }

  function trilha(id) {
    const t = D.TRILHAS_ZONA[id];
    const reg = registroDia(Math.min(diaAtual(), TOTAL));
    tela.innerHTML = `
      <p class="pequeno"><a href="#alivio">← Central</a></p>
      <span class="etiqueta">Módulo 1 · SOS Alívio Imediato</span>
      <h1 style="margin-top:8px">${t.emoji} Trilha ${t.nome}</h1>
      <p class="suave" style="margin:0 0 12px">${t.apelido} · ${t.paraQuem}</p>
      <div class="cartao trilha-info">
        <p class="pequeno" style="margin:0 0 8px"><strong>A dor:</strong> ${t.dor}</p>
        <p class="pequeno" style="margin:0"><strong>A solução:</strong> ${t.solucao}</p>
      </div>
      ${cartaoProtocolo(id, "sos1", true)}
      ${cartaoProtocolo(id, "sos3", false)}
      <a class="cartao trilha-card" href="#checklist"><span style="font-size:1.4rem">📋</span>
        <span><strong>Matinal e Noturno desta trilha</strong><br><span class="pequeno suave">No bônus Checklist de Bolso, 3 min cada</span></span></a>
      <a class="cartao trilha-card" href="#socorro"><span style="font-size:1.4rem">🚨</span>
        <span><strong>Travou?</strong><br><span class="pequeno suave">Guia de Crise com a posição de alívio desta região</span></span></a>
      <div class="aviso aviso-vermelho" style="margin-top:12px"><strong>Quando procurar o médico:</strong> ${t.alerta}</div>`;
    ligarProtocolos(reg);
  }

  function habitos() {
    const p = estado.perfil;
    const minha = D.trilhaDaRegiao(p.regiaoFoco);
    const paraMim = (h) => h.rotinas.includes(p.rotina) && h.zonas.includes(minha);
    const lista = [...D.HABITOS.filter(paraMim), ...D.HABITOS.filter((h) => !paraMim(h))];
    tela.innerHTML = `
      <p class="pequeno"><a href="#alivio">← Central</a></p>
      <span class="etiqueta">Módulo 2</span>
      <h1 style="margin-top:8px">Reprogramação de Hábitos e Postura Viciada</h1>
      <p class="suave">Cada aula mostra o vício, o ajuste e um teste de 10 segundos para você conferir na hora.</p>
      ${lista.map((h) => `
        <details class="cartao habito">
          <summary><strong>${h.titulo}</strong> <span class="pequeno suave">· ${h.min} min</span>${paraMim(h) ? ` <span class="etiqueta">Para você</span>` : ""}</summary>
          <div class="video-placeholder" style="margin-top:12px">[Microaula · ${h.min} min]<br>${h.titulo}</div>
          <p class="pequeno" style="margin:12px 0 6px"><strong>O vício:</strong> ${h.vicio}</p>
          <p class="pequeno" style="margin:0 0 6px"><strong>O ajuste:</strong> ${h.ajuste}</p>
          <p class="pequeno" style="margin:0"><strong>Teste de 10 segundos:</strong> ${h.teste}</p>
        </details>`).join("")}`;
  }

  function snacks() {
    const reg = registroDia(Math.min(diaAtual(), TOTAL));
    const minha = D.trilhaDaRegiao(estado.perfil.regiaoFoco);
    const lista = [...D.SNACKS.filter((s) => s.zona === minha), ...D.SNACKS.filter((s) => s.zona !== minha)];
    tela.innerHTML = `
      <p class="pequeno"><a href="#alivio">← Central</a></p>
      <span class="etiqueta">Módulo 3</span>
      <h1 style="margin-top:8px">Lanches de Movimento</h1>
      <p class="suave">Micro-pausas invisíveis de 60 segundos para o expediente. Ninguém percebe e o corpo destrava. Hoje você fez ${reg.lanches || 0}.</p>
      ${lista.map((s) => `
        <div class="cartao">
          <div class="linha" style="justify-content:space-between;flex-wrap:nowrap">
            <strong>${s.nome}${s.zona === minha ? ` <span class="etiqueta">Sua zona</span>` : ""}</strong>
            <span class="etiqueta" style="white-space:nowrap">60 s</span>
          </div>
          <p class="pequeno suave" style="margin:6px 0 10px">${s.passos.map(([id]) => D.ex(id).nome).join(" + ")}</p>
          <button class="botao botao-secundario botao-bloco" data-s="${s.id}">Fazer agora</button>
        </div>`).join("")}`;
    $$("[data-s]").forEach((b) => b.onclick = () => {
      const s = D.SNACKS.find((x) => x.id === b.dataset.s);
      const regiao = s.zona ? D.TRILHAS_ZONA[s.zona].regioes[0] : estado.perfil.regiaoFoco;
      const motivo = bloqueadoPeloMedico(regiao);
      executarProtocolo({ titulo: `Lanche de Movimento · 60 s`, minutos: 1, regiao, trilha: s.zona || D.trilhaDaRegiao(estado.perfil.regiaoFoco), aviso: motivo,
        passos: motivo ? [{ ...D.ex("respiracao-4-6"), segundos: 60 }] : s.passos.map(([id, seg]) => ({ ...D.ex(id), segundos: seg })) }, reg, () => { reg.lanches = (reg.lanches || 0) + 1; salvar(); });
    });
  }

  function checklist() {
    const reg = registroDia(Math.min(diaAtual(), TOTAL));
    reg.checklist = reg.checklist || { matinal: false, noturno: false };
    const escolhida = estado.perfil.trilhaChecklist || D.trilhaDaRegiao(estado.perfil.regiaoFoco);
    const hora = new Date().getHours();
    tela.innerHTML = `
      <p class="pequeno"><a href="#alivio">← Central</a></p>
      <span class="etiqueta">Bônus 2 · ${D.BONUS_INCLUSOS.checklist.formato}</span>
      <h1 style="margin-top:8px">📋 ${D.BONUS_INCLUSOS.checklist.nome}</h1>
      <p class="suave">${D.BONUS_INCLUSOS.checklist.promessa}</p>
      <div class="cartao">
        <h3>Hoje</h3>
        <label class="check-linha"><input type="checkbox" class="check" data-ck="matinal" ${reg.checklist.matinal ? "checked" : ""}> ☀️ Checklist Matinal</label>
        <label class="check-linha"><input type="checkbox" class="check" data-ck="noturno" ${reg.checklist.noturno ? "checked" : ""}> 🌙 Checklist Noturno</label>
      </div>
      <div class="cartao">
        <p class="pequeno" style="margin:0 0 8px"><strong>Montado para a zona:</strong></p>
        <select id="ck-trilha" class="opcao">${Object.entries(D.TRILHAS_ZONA).map(([k, t]) => `<option value="${k}" ${k === escolhida ? "selected" : ""}>${t.nome}</option>`).join("")}</select>
      </div>
      ${cartaoProtocolo(escolhida, hora < 14 ? "matinal" : "noturno", true)}
      ${cartaoProtocolo(escolhida, hora < 14 ? "noturno" : "matinal", false)}`;
    $$("[data-ck]").forEach((c) => c.onchange = () => { reg.checklist[c.dataset.ck] = c.checked; salvar(); });
    $("#ck-trilha").onchange = (e) => { estado.perfil.trilhaChecklist = e.target.value; salvar(); checklist(); };
    ligarProtocolos(reg, (f) => { reg.checklist[f] = true; salvar(); });
  }

  function seguranca() {
    const b = D.BONUS_INCLUSOS.seguranca;
    tela.innerHTML = `
      <p class="pequeno"><a href="#alivio">← Central</a></p>
      <span class="etiqueta">Bônus 1 · ${b.formato}</span>
      <h1 style="margin-top:8px">🛡️ ${b.nome}</h1>
      <p class="suave">${b.promessa}</p>
      <div class="cartao"><div class="video-placeholder">[Vídeo · 4 min]<br>${b.nome}</div></div>
      <div class="cartao">
        <h3>Regra de ouro</h3>
        <div class="grade-2">
          <div><p class="pequeno" style="margin:0 0 4px"><span class="bolinha verde"></span> <strong>Pode sentir</strong></p><ul class="pequeno" style="margin:0;padding-left:18px">${b.regraDeOuro.pode.map((x) => `<li>${x}</li>`).join("")}</ul></div>
          <div><p class="pequeno" style="margin:0 0 4px"><span class="bolinha vermelho"></span> <strong>Pare se sentir</strong></p><ul class="pequeno" style="margin:0;padding-left:18px">${b.regraDeOuro.pare.map((x) => `<li>${x}</li>`).join("")}</ul></div>
        </div>
      </div>
      <div class="cartao">
        <h3>O que nunca fazer ao sentir dor</h3>
        ${b.nunca.map(([t, d]) => `<div class="nunca"><strong>✕ ${t}</strong><p class="pequeno" style="margin:2px 0 0">${d}</p></div>`).join("")}
      </div>`;
  }

  function socorro() {
    const b = D.BONUS_INCLUSOS.socorro;
    const minha = D.trilhaDaRegiao(estado.perfil.regiaoFoco);
    tela.innerHTML = `
      <p class="pequeno"><a href="#alivio">← Central</a></p>
      <span class="etiqueta">${b.formato}</span>
      <h1 style="margin-top:8px">🚨 ${b.nome}</h1>
      <p class="suave">${b.promessa}</p>

      <div class="cartao alerta-emergencia">
        <h3>Antes de tudo: algum destes sinais?</h3>
        <ul class="pequeno" style="margin:0;padding-left:18px">${b.alertas.map((a) => `<li>${a}</li>`).join("")}</ul>
        <p style="margin:12px 0 0"><strong>Se sim, não faça os passos abaixo. Procure atendimento médico agora. Emergência: SAMU 192.</strong></p>
      </div>

      ${b.passos.map(([t, d], k) => `
        <div class="cartao plano-socorro"><span class="etiqueta">Passo ${k + 1}</span><div><strong>${t}</strong><p class="pequeno" style="margin:4px 0 0">${d}</p></div></div>`).join("")}

      <div class="cartao">
        <h3>Posição de alívio</h3>
        <div class="linha" id="pos-abas" style="margin-bottom:12px">${Object.keys(b.posicoes).map((k) =>
          `<button class="opcao" style="width:auto;min-height:40px" data-k="${k}" aria-pressed="${k === minha}">${D.TRILHAS_ZONA[k].emoji} ${{ lombar: "Coluna", cervical: "Pescoço", joelhos: "Quadril e joelho", punho: "Braço e punho", pes: "Pé" }[k]}</button>`).join("")}</div>
        <p id="pos-texto" style="margin:0">${b.posicoes[minha]}</p>
      </div>
      <a class="botao botao-bloco" href="#trilha-${minha}">Quando aliviar: protocolo leve da sua trilha</a>`;
    $$("#pos-abas .opcao").forEach((x) => x.onclick = () => {
      $$("#pos-abas .opcao").forEach((y) => y.setAttribute("aria-pressed", y === x));
      $("#pos-texto").textContent = b.posicoes[x.dataset.k];
    });
  }

  /* =========================================================
     3b. ALÍVIO EXPRESS (protocolo sob medida na hora da dor)
     ========================================================= */
  function alivio() {
    const p = estado.perfil;
    const n = Math.min(diaAtual(), TOTAL);
    const reg = registroDia(n);
    const esc = { regiao: p.regiaoFoco, minutos: p.tempoLivre || 2, local: p.localPadrao || "sentado" };

    tela.innerHTML = `
      <span class="etiqueta">Alívio Express</span>
      <h1 style="margin-top:8px">Doeu agora? Monte seu alívio</h1>
      <p class="pequeno"><a href="#alivio">← Central</a></p>
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
      executarProtocolo(aplicarMedico(L.montarProtocolo({ ...esc, semaforo: semaforoMedico(reg, esc.regiao) })), reg);
    };
  }

  function executarProtocolo(prot, reg, aoConcluir) {
    const passos = prot.passos;
    let k = 0, restante = passos[0].segundos, rodando = false, falado = -1;
    $("#botao-estranho").classList.add("oculto"); // não cobrir os botões do cronômetro
    const total = passos.reduce((s, x) => s + x.segundos, 0);

    tela.innerHTML = `
      <div class="linha" style="justify-content:space-between">
        <span class="etiqueta">${prot.titulo || `Alívio Express · ${prot.minutos} min · ${D.REGIOES[prot.regiao].nome}`}</span>
        ${botaoVoz()}
      </div>
      ${prot.aviso ? `<div class="aviso ${reg.semaforo === "vermelho" ? "aviso-vermelho" : ""}" style="margin-top:12px">${prot.aviso}</div>` : ""}
      <div class="cartao" style="margin-top:12px">
        <div class="midia-exercicio" id="ae-video"></div>
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
      if ($("#ae-video").dataset.passo !== String(k)) {
        const primeiro = $("#ae-video").dataset.passo === undefined;
        $("#ae-video").dataset.passo = String(k);
        $("#ae-video").innerHTML = midiaExercicio(x);
        // mostra a imagem do exercício novo, mesmo se a tela estiver rolada
        if (!primeiro) $("#ae-video").scrollIntoView({ block: "start", behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
      }
      $("#ae-contagem").textContent = `Passo ${k + 1} de ${passos.length}`;
      $("#ae-nome").textContent = x.nome;
      $("#ae-passos").textContent = x.passos;
      $("#ae-timer").textContent = fmt(restante);
      const feito = passos.slice(0, k).reduce((s, y) => s + y.segundos, 0) + (x.segundos - restante);
      $("#ae-barra").style.width = Math.round((feito / total) * 100) + "%";
      $$("#ae-lista li").forEach((li, i) => li.style.fontWeight = i === k ? "700" : "400");
      if (rodando && k !== falado) {
        falado = k; voz.vibrar();
        voz.tocar(x.id, `${k === 0 ? "Vamos lá. " : "Agora. "}${x.nome}. ${x.passos}`, prot.trilha || D.trilhaDaRegiao(x.regiao));
      } else if (rodando && restante === 10 && x.segundos >= 30) {
        voz.falar("Faltam 10 segundos.");
      }
    }
    function proximo() {
      k++;
      if (k >= passos.length) return concluir();
      restante = passos[k].segundos; mostrarPasso();
    }
    function concluir() {
      pararTimer();
      reg.pausas++; reg.alivios = (reg.alivios || 0) + 1; salvar(); ultimaPausa = Date.now();
      if (aoConcluir) aoConcluir();
      voz.vibrar([120, 60, 120]); voz.falar("Pronto. Como está agora?");
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
      mostrarPasso();
    };
    ligarBotaoVoz();
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
    $("#inv-ok").onclick = () => { registroDia(Math.min(diaAtual(), TOTAL)).pausas++; salvar(); ultimaPausa = Date.now(); location.hash = "#hoje"; };
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
    if (!p || diaAtual() > TOTAL) return;
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

  const remediosAvisados = new Set();
  function verificarRemedios() {
    if (!estado.perfil) return;
    const agora = new Date();
    const hhmm = String(agora.getHours()).padStart(2, "0") + ":" + String(agora.getMinutes()).padStart(2, "0");
    remediosHoje().filter((r) => r.hora === hhmm && !remediosAvisados.has(hojeISO() + r.chave)).forEach((r) => {
      remediosAvisados.add(hojeISO() + r.chave);
      const banner = $("#lembrete-banner");
      banner.innerHTML = `💊 Hora do remédio: <strong>${r.nome}</strong>${r.dose ? ` (${r.dose})` : ""}. <a href="#hoje">Marcar como tomado</a>`;
      banner.classList.remove("oculto");
      if ("Notification" in window && Notification.permission === "granted") {
        new Notification("Hora do remédio", { body: `${r.nome}${r.dose ? ` · ${r.dose}` : ""}`, icon: "../assets/img/icone.svg" });
      }
      voz.vibrar([200, 100, 200]);
    });
  }
  setInterval(verificarRemedios, 20000);
  window.addEventListener("hashchange", () => { if (location.hash === "#pausa") $("#lembrete-banner").classList.add("oculto"); });

  /* =========================================================
     ORIENTAÇÕES DO MÉDICO
     A pessoa registra o que o médico orientou. O painel:
     - bloqueia exercícios das regiões que o médico pediu para evitar
       (ou todos, se ainda não liberou);
     - lembra os horários dos remédios receitados (só lembra, nunca muda dose);
     - avisa a próxima consulta e gera o relatório para levar ao médico.
     ========================================================= */
  const medico = () => estado.medico || null;
  function bloqueadoPeloMedico(regiao) {
    const m = medico();
    if (!m) return null;
    if (m.liberado === "nao") return "Seu médico ainda não liberou exercícios. Por enquanto, aqui fica só a respiração.";
    const zona = D.trilhaDaRegiao(regiao);
    if (m.liberado === "restricoes" && (m.evitar || []).some((r) => r === regiao || D.trilhaDaRegiao(r) === zona)) {
      return `Seu médico pediu para evitar exercícios ${(D.REGIOES[regiao] || {}).no || "nesta região"}. Aqui fica só a respiração.`;
    }
    return null;
  }
  const semaforoMedico = (reg, regiao) => (bloqueadoPeloMedico(regiao) ? "vermelho" : reg.semaforo);
  function aplicarMedico(prot) {
    const motivo = bloqueadoPeloMedico(prot.regiao);
    if (motivo) prot.aviso = motivo;
    return prot;
  }
  function remediosHoje() {
    const m = medico();
    if (!m || !m.remedios) return [];
    const hoje = hojeISO();
    const lista = [];
    m.remedios.filter((r) => !r.ate || r.ate >= hoje).forEach((r, i) => {
      (r.horarios.length ? r.horarios : [""]).forEach((h) => lista.push({ chave: `${i}@${h}`, nome: r.nome, dose: r.dose, hora: h }));
    });
    return lista.sort((a, b) => (a.hora || "99").localeCompare(b.hora || "99"));
  }
  function diasAteConsulta() {
    const m = medico();
    if (!m || !m.proximaConsulta) return null;
    return Math.round((new Date(m.proximaConsulta + "T00:00:00") - new Date(hojeISO() + "T00:00:00")) / 86400000);
  }

  function cartoesMedicoHoje(reg) {
    const m = medico();
    const partes = [];
    const dias = diasAteConsulta();
    if (dias !== null && dias >= 0 && dias <= 3) {
      partes.push(`<div class="cartao medico-cartao">
        <h3 style="margin:0 0 6px">🩺 Consulta ${dias === 0 ? "hoje" : dias === 1 ? "amanhã" : `em ${dias} dias`}</h3>
        <p class="pequeno" style="margin:0 0 10px">Leve o seu relatório de evolução: dor por semana, dias sem remédio e o que você fez no desafio.</p>
        <a class="botao botao-secundario botao-bloco" href="#relatorio-medico">Abrir relatório para o médico</a></div>`);
    }
    const rem = remediosHoje();
    if (rem.length) {
      const tomados = reg.remediosTomados || {};
      partes.push(`<div class="cartao">
        <h3 style="margin:0 0 4px">💊 Remédios de hoje</h3>
        <p class="pequeno suave" style="margin:0 0 6px">Do jeito que o seu médico receitou. O painel só lembra, não muda nada.</p>
        ${rem.map((r) => `<label class="check-linha"><input type="checkbox" class="check" data-rem="${r.chave}" ${tomados[r.chave] ? "checked" : ""}>
          <span>${r.hora ? `<strong>${r.hora}</strong> · ` : ""}${r.nome}${r.dose ? ` <span class="pequeno suave">${r.dose}</span>` : ""}</span></label>`).join("")}
      </div>`);
    }
    if (!m) {
      partes.push(`<a class="cartao trilha-card" href="#medico"><span style="font-size:1.5rem">🩺</span>
        <span><strong>Passou com o médico?</strong><br><span class="pequeno suave">Registre o que ele orientou: o painel se adapta e lembra os seus remédios.</span></span></a>`);
    }
    return partes.join("");
  }

  function telaMedico() {
    const m = estado.medico = estado.medico || { liberado: null, evitar: [], diagnostico: "", orientacoes: "", remedios: [], proximaConsulta: "", profissional: "", fotos: [] };
    const salvarM = () => { m.atualizadoEm = hojeISO(); salvar(); };
    tela.innerHTML = `
      <p class="pequeno"><a href="#mais">← Mais</a></p>
      <span class="etiqueta">Orientações do médico</span>
      <h1 style="margin-top:8px">🩺 O que o seu médico orientou</h1>
      <div class="aviso" style="margin-bottom:16px">O Religar não substitui o seu médico. Aqui você anota o que ele orientou para não esquecer e para o painel se adaptar ao seu caso. Nunca mude remédio ou dose por conta própria.</div>

      <div class="cartao">
        <h3>O médico liberou exercícios leves?</h3>
        <div class="opcoes" id="md-liberado">
          ${[["sim", "✅ Sim, estou liberado"], ["restricoes", "⚠️ Liberado, mas com restrições"], ["nao", "⛔ Ainda não liberou"]].map(([v, t]) =>
            `<button class="opcao" data-v="${v}" aria-pressed="${m.liberado === v}">${t}</button>`).join("")}
        </div>
        ${m.liberado === "restricoes" ? `
          <p class="pequeno" style="margin:14px 0 6px"><strong>Evitar exercícios em:</strong></p>
          <div class="opcoes" id="md-evitar">${Object.entries(D.REGIOES).map(([id, r]) =>
            `<button class="opcao" data-id="${id}" aria-pressed="${(m.evitar || []).includes(id)}"><span class="emoji">${r.emoji}</span>${r.nome}</button>`).join("")}</div>
          <p class="pequeno suave" style="margin:8px 0 0">Nessas regiões o painel troca os exercícios por respiração.</p>` : ""}
        ${m.liberado === "nao" ? `<p class="pequeno" style="margin:12px 0 0">Até a liberação, o painel deixa só respiração e pausas leves. As avaliações continuam, para você levar a evolução na próxima consulta.</p>` : ""}
      </div>

      <div class="cartao">
        <h3>O que o médico disse</h3>
        <label class="pequeno" for="md-diag"><strong>Diagnóstico ou o que foi encontrado</strong></label>
        <textarea id="md-diag" class="campo" rows="2" placeholder="Ex.: tendinite no punho direito">${m.diagnostico || ""}</textarea>
        <label class="pequeno" for="md-ori"><strong>Orientações</strong></label>
        <textarea id="md-ori" class="campo" rows="3" placeholder="Ex.: gelo 15 minutos à noite, fisioterapia 2 vezes por semana, não carregar peso">${m.orientacoes || ""}</textarea>
      </div>

      <div class="cartao">
        <h3>💊 Remédios receitados</h3>
        ${(m.remedios || []).length ? m.remedios.map((r, i) => `
          <div class="remedio-linha"><div><strong>${r.nome}</strong>${r.dose ? ` · ${r.dose}` : ""}<br>
            <span class="pequeno suave">${r.horarios.length ? r.horarios.join(", ") : "sem horário fixo"}${r.ate ? ` · até ${r.ate.split("-").reverse().join("/")}` : ""}</span></div>
            <button class="botao-voz" data-del="${i}" aria-label="Remover ${r.nome}">Remover</button></div>`).join("") : `<p class="pequeno suave">Nenhum remédio registrado.</p>`}
        <details style="margin-top:10px" ${(m.remedios || []).length ? "" : "open"}><summary class="pequeno"><strong>+ Adicionar remédio</strong></summary>
          <label class="pequeno" for="rm-nome">Nome</label><input id="rm-nome" class="campo" placeholder="Ex.: anti-inflamatório que o médico receitou">
          <label class="pequeno" for="rm-dose">Dose</label><input id="rm-dose" class="campo" placeholder="Ex.: 1 comprimido">
          <label class="pequeno" for="rm-hora">Horários (separados por vírgula)</label><input id="rm-hora" class="campo" placeholder="Ex.: 08:00, 20:00">
          <label class="pequeno" for="rm-ate">Tomar até (opcional)</label><input id="rm-ate" type="date" class="campo">
          <button class="botao botao-bloco" id="rm-add" style="margin-top:8px">Adicionar</button>
          <p class="pequeno" id="rm-erro" style="color:var(--cor-vermelho);margin:6px 0 0"></p>
        </details>
      </div>

      <div class="cartao">
        <h3>📅 Próxima consulta</h3>
        <label class="pequeno" for="md-data">Data</label><input id="md-data" type="date" class="campo" value="${m.proximaConsulta || ""}">
        <label class="pequeno" for="md-nome">Seu nome (aparece no relatório)</label><input id="md-nome" class="campo" value="${estado.perfil.nome || ""}">
        <label class="pequeno" for="md-prof">Com quem (opcional)</label><input id="md-prof" class="campo" placeholder="Ex.: Dr. Fulano, ortopedista" value="${m.profissional || ""}">
        <a class="botao botao-secundario botao-bloco" href="#relatorio-medico" style="margin-top:12px">📄 Relatório para levar na consulta</a>
      </div>

      <div class="cartao">
        <h3>📷 Foto do relatório ou da receita</h3>
        <p class="pequeno suave">Fica guardada só neste celular. Até 3 fotos.</p>
        <div class="fotos-medico">${(m.fotos || []).map((f, i) => `<div class="foto-medico"><img src="${f}" alt="Foto ${i + 1} do relatório médico" data-ver="${i}"><button class="botao-voz" data-delfoto="${i}">Remover</button></div>`).join("")}</div>
        ${(m.fotos || []).length < 3 ? `<label class="botao botao-secundario botao-bloco" for="md-foto" style="margin-top:8px">Adicionar foto</label>
        <input id="md-foto" type="file" accept="image/*" style="display:none">` : ""}
        <p class="pequeno" id="md-foto-erro" style="color:var(--cor-vermelho);margin:6px 0 0"></p>
      </div>`;

    $$("#md-liberado .opcao").forEach((b) => b.onclick = () => { m.liberado = b.dataset.v; salvarM(); telaMedico(); });
    $$("#md-evitar .opcao").forEach((b) => b.onclick = () => {
      const id = b.dataset.id;
      m.evitar = (m.evitar || []).includes(id) ? m.evitar.filter((x) => x !== id) : [...(m.evitar || []), id];
      b.setAttribute("aria-pressed", m.evitar.includes(id)); salvarM();
    });
    $("#md-diag").onchange = (e) => { m.diagnostico = e.target.value; salvarM(); };
    $("#md-ori").onchange = (e) => { m.orientacoes = e.target.value; salvarM(); };
    $("#md-data").onchange = (e) => { m.proximaConsulta = e.target.value; salvarM(); };
    $("#md-prof").onchange = (e) => { m.profissional = e.target.value; salvarM(); };
    $("#md-nome").onchange = (e) => { estado.perfil.nome = e.target.value.trim(); salvarM(); };
    $$("[data-del]").forEach((b) => b.onclick = () => { m.remedios.splice(Number(b.dataset.del), 1); salvarM(); telaMedico(); });
    $("#rm-add").onclick = () => {
      const nome = $("#rm-nome").value.trim();
      if (!nome) { $("#rm-erro").textContent = "Escreva o nome do remédio."; return; }
      const horarios = $("#rm-hora").value.split(",").map((h) => h.trim()).filter(Boolean)
        .map((h) => { const [hh, mm = "00"] = h.replace("h", ":").split(":"); return `${String(Number(hh)).padStart(2, "0")}:${String(Number(mm) || 0).padStart(2, "0")}`; })
        .filter((h) => /^([01]\d|2[0-3]):[0-5]\d$/.test(h));
      m.remedios = m.remedios || [];
      m.remedios.push({ nome, dose: $("#rm-dose").value.trim(), horarios, ate: $("#rm-ate").value || "" });
      salvarM(); telaMedico();
    };
    $$("[data-delfoto]").forEach((b) => b.onclick = () => { m.fotos.splice(Number(b.dataset.delfoto), 1); salvarM(); telaMedico(); });
    $$("[data-ver]").forEach((img) => img.onclick = () => abrirModal(`<img src="${img.src}" alt="Relatório médico" style="width:100%;border-radius:8px">
      <button class="botao botao-bloco" onclick="this.closest('dialog').close()" style="margin-top:12px">Fechar</button>`));
    const inp = $("#md-foto");
    if (inp) inp.onchange = () => {
      const file = inp.files && inp.files[0];
      if (!file) return;
      comprimirImagem(file, (dataUrl) => {
        m.fotos = m.fotos || [];
        m.fotos.push(dataUrl);
        if (!S.salvar(estado)) { m.fotos.pop(); $("#md-foto-erro").textContent = "Sem espaço no celular para guardar a foto. Remova uma foto antiga e tente de novo."; return; }
        telaMedico();
      });
    };
  }
  function comprimirImagem(file, pronto) {
    const leitor = new FileReader();
    leitor.onload = () => {
      const img = new Image();
      img.onload = () => {
        const k = Math.min(1, 1280 / Math.max(img.width, img.height));
        const c = document.createElement("canvas");
        c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
        c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
        pronto(c.toDataURL("image/jpeg", 0.7));
      };
      img.src = leitor.result;
    };
    leitor.readAsDataURL(file);
  }

  function relatorioMedico() {
    const m = medico() || {};
    const ev = evolucao();
    const n = Math.min(diaAtual(), TOTAL);
    const dias = Object.entries(estado.dias).filter(([d]) => Number(d) <= n);
    const contar = (cor) => dias.filter(([, r]) => r.semaforo === cor).length;
    const totalPausas = dias.reduce((s, [, r]) => s + (r.pausas || 0), 0);
    const data = (iso) => iso ? iso.split("-").reverse().join("/") : "–";
    tela.innerHTML = `
      <p class="pequeno"><a href="#medico">← Orientações do médico</a></p>
      <div class="imprimivel relatorio-medico">
        <p class="pequeno suave" style="margin:0">Religar · Relatório de acompanhamento</p>
        <h1 style="margin:4px 0 4px">${estado.perfil.nome || "Paciente"}</h1>
        <p class="pequeno suave">Início do programa: ${data(estado.dataInicio)} · Hoje: dia ${n} de ${TOTAL} · Gerado em ${new Date().toLocaleDateString("pt-BR")}</p>

        <div class="cartao">
          <h3>Queixa principal</h3>
          <p class="pequeno" style="margin:0">Região: <strong>${D.REGIOES[estado.perfil.regiaoFoco].nome}</strong> · Rotina: ${(L.ROTINAS_TRABALHO.find((o) => o.id === estado.perfil.rotina) || {}).texto || "–"}</p>
          ${ev.inicial ? `<p class="pequeno" style="margin:6px 0 0">No início: dor ${ev.inicial.dor}/10, travamento ${["nenhum", "pouco", "moderado", "muito"][ev.inicial.trava] || "–"}, ${ev.inicial.remedio ? "usando remédio para dor" : "sem remédio para dor"}.</p>` : ""}
        </div>

        <div class="cartao">
          <h3>Evolução da dor (autoavaliação diária, 0 a 10)</h3>
          ${graficoSemanal()}
          <div style="margin-top:12px">${tabelaSemanas()}</div>
          <div style="margin-top:12px">${graficoEvolucao()}</div>
        </div>

        <div class="cartao">
          <h3>Adesão ao programa</h3>
          <p class="pequeno" style="margin:0">Dias concluídos: <strong>${diasFeitos()}</strong> de ${n} · Avaliações registradas: <strong>${ev.registros.length}</strong> · Pausas ativas: <strong>${totalPausas}</strong><br>
          Dias com sinais de alerta: amarelo <strong>${contar("amarelo")}</strong> · vermelho <strong>${contar("vermelho")}</strong></p>
        </div>

        ${m.diagnostico || m.orientacoes || (m.remedios || []).length ? `
        <div class="cartao">
          <h3>Orientações registradas pelo paciente</h3>
          ${m.diagnostico ? `<p class="pequeno" style="margin:0 0 6px"><strong>Diagnóstico:</strong> ${m.diagnostico}</p>` : ""}
          ${m.orientacoes ? `<p class="pequeno" style="margin:0 0 6px"><strong>Orientações:</strong> ${m.orientacoes}</p>` : ""}
          ${(m.remedios || []).length ? `<p class="pequeno" style="margin:0"><strong>Remédios:</strong> ${m.remedios.map((r) => `${r.nome}${r.dose ? ` (${r.dose})` : ""}${r.horarios.length ? ` às ${r.horarios.join(", ")}` : ""}`).join("; ")}</p>` : ""}
        </div>` : ""}

        <p class="pequeno suave">Dados informados pelo próprio paciente no programa de educação e prevenção Religar. Não é um documento médico nem substitui avaliação profissional.</p>
      </div>
      <button class="botao botao-bloco" id="rel-imprimir" style="margin-top:12px">Imprimir ou salvar em PDF</button>
      <p class="pequeno suave centro">Se preferir, tire um print desta tela e mostre na consulta.</p>`;
    $("#rel-imprimir").onclick = () => window.print();
  }

  /* =========================================================
     AVALIAÇÃO DIÁRIA: métricas e gráfico de evolução
     ========================================================= */
  function registrosAvaliacao() {
    const lista = [];
    for (let d = 1; d <= TOTAL; d++) {
      const a = estado.dias[d]?.avaliacao;
      if (a && a.dor !== null && a.dor !== undefined) lista.push({ d, dor: a.dor, trava: a.trava ?? null, remedio: a.remedio ?? null });
    }
    return lista;
  }
  const mediaDe = (arr) => arr.length ? Math.round((arr.reduce((s, x) => s + x, 0) / arr.length) * 10) / 10 : null;
  function dadosSemana(k) {
    const r = registrosAvaliacao().filter((x) => x.d > (k - 1) * 7 && x.d <= (k === 4 ? TOTAL : k * 7));
    const comRem = r.filter((x) => x.remedio !== null);
    return {
      k, avaliacoes: r.length,
      dor: mediaDe(r.map((x) => x.dor)),
      trava: mediaDe(r.filter((x) => x.trava !== null).map((x) => x.trava)),
      semRemedio: comRem.filter((x) => !x.remedio).length, comRemedioAvaliado: comRem.length
    };
  }
  function evolucao() {
    const r = registrosAvaliacao();
    const ini = estado.inicial ? { d: 0, dor: estado.inicial.dor, trava: estado.inicial.trava, remedio: estado.inicial.remedio } : null;
    const semanas = [1, 2, 3, 4].map(dadosSemana);
    const ultimaSemana = [4, 3, 2, 1].find((k) => semanas[k - 1].avaliacoes) || 1;
    const comRemedio = r.filter((x) => x.remedio !== null);
    return {
      registros: r, inicial: ini, semanas, ultimaSemana,
      primeira: ini || r[0] || null,
      ultima: r[r.length - 1] || null,
      mediaSemana1: semanas[0].dor,
      mediaUltima: semanas[ultimaSemana - 1].dor,
      diasSemRemedio: comRemedio.filter((x) => !x.remedio).length,
      diasAvaliados: comRemedio.length,
      travaSemana1: semanas[0].trava,
      travaUltima: semanas[ultimaSemana - 1].trava
    };
  }
  function resumoComparacao(n) {
    const ev = evolucao();
    if (!ev.primeira || !ev.ultima) return "";
    const dif = ev.primeira.dor - ev.ultima.dor;
    const rotulo = ev.primeira.d === 0 ? "No início" : `Dia ${ev.primeira.d}`;
    return `<p class="pequeno av-resumo">${rotulo}: <strong>${ev.primeira.dor}</strong> → hoje: <strong>${ev.ultima.dor}</strong>.
      ${dif > 0 ? `Sua dor caiu ${dif} ponto(s). 👏` : dif === 0 ? "Estável. O hábito é o que impede de piorar." : "Subiu hoje. Dias ruins fazem parte; confira o Semáforo se continuar."}</p>`;
  }

  /* Barras: dor média do ponto de partida e de cada semana */
  function graficoSemanal() {
    const ev = evolucao();
    const barras = [];
    if (ev.inicial) barras.push({ rot: "Início", v: ev.inicial.dor, base: true });
    ev.semanas.forEach((s) => barras.push({ rot: `Sem ${s.k}`, v: s.dor, vazio: s.dor === null }));
    if (!barras.some((b) => b.v !== null && !b.base)) {
      return `<p class="pequeno suave" style="margin:0">Faça a avaliação do dia: a barra da sua semana aparece aqui${ev.inicial ? `, ao lado do seu ponto de partida (${ev.inicial.dor}/10)` : ""}.</p>`;
    }
    const W = 320, H = 170, x0 = 26, x1 = W - 6, y0 = 18, y1 = H - 26;
    const slot = (x1 - x0) / barras.length, bw = Math.min(40, slot * 0.6);
    const Y = (v) => y1 - (v / 10) * (y1 - y0);
    const grade = [0, 5, 10].map((v) => `<line x1="${x0}" x2="${x1}" y1="${Y(v)}" y2="${Y(v)}" style="stroke:var(--cor-borda)" stroke-width="1"/><text x="${x0 - 6}" y="${Y(v) + 4}" text-anchor="end" font-size="10" style="fill:var(--cor-texto-suave)">${v}</text>`).join("");
    const cols = barras.map((b, i) => {
      const cx = x0 + slot * i + slot / 2;
      const rot = `<text x="${cx}" y="${H - 8}" text-anchor="middle" font-size="11" style="fill:var(--cor-texto-suave)">${b.rot}</text>`;
      if (b.v === null) return rot + `<rect x="${cx - bw / 2}" y="${y1 - 2}" width="${bw}" height="2" rx="1" style="fill:var(--cor-borda)"/>`;
      const h = Math.max(2, y1 - Y(b.v));
      return rot + `<rect x="${cx - bw / 2}" y="${y1 - h}" width="${bw}" height="${h}" rx="4" style="fill:${b.base ? "var(--cor-borda)" : "var(--cor-primaria)"}"/>
        <text x="${cx}" y="${y1 - h - 5}" text-anchor="middle" font-size="12" font-weight="700" style="fill:var(--cor-texto)">${String(b.v).replace(".", ",")}</text>`;
    }).join("");
    return `<div class="grafico"><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Dor média por semana, de 0 a 10">${grade}${cols}</svg>
      <p class="pequeno suave" style="margin:4px 0 0">Dor média de 0 a 10. Barra menor que a do início é melhora.</p></div>`;
  }

  /* Tabela da semana: dor, travamento e dias sem remédio */
  function tabelaSemanas() {
    const ev = evolucao();
    const f = (v) => v === null || v === undefined ? "–" : String(v).replace(".", ",");
    const travaTxt = (v) => v === null ? "–" : ["nada", "pouco", "moderado", "muito"][Math.round(v)];
    return `<div class="tabela-rolagem"><table class="tabela tabela-semanas">
      <thead><tr><th></th><th>Dor</th><th>Travou</th><th>Sem remédio</th></tr></thead>
      <tbody>
        ${ev.inicial ? `<tr><td><strong>Início</strong></td><td>${ev.inicial.dor}</td><td>${travaTxt(ev.inicial.trava)}</td><td>${ev.inicial.remedio === false ? "sim" : ev.inicial.remedio ? "não" : "–"}</td></tr>` : ""}
        ${ev.semanas.map((s) => `<tr class="${s.avaliacoes ? "" : "futuro"}"><td><strong>Semana ${s.k}</strong></td><td>${f(s.dor)}</td><td>${travaTxt(s.trava)}</td><td>${s.comRemedioAvaliado ? `${s.semRemedio} de ${s.comRemedioAvaliado} dias` : "–"}</td></tr>`).join("")}
      </tbody></table></div>`;
  }

  /* Relatório no fim de cada semana (dias 7, 14, 21 e 30) */
  function relatorioSemana(n) {
    const k = { 7: 1, 14: 2, 21: 3, 30: 4 }[n];
    if (!k) return "";
    const ev = evolucao();
    const atual = ev.semanas[k - 1];
    const ref = k === 1 ? (ev.inicial ? { dor: ev.inicial.dor, rot: "ao seu início" } : null) : { dor: ev.semanas[k - 2].dor, rot: `à semana ${k - 1}` };
    let frase = "Continue avaliando todo dia para ver a sua curva.";
    if (atual.dor !== null && ref && ref.dor !== null) {
      const dif = Math.round((ref.dor - atual.dor) * 10) / 10;
      frase = dif > 0 ? `Sua dor média caiu ${String(dif).replace(".", ",")} ponto(s) em relação ${ref.rot}. O corpo está respondendo.`
        : dif === 0 ? `Sua dor ficou igual ${ref.rot}. Manter já é vitória: o hábito impede de piorar.`
        : `Sua dor subiu em relação ${ref.rot}. Semanas pesadas acontecem; reforce as pausas e, se continuar, confira o Semáforo dos Sinais.`;
    }
    return `<div class="cartao relatorio-semana">
      <span class="etiqueta">📈 Relatório da semana ${k}</span>
      <p style="margin:10px 0">${frase}</p>
      ${graficoSemanal()}
      <div style="margin-top:12px">${tabelaSemanas()}</div>
    </div>`;
  }

  function graficoEvolucao() {
    const r = registrosAvaliacao();
    if (estado.inicial) r.unshift({ d: 0, dor: estado.inicial.dor });
    if (r.length < 2) return `<p class="pequeno suave" style="margin:0">O gráfico aparece a partir da sua primeira avaliação diária.</p>`;
    const W = 320, H = 150, x0 = 28, x1 = W - 10, y0 = 12, y1 = H - 24;
    const X = (d) => x0 + (d / TOTAL) * (x1 - x0);
    const Y = (v) => y1 - (v / 10) * (y1 - y0);
    const pts = r.map((p) => `${X(p.d).toFixed(1)},${Y(p.dor).toFixed(1)}`).join(" ");
    const area = `${X(r[0].d).toFixed(1)},${y1} ${pts} ${X(r[r.length - 1].d).toFixed(1)},${y1}`;
    const ult = r[r.length - 1];
    const grade = [0, 5, 10].map((v) => `<line x1="${x0}" x2="${x1}" y1="${Y(v)}" y2="${Y(v)}" style="stroke:var(--cor-borda)" stroke-width="1"/><text x="${x0 - 6}" y="${Y(v) + 4}" text-anchor="end" font-size="10" style="fill:var(--cor-texto-suave)">${v}</text>`).join("");
    const eixo = [[0, "Início"], [7, "7"], [14, "14"], [21, "21"], [TOTAL, String(TOTAL)]].map(([d, t]) => `<text x="${X(d)}" y="${H - 6}" text-anchor="${d === 0 ? "start" : "middle"}" font-size="10" style="fill:var(--cor-texto-suave)">${t}</text>`).join("");
    return `<div class="grafico"><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Dor por dia, de 0 a 10">
      ${grade}${eixo}
      <polygon points="${area}" style="fill:var(--cor-primaria-suave)"/>
      <polyline points="${pts}" fill="none" style="stroke:var(--cor-primaria)" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>
      ${r.map((p) => `<circle cx="${X(p.d)}" cy="${Y(p.dor)}" r="2.5" style="fill:var(--cor-primaria)"/>`).join("")}
      <circle cx="${X(ult.d)}" cy="${Y(ult.dor)}" r="5" style="fill:var(--cor-superficie);stroke:var(--cor-primaria)" stroke-width="2.5"/>
    </svg><p class="pequeno suave" style="margin:4px 0 0">Dor de 0 a 10 por dia do desafio. Linha descendo é evolução.</p></div>`;
  }
  function cartoesEvolucao(ev) {
    const linha = (rot, a, b, melhorMenor = true) => {
      if (a === null || b === null) return "";
      const dif = Math.round((b - a) * 10) / 10;
      const bom = melhorMenor ? dif < 0 : dif > 0;
      return `<div class="ev-linha"><span>${rot}</span><span><strong>${a}</strong> → <strong>${b}</strong> <span class="ev-dif ${bom ? "bom" : dif === 0 ? "" : "ruim"}">${dif > 0 ? "+" : ""}${dif}</span></span></div>`;
    };
    return `
      ${linha(ev.inicial ? "Dor: início → última avaliação" : "Dor: primeira avaliação → última", ev.primeira?.dor ?? null, ev.ultima?.dor ?? null)}
      ${linha(`Dor média: semana 1 → semana ${ev.ultimaSemana}`, ev.mediaSemana1, ev.mediaUltima)}
      ${linha(`Travamento médio (0 a 3): semana 1 → semana ${ev.ultimaSemana}`, ev.travaSemana1, ev.travaUltima)}
      ${ev.diasAvaliados ? `<div class="ev-linha"><span>Dias sem remédio para dor</span><span><strong>${ev.diasSemRemedio}</strong> de ${ev.diasAvaliados}</span></div>` : ""}`;
  }

  /* =========================================================
     6. PROGRESSO
     ========================================================= */
  function progresso() {
    const n = Math.min(diaAtual(), TOTAL);
    const totalPausas = Object.values(estado.dias).reduce((s, d) => s + (d.pausas || 0), 0);
    const ev = evolucao();
    tela.innerHTML = `
      <h1>Seu progresso</h1>
      <div class="grade-2" style="grid-template-columns:repeat(3,1fr)">
        <div class="cartao stat"><strong>${sequencia()}</strong><span class="pequeno suave">dias seguidos</span></div>
        <div class="cartao stat" style="margin-top:0"><strong>${diasFeitos()}/${TOTAL}</strong><span class="pequeno suave">dias feitos</span></div>
        <div class="cartao stat" style="margin-top:0"><strong>${totalPausas}</strong><span class="pequeno suave">pausas</span></div>
      </div>
      <div class="cartao">
        <h3>Sua evolução por semana</h3>
        ${graficoSemanal()}
        <div style="margin-top:12px">${tabelaSemanas()}</div>
      </div>
      <div class="cartao">
        <h3>Dia a dia</h3>
        ${graficoEvolucao()}
        <div style="margin-top:12px">${cartoesEvolucao(ev)}</div>
      </div>
      <div class="cartao">
        <h3>Calendário de checks</h3>
        <div class="calendario">${Array.from({ length: TOTAL }, (_, i) => {
          const d = i + 1, r = estado.dias[d];
          const cls = [r?.feito ? "feito" : "", d === n ? "hoje" : "", d > n ? "futuro" : ""].join(" ");
          return `<div class="${cls}" title="${r ? r.pausas + " pausas" : ""}">${d}</div>`;
        }).join("")}</div>
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
      <h3 style="margin-top:20px">Incluídos no seu acesso</h3>
      <a class="cartao trilha-card" href="#seguranca"><span style="font-size:1.5rem">🛡️</span><span><strong>${D.BONUS_INCLUSOS.seguranca.nome}</strong><br><span class="pequeno suave">${D.BONUS_INCLUSOS.seguranca.promessa}</span></span></a>
      <a class="cartao trilha-card" href="#checklist"><span style="font-size:1.5rem">📋</span><span><strong>${D.BONUS_INCLUSOS.checklist.nome}</strong><br><span class="pequeno suave">${D.BONUS_INCLUSOS.checklist.promessa}</span></span></a>
      <h3 style="margin-top:20px">Adicionais</h3>
      ${bumps.map((b) => estado.compras[b.id] ? `
        <div class="cartao"><span class="etiqueta">Liberado</span><h3 style="margin-top:8px">${b.nome}</h3><p class="pequeno">${b.descricao}</p>
          <div class="video-placeholder">[Conteúdo do bônus]</div></div>` : `
        <div class="cartao bloqueado"><span class="etiqueta">🔒 Não adquirido</span><h3 style="margin-top:8px">${b.nome}</h3><p class="pequeno">${b.descricao}</p>
          <a class="botao botao-secundario" href="#">Adicionar por ${formatarPreco(b.preco)}</a></div>`).join("")}`;
  }

  /* =========================================================
     9. DIA 30: relatório de evolução, certificado e oferta
     ========================================================= */
  function final() {
    const ev = evolucao();
    const dif = ev.primeira && ev.ultima ? ev.primeira.dor - ev.ultima.dor : null;
    const totalPausas = Object.values(estado.dias).reduce((s, d) => s + (d.pausas || 0), 0);
    tela.innerHTML = `
      <h1>🎉 Dia ${TOTAL}: o seu corpo livre</h1>
      <div class="cartao">
        <h3>Seu relatório de evolução</h3>
        ${graficoSemanal()}
        <div style="margin:12px 0">${tabelaSemanas()}</div>
        ${graficoEvolucao()}
        <div style="margin-top:12px">${cartoesEvolucao(ev)}</div>
        <p style="margin-top:12px">${dif > 0 ? `Sua dor caiu <strong>${dif} ponto(s)</strong> em ${TOTAL} dias.` : dif === 0 ? "Sua dor ficou estável, e você criou o hábito das pausas, que é o que impede a dor de piorar." : dif === null ? "Faça avaliações diárias para ver sua evolução aqui." : "Sua dor não diminuiu. Vale conversar com um médico ou fisioterapeuta e levar este relatório."}</p>
        <p class="pequeno suave">Você fez ${diasFeitos()} de ${TOTAL} dias, ${ev.registros.length} avaliações e ${totalPausas} pausas.</p>
      </div>
      <div class="certificado" id="certificado">
        <p class="pequeno suave">Religar · Certificado</p>
        <h2>${C.produto}</h2>
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
      </div>`;
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
        <p style="margin:6px 0"><a href="#medico">🩺 Orientações do médico</a></p>
        <p style="margin:6px 0"><a href="#relatorio-medico">📄 Relatório para levar ao médico</a></p>
        <p style="margin:6px 0"><a href="#lembretes">🔔 Lembretes</a></p>
        <p style="margin:6px 0"><a href="#bonus">🎁 Materiais e bônus</a></p>
        <p style="margin:6px 0"><a href="#" id="ver-semaforo">🚦 Semáforo dos Sinais</a></p>
      </div>
      <div class="cartao">
        <h3>Minha rotina de trabalho</h3>
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
          <button class="botao botao-secundario" id="t-21">Ir ao dia ${TOTAL}</button>
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
      $("#t-21").onclick = () => mover(TOTAL - diaAtual());
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
      <a class="botao botao-secundario botao-bloco" href="#socorro" onclick="this.closest('dialog').close()" style="margin-top:12px">Travou agora? Guia de Socorro</a>
      <button class="botao botao-bloco" onclick="this.closest('dialog').close()" style="margin-top:12px">Entendi</button>`);
  }
  $("#botao-estranho").onclick = abrirSemaforo;

  navegar();
})();
