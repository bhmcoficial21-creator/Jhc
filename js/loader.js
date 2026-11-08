/* Abertura:
   1) o boneco caminha pela calçada até a porta do salão
   2) a câmera entra pela porta
   3) o site aparece (o poste embaixo mostra o carregamento 0–100%) */
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

  const ANDAR = visto || reduz ? 0 : 3600, ENTRAR = visto || reduz ? 0 : 900, MIN_CAPA = visto ? 600 : 0;
  const inicio = performance.now();
  let mostrado = 0;
  const frases = [[0, "A caminho do salão"], [55, "Chegando no salão"], [90, "Bem-vindo"]];

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

  /* ---------- Final: entrou no salão → o site aparece ---------- */
  function mostrarCapa() {
    (function frame() {
      if (porcentagem() < 100) return requestAnimationFrame(frame);
      el.classList.add("is-done");
      document.documentElement.classList.remove("is-loading");
      dispatchEvent(new Event("barbeskin:pronto"));
      setTimeout(() => { rodando = false; el.remove(); }, 900);
    })();
  }
  // a % e o poste correm enquanto o boneco anda
  (function andar() { if (!el.classList.contains("is-entering") && !el.classList.contains("is-done")) { porcentagem(); requestAnimationFrame(andar); } })();
})();
