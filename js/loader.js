/* Abertura (no estilo do vídeo de referência):
   salão escuro com fumaça dourada em espiral →
   tesoura, navalha e pente aparecem como holograma azul e viram metal de verdade
   (a navalha brilha e solta faíscas) → logo da barbearia → site. */
(function () {
  const el = document.getElementById("pageLoader");
  if (!el) return;
  const $id = (i) => document.getElementById(i);
  const reduz = matchMedia("(prefers-reduced-motion: reduce)").matches;
  document.documentElement.classList.add("is-loading");
  let visto = false;
  try { visto = sessionStorage.getItem("ld-visto") === "1"; sessionStorage.setItem("ld-visto", "1"); } catch {}
  let rodando = true;

  /* ---------- Fumaça dourada em espiral ---------- */
  const fc = $id("hiSmoke"), f = fc.getContext("2d");
  const sc = $id("hiSparks"), sx = sc.getContext("2d");
  let W = 0, H = 0, d = 1;
  function tam() { d = Math.min(devicePixelRatio || 1, 1.5); W = fc.width = sc.width = innerWidth * d; H = fc.height = sc.height = innerHeight * d; }
  tam(); addEventListener("resize", tam);
  // fumaça com volutas: fios curvos e finos, levemente desfocados
  const nuvem = document.createElement("canvas"); nuvem.width = nuvem.height = 512;
  (function () {
    const c = nuvem.getContext("2d");
    c.filter = "blur(7px)"; c.lineCap = "round";
    for (let k = 0; k < 5; k++) {
      let x = 256 + (Math.random() - 0.5) * 220, y = 470, ang = -Math.PI / 2 + (Math.random() - 0.5);
      const curva = (Math.random() < 0.5 ? -1 : 1) * (0.006 + Math.random() * 0.012);
      c.beginPath(); c.moveTo(x, y);
      for (let i = 0; i < 120; i++) {
        ang += curva * (1 + i / 30) + Math.sin(i / 9) * 0.02;              // a curva vai fechando: vira espiral
        x += Math.cos(ang) * 4.2; y += Math.sin(ang) * 4.2;
        c.lineTo(x, y);
      }
      c.strokeStyle = `rgba(214,190,150,${0.10 + Math.random() * 0.10})`;
      c.lineWidth = 14 + Math.random() * 26; c.stroke();
    }
    c.filter = "blur(24px)";
    const g = c.createRadialGradient(256, 300, 0, 256, 300, 200);
    g.addColorStop(0, "rgba(200,175,135,0.12)"); g.addColorStop(1, "rgba(200,175,135,0)");
    c.fillStyle = g; c.fillRect(0, 0, 512, 512);
  })();
  const fumaca = Array.from({ length: 6 }, (_, i) => ({ x: Math.random(), y: 0.2 + Math.random() * 0.95, s: 0.9 + Math.random() * 0.9,
    a: Math.random() * 6.28, va: (Math.random() < 0.5 ? -1 : 1) * (0.0015 + Math.random() * 0.002), vx: (Math.random() - 0.5) * 0.0005, vy: -0.0003 - Math.random() * 0.0004,
    o: 0.55 + Math.random() * 0.45 }));
  let faiscas = [];
  function soltarFaiscas(cx, cy, n) {
    for (let i = 0; i < n; i++) {
      const ang = Math.random() * 6.283, v = (1.5 + Math.random() * 6) * d;
      faiscas.push({ x: cx, y: cy, vx: Math.cos(ang) * v, vy: Math.sin(ang) * v - 1.5 * d, vida: 1, dec: 0.008 + Math.random() * 0.014, r: (0.6 + Math.random() * 1.4) * d });
    }
  }
  let chuva = false;   // faíscas flutuando durante a navalha
  function desenhar() {
    if (!rodando) return;
    f.clearRect(0, 0, W, H);
    f.globalCompositeOperation = "screen";
    for (const n of fumaca) {
      if (!reduz) { n.x += n.vx; n.y += n.vy; n.a += n.va; if (n.y < -0.35) { n.y = 1.25; n.x = Math.random(); } }
      const t = Math.max(W, H) * 0.6 * n.s;
      f.save(); f.globalAlpha = n.o; f.translate(n.x * W, n.y * H); f.rotate(n.a); f.drawImage(nuvem, -t / 2, -t / 2, t, t); f.restore();
    }
    sx.clearRect(0, 0, W, H);
    sx.globalCompositeOperation = "lighter";
    if (chuva && Math.random() < 0.6) faiscas.push({ x: Math.random() * W, y: H * (0.2 + Math.random() * 0.6), vx: (Math.random() - 0.5) * 0.4 * d, vy: -(0.2 + Math.random() * 0.6) * d,
      vida: 1, dec: 0.006 + Math.random() * 0.01, r: (0.5 + Math.random() * 1.2) * d });
    faiscas = faiscas.filter((p) => p.vida > 0);
    for (const p of faiscas) {
      p.x += p.vx; p.y += p.vy; p.vy += 0.03 * d; p.vx *= 0.99; p.vida -= p.dec;
      const a = Math.max(0, p.vida);
      sx.fillStyle = `hsla(40,100%,${60 + a * 25}%,${a})`;
      sx.beginPath(); sx.arc(p.x, p.y, p.r * (0.5 + a * 0.7), 0, 6.283); sx.fill();
    }
    requestAnimationFrame(desenhar);
  }
  requestAnimationFrame(desenhar);

  /* ---------- Linha do tempo ---------- */
  let carregado = document.readyState === "complete";
  if (!carregado) addEventListener("load", () => (carregado = true));
  setTimeout(() => (carregado = true), 9000);

  const tools = [...el.querySelectorAll(".hi-tool")];
  const curto = visto || reduz;
  const PASSO = 2050, HOLO = 1050, SAI = 1800;           // ms de cada ferramenta
  const timers = [];
  const quando = (ms, fn) => timers.push(setTimeout(fn, ms));
  let tLogo = 200;
  if (!curto) {
    tools.forEach((t, i) => {
      const t0 = 250 + i * PASSO;
      quando(t0, () => t.classList.add("is-holo"));
      quando(t0 + HOLO, () => {
        t.classList.add("is-real");
        const r = t.querySelector(".hi-spin").getBoundingClientRect();
        soltarFaiscas((r.left + r.width / 2) * d, (r.top + r.height / 2) * d, t.classList.contains("hi-navalha") ? 70 : 28);
        if (t.classList.contains("hi-navalha")) chuva = true;
      });
      quando(t0 + SAI, () => { t.classList.add("is-out"); if (t.classList.contains("hi-navalha")) chuva = false; });
    });
    tLogo = 250 + tools.length * PASSO;
  }
  quando(tLogo, () => { el.classList.add("is-logo"); if (!curto) soltarFaiscas(W / 2, H * 0.46, 60); });

  let saiu = false;
  function sair() {
    if (saiu) return; saiu = true;
    timers.forEach(clearTimeout);
    el.classList.add("is-done");
    document.documentElement.classList.remove("is-loading");
    dispatchEvent(new Event("barbeskin:pronto"));
    setTimeout(() => { rodando = false; el.remove(); }, 1000);
  }
  const tentar = () => (carregado ? sair() : setTimeout(tentar, 120));
  setTimeout(tentar, tLogo + (curto ? 700 : 1500));
  $id("inSkip").addEventListener("click", sair);
})();
