const FICHA_KEY = "barbeskin:fichas";
const getFichas = () => store.get(FICHA_KEY, {});
const telKey = (t) => String(t).replace(/\D/g, "");
const inp = $("#dia");
inp.value = ymd(new Date());

const STATUS = { confirmado: "Confirmado", concluido: "Concluído", faltou: "Faltou", cancelado: "Cancelado" };

function render() {
  const data = inp.value; const dia = parseYmd(data);
  const h = HORARIOS[dia.getDay()];
  $("#diaLabel").textContent = `${DIAS[dia.getDay()]}${h ? ` · ${h[0]}–${h[1]}` : " · fechado"}`;
  const all = getBookings().filter((b) => b.data === data).sort((a, b) => a.inicio - b.inicio);
  const ativos = all.filter(ativo);
  const fichas = getFichas();
  const aberto = h ? (toMin(h[1]) - toMin(h[0])) * BARBEIROS.length : 0;
  const ocupado = ativos.reduce((a, b) => a + (b.fim - b.inicio), 0);
  $("#stats").innerHTML = `
    <div class="stat"><strong>${ativos.length}</strong><span>atendimentos</span></div>
    <div class="stat"><strong>${brl(ativos.reduce((a, b) => a + b.preco, 0))}</strong><span>faturamento previsto</span></div>
    <div class="stat"><strong>${brl(all.filter((b) => b.status === "concluido").reduce((a, b) => a + b.preco, 0))}</strong><span>já recebido</span></div>
    <div class="stat"><strong>${aberto ? Math.round((ocupado / aberto) * 100) : 0}%</strong><span>agenda ocupada</span></div>`;
  $("#cols").innerHTML = BARBEIROS.map((barb) => {
    const lista = all.filter((b) => b.barbeiro === barb.id);
    return `<section class="col"><h3>${esc(barb.nome)}</h3>${lista.length ? lista.map((b) => `
      <article class="appt st-${b.status}">
        <div class="appt-head"><span>${fromMin(b.inicio)}–${fromMin(b.fim)}</span><span>${brl(b.preco)}</span></div>
        <div><strong>${esc(b.nome)}</strong> · <a href="https://wa.me/55${telKey(b.tel)}" target="_blank" rel="noopener">${esc(b.tel)}</a></div>
        <div class="muted">${b.servicos.map((id) => esc(servById[id]?.nome || id)).join(" + ")}${b.cabelo ? ` · cabelo ${esc(b.cabelo)}` : ""}</div>
        ${b.obs ? `<div>“${esc(b.obs)}”</div>` : ""}
        <div class="muted">Status: ${STATUS[b.status]}</div>
        <label class="muted" style="font-size:.75rem">Ficha técnica do cliente (pente, altura, detalhes)
          <textarea data-ficha="${telKey(b.tel)}" placeholder="Ex.: low fade 0 → 1,5 · topo tesoura 4 cm · risco lado esq.">${esc(fichas[telKey(b.tel)] || "")}</textarea>
        </label>
        <div class="appt-actions">
          ${b.status !== "concluido" ? `<button data-st="concluido" data-id="${b.id}">✓ Concluído</button>` : ""}
          ${b.status !== "faltou" ? `<button data-st="faltou" data-id="${b.id}">Faltou</button>` : ""}
          ${b.status !== "cancelado" ? `<button data-st="cancelado" data-id="${b.id}">Cancelar</button>` : `<button data-st="confirmado" data-id="${b.id}">Reativar</button>`}
        </div>
      </article>`).join("") : `<p class="empty">Sem horários marcados.</p>`}</section>`;
  }).join("");
}

document.addEventListener("click", (e) => {
  const t = e.target.closest("button"); if (!t) return;
  if (t.dataset.shift) { const d = parseYmd(inp.value); d.setDate(d.getDate() + +t.dataset.shift); inp.value = ymd(d); render(); }
  else if ("hoje" in t.dataset) { inp.value = ymd(new Date()); render(); }
  else if (t.dataset.st) {
    const all = getBookings(); const b = all.find((x) => x.id === t.dataset.id);
    if (b) { b.status = t.dataset.st; saveBookings(all); render(); }
  }
});
document.addEventListener("change", (e) => {
  if (e.target.dataset.ficha !== undefined) {
    const f = getFichas(); f[e.target.dataset.ficha] = e.target.value; store.set(FICHA_KEY, f);
  }
});
inp.addEventListener("change", render);
render();
