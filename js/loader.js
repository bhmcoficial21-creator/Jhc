/* Tela de carregamento: poste da foto girando + contagem de 0 a 100% */
(function () {
  const el = document.getElementById("pageLoader");
  if (!el) return;
  const pct = document.getElementById("loaderPct");
  const bar = document.getElementById("loaderBar");
  const listras = document.getElementById("loaderStripes");

  /* Ajusta as listras ao tamanho do tubo na tela (inclinação ~35°, como na foto) */
  function medir() {
    const h = listras.getBoundingClientRect().height;
    if (!h) return;
    const pv = h * 0.81;                    // altura de um ciclo vermelho/branco/azul/branco na foto
    const pg = pv * Math.cos((35 * Math.PI) / 180);
    [1, 2, 3, 4].forEach((i) => listras.style.setProperty(`--q${i}`, ((pg * i) / 4).toFixed(2) + "px"));
    listras.style.setProperty("--pv", pv.toFixed(2) + "px");
    listras.classList.add("is-ready");
  }
  const img = el.querySelector(".loader-photo img");
  if (img.complete) medir(); else img.addEventListener("load", medir);
  addEventListener("resize", medir);

  /* Progresso: segue as etapas reais do carregamento e nunca anda para trás */
  const MIN = 1800;                          // tempo mínimo para a animação ser vista
  const inicio = performance.now();
  let alvo = 40, mostrado = 0, fim = false;
  const subir = (v) => { alvo = Math.max(alvo, v); };
  if (document.readyState !== "loading") subir(60);
  else document.addEventListener("DOMContentLoaded", () => subir(60));
  document.fonts?.ready.then(() => subir(85));
  if (document.readyState === "complete") subir(100); else addEventListener("load", () => subir(100));
  setTimeout(() => subir(100), 6000);       // segurança: nunca fica preso

  function quadro(agora) {
    const tempo = Math.min(1, (agora - inicio) / MIN) * 100;
    const teto = Math.min(alvo, tempo);
    mostrado += Math.max(0.4, (teto - mostrado) * 0.12);
    if (mostrado > teto) mostrado = teto;
    const v = Math.floor(mostrado);
    pct.textContent = v;
    bar.style.width = v + "%";
    el.setAttribute("aria-valuenow", v);
    if (v >= 100 && !fim) {
      fim = true;
      setTimeout(() => {
        el.classList.add("is-done");
        dispatchEvent(new Event("barbeskin:pronto"));
        setTimeout(() => el.remove(), 800);
      }, 350);
      return;
    }
    requestAnimationFrame(quadro);
  }
  requestAnimationFrame(quadro);
})();
