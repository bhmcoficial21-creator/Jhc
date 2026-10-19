/* MANEQUIM 3D — camisa vestida em um manequim que gira ao arrastar (frente, costas e lados).
   O desenho de cada camisa vem do campo `kit` de cada produto em config.js.
   three.js fica em assets/vendor/ e só é baixado quando o visualizador aparece na tela. */
window.JSDViewer3D = (function () {
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

  function rng(seed) { let a = seed >>> 0; return () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

  /* ---------- pintura da camisa (textura enrolada no tronco) ----------
     x = 0 e x = W: centro da FRENTE · x = W/2: centro das COSTAS · y = 0: gola · y = H: barra */
  const W = 2048, H = 1024;
  function paint(kit, tank) {
    const c = document.createElement("canvas"); c.width = W; c.height = H;
    const g = c.getContext("2d"), rand = rng(7);
    g.fillStyle = kit.base; g.fillRect(0, 0, W, H);
    const wrap = fn => { fn(0); fn(W); };

    if (kit.pattern === "stripes") {
      const n = kit.stripes || 20, w = W / n;
      for (let i = 0; i < n; i += 2) { g.fillStyle = kit.accent; const x0 = i * w - w / 2; g.fillRect(x0, 0, w, H); if (x0 < 0) g.fillRect(x0 + W, 0, w, H); }
    } else if (kit.pattern === "cross") {
      const y0 = H * 0.40, y1 = H * 0.62, vx = W * 0.90;
      g.fillStyle = "#fff"; g.fillRect(0, y0 - 14, W, y1 - y0 + 28); g.fillRect(vx - 56, 0, 112, H);
      g.fillStyle = kit.accent; g.fillRect(0, y0, W, y1 - y0); g.fillRect(vx - 42, 0, 84, H);
    } else if (kit.pattern === "swirl") {
      g.lineCap = "round";
      for (let i = 0; i < 70; i++) {
        const x = rand() * W, y = rand() * H, r = 60 + rand() * 160;
        g.strokeStyle = rand() > 0.35 ? kit.accent : "#cfd6ff"; g.lineWidth = 3 + rand() * 9; g.globalAlpha = 0.9;
        g.beginPath(); g.arc(x, y, r, rand() * 6, rand() * 6 + 1.6 + rand() * 2); g.stroke();
      }
      g.globalAlpha = 1;
    } else if (kit.pattern === "camo") {
      g.fillStyle = kit.accent; g.globalAlpha = 0.85;
      for (let i = 0; i < 90; i++) { g.beginPath(); g.ellipse(rand() * W, rand() * H, 30 + rand() * 90, 20 + rand() * 120, rand() * 3, 0, 7); g.fill(); }
      g.globalAlpha = 1;
    }
    // trama do tecido
    g.fillStyle = "rgba(0,0,0,.045)"; for (let x = 0; x < W; x += 5) g.fillRect(x, 0, 1.5, H);
    g.fillStyle = "rgba(255,255,255,.035)"; for (let y = 0; y < H; y += 6) g.fillRect(0, y, W, 1);

    // escudo no peito (lado direito de quem olha)
    if (kit.crest) {
      const x = W * 0.058, y = H * 0.31;
      g.fillStyle = kit.crest; g.strokeStyle = kit.crestLine || "rgba(255,255,255,.55)"; g.lineWidth = 5;
      g.beginPath(); g.moveTo(x - 38, y - 44); g.lineTo(x + 38, y - 44); g.lineTo(x + 38, y + 14); g.quadraticCurveTo(x + 38, y + 56, x, y + 70); g.quadraticCurveTo(x - 38, y + 56, x - 38, y + 14); g.closePath(); g.fill(); g.stroke();
    }
    g.textAlign = "center"; g.textBaseline = "middle";
    // texto grande na frente (patrocínio / nome)
    if (kit.sponsor) wrap(dx => { g.fillStyle = kit.sponsor.color || "#fff"; g.font = `700 ${kit.sponsor.size || 110}px Georgia, serif`; g.fillText(kit.sponsor.text, dx, H * (kit.sponsor.y || 0.5)); });
    if (kit.frontNumber) wrap(dx => { g.fillStyle = kit.frontNumber.color; g.font = `800 ${kit.frontNumber.size || 230}px Impact, "Arial Black", sans-serif`; g.fillText(kit.frontNumber.text, dx, H * (kit.frontNumber.y || 0.48)); });
    // costas
    if (kit.back) {
      const b = kit.back;
      if (b.name) { g.fillStyle = b.color; g.font = `800 ${b.nameSize || 120}px Impact, "Arial Black", sans-serif`; g.fillText(b.name, W / 2, H * 0.27); }
      if (b.number) { g.fillStyle = b.color; g.strokeStyle = b.outline || "rgba(0,0,0,.35)"; g.lineWidth = 8; g.font = `800 ${b.numberSize || 430}px Impact, "Arial Black", sans-serif`; g.strokeText(b.number, W / 2, H * 0.58); g.fillText(b.number, W / 2, H * 0.58); }
    }
    // regata: recorta cavas e decote
    if (tank) {
      g.globalCompositeOperation = "destination-out"; g.fillStyle = "#000";
      [W * 0.25, W * 0.75].forEach(x => { g.beginPath(); g.ellipse(x, -H * 0.02, W * 0.075, H * 0.40, 0, 0, 7); g.fill(); });
      wrap(dx => { g.beginPath(); g.ellipse(dx, -H * 0.02, W * 0.075, H * 0.17, 0, 0, 7); g.fill(); });
      g.beginPath(); g.ellipse(W / 2, -H * 0.02, W * 0.075, H * 0.08, 0, 0, 7); g.fill();
      g.globalCompositeOperation = "source-over";
    }
    return c;
  }

  /* ---------- geometrias ---------- */
  const PTS = [[-0.75, .41], [-0.55, .40], [-0.25, .385], [0, .39], [0.25, .43], [0.45, .455], [0.6, .465], [0.7, .42], [0.78, .30], [0.85, .19], [0.92, .14]];
  const Y0 = -0.70, Y1 = 0.92, SX = 1.12, SZ = 0.72;
  function lathe(offset, y0) {
    const T = window.THREE, curve = new T.SplineCurve(PTS.map(p => new T.Vector2(p[1] + offset, p[0])));
    const g = new T.LatheGeometry(curve.getPoints(90).filter(p => p.y >= y0), 72);
    const pos = g.attributes.position, uv = g.attributes.uv;
    for (let i = 0; i < pos.count; i++) uv.setY(i, (pos.getY(i) - Y0) / (Y1 - Y0));
    return g;
  }

  function create(host, product) {
    const T = window.THREE, total = 36;
    host.innerHTML = `
      <div class="v360__stage" tabindex="-1">
        <span class="v360__hint" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M3 12a9 9 0 0 1 15-6.7M21 12a9 9 0 0 1-15 6.7M18 2v4h-4M6 22v-4h4" fill="none" stroke="currentColor" stroke-width="1.6"/></svg>3D · arraste</span>
        <span class="v360__side" id="v3dSide" aria-hidden="true">Frente</span>
      </div>
      <label class="v360__range"><span>Girar</span><input type="range" min="0" max="${total - 1}" value="0" aria-label="Girar o manequim"></label>`;
    const stage = host.querySelector(".v360__stage"), range = host.querySelector("input"), sideEl = host.querySelector("#v3dSide");
    const renderer = new T.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
    renderer.domElement.className = "v360__canvas";
    renderer.domElement.setAttribute("role", "img");
    stage.insertBefore(renderer.domElement, stage.firstChild);

    const scene = new T.Scene(), camera = new T.PerspectiveCamera(28, 1, 0.1, 50);
    camera.position.set(0, 0.2, 6.2); camera.lookAt(0, -0.02, 0);
    scene.add(new T.HemisphereLight(0xffffff, 0x3a3a3a, 1.0));
    const key = new T.DirectionalLight(0xffffff, 0.75); key.position.set(2.5, 3, 4); scene.add(key);
    const rim = new T.DirectionalLight(0xffffff, 0.35); rim.position.set(-3, 2, -3); scene.add(rim);

    const disposables = [], keep = o => (disposables.push(o), o);
    const group = new T.Group(); scene.add(group);
    const manMat = keep(new T.MeshStandardMaterial({ color: 0x6a6a6a, roughness: 0.55, metalness: 0.05 }));
    const chrome = keep(new T.MeshStandardMaterial({ color: 0xd2d2d2, roughness: 0.35, metalness: 0.35 }));

    // manequim (sem rosto)
    const body = new T.Mesh(keep(lathe(0, -0.75)), manMat); body.scale.set(SX, 1, SZ); group.add(body);
    const neck = new T.Mesh(keep(new T.CylinderGeometry(0.085, 0.1, 0.28, 24)), manMat); neck.position.y = 1.04; group.add(neck);
    const head = new T.Mesh(keep(new T.SphereGeometry(1, 32, 24)), manMat); head.scale.set(0.165, 0.225, 0.185); head.position.y = 1.3; group.add(head);
    const pole = new T.Mesh(keep(new T.CylinderGeometry(0.028, 0.028, 0.8, 16)), chrome); pole.position.y = -1.12; group.add(pole);
    const base = new T.Mesh(keep(new T.CylinderGeometry(0.4, 0.43, 0.035, 48)), chrome); base.position.y = -1.53; group.add(base);
    const ang = 0.28, joint = [0.535, 0.67];
    [-1, 1].forEach(s => {
      const arm = new T.Mesh(keep(new T.CylinderGeometry(0.075, 0.065, 0.6, 20)), manMat);
      arm.position.set(s * (joint[0] + Math.sin(ang) * 0.3), joint[1] - Math.cos(ang) * 0.3, 0); arm.rotation.z = s * ang; group.add(arm);
      const hand = new T.Mesh(keep(new T.SphereGeometry(0.066, 16, 12)), manMat); hand.position.set(s * (joint[0] + Math.sin(ang) * 0.6), joint[1] - Math.cos(ang) * 0.6, 0); group.add(hand);
    });
    const shadowC = document.createElement("canvas"); shadowC.width = shadowC.height = 128;
    const sg = shadowC.getContext("2d"), grd = sg.createRadialGradient(64, 64, 4, 64, 64, 62);
    grd.addColorStop(0, "rgba(0,0,0,.55)"); grd.addColorStop(1, "rgba(0,0,0,0)"); sg.fillStyle = grd; sg.fillRect(0, 0, 128, 128);
    const shadow = new T.Mesh(keep(new T.PlaneGeometry(2.2, 2.2)), keep(new T.MeshBasicMaterial({ map: keep(new T.CanvasTexture(shadowC)), transparent: true, depthWrite: false })));
    shadow.rotation.x = -Math.PI / 2; shadow.position.y = -1.545; scene.add(shadow);

    // camisa (trocada a cada produto)
    const shirt = new T.Group(); group.add(shirt); let shirtParts = [];
    function dress(p) {
      shirtParts.forEach(o => { shirt.remove(o); [o.geometry, o.material && o.material.map, o.material].forEach(x => x && x.dispose && x.dispose()); }); shirtParts = [];
      const kit = p.kit || { base: "#888888", sleeve: "#888888", collar: "#ffffff" }, tank = p.type === "Regata";
      const tex = new T.CanvasTexture(paint(kit, tank)); tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
      const add = m => { shirt.add(m); shirtParts.push(m); return m; };
      const mat = new T.MeshStandardMaterial({ map: tex, roughness: 0.78, metalness: 0, side: T.DoubleSide, alphaTest: tank ? 0.5 : 0 });
      const j = add(new T.Mesh(lathe(0.032, Y0), mat)); j.scale.set(SX, 1, SZ);
      const collar = add(new T.Mesh(new T.TorusGeometry(0.135, 0.022, 12, 48), new T.MeshStandardMaterial({ color: kit.collar || "#fff", roughness: 0.7 })));
      collar.rotation.x = Math.PI / 2; collar.scale.set(SX, SZ, 1); collar.position.y = 0.915;
      if (tank) collar.visible = false;
      if (!tank) {
        const sleeveM = new T.MeshStandardMaterial({ color: kit.sleeve || kit.base, roughness: 0.78, side: T.DoubleSide });
        const trimM = new T.MeshStandardMaterial({ color: kit.trim || kit.sleeve || kit.base, roughness: 0.7 });
        [-1, 1].forEach(s => {
          const c = [s * (joint[0] + Math.sin(ang) * 0.165), joint[1] - Math.cos(ang) * 0.165 + 0.0, 0];
          const sl = add(new T.Mesh(new T.CylinderGeometry(0.135, 0.125, 0.33, 28, 1, true), sleeveM)); sl.position.set(...c); sl.rotation.z = s * ang;
          const cap = add(new T.Mesh(new T.SphereGeometry(0.128, 24, 16), sleeveM)); cap.position.set(s * joint[0], joint[1] + 0.01, 0); cap.scale.set(1, 0.95, 1.0);
          const cuff = add(new T.Mesh(new T.CylinderGeometry(0.128, 0.128, 0.04, 28, 1, true), trimM));
          cuff.position.set(s * (joint[0] + Math.sin(ang) * 0.33), joint[1] - Math.cos(ang) * 0.33 + 0.0, 0); cuff.rotation.z = s * ang;
        });
      }
      renderer.domElement.setAttribute("aria-label", `${p.name} vestida em um manequim 3D. Arraste para girar.`);
    }
    dress(product);

    // interação
    let rot = 0, vel = 0, drag = false, lastX = 0, auto = !reduce, dead = false, raf = 0, visible = true, last = performance.now();
    const SIDES = ["Frente", "Lado", "Costas", "Lado"];
    function draw() {
      group.rotation.y = rot;
      const i = ((Math.round(rot / (Math.PI * 2) * total) % total) + total) % total;
      range.value = i; sideEl.textContent = SIDES[Math.round(((i % total) / total) * 4) % 4];
      renderer.render(scene, camera);
    }
    function loop(now) {
      if (dead) return; raf = requestAnimationFrame(loop);
      const dt = Math.min(0.05, (now - last) / 1000); last = now;
      if (!visible) return;
      if (!drag) { if (Math.abs(vel) > 0.0004) { rot += vel; vel *= 0.94; } else if (auto) rot += dt * 0.5; }
      draw();
    }
    stage.addEventListener("pointerdown", e => { drag = true; auto = false; lastX = e.clientX; vel = 0; stage.setPointerCapture(e.pointerId); stage.classList.add("is-drag"); });
    stage.addEventListener("pointermove", e => { if (!drag) return; const d = (e.clientX - lastX) * 0.011; lastX = e.clientX; rot += d; vel = d; });
    const up = () => { drag = false; stage.classList.remove("is-drag"); };
    stage.addEventListener("pointerup", up); stage.addEventListener("pointercancel", up);
    range.addEventListener("input", () => { auto = false; vel = 0; rot = (+range.value / total) * Math.PI * 2; draw(); });

    const ro = new ResizeObserver(() => {
      const r = stage.getBoundingClientRect(); if (!r.width) return;
      renderer.setSize(r.width, r.height, false); renderer.domElement.style.width = "100%"; renderer.domElement.style.height = "100%";
      camera.aspect = r.width / r.height; camera.updateProjectionMatrix(); draw();
    });
    ro.observe(stage);
    const io = new IntersectionObserver(es => { visible = es[0].isIntersecting; }); io.observe(host);
    raf = requestAnimationFrame(loop);

    return {
      destroy() { dead = true; cancelAnimationFrame(raf); ro.disconnect(); io.disconnect(); disposables.forEach(o => o.dispose && o.dispose()); shirtParts.forEach(o => { o.geometry.dispose(); o.material.dispose(); }); renderer.dispose(); host.innerHTML = ""; },
      set(p) { dress(p); rot = 0; vel = 0; draw(); }
    };
  }
  return { ensure, supported, create };
})();
