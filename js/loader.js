/* Abertura:
   salão escuro com fumaça dourada → tesoura, navalha e máquina surgem desenhadas em luz
   e "viram reais" com faíscas → logo 3D com a coroa → site.
   O poste embaixo mostra o carregamento real (0–100%). */
(function () {
  const el = document.getElementById("pageLoader");
  if (!el) return;
  const $id = (i) => document.getElementById(i);
  const pct = $id("loaderPct"), bar = $id("loaderBar"), kicker = $id("ldKicker"), canvas = $id("ldSmoke"), flare = $id("ldFlare");
  const ferramentas = [...el.querySelectorAll(".tool")];
  const nomes = ["Afiando a tesoura", "Passando a navalha", "Penteando", "Ligando a máquina"];
  const reduz = matchMedia("(prefers-reduced-motion: reduce)").matches;
  document.documentElement.classList.add("is-loading");

  let visto = false;
  try { visto = sessionStorage.getItem("ld-visto") === "1"; sessionStorage.setItem("ld-visto", "1"); } catch {}

  /* ---------- Fumaça dourada, pó e faíscas ---------- */
  const ctx = canvas.getContext("2d");
  let W = 0, H = 0, dpr = 1, rodando = true;
  function tamanho() { dpr = Math.min(devicePixelRatio || 1, 1.5); W = canvas.width = innerWidth * dpr; H = canvas.height = innerHeight * dpr; }
  tamanho(); addEventListener("resize", tamanho);
  // uma "nuvem" pré-desenhada, reaproveitada em vários tamanhos
  const nuvem = document.createElement("canvas"); nuvem.width = nuvem.height = 256;
  (function () {
    const c = nuvem.getContext("2d");
    for (let i = 0; i < 26; i++) {
      const x = 128 + (Math.random() - 0.5) * 120, y = 128 + (Math.random() - 0.5) * 120, r = 30 + Math.random() * 70;
      const g = c.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, "rgba(190,150,95,0.07)"); g.addColorStop(1, "rgba(190,150,95,0)");
      c.fillStyle = g; c.beginPath(); c.arc(x, y, r, 0, 6.283); c.fill();
    }
  })();
  const fumaca = Array.from({ length: 10 }, () => ({ x: Math.random(), y: 0.15 + Math.random() * 0.95, s: 0.45 + Math.random() * 0.6, a: Math.random() * 6.28,
    va: (Math.random() - 0.5) * 0.002, vx: (Math.random() - 0.5) * 0.0004, vy: -0.0002 - Math.random() * 0.0004, o: 0.35 + Math.random() * 0.4 }));
  let parts = [];
  const po = () => parts.push({ x: Math.random() * W, y: H * (0.3 + Math.random() * 0.7), vx: (Math.random() - 0.5) * 0.25 * dpr, vy: -(0.15 + Math.random() * 0.4) * dpr,
    r: (0.5 + Math.random() * 1.3) * dpr, vida: 1, dec: 0.003 + Math.random() * 0.004, h: 38 + Math.random() * 10 });
  function faiscas() {
    const cx = W / 2, cy = H * 0.42;
    for (let i = 0; i < 70; i++) {
      const ang = Math.random() * 6.283, v = (2 + Math.random() * 7) * dpr;
      parts.push({ x: cx + Math.cos(ang) * 30 * dpr, y: cy + Math.sin(ang) * 30 * dpr, vx: Math.cos(ang) * v, vy: Math.sin(ang) * v - 2 * dpr, g: 0.12 * dpr,
        r: (0.6 + Math.random() * 1.5) * dpr, vida: 1, dec: 0.018 + Math.random() * 0.02, h: 40 + Math.random() * 12 });
    }
    flare.classList.remove("is-on"); void flare.offsetWidth; flare.classList.add("is-on");
  }
  function desenhar() {
    if (!rodando) return;
    ctx.clearRect(0, 0, W, H);
    ctx.globalCompositeOperation = "screen";
    for (const f of fumaca) {
      if (!reduz) { f.x += f.vx; f.y += f.vy; f.a += f.va; if (f.y < -0.3) { f.y = 1.2; f.x = Math.random(); } }
      const tam = Math.max(W, H) * 0.55 * f.s;
      ctx.save(); ctx.globalAlpha = f.o; ctx.translate(f.x * W, f.y * H); ctx.rotate(f.a);
      ctx.drawImage(nuvem, -tam / 2, -tam / 2, tam, tam); ctx.restore();
    }
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "lighter";
    if (!reduz && Math.random() < 0.35) po();
    parts = parts.filter((p) => p.vida > 0);
    for (const p of parts) {
      p.x += p.vx; p.y += p.vy; if (p.g) { p.vy += p.g; p.vx *= 0.985; } p.vida -= p.dec;
      const a = Math.max(0, p.vida);
      ctx.fillStyle = `hsla(${p.h},100%,${60 + a * 25}%,${a})`;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r * (0.5 + a * 0.7), 0, 6.283); ctx.fill();
    }
    ctx.globalCompositeOperation = "source-over";
    requestAnimationFrame(desenhar);
  }
  requestAnimationFrame(desenhar);

  /* ---------- Carregamento real ---------- */
  let carregado = document.readyState === "complete";
  if (!carregado) addEventListener("load", () => (carregado = true));
  setTimeout(() => (carregado = true), 8000);  // segurança

  /* ---------- Linha do tempo ---------- */
  const DESENHO = 550, SOLIDO = 900, SAIDA = 150;          // ms de cada ferramenta
  const CICLO = DESENHO + SOLIDO + SAIDA;
  const usar = visto || reduz ? [] : ferramentas;           // visitas seguintes: direto ao logo
  const TOTAL = Math.max(700, usar.length * CICLO);
  const inicio = performance.now();
  let mostrado = 0, fase = -1, final = false;

  function mostrarFerramenta(i) {
    ferramentas.forEach((t, k) => { if (k !== i) t.classList.remove("is-draw", "is-solid"); });
    const t = ferramentas[i]; kicker.textContent = nomes[i];
    t.classList.remove("is-out"); t.classList.add("is-draw");
    setTimeout(() => { t.classList.add("is-solid"); faiscas(); }, DESENHO);
    setTimeout(() => t.classList.add("is-out"), DESENHO + SOLIDO);
  }

  function quadro(agora) {
    const t = agora - inicio;
    const i = Math.min(usar.length - 1, Math.floor(t / CICLO));
    if (usar.length && i !== fase && t < TOTAL) { fase = i; mostrarFerramenta(i); }
    // a % acompanha a sequência, mas só chega a 100 quando a página terminou de carregar
    const alvo = Math.min(carregado ? 100 : 92, (t / TOTAL) * 100);
    mostrado += Math.max(0.3, (alvo - mostrado) * 0.12);
    if (mostrado > alvo) mostrado = alvo;
    const v = Math.max(0, Math.floor(mostrado));
    pct.textContent = v; bar.style.width = v + "%"; el.setAttribute("aria-valuenow", v);
    if (v >= 100 && t >= TOTAL && !final) { final = true; mostrarLogo(); return; }
    requestAnimationFrame(quadro);
  }
  requestAnimationFrame(quadro);

  function mostrarLogo() {
    ferramentas.forEach((t) => t.classList.add("is-out"));
    kicker.textContent = "Bem-vindo";
    el.classList.add("is-logo");
    if (!reduz) setTimeout(faiscas, 250);
    const espera = reduz ? 400 : visto ? 800 : 1800;
    setTimeout(() => el.classList.add("is-leaving"), espera - 500);
    setTimeout(() => {
      el.classList.add("is-done");
      document.documentElement.classList.remove("is-loading");
      dispatchEvent(new Event("barbeskin:pronto"));
      setTimeout(() => { rodando = false; el.remove(); }, 900);
    }, espera);
  }
})();
