/* ABERTURA — contador, cena, janela de vídeo nas costas, nome letra por letra, assinatura. */
window.JSDHero = (function () {
  const CFG = window.JSD_CONFIG;
  const PH = window.JSDPlaceholders;
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const lite = matchMedia("(max-width: 768px)").matches || !!(navigator.connection && navigator.connection.saveData);
  const wait = ms => new Promise(r => setTimeout(r, ms));

  function letters(text, startIndex) {
    return [...text].map((ch, i) =>
      ch === " " ? `<span class="ltr ltr--sp" aria-hidden="true"> </span>`
        : `<span class="ltr" aria-hidden="true" style="--i:${startIndex + i}">${ch}</span>`).join("");
  }

  function html() {
    const b = CFG.brand;
    return `
    <section class="hero" id="hero" aria-label="Abertura da JSD">
      <div class="hero__stage" id="heroStage">
        <div class="hero__zoom" id="heroZoom">
          <img class="hero__img" id="heroImg" alt="${CFG.hero.alt}" decoding="async" fetchpriority="high">
          <div class="hero__beams" aria-hidden="true"><i></i><i></i><i></i></div>
          <div class="hero__halo" id="heroHalo" aria-hidden="true"></div>
          <div class="hero__window" id="heroWin" role="img" aria-label="Janela nas costas da camisa mostrando três lances de drible, um após o outro.">
            <video class="v v0" muted playsinline preload="auto" aria-hidden="true"></video>
            <video class="v v1" muted playsinline preload="auto" aria-hidden="true"></video>
            <div class="v vyt" aria-hidden="true"><div id="heroYT"></div></div>
            <canvas class="v vc" aria-hidden="true"></canvas>
            <span class="hero__tint"></span><span class="hero__lines"></span><span class="hero__sheen"></span><span class="hero__shade"></span>
          </div>
          <svg class="hero__maskdebug" id="heroDebug" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><polygon /></svg>
        </div>
        <div class="hero__flash" aria-hidden="true"></div>
      </div>
      <div class="hero__veil" aria-hidden="true"></div>

      <h1 class="hero__name" aria-label="${b.name}${b.tm} ${b.tagline}">
        <span class="hero__brand" aria-hidden="true">${letters(b.name, 0)}<sup class="ltr" style="--i:${b.name.length}">${b.tm}</sup></span>
        <span class="hero__sub" aria-hidden="true">${letters(b.tagline, b.name.length + 2)}</span>
      </h1>

      <div class="hero__meta" id="heroMeta">
        <button class="hero__motion" id="heroMotion" type="button" aria-label="Pausar lances" aria-pressed="false">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path class="i-pause" d="M7 5h3.5v14H7zM13.5 5H17v14h-3.5z"/><path class="i-play" d="M8 5l11 7-11 7z"/></svg>
        </button>
        <div class="hero__label" aria-live="off"><span id="heroCount">01/03</span><span id="heroLabel"></span></div>
        <div class="hero__dots" id="heroDots" aria-hidden="true"></div>
      </div>
      <a class="btn btn--primary hero__cta" href="#/colecao" id="heroCta">Entrar no cofre
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 4v14m0 0l-6-6m6 6l6-6" fill="none" stroke="currentColor" stroke-width="2"/></svg></a>
    </section>`;
  }

  /* ---------- sequenciador de lances ---------- */
  function Player(root, win, opts) {
    const clips = CFG.hero.videos, N = clips.length;
    const slots = [win.querySelector(".v0"), win.querySelector(".v1")];
    const cv = win.querySelector(".vc"), ctx = cv.getContext("2d");
    const ytHost = win.querySelector(".vyt");
    let yt = null, ytActive = -1, ytPlaying = false, ytCbs = [];

    /* ---- clipe do YouTube (clips[i].youtube = "ID", start/end em segundos) ---- */
    function loadYT(cb) {
      if (window.YT && window.YT.Player) return cb(true);
      ytCbs.push(cb);
      if (!loadYT.sent) {
        loadYT.sent = true;
        const prev = window.onYouTubeIframeAPIReady;
        window.onYouTubeIframeAPIReady = () => { if (prev) prev(); ytCbs.splice(0).forEach(f => f(true)); };
        const sc = document.createElement("script"); sc.src = "https://www.youtube.com/iframe_api";
        sc.onerror = () => ytCbs.splice(0).forEach(f => f(false));
        document.head.appendChild(sc);
      }
      setTimeout(() => ytCbs.splice(0).forEach(f => f(false)), 6000);
    }
    function playYT(ci, my) {
      const c = clips[ci];
      ytHost.style.backgroundImage = `url(https://i.ytimg.com/vi/${c.youtube}/hqdefault.jpg)`;
      show(ytHost); ytPlaying = false; ytActive = my;
      loadYT(ok => {
        if (my !== token || ytPlaying) return;
        if (!ok) return fallback(ci, my);
        const vars = { videoId: c.youtube, startSeconds: c.start || 0 }; if (c.end) vars.endSeconds = c.end;
        if (yt) { yt.loadVideoById(vars); if (paused) yt.pauseVideo(); return; }
        yt = new window.YT.Player("heroYT", {
          width: "100%", height: "100%", videoId: c.youtube,
          playerVars: { autoplay: paused ? 0 : 1, mute: 1, controls: 0, playsinline: 1, rel: 0, modestbranding: 1, disablekb: 1, iv_load_policy: 3, fs: 0, start: c.start || 0, end: c.end || undefined, origin: location.origin },
          events: {
            onReady: e => { e.target.mute(); if (!paused) e.target.playVideo(); },
            onStateChange: e => {
              if (e.data === 1) ytPlaying = true;
              if (e.data === 0 && ytActive === token && !paused) go(single ? k : k + 1);
            },
            onError: () => { if (ytActive === token) fallback(clips[k % N] ? k % N : 0, token); }
          }
        });
      });
      setTimeout(() => { if (ytActive === my && my === token && !ytPlaying && !paused) fallback(ci, my); }, 8000);
    }
    let k = 0, token = 0, raf = 0, paused = false, started = false, visible = true;
    const single = !!opts.single;

    function fit() {
      const r = win.getBoundingClientRect(), dpr = Math.min(devicePixelRatio || 1, 2);
      cv.width = Math.max(120, Math.round(r.width * dpr)); cv.height = Math.max(120, Math.round(r.height * dpr));
    }
    fit();

    const srcFor = c => (lite && c.srcMobile) ? c.srcMobile : c.src;
    function load(slot, idx) {
      const c = clips[idx % N];
      slot.dataset.idx = idx; slot.dataset.state = "loading";
      slot.removeAttribute("src");
      if (!srcFor(c)) { slot.dataset.state = "fail"; return; }
      slot.poster = c.poster || "";
      slot.src = srcFor(c); slot.load();
    }
    slots.forEach(s => {
      s.addEventListener("canplay", () => { if (s.dataset.state === "loading") s.dataset.state = "ready"; });
      s.addEventListener("error", () => { s.dataset.state = "fail"; });
      s.addEventListener("ended", () => { if (+s.dataset.idx === k && !paused) go(single ? k : k + 1); });
    });

    function show(el) {
      [...slots, cv, ytHost].forEach(e => e.classList.toggle("is-on", e === el));
    }
    function applyTone(ci) {
      const t = CFG.hero.tones[(clips[ci].tone || 0) % CFG.hero.tones.length];
      root.style.setProperty("--glow", t.glow);
      root.style.setProperty("--glow-a", t.glowAlpha);
      root.style.setProperty("--beam-rot", t.beamAngle + "deg");
      root.style.setProperty("--tone-bright", t.brightness);
      root.style.setProperty("--tone-contrast", t.contrast);
      root.style.setProperty("--spot-x", t.spotX);
      root.classList.remove("is-flash"); void root.offsetWidth; root.classList.add("is-flash");
    }

    function fallback(ci, my, staticFrame) {
      cancelAnimationFrame(raf); show(cv);
      const d = CFG.hero.placeholderSeconds; let t0 = performance.now(), acc = 0;
      const draw = now => {
        if (my !== token) return;
        if (!paused && visible) acc += (now - t0) / 1000; t0 = now;
        PH.drawDribble(ctx, cv.width, cv.height, ci, Math.min(acc, d), d);
        if (acc >= d && !staticFrame) { if (!paused) return go(single ? k : k + 1); }
        raf = requestAnimationFrame(draw);
      };
      if (staticFrame) { PH.drawDribble(ctx, cv.width, cv.height, ci, d * 0.55, d); return; }
      raf = requestAnimationFrame(draw);
    }

    function go(next) {
      cancelAnimationFrame(raf);
      const my = ++token; k = next; const ci = k % N;
      opts.onChange(ci); applyTone(ci);
      const slot = slots[k % 2], other = slots[(k + 1) % 2];
      if (yt && yt.pauseVideo && !clips[ci].youtube) { try { yt.pauseVideo(); } catch (e) { /* player ainda carregando */ } }
      if (clips[ci].youtube) { slots.forEach(s => s.pause()); return playYT(ci, my); }
      if (+slot.dataset.idx !== k) load(slot, k);
      const begin = () => {
        if (my !== token) return;
        if (slot.dataset.state === "ready") {
          show(slot); slot.currentTime = 0;
          if (paused) { slot.pause(); return; }
          const p = slot.play(); if (p) p.catch(() => fallback(ci, my, true));
          other.pause(); if (+other.dataset.idx !== k + 1) load(other, k + 1);
        } else fallback(ci, my);
      };
      const st = slot.dataset.state;
      if (st === "ready" || st === "fail") begin();
      else {
        let done = false; const fin = () => { if (!done) { done = true; begin(); } };
        slot.addEventListener("canplay", fin, { once: true }); slot.addEventListener("error", fin, { once: true });
        setTimeout(fin, 3500);
      }
    }

    return {
      start() { if (started) return; started = true; go(0); },
      pause() { paused = true; slots.forEach(s => s.pause()); if (yt && yt.pauseVideo) yt.pauseVideo(); },
      resume() { paused = false; if (started) { if (yt && clips[k % N].youtube && ytPlaying) yt.playVideo(); else go(k); } },
      isPaused: () => paused,
      setVisible(v) { visible = v; if (yt && yt.pauseVideo && ytActive === token && ytPlaying) { if (v && !paused) yt.playVideo(); else if (!v) yt.pauseVideo(); } slots.forEach(s => { if (v && !paused && s.classList.contains("is-on")) s.play().catch(() => {}); else if (!v) s.pause(); }); },
      refit() { fit(); },
      holdFirst() { started = true; paused = true; opts.onChange(0); applyTone(0);
        if (clips[0].youtube) { ytHost.style.backgroundImage = `url(https://i.ytimg.com/vi/${clips[0].youtube}/hqdefault.jpg)`; show(ytHost); return; }
        load(slots[0], 0);
        const sh = () => { if (slots[0].dataset.state === "ready") { show(slots[0]); } else fallback(0, token, true); };
        slots[0].addEventListener("canplay", () => { slots[0].dataset.state = "ready"; sh(); }, { once: true });
        slots[0].addEventListener("error", sh, { once: true }); setTimeout(() => { if (!cv.classList.contains("is-on") && !slots[0].classList.contains("is-on")) sh(); }, 1200); }
    };
  }

  /* ---------- montagem ---------- */
  function mount(host) {
    host.insertAdjacentHTML("afterbegin", html());
    const root = host.querySelector("#hero"), stage = root.querySelector("#heroStage"), img = root.querySelector("#heroImg");
    const win = root.querySelector("#heroWin"), halo = root.querySelector("#heroHalo");
    const dots = root.querySelector("#heroDots"), label = root.querySelector("#heroLabel"), count = root.querySelector("#heroCount");
    const pad = n => String(n).padStart(2, "0");
    const N = CFG.hero.videos.length;
    dots.innerHTML = CFG.hero.videos.map(() => "<i></i>").join("");

    root.classList.toggle("is-gray", !!CFG.hero.videoGrayscale);
    if (new URLSearchParams(location.search).has("mask")) root.classList.add("is-debug");

    let variant = "";
    function applyVariant() {
      const v = innerWidth / innerHeight < 0.95 ? "portrait" : "landscape";
      if (v === variant) return; variant = v;
      const c = CFG.hero[v];
      img.src = c.image; stage.style.setProperty("--ar", c.ratio);
      const xs = c.mask.map(p => p[0]), ys = c.mask.map(p => p[1]);
      const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
      Object.assign(win.style, { left: x0 + "%", top: y0 + "%", width: (x1 - x0) + "%", height: (y1 - y0) + "%" });
      win.style.clipPath = "polygon(" + c.mask.map(p => `${((p[0] - x0) / (x1 - x0) * 100).toFixed(2)}% ${((p[1] - y0) / (y1 - y0) * 100).toFixed(2)}%`).join(",") + ")";
      Object.assign(halo.style, { left: ((x0 + x1) / 2) + "%", top: ((y0 + y1) / 2) + "%" });
      root.querySelector("#heroDebug polygon").setAttribute("points", c.mask.map(p => p.join(",")).join(" "));
      if (player) player.refit();
    }

    const single = reduce;
    const player = Player(root, win, {
      single,
      onChange(ci) {
        label.textContent = CFG.hero.videos[ci].label; count.textContent = pad(ci + 1) + "/" + pad(N);
        [...dots.children].forEach((d, i) => d.classList.toggle("is-on", i === ci));
      }
    });
    applyVariant();
    let rt; addEventListener("resize", () => { clearTimeout(rt); rt = setTimeout(applyVariant, 150); });

    const btn = root.querySelector("#heroMotion");
    btn.addEventListener("click", () => {
      const p = player.isPaused(); if (p) player.resume(); else player.pause();
      btn.setAttribute("aria-pressed", String(!p)); btn.setAttribute("aria-label", p ? "Pausar lances" : "Reproduzir lances");
      btn.classList.toggle("is-paused", !p);
    });
    if (single) { btn.setAttribute("aria-pressed", "true"); btn.setAttribute("aria-label", "Reproduzir lance"); btn.classList.add("is-paused"); }

    new IntersectionObserver(es => player.setVisible(es[0].isIntersecting), { threshold: 0.05 }).observe(root);

    if (!reduce) {
      let ticking = false;
      addEventListener("scroll", () => {
        if (ticking) return; ticking = true;
        requestAnimationFrame(() => { stage.style.setProperty("--py", Math.min(scrollY, innerHeight) * 0.12 + "px"); ticking = false; });
      }, { passive: true });
    }

    const nameLetters = root.querySelectorAll(".ltr");
    nameLetters.forEach(l => l.style.setProperty("--n", nameLetters.length));

    /* ----- abertura cronometrada ----- */
    async function intro(loader, sig) {
      const num = loader.querySelector("#loaderNum"), bar = loader.querySelector("#loaderBar");
      const ready = new Promise(res => { if (img.complete) res(); else { img.addEventListener("load", res, { once: true }); img.addEventListener("error", res, { once: true }); } });
      const fonts = document.fonts ? document.fonts.ready.catch(() => {}) : Promise.resolve();
      let loaded = false; Promise.all([ready, fonts]).then(() => { loaded = true; });
      const min = reduce ? 500 : 2600; const t0 = performance.now(); let shown = 0;
      await new Promise(res => {
        (function tick(now) {
          const t = Math.min(1, (now - t0) / min);
          let target = t * (loaded ? 100 : 92);
          shown += (target - shown) * 0.22 + 0.15; shown = Math.min(shown, target, 100);
          const v = Math.round(shown); num.textContent = v; bar.style.transform = `scaleX(${shown / 100})`;
          loader.setAttribute("aria-valuenow", v);
          if (t >= 1 && loaded && v >= 100) return res();
          requestAnimationFrame(tick);
        })(t0);
      });
      num.textContent = "100"; bar.style.transform = "scaleX(1)";
      if (reduce) {
        loader.classList.add("is-done"); root.classList.add("is-revealed", "is-instant"); sig.classList.add("is-drawn", "is-docked");
        win.classList.add("is-on"); player.holdFirst(); finish(loader); return;
      }
      await wait(350);
      loader.classList.add("is-done");
      root.classList.add("is-revealed");
      await wait(700); player.start(); win.classList.add("is-on");
      await wait(300); root.classList.add("is-name");
      await wait(1200); sig.classList.add("is-drawn");
      await wait(2100); sig.classList.add("is-docked"); root.classList.add("is-cta");
      finish(loader);
    }
    function finish(loader) {
      document.body.classList.remove("is-loading"); document.body.classList.add("is-ready");
      root.classList.add("is-name", "is-cta");
      setTimeout(() => loader.remove(), 1200);
    }

    /* estado final imediato (voltar à home / link direto sem abertura) */
    function skip(sig) {
      root.classList.add("is-revealed", "is-name", "is-cta", "is-instant");
      win.classList.add("is-on"); sig.classList.add("is-drawn", "is-docked");
      document.body.classList.remove("is-loading"); document.body.classList.add("is-ready");
      if (reduce) player.holdFirst(); else player.start();
    }
    return { intro, skip, root };
  }

  return { mount };
})();
