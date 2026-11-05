/* =========================================================
   REGRAS DE LÓGICA (seção 14.2 do briefing)
   Compartilhadas entre o quiz e o painel.
   ========================================================= */
(function () {
  const C = window.RELIGAR_CONFIG;
  const D = window.RELIGAR_DADOS;

  /* Sinais perguntados no Mapa da Dor e a cor que cada um indica */
  const SINAIS = [
    { id: "rigidez", texto: "Rigidez que passa quando me mexo", cor: "verde" },
    { id: "formigamento", texto: "Formigamento", cor: "amarelo" },
    { id: "peso", texto: "Sensação de peso ou mão cansada", cor: "amarelo" },
    { id: "cansaco", texto: "Cansaço que volta todo dia", cor: "amarelo" },
    { id: "forca", texto: "Perda de força", cor: "vermelho" },
    { id: "dormencia", texto: "Dormência que não passa", cor: "vermelho" },
    { id: "irradia", texto: "Dor que irradia para o braço ou a perna", cor: "vermelho" },
    { id: "noite", texto: "Dor que me acorda à noite", cor: "vermelho" }
  ];

  const ROTINAS_TRABALHO = [
    { id: "escritorio", texto: "Computador, reuniões, cadeira o dia inteiro", emoji: "💻" },
    { id: "repetitivo", texto: "Movimento repetitivo: caixa, produção, costura, digitação, salão, consultório", emoji: "🔁" },
    { id: "motorista", texto: "Motorista ou longas horas em pé ou sentado sem pausa", emoji: "🚗" }
  ];

  function corDoSemaforo(sinais, intensidade) {
    const cores = (sinais || []).map((id) => (SINAIS.find((s) => s.id === id) || {}).cor);
    if (cores.includes("vermelho")) return "vermelho";
    if (cores.includes("amarelo") || intensidade >= 7) return "amarelo";
    return "verde";
  }

  /* Resultado do Mapa da Dor: região de foco + trilha + cor */
  function diagnosticar({ regioes, regiaoFoco, intensidade, sinais, rotina }) {
    const foco = regiaoFoco || (regioes && regioes[0]) || padraoPorRotina(rotina);
    return {
      regiaoFoco: foco,
      trilha: rotina || "escritorio",
      cor: corDoSemaforo(sinais, intensidade || 0)
    };
  }
  function padraoPorRotina(rotina) {
    return { escritorio: "pescoco", repetitivo: "punho", motorista: "lombar" }[rotina] || "pescoco";
  }

  /* Plano do dia, a partir de: dia, noite, semáforo, dia caótico, perfil */
  function planoDoDia({ dia, noite, semaforo, caotico, perfil }) {
    const semana = dia <= 7 ? 1 : dia <= 14 ? 2 : 3;
    const foco = perfil.regiaoFoco;
    const plano = {
      semana,
      versao: "completa",
      metaPausas: metaPausas(perfil),
      minimoPausas: C.pausasMinimasDia,
      blocos: [],
      avisos: []
    };

    // Dia caótico: o mínimo vale o check
    if (caotico) {
      plano.versao = "caotico";
      plano.minimoPausas = C.pausasMinimasDiaCaotico;
      plano.metaPausas = C.pausasMinimasDiaCaotico;
      plano.blocos.push({ tipo: "pausas", texto: `${C.pausasMinimasDiaCaotico} pausas de 2 minutos com os 3 Rs` });
      plano.avisos.push(D.DIA_CAOTICO.como);
      aplicarSemaforo(plano, semaforo, foco);
      return plano;
    }

    // Plano pela noite
    if (noite === "horrivel") {
      plano.versao = "minima";
      plano.minimoPausas = C.pausasMinimasDiaCaotico;
      plano.blocos.push({ tipo: "pausas", texto: "Só os 3 Rs e as pausas invisíveis hoje" });
      plano.avisos.push("Noite difícil: hoje o objetivo é só não congelar. Qualquer pausa concluída conta.");
    } else {
      plano.blocos.push({ tipo: "pausas", texto: `Regra 50/2: ${plano.metaPausas} pausas com os 3 Rs (mínimo ${C.pausasMinimasDia})` });
      const curta = noite === "mais_ou_menos";
      if (curta) {
        plano.versao = "curta";
        plano.avisos.push("Dica de sono: hoje à noite, 30 minutos sem tela antes de deitar e o ritual de desligar.");
      }
      if (semana === 1) {
        plano.blocos.push({ tipo: "rotina", rotina: "mobilidade5", texto: curta ? "Mobilidade (versão curta: 3 exercícios)" : D.ROTINAS.mobilidade5.nome, curta });
      } else if (semana === 2) {
        plano.blocos.push({ tipo: "regiao", regiao: foco, texto: `Rotina da região: ${D.REGIOES[foco]?.nome || foco}`, curta });
        plano.blocos.push({ tipo: "ritual", texto: D.ROTINAS.ritualDesligar.nome });
      } else {
        const diaForca = [15, 17, 19].includes(dia);
        if (diaForca) plano.blocos.push({ tipo: "rotina", rotina: "forca8", texto: curta ? "Força leve (versão curta: 2 exercícios)" : D.ROTINAS.forca8.nome, curta });
        else if (dia !== 21) plano.blocos.push({ tipo: "caminhada", texto: curta ? "Caminhada de 10 minutos" : "Caminhada de 15 minutos" });
      }
    }

    aplicarSemaforo(plano, semaforo, foco);
    return plano;
  }

  function aplicarSemaforo(plano, semaforo, foco) {
    if (semaforo === "amarelo") {
      plano.versao = plano.versao === "completa" ? "leve" : plano.versao;
      plano.avisos.push("Amarelo: versão mais leve hoje, reforce as pausas e observe por alguns dias.");
      plano.blocos.forEach((b) => { if (b.tipo !== "pausas") b.curta = true; });
    }
    if (semaforo === "vermelho") {
      plano.versao = "vermelho";
      plano.bloqueioRegiao = foco;
      plano.blocos = [{ tipo: "pausas", texto: "Só respiração e pausas suaves (sem exercícios da região)" }];
      plano.avisos.unshift("Vermelho: pare os exercícios da região e procure um médico ou fisioterapeuta.");
    }
  }

  /* Meta de pausas pela Regra 50/2 dentro do horário de trabalho */
  function metaPausas(perfil) {
    const ini = paraMinutos(perfil.inicioTrabalho || "09:00");
    const fim = paraMinutos(perfil.fimTrabalho || "18:00");
    const total = Math.max(0, fim - ini);
    const intervalo = (perfil.intervaloMin || C.intervaloPadraoMin) + 2;
    return Math.max(C.pausasMinimasDia, Math.floor(total / intervalo));
  }
  function paraMinutos(hhmm) {
    const [h, m] = hhmm.split(":").map(Number);
    return h * 60 + (m || 0);
  }

  /* Exercício do "Remexe": gira entre os exercícios da região de foco */
  function exercicioRemexe(regiaoFoco, numeroPausa) {
    const lista = D.EXERCICIOS.filter((e) => e.regiao === regiaoFoco);
    return lista.length ? lista[numeroPausa % lista.length] : D.EXERCICIOS[0];
  }

  window.RELIGAR_LOGICA = {
    SINAIS, ROTINAS_TRABALHO, corDoSemaforo, diagnosticar, planoDoDia,
    metaPausas, paraMinutos, exercicioRemexe
  };
})();
