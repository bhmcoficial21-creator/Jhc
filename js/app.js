/* ===================== SERVIÇOS ===================== */
let catAtual = "combos";
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
  state.step = 1; renderWizard();
  $("#agendar").scrollIntoView({ behavior: "smooth" });
});

/* ===================== ESTILOS ===================== */
let filtroCabelo = "todos";
function renderEstilos() {
  const opts = [{ id: "todos", nome: "Todos" }, ...TIPOS_CABELO];
  $("#styleFilter").innerHTML = opts
    .map((o) => `<button class="chip${o.id === filtroCabelo ? " is-active" : ""}" data-hair="${o.id}" aria-pressed="${o.id === filtroCabelo}">${o.nome}</button>`).join("");
  const lista = ESTILOS.filter((e) => filtroCabelo === "todos" || e.tipos.includes(filtroCabelo));
  $("#styleGrid").innerHTML = lista.map((e) => {
    const s = servById[e.servico];
    return `
      <article class="style-card">
        <span class="tag">${esc(e.grupo)}</span>
        <h3>${esc(e.nome)}</h3>
        <p class="muted">${esc(e.desc)}</p>
        <div class="style-foot">
          <span>a partir de <strong>${brl(s.preco)}</strong></span>
          <button class="link-btn" data-add="${s.id}">Quero esse →</button>
        </div>
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
const cliente = store.get(CLIENT_KEY, null);
const state = {
  step: 1,
  servicos: new Set(),
  cabelo: cliente?.cabelo || "",
  barbeiro: "any",
  data: "",
  hora: null,      // minutos desde 00:00
  nome: cliente?.nome || "",
  tel: cliente?.tel || "",
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
  const bookings = getBookings();
  const candidatos = state.barbeiro === "any" ? BARBEIROS.map((b) => b.id) : [state.barbeiro];
  const out = [];
  for (let t = abre; t + duracao <= fecha; t += INTERVALO_SLOTS) {
    const livres = t < minAgora ? [] : candidatos.filter((id) => barberFree(id, dataStr, t, t + duracao, bookings));
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

function stepServicos() {
  const ult = cliente?.ultimo;
  const repetir = ult && ult.servicos?.every((id) => servById[id])
    ? `<button class="repeat" data-repeat>↻ Repetir meu último: <strong>${ult.servicos.map((id) => esc(servById[id].nome)).join(" + ")}</strong>${ult.barbeiro && barberById[ult.barbeiro] ? ` com ${esc(barberById[ult.barbeiro].nome)}` : ""}</button>` : "";
  return `
    <h3 class="wiz-title">1. O que vamos fazer hoje?</h3>
    ${repetir}
    ${Object.entries(CATEGORIAS).map(([cat, nome]) => `
      <fieldset class="svc-group">
        <legend>${nome}</legend>
        ${SERVICOS.filter((s) => s.cat === cat).map((s) => `
          <label class="svc${state.servicos.has(s.id) ? " is-checked" : ""}">
            <input type="checkbox" value="${s.id}" ${state.servicos.has(s.id) ? "checked" : ""}>
            <span class="svc-name">${esc(s.nome)}</span>
            <span class="svc-meta">${dur(s.dur)} · <strong>${brl(s.preco)}</strong></span>
          </label>`).join("")}
      </fieldset>`).join("")}`;
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
  const livres = lista.filter((s) => s.livres.length);
  const dia = parseYmd(state.data); const h = HORARIOS[dia.getDay()];
  return `
    <h3 class="wiz-title">3. Escolha o dia</h3>
    <div class="days" role="listbox" aria-label="Dias">
      ${dias.map((dt) => { const k = ymd(dt); return `
        <button class="day${k === state.data ? " is-active" : ""}" data-dia="${k}" role="option" aria-selected="${k === state.data}">
          <span>${DIAS_CURTO[dt.getDay()]}</span><strong>${dt.getDate()}</strong><span>${MESES[dt.getMonth()]}</span>
        </button>`; }).join("")}
    </div>
    <h3 class="wiz-title">Horário <span class="muted">· ${DIAS[dia.getDay()]} das ${h[0]} às ${h[1]} · seu atendimento dura ${dur(d)}</span></h3>
    ${livres.length ? `<div class="times">
      ${lista.map((s) => `<button class="time-btn${state.hora === s.min ? " is-active" : ""}" data-hora="${s.min}" ${s.livres.length ? "" : "disabled"}>${fromMin(s.min)}</button>`).join("")}
    </div>` : `<p class="empty">Sem horários livres neste dia. Tente outro dia${state.barbeiro !== "any" ? " ou outro barbeiro" : ""}.</p>`}`;
}

function stepDados() {
  const { lista, preco, dur: d } = totais();
  const dia = parseYmd(state.data);
  const barb = state.barbeiro === "any" ? "Primeiro disponível" : barberById[state.barbeiro].nome;
  return `
    <h3 class="wiz-title">4. Seus dados</h3>
    <div class="recap">
      <p><strong>${DIAS[dia.getDay()]}, ${dia.getDate()} de ${MESES[dia.getMonth()]}</strong> às <strong>${fromMin(state.hora)}</strong> · ${esc(barb)}</p>
      <p class="muted">${lista.map((s) => esc(s.nome)).join(" + ")} · ${dur(d)} · <strong>${brl(preco)}</strong></p>
    </div>
    <form id="formDados" class="form" novalidate>
      <label class="field"><span>Nome</span><input name="nome" autocomplete="name" required value="${esc(state.nome)}" placeholder="Como te chamamos?"></label>
      <label class="field"><span>WhatsApp</span><input name="tel" type="tel" inputmode="tel" autocomplete="tel" required value="${esc(state.tel)}" placeholder="(00) 00000-0000"></label>
      <label class="field"><span>Observação <small class="muted">(opcional)</small></span><textarea name="obs" rows="2" placeholder="Ex.: quero o degradê mais baixo, risco do lado esquerdo">${esc(state.obs)}</textarea></label>
      <p class="form-error" id="formError" role="alert"></p>
      <div class="form-actions">
        <button type="button" class="btn btn-ghost" data-go="3">Voltar</button>
        <button type="submit" class="btn btn-primary">Confirmar agendamento</button>
      </div>
    </form>`;
}

function stepSucesso() {
  const b = state.ultimo;
  const dia = parseYmd(b.data);
  const texto = `Olá! Agendei na Barbe Skin: ${b.servicos.map((id) => servById[id].nome).join(" + ")} com ${barberById[b.barbeiro].nome}, ${DIAS[dia.getDay()]} ${dia.getDate()}/${dia.getMonth() + 1} às ${fromMin(b.inicio)}. Nome: ${b.nome}.`;
  return `
    <div class="success">
      <div class="success-ico">✓</div>
      <h3>Horário confirmado!</h3>
      <p><strong>${DIAS[dia.getDay()]}, ${dia.getDate()} de ${MESES[dia.getMonth()]} às ${fromMin(b.inicio)}</strong></p>
      <p>${esc(b.servicos.map((id) => servById[id].nome).join(" + "))} com <strong>${esc(barberById[b.barbeiro].nome)}</strong></p>
      <p class="muted">${dur(b.fim - b.inicio)} · ${brl(b.preco)} · ${esc(SHOP.endereco)}</p>
      <div class="form-actions center">
        <button class="btn btn-outline" data-ics>Adicionar ao calendário</button>
        ${SHOP.whatsapp ? `<a class="btn btn-primary" target="_blank" rel="noopener" href="https://wa.me/${SHOP.whatsapp}?text=${encodeURIComponent(texto)}">Enviar no WhatsApp</a>` : ""}
        <button class="btn btn-ghost" data-novo>Novo agendamento</button>
      </div>
    </div>`;
}

function renderWizard() {
  const w = $("#wizard");
  w.innerHTML = [null, stepServicos, stepBarbeiro, stepDataHora, stepDados, stepSucesso][state.step]();
  renderSteps(); renderSummary();
}

function salvarAgendamento() {
  const { lista, preco, dur: d } = totais();
  const ini = state.hora, fim = ini + d;
  const livre = slots(state.data, d).find((s) => s.min === ini)?.livres || [];
  if (!livre.length) return null;
  const all = getBookings();
  // Sem preferência: escolhe o barbeiro livre com menos atendimentos no dia
  const carga = (id) => all.filter((b) => ativo(b) && b.barbeiro === id && b.data === state.data).length;
  const barbeiro = livre.sort((a, b) => carga(a) - carga(b))[0];
  const booking = {
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    criadoEm: new Date().toISOString(),
    data: state.data, inicio: ini, fim, barbeiro,
    servicos: lista.map((s) => s.id), preco,
    nome: state.nome.trim(), tel: state.tel.trim(), cabelo: state.cabelo, obs: state.obs.trim(),
    status: "confirmado",
  };
  all.push(booking); saveBookings(all);
  store.set(CLIENT_KEY, { nome: booking.nome, tel: booking.tel, cabelo: booking.cabelo, ultimo: { servicos: booking.servicos, barbeiro } });
  return booking;
}

function baixarIcs(b) {
  const dia = parseYmd(b.data);
  const stamp = (min) => `${b.data.replace(/-/g, "")}T${fromMin(min).replace(":", "")}00`;
  const ics = [
    "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Barbe Skin//Agenda//PT-BR", "BEGIN:VEVENT",
    `UID:${b.id}@barbeskin`, `DTSTART:${stamp(b.inicio)}`, `DTEND:${stamp(b.fim)}`,
    `SUMMARY:Barbe Skin – ${b.servicos.map((id) => servById[id].nome).join(" + ")}`,
    `DESCRIPTION:Com ${barberById[b.barbeiro].nome} · ${brl(b.preco)}`,
    `LOCATION:${SHOP.endereco}`, "BEGIN:VALARM", "TRIGGER:-PT2H", "ACTION:DISPLAY", "DESCRIPTION:Seu horário na Barbe Skin", "END:VALARM",
    "END:VEVENT", "END:VCALENDAR",
  ].join("\r\n");
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([ics], { type: "text/calendar" }));
  a.download = `barbe-skin-${dia.getDate()}-${dia.getMonth() + 1}.ics`; a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

const maskTel = (v) => {
  const d = v.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 2) return d.length ? `(${d}` : "";
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
};

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
  if (t.dataset.go) { state.step = +t.dataset.go; renderWizard(); $("#agendar").scrollIntoView({ behavior: "smooth" }); }
  else if (t.dataset.cabelo) { state.cabelo = state.cabelo === t.dataset.cabelo ? "" : t.dataset.cabelo; renderWizard(); }
  else if (t.dataset.barbeiro) { state.barbeiro = t.dataset.barbeiro; state.hora = null; renderWizard(); }
  else if (t.dataset.dia) { state.data = t.dataset.dia; state.hora = null; renderWizard(); }
  else if (t.dataset.hora) { state.hora = +t.dataset.hora; renderWizard(); }
  else if ("repeat" in t.dataset) {
    state.servicos = new Set(cliente.ultimo.servicos);
    if (cliente.ultimo.barbeiro) state.barbeiro = cliente.ultimo.barbeiro;
    state.step = 3; renderWizard();
  }
  else if ("ics" in t.dataset) baixarIcs(state.ultimo);
  else if ("novo" in t.dataset) { Object.assign(state, { step: 1, servicos: new Set(), hora: null, obs: "", barbeiro: "any" }); renderWizard(); }
});
area.addEventListener("submit", (e) => {
  e.preventDefault();
  const err = $("#formError");
  if (state.nome.trim().length < 2) { err.textContent = "Informe seu nome."; return; }
  if (state.tel.replace(/\D/g, "").length < 10) { err.textContent = "Informe um WhatsApp válido com DDD."; return; }
  const b = salvarAgendamento();
  if (!b) { err.textContent = "Esse horário acabou de ser ocupado. Escolha outro."; state.hora = null; state.step = 3; renderWizard(); return; }
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

renderServicos(); renderEstilos(); renderBarbeiros(); renderInfo(); renderWizard();
