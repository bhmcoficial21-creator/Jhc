/* Perfil do cliente: próximos horários, cancelar, corte salvo e histórico */
let cliente = usuarioAtual();
if (!cliente) location.replace("entrar.html?volta=perfil");

const ROTULO = { confirmado: "Confirmado", concluido: "Concluído", faltou: "Não compareceu", cancelado: "Cancelado" };
const servNomes = (b) => b.servicos.map((id) => servById[id]?.nome || id).join(" + ");

function cartaoAg(b, futuro) {
  return `
    <article class="pf-appt st-${b.status}">
      <div class="pf-date"><span>${DIAS_CURTO[parseYmd(b.data).getDay()]}</span><strong>${parseYmd(b.data).getDate()}</strong><span>${MESES[parseYmd(b.data).getMonth()]}</span></div>
      <div class="pf-info">
        <strong>${fromMin(b.inicio)} · ${esc(servNomes(b))}</strong>
        <span class="muted">com ${esc(barberById[b.barbeiro]?.nome || "")} · ${brl(b.preco)} · ${ROTULO[b.status]}</span>
        ${futuro && b.status === "confirmado" ? `<div class="pf-actions">
          <button data-ics="${b.id}">Adicionar ao calendário</button>
          <button data-cancelar="${b.id}" class="danger">Cancelar</button>
        </div>` : ""}
        ${!futuro ? `<div class="pf-actions"><button data-repetir="${b.id}">Agendar de novo</button></div>` : ""}
      </div>
    </article>`;
}

function render() {
  cliente = usuarioAtual();
  const plano = cliente.plano && PLANOS.find((p) => p.id === cliente.plano.id);
  const meus = agendamentosDoCliente(cliente);
  const futuros = meus.filter((b) => !jaPassou(b) && b.status !== "cancelado");
  const passados = meus.filter((b) => jaPassou(b) || b.status === "cancelado").reverse();
  const feitos = meus.filter((b) => b.status === "concluido").length;
  $("#cartao").innerHTML = `
    <div class="pf-avatar">${esc(cliente.nome[0])}</div>
    <div>
      <h1 class="app-title">${esc(cliente.nome)}</h1>
      <p class="muted">${esc(cliente.tel)} · ${esc(cliente.email)}</p>
      <div class="pf-tags">
        ${plano ? `<span class="plan-badge">${esc(plano.nome)}${cliente.plano.status === "pendente" ? " · pendente" : ""}</span>` : `<a class="plan-badge" href="index.html#planos">Conhecer os planos</a>`}
        <span class="pf-tag">${feitos} corte${feitos === 1 ? "" : "s"} na casa</span>
        ${cliente.cabelo ? `<span class="pf-tag">Cabelo ${esc(cliente.cabelo)}</span>` : ""}
      </div>
    </div>`;
  $("#proximos").innerHTML = futuros.length ? futuros.map((b) => cartaoAg(b, true)).join("")
    : `<p class="empty">Nenhum horário marcado. <a href="index.html#agendar">Agendar agora →</a></p>`;
  $("#historico").innerHTML = passados.length ? passados.map((b) => cartaoAg(b, false)).join("") : `<p class="empty">Seu histórico aparece aqui depois do primeiro corte.</p>`;
  const ficha = getFichas()[telKey(cliente.tel)];
  const ult = cliente.ultimo;
  $("#ficha").innerHTML = `
    ${ficha ? `<p class="ficha-txt">${esc(ficha)}</p><p class="muted">Anotado pelo seu barbeiro: pente, altura e detalhes do seu corte.</p>`
            : `<p class="muted">Depois do seu primeiro corte, o barbeiro anota aqui o pente, a altura e os detalhes para repetir igualzinho.</p>`}
    ${ult ? `<button class="btn btn-primary btn-sm" data-ultimo>↻ Repetir meu último corte</button>` : ""}`;
}

function irAgendar(servicos, barbeiro) {
  try { sessionStorage.setItem(PENDENTE_KEY, JSON.stringify({ servicos, barbeiro: barbeiro || "any", cabelo: cliente.cabelo || "", data: "", hora: null, obs: "" })); } catch {}
  location.href = "index.html#agendar";
}

function ics(b) {
  const stamp = (min) => `${b.data.replace(/-/g, "")}T${fromMin(min).replace(":", "")}00`;
  const txt = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Messin do Corte//Agenda//PT-BR", "BEGIN:VEVENT", `UID:${b.id}@barbearia`,
    `DTSTART:${stamp(b.inicio)}`, `DTEND:${stamp(b.fim)}`, `SUMMARY:Barbearia – ${servNomes(b)}`, `LOCATION:${SHOP.endereco}`,
    "BEGIN:VALARM", "TRIGGER:-PT2H", "ACTION:DISPLAY", "DESCRIPTION:Seu horário na barbearia", "END:VALARM", "END:VEVENT", "END:VCALENDAR"].join("\r\n");
  const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([txt], { type: "text/calendar" })); a.download = "horario-barbearia.ics"; a.click();
}

document.addEventListener("click", (e) => {
  const t = e.target.closest("button"); if (!t) return;
  const ag = (id) => getBookings().find((b) => b.id === id);
  if (t.dataset.cancelar) {
    const b = ag(t.dataset.cancelar);
    if (b && confirm(`Cancelar o horário de ${dataLonga(b.data)} às ${fromMin(b.inicio)}?`)) { atualizarAgendamento(b.id, { status: "cancelado", canceladoPeloCliente: true }); render(); }
  }
  else if (t.dataset.ics) ics(ag(t.dataset.ics));
  else if (t.dataset.repetir) { const b = ag(t.dataset.repetir); irAgendar(b.servicos, b.barbeiro); }
  else if ("ultimo" in t.dataset) irAgendar(cliente.ultimo.servicos, cliente.ultimo.barbeiro);
  else if (t.id === "sair") { sair(); location.href = "index.html"; }
});
addEventListener("storage", (e) => { if (e.key === STORE_KEY || e.key === FICHA_KEY) render(); });
if (cliente) render();
