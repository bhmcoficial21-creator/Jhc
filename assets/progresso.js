// Progresso do aluno: exercícios concluídos e dias da agenda, guardados no próprio aparelho (localStorage).
window.AE = (function () {
  var K = "ae:feitos", KD = "ae:dias", mem = {}, dias = {};
  try { mem = JSON.parse(localStorage.getItem(K) || "{}") || {}; } catch (e) { mem = {}; }
  try { dias = JSON.parse(localStorage.getItem(KD) || "{}") || {}; } catch (e) { dias = {}; }
  function gravar() { try { localStorage.setItem(K, JSON.stringify(mem)); } catch (e) {} }
  function gravarDias() { try { localStorage.setItem(KD, JSON.stringify(dias)); } catch (e) {} }
  function p2(n) { return (n < 10 ? "0" : "") + n; }
  function fmt(d) { return d.getFullYear() + "-" + p2(d.getMonth() + 1) + "-" + p2(d.getDate()); }
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
    },
    // agenda: dias em que a pessoa fez as pausas ("AAAA-MM-DD")
    hoje: function () { return fmt(new Date()); },
    dia: function (k) { return !!dias[k]; },
    diaMarcar: function (k, v) { if (v) dias[k] = 1; else delete dias[k]; gravarDias(); },
    // dias seguidos até hoje (se hoje ainda não foi marcado, conta a partir de ontem)
    sequencia: function () {
      var d = new Date(); if (!dias[fmt(d)]) d.setDate(d.getDate() - 1);
      var n = 0; while (dias[fmt(d)]) { n++; d.setDate(d.getDate() - 1); }
      return n;
    }
  };
})();
