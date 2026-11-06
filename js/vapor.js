/* Efeito "vapor": o nome se forma a partir de partículas, fica nítido
   e depois se desfaz em fumaça para a direita, em ciclo. */
(function () {
  const h1 = document.querySelector(".hero-title");
  if (!h1 || matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const linhas = (h1.dataset.text || h1.textContent).toUpperCase().split(/\s+/).filter(Boolean);
  const canvas = document.createElement("canvas");
  canvas.className = "vapor-canvas";
  canvas.setAttribute("aria-hidden", "true");
  const ctx = canvas.getContext("2d");
  const off = document.createElement("canvas");
  const octx = off.getContext("2d", { willReadFrequently: true });

  // Linha do tempo (segundos)
  const FORMA = 1.8, PARADO = 3.4, VAPOR = 2.4, PAUSA = 0.7;
  const CICLO = FORMA + PARADO + VAPOR + PAUSA;

  let parts = [], dpr = 1, fs = 0, padL = 0, padT = 0, tLeft = 0, tWidth = 1, cor = "#fff";
  let inicio = performance.now(), raf = 0, visivel = true;

  const clamp = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
  const easeOut = (v) => 1 - Math.pow(1 - v, 3);

  function montar() {
    const r = h1.getBoundingClientRect();
    const cs = getComputedStyle(h1);
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    fs = parseFloat(cs.fontSize);
    cor = cs.getPropertyValue("--vapor-color").trim() || "#fff";
    const lh = fs * 0.85;
    padL = fs * 0.5; padT = fs * 0.5;
    const cw = r.width + padL + fs * 2.2, ch = r.height + padT * 2;
    Object.assign(canvas.style, { left: -padL + "px", top: -padT + "px", width: cw + "px", height: ch + "px" });
    canvas.width = off.width = Math.round(cw * dpr);
    canvas.height = off.height = Math.round(ch * dpr);

    octx.setTransform(dpr, 0, 0, dpr, 0, 0);
    octx.clearRect(0, 0, cw, ch);
    octx.font = `400 ${fs}px ${cs.fontFamily}`;
    octx.fillStyle = cor;
    octx.textBaseline = "alphabetic";
    const m = octx.measureText("H");
    const asc = m.fontBoundingBoxAscent ?? fs * 0.8, desc = m.fontBoundingBoxDescent ?? fs * 0.2;
    linhas.forEach((txt, i) => {
      const base = padT + i * lh + lh / 2 + (asc - desc) / 2;
      octx.fillText(txt, padL, base);
    });

    // Amostra os pixels do texto para criar as partículas
    const img = octx.getImageData(0, 0, off.width, off.height).data;
    const passo = Math.max(2, Math.round((fs * dpr) / 50));
    parts = [];
    let minX = Infinity, maxX = -Infinity;
    for (let y = 0; y < off.height; y += passo) {
      for (let x = 0; x < off.width; x += passo) {
        if (img[(y * off.width + x) * 4 + 3] > 128) {
          parts.push({ x: (x + Math.random() * passo) / dpr, y: (y + Math.random() * passo) / dpr, r1: Math.random(), r2: Math.random(), r3: Math.random() });
          if (x < minX) minX = x; if (x > maxX) maxX = x;
        }
      }
    }
    tLeft = minX / dpr; tWidth = Math.max(1, (maxX - minX + passo * 2) / dpr);
    parts.forEach((p) => (p.nx = (p.x - tLeft) / tWidth));
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function nitido(x0, x1) {
    if (x1 <= x0) return;
    ctx.save();
    ctx.beginPath(); ctx.rect(x0, 0, x1 - x0, canvas.height); ctx.clip();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.drawImage(off, 0, 0);
    ctx.restore();
  }

  function quadro(agora) {
    raf = 0;
    const W = canvas.width / dpr, H = canvas.height / dpr;
    ctx.clearRect(0, 0, W, H);
    const t = ((agora - inicio) / 1000) % CICLO;
    const tam = Math.max(1.2, fs / 70);
    ctx.fillStyle = cor;

    if (t < FORMA) {
      // Partículas se juntam da esquerda para a direita
      const D = FORMA;
      const feito = clamp((t - 0.45 * D) / (0.55 * D));
      nitido(0, tLeft + feito * tWidth);
      for (const p of parts) {
        const lp = clamp((t - p.nx * 0.55 * D) / (0.45 * D));
        if (lp >= 1 || lp <= 0) continue;
        const e = easeOut(lp), inv = 1 - e;
        const x = p.x - inv * fs * (0.4 + p.r1 * 1.2);
        const y = p.y + inv * (p.r2 - 0.5) * fs * 0.9;
        ctx.globalAlpha = 0.25 + 0.75 * lp;
        ctx.fillRect(x, y, tam, tam);
      }
    } else if (t < FORMA + PARADO) {
      nitido(0, W);
    } else if (t < FORMA + PARADO + VAPOR) {
      // Desfaz em vapor da esquerda para a direita
      const D = VAPOR, tv = t - FORMA - PARADO;
      const varrido = clamp(tv / (0.5 * D));
      if (varrido < 1) nitido(tLeft + varrido * tWidth, W);
      for (const p of parts) {
        const lp = clamp((tv - p.nx * 0.5 * D) / (0.5 * D));
        if (lp <= 0 || lp >= 1) continue;
        const k = Math.pow(lp, 1.4);
        const x = p.x + k * fs * (0.6 + p.r1 * 1.8);
        const y = p.y + k * ((p.r2 - 0.5) * fs * 0.7 - fs * 0.12) + Math.sin(lp * 7 + p.r3 * 12) * fs * 0.025 * lp;
        ctx.globalAlpha = (1 - lp) * (0.6 + 0.4 * p.r3);
        ctx.fillRect(x, y, tam, tam);
      }
    }
    ctx.globalAlpha = 1;
    if (visivel && !document.hidden) raf = requestAnimationFrame(quadro);
  }

  const tocar = () => { if (!raf && visivel && !document.hidden) raf = requestAnimationFrame(quadro); };

  async function iniciar() {
    try { await document.fonts.load(`400 100px "Bebas Neue"`); await document.fonts.ready; } catch {}
    // Espera a tela de carregamento sair para o nome se formar à vista
    if (document.getElementById("pageLoader")) await new Promise((ok) => { addEventListener("barbeskin:pronto", ok, { once: true }); setTimeout(ok, 6000); });
    h1.appendChild(canvas);
    h1.classList.add("is-vapor");
    montar();
    inicio = performance.now();
    tocar();
  }

  new IntersectionObserver(([en]) => { visivel = en.isIntersecting; tocar(); }).observe(h1);
  document.addEventListener("visibilitychange", tocar);
  let rt;
  addEventListener("resize", () => { clearTimeout(rt); rt = setTimeout(montar, 150); });
  iniciar();
})();
