/* =========================================================
   CONTEÚDO DO PRODUTO (fonte única)
   Usado pelo quiz, pelo painel e pela página de vendas.
   Para mudar textos de exercícios, dias, aulas e trilhas,
   edite este arquivo.
   ========================================================= */
(function () {
  const REGIOES = {
    pescoco: { nome: "Pescoço", emoji: "🦒", no: "no pescoço", para: "para o pescoço" },
    ombros:  { nome: "Ombros", emoji: "🎒", no: "nos ombros", para: "para os ombros" },
    punho:   { nome: "Punho e mão", emoji: "✋", no: "no punho e na mão", para: "para o punho e a mão" },
    lombar:  { nome: "Lombar", emoji: "🪑", no: "na lombar", para: "para a lombar" },
    pernas:  { nome: "Quadril e pernas", emoji: "🚶", no: "no quadril e nas pernas", para: "para o quadril e as pernas" },
    joelhos: { nome: "Joelhos", emoji: "🦵", no: "nos joelhos", para: "para os joelhos" }
  };

  /* Biblioteca de exercícios (seção 10 do briefing).
     videoUrl: preencher quando os vídeos forem gravados. */
  const EXERCICIOS = [
    { id: "retracao-queixo", regiao: "pescoco", nome: "Retração do queixo", resolve: "Cabeça projetada para a tela", passos: "Olhe para frente e leve o queixo para trás, como se fizesse um \"queixo duplo\". Segure 3 segundos e solte. Repita 8 vezes.", invisivel: true },
    { id: "inclinacao-lateral", regiao: "pescoco", nome: "Inclinação lateral suave", resolve: "Tensão lateral do pescoço", passos: "Leve a orelha em direção ao ombro, sem forçar. Respire 3 vezes de cada lado." },
    { id: "rotacao-pescoco", regiao: "pescoco", nome: "Rotação lenta olhando por cima do ombro", resolve: "Rigidez para virar a cabeça", passos: "Gire a cabeça devagar para olhar por cima do ombro. Volte ao centro. 5 vezes para cada lado." },
    { id: "encolher-ombros", regiao: "ombros", nome: "Encolher e soltar os ombros", resolve: "Ombro \"pesado\" e tenso", passos: "Suba os ombros até as orelhas, segure 2 segundos e solte de uma vez, expirando. Repita 8 vezes." },
    { id: "abertura-peito", regiao: "ombros", nome: "Abertura do peito na parede ou na porta", resolve: "Ombros curvados para frente", passos: "Apoie o antebraço no batente da porta e gire o corpo para o lado oposto até sentir o peito abrir. 20 segundos de cada lado." },
    { id: "juncao-escapulas", regiao: "ombros", nome: "Junção das escápulas", resolve: "Postura caída", passos: "Aperte as costas como se fosse segurar um lápis entre as escápulas. Segure 3 segundos. Repita 10 vezes.", invisivel: true },
    { id: "deslizamento-tendoes", regiao: "punho", nome: "Deslizamento dos tendões", resolve: "Mão cansada, rigidez dos dedos", passos: "Mão aberta → gancho → punho fechado → mão reta → punho reto. Passe por cada posição devagar. 5 sequências." },
    { id: "flexores-extensores", regiao: "punho", nome: "Alongamento suave de flexores e extensores", resolve: "Tensão de mouse e teclado", passos: "Braço esticado, palma para cima, puxe os dedos levemente para baixo. Depois palma para baixo. 15 segundos cada." },
    { id: "abrir-fechar-mao", regiao: "punho", nome: "Abrir e fechar a mão + círculos de punho", resolve: "Circulação e mobilidade", passos: "Abra e feche as mãos 10 vezes. Depois faça 10 círculos de punho para cada lado.", invisivel: true },
    { id: "gato-vaca-sentado", regiao: "lombar", nome: "Gato e vaca sentado", resolve: "Coluna travada", passos: "Sentado, mãos nos joelhos: arredonde as costas olhando para o umbigo, depois abra o peito olhando para frente. 8 vezes." },
    { id: "inclinacao-pelve", regiao: "lombar", nome: "Inclinação da pelve sentado", resolve: "Lombar rígida na cadeira", passos: "Sentado, \"role\" a pelve para frente e para trás, devagar, sem mexer os ombros. 10 vezes.", invisivel: true },
    { id: "rotacao-tronco", regiao: "lombar", nome: "Rotação de tronco sentado", resolve: "Rigidez das costas", passos: "Mão no encosto da cadeira, gire o tronco para o lado e respire. 3 respirações de cada lado." },
    { id: "extensao-pe", regiao: "lombar", nome: "Extensão de pé com as mãos na cintura", resolve: "Coluna \"dobrada\" o dia todo", passos: "Em pé, mãos na cintura, leve o quadril levemente para frente e o peito para cima. 5 vezes, sem forçar." },
    { id: "flexor-quadril", regiao: "pernas", nome: "Alongamento do flexor do quadril de pé", resolve: "Quadril encurtado de ficar sentado", passos: "Dê um passo à frente, contraia o glúteo da perna de trás e leve o quadril para frente. 20 segundos de cada lado." },
    { id: "panturrilha", regiao: "pernas", nome: "Elevação dos calcanhares", resolve: "Perna inchada, circulação", passos: "Suba na ponta dos pés e desça devagar. 15 vezes (sentado também vale).", invisivel: true },
    { id: "sentar-levantar", regiao: "pernas", nome: "Sentar e levantar da cadeira", resolve: "Força e circulação", passos: "Levante da cadeira sem usar as mãos e sente devagar. 10 vezes." },
    // Joelhos (Trilha 3)
    { id: "isometria-quadriceps", regiao: "joelhos", nome: "Isometria de coxa sentado", resolve: "Joelho sem apoio da musculatura", passos: "Sentado, estique uma perna e contraia a coxa por 5 segundos, sem travar o joelho. Solte. 5 vezes de cada lado.", invisivel: true },
    { id: "extensao-joelho-sentado", regiao: "joelhos", nome: "Extensão de joelho sentado", resolve: "Joelho rígido de ficar dobrado", passos: "Sentado, estique o joelho devagar até onde não doer e desça devagar. 8 vezes de cada lado." },
    { id: "bombinha-tornozelo", regiao: "joelhos", nome: "Bombinha de tornozelo", resolve: "Perna pesada, circulação", passos: "Leve as pontas dos pés para cima e para baixo, sem pressa. 20 vezes.", invisivel: true },
    { id: "alongamento-posterior-sentado", regiao: "joelhos", nome: "Alongamento da parte de trás da coxa sentado", resolve: "Coxa encurtada que puxa o joelho", passos: "Na beira da cadeira ou da cama, perna esticada com o calcanhar no chão. Incline o tronco com a coluna reta até sentir uma tensão leve. 20 segundos de cada lado." },
    { id: "deslizamento-calcanhar", regiao: "joelhos", nome: "Deslizamento do calcanhar", resolve: "Joelho travado ao acordar", passos: "Deitado de barriga para cima, deslize o calcanhar em direção ao bumbum até onde não doer e volte. 10 vezes de cada lado.", chao: true },
    { id: "toalha-joelho", regiao: "joelhos", nome: "Toalha sob o joelho", resolve: "Força da coxa sem impacto", passos: "Sentado no chão ou na cama, toalha enrolada embaixo do joelho. Empurre o joelho contra a toalha por 5 segundos. 8 vezes de cada lado.", chao: true },
    { id: "abducao-lado", regiao: "joelhos", nome: "Abertura de perna deitado de lado", resolve: "Quadril fraco que sobrecarrega o joelho", passos: "Deitado de lado, perna de baixo dobrada. Suba a perna de cima esticada até a altura do quadril e desça devagar. 10 vezes de cada lado.", chao: true },
    // Cama e chão (protocolos matinal e noturno)
    { id: "joelhos-peito", regiao: "lombar", nome: "Joelhos ao peito", resolve: "Lombar travada ao acordar", passos: "Deitado, abrace os joelhos e balance o corpo de leve, de um lado para o outro.", chao: true },
    { id: "torcao-deitado", regiao: "lombar", nome: "Torção deitado", resolve: "Rigidez da coluna", passos: "Deitado, joelhos dobrados e juntos. Deixe os joelhos caírem para um lado e depois para o outro, devagar.", chao: true },
    { id: "gato-vaca-4-apoios", regiao: "lombar", nome: "Gato e vaca em 4 apoios", resolve: "Coluna inteira travada", passos: "Mãos e joelhos no chão ou na cama. Arredonde as costas olhando para o umbigo e depois afunde suavemente olhando para frente. 8 vezes.", chao: true },
    { id: "postura-crianca", regiao: "lombar", nome: "Postura de descanso", resolve: "Costas tensas no fim do dia", passos: "Sente sobre os calcanhares e leve o tronco e os braços para frente, testa apoiada. Respire devagar.", chao: true },
    { id: "pernas-parede", regiao: "pernas", nome: "Pernas na parede", resolve: "Perna inchada e corpo agitado", passos: "Deitado com o bumbum perto da parede, apoie as pernas esticadas na parede. Respire devagar.", chao: true },
    { id: "figura-4", regiao: "pernas", nome: "Alongamento do glúteo deitado", resolve: "Quadril e glúteo tensos", passos: "Deitado, cruze o tornozelo sobre o joelho oposto e puxe a perna de baixo em direção ao peito. 30 segundos de cada lado.", chao: true },
    { id: "espreguicar", regiao: "ombros", nome: "Espreguiçar completo", resolve: "Sensação de corpo pesado ao acordar", passos: "Deitado, estique os braços acima da cabeça e as pontas dos pés para longe, como se crescesse. Solte. 3 vezes.", chao: true },
    { id: "anjo-no-chao", regiao: "ombros", nome: "Anjo no chão", resolve: "Ombros fechados e pescoço tenso", passos: "Deitado de barriga para cima, braços em W no chão. Deslize os braços para cima e para baixo sem tirar do chão. 10 vezes.", chao: true },
    { id: "respiracao-4-6", regiao: "relaxamento", nome: "Respiração 4-6", resolve: "Corpo em alerta, sono difícil", passos: "Inspire contando até 4 e solte o ar contando até 6. A saída mais longa avisa o corpo que pode relaxar.", invisivel: true },
    { id: "regra-20-20-20", regiao: "olhos", nome: "Regra 20-20-20", resolve: "Vista cansada e tensão facial", passos: "A cada 20 minutos, olhe para algo a 6 metros por 20 segundos." },
    { id: "ponte-gluteo", regiao: "forca", nome: "Ponte de glúteo", resolve: "Sustentação da postura", passos: "Deitado, joelhos dobrados, suba o quadril e desça devagar. 3 séries de 10." },
    { id: "remada-toalha", regiao: "forca", nome: "Remada com toalha ou elástico", resolve: "Costas fortes para a postura", passos: "Prenda a toalha na maçaneta, puxe aproximando as escápulas. 3 séries de 10." },
    { id: "prancha-parede", regiao: "forca", nome: "Prancha na parede", resolve: "Abdômen que protege a lombar", passos: "Mãos na parede, corpo reto e inclinado. Segure 20 a 30 segundos. 3 vezes." },
    { id: "agachamento-cadeira", regiao: "forca", nome: "Agachamento na cadeira", resolve: "Pernas e quadril fortes", passos: "Sente e levante da cadeira devagar, sem as mãos. 3 séries de 10." }
  ];

  const ex = (id) => EXERCICIOS.find((e) => e.id === id);

  /* Rotinas por semana */
  const ROTINAS = {
    mobilidade5: {
      nome: "Rotina de mobilidade (5 min)",
      exercicios: ["retracao-queixo", "inclinacao-lateral", "encolher-ombros", "abertura-peito", "abrir-fechar-mao", "gato-vaca-sentado", "rotacao-tronco"]
    },
    forca8: {
      nome: "Força leve (8 min)",
      exercicios: ["ponte-gluteo", "remada-toalha", "prancha-parede", "agachamento-cadeira"]
    },
    ritualDesligar: {
      nome: "Ritual de desligar do trabalho (10 min)",
      passos: [
        "Feche as abas e anote a primeira tarefa de amanhã (2 min).",
        "Troque de roupa ou de ambiente: o corpo entende que acabou (1 min).",
        "Rotina da sua região de foco (5 min).",
        "3 respirações longas soltando os ombros e 1 minuto sem tela (2 min)."
      ]
    }
  };

  const OS_3_RS = [
    { letra: "R", nome: "Reposiciona", texto: "Ajuste a postura e, se puder, levante.", segundos: 20 },
    { letra: "R", nome: "Respira", texto: "3 respirações profundas, soltando os ombros na saída do ar.", segundos: 30 },
    { letra: "R", nome: "Remexe", texto: "1 exercício da sua região de foco.", segundos: 70 }
  ];

  /* Trilhas (seção 10.2) */
  const TRILHAS = {
    escritorio: {
      nome: "Escritório e Home Office",
      paraQuem: "Computador e reuniões",
      como: "Regra 50/2 encaixada entre reuniões, pausas invisíveis e ajuste da mesa.",
      dica: "Encaixe a pausa entre uma reunião e outra. Em reunião de câmera ligada, use as pausas invisíveis."
    },
    repetitivo: {
      nome: "Movimento Repetitivo",
      paraQuem: "Caixa, produção, costura, salão, consultório",
      como: "Pausas a cada troca de tarefa, foco em punho, mão e ombro, alongamento dos músculos opostos ao movimento.",
      dica: "Use cada troca de tarefa ou de cliente como gatilho da pausa."
    },
    motorista: {
      nome: "Motorista e Longas Jornadas",
      paraQuem: "Aplicativo, entregas, atendimento em pé",
      como: "Pausas em cada parada, foco em lombar, quadril e pernas, circulação.",
      dica: "Cada parada (corrida, entrega, cliente) é uma chance de 2 minutos fora da posição."
    }
  };
  const DIA_CAOTICO = {
    nome: "Dia Caótico",
    como: "O mínimo de 2 pausas de 2 minutos vale o check. Ninguém sai do desafio por um dia ruim."
  };

  /* Semáforo dos Sinais (seção 10.4) */
  const SEMAFORO = {
    verde: { nome: "Verde", sente: "Desconforto leve, rigidez que passa ao se mexer", fazer: "Seguir o desafio normalmente." },
    amarelo: { nome: "Amarelo", sente: "Formigamento, peso, cansaço que volta todo dia", fazer: "Reforçar as pausas, versão mais leve, observar por alguns dias." },
    vermelho: { nome: "Vermelho", sente: "Dor forte, perda de força, dormência que não passa, dor que irradia para braço ou perna, dor à noite", fazer: "Parar os exercícios da região e procurar um médico ou fisioterapeuta." }
  };

  /* Os 21 dias. video: título do vídeo curto do dia (2 a 5 min). */
  const DIAS = [
    // Semana 1 · Descongelar
    { dia: 1, titulo: "O seu corpo não está pedindo academia", tarefa: "Faça 4 pausas com os 3 Rs e marque sua Escala da Dor.", gancho: "Heráclito: tudo flui. O corpo foi feito para fluir, não para congelar." },
    { dia: 2, titulo: "Regra 50/2: a pausa que cabe no seu dia", tarefa: "Configure os lembretes no horário do seu trabalho.", gancho: "Sêneca: não nos falta tempo, desperdiçamos parte dele." },
    { dia: 3, titulo: "Pescoço: a cabeça que foge para a tela", tarefa: "Faça a retração do queixo em todas as pausas de hoje.", gancho: "A dobradiça enferrujada: um pouco de óleo todo dia vale mais que uma lata por mês." },
    { dia: 4, titulo: "Ombros: tirando o peso das costas", tarefa: "Faça a abertura do peito na porta duas vezes hoje.", gancho: "Mateus 11:28: o convite aos cansados e sobrecarregados para encontrar descanso." },
    { dia: 5, titulo: "Punho e coluna: as articulações que mais trabalham", tarefa: "Inclua o deslizamento dos tendões em uma das pausas.", gancho: "A água parada: água parada estraga, água corrente se renova." },
    { dia: 6, titulo: "Sua estação de trabalho com o que você já tem", tarefa: "Ajuste a altura da tela e o apoio dos pés.", gancho: "Epicteto: você não controla a carga de trabalho, mas controla a próxima pausa." },
    { dia: 7, titulo: "Fechamento da semana 1: o corpo começou a soltar?", tarefa: "Compare: como está a rigidez no fim do dia em relação ao dia 1?", gancho: "Gênesis 2:2-3: até a criação teve uma pausa." },
    // Semana 2 · Destravar
    { dia: 8, titulo: "Mapa da Dor: a rotina da sua região", tarefa: "Faça a rotina da sua região de foco uma vez hoje.", gancho: "A corda de violão sempre esticada: uma hora ela arrebenta ou desafina." },
    { dia: 9, titulo: "Pausas invisíveis: ninguém percebe", tarefa: "Faça 2 pausas invisíveis durante reuniões ou atendimentos.", gancho: "Aristóteles: a excelência vem da repetição." },
    { dia: 10, titulo: "O ritual de desligar do trabalho", tarefa: "Faça o ritual de 10 minutos ao terminar o expediente.", gancho: "Eclesiastes 4:6: melhor uma mão cheia com descanso do que as duas cheias de correria." },
    { dia: 11, titulo: "Escala da Dor do dia 11", tarefa: "Marque sua Escala da Dor e compare com o dia 1.", gancho: "A árvore e o bambu: o que é rígido quebra; o que é flexível dobra e volta." },
    { dia: 12, titulo: "Estresse: o aplicativo aberto em segundo plano", tarefa: "Em cada pausa, alongue a respiração: solte o ar devagar.", gancho: "O celular com aplicativos abertos: o estresse gasta a bateria mesmo parado." },
    { dia: 13, titulo: "Comida e água nas pausas", tarefa: "Beba um copo de água a cada pausa.", gancho: "1 Coríntios 6:19: cuidar do corpo é zelo, não vaidade." },
    { dia: 14, titulo: "Fechamento da semana 2: qual é a sua cor?", tarefa: "Observe o semáforo de hoje e responda a revisão.", gancho: "Epicteto: foque no que depende de você." },
    // Semana 3 · Fortalecer
    { dia: 15, titulo: "Força leve: a sustentação da postura", tarefa: "Faça a rotina de força leve (8 min).", gancho: "Aristóteles e o hábito: 2 minutos repetidos vencem 1 hora de vez em quando." },
    { dia: 16, titulo: "Caminhada de 15 minutos", tarefa: "Caminhe 15 minutos, pode ser no intervalo do almoço.", gancho: "Heráclito: a vida é movimento." },
    { dia: 17, titulo: "Remada: costas fortes, ombros no lugar", tarefa: "Faça a rotina de força leve (8 min).", gancho: "A dobradiça enferrujada: o movimento curto e frequente é o óleo." },
    { dia: 18, titulo: "Sono: o presente que a dor rouba", tarefa: "Caminhe 15 minutos e faça o ritual de desligar.", gancho: "Salmos 127:2: o sono é um presente." },
    { dia: 19, titulo: "Pernas e quadril: levantar com leveza", tarefa: "Faça a rotina de força leve (8 min).", gancho: "A água parada: circulação precisa de movimento." },
    { dia: 20, titulo: "O hábito que fica depois do desafio", tarefa: "Caminhe 15 minutos e escolha seus 2 horários fixos de pausa.", gancho: "Sêneca: as pausas de 2 minutos já existem no seu dia." },
    { dia: 21, titulo: "Dia 21: o seu corpo descongelado", tarefa: "Marque a Escala da Dor final e veja sua evolução.", gancho: "Gênesis 2:2-3: o descanso faz parte da obra." }
  ];

  const SEMANAS = [
    { n: 1, nome: "Descongelar", resolve: "Rigidez e circulação", marco: "Menos rigidez ao fim do dia" },
    { n: 2, nome: "Destravar", resolve: "A dor específica", marco: "Escala da Dor do dia 11 menor que a do dia 1" },
    { n: 3, nome: "Fortalecer", resolve: "A dor voltar", marco: "Escala da Dor do dia 21, sono e disposição melhores" }
  ];

  /* Repetição espaçada: dias 1, 3, 7, 14 e 21 */
  const REVISOES = {
    1:  { pergunta: "A dor do trabalho vem principalmente de…", opcoes: ["Excesso de esforço", "Falta de movimento", "Falta de academia"], certa: 1, explica: "A dor vem de ficar horas na mesma posição: o Corpo Congelado." },
    3:  { pergunta: "O que diz a Regra 50/2?", opcoes: ["50 exercícios em 2 dias", "A cada 50 minutos, 2 minutos de pausa", "50 minutos de academia, 2 vezes por semana"], certa: 1, explica: "A cada 50 minutos sentado, 2 minutos de pausa." },
    7:  { pergunta: "Quais são os 3 Rs da pausa?", opcoes: ["Reposiciona, Respira, Remexe", "Relaxa, Repousa, Recomeça", "Roda, Respira, Repete"], certa: 0, explica: "Reposiciona, Respira e Remexe." },
    14: { pergunta: "Formigamento que volta todo dia é qual cor do semáforo?", opcoes: ["Verde", "Amarelo", "Vermelho"], certa: 1, explica: "Amarelo: reforçar as pausas, versão mais leve e observar." },
    21: { pergunta: "O que vence a dor do trabalho?", opcoes: ["Esforço longo e raro", "Pausas curtas e frequentes", "Remédio quando dói"], certa: 1, explica: "Pausas curtas e frequentes vencem esforço longo e raro." }
  };

  /* Mini curso (seção 9.2). Regra 1-1-1: uma ideia, uma analogia, uma ação. */
  const AULAS = [
    { n: 1, titulo: "O mistério do Corpo Congelado", min: 10, ideia: "A dor não vem do esforço, vem da falta de movimento.", analogia: "A dobradiça enferrujada.", acao: "Hoje, levante a cada 50 minutos.", gancho: "Heráclito: tudo flui." },
    { n: 2, titulo: "O Semáforo dos Sinais", min: 8, ideia: "O corpo avisa antes da lesão; a dor é o último aviso, não o primeiro.", analogia: "A corda de violão sempre esticada.", acao: "Marque a cor do seu semáforo hoje.", gancho: "1 Coríntios 6:19: o corpo como templo." },
    { n: 3, titulo: "A Regra 50/2 e os 3 Rs", min: 10, ideia: "Pausas curtas e frequentes vencem esforço longo e raro.", analogia: "A água parada.", acao: "Faça sua primeira pausa com os 3 Rs.", gancho: "Aristóteles: a excelência vem da repetição." },
    { n: 4, titulo: "O Tripé Religar: sono, estresse e alimentação", min: 9, ideia: "A dor do trabalho não vem só da postura.", analogia: "O celular com aplicativos abertos.", acao: "Faça o ritual de desligar hoje à noite.", gancho: "Salmos 127:2: o sono é um presente." },
    { n: 5, titulo: "Sua trilha e sua estação de trabalho", min: 8, ideia: "A rotina certa para o seu tipo de trabalho.", analogia: "A árvore e o bambu.", acao: "Ajuste a tela na altura dos olhos.", gancho: "Epicteto: controle a próxima pausa." }
  ];

  /* Bônus (order bumps e upsell) */
  const BONUS = [
    { id: "bump1", nome: "Kit Mesa Certa", preco: 9.9, descricao: "Ajuste de monitor, cadeira, teclado, mouse e punho em 5 minutos com o que você já tem em casa. Checklist com foto, versão para notebook e para quem trabalha em pé." },
    { id: "bump2", nome: "Pausas em Áudio + Ritual de Desligar", preco: 12.9, descricao: "Áudios guiados de 2 minutos para fazer de olhos fechados ou de câmera desligada, e o ritual de 10 minutos para desligar do trabalho e dormir melhor." },
    { id: "bump3", nome: "Marmita de Quem Trabalha Sentado", preco: 14.9, descricao: "Cardápio de 21 dias, marmita de domingo em 1 hora, lanches de mesa e hidratação nas pausas." },
    { id: "upsell", nome: "Religar Trabalho 60", preco: 67, descricao: "60 dias de fortalecimento progressivo para a dor não voltar, rotinas por profissão, comunidade e encontro ao vivo mensal." },
    { id: "downsell", nome: "Religar Trabalho 60 Essencial", preco: 37, descricao: "A mesma progressão de 60 dias, sem comunidade e sem encontros ao vivo." }
  ];

  const PDFS = [
    { nome: "Guia Descongelar", arquivo: "#pdf-guia-descongelar" },
    { nome: "Planner de 21 dias", arquivo: "#pdf-planner-21-dias" },
    { nome: "Cartão das Pausas Invisíveis", arquivo: "#pdf-cartao-pausas-invisiveis" }
  ];

  /* =========================================================
     CENTRAL DE ALÍVIO EXPRESS
     Trilhas por zona de dor × 3 formatos de aplicação.
     Cada protocolo: lista de [id do exercício, segundos].
     "respira" é a abertura padrão de 20 s.
     ========================================================= */
  const TRILHAS_ZONA = {
    lombar: {
      nome: "Descompressão da Lombar e Quadril",
      paraQuem: "Para quem passa horas sentado ou de pé.",
      regioes: ["lombar", "pernas"], emoji: "🪑"
    },
    cervical: {
      nome: "Destrava de Ombros, Cervical e Pescoço",
      paraQuem: "Para quem acumula tensão do trabalho e da postura.",
      regioes: ["pescoco", "ombros"], emoji: "🦒"
    },
    joelhos: {
      nome: "Estabilização e Alívio de Joelhos",
      paraQuem: "Para quem sente impacto ao andar ou subir escadas.",
      regioes: ["joelhos"], emoji: "🦵"
    },
    punho: {
      nome: "Alívio de Punho e Mão",
      paraQuem: "Para quem vive no mouse, no teclado ou repetindo movimento com as mãos.",
      regioes: ["punho"], emoji: "✋"
    }
  };
  const trilhaDaRegiao = (regiao) =>
    Object.keys(TRILHAS_ZONA).find((k) => TRILHAS_ZONA[k].regioes.includes(regiao)) || "cervical";

  const FORMATOS = {
    expediente: { nome: "Protocolo Express de Expediente", curto: "Expediente", min: 3, emoji: "💼", texto: "Movimentos discretos para fazer na cadeira do trabalho ou em pé no intervalo, sem trocar de roupa." },
    matinal: { nome: "Protocolo Matinal de Destrava", curto: "Matinal", min: 5, emoji: "☀️", texto: "Para acordar sem a sensação de corpo pesado ou travado. Dá para fazer na cama." },
    noturno: { nome: "Protocolo Noturno de Descompressão", curto: "Noturno", min: 5, emoji: "🌙", texto: "Para soltar a musculatura antes de dormir e ajudar o corpo a relaxar." }
  };

  const PROTOCOLOS = {
    lombar: {
      expediente: [["respira", 20], ["inclinacao-pelve", 30], ["gato-vaca-sentado", 40], ["rotacao-tronco", 40], ["flexor-quadril", 30], ["panturrilha", 20]],
      matinal: [["respira", 20], ["joelhos-peito", 50], ["torcao-deitado", 50], ["ponte-gluteo", 50], ["gato-vaca-4-apoios", 60], ["postura-crianca", 40], ["extensao-pe", 30]],
      noturno: [["respiracao-4-6", 40], ["joelhos-peito", 50], ["figura-4", 60], ["torcao-deitado", 50], ["pernas-parede", 70], ["respiracao-4-6", 30]]
    },
    cervical: {
      expediente: [["respira", 20], ["retracao-queixo", 30], ["inclinacao-lateral", 30], ["encolher-ombros", 30], ["juncao-escapulas", 30], ["rotacao-pescoco", 40]],
      matinal: [["respira", 20], ["espreguicar", 30], ["anjo-no-chao", 60], ["retracao-queixo", 40], ["rotacao-pescoco", 40], ["gato-vaca-4-apoios", 50], ["abertura-peito", 60]],
      noturno: [["respiracao-4-6", 40], ["encolher-ombros", 30], ["inclinacao-lateral", 50], ["anjo-no-chao", 60], ["postura-crianca", 60], ["respiracao-4-6", 60]]
    },
    joelhos: {
      expediente: [["respira", 20], ["bombinha-tornozelo", 30], ["isometria-quadriceps", 40], ["extensao-joelho-sentado", 40], ["alongamento-posterior-sentado", 30], ["panturrilha", 20]],
      matinal: [["respira", 20], ["bombinha-tornozelo", 40], ["deslizamento-calcanhar", 60], ["toalha-joelho", 50], ["ponte-gluteo", 50], ["abducao-lado", 50], ["sentar-levantar", 30]],
      noturno: [["respiracao-4-6", 40], ["alongamento-posterior-sentado", 50], ["figura-4", 60], ["pernas-parede", 70], ["bombinha-tornozelo", 40], ["respiracao-4-6", 40]]
    },
    punho: {
      expediente: [["respira", 20], ["abrir-fechar-mao", 30], ["deslizamento-tendoes", 40], ["flexores-extensores", 40], ["encolher-ombros", 20], ["juncao-escapulas", 30]],
      matinal: [["respira", 20], ["espreguicar", 30], ["abrir-fechar-mao", 40], ["deslizamento-tendoes", 50], ["flexores-extensores", 60], ["abertura-peito", 50], ["encolher-ombros", 50]],
      noturno: [["respiracao-4-6", 40], ["flexores-extensores", 60], ["deslizamento-tendoes", 50], ["encolher-ombros", 40], ["postura-crianca", 60], ["respiracao-4-6", 50]]
    }
  };

  /* Bônus incluídos no produto principal (matam o medo de errar) */
  const BONUS_INCLUSOS = {
    seguranca: {
      nome: "Trava de Segurança Articular",
      formato: "Vídeo de 4 min",
      promessa: "O que nunca fazer ao sentir dor. Tira o medo de fazer o movimento errado e piorar.",
      regraDeOuro: {
        pode: ["Tensão leve", "Calor no músculo", "Sensação de alívio"],
        pare: ["Pontada ou fisgada", "Choque", "Formigamento que aumenta", "Dor que corre para o braço ou a perna"]
      },
      nunca: [
        ["Alongar até doer", "O certo é sentir uma tensão leve. Fisgada é sinal de parar e diminuir a amplitude."],
        ["Fazer movimento com embalo", "Balançar para ir mais longe puxa o músculo de surpresa. Vá devagar e segure."],
        ["Prender a respiração", "Respiração presa aumenta a tensão. Solte o ar na parte mais difícil do movimento."],
        ["Girar o pescoço em círculos rápidos", "Prefira movimentos separados e lentos: olhar para o lado, inclinar, levar o queixo para trás."],
        ["Forçar a lombar travada a encostar a mão no chão", "Com a lombar travada, comece pelos movimentos pequenos da pelve e da respiração."],
        ["Deixar o joelho entrar para dentro ou agachar fundo com dor", "Joelho alinhado com o pé e só até onde não dói."],
        ["Insistir quando formiga, adormece ou a dor corre", "Pare o exercício da região e confira o Semáforo dos Sinais."],
        ["Tomar remédio para aguentar o exercício", "A dor é o aviso. Se precisa de remédio para se mexer, fale com um profissional."],
        ["Ficar dias parado esperando passar", "Na maioria das dores comuns, o repouso total aumenta a rigidez. Mexa-se de leve, dentro do que não dói."]
      ]
    },
    socorro: {
      nome: "Guia de Socorro para Crises Agudas",
      formato: "Guia passo a passo",
      promessa: "O que fazer quando a coluna, o pescoço ou o joelho travar no meio do dia.",
      passos: [
        ["Pare e respire", "Faça 1 minuto de Respiração 4-6. O susto contrai ainda mais o músculo."],
        ["Procure a posição de alívio", "Escolha abaixo a posição para a região que travou e fique nela de 3 a 5 minutos."],
        ["Faça só movimentos mínimos, sem dor", "Movimentos bem pequenos dentro do que não dói: a pelve rolando de leve, o queixo indo para trás, a bombinha de tornozelo."],
        ["Use calor, se fizer bem", "Uma bolsa morna por 15 a 20 minutos, sempre com um pano entre ela e a pele, ajuda o músculo a relaxar."],
        ["Volte a se mexer aos poucos", "Ainda no mesmo dia, caminhe alguns passos a cada hora. Para levantar da cama com a lombar travada, role de lado e empurre com os braços."]
      ],
      posicoes: {
        lombar: "Deitado de barriga para cima com as pernas apoiadas numa cadeira (joelhos dobrados), ou de lado com um travesseiro entre os joelhos.",
        cervical: "Sentado com as costas e a cabeça apoiadas, braços apoiados nas coxas ou numa almofada. Deitado, use um travesseiro baixo.",
        joelhos: "Sentado com a perna esticada e apoiada, sem nada embaixo do joelho que o deixe dobrado por muito tempo.",
        punho: "Antebraço apoiado na mesa, punho reto e solto, mão relaxada. Evite mouse e celular por alguns minutos."
      },
      alertas: [
        "A dor começou depois de uma queda, batida ou acidente",
        "Perda de força no braço ou na perna",
        "Dormência entre as pernas ou na região íntima, ou perda de controle do xixi ou do cocô",
        "Febre junto com dor nas costas",
        "Dor no pescoço, ombro, mandíbula ou braço esquerdo com aperto no peito, falta de ar ou suor frio (pode ser o coração)",
        "Joelho muito inchado, quente ou que não aguenta o peso do corpo",
        "Dor que piora muito, não alivia com a posição de alívio ou não melhora em poucos dias"
      ]
    }
  };

  window.RELIGAR_DADOS = {
    REGIOES, EXERCICIOS, ex, ROTINAS, OS_3_RS, TRILHAS, DIA_CAOTICO,
    SEMAFORO, DIAS, SEMANAS, REVISOES, AULAS, BONUS, PDFS,
    TRILHAS_ZONA, trilhaDaRegiao, FORMATOS, PROTOCOLOS, BONUS_INCLUSOS
  };
})();
