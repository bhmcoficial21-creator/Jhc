/* "Meus horários": sem cadastro. O celular guarda a chave de cada horário marcado. */
let meus = [];
const ROTULO = { confirmado: "Confirmado", concluido: "Concluído", faltou: "Não compareceu", cancelado: "Cancelado" };
const servNomes = (b) => b.servicos.map((id) => servById[id]?.nome || id).join(" + ");

function cartaoAg(b, futuro) {
  const d = parseYmd(b.data);
  return `
    <article class="pf-appt st-${b.status}">
      <div class="pf-date"><span>${DIAS_CURTO[d.getDay()]}</span><strong>${d.getDate()}</strong><span>${MESES[d.getMonth()]}</span></div>
      <div class="pf-info">
        <strong>${fromMin(b.inicio)} · ${esc(servNomes(b))}</strong>
        <span class="muted">com ${esc(barberById[b.barbeiro]?.nome || "")} · ${brl(b.preco)} · ${ROTULO[b.status]}</span>
        ${futuro && b.status === "confirmado" ? `<div class="pf-actions"><button data-ics="${b.id}">Adicionar ao calendário</button><button data-cancelar="${b.id}" class="danger">Cancelar</button></div>` : ""}
        ${!futuro ? `<div class="pf-actions"><button data-repetir="${b.id}">Agendar de novo</button></div>` : ""}
      </div>
    </article>`;
}

function render() {
  const eu = meusDados();
  const futuros = meus.filter((b) => !jaPassou(b) && b.status !== "cancelado");
  const passados = meus.filter((b) => jaPassou(b) || b.status === "cancelado").reverse();
  const feitos = meus.filter((b) => b.status === "concluido").length;
  $("#cartao").innerHTML = `
    <div class="pf-avatar">${esc((eu.nome || "✂")[0])}</div>
    <div>
      <h1 class="app-title">${eu.nome ? esc(eu.nome.split(" ")[0]) : "Meus horários"}</h1>
      <p class="muted">${eu.tel ? esc(eu.tel) + " · " : ""}salvo neste celular, sem cadastro</p>
      <div class="pf-tags"><span class="pf-tag">${feitos} corte${feitos === 1 ? "" : "s"} na casa</span>${eu.cabelo ? `<span class="pf-tag">Cabelo ${esc(eu.cabelo)}</span>` : ""}</div>
    </div>`;
  $("#proximos").innerHTML = futuros.length ? futuros.map((b) => cartaoAg(b, true)).join("") : `<p class="empty">Nenhum horário marcado. <a href="index.html#agendar">Agendar agora →</a></p>`;
  $("#historico").innerHTML = passados.length ? passados.map((b) => cartaoAg(b, false)).join("") : `<p class="empty">Seu histórico aparece aqui depois do primeiro corte.</p>`;
  const ult = meus.filter((b) => b.status !== "cancelado").pop();
  $("#ficha").innerHTML = `
    <p class="muted">O barbeiro anota o pente, a altura e os detalhes do seu corte na ficha dele, para repetir igualzinho na próxima.</p>
    ${ult ? `<button class="btn btn-primary btn-sm" data-repetir="${ult.id}">↻ Repetir meu último corte</button>` : ""}`;
}

function irAgendar(servicos, barbeiro) {
  try { sessionStorage.setItem(PENDENTE_KEY, JSON.stringify({ servicos, barbeiro: barbeiro || "any", cabelo: meusDados().cabelo || "", data: "", hora: null, obs: "" })); } catch {}
  location.href = "index.html#agendar";
}
function ics(b) {
  const stamp = (min) => `${b.data.replace(/-/g, "")}T${fromMin(min).replace(":", "")}00`;
  const txt = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Messin do Corte//Agenda//PT-BR", "BEGIN:VEVENT", `UID:${b.id}@barbearia`,
    `DTSTART:${stamp(b.inicio)}`, `DTEND:${stamp(b.fim)}`, `SUMMARY:Barbearia – ${servNomes(b)}`, `LOCATION:${SHOP.endereco}`,
    "BEGIN:VALARM", "TRIGGER:-PT2H", "ACTION:DISPLAY", "DESCRIPTION:Seu horário na barbearia", "END:VALARM", "END:VEVENT", "END:VCALENDAR"].join("\r\n");
  const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([txt], { type: "text/calendar" })); a.download = "horario-barbearia.ics"; a.click();
}

document.addEventListener("click", async (e) => {
  const t = e.target.closest("button"); if (!t) return;
  const ag = (id) => meus.find((b) => b.id === id);
  if (t.dataset.cancelar) {
    const b = ag(t.dataset.cancelar);
    if (b && confirm(`Cancelar o horário de ${dataLonga(b.data)} às ${fromMin(b.inicio)}?`)) {
      t.disabled = true;
      try { if (await cancelarMeuHorario(b.id)) { b.status = "cancelado"; render(); } else throw 0; }
      catch { t.disabled = false; alert("Não foi possível cancelar agora."); }
    }
  }
  else if (t.dataset.ics) ics(ag(t.dataset.ics));
  else if (t.dataset.repetir) { const b = ag(t.dataset.repetir); irAgendar(b.servicos, b.barbeiro); }
});

(async function iniciar() {
  render();
  try { meus = await meusAgendamentos(); } catch { $("#proximos").innerHTML = `<p class="empty">Não foi possível carregar agora. Verifique a internet.</p>`; return; }
  render();
  ouvirAgendamentos(async () => { try { meus = await meusAgendamentos(); render(); } catch {} });
})();
