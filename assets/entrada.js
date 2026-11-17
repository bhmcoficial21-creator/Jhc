// Entrada: partículas que reagem ao cursor/toque e se juntam no símbolo (pontos em logo-pontos.js).
(function () {
  var root = document.documentElement;
  var tela = document.getElementById("entrada");
  if (!tela || !root.classList.contains("entrada")) return;
  var cv = tela.querySelector("canvas"), ctx = cv.getContext("2d");
  var L = window.LOGO_PONTOS, dpr = Math.min(window.devicePixelRatio || 1, 2);
  var W = 0, H = 0, ps = [], t0 = performance.now(), pronto = false, saiu = false;
  var ptr = { x: -9999, y: -9999, on: false };

  function layout() {
    W = tela.clientWidth; H = tela.clientHeight;
    cv.width = W * dpr; cv.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    var tam = Math.min(W * 0.86, H * 0.5);                 // largura máxima do símbolo
    var esc = tam / Math.max(L.w, L.h);
    var cx = W / 2 - (L.w * esc) / 2, cy = H * 0.1 + (H * 0.5 - L.h * esc) / 2 + H * 0.03;
    var n = L.p.length / 2;
    if (!ps.length) {
      for (var i = 0; i < n; i++) {
        var a = Math.random() * 6.283, d = Math.max(W, H) * (0.3 + Math.random() * 0.7);
        ps.push({ x: W / 2 + Math.cos(a) * d, y: H / 2 + Math.sin(a) * d, vx: 0, vy: 0,
          atraso: Math.random() * 1100, r: 0.9 + Math.random() * 1.5, laranja: Math.random() < 0.06, fase: Math.random() * 6.283 });
      }
    }
    for (var j = 0; j < n; j++) { ps[j].tx = cx + L.p[j * 2] * esc; ps[j].ty = cy + L.p[j * 2 + 1] * esc; }
    return esc;
  }
  var esc = layout();
  window.addEventListener("resize", function () { esc = layout(); });

  function mover(e) {
    var r = tela.getBoundingClientRect(), p = e.touches ? e.touches[0] : e;
    ptr.x = p.clientX - r.left; ptr.y = p.clientY - r.top; ptr.on = true;
  }
  tela.addEventListener("pointermove", mover); tela.addEventListener("pointerdown", mover);
  tela.addEventListener("touchmove", mover, { passive: true });
  tela.addEventListener("pointerleave", function () { ptr.on = false; });
  tela.addEventListener("pointerup", function () { ptr.on = false; });

  function frame(agora) {
    var t = agora - t0, raio = Math.max(70, Math.min(W, H) * 0.16);
    ctx.clearRect(0, 0, W, H);
    for (var i = 0; i < ps.length; i++) {
      var p = ps[i];
      if (t > p.atraso) {                                   // mola em direção ao ponto do símbolo
        var k = Math.min(1, (t - p.atraso) / 900);
        p.vx += (p.tx - p.x) * 0.012 * (0.4 + k); p.vy += (p.ty - p.y) * 0.012 * (0.4 + k);
      }
      if (ptr.on) {                                          // cursor/toque afasta as partículas
        var dx = p.x - ptr.x, dy = p.y - ptr.y, d2 = dx * dx + dy * dy;
        if (d2 < raio * raio) { var d = Math.sqrt(d2) || 1, f = (1 - d / raio) * 2.4; p.vx += (dx / d) * f; p.vy += (dy / d) * f; }
      }
      p.vx *= 0.9; p.vy *= 0.9; p.x += p.vx; p.y += p.vy;
      var tremor = pronto ? Math.sin(agora / 700 + p.fase) * 0.35 : 0;
      ctx.beginPath();
      ctx.fillStyle = p.laranja ? "rgba(255,179,122,.95)" : "rgba(120,222,208," + (0.55 + 0.4 * Math.min(1, t / 2500)) + ")";
      ctx.arc(p.x + tremor, p.y + tremor, p.r * (esc > 0.5 ? 1 : 0.8), 0, 6.283);
      ctx.fill();
    }
    if (!pronto && t > 3000) { pronto = true; tela.classList.add("pronto"); setTimeout(entrar, 4200); }
    if (!saiu) requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  function entrar() {
    if (saiu) return; saiu = true;
    try { sessionStorage.setItem("entrou", "1"); } catch (e) {}
    tela.classList.add("saindo");
    setTimeout(function () { root.classList.remove("entrada"); }, 850);
  }
  tela.addEventListener("click", function () { if (pronto) entrar(); });
  tela.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") entrar(); });
})();
