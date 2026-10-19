/* VISOR 3D — a foto REAL da camisa vira uma peça de vitrine que gira (frente e verso).
   Frente: foto do produto (ou view3d.front).  Verso: foto das costas (view3d.back).
   Sem foto das costas, o verso é o selo do cofre JSD™.
   three.js fica em assets/vendor/ e só é baixado quando o visualizador chega perto da tela. */
window.JSDViewer3D = (function () {
  const CFG = window.JSD_CONFIG;
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  let loading = null;

  function ensure() {
    if (window.THREE) return Promise.resolve(true);
    if (!loading) loading = new Promise(res => {
      const s = document.createElement("script");
      s.src = "assets/vendor/three.min.js";
      s.onload = () => res(!!window.THREE); s.onerror = () => res(false);
      document.head.appendChild(s);
    });
    return loading;
  }
  function webgl() {
    try { const c = document.createElement("canvas"); return !!(c.getContext("webgl2") || c.getContext("webgl")); } catch (e) { return false; }
  }
  const supported = () => !!window.THREE && webgl();
  const loadImg = src => new Promise(res => { if (!src) return res(null); const im = new Image(); im.onload = () => res(im); im.onerror = () => res(null); im.src = src; });

  const CW = 1200, CH = 1440; // textura 5:6
  function coverCanvas(img) {
    const c = document.createElement("canvas"); c.width = CW; c.height = CH;
    const g = c.getContext("2d"); g.fillStyle = "#0b0b0b"; g.fillRect(0, 0, CW, CH);
    const s = Math.max(CW / img.naturalWidth, CH / img.naturalHeight);
    g.drawImage(img, (CW - img.naturalWidth * s) / 2, (CH - img.naturalHeight * s) / 2, img.naturalWidth * s, img.naturalHeight * s);
    return c;
  }
  /* verso com a marca: placa preta com logo prateado */
  function brandCanvas(logo) {
    const c = document.createElement("canvas"); c.width = CW; c.height = CH;
    const g = c.getContext("2d");
    const bg = g.createLinearGradient(0, 0, CW, CH); bg.addColorStop(0, "#1d1d1d"); bg.addColorStop(0.5, "#080808"); bg.addColorStop(1, "#1a1a1a");
    g.fillStyle = bg; g.fillRect(0, 0, CW, CH);
    g.strokeStyle = "rgba(220,220,220,.5)"; g.lineWidth = 3; g.strokeRect(46, 46, CW - 92, CH - 92);
    g.strokeStyle = "rgba(220,220,220,.18)"; g.lineWidth = 1.5; g.strokeRect(70, 70, CW - 140, CH - 140);
    g.save(); g.globalAlpha = 0.06; g.strokeStyle = "#fff"; g.lineWidth = 2;
    for (let i = -CH; i < CW; i += 26) { g.beginPath(); g.moveTo(i, CH); g.lineTo(i + CH, 0); g.stroke(); } g.restore();
    if (logo) g.drawImage(logo, CW / 2 - 260, CH / 2 - 340, 520, 520);
    g.textAlign = "center"; g.fillStyle = "#f2f2f2"; g.font = "italic 600 120px 'Bodoni Moda', Georgia, serif"; g.fillText("JSD™", CW / 2, CH / 2 + 300);
    g.fillStyle = "#b9b9b9"; g.font = "600 34px Inter, Arial, sans-serif";
    try { g.letterSpacing = "12px"; } catch (e) { /* sem suporte */ }
    g.fillText("PRIVATE • VAULT DROP", CW / 2 + 6, CH / 2 + 380);
    return c;
  }
  function roundedRect(T, w, h, r) {
    const s = new T.Shape(), x = -w / 2, y = -h / 2;
    s.moveTo(x + r, y); s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r); s.lineTo(x + w, y + h - r);
    s.quadraticCurveTo(x + w, y + h, x + w - r, y + h); s.lineTo(x + r, y + h); s.quadraticCurveTo(x, y + h, x, y + h - r);
    s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y); return s;
  }

  function create(host, product) {
    const T = window.THREE, CWD = 1.5, CHT = 1.8, TH = 0.045;
    host.innerHTML = `
      <div class="v360__stage v360__stage--card" tabindex="-1">
        <span class="v360__hint" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M3 12a9 9 0 0 1 15-6.7M21 12a9 9 0 0 1-15 6.7M18 2v4h-4M6 22v-4h4" fill="none" stroke="currentColor" stroke-width="1.6"/></svg>Arraste para girar</span>
        <span class="v360__side" aria-hidden="true"></span>
      </div>
      <div class="v360__seg" role="group" aria-label="Lado da camisa"><button type="button" data-face="0" aria-pressed="true"></button><button type="button" data-face="1" aria-pressed="false"></button></div>`;
    const stage = host.querySelector(".v360__stage"), sideEl = host.querySelector(".v360__side");
    const segs = [...host.querySelectorAll(".v360__seg button")];
    const renderer = new T.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
    renderer.domElement.className = "v360__canvas"; renderer.domElement.setAttribute("role", "img");
    stage.insertBefore(renderer.domElement, stage.firstChild);

    const scene = new T.Scene(), camera = new T.PerspectiveCamera(30, 1, 0.1, 50);
    camera.position.set(0, 0, 4.55);
    scene.add(new T.HemisphereLight(0xffffff, 0x2a2a2a, 0.85));
    const key = new T.DirectionalLight(0xffffff, 0.85); key.position.set(2.2, 2.8, 4); scene.add(key);
    const rim = new T.DirectionalLight(0xffffff, 0.45); rim.position.set(-3, 1, -3.5); scene.add(rim);
    const rimF = new T.DirectionalLight(0xffffff, 0.25); rimF.position.set(-3, 0.5, 3); scene.add(rimF);

    const own = [], keep = o => (own.push(o), o);
    const group = new T.Group(); scene.add(group);
    const shape = roundedRect(T, CWD, CHT, 0.06);
    const faceGeo = keep(new T.ShapeGeometry(shape, 10));
    const uv = faceGeo.attributes.uv, pos = faceGeo.attributes.position;
    for (let i = 0; i < pos.count; i++) uv.setXY(i, pos.getX(i) / CWD + 0.5, pos.getY(i) / CHT + 0.5);
    const edge = new T.Mesh(keep(new T.ExtrudeGeometry(shape, { depth: TH, bevelEnabled: false, curveSegments: 10 })), keep(new T.MeshStandardMaterial({ color: 0x9a9a9a, metalness: 0.7, roughness: 0.3 })));
    edge.position.z = -TH / 2; group.add(edge);
    const mk = () => keep(new T.MeshPhysicalMaterial({ color: 0xffffff, roughness: 0.42, metalness: 0, clearcoat: 0.55, clearcoatRoughness: 0.25 }));
    const frontMat = mk(), backMat = mk();
    const front = new T.Mesh(faceGeo, frontMat); front.position.z = TH / 2 + 0.0008; group.add(front);
    const back = new T.Mesh(faceGeo, backMat); back.rotation.y = Math.PI; back.position.z = -TH / 2 - 0.0008; group.add(back);

    const sc = document.createElement("canvas"); sc.width = sc.height = 128;
    const sg = sc.getContext("2d"), gr = sg.createRadialGradient(64, 64, 2, 64, 64, 62);
    gr.addColorStop(0, "rgba(0,0,0,.6)"); gr.addColorStop(1, "rgba(0,0,0,0)"); sg.fillStyle = gr; sg.fillRect(0, 0, 128, 128);
    const shadow = new T.Mesh(keep(new T.PlaneGeometry(2.4, 0.8)), keep(new T.MeshBasicMaterial({ map: keep(new T.CanvasTexture(sc)), transparent: true, depthWrite: false })));
    shadow.rotation.x = -Math.PI / 2; shadow.position.y = -1.22; scene.add(shadow);

    // conteúdo das duas faces
    let labels = ["Frente", "Cofre"], dead = false;
    function setProduct(p) {
      const v = p.view3d || {}, frontSrc = v.front || (p.images && p.images[0] && (p.images[0].src || p.images[0]));
      labels = [v.frontLabel || "Frente", v.back ? (v.backLabel || "Costas") : "Cofre"];
      segs[0].textContent = labels[0]; segs[1].textContent = labels[1];
      renderer.domElement.setAttribute("aria-label", `${p.name}: foto da peça em 3D. Arraste para girar entre ${labels[0].toLowerCase()} e ${labels[1].toLowerCase()}.`);
      Promise.all([loadImg(frontSrc), loadImg(v.back), loadImg(CFG.brand.logo)]).then(([f, b, logo]) => {
        if (dead) return;
        [[frontMat, f ? coverCanvas(f) : brandCanvas(logo)], [backMat, b ? coverCanvas(b) : brandCanvas(logo)]].forEach(([m, cv]) => {
          if (m.map) m.map.dispose(); const t = new T.CanvasTexture(cv); t.anisotropy = renderer.capabilities.getMaxAnisotropy(); m.map = t; m.needsUpdate = true;
        });
      });
    }
    setProduct(product);

    // movimento
    const PI = Math.PI;
    let rot = -0.9, vel = 0, drag = false, lastX = 0, visible = true, raf = 0, last = performance.now(), t0 = last, target = 0, moved = false;
    const face = () => ((Math.round(rot / PI) % 2) + 2) % 2;
    const faceTarget = f => f * PI + 2 * PI * Math.round((rot - f * PI) / (2 * PI));
    function snapTo(f) { target = faceTarget(f); vel = 0; }
    function draw(now) {
      const bob = reduce ? 0 : Math.sin((now - t0) / 1000 * 1.3);
      group.rotation.y = rot; group.rotation.x = reduce ? 0 : bob * 0.025 - 0.03; group.position.y = reduce ? 0 : bob * 0.035;
      shadow.scale.set(0.55 + 0.45 * Math.abs(Math.cos(rot)), 1, 1); shadow.material.opacity = 0.8 - bob * 0.15;
      const f = Math.abs(Math.cos(rot)) < 0.12 ? -1 : (Math.cos(rot) > 0 ? 0 : 1);
      if (f >= 0) { sideEl.textContent = labels[f]; segs.forEach((b, i) => b.setAttribute("aria-pressed", String(i === f))); }
      renderer.render(scene, camera);
    }
    function loop(now) {
      if (dead) return; raf = requestAnimationFrame(loop);
      const dt = Math.min(0.05, (now - last) / 1000); last = now;
      if (!visible) return;
      if (!drag) {
        if (Math.abs(vel) > 0.004) { rot += vel; vel *= 0.93; }
        else { rot += (target - rot) * Math.min(1, dt * 5); }
      }
      draw(now);
    }
    const down = e => { drag = true; moved = false; lastX = e.clientX; vel = 0; stage.setPointerCapture(e.pointerId); stage.classList.add("is-drag"); };
    const move = e => { if (!drag) return; const d = (e.clientX - lastX) * 0.012; lastX = e.clientX; if (Math.abs(d) > 0.001) moved = true; rot += d; vel = d; };
    const up = () => { if (!drag) return; drag = false; stage.classList.remove("is-drag"); target = Math.round((rot + vel * 12) / PI) * PI; };
    stage.addEventListener("pointerdown", down); stage.addEventListener("pointermove", move);
    stage.addEventListener("pointerup", up); stage.addEventListener("pointercancel", up);
    stage.addEventListener("dblclick", () => snapTo(1 - face()));
    segs.forEach(b => b.addEventListener("click", () => snapTo(+b.dataset.face)));
    // entrada: começa girado e assenta na frente
    target = 0;

    const ro = new ResizeObserver(() => {
      const r = stage.getBoundingClientRect(); if (!r.width) return;
      renderer.setSize(r.width, r.height, false); renderer.domElement.style.width = "100%"; renderer.domElement.style.height = "100%";
      camera.aspect = r.width / r.height; camera.updateProjectionMatrix();
    });
    ro.observe(stage);
    const io = new IntersectionObserver(es => { visible = es[0].isIntersecting; }); io.observe(host);
    raf = requestAnimationFrame(loop);

    return {
      destroy() { dead = true; cancelAnimationFrame(raf); ro.disconnect(); io.disconnect(); own.forEach(o => o.dispose && o.dispose()); [frontMat, backMat].forEach(m => m.map && m.map.dispose()); renderer.dispose(); host.innerHTML = ""; },
      set(p) { setProduct(p); rot = -0.9; vel = 0; target = 0; }
    };
  }
  return { ensure, supported, create };
})();
