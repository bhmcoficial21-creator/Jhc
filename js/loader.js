/* Abertura do site:
   1) carregando: parede de madeira, rachadura brilhando, brasas, logo 3D e poste girando (0–100%)
   2) 100%: a tesoura desce cortando a madeira na rachadura (faíscas + linha de corte)
   3) a parede abre ao meio e aparece o barbeiro na poltrona; depois o site entra */
(function () {
  const el = document.getElementById("pageLoader");
  if (!el) return;
  const $id = (i) => document.getElementById(i);
  const pct = $id("loaderPct"), bar = $id("loaderBar"), kicker = $id("ldKicker"), canvas = $id("embers");
  const reduz = matchMedia("(prefers-reduced-motion: reduce)").matches;
  document.documentElement.classList.add("is-loading");

  let visto = false;
  try { visto = sessionStorage.getItem("ld-visto") === "1"; sessionStorage.setItem("ld-visto", "1"); } catch {}

  /* ---------- Brasas e faíscas (canvas) ---------- */
  const ctx = canvas.getContext("2d");
  let W = 0, H = 0, dpr = 1, parts = [], corteY = -1, rodando = true;
  function tamanho() {
    dpr = Math.min(devicePixelRatio || 1, 2);
    W = canvas.width = innerWidth * dpr; H = canvas.height = innerHeight * dpr;
  }
  tamanho(); addEventListener("resize", tamanho);
  const xRacha = () => W * 0.49;
  function brasa() {   // sobe devagar da rachadura
    parts.push({ x: xRacha() + (Math.random() - 0.5) * 40 * dpr, y: H * (0.35 + Math.random() * 0.5), vx: (Math.random() - 0.5) * 0.3 * dpr,
      vy: -(0.3 + Math.random() * 0.8) * dpr, r: (0.6 + Math.random() * 1.6) * dpr, vida: 1, dec: 0.004 + Math.random() * 0.006, cor: 30 + Math.random() * 15 });
  }
  function faisca(y) { // espirra da ponta da tesoura
    for (let i = 0; i < 6; i++) parts.push({ x: xRacha(), y, vx: (Math.random() - 0.5) * 7 * dpr, vy: (Math.random() - 0.9) * 5 * dpr,
      r: (0.6 + Math.random() * 1.4) * dpr, vida: 1, dec: 0.025 + Math.random() * 0.03, cor: 40 + Math.random() * 15, g: 0.18 * dpr });
  }
  function desenhar() {
    if (!rodando) return;
    ctx.clearRect(0, 0, W, H);
    if (!reduz && !el.classList.contains("is-open") && Math.random() < 0.5) brasa();
    if (corteY >= 0) faisca(corteY * dpr);
    ctx.globalCompositeOperation = "lighter";
    parts = parts.filter((p) => p.vida > 0);
    for (const p of parts) {
      p.x += p.vx; p.y += p.vy; if (p.g) p.vy += p.g; p.vida -= p.dec;
      const a = Math.max(0, p.vida);
      ctx.fillStyle = `hsla(${p.cor}, 100%, ${55 + a * 25}%, ${a})`;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r * (0.6 + a * 0.6), 0, 6.283); ctx.fill();
    }
    ctx.globalCompositeOperation = "source-over";
    requestAnimationFrame(desenhar);
  }
  requestAnimationFrame(desenhar);

  /* ---------- Progresso real (nunca anda para trás) ---------- */
  const MIN = visto ? 700 : 2200;
  const inicio = performance.now();
  let alvo = 35, mostrado = 0, fim = false;
  const subir = (v) => { alvo = Math.max(alvo, v); };
  if (document.readyState !== "loading") subir(60); else document.addEventListener("DOMContentLoaded", () => subir(60));
  document.fonts?.ready.then(() => subir(85));
  if (document.readyState === "complete") subir(100); else addEventListener("load", () => subir(100));
  setTimeout(() => subir(100), 7000);
  const frases = [[0, "Preparando a cadeira"], [40, "Afiando a tesoura"], [75, "Ligando a máquina"], [100, "Pronto"]];

  function quadro(agora) {
    const tempo = Math.max(0, Math.min(1, (agora - inicio) / MIN)) * 100;
    const teto = Math.min(alvo, tempo);
    mostrado += Math.max(0.35, (teto - mostrado) * 0.1);
    if (mostrado > teto) mostrado = teto;
    const v = Math.max(0, Math.floor(mostrado));
    pct.textContent = v; bar.style.width = v + "%"; el.setAttribute("aria-valuenow", v);
    kicker.textContent = frases.filter((f) => v >= f[0]).pop()[1];
    if (v >= 100 && !fim) { fim = true; cortar(); return; }
    requestAnimationFrame(quadro);
  }
  requestAnimationFrame(quadro);

  /* ---------- Corte com a tesoura, abertura e revelação ---------- */
  const DUR_CORTE = visto ? 550 : 1250;
  function cortar() {
    if (reduz) return abrir();
    el.classList.add("is-cutting");
    const t0 = performance.now(), tesoura = el.querySelector(".tesoura-wrap"), linha = el.querySelector(".cut-line");
    (function descer(agora) {
      const p = Math.min(1, (agora - t0) / DUR_CORTE);
      const e = p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;      // acelera e freia
      const y = -0.25 * innerHeight + e * 1.35 * innerHeight;               // de cima para fora da tela
      tesoura.style.transform = `translate3d(-50%, ${y}px, 0)`;
      const ponta = y + tesoura.offsetHeight * 0.96;                          // ponta das lâminas
      corteY = Math.min(innerHeight, Math.max(0, ponta));
      linha.style.transform = `scaleY(${(corteY / innerHeight).toFixed(4)})`;
      if (p < 1) requestAnimationFrame(descer);
      else { corteY = -1; abrir(); }
    })(t0);
  }
  function abrir() {
    el.classList.add("is-open");                    // portas de madeira se abrem
    setTimeout(() => { kicker.textContent = ""; }, 200);
    const espera = reduz ? 500 : visto ? 700 : 2000;   // tempo mostrando o barbeiro
    setTimeout(() => {
      el.classList.add("is-done");
      document.documentElement.classList.remove("is-loading");
      dispatchEvent(new Event("barbeskin:pronto"));
      setTimeout(() => { rodando = false; el.remove(); }, 900);
    }, espera);
  }
})();
