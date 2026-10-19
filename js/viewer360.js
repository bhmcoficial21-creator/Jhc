/* VISUALIZADOR 360° — arrastar com o dedo/mouse gira a sequência de fotos.
   Sem fotos em assets/360/<id>/, usa um modelo provisório desenhado em canvas. */
window.JSDViewer360 = (function () {
  const CFG = window.JSD_CONFIG, PH = window.JSDPlaceholders;
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

  function frameUrl(id, n) {
    return CFG.viewer360.framePattern.replace("{id}", id).replace("{n}", String(n + 1).padStart(2, "0"));
  }

  function create(host, product) {
    const total = CFG.viewer360.frameCount;
    host.innerHTML = `
      <div class="v360__stage" tabindex="-1">
        <canvas class="v360__canvas" role="img" aria-label="Modelo vestindo ${product.name}, em visualização 360°. Arraste para girar."></canvas>
        <span class="v360__hint" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M3 12a9 9 0 0 1 15-6.7M21 12a9 9 0 0 1-15 6.7M18 2v4h-4M6 22v-4h4" fill="none" stroke="currentColor" stroke-width="1.6"/></svg>360° · arraste</span>
      </div>
      <label class="v360__range"><span>Girar</span><input type="range" min="0" max="${total - 1}" value="0" aria-label="Girar a peça"></label>`;
    const cv = host.querySelector("canvas"), ctx = cv.getContext("2d"), range = host.querySelector("input");
    const stage = host.querySelector(".v360__stage");
    let frames = null, pos = 0, vel = 0, drag = false, lastX = 0, raf = 0, dead = false, auto = !reduce;

    function size() {
      const r = stage.getBoundingClientRect(), dpr = Math.min(devicePixelRatio || 1, 2);
      cv.width = Math.round(r.width * dpr); cv.height = Math.round(r.height * dpr); draw();
    }
    function draw() {
      const i = ((Math.round(pos) % total) + total) % total;
      if (frames && frames[i] && frames[i].complete && frames[i].naturalWidth) {
        const im = frames[i], s = Math.max(cv.width / im.naturalWidth, cv.height / im.naturalHeight);
        ctx.fillStyle = "#0c0c0c"; ctx.fillRect(0, 0, cv.width, cv.height);
        ctx.drawImage(im, (cv.width - im.naturalWidth * s) / 2, (cv.height - im.naturalHeight * s) / 2, im.naturalWidth * s, im.naturalHeight * s);
      } else {
        const base = (product.colors[0] || { hex: "#888" }).hex, n = parseInt(base.slice(1), 16);
        const l = (0.2126 * (n >> 16) + 0.7152 * ((n >> 8) & 255) + 0.0722 * (n & 255)) / 255;
        PH.drawSpin(ctx, cv.width, cv.height, (i / total) * Math.PI * 2, 0.7 + l * 0.6);
      }
      range.value = i;
    }
    // tenta carregar fotos reais
    const probe = new Image();
    probe.onload = () => {
      frames = Array.from({ length: total }, (_, n) => { const im = new Image(); im.src = frameUrl(product.id, n); im.onload = draw; return im; });
      draw();
    };
    probe.src = frameUrl(product.id, 0);

    function loop() {
      if (dead) return;
      if (!drag) {
        if (Math.abs(vel) > 0.01) { pos += vel; vel *= 0.94; draw(); }
        else if (auto) { pos += 0.06; draw(); }
      }
      raf = requestAnimationFrame(loop);
    }
    function down(e) { drag = true; auto = false; lastX = e.clientX; vel = 0; stage.setPointerCapture(e.pointerId); stage.classList.add("is-drag"); }
    function move(e) {
      if (!drag) return; const dx = e.clientX - lastX; lastX = e.clientX;
      const step = dx / (stage.clientWidth / total) * 1.8; pos -= step; vel = -step; draw();
    }
    function up() { drag = false; stage.classList.remove("is-drag"); }
    stage.addEventListener("pointerdown", down); stage.addEventListener("pointermove", move);
    stage.addEventListener("pointerup", up); stage.addEventListener("pointercancel", up);
    range.addEventListener("input", () => { auto = false; vel = 0; pos = +range.value; draw(); });
    const ro = new ResizeObserver(size); ro.observe(stage);
    const io = new IntersectionObserver(es => { const on = es[0].isIntersecting; if (on && !raf) loop(); if (!on) { cancelAnimationFrame(raf); raf = 0; } });
    io.observe(host);
    size();
    return { destroy() { dead = true; cancelAnimationFrame(raf); ro.disconnect(); io.disconnect(); }, set(p) { product = p; frames = null; const pr = new Image(); pr.onload = () => { frames = Array.from({ length: total }, (_, n) => { const im = new Image(); im.src = frameUrl(p.id, n); im.onload = draw; return im; }); draw(); }; pr.src = frameUrl(p.id, 0); cv.setAttribute("aria-label", `Modelo vestindo ${p.name}, em visualização 360°. Arraste para girar.`); draw(); } };
  }
  return { create };
})();
