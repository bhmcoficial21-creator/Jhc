/* Entrada rápida: só o símbolo da barbearia e o site já entra (~1s). */
(function () {
  const el = document.getElementById("pageLoader");
  if (!el) return;
  document.documentElement.classList.add("is-loading");
  let visto = false;
  try { visto = sessionStorage.getItem("ld-visto") === "1"; sessionStorage.setItem("ld-visto", "1"); } catch {}
  const sair = () => {
    if (el.classList.contains("is-done")) return;
    el.classList.add("is-done");
    document.documentElement.classList.remove("is-loading");
    dispatchEvent(new Event("barbeskin:pronto"));
    setTimeout(() => el.remove(), 600);
  };
  requestAnimationFrame(() => el.classList.add("is-on"));
  setTimeout(sair, visto ? 250 : 1100);
  el.addEventListener("click", sair);
})();
