/* Tela de carregando: pirâmide girando (+ símbolo do produto). Roda logo no início do <body>.
   From Uiverse.io by andrew-demchenk0 - https://uiverse.io/andrew-demchenk0/orange-monkey-2
   MIT License, Copyright (c) andrew-demchenk0 (A) */
(function () {
  if (/[?&]export=1/.test(location.search) || !document.body) return;
  var el = document.createElement("div");
  el.id = "carregando"; el.setAttribute("role", "status"); el.setAttribute("aria-label", "Carregando");
  el.innerHTML =
    '<div class="ae-load">' +
      '<img class="ae-sim" src="assets/simbolo.png" alt="">' +
      '<div class="pyramid-loader"><div class="wrapper">' +
        '<span class="side side1"></span><span class="side side2"></span><span class="side side3"></span><span class="side side4"></span>' +
        '<span class="shadow"></span>' +
      '</div></div>' +
    '</div><p class="ae-load-t">Carregando</p>';
  document.body.insertBefore(el, document.body.firstChild);
  var ini = Date.now(), feito = false;
  function fim() {
    if (feito) return; feito = true;
    setTimeout(function () {
      el.classList.add("sai");
      setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 600);
    }, Math.max(0, 800 - (Date.now() - ini)));
  }
  if (document.readyState === "complete") fim(); else window.addEventListener("load", fim);
  setTimeout(fim, 9000); // nunca prende o usuário
})();
