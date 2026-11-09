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
    { id: "escritorio", texto: "Trabalho sentado: computador, reuniões, volante", emoji: "💻" },
    { id: "em_pe", texto: "Trabalho de pé: balcão, loja, salão, atendimento", emoji: "🧍" },
    { id: "repetitivo", texto: "Faço esforço repetitivo: digitação intensa, produção, costura, trabalho manual", emoji: "🔁" }
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
    return { escritorio: "pescoco", repetitivo: "punho", em_pe: "lombar" }[rotina] || "pescoco";
  }

  /* Plano do dia, a partir de: dia, noite, semáforo, dia caótico, perfil */
  function planoDoDia({ dia, noite, semaforo, caotico, perfil }) {
    const semana = dia <= 7 ? 1 : dia <= 14 ? 2 : dia <= 21 ? 3 : 4;
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
      } else if (semana === 3) {
        const diaForca = [15, 17, 19].includes(dia);
        if (diaForca) plano.blocos.push({ tipo: "rotina", rotina: "forca8", texto: curta ? "Força leve (versão curta: 2 exercícios)" : D.ROTINAS.forca8.nome, curta });
        else if (dia !== 21) plano.blocos.push({ tipo: "caminhada", texto: curta ? "Caminhada de 10 minutos" : "Caminhada de 15 minutos" });
      } else {
        // Semana 4 · Blindar: força 3x, hábitos e checklists no automático
        if (C.diasForcaSemana4.includes(dia)) plano.blocos.push({ tipo: "rotina", rotina: "forca8", texto: curta ? "Força leve (versão curta: 2 exercícios)" : D.ROTINAS.forca8.nome, curta });
        else if (dia !== 30) plano.blocos.push({ tipo: "checklist", texto: "Checklist Matinal ou Noturno (3 min)" });
        if (dia !== 30) plano.blocos.push({ tipo: "lanches", texto: "3 Lanches de Movimento de 60 s nos seus horários fixos" });
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
    const lista = D.EXERCICIOS.filter((e) => e.regiao === regiaoFoco && !e.chao);
    return lista.length ? lista[numeroPausa % lista.length] : D.EXERCICIOS[0];
  }

  /* =========================================================
     ALÍVIO EXPRESS
     A pessoa sente a dor no meio do expediente e escolhe:
     onde dói agora, quanto tempo tem (1, 2 ou 3 min) e onde está.
     O painel monta um protocolo de microvídeos que cabe nesse tempo.
     ========================================================= */
  const TEMPOS_EXPRESS = [
    { min: 1, nome: "1 minuto", texto: "Só um respiro entre uma tarefa e outra" },
    { min: 2, nome: "2 minutos", texto: "A pausa da Regra 50/2" },
    { min: 3, nome: "3 minutos", texto: "Alívio mais completo da região" }
  ];
  const LOCAIS_EXPRESS = [
    { id: "sentado", nome: "Na cadeira", texto: "Sem levantar, de roupa de trabalho", emoji: "🪑" },
    { id: "em_pe", nome: "Posso levantar", texto: "Perto da mesa, de uma parede ou de uma porta", emoji: "🧍" },
    { id: "reuniao", nome: "Em reunião ou atendimento", texto: "Só movimentos que ninguém percebe", emoji: "👀" }
  ];
  // Exercícios que pedem ficar em pé ou usar porta/parede
  const SO_EM_PE = ["abertura-peito", "extensao-pe", "flexor-quadril", "sentar-levantar", "alongamento-braco-parede", "panturrilha-parede"];
  // Regiões vizinhas, usadas para completar o tempo
  const VIZINHAS = { pescoco: ["ombros"], ombros: ["pescoco", "punho"], punho: ["ombros"], lombar: ["pernas"], pernas: ["lombar", "joelhos"], joelhos: ["pernas", "pes"], pes: ["joelhos"] };
  const RESPIRA = { id: "respira", nome: "3 respirações profundas", passos: "Inspire pelo nariz, solte o ar devagar pela boca e deixe os ombros caírem a cada saída do ar.", resolve: "Tira o corpo do modo alerta" };

  const duracaoExercicio = (e) => (e.invisivel ? 30 : 40);

  function montarProtocolo({ regiao, minutos, local, semaforo }) {
    const alvo = minutos * 60;
    const protocolo = { regiao, minutos, local, passos: [], aviso: null };
    protocolo.passos.push({ ...RESPIRA, segundos: 20 });

    if (semaforo === "vermelho") {
      protocolo.aviso = "Seu semáforo de hoje está vermelho: sem exercícios para essa região. Faça só a respiração e procure um médico ou fisioterapeuta.";
      protocolo.passos[0].segundos = alvo;
      return protocolo;
    }

    const serve = (e) => !e.chao && !["forca", "olhos", "relaxamento"].includes(e.regiao) &&
      (local === "reuniao" ? e.invisivel : local === "sentado" ? !SO_EM_PE.includes(e.id) : true);
    const ordem = [regiao, ...(VIZINHAS[regiao] || [])];
    const candidatos = ordem.flatMap((r) => D.EXERCICIOS.filter((e) => e.regiao === r && serve(e)));
    if (local === "reuniao") D.EXERCICIOS.filter((e) => serve(e) && !candidatos.includes(e)).forEach((e) => candidatos.push(e));

    let total = 20;
    for (const e of candidatos) {
      const s = duracaoExercicio(e);
      if (total + s > alvo + 10) continue;
      protocolo.passos.push({ ...e, segundos: s });
      total += s;
      if (total >= alvo - 10) break;
    }
    // Ajusta o último passo para fechar o tempo exato
    const ultimo = protocolo.passos[protocolo.passos.length - 1];
    ultimo.segundos += alvo - total;
    if (semaforo === "amarelo") protocolo.aviso = "Semáforo amarelo: faça cada movimento mais devagar e com metade da amplitude.";
    return protocolo;
  }

  /* Protocolo fixo da Central: trilha (zona de dor) × formato */
  function protocoloDaTrilha(trilha, formato, semaforo) {
    const t = D.TRILHAS_ZONA[trilha], f = D.FORMATOS[formato];
    const prot = {
      titulo: `${f.curto} · ${f.min} min · ${t.nome}`, minutos: f.min, regiao: t.regioes[0], aviso: null,
      passos: D.PROTOCOLOS[trilha][formato].map(([id, seg]) => ({ ...(id === "respira" ? RESPIRA : D.ex(id)), segundos: seg }))
    };
    if (semaforo === "vermelho") {
      prot.aviso = "Seu semáforo de hoje está vermelho: sem exercícios para essa região. Faça só a respiração e procure um médico ou fisioterapeuta.";
      prot.passos = [{ ...D.ex("respiracao-4-6"), segundos: f.min * 60 }];
    } else if (semaforo === "amarelo") {
      prot.aviso = "Semáforo amarelo: faça cada movimento mais devagar e com metade da amplitude.";
    }
    return prot;
  }

  window.RELIGAR_LOGICA = {
    protocoloDaTrilha,
    SINAIS, ROTINAS_TRABALHO, corDoSemaforo, diagnosticar, planoDoDia,
    metaPausas, paraMinutos, exercicioRemexe,
    TEMPOS_EXPRESS, LOCAIS_EXPRESS, montarProtocolo
  };
})();
