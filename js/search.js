/* Barra de pesquisa (Ctrl+K ou /): serviços, estilos, barbeiros, planos e seções */
(function () {
  const dlg = $("#searchDialog"), input = $("#searchInput"), list = $("#searchList");
  if (!dlg) return;

  const ICON = {
    tesoura: '<circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M8.1 8.1 20 20M8.1 15.9 20 4"/>',
    estilo:  '<path d="M12 3c4 0 7 3 7 7 0 5-7 11-7 11S5 15 5 10c0-4 3-7 7-7Z"/><circle cx="12" cy="10" r="2.5"/>',
    pessoa:  '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-6 8-6s8 2 8 6"/>',
    estrela: '<path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9Z"/>',
    seta:    '<path d="M5 12h14M13 6l6 6-6 6"/>',
    relogio: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  };
  const norm = (t) => String(t).normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

  const irPara = (sel) => $(sel)?.scrollIntoView({ behavior: "smooth" });
  const agendarServico = (id) => { state.servicos.add(id); state.step = 1; renderWizard(); irPara("#agendar"); };

  // Índice de tudo que pode ser encontrado
  const itens = [
    { grupo: "Atalhos", icon: "relogio", titulo: "Agendar horário", meta: "", chaves: "agendar marcar horario agenda", acao: () => irPara("#agendar") },
    { grupo: "Atalhos", icon: "seta", titulo: "Tabela de preços", meta: "", chaves: "precos valores tabela quanto custa", acao: () => irPara("#servicos") },
    { grupo: "Atalhos", icon: "seta", titulo: "Planos e Clube", meta: "", chaves: "planos clube assinatura mensal", acao: () => irPara("#planos") },
    { grupo: "Atalhos", icon: "seta", titulo: "Horários e endereço", meta: "Ter a Sáb", chaves: "horario funcionamento endereco local onde mapa aberto", acao: () => irPara("#horarios") },
    { grupo: "Atalhos", icon: "pessoa", titulo: "Entrar ou criar conta", meta: "", chaves: "login entrar conta cadastro cadastrar senha", acao: () => (location.href = "entrar.html") },
    ...SERVICOS.map((s) => ({ grupo: "Serviços", icon: "tesoura", titulo: s.nome, meta: `${brl(s.preco)} · ${dur(s.dur)}`,
      chaves: `${s.nome} ${s.desc} ${CATEGORIAS[s.cat]}`, acao: () => agendarServico(s.id) })),
    ...ESTILOS.map((e) => ({ grupo: "Estilos", icon: "estilo", titulo: e.nome, meta: e.grupo,
      chaves: `${e.nome} ${e.desc} ${e.grupo} ${e.tipos.join(" ")}`, acao: () => agendarServico(e.servico) })),
    ...BARBEIROS.map((b) => ({ grupo: "Barbeiros", icon: "pessoa", titulo: b.nome, meta: b.esp.slice(0, 2).join(" · "),
      chaves: `${b.nome} barbeiro ${b.esp.join(" ")}`,
      acao: () => { state.barbeiro = b.id; state.step = state.servicos.size ? 3 : 1; renderWizard(); irPara("#agendar"); } })),
    ...PLANOS.map((p) => ({ grupo: "Planos", icon: "estrela", titulo: p.nome, meta: `${brl(p.preco)} ${p.sufixo}`,
      chaves: `${p.nome} plano clube ${p.desc} ${p.itens.join(" ")}`, acao: () => irPara("#planos") })),
  ].map((it) => ({ ...it, busca: norm(`${it.titulo} ${it.chaves}`) }));

  let resultados = [], ativo = 0;

  function buscar(q) {
    const termos = norm(q).trim().split(/\s+/).filter(Boolean);
    if (!termos.length) return itens.filter((i) => i.grupo === "Atalhos");
    return itens
      .map((it) => {
        if (!termos.every((t) => it.busca.includes(t))) return null;
        const tit = norm(it.titulo);
        const pontos = termos.reduce((a, t) => a + (tit.startsWith(t) ? 3 : tit.includes(t) ? 2 : 1), 0);
        return { it, pontos };
      })
      .filter(Boolean)
      .sort((a, b) => b.pontos - a.pontos)
      .slice(0, 12)
      // agrupa por tipo, mantendo primeiro o grupo do melhor resultado
      .map((r, i, arr) => ({ ...r, ordem: arr.findIndex((x) => x.it.grupo === r.it.grupo) }))
      .sort((a, b) => a.ordem - b.ordem || b.pontos - a.pontos)
      .map((r) => r.it);
  }

  function render() {
    resultados = buscar(input.value);
    ativo = Math.min(ativo, Math.max(0, resultados.length - 1));
    if (!resultados.length) {
      list.innerHTML = `<p class="search-empty">Nada encontrado para “${esc(input.value)}”. Tente “degradê”, “barba” ou “twist”.</p>`;
      input.removeAttribute("aria-activedescendant"); return;
    }
    let grupo = "";
    list.innerHTML = resultados.map((it, i) => {
      const cab = it.grupo !== grupo ? `<p class="search-group">${(grupo = it.grupo)}</p>` : "";
      return `${cab}<button type="button" class="value${i === ativo ? " is-active" : ""}" id="sr-${i}" role="option" aria-selected="${i === ativo}" data-i="${i}" tabindex="-1">
        <svg viewBox="0 0 24 24" aria-hidden="true">${ICON[it.icon]}</svg>
        <span class="value-title">${esc(it.titulo)}</span>
        ${it.meta ? `<span class="value-meta">${esc(it.meta)}</span>` : ""}
      </button>`;
    }).join("");
    input.setAttribute("aria-activedescendant", `sr-${ativo}`);
  }

  function marcar(i) {
    ativo = (i + resultados.length) % resultados.length;
    $$(".value", list).forEach((el) => {
      const on = +el.dataset.i === ativo;
      el.classList.toggle("is-active", on); el.setAttribute("aria-selected", on);
      if (on) el.scrollIntoView({ block: "nearest" });
    });
    input.setAttribute("aria-activedescendant", `sr-${ativo}`);
  }

  function abrir() {
    if (dlg.open) return;
    input.value = ""; ativo = 0; render();
    dlg.showModal(); input.focus();
  }
  function escolher(i) {
    const it = resultados[i]; if (!it) return;
    dlg.close(); setTimeout(it.acao, 60);
  }

  if (/Mac|iPhone|iPad/.test(navigator.platform)) { const k = $("#searchBtn kbd"); if (k) k.textContent = "⌘ K"; }
  $("#searchBtn").addEventListener("click", abrir);
  input.addEventListener("input", () => { ativo = 0; render(); });
  input.addEventListener("keydown", (e) => {
    if (e.key === "ArrowDown") { e.preventDefault(); marcar(ativo + 1); }
    else if (e.key === "ArrowUp") { e.preventDefault(); marcar(ativo - 1); }
    else if (e.key === "Enter") { e.preventDefault(); escolher(ativo); }
  });
  list.addEventListener("click", (e) => { const b = e.target.closest("[data-i]"); if (b) escolher(+b.dataset.i); });
  list.addEventListener("mousemove", (e) => { const b = e.target.closest("[data-i]"); if (b && +b.dataset.i !== ativo) marcar(+b.dataset.i); });
  dlg.addEventListener("click", (e) => { if (e.target === dlg) dlg.close(); }); // clique fora fecha

  document.addEventListener("keydown", (e) => {
    const digitando = /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement?.tagName);
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") { e.preventDefault(); abrir(); }
    else if (e.key === "/" && !digitando && !dlg.open) { e.preventDefault(); abrir(); }
  });
})();
