// BlurReveal: separa o texto em palavras e revela com blur ao entrar na tela.
(function () {
  document.documentElement.classList.add("js");
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
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduce || !("IntersectionObserver" in window)) { els.forEach(function (e) { e.classList.add("in"); }); return; }
  var io = new IntersectionObserver(function (es) {
    es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } });
  }, { threshold: 0.15 });
  els.forEach(function (e) { io.observe(e); });
})();
