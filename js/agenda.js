/* Perfil do barbeiro: vê na hora quem marcou em cada horário (banco online + tempo real) */
const STATUS = { confirmado: "Confirmado", concluido: "Concluído", faltou: "Faltou", cancelado: "Cancelado" };
let eu = null, escopo = "eu", dia = ymd(new Date());
let semana = [];            // agendamentos de ontem até +14 dias
let fichas = {};

const ehNovo = (b) => b.criadoEm && Date.now() - new Date(b.criadoEm).getTime() < 24 * 3600e3;
const meus = (lista) => (escopo === "eu" ? lista.filter((b) => b.barbeiro === eu.id) : lista);
const servNomes = (b) => b.servicos.map((id) => esc(servById[id]?.nome || id)).join(" + ");

async function carregar() {
  const base = new Date(); base.setHours(0, 0, 0, 0);
  const de = new Date(base); de.setDate(base.getDate() - 1);
  const ate = new Date(base); ate.setDate(base.getDate() + 14);
  const sel = parseYmd(dia);
  const ini = ymd(sel < de ? sel : de), fim = ymd(sel > ate ? sel : ate);
  semana = await agendamentosEntre(ini, fim);
  fichas = await lerFichas(semana.map((b) => b.tel));
}

function renderDias() {
  const todos = semana.filter(ativo);
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

function cartao(b) {
  const passou = jaPassou(b);
  return `
    <article class="appt st-${b.status}${passou ? " is-past" : ""}" id="ag-${b.id}">
      <div class="appt-head"><span class="appt-time">${fromMin(b.inicio)}–${fromMin(b.fim)}</span><span>${brl(b.preco)}</span></div>
      <div class="appt-client"><strong>${esc(b.nome)}</strong>${ehNovo(b) ? ' <span class="new-badge">novo</span>' : ""}${escopo === "equipe" ? ` <span class="muted">· ${esc(barberById[b.barbeiro]?.nome || "")}</span>` : ""}</div>
      <div class="muted">${servNomes(b)}${b.cabelo ? ` · cabelo ${esc(b.cabelo)}` : ""}</div>
      ${b.obs ? `<div class="appt-obs">“${esc(b.obs)}”</div>` : ""}
      <div class="appt-actions">
        ${b.tel ? `<a href="https://wa.me/55${telKey(b.tel)}?text=${encodeURIComponent(`Olá ${b.nome.split(" ")[0]}! Aqui é da barbearia, sobre seu horário ${dataLonga(b.data)} às ${fromMin(b.inicio)}.`)}" target="_blank" rel="noopener" class="wa">WhatsApp</a>` : ""}
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

function linhaDoTempo(lista, h) {
  if (!h) return `<p class="empty">Fechado neste dia.</p>`;
  const abre = toMin(h[0]), fecha = toMin(h[1]);
  const ativos = lista.filter(ativo).sort((a, b) => a.inicio - b.inicio);
  const out = []; let t = abre;
  const livre = (de, ate) => { if (ate - de >= 15) out.push(`<div class="tl-free"><span>${fromMin(de)}</span>Livre até ${fromMin(ate)}</div>`); };
  for (const b of ativos) { if (b.inicio > t) livre(t, b.inicio); out.push(cartao(b)); t = Math.max(t, b.fim); }
  if (fecha > t) livre(t, fecha);
  const canc = lista.filter((b) => !ativo(b));
  if (canc.length) out.push(`<details class="tl-canc"><summary>${canc.length} cancelado${canc.length > 1 ? "s" : ""}</summary>${canc.map(cartao).join("")}</details>`);
  return out.join("");
}

function render() {
  $("#quem").textContent = `Olá, ${eu.nome}`;
  $("#titulo").textContent = escopo === "eu" ? "Minha agenda" : "Agenda da equipe";
  $$("#escopo .chip").forEach((c) => { const on = c.dataset.escopo === escopo; c.classList.toggle("is-active", on); c.setAttribute("aria-pressed", on); });
  renderDias();
  const d = parseYmd(dia), h = HORARIOS[d.getDay()];
  const doDia = meus(semana.filter((b) => b.data === dia));
  const ativos = doDia.filter(ativo);
  $("#stats").innerHTML = `
    <div class="stat"><strong>${ativos.length}</strong><span>clientes ${dia === ymd(new Date()) ? "hoje" : "no dia"}</span></div>
    <div class="stat"><strong>${brl(ativos.reduce((a, b) => a + b.preco, 0))}</strong><span>previsto</span></div>
    <div class="stat"><strong>${brl(doDia.filter((b) => b.status === "concluido").reduce((a, b) => a + b.preco, 0))}</strong><span>já recebido</span></div>`;
  const prox = dia === ymd(new Date()) && ativos.filter((b) => b.status === "confirmado" && !jaPassou(b)).sort((a, b) => a.inicio - b.inicio)[0];
  const pc = $("#proximo"); pc.hidden = !prox;
  if (prox) pc.innerHTML = `<span class="eyebrow">Próximo cliente</span><strong>${fromMin(prox.inicio)} · ${esc(prox.nome)}</strong><span class="muted">${servNomes(prox)}${escopo === "equipe" ? ` · com ${esc(barberById[prox.barbeiro].nome)}` : ""}</span>`;
  const barbs = escopo === "eu" ? [eu] : BARBEIROS;
  $("#cols").innerHTML = barbs.map((barb) => `<section class="col"><h3>${escopo === "eu" ? dataLonga(dia) : esc(barb.nome)}</h3>${linhaDoTempo(doDia.filter((b) => b.barbeiro === barb.id), h)}</section>`).join("");
}

/* aviso quando chega agendamento novo */
function avisoNovo(b) {
  const t = document.createElement("div");
  t.className = "toast"; t.setAttribute("role", "status");
  t.innerHTML = `<strong>Novo agendamento!</strong><span>${esc(b.nome)} · ${dataLonga(b.data)} às ${fromMin(b.inicio)}${escopo === "equipe" ? ` · ${esc(barberById[b.barbeiro]?.nome || "")}` : ""}</span>`;
  t.addEventListener("click", () => { dia = b.data; render(); t.remove(); });
  document.body.appendChild(t);
  setTimeout(() => t.classList.add("is-on"), 20);
  setTimeout(() => { t.classList.remove("is-on"); setTimeout(() => t.remove(), 400); }, 7000);
  if (navigator.vibrate) try { navigator.vibrate([60, 40, 60]); } catch {}
  if ("Notification" in window && Notification.permission === "granted") try { new Notification("Novo agendamento", { body: `${b.nome} · ${dataLonga(b.data)} às ${fromMin(b.inicio)}`, icon: "img/icon-192.png" }); } catch {}
}

document.addEventListener("click", async (e) => {
  const t = e.target.closest("button"); if (!t) return;
  if (t.dataset.dia) { dia = t.dataset.dia; if (!semana.some((b) => b.data === dia)) { await carregar(); } render(); }
  else if (t.dataset.escopo) { escopo = t.dataset.escopo; render(); }
  else if (t.dataset.st) {
    t.disabled = true;
    try { await mudarStatus(t.dataset.id, t.dataset.st); const b = semana.find((x) => x.id === t.dataset.id); if (b) b.status = t.dataset.st; render(); }
    catch { t.disabled = false; alert("Não foi possível salvar. Verifique a internet."); }
  }
  else if (t.id === "sair") { await sair(); location.href = "entrar.html?perfil=barbeiro"; }
  else if (t.id === "notif" && "Notification" in window) { await Notification.requestPermission(); t.remove(); }
});
document.addEventListener("change", async (e) => {
  if (e.target.dataset.ficha === undefined) return;
  const id = e.target.dataset.ficha, texto = e.target.value;
  try { await salvarFicha(id, texto); fichas[id] = texto; e.target.classList.add("is-saved"); setTimeout(() => e.target.classList.remove("is-saved"), 1200); }
  catch { alert("Não foi possível salvar a ficha."); }
});

(async function iniciar() {
  await carregarSessao();
  eu = barbeiroLogado();
  if (!eu) return location.replace("entrar.html?perfil=barbeiro");
  await carregar(); render();
  if ("Notification" in window && Notification.permission === "default")
    $("#escopo").insertAdjacentHTML("afterend", `<button class="chip" id="notif">🔔 Avisar no celular</button>`);
  // tempo real: o que o cliente marcar aparece aqui sozinho
  ouvirAgendamentos(async (p) => {
    const novo = p.eventType === "INSERT" ? p.new : null;
    await carregar(); render();
    if (novo && (escopo === "equipe" || novo.barbeiro_id === eu.id)) avisoNovo({ nome: novo.nome, data: novo.data, inicio: novo.inicio, barbeiro: novo.barbeiro_id });
  });
  // garante atualização ao voltar para o app
  document.addEventListener("visibilitychange", async () => { if (!document.hidden) { await carregar(); render(); } });
})();
