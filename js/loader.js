/* Tela de carregamento com o poste de barbearia 3D */
(function () {
  const el = document.getElementById("pageLoader");
  if (!el) return;
  const MIN = 1100; // tempo mínimo visível (ms) para a animação não "piscar"
  let feito = false;
  function esconder() {
    if (feito) return; feito = true;
    setTimeout(() => {
      el.classList.add("is-done");
      dispatchEvent(new Event("barbeskin:pronto"));
      setTimeout(() => el.remove(), 700);
    }, Math.max(0, MIN - performance.now()));
  }
  if (document.readyState === "complete") esconder(); else addEventListener("load", esconder);
  setTimeout(esconder, 5000); // segurança caso algo demore demais
})();
