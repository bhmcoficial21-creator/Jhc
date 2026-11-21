// Progresso do aluno: exercícios concluídos, guardados no próprio aparelho (localStorage).
window.AE = (function () {
  var K = "ae:feitos", mem = {};
  try { mem = JSON.parse(localStorage.getItem(K) || "{}") || {}; } catch (e) { mem = {}; }
  function gravar() { try { localStorage.setItem(K, JSON.stringify(mem)); } catch (e) {} }
  return {
    feito: function (k) { return !!mem[k]; },
    marcar: function (k, v) { if (v) mem[k] = 1; else delete mem[k]; gravar(); },
    // exercícios de um guia: [feitos, total]
    guia: function (g) {
      var t = 0, f = 0;
      g.cards.forEach(function (c, i) { if (c.t === "ex") { t++; if (mem[g.id + "|" + (i + 1)]) f++; } });
      return [f, t];
    },
    geral: function (modulos) {
      var f = 0, t = 0, self = this;
      modulos.forEach(function (m) { m.guias.forEach(function (g) { var r = self.guia(g); f += r[0]; t += r[1]; }); });
      return [f, t];
    }
  };
})();
