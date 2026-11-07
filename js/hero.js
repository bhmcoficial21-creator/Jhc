/* Capa no estilo editorial: fotos em sequência, cursor "Agendar", parallax, topo e menu */
(function () {
  const hero = $("#inicio"), media = $("#heroMedia"), topbar = $("#topbar");
  const reduz = matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---- Fotos da capa ---- */
  const fotos = (typeof HERO_FOTOS !== "undefined" ? HERO_FOTOS : []).filter((f) => f.src);
  media.innerHTML = fotos.map((f, i) =>
    `<img src="${esc(f.src)}" alt="" class="hero-img${i === 0 ? " is-on" : ""}" ${i ? 'loading="lazy"' : 'fetchpriority="high"'}>`).join("");
  const imgs = $$(".hero-img", media);
  let atual = 0;
  const contador = $("#heroCount");
  const marcar = () => { if (imgs.length > 1) contador.textContent = `${String(atual + 1).padStart(2, "0")} / ${String(imgs.length).padStart(2, "0")}`; };
  marcar();
  if (imgs.length > 1 && !reduz) {
    setInterval(() => {
      if (document.hidden) return;
      imgs[atual].classList.remove("is-on");
      atual = (atual + 1) % imgs.length;
      imgs[atual].classList.add("is-on");
      marcar();
    }, 5500);
  }

  /* ---- Nome gigante ocupando a largura toda (como no template) ---- */
  const titulo = $(".hero-title");
  function ajustarNome() {
    titulo.style.fontSize = "100px";
    titulo.style.display = "inline-block";
    const medida = titulo.getBoundingClientRect().width || 1;
    titulo.style.display = "";
    const largura = titulo.parentElement.clientWidth - 32; // tira o respiro lateral
    titulo.style.fontSize = Math.floor(((100 * largura) / medida) * 0.99) + "px";
  }
  ajustarNome();
  document.fonts?.ready.then(ajustarNome);
  addEventListener("resize", ajustarNome);

  /* ---- Parallax da foto e topo sólido ao rolar ---- */
  let tick = false;
  function rolar() {
    tick = false;
    const y = scrollY, h = hero.offsetHeight;
    topbar.classList.toggle("is-solid", y > h - 80);
    if (!reduz && y < h) {
      const p = y / h;
      media.style.transform = `translate3d(0, ${y * 0.35}px, 0) scale(${1.06 - p * 0.06})`;
      hero.style.setProperty("--shade", (0.35 + p * 0.5).toFixed(3));
    }
  }
  addEventListener("scroll", () => { if (!tick) { tick = true; requestAnimationFrame(rolar); } }, { passive: true });
  rolar();

  /* ---- Círculo que segue o mouse (só com mouse) ---- */
  const cursor = $("#heroCursor");
  if (matchMedia("(pointer: fine)").matches) {
    let cx = 0, cy = 0, tx = 0, ty = 0, anim = 0;
    const seguir = () => {
      cx += (tx - cx) * 0.18; cy += (ty - cy) * 0.18;
      cursor.style.transform = `translate3d(${cx}px, ${cy}px, 0) translate(-50%, -50%)`;
      anim = Math.abs(tx - cx) + Math.abs(ty - cy) > 0.5 ? requestAnimationFrame(seguir) : 0;
    };
    hero.addEventListener("pointermove", (e) => {
      const r = hero.getBoundingClientRect(); tx = e.clientX - r.left; ty = e.clientY - r.top;
      if (!cursor.classList.contains("is-on")) { cx = tx; cy = ty; cursor.classList.add("is-on"); }
      if (!anim) anim = requestAnimationFrame(seguir);
    });
    hero.addEventListener("pointerleave", () => cursor.classList.remove("is-on"));
    hero.addEventListener("click", (e) => { if (!e.target.closest("a, button")) $("#agendar").scrollIntoView({ behavior: "smooth" }); });
    hero.classList.add("has-cursor");
  }

  /* ---- Menu em tela cheia ---- */
  const menu = $("#menu"), btn = $("#menuBtn");
  const abrir = (sim) => {
    menu.hidden = false;
    requestAnimationFrame(() => menu.classList.toggle("is-open", sim));
    btn.setAttribute("aria-expanded", sim); btn.textContent = sim ? "Fechar" : "Menu";
    document.body.classList.toggle("menu-open", sim);
    if (!sim) setTimeout(() => { if (!menu.classList.contains("is-open")) menu.hidden = true; }, 400);
  };
  btn.addEventListener("click", () => abrir(btn.getAttribute("aria-expanded") !== "true"));
  menu.addEventListener("click", (e) => { if (e.target.closest("a")) abrir(false); });
  addEventListener("keydown", (e) => { if (e.key === "Escape" && btn.getAttribute("aria-expanded") === "true") abrir(false); });
})();

/* Vídeo "Na cadeira": toca só quando aparece na tela (economiza bateria e internet) */
(function () {
  const v = document.getElementById("reelVideo"), btn = document.getElementById("reelToggle");
  if (!v) return;
  let pausadoPeloCliente = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const marcar = () => { btn.textContent = v.paused ? "▶" : "❚❚"; btn.setAttribute("aria-label", v.paused ? "Tocar vídeo" : "Pausar vídeo"); };
  new IntersectionObserver(([en]) => {
    if (en.isIntersecting && !pausadoPeloCliente) { v.preload = "auto"; v.play().catch(() => {}); }
    else v.pause();
  }, { threshold: 0.25 }).observe(v);
  btn.addEventListener("click", () => { if (v.paused) { pausadoPeloCliente = false; v.play().catch(() => {}); } else { pausadoPeloCliente = true; v.pause(); } });
  v.addEventListener("play", marcar); v.addEventListener("pause", marcar); marcar();
})();
