/* ENTRADA "PORTAS DO COFRE" — contador, portas de vidro prateado com uma silhueta atrás do vidro,
   as portas se abrem e revelam a foto, o nome da loja entra letra por letra e o site começa.
   Troque a foto em config.js > entry.image. Usa as mesmas classes do hero (nome, botão, assinatura). */
window.JSDEntry = (function () {
  const CFG = window.JSD_CONFIG;
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const wait = ms => new Promise(r => setTimeout(r, ms));

  function letters(text, start) {
    return [...text].map((ch, i) => ch === " " ? `<span class="ltr ltr--sp" aria-hidden="true"> </span>`
      : `<span class="ltr" aria-hidden="true" style="--i:${start + i}">${ch}</span>`).join("");
  }

  function html() {
    const b = CFG.brand, e = CFG.entry;
    return `
    <section class="hero hero--doors" id="hero" aria-label="Abertura da JSD" style="--pos:${e.pos || "50% 25%"}">
      <img class="entry__img" id="entryImg" src="${e.image}" alt="${e.alt}" decoding="async" fetchpriority="high">
      <div class="hero__veil" aria-hidden="true"></div>
      <div class="entry__doors" aria-hidden="true">
        <div class="door door--l"><i class="handle"></i></div>
        <div class="door door--r">
          <svg class="sil" viewBox="-40 0 280 520" focusable="false"><g fill="#050505">
            <ellipse cx="100" cy="72" rx="27" ry="33"/><rect x="88" y="98" width="24" height="30"/>
            <path d="M36 152C36 132 70 124 100 124s64 8 64 28l8 178H28z"/>
            <path d="M36 152L-20 250l16 12 56-66z"/><path d="M164 152l12 108-18 4-10-74z"/>
            <path d="M30 330h140l-8 190h-54l-8-140-8 140H38z"/></g></svg>
          <i class="handle"></i>
        </div>
        <img class="seam" src="${b.logo}" alt="" width="84" height="84">
      </div>
      <h1 class="hero__name" aria-label="${b.name}${b.tm} ${b.tagline}">
        <span class="hero__brand" aria-hidden="true">${letters(b.name, 0)}<sup class="ltr" style="--i:${b.name.length}">${b.tm}</sup></span>
        <span class="hero__sub" aria-hidden="true">${letters(b.tagline, b.name.length + 2)}</span>
      </h1>
      ${e.caption ? `<p class="entry__cap">${e.caption}</p>` : ""}
      <a class="hero__cta" href="#/colecao" id="heroCta">Entrar no cofre
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 12h17m0 0l-6-6m6 6l-6 6" fill="none" stroke="currentColor" stroke-width="1.3"/></svg></a>
      <button class="entry__skip" id="entrySkip" type="button">Pular abertura</button>
    </section>`;
  }

  function mount(host) {
    host.insertAdjacentHTML("afterbegin", html());
    const root = host.querySelector("#hero"), img = root.querySelector("#entryImg");
    let done = false;

    function finish(loader) {
      done = true;
      document.body.classList.remove("is-loading"); document.body.classList.add("is-ready");
      root.classList.add("is-open", "is-name", "is-cta");
      const sk = root.querySelector("#entrySkip"); if (sk) sk.remove();
      if (loader) setTimeout(() => loader.remove(), 1200);
    }

    async function intro(loader, sig) {
      const num = loader.querySelector("#loaderNum"), bar = loader.querySelector("#loaderBar");
      const ready = new Promise(res => { if (img.complete) res(); else { img.addEventListener("load", res, { once: true }); img.addEventListener("error", res, { once: true }); } });
      const fonts = document.fonts ? document.fonts.ready.catch(() => {}) : Promise.resolve();
      let loaded = false; Promise.all([ready, fonts]).then(() => { loaded = true; });
      const min = reduce ? 500 : 2400, t0 = performance.now(); let shown = 0;
      await new Promise(res => {
        (function tick(now) {
          const t = Math.min(1, (now - t0) / min), target = t * (loaded ? 100 : 92);
          shown += (target - shown) * 0.22 + 0.15; shown = Math.min(shown, target, 100);
          const v = Math.round(shown); num.textContent = v; bar.style.transform = `scaleX(${shown / 100})`; loader.setAttribute("aria-valuenow", v);
          if (t >= 1 && loaded && v >= 100) return res();
          requestAnimationFrame(tick);
        })(t0);
      });
      num.textContent = "100"; bar.style.transform = "scaleX(1)";
      let skipped = false;
      const skip = () => { if (skipped || done) return; skipped = true; loader.classList.add("is-done"); root.classList.add("is-instant"); sig.classList.add("is-drawn", "is-docked"); finish(loader); };
      root.querySelector("#entrySkip").addEventListener("click", skip);
      if (reduce) { loader.classList.add("is-done"); root.classList.add("is-instant"); sig.classList.add("is-drawn", "is-docked"); finish(loader); return; }
      await wait(350); loader.classList.add("is-done");
      // portas fechadas, a silhueta empurra
      await wait(1000); if (skipped) return; root.classList.add("is-push");
      await wait(700); if (skipped) return; root.classList.add("is-open");
      await wait(1500); if (skipped) return; root.classList.add("is-name");
      await wait(1300); if (skipped) return; sig.classList.add("is-drawn");
      await wait(2000); if (skipped) return; sig.classList.add("is-docked"); root.classList.add("is-cta");
      finish(loader);
    }

    function skip(sig) {
      root.classList.add("is-open", "is-name", "is-cta", "is-instant"); sig.classList.add("is-drawn", "is-docked");
      document.body.classList.remove("is-loading"); document.body.classList.add("is-ready");
      const sk = root.querySelector("#entrySkip"); if (sk) sk.remove();
    }
    return { intro, skip, root };
  }
  return { mount };
})();
