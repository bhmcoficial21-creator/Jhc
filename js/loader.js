/* Carregamento "entrando na barbearia":
   1) chegando: a câmera se aproxima da vitrine conforme a % sobe (poste girando)
   2) entrando: perto de 100% acelera para dentro, com a luz quente do salão
   3) lá dentro: o logo 3D se monta e o site abre como uma cortina */
(function () {
  const el = document.getElementById("pageLoader");
  if (!el) return;
  const pct = document.getElementById("loaderPct");
  const bar = document.getElementById("loaderBar");
  const kicker = document.getElementById("ldKicker");
  const foto = document.getElementById("ldPhoto");
  const listras = document.getElementById("loaderStripes");
  const reduz = matchMedia("(prefers-reduced-motion: reduce)").matches;
  document.documentElement.classList.add("is-loading");

  /* Listras do poste: inclinação ~35°, ciclo = 81% da altura do tubo (medido na foto) */
  function medir() {
    const h = listras.offsetHeight;
    if (!h) return;
    const pv = h * 0.81, pg = pv * Math.cos((35 * Math.PI) / 180);
    [1, 2, 3, 4].forEach((i) => listras.style.setProperty(`--q${i}`, ((pg * i) / 4).toFixed(2) + "px"));
    listras.style.setProperty("--pv", pv.toFixed(2) + "px");
    listras.classList.add("is-ready");
  }
  const img = foto.querySelector("img");
  if (img.complete) medir(); else img.addEventListener("load", medir);
  addEventListener("resize", medir);

  /* Progresso real (nunca anda para trás) */
  // animação completa na 1ª visita; nas próximas páginas da mesma visita, versão rápida
  let visto = false;
  try { visto = sessionStorage.getItem("ld-visto") === "1"; sessionStorage.setItem("ld-visto", "1"); } catch {}
  const MIN = visto ? 700 : 2000;
  const inicio = performance.now();
  let alvo = 35, mostrado = 0, fim = false;
  const subir = (v) => { alvo = Math.max(alvo, v); };
  if (document.readyState !== "loading") subir(60); else document.addEventListener("DOMContentLoaded", () => subir(60));
  document.fonts?.ready.then(() => subir(85));
  if (document.readyState === "complete") subir(100); else addEventListener("load", () => subir(100));
  setTimeout(() => subir(100), 7000);

  const frases = [[0, "Chegando na barbearia"], [45, "Abrindo a porta"], [80, "Entrando…"]];
  const ease = (t) => t * t * (3 - 2 * t);

  function quadro(agora) {
    const tempo = Math.max(0, Math.min(1, (agora - inicio) / MIN)) * 100;
    const teto = Math.min(alvo, tempo);
    mostrado += Math.max(0.35, (teto - mostrado) * 0.1);
    if (mostrado > teto) mostrado = teto;
    const v = Math.max(0, Math.floor(mostrado));
    pct.textContent = v; bar.style.width = v + "%"; el.setAttribute("aria-valuenow", v);
    kicker.textContent = frases.filter((f) => v >= f[0]).pop()[1];
    if (!reduz) {
      const p = ease(mostrado / 100);
      foto.style.transform = `scale(${(1 + p * 1.15).toFixed(4)})`;   // aproxima da vitrine
      el.style.setProperty("--warm", (p * 0.25).toFixed(3));
    }
    if (v >= 100 && !fim) { fim = true; entrar(); return; }
    requestAnimationFrame(quadro);
  }
  requestAnimationFrame(quadro);

  function entrar() {
    kicker.textContent = "Bem-vindo";
    el.classList.add("is-entering");              // 2) mergulha na vitrine
    setTimeout(() => el.classList.add("is-inside"), reduz ? 0 : 650);   // 3) logo 3D se monta
    setTimeout(() => {
      el.classList.add("is-done");                // cortina sobe
      document.documentElement.classList.remove("is-loading");
      dispatchEvent(new Event("barbeskin:pronto"));
      setTimeout(() => el.remove(), 900);
    }, reduz || visto ? 900 : 2100);
  }
})();
