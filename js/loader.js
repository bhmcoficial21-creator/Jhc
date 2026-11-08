/* Abertura:
   1) o boneco caminha pela calçada até a porta do salão
   2) a câmera entra pela porta
   3) a capa com o nosso símbolo cobre a tela enquanto o site carrega (poste 0–100%)
   4) no 100% a capa é puxada, como no fim do corte, e o site aparece */
(function () {
  const el = document.getElementById("pageLoader");
  if (!el) return;
  const $id = (i) => document.getElementById(i);
  const pct = $id("loaderPct"), bar = $id("loaderBar"), kicker = $id("ldKicker");
  const reduz = matchMedia("(prefers-reduced-motion: reduce)").matches;
  document.documentElement.classList.add("is-loading");
  let rodando = true;

  let visto = false;
  try { visto = sessionStorage.getItem("ld-visto") === "1"; sessionStorage.setItem("ld-visto", "1"); } catch {}

  /* ---------- carregamento real ---------- */
  let carregado = document.readyState === "complete";
  if (!carregado) addEventListener("load", () => (carregado = true));
  setTimeout(() => (carregado = true), 8000);

  const ANDAR = visto || reduz ? 0 : 3600, ENTRAR = visto || reduz ? 0 : 1000, MIN_CAPA = visto ? 500 : 1500;
  const inicio = performance.now();
  let mostrado = 0;
  const frases = [[0, "Preparando a cadeira"], [45, "Afiando a tesoura"], [80, "Finalizando o corte"]];

  if (ANDAR) el.classList.add("is-walking");
  setTimeout(() => { if (ENTRAR) el.classList.add("is-entering"); }, ANDAR);
  setTimeout(mostrarCapa, ANDAR + ENTRAR);

  // a % roda o tempo todo, mas só chega a 100 quando a página carregou e a capa ficou um pouco na tela
  const TOTAL = ANDAR + ENTRAR + MIN_CAPA;
  function porcentagem() {
    const t = performance.now() - inicio;
    const alvo = Math.min(carregado ? 100 : 94, (t / TOTAL) * 100);
    mostrado += Math.max(0.3, (alvo - mostrado) * 0.12);
    if (mostrado > alvo) mostrado = alvo;
    const v = Math.max(0, Math.floor(mostrado));
    pct.textContent = v; bar.style.width = v + "%"; el.setAttribute("aria-valuenow", v);
    kicker.textContent = frases.filter((f) => v >= f[0]).pop()[1];
    return v;
  }

  /* ---------- Final: a capa com o nosso símbolo é puxada do cliente ---------- */
  const capa = new Image(); capa.src = "img/capa-messin.jpg";
  const cc = $id("ldCape"), g = cc.getContext("2d");
  let CW = 0, CH = 0, cd = 1;
  function tamCapa() { cd = Math.min(devicePixelRatio || 1, 2); CW = cc.width = innerWidth * cd; CH = cc.height = innerHeight * cd; }
  tamCapa(); addEventListener("resize", tamCapa);
  const cabelos = [];       // fiozinhos de cabelo que caem quando a capa é sacudida

  function desenharCapa(e, agora) {
    g.clearRect(0, 0, CW, CH);
    const iw = capa.naturalWidth, ih = capa.naturalHeight; if (!iw) return;
    // "cover", mantendo o símbolo (330,470) no centro da tela
    const k = Math.max(CW / iw, CH / ih) * 1.06;
    const dw = iw * k, dh = ih * k;
    const ox = Math.min(0, Math.max(CW - dw, CW / 2 - 330 * k));
    const oy = Math.min(0, Math.max(CH - dh, CH * 0.46 - 470 * k));
    const LINHAS = 140, sh = ih / LINHAS, rh = dh / LINHAS;
    // posição de cada "fio" horizontal do pano (função contínua: linhas vizinhas nunca se separam)
    const pos = (yn) => {
      const l = Math.max(0, Math.min(1, e * 1.3 - (1 - yn) * 0.06 - yn * 0.3));
      const onda = Math.sin(yn * 5.5 - agora / 110);
      const balanco = Math.sin(agora / 650 + yn * 3) * 2.5 * cd;
      const yBase = oy + yn * dh;
      return {
        l, onda,
        dx: l * l * (CW - ox + 60 * cd) * 1.05 + onda * 26 * cd * l * (1 - l) + balanco,   // para a direita até sair
        y: yBase - l * l * (yBase + 80 * cd) * 1.02 + Math.cos(yn * 4 - agora / 140) * 10 * cd * l * (1 - l),
        enc: 1 - 0.16 * l * (0.5 + 0.5 * onda),
      };
    };
    let cima = pos(0);
    for (let i = 0; i < LINHAS; i++) {
      const baixo = pos((i + 1) / LINHAS), meio = pos((i + 0.5) / LINHAS);
      const y0 = Math.min(cima.y, baixo.y), hgt = Math.abs(baixo.y - cima.y) + 1.2;
      const w = dw * meio.enc, x = ox + meio.dx + (dw - w) / 2;
      g.drawImage(capa, 0, i * sh, iw, sh + 0.5, x, y0, w, hgt);
      const sombra = meio.l * (0.12 + 0.3 * Math.max(0, meio.onda));
      if (sombra > 0.01) { g.fillStyle = `rgba(0,0,0,${sombra.toFixed(3)})`; g.fillRect(x, y0, w, hgt); }
      cima = baixo;
    }
    // cabelos caindo
    g.strokeStyle = "rgba(20,16,12,.9)"; g.lineCap = "round";
    for (const c of cabelos) {
      c.x += c.vx; c.y += c.vy; c.vy += 0.35 * cd; c.a += c.va;
      g.lineWidth = c.w; g.beginPath();
      g.moveTo(c.x, c.y); g.lineTo(c.x + Math.cos(c.a) * c.len, c.y + Math.sin(c.a) * c.len); g.stroke();
    }
  }

  function mostrarCapa() {
    const PUXAR = reduz ? 1 : 1400;
    const ir = () => {
      el.classList.add("is-cape");
      let puxando = false, tPuxar = 0;
      (function frame(agora) {
        const v = porcentagem();
        if (!puxando && v >= 100) {
          puxando = true; tPuxar = agora + 250;           // um respiro no 100% antes do puxão
          setTimeout(() => {
            el.classList.add("is-pulling");                 // o site aparece por trás da capa
            document.documentElement.classList.remove("is-loading");
            dispatchEvent(new Event("barbeskin:pronto"));
            if (!reduz) for (let i = 0; i < 90; i++) cabelos.push({
              x: CW * (0.15 + Math.random() * 0.7), y: CH * (0.25 + Math.random() * 0.5),
              vx: (Math.random() - 0.3) * 4 * cd, vy: (Math.random() - 0.6) * 5 * cd, a: Math.random() * 6.28, va: (Math.random() - 0.5) * 0.3,
              len: (3 + Math.random() * 7) * cd, w: (0.8 + Math.random() * 0.9) * cd });
          }, 250);
        }
        const p = puxando ? Math.max(0, Math.min(1, (agora - tPuxar) / PUXAR)) : 0;
        const e = p < 1 ? p * p * (3 - 2 * p) * 0.35 + p * p * 0.65 : 1;
        desenharCapa(e, agora);
        if (p < 1 || cabelos.some((c) => c.y < CH)) requestAnimationFrame(frame);
        else { el.classList.add("is-done"); setTimeout(() => { rodando = false; el.remove(); }, 500); }
      })(performance.now());
    };
    if (capa.complete && capa.naturalWidth) ir();
    else { capa.onload = ir; capa.onerror = () => { el.classList.add("is-done"); document.documentElement.classList.remove("is-loading"); dispatchEvent(new Event("barbeskin:pronto")); }; }
  }
})();
