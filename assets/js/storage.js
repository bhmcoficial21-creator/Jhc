/* =========================================================
   ARMAZENAMENTO
   Hoje: localStorage (só neste aparelho).
   Depois: trocar as funções carregar/salvar por chamadas ao
   Supabase (ver docs/supabase-schema.sql), com login por
   link mágico, para o progresso não se perder ao trocar
   de celular. O resto do app não precisa mudar.
   ========================================================= */
(function () {
  const CHAVE = "religar_trabalho_v1";
  const CHAVE_QUIZ = "religar_quiz_v1";

  function ler(chave, padrao) {
    try {
      const bruto = localStorage.getItem(chave);
      return bruto ? JSON.parse(bruto) : padrao;
    } catch (e) {
      return padrao;
    }
  }
  function gravar(chave, valor) {
    try { localStorage.setItem(chave, JSON.stringify(valor)); } catch (e) { /* sem armazenamento */ }
  }

  /* Estrutura dos dados por pessoa (seção 14.3 do briefing) */
  const estadoInicial = () => ({
    perfil: null,           // { regioes[], regiaoFoco, intensidadeInicial, rotina, trilha, inicioTrabalho, fimTrabalho, intervaloMin, corInicial }
    dataInicio: null,       // "AAAA-MM-DD"
    dias: {},               // { [n]: { noite, semaforo, caotico, pausas, pilares:{movimento,sono,alimentacao}, tarefa, revisao, feito } }
    escalaDor: {},          // { 1: n, 11: n, 21: n }
    compras: { principal: true, bump1: false, bump2: false, bump3: false, upsell: false, downsell: false },
    deslocamentoDias: 0     // só para modo de teste
  });

  window.RELIGAR_STORE = {
    carregar() { return Object.assign(estadoInicial(), ler(CHAVE, {})); },
    salvar(estado) { gravar(CHAVE, estado); },
    zerar() { try { localStorage.removeItem(CHAVE); } catch (e) {} },
    lerQuiz() { return ler(CHAVE_QUIZ, null); },
    salvarQuiz(r) { gravar(CHAVE_QUIZ, r); }
  };
})();
