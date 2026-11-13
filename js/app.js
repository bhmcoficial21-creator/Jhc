/* ===================== SERVIÇOS ===================== */
let catAtual = "pacotes";
function renderServicos() {
  $("#servTabs").innerHTML = Object.entries(CATEGORIAS)
    .map(([id, nome]) => `<button role="tab" class="tab${id === catAtual ? " is-active" : ""}" aria-selected="${id === catAtual}" data-cat="${id}">${nome}</button>`)
    .join("");
  $("#servList").innerHTML = SERVICOS.filter((s) => s.cat === catAtual)
    .map((s) => `
      <li class="price-item">
        <div class="price-main">
          <h3>${esc(s.nome)}</h3>
          <p class="muted">${esc(s.desc)}</p>
        </div>
        <div class="price-side">
          <span class="price">${brl(s.preco)}</span>
          <span class="time">${dur(s.dur)}</span>
          <button class="btn btn-outline btn-sm" data-add="${s.id}">Agendar</button>
        </div>
      </li>`).join("");
}
$("#servTabs").addEventListener("click", (e) => {
  const t = e.target.closest("[data-cat]"); if (!t) return;
  catAtual = t.dataset.cat; renderServicos();
});
document.addEventListener("click", (e) => {
  const add = e.target.closest("[data-add]"); if (!add) return;
  state.servicos.add(add.dataset.add);
  catWizard = servById[add.dataset.add]?.cat || catWizard;
  state.step = 1; renderWizard();
  $("#agendar").scrollIntoView({ behavior: "smooth" });
});

/* ===================== ESTILOS ===================== */
let filtroCabelo = "todos";
function renderEstilos() {
  const opts = [{ id: "todos", nome: "Todos" }, ...TIPOS_CABELO];
  $("#styleFilter").innerHTML = opts
    .map((o) => `<button class="chip${o.id === filtroCabelo ? " is-active" : ""}" data-hair="${o.id}" aria-pressed="${o.id === filtroCabelo}">${o.nome}</button>`).join("");
  const lista = ESTILOS.filter((e) => filtroCabelo === "todos" || e.tipos.includes(filtroCabelo))
    .sort((a, b) => (b.foto ? 1 : 0) - (a.foto ? 1 : 0)); // cortes com foto real aparecem primeiro
  $("#styleGrid").innerHTML = lista.map((e, i) => {
    const s = servById[e.servico];
    const fundo = e.foto
      ? `<img src="${esc(e.foto)}" alt="${esc(e.nome)}" loading="lazy">`
      : `<span class="cut-ph" aria-hidden="true">${esc(e.nome.split(" ")[0])}</span>`;
    const faixa = Array(4).fill(esc(e.nome)).join(" · ");
    return `
      <article class="cut-card">
        <button class="cut-media" data-add="${s.id}" aria-label="Agendar ${esc(e.nome)}">
          ${fundo}
          <span class="cut-num">${String(i + 1).padStart(2, "0")}</span>
          <span class="cut-strip" aria-hidden="true"><span>${faixa} · ${faixa}</span></span>
        </button>
        <div class="cut-info">
          <div><h3>${esc(e.nome)}</h3><p>${esc(e.grupo)} · a partir de ${brl(s.preco)}</p></div>
          <button class="cut-go" data-add="${s.id}" aria-label="Agendar ${esc(e.nome)}">→</button>
        </div>
        <p class="cut-desc">${esc(e.desc)}</p>
      </article>`;
  }).join("");
}
$("#styleFilter").addEventListener("click", (e) => {
  const c = e.target.closest("[data-hair]"); if (!c) return;
  filtroCabelo = c.dataset.hair; renderEstilos();
});

/* ===================== BARBEIROS ===================== */
function renderBarbeiros() {
  $("#barberGrid").innerHTML = BARBEIROS.map((b) => `
    <article class="barber-card">
      <div class="avatar" aria-hidden="true">${esc(b.nome[0])}</div>
      <h3>${esc(b.nome)}</h3>
      <ul class="tags">${b.esp.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>
      <button class="btn btn-outline btn-sm" data-barber-book="${b.id}">Agendar com ${esc(b.nome)}</button>
    </article>`).join("");
}
$("#barberGrid").addEventListener("click", (e) => {
  const b = e.target.closest("[data-barber-book]"); if (!b) return;
  state.barbeiro = b.dataset.barberBook;
  state.step = state.servicos.size ? 3 : 1;
  renderWizard();
  $("#agendar").scrollIntoView({ behavior: "smooth" });
});

/* ===================== HORÁRIOS / ENDEREÇO ===================== */
function renderInfo() {
  $("#hoursTable").innerHTML = [2, 3, 4, 5, 6, 0, 1].map((d) => {
    const h = HORARIOS[d];
    const hoje = new Date().getDay() === d;
    return `<tr class="${hoje ? "is-today" : ""}${h ? "" : " is-closed"}"><th>${DIAS[d]}${hoje ? " <small>hoje</small>" : ""}</th><td>${h ? `${h[0]} – ${h[1]}` : "Fechado"}</td></tr>`;
  }).join("");
  $("#address").textContent = SHOP.endereco;
  $("#mapLink").href = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(SHOP.endereco)}`;
  $("#year").textContent = new Date().getFullYear();
}

/* ===================== AGENDAMENTO ===================== */
let cliente = null;
const maskTel = (v) => {
  const d = v.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 2) return d.length ? `(${d}` : "";
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
};
const state = {
  nome: "", tel: "",
  step: 1,
  servicos: new Set(),
  cabelo: cliente?.cabelo || "",
  barbeiro: "any",
  data: "",
  hora: null,      // minutos desde 00:00
  obs: "",
  ultimo: null,
};
const totais = () => {
  const lista = [...state.servicos].map((id) => servById[id]);
  return { lista, preco: lista.reduce((a, s) => a + s.preco, 0), dur: lista.reduce((a, s) => a + s.dur, 0) };
};

function diasDisponiveis() {
  const out = []; const d = new Date(); d.setHours(0, 0, 0, 0);
  for (let i = 0; i < DIAS_A_FRENTE; i++) {
    const dia = new Date(d); dia.setDate(d.getDate() + i);
    if (HORARIOS[dia.getDay()]) out.push(dia);
  }
  return out;
}

/* Retorna [{min, barbeiros:[ids livres]}] para a data */
function slots(dataStr, duracao) {
  const dia = parseYmd(dataStr); const h = HORARIOS[dia.getDay()]; if (!h) return [];
  const abre = toMin(h[0]), fecha = toMin(h[1]);
  const agora = new Date();
  const minAgora = ymd(agora) === dataStr ? agora.getHours() * 60 + agora.getMinutes() + ANTECEDENCIA_MIN : -1;
  if (!OCUPADOS[dataStr]) return null;
  const candidatos = state.barbeiro === "any" ? BARBEIROS.map((b) => b.id) : [state.barbeiro];
  const out = [];
  for (let t = abre; t + duracao <= fecha; t += INTERVALO_SLOTS) {
    const livres = t < minAgora ? [] : candidatos.filter((id) => barberFree(id, dataStr, t, t + duracao));
    out.push({ min: t, livres });
  }
  return out;
}

function renderSteps() {
  $$("#steps li").forEach((li, i) => {
    li.classList.toggle("is-done", i + 1 < state.step);
    li.classList.toggle("is-current", i + 1 === state.step);
  });
  $("#steps").hidden = state.step === 5;
}

function renderSummary() {
  const { lista, preco, dur: d } = totais();
  const el = $("#summary");
  if (!lista.length || state.step === 5) { el.hidden = true; return; }
  el.hidden = false;
  const podeAvancar = (state.step === 1 && lista.length) || state.step === 2 || (state.step === 3 && state.hora !== null);
  el.innerHTML = `
    <div><strong>${brl(preco)}</strong> <span class="muted">· ${dur(d)} · ${lista.length} serviço${lista.length > 1 ? "s" : ""}</span></div>
    <div class="summary-actions">
      ${state.step > 1 ? `<button class="btn btn-ghost btn-sm" data-go="${state.step - 1}">Voltar</button>` : ""}
      ${state.step < 4 ? `<button class="btn btn-primary btn-sm" data-go="${state.step + 1}" ${podeAvancar ? "" : "disabled"}>Continuar</button>` : ""}
    </div>`;
}

let catWizard = "pacotes";
function stepServicos() {
  const ult = meusDados().ultimo;
  const repetir = ult && ult.servicos?.every((id) => servById[id])
    ? `<button class="repeat" data-repeat>↻ Repetir meu último: <strong>${ult.servicos.map((id) => esc(servById[id].nome)).join(" + ")}</strong>${ult.barbeiro && barberById[ult.barbeiro] ? ` com ${esc(barberById[ult.barbeiro].nome)}` : ""}</button>` : "";
  const qtd = (cat) => SERVICOS.filter((s) => s.cat === cat && state.servicos.has(s.id)).length;
  return `
    <h3 class="wiz-title">1. O que vamos fazer hoje?</h3>
    ${repetir}
    <div class="tabs wiz-tabs" role="tablist">${Object.entries(CATEGORIAS).map(([cat, nome]) =>
      `<button type="button" role="tab" class="tab${cat === catWizard ? " is-active" : ""}" aria-selected="${cat === catWizard}" data-wcat="${cat}">${nome}${qtd(cat) ? ` <b class="tab-n">${qtd(cat)}</b>` : ""}</button>`).join("")}</div>
    <fieldset class="svc-group">
      <legend class="sr-only">${CATEGORIAS[catWizard]}</legend>
      ${SERVICOS.filter((s) => s.cat === catWizard).map((s) => `
        <label class="svc${state.servicos.has(s.id) ? " is-checked" : ""}">
          <input type="checkbox" value="${s.id}" ${state.servicos.has(s.id) ? "checked" : ""}>
          <span class="svc-name">${esc(s.nome)}</span>
          <span class="svc-meta">${dur(s.dur)} · <strong>${brl(s.preco)}</strong></span>
        </label>`).join("")}
    </fieldset>`;
}

function stepBarbeiro() {
  const especialista = (b) => state.cabelo && b.tipos.includes(state.cabelo);
  return `
    <h3 class="wiz-title">2. Seu tipo de cabelo <span class="muted">(opcional)</span></h3>
    <div class="chips">${TIPOS_CABELO.map((t) => `<button class="chip${state.cabelo === t.id ? " is-active" : ""}" data-cabelo="${t.id}" aria-pressed="${state.cabelo === t.id}">${t.nome}</button>`).join("")}</div>
    <h3 class="wiz-title">Escolha o barbeiro</h3>
    <div class="pick-grid">
      <button class="pick${state.barbeiro === "any" ? " is-active" : ""}" data-barbeiro="any">
        <span class="avatar sm">★</span><span><strong>Sem preferência</strong><small>Primeiro disponível</small></span>
      </button>
      ${BARBEIROS.map((b) => `
        <button class="pick${state.barbeiro === b.id ? " is-active" : ""}" data-barbeiro="${b.id}">
          <span class="avatar sm">${esc(b.nome[0])}</span>
          <span><strong>${esc(b.nome)}</strong><small>${esc(b.esp.slice(0, 3).join(" · "))}</small>
          ${especialista(b) ? `<em class="badge">Especialista no seu cabelo</em>` : ""}</span>
        </button>`).join("")}
    </div>`;
}

function stepDataHora() {
  const dias = diasDisponiveis();
  if (!state.data || !dias.some((d) => ymd(d) === state.data)) state.data = ymd(dias[0]);
  const { dur: d } = totais();
  const lista = slots(state.data, d);
  if (!lista) {                                   // busca os horários ocupados no banco
    buscarOcupados(state.data).then(() => state.step === 3 && renderWizard()).catch(() => {
      const t = $("#times-load"); if (t) t.innerHTML = `Não conseguimos falar com a agenda online agora.<br><button type="button" class="btn btn-outline btn-sm" data-recarregar>Tentar de novo</button>`;
    });
  }
  const livres = (lista || []).filter((s) => s.livres.length);
  const dia = parseYmd(state.data); const h = HORARIOS[dia.getDay()];
  return `
    <h3 class="wiz-title">3. Escolha o dia</h3>
    <div class="days" role="listbox" aria-label="Dias">
      ${dias.map((dt) => { const k = ymd(dt); return `
        <button class="day${k === state.data ? " is-active" : ""}" data-dia="${k}" role="option" aria-selected="${k === state.data}">
          <span>${DIAS_CURTO[dt.getDay()]}</span><strong>${dt.getDate()}</strong><span>${MESES[dt.getMonth()]}</span>
        </button>`; }).join("")}
    </div>
    ${AGENDA_OFFLINE && lista ? `<p class="offline-note">Sem conexão com a agenda online agora. Pode escolher o horário normalmente: a gente guarda e envia pro barbeiro assim que a conexão voltar.</p>` : ""}
    <h3 class="wiz-title">Horário <span class="muted">· ${DIAS[dia.getDay()]} das ${h[0]} às ${h[1]} · seu atendimento dura ${dur(d)}</span></h3>
    ${!lista ? `<p class="empty" id="times-load">Carregando horários livres…</p>` : livres.length ? `<div class="times">
      ${lista.map((s) => `<button class="time-btn${state.hora === s.min ? " is-active" : ""}" data-hora="${s.min}" ${s.livres.length ? "" : "disabled"}>${fromMin(s.min)}</button>`).join("")}
    </div>` : `<p class="empty">Sem horários livres neste dia. Tente outro dia${state.barbeiro !== "any" ? " ou outro barbeiro" : ""}.</p>`}`;
}

function stepDados() {
  const { lista, preco, dur: d } = totais();
  const dia = parseYmd(state.data);
  const barb = state.barbeiro === "any" ? "Primeiro disponível" : barberById[state.barbeiro].nome;
  const recap = `
    <div class="recap">
      <p><strong>${DIAS[dia.getDay()]}, ${dia.getDate()} de ${MESES[dia.getMonth()]}</strong> às <strong>${fromMin(state.hora)}</strong> · ${esc(barb)}</p>
      <p class="muted">${lista.map((s) => esc(s.nome)).join(" + ")} · ${dur(d)} · <strong>${brl(preco)}</strong></p>
    </div>`;
  const eu = meusDados();
  return `
    <h3 class="wiz-title">4. Quem vai sentar na cadeira?</h3>
    ${recap}
    <form id="formDados" class="form" novalidate>
      <label class="field"><span>Seu nome</span><input name="nome" autocomplete="name" required value="${esc(state.nome || eu.nome)}" placeholder="Como te chamamos?"></label>
      <label class="field"><span>WhatsApp <small class="muted">(para o barbeiro falar com você)</small></span><input name="tel" type="tel" inputmode="tel" autocomplete="tel" required value="${esc(state.tel || eu.tel)}" placeholder="(11) 90000-0000"></label>
      <label class="field"><span>Observação <small class="muted">(opcional)</small></span><textarea name="obs" rows="2" placeholder="Ex.: quero o degradê mais baixo, risco do lado esquerdo">${esc(state.obs)}</textarea></label>
      <p class="form-error" id="formError" role="alert"></p>
      <div class="form-actions">
        <button type="button" class="btn btn-ghost" data-go="3">Voltar</button>
        <button type="submit" class="btn btn-primary">Confirmar agendamento</button>
      </div>
      <p class="muted form-note">Sem cadastro e sem senha. Seus horários ficam salvos neste celular, em "Meus horários".</p>
    </form>`;
}

function stepSucesso() {
  const b = state.ultimo;
  const dia = parseYmd(b.data);
  const texto = `Olá! Agendei na Messin do Corte: ${b.servicos.map((id) => servById[id].nome).join(" + ")} com ${barberById[b.barbeiro].nome}, ${DIAS[dia.getDay()]} ${dia.getDate()}/${dia.getMonth() + 1} às ${fromMin(b.inicio)}. Nome: ${b.nome}.`;
  return `
    <div class="success">
      <div class="success-ico">✓</div>
      <h3>${b.pendente ? "Pedido guardado!" : "Horário confirmado!"}</h3>
      ${b.pendente ? `<p class="offline-note">Estamos sem conexão com a agenda agora. Seu pedido fica salvo neste celular e é enviado sozinho ao barbeiro quando a internet voltar. Abra o site de novo mais tarde para garantir.</p>` : ""}
      <p><strong>${DIAS[dia.getDay()]}, ${dia.getDate()} de ${MESES[dia.getMonth()]} às ${fromMin(b.inicio)}</strong></p>
      <p>${esc(b.servicos.map((id) => servById[id].nome).join(" + "))} com <strong>${esc(barberById[b.barbeiro].nome)}</strong></p>
      <p class="muted">${dur(b.fim - b.inicio)} · ${brl(b.preco)} · ${esc(SHOP.endereco)}</p>
      <div class="form-actions center">
        <button class="btn btn-outline" data-ics>Adicionar ao calendário</button>
        ${SHOP.whatsapp ? `<a class="btn btn-primary" target="_blank" rel="noopener" href="https://wa.me/${SHOP.whatsapp}?text=${encodeURIComponent(texto)}">Enviar no WhatsApp</a>` : ""}
        <a class="btn btn-outline" href="perfil.html">Meus horários</a>
        <button class="btn btn-ghost" data-novo>Novo agendamento</button>
      </div>
    </div>`;
}

function renderWizard() {
  const w = $("#wizard");
  w.innerHTML = [null, stepServicos, stepBarbeiro, stepDataHora, stepDados, stepSucesso][state.step]();
  renderSteps(); renderSummary();
}

async function salvarAgendamento() {
  const { lista, preco, dur: d } = totais();
  const ini = state.hora, fim = ini + d;
  await buscarOcupados(state.data);                       // confere de novo na hora de gravar
  const livre = slots(state.data, d).find((s) => s.min === ini)?.livres || [];
  if (!livre.length) { const e = new Error("ocupado"); e.ocupado = true; throw e; }
  // sem preferência: escolhe o barbeiro livre com menos atendimentos no dia
  const carga = (id) => (OCUPADOS[state.data] || []).filter((b) => b.barbeiro === id).length;
  const barbeiro = livre.sort((a, b) => carga(a) - carga(b))[0];
  const booking = await criarAgendamento({
    data: state.data, inicio: ini, fim, barbeiro, servicos: lista.map((s) => s.id), preco,
    nome: state.nome.trim(), tel: state.tel.trim(), cabelo: state.cabelo, obs: state.obs.trim(),
  });
  salvarMeusDados({ nome: state.nome.trim(), tel: state.tel.trim(), cabelo: state.cabelo, ultimo: { servicos: booking.servicos, barbeiro } });
  delete OCUPADOS[state.data];
  return booking;
}

function baixarIcs(b) {
  const dia = parseYmd(b.data);
  const stamp = (min) => `${b.data.replace(/-/g, "")}T${fromMin(min).replace(":", "")}00`;
  const ics = [
    "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Messin do Corte//Agenda//PT-BR", "BEGIN:VEVENT",
    `UID:${b.id}@messindocorte`, `DTSTART:${stamp(b.inicio)}`, `DTEND:${stamp(b.fim)}`,
    `SUMMARY:Messin do Corte – ${b.servicos.map((id) => servById[id].nome).join(" + ")}`,
    `DESCRIPTION:Com ${barberById[b.barbeiro].nome} · ${brl(b.preco)}`,
    `LOCATION:${SHOP.endereco}`, "BEGIN:VALARM", "TRIGGER:-PT2H", "ACTION:DISPLAY", "DESCRIPTION:Seu horário na Messin do Corte", "END:VALARM",
    "END:VEVENT", "END:VCALENDAR",
  ].join("\r\n");
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([ics], { type: "text/calendar" }));
  a.download = `messin-do-corte-${dia.getDate()}-${dia.getMonth() + 1}.ics`; a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}


/* Eventos do assistente */
const area = $("#agendar");
area.addEventListener("change", (e) => {
  if (e.target.matches(".svc input")) {
    e.target.checked ? state.servicos.add(e.target.value) : state.servicos.delete(e.target.value);
    e.target.closest(".svc").classList.toggle("is-checked", e.target.checked);
    renderSummary();
  }
});
area.addEventListener("input", (e) => {
  if (e.target.name === "tel") e.target.value = maskTel(e.target.value);
  if (["nome", "tel", "obs"].includes(e.target.name)) state[e.target.name] = e.target.value;
});
area.addEventListener("click", (e) => {
  const t = e.target.closest("button"); if (!t || t.disabled) return;
  if ("recarregar" in t.dataset) { delete OCUPADOS[state.data]; renderWizard(); return; }
  if (t.dataset.wcat) { catWizard = t.dataset.wcat; renderWizard(); return; }
  if (t.dataset.go) { state.step = +t.dataset.go; renderWizard(); $("#agendar").scrollIntoView({ behavior: "smooth" }); }
  else if (t.dataset.cabelo) { state.cabelo = state.cabelo === t.dataset.cabelo ? "" : t.dataset.cabelo; renderWizard(); }
  else if (t.dataset.barbeiro) { state.barbeiro = t.dataset.barbeiro; state.hora = null; renderWizard(); }
  else if (t.dataset.dia) { state.data = t.dataset.dia; state.hora = null; renderWizard(); }
  else if (t.dataset.hora) { state.hora = +t.dataset.hora; renderWizard(); }
  else if ("repeat" in t.dataset) {
    const ult = meusDados().ultimo;
    state.servicos = new Set(ult.servicos);
    if (ult.barbeiro) state.barbeiro = ult.barbeiro;
    state.step = 3; renderWizard();
  }
  else if (t.dataset.auth) {
    sessionStorage.setItem(PENDENTE_KEY, JSON.stringify({ servicos: [...state.servicos], barbeiro: state.barbeiro, cabelo: state.cabelo, data: state.data, hora: state.hora, obs: state.obs }));
    location.href = `entrar.html?modo=${t.dataset.auth}&volta=agendar`;
  }
  else if ("ics" in t.dataset) baixarIcs(state.ultimo);
  else if ("novo" in t.dataset) { Object.assign(state, { step: 1, servicos: new Set(), hora: null, obs: "", barbeiro: "any" }); renderWizard(); }
});
area.addEventListener("submit", async (e) => {
  e.preventDefault();
  const err = $("#formError");
  state.nome = e.target.nome.value; state.tel = e.target.tel.value; state.obs = e.target.obs.value;
  if (state.nome.trim().length < 2) { err.textContent = "Informe seu nome."; return; }
  if (state.tel.replace(/\D/g, "").length < 10) { err.textContent = "Informe seu WhatsApp com DDD."; return; }
  const btn = e.target.querySelector('button[type="submit"]');
  btn.disabled = true; btn.textContent = "Confirmando…";
  let b;
  try { b = await salvarAgendamento(); }
  catch (er) {
    btn.disabled = false; btn.textContent = "Confirmar agendamento";
    if (er.ocupado) { delete OCUPADOS[state.data]; state.hora = null; state.step = 3; renderWizard();
      setTimeout(() => { const t = $("#times-load") || $(".times"); t?.insertAdjacentHTML("beforebegin", '<p class="form-error">Esse horário acabou de ser ocupado. Escolha outro.</p>'); }, 50); }
    else if (er.limite) err.textContent = "Esse WhatsApp já tem 3 horários marcados. Cancele um em \"Meus horários\" ou fale com a barbearia.";
    else err.textContent = "Não foi possível confirmar agora. Verifique a internet e tente de novo.";
    return;
  }
  state.ultimo = b; state.step = 5; renderWizard();
  $("#agendar").scrollIntoView({ behavior: "smooth" });
});

/* Botão flutuante: some na capa (que já tem o botão) e na seção de agendamento */
const visivel = {};
const fabObs = new IntersectionObserver((ents) => {
  ents.forEach((en) => (visivel[en.target.id] = en.isIntersecting));
  $("#fab").classList.toggle("is-hidden", Object.values(visivel).some(Boolean));
}, { threshold: 0.1 });
["inicio", "agendar"].forEach((id) => fabObs.observe($("#" + id)));

/* ===================== PLANOS ===================== */
const ICONES = {
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-6 8-6s8 2 8 6"/>',
  star: '<path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9Z"/>',
  crown: '<path d="m3 8 4.5 4L12 5l4.5 7L21 8l-2 11H5Z"/>',
};
function renderPlanos() {
  const meu = cliente?.plano;
  $("#plansGrid").innerHTML = PLANOS.map((p) => {
    const ativoAqui = meu?.id === p.id;
    return `
    <article class="plan${p.destaque ? " is-featured" : ""}">
      ${p.destaque ? `<span class="plan-flag">Mais escolhido</span>` : ""}
      <h3 class="plan-name"><svg viewBox="0 0 24 24" aria-hidden="true">${ICONES[p.icone]}</svg>${esc(p.nome)}</h3>
      <p class="plan-desc">${esc(p.desc)}</p>
      <div class="plan-price">
        <span class="cur">R$</span><span class="val">${p.preco}</span>
        <span class="per">${esc(p.sufixo)}<small>${esc(p.nota)}</small></span>
      </div>
      ${ativoAqui
        ? `<div class="plan-btn is-done">✓ Pedido enviado — finalize na barbearia</div>`
        : `<button class="plan-btn${p.id === "avulso" ? " is-light" : ""}" data-plano="${p.id}">${esc(p.cta)}</button>`}
      <p class="plan-info">${esc(p.info)}</p>
      <ul class="plan-list">${p.itens.map((i) => `<li><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="m8 12 3 3 5-6"/></svg>${esc(i)}</li>`).join("")}</ul>
    </article>`;
  }).join("");
}
$("#plansGrid").addEventListener("click", (e) => {
  const b = e.target.closest("[data-plano]"); if (!b) return;
  const id = b.dataset.plano;
  if (id === "avulso") { $("#agendar").scrollIntoView({ behavior: "smooth" }); return; }
  const p = PLANOS.find((x) => x.id === id);
  state.obs = `Quero assinar o ${p.nome}.`;
  b.textContent = "Escolha seu primeiro horário ↓";
  setTimeout(() => $("#agendar").scrollIntoView({ behavior: "smooth" }), 300);
});

/* ===================== CONTA NO TOPO ===================== */
function renderAuth() {
  $("#authSlot").innerHTML = barbeiroLogado()
    ? `<a href="agenda.html" class="nav-login">Minha agenda</a>`
    : `<a href="perfil.html" class="nav-login">Meus horários</a>`;
}
$("#authSlot").addEventListener("click", (e) => {
  if (e.target.id !== "logout") return;
  sair().then(() => { cliente = null; renderAuth(); renderPlanos(); renderWizard(); });
});


/* Volta do login com um agendamento em andamento */
function retomar() {
  let p; try { p = JSON.parse(sessionStorage.getItem(PENDENTE_KEY)); } catch {}
  if (!p) return;
  sessionStorage.removeItem(PENDENTE_KEY);
  Object.assign(state, { servicos: new Set(p.servicos.filter((id) => servById[id])), barbeiro: p.barbeiro, cabelo: p.cabelo, data: p.data, hora: p.hora, obs: p.obs || "", step: 4 });
  if (!state.servicos.size) state.step = 1;
  else if (state.hora === null) state.step = 3;   // veio do perfil ("repetir corte"): já cai na escolha do dia
  setTimeout(() => $("#agendar")?.scrollIntoView(), 50);
}

/* ===================== PROPRIETÁRIO ===================== */
function renderDono() {
  const el = $("#donoMedia"); if (!el || typeof DONO === "undefined" || !DONO.foto) { el?.remove(); return; }
  const nome = DONO.nome ? esc(DONO.nome) : "Messin do Corte";
  el.innerHTML = `
    <div class="dono-main">
      <img src="${esc(DONO.foto)}" alt="${DONO.nome ? esc(DONO.nome) + ", " : ""}${esc(DONO.cargo)} da Messin do Corte" loading="lazy">
      <span class="cut-strip dono-strip" aria-hidden="true"><span>${Array(6).fill(nome).join(" · ")} · ${Array(6).fill(nome).join(" · ")}</span></span>
    </div>
    <figcaption><span>${DONO.nome ? esc(DONO.nome) : "O fundador"}</span><span class="muted">${esc(DONO.cargo)}</span></figcaption>`;
  const banner = $("#crewBanner");
  if (banner) {
    if (DONO.foto2) banner.innerHTML = `<img src="${esc(DONO.foto2)}" alt="Barbeiro trabalhando na Messin do Corte" loading="lazy"><figcaption><small>Na cadeira</small>Degradê na régua, risco na navalha.</figcaption>`;
    else banner.remove();
  }
}

renderDono(); 
renderServicos(); renderEstilos(); renderBarbeiros(); renderInfo();
renderAuth(); renderPlanos(); renderWizard();
state.cabelo = meusDados().cabelo || "";
retomar();
renderWizard();
carregarSessao().then(() => { renderAuth(); }).catch(() => {});
