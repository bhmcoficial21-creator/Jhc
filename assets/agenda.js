// Agenda de hábito: calendário do mês (segunda a domingo) para marcar os dias em que a pessoa fez as pausas.
(function () {
  var raiz = document.getElementById("agenda");
  if (!raiz || !window.AE) return;
  var MESES = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
  var SEM = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];
  var h = new Date(), base = h.getFullYear() * 12 + h.getMonth(), ver = base; // mês em exibição (a*12+m)
  function p2(n) { return (n < 10 ? "0" : "") + n; }

  function render() {
    var a = Math.floor(ver / 12), m = ver % 12, hoje = AE.hoje();
    var inicio = (new Date(a, m, 1).getDay() + 6) % 7, total = new Date(a, m + 1, 0).getDate();
    var celulas = "", feitos = 0, i, d;
    for (i = 0; i < inicio; i++) celulas += "<span></span>";
    for (d = 1; d <= total; d++) {
      var k = a + "-" + p2(m + 1) + "-" + p2(d), fut = k > hoje, on = AE.dia(k);
      if (on) feitos++;
      celulas += '<label class="container dia' + (k === hoje ? " hoje" : "") + (fut ? " futuro" : "") + '" aria-label="Dia ' + d + '">' +
        "<small>" + d + '</small><input type="checkbox" data-d="' + k + '"' + (on ? " checked" : "") + (fut ? " disabled" : "") + '><div class="checkmark"></div></label>';
    }
    var seq = AE.sequencia();
    raiz.innerHTML =
      '<div class="agenda">' +
        '<div class="topo"><div class="mes">' + MESES[m] + " " + a + "</div>" +
        '<div class="setas"><button type="button" data-v="-1" aria-label="Mês anterior"' + (ver <= base - 12 ? " disabled" : "") + '>‹</button>' +
        '<button type="button" data-v="1" aria-label="Próximo mês"' + (ver >= base + 12 ? " disabled" : "") + ">›</button></div></div>" +
        '<p class="resumo"><b>' + feitos + "</b> " + (feitos === 1 ? "dia" : "dias") + " em " + MESES[m].toLowerCase() + " · sequência de <b>" + seq + "</b> " + (seq === 1 ? "dia" : "dias") + "</p>" +
        '<div class="grade">' + SEM.map(function (s) { return '<span class="sem">' + s + "</span>"; }).join("") + celulas + "</div>" +
        '<p class="dica">Toque no dia em que você fez suas pausas. Marcar todo dia ajuda a criar o hábito.</p>' +
      "</div>";
  }
  raiz.addEventListener("click", function (e) {
    var b = e.target.closest("button[data-v]"); if (!b || b.disabled) return;
    ver += +b.getAttribute("data-v"); render();
  });
  raiz.addEventListener("change", function (e) {
    var i = e.target; if (!i.matches || !i.matches(".dia input")) return;
    AE.diaMarcar(i.getAttribute("data-d"), i.checked); render();
  });
  window.renderAgenda = function () { ver = base; render(); };
  render();
})();
