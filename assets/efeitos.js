// Efeitos da área de membros: BlurReveal, revelação dos cards e transição de página.
(function () {
  var root = document.documentElement;
  root.classList.add("js");
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var hasIO = "IntersectionObserver" in window;
  function store(k, v) { try { if (v === null) sessionStorage.removeItem(k); else if (v === undefined) return sessionStorage.getItem(k); else sessionStorage.setItem(k, v); } catch (e) {} }

  /* ---- BlurReveal: palavra por palavra ---- */
  var els = document.querySelectorAll("[data-blur]");
  function wrap(node, c) {
    Array.prototype.slice.call(node.childNodes).forEach(function (n) {
      if (n.nodeType === 3) {
        var frag = document.createDocumentFragment();
        n.textContent.split(/(\s+)/).forEach(function (p) {
          if (!p) return;
          if (/^\s+$/.test(p)) { frag.appendChild(document.createTextNode(p)); return; }
          var s = document.createElement("span");
          s.className = "bw"; s.textContent = p;
          s.style.transitionDelay = Math.min(c.i++ * 55, 900) + "ms";
          frag.appendChild(s);
        });
        n.parentNode.replaceChild(frag, n);
      } else if (n.nodeType === 1) wrap(n, c);
    });
  }
  els.forEach(function (el) { wrap(el, { i: 0 }); });
  function watch(list, threshold) {
    if (reduce || !hasIO) { list.forEach(function (e) { e.classList.add("in"); }); return; }
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } });
    }, { threshold: threshold });
    list.forEach(function (e) { io.observe(e); });
  }
  // com a transição de página, espera o painel abrir antes de revelar o texto
  var arriving = root.classList.contains("pt-arrive");
  setTimeout(function () { watch(Array.prototype.slice.call(els), 0.15); }, arriving ? 700 : 0);

  /* ---- Revelação dos cards dos exercícios (não roda ao exportar PNG) ---- */
  if (!reduce && !document.body.classList.contains("export")) {
    var cards = Array.prototype.slice.call(document.querySelectorAll(".stack .card"));
    cards.forEach(function (c) {
      c.classList.add("rv");
      Array.prototype.slice.call(c.children).forEach(function (ch, i) { ch.style.setProperty("--d", (i * 0.09) + "s"); });
    });
    setTimeout(function () { watch(cards, 0.25); }, arriving ? 700 : 0);
  }

  /* ---- Transição de página ---- */
  function overlay(cls) {
    var d = document.createElement("div");
    d.className = "pt " + cls; d.setAttribute("aria-hidden", "true");
    document.body.appendChild(d); return d;
  }
  if (arriving) {
    store("pt", null);
    var o = overlay("reveal");
    root.classList.remove("pt-arrive");
    setTimeout(function () { if (o.parentNode) o.parentNode.removeChild(o); }, 900);
  }
  if (!reduce) {
    document.addEventListener("click", function (e) {
      var a = e.target.closest && e.target.closest('a[href^="guia.html"],a[href^="membros.html"]');
      if (!a || e.metaKey || e.ctrlKey || e.shiftKey || e.button) return;
      e.preventDefault();
      store("pt", "1");
      var o2 = overlay("cover");
      setTimeout(function () { location.href = a.getAttribute("href"); }, 720);
      window.addEventListener("pageshow", function (ev) { if (ev.persisted && o2.parentNode) o2.parentNode.removeChild(o2); }, { once: true });
    });
  }
})();
