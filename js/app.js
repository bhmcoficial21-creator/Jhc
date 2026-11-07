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
let cliente = usuarioAtual();
const state = {
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
  const recap = `
    <div class="recap">
      <p><strong>${DIAS[dia.getDay()]}, ${dia.getDate()} de ${MESES[dia.getMonth()]}</strong> às <strong>${fromMin(state.hora)}</strong> · ${esc(barb)}</p>
      <p class="muted">${lista.map((s) => esc(s.nome)).join(" + ")} · ${dur(d)} · <strong>${brl(preco)}</strong></p>
    </div>`;
  if (!cliente) return `
    <h3 class="wiz-title">4. Entre na sua conta</h3>
    ${recap}
    <div class="gate">
      <p>Para confirmar, entre ou crie sua conta. Leva 30 segundos e seu horário fica guardado.</p>
      <div class="form-actions">
        <button type="button" class="btn btn-ghost" data-go="3">Voltar</button>
        <span class="gate-actions">
          <button type="button" class="btn btn-outline" data-auth="login">Entrar</button>
          <button type="button" class="btn btn-primary" data-auth="cadastro">Criar conta</button>
        </span>
      </div>
    </div>`;
  return `
    <h3 class="wiz-title">4. Confirme seu horário</h3>
    ${recap}
    <form id="formDados" class="form" novalidate>
      <p class="who">Agendando como <strong>${esc(cliente.nome)}</strong> · ${esc(cliente.tel)}</p>
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
        <a class="btn btn-outline" href="perfil.html">Ver meus horários</a>
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
    clienteId: cliente.id, nome: cliente.nome, tel: cliente.tel, cabelo: state.cabelo, obs: state.obs.trim(),
    status: "confirmado",
  };
  all.push(booking); saveBookings(all);
  cliente = atualizarConta(cliente.id, { cabelo: booking.cabelo, ultimo: { servicos: booking.servicos, barbeiro } });
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
  if (e.target.name === "obs") state.obs = e.target.value;
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
  else if (t.dataset.auth) {
    sessionStorage.setItem(PENDENTE_KEY, JSON.stringify({ servicos: [...state.servicos], barbeiro: state.barbeiro, cabelo: state.cabelo, data: state.data, hora: state.hora, obs: state.obs }));
    location.href = `entrar.html?modo=${t.dataset.auth}&volta=agendar`;
  }
  else if ("ics" in t.dataset) baixarIcs(state.ultimo);
  else if ("novo" in t.dataset) { Object.assign(state, { step: 1, servicos: new Set(), hora: null, obs: "", barbeiro: "any" }); renderWizard(); }
});
area.addEventListener("submit", (e) => {
  e.preventDefault();
  const err = $("#formError");
  if (!cliente) { state.step = 4; renderWizard(); return; }
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
  if (!cliente) { location.href = `entrar.html?modo=cadastro&plano=${id}&volta=planos`; return; }
  cliente = atualizarConta(cliente.id, { plano: { id, status: "pendente", desde: new Date().toISOString() } });
  renderPlanos();
});

/* ===================== CONTA NO TOPO ===================== */
function renderAuth() {
  $("#authSlot").innerHTML = cliente
    ? `<span class="nav-user">Olá, <strong>${esc(cliente.nome.split(" ")[0])}</strong></span><a href="perfil.html" class="nav-login">Meu perfil</a><button class="nav-login" id="logout">Sair</button>`
    : `<a href="entrar.html" class="nav-login">Entrar / Cadastrar</a>`;
}
$("#authSlot").addEventListener("click", (e) => {
  if (e.target.id !== "logout") return;
  sair(); cliente = null; renderAuth(); renderPlanos(); renderWizard();
});

/* Volta do login com um agendamento em andamento */
(function retomar() {
  let p; try { p = JSON.parse(sessionStorage.getItem(PENDENTE_KEY)); } catch {}
  if (!p) return;
  sessionStorage.removeItem(PENDENTE_KEY);
  if (!cliente) return;
  Object.assign(state, { servicos: new Set(p.servicos.filter((id) => servById[id])), barbeiro: p.barbeiro, cabelo: p.cabelo, data: p.data, hora: p.hora, obs: p.obs || "", step: 4 });
  if (!state.servicos.size) state.step = 1;
  else if (state.hora === null) state.step = 3;   // veio do perfil ("repetir corte"): já cai na escolha do dia
  setTimeout(() => $("#agendar")?.scrollIntoView(), 50);
})();

/* ===================== PROPRIETÁRIO ===================== */
function renderDono() {
  const el = $("#donoMedia"); if (!el || typeof DONO === "undefined" || !DONO.foto) { el?.remove(); return; }
  const nome = DONO.nome ? esc(DONO.nome) : "Barbe Skin";
  el.innerHTML = `
    <div class="dono-main">
      <img src="${esc(DONO.foto)}" alt="${DONO.nome ? esc(DONO.nome) + ", " : ""}${esc(DONO.cargo)} da Barbe Skin" loading="lazy">
      <span class="cut-strip dono-strip" aria-hidden="true"><span>${Array(6).fill(nome).join(" · ")} · ${Array(6).fill(nome).join(" · ")}</span></span>
    </div>
    <figcaption><span>${DONO.nome ? esc(DONO.nome) : "O fundador"}</span><span class="muted">${esc(DONO.cargo)}</span></figcaption>`;
  const banner = $("#crewBanner");
  if (banner) {
    if (DONO.foto2) banner.innerHTML = `<img src="${esc(DONO.foto2)}" alt="Barbeiro trabalhando na Barbe Skin" loading="lazy"><figcaption><small>Na cadeira</small>Degradê na régua, risco na navalha.</figcaption>`;
    else banner.remove();
  }
}

renderDono(); renderAuth(); renderServicos(); renderPlanos(); renderEstilos(); renderBarbeiros(); renderInfo(); renderWizard();
