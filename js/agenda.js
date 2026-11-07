/* Perfil do barbeiro: vê quem está marcado em cada horário */
const eu = barbeiroLogado();
if (!eu) location.replace("entrar.html?perfil=barbeiro");

const STATUS = { confirmado: "Confirmado", concluido: "Concluído", faltou: "Faltou", cancelado: "Cancelado" };
let escopo = "eu";
let dia = ymd(new Date());

const planoDe = (b) => {
  const c = getContas().find((x) => x.id === b.clienteId);
  const p = c?.plano && PLANOS.find((x) => x.id === c.plano.id);
  return p ? ` <span class="plan-badge">${esc(p.nome)}${c.plano.status === "pendente" ? " · pendente" : ""}</span>` : "";
};
const ehNovo = (b) => b.criadoEm && Date.now() - new Date(b.criadoEm).getTime() < 24 * 3600e3;
const meus = (lista) => (escopo === "eu" ? lista.filter((b) => b.barbeiro === eu.id) : lista);

function renderDias() {
  const todos = getBookings().filter(ativo);
  const base = new Date(); base.setHours(0, 0, 0, 0);
  const html = [];
  for (let i = -1; i < 14; i++) {
    const d = new Date(base); d.setDate(base.getDate() + i);
    const k = ymd(d), aberto = !!HORARIOS[d.getDay()];
    const n = meus(todos.filter((b) => b.data === k)).length;
    html.push(`<button class="dstrip${k === dia ? " is-active" : ""}${aberto ? "" : " is-closed"}" data-dia="${k}" role="option" aria-selected="${k === dia}">
      <span>${i === 0 ? "Hoje" : DIAS_CURTO[d.getDay()]}</span><strong>${d.getDate()}</strong>
      <em>${aberto ? (n ? `${n} cliente${n > 1 ? "s" : ""}` : "livre") : "fechado"}</em></button>`);
  }
  $("#dias").innerHTML = html.join("");
  $("#dias .is-active")?.scrollIntoView({ inline: "center", block: "nearest" });
}

function linhaDoTempo(barb, lista, h, fichas) {
  if (!h) return `<p class="empty">Fechado neste dia.</p>`;
  const abre = toMin(h[0]), fecha = toMin(h[1]);
  const ativos = lista.filter(ativo).sort((a, b) => a.inicio - b.inicio);
  const out = []; let t = abre;
  const livre = (de, ate) => { if (ate - de >= 15) out.push(`<div class="tl-free"><span>${fromMin(de)}</span>Livre até ${fromMin(ate)}</div>`); };
  for (const b of ativos) {
    if (b.inicio > t) livre(t, b.inicio);
    out.push(cartao(b, fichas));
    t = Math.max(t, b.fim);
  }
  if (fecha > t) livre(t, fecha);
  const canc = lista.filter((b) => !ativo(b));
  if (canc.length) out.push(`<details class="tl-canc"><summary>${canc.length} cancelado${canc.length > 1 ? "s" : ""}</summary>${canc.map((b) => cartao(b, fichas)).join("")}</details>`);
  return out.join("");
}

function cartao(b, fichas) {
  const passou = jaPassou(b);
  return `
    <article class="appt st-${b.status}${passou ? " is-past" : ""}">
      <div class="appt-head"><span class="appt-time">${fromMin(b.inicio)}–${fromMin(b.fim)}</span><span>${brl(b.preco)}</span></div>
      <div class="appt-client"><strong>${esc(b.nome)}</strong>${planoDe(b)}${ehNovo(b) ? ' <span class="new-badge">novo</span>' : ""}</div>
      <div class="muted">${b.servicos.map((id) => esc(servById[id]?.nome || id)).join(" + ")}${b.cabelo ? ` · cabelo ${esc(b.cabelo)}` : ""}</div>
      ${b.obs ? `<div class="appt-obs">“${esc(b.obs)}”</div>` : ""}
      <div class="appt-actions">
        <a href="https://wa.me/55${telKey(b.tel)}?text=${encodeURIComponent(`Olá ${b.nome.split(" ")[0]}! Aqui é da barbearia, sobre seu horário ${dataLonga(b.data)} às ${fromMin(b.inicio)}.`)}" target="_blank" rel="noopener" class="wa">WhatsApp</a>
        ${b.status !== "concluido" ? `<button data-st="concluido" data-id="${b.id}">✓ Concluído</button>` : ""}
        ${b.status !== "faltou" ? `<button data-st="faltou" data-id="${b.id}">Faltou</button>` : ""}
        ${b.status !== "cancelado" ? `<button data-st="cancelado" data-id="${b.id}">Cancelar</button>` : `<button data-st="confirmado" data-id="${b.id}">Reativar</button>`}
      </div>
      <details class="appt-ficha"${fichas[telKey(b.tel)] ? " open" : ""}>
        <summary>Ficha técnica do cliente</summary>
        <textarea data-ficha="${telKey(b.tel)}" placeholder="Ex.: low fade 0 → 1,5 · topo tesoura 4 cm · risco lado esq.">${esc(fichas[telKey(b.tel)] || "")}</textarea>
      </details>
    </article>`;
}

function render() {
  $("#quem").textContent = `Olá, ${eu.nome}`;
  $("#titulo").textContent = escopo === "eu" ? "Minha agenda" : "Agenda da equipe";
  $$("#escopo .chip").forEach((c) => { const on = c.dataset.escopo === escopo; c.classList.toggle("is-active", on); c.setAttribute("aria-pressed", on); });
  renderDias();
  const d = parseYmd(dia), h = HORARIOS[d.getDay()];
  const doDia = meus(getBookings().filter((b) => b.data === dia));
  const ativos = doDia.filter(ativo);
  const fichas = getFichas();
  $("#stats").innerHTML = `
    <div class="stat"><strong>${ativos.length}</strong><span>clientes ${dia === ymd(new Date()) ? "hoje" : "no dia"}</span></div>
    <div class="stat"><strong>${brl(ativos.reduce((a, b) => a + b.preco, 0))}</strong><span>previsto</span></div>
    <div class="stat"><strong>${brl(doDia.filter((b) => b.status === "concluido").reduce((a, b) => a + b.preco, 0))}</strong><span>já recebido</span></div>`;
  // próximo cliente (só no dia de hoje)
  const prox = dia === ymd(new Date()) && ativos.filter((b) => b.status === "confirmado" && !jaPassou(b)).sort((a, b) => a.inicio - b.inicio)[0];
  const pc = $("#proximo");
  pc.hidden = !prox;
  if (prox) pc.innerHTML = `<span class="eyebrow">Próximo cliente</span><strong>${fromMin(prox.inicio)} · ${esc(prox.nome)}</strong>
    <span class="muted">${prox.servicos.map((id) => esc(servById[id]?.nome || id)).join(" + ")}${escopo === "equipe" ? ` · com ${esc(barberById[prox.barbeiro].nome)}` : ""}</span>`;
  const barbs = escopo === "eu" ? [eu] : BARBEIROS;
  $("#cols").innerHTML = barbs.map((barb) => `
    <section class="col"><h3>${escopo === "eu" ? dataLonga(dia) : esc(barb.nome)}</h3>
      ${linhaDoTempo(barb, doDia.filter((b) => b.barbeiro === barb.id), h, fichas)}
    </section>`).join("");
}

document.addEventListener("click", (e) => {
  const t = e.target.closest("button"); if (!t) return;
  if (t.dataset.dia) { dia = t.dataset.dia; render(); }
  else if (t.dataset.escopo) { escopo = t.dataset.escopo; render(); }
  else if (t.dataset.st) { atualizarAgendamento(t.dataset.id, { status: t.dataset.st }); render(); }
  else if (t.id === "sair") { sairBarbeiro(); location.href = "entrar.html?perfil=barbeiro"; }
});
document.addEventListener("change", (e) => {
  if (e.target.dataset.ficha !== undefined) { const f = getFichas(); f[e.target.dataset.ficha] = e.target.value; store.set(FICHA_KEY, f); }
});
// outra aba marcou horário? atualiza sozinho
addEventListener("storage", (e) => { if (e.key === STORE_KEY) render(); });
if (eu) render();
