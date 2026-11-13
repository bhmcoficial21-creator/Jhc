/* Logo 3D em camadas: base, letreiro, postes, monograma MSN e cadeira em profundidades diferentes.
   - data-interactive: inclina seguindo o mouse/dedo (e balança sozinho quando ninguém mexe)
   - sem atributo: só balança devagar (selo da capa)
   - data-intro: usado no carregamento (a animação de montagem é controlada pelo loader) */
(function () {
  const reduz = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const logos = [...document.querySelectorAll(".logo3d")];
  if (!logos.length) return;

  // profundidade proporcional ao tamanho do logo
  const medir = () => logos.forEach((el) => el.style.setProperty("--u", (el.getBoundingClientRect().width / 400).toFixed(3) + "px"));
  medir();
  addEventListener("resize", medir);
  logos.forEach((el) => el.querySelectorAll("img").forEach((i) => i.complete || i.addEventListener("load", medir, { once: true })));

  const estados = logos.map((el) => ({ el, rx: 0, ry: 0, tx: 0, ty: 0, mexendo: 0, interativo: el.hasAttribute("data-interactive"), visivel: true }));

  estados.filter((s) => s.interativo).forEach((s) => {
    const alvo = s.el.closest("section") || s.el;
    const mover = (x, y) => {
      const r = s.el.getBoundingClientRect();
      const nx = Math.max(-1, Math.min(1, (x - (r.left + r.width / 2)) / (r.width / 1.4)));
      const ny = Math.max(-1, Math.min(1, (y - (r.top + r.height / 2)) / (r.height / 1.4)));
      s.ty = nx * 28; s.tx = -ny * 22; s.mexendo = performance.now();
    };
    alvo.addEventListener("pointermove", (e) => mover(e.clientX, e.clientY));
    alvo.addEventListener("touchmove", (e) => { const t = e.touches[0]; if (t) mover(t.clientX, t.clientY); }, { passive: true });
    alvo.addEventListener("pointerleave", () => { s.mexendo = 0; });
  });

  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver((ents) => ents.forEach((en) => {
      const s = estados.find((x) => x.el === en.target); if (s) s.visivel = en.isIntersecting;
    }));
    estados.forEach((s) => io.observe(s.el));
  }

  function quadro(t) {
    for (const s of estados) {
      if (!s.visivel) continue;
      const parado = !s.mexendo || t - s.mexendo > 1800;
      if (parado && !reduz) {           // balanço sozinho
        const amp = s.interativo ? 1 : 0.8;
        s.ty = Math.sin(t / 1700) * 20 * amp;
        s.tx = Math.sin(t / 2300 + 1) * 9 * amp;
      }
      s.rx += (s.tx - s.rx) * 0.08;
      s.ry += (s.ty - s.ry) * 0.08;
      s.el.style.setProperty("--rx", s.rx.toFixed(2) + "deg");
      s.el.style.setProperty("--ry", s.ry.toFixed(2) + "deg");
      s.el.style.setProperty("--shine", (50 + s.ry * 2.2).toFixed(1) + "%");
    }
    requestAnimationFrame(quadro);
  }
  if (!reduz) requestAnimationFrame(quadro);
})();
