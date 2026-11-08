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
  const DESENHO = 450, SOLIDO = 650, SAIDA = 120;          // ms de cada ferramenta
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
    if (v >= 100 && t >= TOTAL && !final) { final = true; (visto || reduz ? mostrarCapa : mostrarGancho)(); return; }
    requestAnimationFrame(quadro);
  }
  requestAnimationFrame(quadro);


  /* ---------- Gancho: boneco + "segure para mudar o estilo" ---------- */
  function mostrarGancho() {
    const hook = $id("hook");
    if (!hook) return mostrarCapa();
    ferramentas.forEach((t) => t.classList.add("is-out"));
    el.classList.add("is-hook");
    const modos = [...hook.querySelectorAll(".hook-mode")];
    const nomes = ["Modo Ouro", "Modo Gelo", "Modo Brasa"];
    const nomeEl = $id("hookModo"), btn = $id("holdBtn"), anel = $id("holdRing");
    let atual = 0, trocando = false, interagiu = false, acabou = false, auto, inativo;

    function trocar(xPct, yPct) {
      if (trocando) return; trocando = true;
      const prox = (atual + 1) % modos.length, entra = modos[prox];
      entra.style.setProperty("--cx", xPct + "%"); entra.style.setProperty("--cy", yPct + "%");
      entra.classList.add("is-in");
      nomeEl.textContent = nomes[prox];
      if (navigator.vibrate) try { navigator.vibrate(12); } catch {}
      setTimeout(() => {
        modos[atual].classList.remove("is-on");
        entra.classList.remove("is-in"); entra.classList.add("is-on");
        atual = prox; trocando = false;
      }, 900);
    }
    const doBotao = () => { const r = btn.getBoundingClientRect(); return [((r.left + r.width / 2) / innerWidth) * 100, ((r.top + r.height / 2) / innerHeight) * 100]; };

    // segurar o botão enche o anel; cheio = troca de modo
    let segurando = 0, prog = 0;
    function encher(agora) {
      if (!segurando) return;
      prog = Math.min(1, (agora - segurando) / 650);
      anel.style.strokeDashoffset = 1 - prog;
      if (prog >= 1) { trocar(...doBotao()); segurando = agora; }   // continua trocando se não soltar
      requestAnimationFrame(encher);
    }
    const apertar = (e) => { e.preventDefault(); interagiu = true; clearTimeout(auto); reiniciarInativo(); btn.classList.add("is-down"); segurando = performance.now(); requestAnimationFrame(encher); };
    const soltar = () => { segurando = 0; btn.classList.remove("is-down"); anel.style.transition = "stroke-dashoffset .3s"; anel.style.strokeDashoffset = 1; setTimeout(() => (anel.style.transition = ""), 300); };
    btn.addEventListener("pointerdown", apertar);
    ["pointerup", "pointerleave", "pointercancel"].forEach((ev) => btn.addEventListener(ev, soltar));
    btn.addEventListener("keydown", (e) => { if (e.key === " " || e.key === "Enter") { e.preventDefault(); interagiu = true; reiniciarInativo(); trocar(...doBotao()); } });

    // o boneco acompanha o dedo/mouse
    const figs = [...hook.querySelectorAll(".hook-fig")];
    hook.addEventListener("pointermove", (e) => {
      const nx = e.clientX / innerWidth - 0.5, ny = e.clientY / innerHeight - 0.5;
      figs.forEach((f) => { f.style.setProperty("--ry", (nx * 22).toFixed(1) + "deg"); f.style.setProperty("--rx", (-ny * 10).toFixed(1) + "deg"); });
    });

    function sair() {
      if (acabou) return; acabou = true;
      clearTimeout(auto); clearTimeout(inativo);
      mostrarCapa();
    }
    function reiniciarInativo() { clearTimeout(inativo); inativo = setTimeout(sair, 6000); }
    $id("hookEnter").addEventListener("click", sair);

    // sem interação: mostra os 3 modos sozinho e segue para a capa
    let passos = 0;
    (function ciclo() {
      auto = setTimeout(() => {
        if (interagiu) return;
        if (passos < modos.length - 1) { passos++; trocar(...doBotao()); ciclo(); }
        else setTimeout(() => !interagiu && sair(), 400);
      }, 1700);
    })();
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
    ferramentas.forEach((t) => t.classList.add("is-out"));
    kicker.textContent = "Finalizando o corte";
    el.classList.remove("is-hook-ui");
    const HOLD = reduz ? 200 : visto ? 450 : 1100, PUXAR = reduz ? 1 : 1400;
    const ir = () => {
      el.classList.add("is-cape");
      const t0 = performance.now();
      let puxando = false;
      (function frame(agora) {
        const t = agora - t0;
        const p = Math.max(0, Math.min(1, (t - HOLD) / PUXAR));
        if (p > 0 && !puxando) {
          puxando = true;
          el.classList.add("is-pulling");                 // o site aparece por trás da capa
          document.documentElement.classList.remove("is-loading");
          dispatchEvent(new Event("barbeskin:pronto"));
          if (!reduz) for (let i = 0; i < 90; i++) cabelos.push({
            x: CW * (0.15 + Math.random() * 0.7), y: CH * (0.25 + Math.random() * 0.5),
            vx: (Math.random() - 0.3) * 4 * cd, vy: (Math.random() - 0.6) * 5 * cd, a: Math.random() * 6.28, va: (Math.random() - 0.5) * 0.3,
            len: (3 + Math.random() * 7) * cd, w: (0.8 + Math.random() * 0.9) * cd });
        }
        const e = p < 1 ? p * p * (3 - 2 * p) * 0.35 + p * p * 0.65 : 1;   // arranque rápido, como um puxão
        desenharCapa(e, agora);
        if (p < 1 || cabelos.some((c) => c.y < CH)) requestAnimationFrame(frame);
        else { el.classList.add("is-done"); setTimeout(() => { rodando = false; el.remove(); }, 500); }
      })(t0);
    };
    if (capa.complete && capa.naturalWidth) ir(); else { capa.onload = ir; capa.onerror = () => { el.classList.add("is-done"); document.documentElement.classList.remove("is-loading"); dispatchEvent(new Event("barbeskin:pronto")); }; }
  }
})();
