/* JSD™ — aplicação: rotas, coleção, filtros, sacola e páginas. Dados e textos vêm de config.js. */
(function () {
  "use strict";
  const CFG = window.JSD_CONFIG, PH = window.JSDPlaceholders;
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const main = $("#main");
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const money = n => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  const pix = n => Math.round(n * (1 - CFG.store.pixDiscount) * 100) / 100;
  const byId = id => CFG.products.find(p => p.id === id);
  const ig = CFG.brand.instagram;
  const wa = (text) => `https://wa.me/${CFG.contact.whatsapp}${text ? "?text=" + encodeURIComponent(text) : ""}`;
  const scrollOpts = { behavior: reduce ? "auto" : "smooth" };

  /* ---------- sacola (localStorage) ---------- */
  let cart = [];
  try { cart = JSON.parse(localStorage.getItem("jsd-cart") || "[]").filter(i => byId(i.id)); } catch (e) { cart = []; }
  const saveCart = () => { try { localStorage.setItem("jsd-cart", JSON.stringify(cart)); } catch (e) { /* sem storage */ } };
  const cartCount = () => cart.reduce((s, i) => s + i.qty, 0);
  const cartTotal = () => cart.reduce((s, i) => s + byId(i.id).price * i.qty, 0);
  function updateBag() {
    const n = cartCount(), el = $("#bagCount");
    el.textContent = `(${n})`;
    $("#bagBtn").setAttribute("aria-label", `Abrir sacola, ${n} ${n === 1 ? "item" : "itens"}`);
  }
  function addToCart(id, size, qty = 1) {
    const f = cart.find(i => i.id === id && i.size === size);
    if (f) f.qty += qty; else cart.push({ id, size, qty });
    saveCart(); updateBag(); toast(`${byId(id).name} (${size}) foi para a sacola.`);
  }

  /* ---------- toast ---------- */
  let tt;
  function toast(msg) {
    const t = $("#toast"); t.textContent = msg; t.classList.add("is-on");
    clearTimeout(tt); tt = setTimeout(() => t.classList.remove("is-on"), 2600);
  }

  /* ---------- imagens dos produtos ---------- */
  const VIEWS = ["vista frontal", "vista de costas", "detalhe do tecido"];
  function imgs(p) {
    if (p.images && p.images.length) return p.images.map((im, i) => typeof im === "string" ? { src: im, alt: `${p.name}, ${VIEWS[i] || "foto " + (i + 1)}` } : im);
    return ["front", "back", "detail"].map((v, i) => ({ src: PH.jersey(p, v), alt: `${p.name}, ${VIEWS[i]} (imagem provisória)` }));
  }
  const badgeCls = b => b === "Novo" ? "new" : b === "Esgotado" ? "out" : "ltd";
  const isOut = p => p.badge === "Esgotado" || p.sizes.every(s => p.unavailable.includes(s));

  /* ---------- cabeçalho, aviso, menu ---------- */
  function initChrome() {
    const a = CFG.store.announcements, el = $("#announceText"); let i = 0;
    el.textContent = a[0];
    if (!reduce && a.length > 1) setInterval(() => {
      el.classList.add("is-out");
      setTimeout(() => { i = (i + 1) % a.length; el.textContent = a[i]; el.classList.remove("is-out"); }, 350);
    }, 4500);
    $("#footer").innerHTML = footerHtml();
    updateBag();
    const onScroll = () => $("#header").classList.toggle("is-solid", scrollY > 40 || current !== "home");
    addEventListener("scroll", onScroll, { passive: true }); onScroll(); window.__hdr = onScroll;
    buildDrawer();
  }

  function groups() {
    const g = {};
    CFG.products.forEach(p => { (g[p.group] = g[p.group] || new Set()).add(p.team); });
    return Object.entries(g).map(([name, set]) => [name, [...set]]);
  }
  function buildDrawer() {
    const d = $("#drawer"), panel = $("#drawerPanel");
    panel.innerHTML = `
      <div class="drawer__top"><span class="drawer__ttl">Menu</span>
        <button class="icon-btn" type="button" data-close aria-label="Fechar menu"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 5l14 14M19 5L5 19" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg></button></div>
      <div class="drawer__scroll">
        <a class="drawer__big" href="#/colecao" data-preset="{}">Toda a coleção</a>
        ${groups().map(([g, teams]) => `<div class="drawer__grp"><h2>${esc(g)}</h2><ul>${teams.map(t => `<li><a href="#/colecao" data-preset='${esc(JSON.stringify({ team: t }))}'>${esc(t)}</a></li>`).join("")}</ul></div>`).join("")}
        <div class="drawer__grp"><h2>Peças</h2><ul>${CFG.menuTypes.map(t => `<li><a href="#/colecao" data-preset='${esc(JSON.stringify({ type: t }))}'>${esc(t)}s</a></li>`).join("")}</ul></div>
        <div class="drawer__grp"><h2>A JSD</h2><ul>
          <li><a href="#/sobre">Sobre a JSD™</a></li><li><a href="#/contato">Contato</a></li>
          <li><a href="https://instagram.com/${ig}" target="_blank" rel="noopener">Instagram @${ig}</a></li></ul></div>
      </div>`;
    const btn = $("#menuBtn");
    const open = () => { d.hidden = false; requestAnimationFrame(() => d.classList.add("is-open")); btn.setAttribute("aria-expanded", "true"); document.body.classList.add("no-scroll"); panel.focus(); };
    const close = (back = true) => { d.classList.remove("is-open"); btn.setAttribute("aria-expanded", "false"); document.body.classList.remove("no-scroll"); setTimeout(() => { d.hidden = true; }, 350); if (back) btn.focus(); };
    btn.addEventListener("click", open);
    d.addEventListener("click", e => {
      const a = e.target.closest("a[data-preset]");
      if (a) { Object.assign(F, { team: "", type: "", size: "", color: "" }, JSON.parse(a.dataset.preset)); shown = CFG.store.pageSize; pendingScroll = "colecao"; }
      if (e.target.closest("[data-close]") || e.target.closest("a")) close(!e.target.closest("a"));
    });
    d.addEventListener("keydown", e => {
      if (e.key === "Escape") close();
      if (e.key === "Tab") { // foco preso no menu
        const f = $$("a,button", panel).filter(x => x.offsetParent);
        const first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    });
  }

  function footerHtml() {
    return `<div class="footer__in">
      <div class="footer__brand"><p class="footer__name">JSD<sup>™</sup></p><p class="footer__tag">${esc(CFG.brand.tagline)}</p></div>
      <nav class="footer__nav" aria-label="Rodapé"><a href="#/colecao">Coleção</a><a href="#/sacola">Sacola</a><a href="#/sobre">Sobre a JSD™</a><a href="#/contato">Contato</a></nav>
      <div class="footer__soc"><a href="https://instagram.com/${ig}" target="_blank" rel="noopener">Instagram @${ig}</a><a href="${wa()}" target="_blank" rel="noopener">WhatsApp ${esc(CFG.contact.whatsappDisplay)}</a></div>
      <p class="footer__legal">© ${new Date().getFullYear()} JSD™. Todos os direitos reservados. Imagens ilustrativas.</p></div>`;
  }

  /* ---------- filtros ---------- */
  const F = { team: "", type: "", size: "", color: "" };
  let shown = CFG.store.pageSize, pendingScroll = "";
  const filtered = () => CFG.products.filter(p =>
    (!F.team || p.team === F.team) && (!F.type || p.type === F.type) &&
    (!F.size || (p.sizes.includes(F.size) && !p.unavailable.includes(F.size))) &&
    (!F.color || p.colors.some(c => c.name === F.color)));
  const uniq = (fn) => [...new Set(CFG.products.flatMap(fn))];

  const PLUS = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 2v12M2 8h12" stroke="currentColor" stroke-width="1.3" fill="none"/></svg>';
  function cardHtml(p) {
    const ims = imgs(p), im = ims[0], out = isOut(p);
    return `<article class="card rv">
      <a class="card__media" href="#/produto/${p.id}" aria-label="Ver ${esc(p.name)}">
        <img src="${im.src}" alt="${esc(im.alt)}" loading="lazy" width="600" height="800">
        ${ims[1] && p.images && p.images.length > 1 ? `<img class="card__alt" src="${ims[1].src}" alt="" loading="lazy" width="600" height="800">` : ""}
        ${p.badge ? `<span class="tag${p.badge === "Esgotado" ? " tag--out" : ""}">${esc(p.badge)}</span>` : ""}
      </a>
      <button class="card__add" type="button" data-add="${p.id}" aria-label="${out ? "Esgotado: " : "Adicionar à sacola: "}${esc(p.name)}" ${out ? "disabled" : ""}>${PLUS}</button>
      <div class="card__body">
        <h3 class="card__name"><a href="#/produto/${p.id}">${esc(p.name)}</a></h3>
        <p class="card__price">${money(p.price)}<span>${money(pix(p.price))} no Pix</span></p>
        <ul class="dots" aria-label="Cores: ${p.colors.map(c => c.name).join(", ")}">${p.colors.map(c => `<li style="--c:${c.hex}" title="${esc(c.name)}"></li>`).join("")}</ul>
      </div></article>`;
  }

  function collectionHtml() {
    const opts = (key, list) => list.map(v => `<button class="fopt" type="button" data-f="${key}" data-v="${esc(v)}" aria-pressed="false">${esc(v)}</button>`).join("");
    const colors = uniq(p => p.colors.map(c => JSON.stringify(c))).map(s => JSON.parse(s)).filter((c, i, a) => a.findIndex(x => x.name === c.name) === i);
    return `<section class="list" id="colecao" aria-labelledby="colTitle">
      <h2 class="sr" id="colTitle">${esc(CFG.copy.collectionTitle)}</h2>
      <div class="list__bar">
        <button class="textbtn" id="fOpen" type="button" aria-haspopup="dialog" aria-controls="fpanel">Filtrar <span class="fn" id="fN"></span></button>
        <div class="list__tools">
          <span class="count" id="count" role="status" aria-live="polite"></span>
          <button class="gridsw" type="button" data-cols="1" aria-pressed="false" aria-label="Uma peça por linha"><svg viewBox="0 0 18 18" aria-hidden="true"><rect x="3" y="3" width="12" height="12"/></svg></button>
          <button class="gridsw" type="button" data-cols="2" aria-pressed="true" aria-label="Duas peças por linha"><svg viewBox="0 0 18 18" aria-hidden="true"><rect x="2" y="3" width="6" height="12"/><rect x="10" y="3" width="6" height="12"/></svg></button>
        </div>
      </div>
      <div class="grid" id="grid"></div>
      <div class="more"><button class="textbtn" id="moreBtn" type="button">Ver mais</button></div>
      <div class="fpanel" id="fpanel" hidden>
        <div class="fpanel__bg" data-fx></div>
        <div class="fpanel__box" role="dialog" aria-modal="true" aria-labelledby="fT" tabindex="-1">
          <div class="fpanel__top"><h2 id="fT">Filtrar</h2><button class="icon-btn" type="button" data-fx aria-label="Fechar filtros"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 5l14 14M19 5L5 19" stroke="currentColor" stroke-width="1.4"/></svg></button></div>
          <div class="fpanel__body" id="filters">
            <fieldset class="fgroup"><legend>Time</legend>${opts("team", uniq(p => [p.team]))}</fieldset>
            <fieldset class="fgroup"><legend>Peça</legend>${opts("type", uniq(p => [p.type]))}</fieldset>
            <fieldset class="fgroup"><legend>Tamanho</legend>${opts("size", CFG.sizes)}</fieldset>
            <fieldset class="fgroup"><legend>Cor</legend>${colors.map(c => `<button class="fopt" type="button" data-f="color" data-v="${esc(c.name)}" aria-pressed="false"><i class="sw" style="--c:${c.hex}"></i>${esc(c.name)}</button>`).join("")}</fieldset>
          </div>
          <div class="fpanel__foot"><button class="btn" id="fClear" type="button">Limpar</button><button class="btn btn--primary" id="fShow" type="button" data-fx>Ver peças</button></div>
        </div>
      </div>
    </section>`;
  }

  function renderGrid() {
    const list = filtered(), part = list.slice(0, shown);
    $("#grid").innerHTML = list.length ? part.map(cardHtml).join("") :
      `<div class="empty"><p>Nenhuma peça com esses filtros.</p><button class="btn" type="button" id="emptyClear">Limpar filtros</button></div>`;
    $("#count").textContent = `${list.length} ${list.length === 1 ? "peça" : "peças"}`;
    const left = list.length - part.length, more = $("#moreBtn");
    more.hidden = left <= 0; more.textContent = `Ver mais (${left})`;
    $$("[data-f]").forEach(b => b.setAttribute("aria-pressed", String(F[b.dataset.f] === b.dataset.v)));
    const n = Object.values(F).filter(Boolean).length;
    $("#fN").textContent = n ? `(${n})` : ""; $("#fClear").disabled = !n;
    $("#fShow").textContent = list.length ? `Ver ${list.length} ${list.length === 1 ? "peça" : "peças"}` : "Sem resultados";
    observeReveal();
  }

  function bindCollection() {
    const fp = $("#fpanel"), box = $(".fpanel__box", fp), opener = $("#fOpen");
    const open = () => { fp.hidden = false; requestAnimationFrame(() => fp.classList.add("is-open")); document.body.classList.add("no-scroll"); box.focus(); };
    const close = () => { fp.classList.remove("is-open"); document.body.classList.remove("no-scroll"); setTimeout(() => { fp.hidden = true; }, 380); opener.focus({ preventScroll: true }); };
    opener.addEventListener("click", open);
    fp.addEventListener("click", e => { if (e.target.closest("[data-fx]")) close(); });
    fp.addEventListener("keydown", e => {
      if (e.key === "Escape") close();
      if (e.key === "Tab") {
        const f = $$("button:not([disabled])", box), first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    });
    $("#filters").addEventListener("click", e => {
      const b = e.target.closest("[data-f]");
      if (b) { F[b.dataset.f] = F[b.dataset.f] === b.dataset.v ? "" : b.dataset.v; shown = CFG.store.pageSize; renderGrid(); }
    });
    $("#fClear").addEventListener("click", clearFilters);
    $("#grid").addEventListener("click", e => { if (e.target.id === "emptyClear") clearFilters(); });
    $("#moreBtn").addEventListener("click", () => {
      const before = shown; shown += CFG.store.pageSize; renderGrid();
      const cards = $$(".card", $("#grid")); if (cards[before]) cards[before].querySelector("a").focus({ preventScroll: true });
    });
    $$(".gridsw").forEach(b => b.addEventListener("click", () => {
      $("#grid").classList.toggle("grid--1", b.dataset.cols === "1");
      $$(".gridsw").forEach(x => x.setAttribute("aria-pressed", String(x === b)));
    }));
  }
  function clearFilters() { Object.assign(F, { team: "", type: "", size: "", color: "" }); shown = CFG.store.pageSize; renderGrid(); }

  /* ---------- sheet de tamanho ---------- */
  let lastFocus = null;
  function openSheet(p, onDone) {
    lastFocus = document.activeElement; let chosen = "";
    const s = $("#sheet");
    s.innerHTML = `<div class="sheet__bg" data-sx></div>
      <div class="sheet__panel" role="dialog" aria-modal="true" aria-labelledby="shT" tabindex="-1">
        <div class="sheet__head"><h2 id="shT">Escolha o tamanho</h2><button class="icon-btn" type="button" data-sx aria-label="Fechar"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 5l14 14M19 5L5 19" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg></button></div>
        <p class="sheet__name">${esc(p.name)} · ${money(p.price)}</p>
        <div class="sizes" role="group" aria-label="Tamanhos">${CFG.sizes.map(z => { const ok = p.sizes.includes(z) && !p.unavailable.includes(z); return `<button class="size" type="button" data-size="${z}" aria-pressed="false" ${ok ? "" : "disabled aria-label='" + z + ", indisponível'"}>${z}</button>`; }).join("")}</div>
        <p class="sheet__err" id="shErr" role="alert"></p>
        <button class="btn btn--primary btn--block" type="button" id="shOk">Adicionar à sacola</button>
      </div>`;
    s.hidden = false; requestAnimationFrame(() => s.classList.add("is-open")); document.body.classList.add("no-scroll");
    const panel = $(".sheet__panel", s); panel.focus();
    const close = () => { s.classList.remove("is-open"); document.body.classList.remove("no-scroll"); setTimeout(() => { s.hidden = true; s.innerHTML = ""; }, 300); if (lastFocus) lastFocus.focus(); };
    s.onclick = e => {
      if (e.target.closest("[data-sx]")) return close();
      const z = e.target.closest("[data-size]");
      if (z) { chosen = z.dataset.size; $$(".size", s).forEach(b => b.setAttribute("aria-pressed", String(b === z))); $("#shErr").textContent = ""; }
      if (e.target.id === "shOk") {
        if (!chosen) { $("#shErr").textContent = "Escolha um tamanho para continuar."; return; }
        addToCart(p.id, chosen); close(); if (onDone) onDone();
      }
    };
    s.onkeydown = e => {
      if (e.key === "Escape") close();
      if (e.key === "Tab") {
        const f = $$("button:not([disabled])", panel), first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };
  }

  /* ---------- carrossel em destaque ---------- */
  function railHtml() {
    const list = CFG.products.filter(p => p.featured);
    return `<section class="sec sec--rail" id="cofre" aria-labelledby="cofreT">
      <header class="sec__head"><h2 id="cofreT">${esc(CFG.copy.vaultTitle)}</h2><a class="textbtn" href="#/colecao">Ver tudo</a></header>
      <div class="rail-wrap">
        <div class="rail" id="rail" tabindex="0" role="region" aria-label="Carrossel de camisas em destaque. Use as setas do teclado ou deslize.">
          ${list.map((p, i) => { const im = imgs(p)[0]; return `<a class="rail__item" href="#/produto/${p.id}" aria-label="${esc(p.name)}, ${money(p.price)}" draggable="false">
            <span class="rail__img"><img src="${im.src}" alt="${esc(im.alt)}" loading="${i < 2 ? "eager" : "lazy"}" width="600" height="720" draggable="false">${p.badge ? `<em class="tag${p.badge === "Esgotado" ? " tag--out" : ""}">${esc(p.badge)}</em>` : ""}</span>
            <span class="rail__meta"><b>${String(i + 1).padStart(2, "0")}</b><span>${esc(p.name)}</span><strong>${money(p.price)}</strong></span></a>`; }).join("")}
        </div>
        <div class="rail__ctl"><button class="icon-btn icon-btn--ring" type="button" data-rail="-1" aria-label="Peça anterior"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" stroke-width="1.8"/></svg></button>
          <button class="icon-btn icon-btn--ring" type="button" data-rail="1" aria-label="Próxima peça"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5l7 7-7 7" fill="none" stroke="currentColor" stroke-width="1.8"/></svg></button></div>
      </div></section>`;
  }
  function initRail() {
    const rail = $("#rail"); if (!rail) return;
    const items = $$(".rail__item", rail);
    let tick = false;
    const update = () => {
      tick = false; const c = rail.scrollLeft + rail.clientWidth / 2; let best = 0, bd = 1e9;
      items.forEach((it, i) => { const d = Math.abs(it.offsetLeft + it.offsetWidth / 2 - c); if (d < bd) { bd = d; best = i; } it.style.setProperty("--d", Math.min(1, d / (rail.clientWidth * 0.55)).toFixed(3)); });
      items.forEach((it, i) => it.classList.toggle("is-active", i === best));
    };
    rail.addEventListener("scroll", () => { if (!tick) { tick = true; requestAnimationFrame(update); } }, { passive: true });
    addEventListener("resize", update); update();
    $$("[data-rail]").forEach(b => b.addEventListener("click", () => {
      const w = items[0].offsetWidth + 2; rail.scrollBy({ left: w * +b.dataset.rail, behavior: reduce ? "auto" : "smooth" });
    }));
    rail.addEventListener("keydown", e => { if (e.key === "ArrowRight" || e.key === "ArrowLeft") { e.preventDefault(); rail.scrollBy({ left: (e.key === "ArrowRight" ? 1 : -1) * (items[0].offsetWidth + 2), behavior: reduce ? "auto" : "smooth" }); } });
    // arrastar com o mouse (toque já rola nativamente)
    let down = false, sx = 0, sl = 0, moved = false;
    rail.addEventListener("pointerdown", e => { if (e.pointerType !== "mouse") return; down = true; moved = false; sx = e.clientX; sl = rail.scrollLeft; rail.classList.add("is-drag"); });
    addEventListener("pointermove", e => { if (!down) return; const dx = e.clientX - sx; if (Math.abs(dx) > 4) moved = true; rail.scrollLeft = sl - dx; });
    addEventListener("pointerup", () => { if (down) { down = false; rail.classList.remove("is-drag"); setTimeout(() => { moved = false; }, 0); } });
    rail.addEventListener("click", e => { if (moved) { e.preventDefault(); e.stopPropagation(); } }, true);
  }

  /* ---------- seção 360° ---------- */
  let viewer = null;
  function viewerHtml() {
    const list = CFG.products;
    return `<section class="sec sec--viewer" id="viewer" aria-labelledby="vwT">
      <header class="sec__head"><h2 id="vwT">${esc(CFG.copy.viewerTitle)}</h2><p>${esc(CFG.copy.viewerText)}</p></header>
      <div class="vw">
        <div class="v360" id="v360"></div>
        <div class="vw__info">
          <div class="chips chips--scroll" role="group" aria-label="Escolher camisa no visor">${list.map((p, i) => `<button class="chip" type="button" data-vp="${p.id}" aria-pressed="${i === 0}">${esc(p.name.replace(/^(Camisa|Regata) /, "").replace(/^(Nike|Adidas|Puma|Jordan) /, ""))}</button>`).join("")}</div>
          <h3 class="vw__name" id="vwName"></h3><p class="vw__price" id="vwPrice"></p>
          <div class="vw__act"><a class="btn" id="vwLink" href="#/">Ver peça</a><button class="btn btn--primary" type="button" id="vwAdd">Adicionar à sacola</button></div>
        </div></div></section>`;
  }
  /* o visualizador só é criado quando chega perto da tela (o 3D só baixa nesse momento) */
  function lazyViewer(host, product) {
    const holder = { destroy() { dead = true; if (v) v.destroy(); }, set(p) { product = p; if (v) v.set(p); } };
    let v = null, dead = false;
    const io = new IntersectionObserver(es => { if (es[0].isIntersecting && !v && !dead) { v = window.JSDViewer360.create(host, product); io.disconnect(); } }, { rootMargin: "500px" });
    io.observe(host);
    const d = holder.destroy; holder.destroy = () => { io.disconnect(); d(); };
    return holder;
  }
  function initViewer() {
    const host = $("#v360"); if (!host) return;
    const list = CFG.products; let cur = list[0];
    viewer = lazyViewer(host, cur);
    const paint = () => { $("#vwName").textContent = cur.name; $("#vwPrice").innerHTML = `${money(cur.price)} <span>${money(pix(cur.price))} no Pix</span>`; $("#vwLink").href = "#/produto/" + cur.id; $("#vwAdd").disabled = isOut(cur); };
    paint();
    $("#viewer").addEventListener("click", e => {
      const b = e.target.closest("[data-vp]");
      if (b) { cur = byId(b.dataset.vp); $$("[data-vp]").forEach(x => x.setAttribute("aria-pressed", String(x === b))); viewer.set(cur); paint(); }
      if (e.target.id === "vwAdd") openSheet(cur);
    });
  }

  /* ---------- views ---------- */
  let current = "", introDone = false, heroCtl = null;
  const first = { route: true };

  function homeView() {
    main.innerHTML = `<div id="heroHost"></div>
      ${railHtml()}${collectionHtml()}${viewerHtml()}`;
    heroCtl = window.JSDHero.mount($("#heroHost"));
    $("#heroCta").addEventListener("click", e => { e.preventDefault(); scrollToSec("colecao"); });
    bindCollection(); renderGrid(); initRail(); initViewer();
    const loader = $("#loader"), sig = $("#sig");
    const startIntro = first.route && !introDone && !pendingScroll;
    if (startIntro) { introDone = true; heroCtl.intro(loader, sig); }
    else { introDone = true; if (loader) loader.remove(); heroCtl.skip(sig); }
    return "JSD™ — Private • Vault Drop";
  }

  function scrollToSec(id) { const el = document.getElementById(id); if (el) el.scrollIntoView(scrollOpts); }

  function productView(id) {
    const p = byId(id); if (!p) return notFound();
    const im = imgs(p), out = isOut(p); let size = "";
    const rel = CFG.products.filter(x => x.team === p.team && x.id !== p.id).slice(0, 4);
    const sc = CFG.sizeChart;
    main.innerHTML = `<article class="pdp">
      <nav class="crumbs" aria-label="Você está em"><a href="#/">Início</a><span>/</span><a href="#/colecao" data-team="${esc(p.team)}">${esc(p.team)}</a><span>/</span><span aria-current="page">${esc(p.name)}</span></nav>
      <div class="pdp__grid">
        <div class="pdp__gal">
          <div class="gal" id="gal" tabindex="0" role="region" aria-label="Galeria de fotos de ${esc(p.name)}">${im.map(i => `<img src="${i.src}" alt="${esc(i.alt)}" width="600" height="720">`).join("")}</div>
          ${p.badge ? `<span class="badge--pdp">${esc(p.badge)}</span>` : ""}
          ${im.length > 1 ? `<span class="gal__count" id="galCount" aria-hidden="true">1/${im.length}</span>` : ""}
          <div class="pdp3d"><p class="lbl">Gire a peça: frente e verso</p><div class="v360" id="pdp360"></div></div>
        </div>
        <div class="pdp__info">
          <h1 class="pdp__name">${esc(p.name)}</h1>
          <p class="pdp__price"><strong>${money(p.price)}</strong><span>${money(pix(p.price))} no Pix (${Math.round(CFG.store.pixDiscount * 100)}% off)</span></p>
          <p class="pdp__desc">${esc(p.description)}</p>
          <div class="pdp__cols"><p class="lbl">Cor</p><ul class="dots dots--lg">${p.colors.map(c => `<li style="--c:${c.hex}" title="${esc(c.name)}"></li>`).join("")}</ul><span class="muted">${p.colors.map(c => esc(c.name)).join(" / ")}</span></div>
          <p class="lbl" id="szLbl">Tamanho</p>
          <div class="sizes" role="group" aria-labelledby="szLbl">${CFG.sizes.map(z => { const ok = p.sizes.includes(z) && !p.unavailable.includes(z); return `<button class="size" type="button" data-size="${z}" aria-pressed="false" ${ok ? "" : "disabled aria-label='" + z + ", indisponível'"}>${z}</button>`; }).join("")}</div>
          <p class="sheet__err" id="pdpErr" role="alert"></p>
          <button class="btn btn--primary btn--block btn--lg" type="button" id="pdpAdd" ${out ? "disabled" : ""}>${out ? "Esgotado" : "Adicionar à sacola"}</button>
          <a class="btn btn--block" href="${wa(`Olá, JSD! Tenho uma dúvida sobre: ${p.name}.`)}" target="_blank" rel="noopener">Tirar dúvida no WhatsApp</a>
          <details class="acc" open><summary>Tabela de medidas (${sc.unit})</summary>
            <div class="tbl-wrap"><table class="tbl"><caption class="sr">Medidas da peça em centímetros, por tamanho</caption>
              <thead><tr><th scope="col">Tam.</th>${sc.columns.map(c => `<th scope="col">${esc(c)}</th>`).join("")}</tr></thead>
              <tbody>${CFG.sizes.map(z => `<tr><th scope="row">${z}</th>${sc.rows[z].map(v => `<td>${v}</td>`).join("")}</tr>`).join("")}</tbody></table></div>
            <p class="muted">${esc(sc.note)}</p></details>
          <details class="acc"><summary>Composição e cuidados</summary><p>${esc(p.composition)}</p><p class="muted">Lavar à mão ou em ciclo delicado, do avesso, em água fria. Não usar alvejante. Secar à sombra.</p></details>
          <details class="acc"><summary>Envio</summary><p>${esc(CFG.copy.shippingNote)}</p></details>
        </div>
      </div>
      ${rel.length ? `<section class="sec" aria-labelledby="relT"><header class="sec__head"><h2 id="relT">Do mesmo time</h2></header><div class="grid">${rel.map(cardHtml).join("")}</div></section>` : ""}
    </article>`;
    const gal = $("#gal"), gc = $("#galCount");
    if (gc) gal.addEventListener("scroll", () => { gc.textContent = `${Math.round(gal.scrollLeft / gal.clientWidth) + 1}/${im.length}`; }, { passive: true });
    $$(".pdp__info .size").forEach(b => b.addEventListener("click", () => { size = b.dataset.size; $$(".pdp__info .size").forEach(x => x.setAttribute("aria-pressed", String(x === b))); $("#pdpErr").textContent = ""; }));
    $("#pdpAdd").addEventListener("click", () => { if (!size) { $("#pdpErr").textContent = "Escolha um tamanho para continuar."; return; } addToCart(p.id, size); });
    viewer = lazyViewer($("#pdp360"), p);
    observeReveal();
    return p.name + " — JSD™";
  }

  function cartView() {
    const n = cartCount(), total = cartTotal(), need = CFG.store.freeShippingFrom, pct = Math.min(100, total / need * 100);
    if (!n) {
      main.innerHTML = `<section class="page"><h1 class="page__t">Sua sacola</h1><div class="empty"><p>Sua sacola está vazia.</p><a class="btn btn--primary" href="#/colecao">Ver a coleção</a></div></section>`;
      return "Sacola — JSD™";
    }
    const lines = cart.map(i => { const p = byId(i.id); return `${i.qty}x ${p.name} — Tam. ${i.size} — ${money(p.price * i.qty)}`; });
    const msg = `Olá, JSD! Quero finalizar meu pedido:\n\n${lines.join("\n")}\n\nSubtotal: ${money(total)}\nTotal no Pix: ${money(pix(total))}\n\nNome:\nEndereço / CEP:`;
    main.innerHTML = `<section class="page"><h1 class="page__t">Sua sacola <span>(${n} ${n === 1 ? "item" : "itens"})</span></h1>
      <div class="cart">
        <ul class="cart__list">${cart.map((i, k) => { const p = byId(i.id), im = imgs(p)[0]; return `<li class="line">
          <a class="line__img" href="#/produto/${p.id}"><img src="${im.src}" alt="${esc(im.alt)}" width="96" height="115"></a>
          <div class="line__info"><a class="line__name" href="#/produto/${p.id}">${esc(p.name)}</a><p class="muted">Tamanho ${i.size}</p><p class="line__price">${money(p.price * i.qty)}</p>
            <div class="qty" role="group" aria-label="Quantidade de ${esc(p.name)}"><button type="button" data-q="${k}" data-d="-1" aria-label="Diminuir quantidade">−</button><output aria-live="polite">${i.qty}</output><button type="button" data-q="${k}" data-d="1" aria-label="Aumentar quantidade">+</button></div>
            <button class="link" type="button" data-rm="${k}" aria-label="Remover ${esc(p.name)} tamanho ${i.size} da sacola">Remover</button></div></li>`; }).join("")}</ul>
        <aside class="cart__sum" aria-label="Resumo do pedido">
          <h2>Resumo</h2>
          <dl><div><dt>Subtotal</dt><dd>${money(total)}</dd></div><div class="pixrow"><dt>Total no Pix (${Math.round(CFG.store.pixDiscount * 100)}% off)</dt><dd>${money(pix(total))}</dd></div></dl>
          <div class="ship"><p>${total >= need ? "Você ganhou frete grátis." : `Faltam ${money(need - total)} para o frete grátis.`}</p><div class="ship__bar" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.round(pct)}" aria-label="Progresso para frete grátis"><b style="width:${pct}%"></b></div></div>
          <a class="btn btn--primary btn--block btn--lg" href="${wa(msg)}" target="_blank" rel="noopener">Finalizar pelo WhatsApp</a>
          <p class="muted">Você será levado ao WhatsApp com o pedido pronto. Pagamento e frete são combinados lá.</p>
        </aside></div></section>`;
    main.querySelector(".cart").addEventListener("click", e => {
      const q = e.target.closest("[data-q]"), r = e.target.closest("[data-rm]");
      if (q) { const it = cart[+q.dataset.q]; it.qty = Math.max(1, Math.min(9, it.qty + +q.dataset.d)); saveCart(); updateBag(); cartView(); const nb = $(`[data-q="${q.dataset.q}"][data-d="${q.dataset.d}"]`); if (nb) nb.focus(); }
      if (r) { cart.splice(+r.dataset.rm, 1); saveCart(); updateBag(); cartView(); $("#main").focus(); }
    });
    return "Sacola — JSD™";
  }

  function aboutView() {
    const c = CFG.copy;
    main.innerHTML = `<section class="page page--about"><h1 class="page__t">${esc(c.aboutTitle)}</h1>
      <div class="about"><div class="about__txt">${c.aboutParagraphs.map(t => `<p>${esc(t)}</p>`).join("")}</div>
        <ul class="pillars">${c.aboutPillars.map((p, i) => `<li><b>${String(i + 1).padStart(2, "0")}</b><h2>${esc(p.t)}</h2><p>${esc(p.d)}</p></li>`).join("")}</ul></div>
      <a class="btn btn--primary" href="#/colecao">Entrar no cofre</a></section>`;
    return "Sobre — JSD™";
  }

  function contactView() {
    const k = CFG.contact;
    main.innerHTML = `<section class="page"><h1 class="page__t">Contato</h1>
      <p class="lead">${esc(k.note)}</p>
      <div class="contact">
        <div class="contact__links">
          <a class="bigl" href="${wa()}" target="_blank" rel="noopener"><span>WhatsApp</span><strong>${esc(k.whatsappDisplay)}</strong></a>
          <a class="bigl" href="https://instagram.com/${ig}" target="_blank" rel="noopener"><span>Instagram</span><strong>@${ig}</strong></a>
        </div>
        <form class="form" id="cForm" novalidate>
          <h2>Mande uma mensagem</h2>
          <label for="cName">Seu nome</label><input id="cName" name="name" autocomplete="name" required>
          <label for="cMsg">Mensagem</label><textarea id="cMsg" name="msg" rows="5" required></textarea>
          <p class="sheet__err" id="cErr" role="alert"></p>
          <button class="btn btn--primary btn--block btn--lg" type="submit">Enviar pelo WhatsApp</button>
        </form></div></section>`;
    $("#cForm").addEventListener("submit", e => {
      e.preventDefault(); const n = $("#cName").value.trim(), m = $("#cMsg").value.trim();
      if (!n || !m) { $("#cErr").textContent = "Preencha seu nome e a mensagem."; return; }
      window.open(wa(`Olá, JSD! Aqui é ${n}.\n\n${m}`), "_blank", "noopener");
    });
    return "Contato — JSD™";
  }

  function notFound() {
    main.innerHTML = `<section class="page"><h1 class="page__t">Peça não encontrada</h1><div class="empty"><p>Essa peça não está mais no cofre.</p><a class="btn btn--primary" href="#/colecao">Ver a coleção</a></div></section>`;
    return "Peça não encontrada — JSD™";
  }

  /* ---------- reveal ---------- */
  let io;
  function observeReveal() {
    if (!("IntersectionObserver" in window)) { $$(".rv").forEach(e => e.classList.add("in")); return; }
    io = io || new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }), { rootMargin: "0px 0px -8% 0px" });
    $$(".rv:not(.in)").forEach(e => io.observe(e));
  }

  /* ---------- roteador ---------- */
  function route() {
    const h = location.hash || "#/";
    let name = "home", arg = "", target = "";
    if (/^#\/colecao/.test(h)) { target = "colecao"; }
    else if (/^#\/produto\//.test(h)) { name = "product"; arg = decodeURIComponent(h.split("/")[2] || ""); }
    else if (/^#\/sacola/.test(h)) name = "cart";
    else if (/^#\/sobre/.test(h)) name = "about";
    else if (/^#\/contato/.test(h)) name = "contact";
    if (pendingScroll) { target = pendingScroll; }
    if (name === "home" && current === "home") {      // já está na home: só rola
      if (target) { renderGrid(); scrollToSec(target); } else scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
      pendingScroll = ""; return;
    }
    if (viewer) { viewer.destroy(); viewer = null; }
    const prev = current; current = name; if (!pendingScroll && target) pendingScroll = target;
    document.body.dataset.route = name;
    if (name !== "home") { const l = $("#loader"); if (l) l.remove(); $("#sig").classList.add("is-drawn", "is-docked"); document.body.classList.remove("is-loading"); document.body.classList.add("is-ready"); }
    const title = { home: homeView, product: () => productView(arg), cart: cartView, about: aboutView, contact: contactView }[name]();
    document.title = title; observeReveal(); window.__hdr && window.__hdr();
    if (name === "home" && pendingScroll) { const t = pendingScroll; pendingScroll = ""; requestAnimationFrame(() => scrollToSec(t)); }
    else { pendingScroll = ""; scrollTo(0, 0); if (prev) main.focus({ preventScroll: true }); }
    first.route = false;
  }

  /* ---------- início ---------- */
  initChrome();
  main.addEventListener("click", e => {
    const a = e.target.closest("[data-add]"); if (a) openSheet(byId(a.dataset.add));
    const t = e.target.closest("[data-team]");
    if (t) { Object.assign(F, { team: t.dataset.team, type: "", size: "", color: "" }); shown = CFG.store.pageSize; pendingScroll = "colecao"; }
  });
  addEventListener("hashchange", route);
  route();
})();
