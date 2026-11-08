/* =========================================================
   DADOS DA BARBEARIA — edite aqui (preços, barbeiros, horários)
   ========================================================= */
const SHOP = {
  nome: "Barbe Skin",
  endereco: "Rua Gilberto Duarte de Azevedo, 44",
  whatsapp: "",   // ex.: "5511999999999" (com DDI + DDD, só números). Vazio = botão oculto.
  instagram: "",  // ex.: "barbeskin"
};

/* Dia da semana (0 = domingo ... 6 = sábado): [abre, fecha]. Ausente = fechado. */
const HORARIOS = {
  2: ["10:00", "19:00"], // terça
  3: ["10:00", "19:00"], // quarta
  4: ["09:00", "20:00"], // quinta
  5: ["08:00", "22:30"], // sexta
  6: ["08:00", "22:30"], // sábado
};
const INTERVALO_SLOTS = 30;   // minutos entre opções de horário
const DIAS_A_FRENTE   = 21;   // quantos dias o cliente pode agendar à frente
const ANTECEDENCIA_MIN = 30;  // minutos mínimos de antecedência no mesmo dia

/* Especialidades provisórias — confirmar com cada barbeiro */
const BARBEIROS = [
  { id: "messinho", nome: "Messinho", esp: ["Degradê", "Navalhado", "Freestyle", "Nevou"], tipos: ["liso", "ondulado", "cacheado", "crespo"] },
  { id: "shark",    nome: "Shark",    esp: ["Afro", "Twist", "Barba", "Na régua"],         tipos: ["liso", "ondulado", "cacheado", "crespo"] },
];

const CATEGORIAS = {
  pacotes:  "Pacotes",
  cabelo:   "Cortes",
  quebrada: "Quebrada SP",
  barba:    "Barba",
  afro:     "Afro & Crespo",
  quimica:  "Platinado & Cor",
  extras:   "Extras",
};

/* Preços: cortes e pacotes de R$ 40 a R$ 80; platinado com corte R$ 120 / + barba R$ 130 */
const SERVICOS = [
  /* ---- Pacotes (o cliente escolhe só o que quer) ---- */
  { id: "so-corte",       cat: "pacotes", nome: "Só corte",                     preco: 50,  dur: 40,  desc: "Qualquer corte da casa: social, degradê, disfarçado ou navalhado." },
  { id: "so-barba",       cat: "pacotes", nome: "Só barba",                     preco: 40,  dur: 30,  desc: "Barba desenhada na navalha, com toalha quente." },
  { id: "so-sobrancelha", cat: "pacotes", nome: "Só sobrancelha",               preco: 40,  dur: 15,  desc: "Design na navalha ou pinça, com risco opcional." },
  { id: "corte-sobr",     cat: "pacotes", nome: "Corte + Sobrancelha",          preco: 60,  dur: 50,  desc: "Corte da casa com sobrancelha alinhada." },
  { id: "combo-cb",       cat: "pacotes", nome: "Corte + Barba",                preco: 70,  dur: 70,  desc: "O clássico: corte e barba desenhada na navalha." },
  { id: "combo-cbs",      cat: "pacotes", nome: "Corte + Barba + Sobrancelha",  preco: 80,  dur: 80,  desc: "O pacote completo para sair na régua." },
  { id: "plat-corte",     cat: "pacotes", nome: "Platinado + Corte",            preco: 120, dur: 150, desc: "Nevou completo com corte. Não inclui progressiva." },
  { id: "plat-corte-barba", cat: "pacotes", nome: "Platinado + Corte + Barba",  preco: 130, dur: 180, desc: "Nevou com corte e barba desenhada. Não inclui progressiva." },

  /* ---- Cortes ---- */
  { id: "social",     cat: "cabelo",  nome: "Corte social",                    preco: 40,  dur: 30,  desc: "Máquina e tesoura, acabamento clássico." },
  { id: "degrade",    cat: "cabelo",  nome: "Degradê (low, mid, high, taper)", preco: 50,  dur: 40,  desc: "Fade com transição suave e acabamento na navalha." },
  { id: "navalhado",  cat: "cabelo",  nome: "Navalhado / Skin fade",           preco: 55,  dur: 45,  desc: "Base zerada na navalha, transição até o topo." },
  { id: "tesoura",    cat: "cabelo",  nome: "Corte na tesoura",                preco: 60,  dur: 45,  desc: "Sem máquina, para cabelos médios e longos." },
  { id: "infantil",   cat: "cabelo",  nome: "Corte infantil",                  preco: 40,  dur: 30,  desc: "Até 12 anos." },
  { id: "pezinho",    cat: "cabelo",  nome: "Pezinho / Manutenção",            preco: 20,  dur: 15,  desc: "Acabamento de nuca e costeletas entre um corte e outro." },

  /* ---- Cortes da quebrada (São Paulo) ---- */
  { id: "disfarcado", cat: "quebrada", nome: "Corte disfarçado",               preco: 50,  dur: 40,  desc: "Topo cheio, laterais bem curtas descendo num degradê suave até a nuca na navalha." },
  { id: "jaca",       cat: "quebrada", nome: "Corte do Jaca",                  preco: 55,  dur: 45,  desc: "Mid fade a dois dedos da orelha, com risco freestyle. Veio do Jacarezinho e é muito pedido em SP." },
  { id: "deg-naval",  cat: "quebrada", nome: "Degradê navalhado",              preco: 55,  dur: 45,  desc: "Degradê finalizado na navalha, um dos mais pedidos nas barbearias de SP." },
  { id: "mullet-ch",  cat: "quebrada", nome: "Mullet chavoso",                 preco: 60,  dur: 50,  desc: "Mullet com burst fade e pezinho na régua, inspirado nos MCs do funk." },
  { id: "blindado",   cat: "quebrada", nome: "Cabelo blindado",                preco: 60,  dur: 50,  desc: "Topete alto e firme com laterais em degradê. Estilo nascido na periferia de SP." },
  { id: "jaca-risco", cat: "quebrada", nome: "Degradê + Risco + Sobrancelha riscada", preco: 70, dur: 55, desc: "O kit da quebrada: degradê, risco na lateral e sobrancelha riscada." },
  { id: "regua-sp",   cat: "quebrada", nome: "Pezinho na régua",               preco: 20,  dur: 15,  desc: "Contorno de testa, costeleta e nuca na navalha. Mantém o corte em dia." },

  /* ---- Barba ---- */
  { id: "barba",      cat: "barba",   nome: "Barba desenhada",                 preco: 40,  dur: 30,  desc: "Modelagem e contorno na navalha." },
  { id: "barboterapia", cat: "barba", nome: "Barboterapia",                    preco: 55,  dur: 40,  desc: "Toalha quente, espuma, navalha e hidratação." },
  { id: "barba-afro", cat: "barba",   nome: "Barba sem encravar",              preco: 45,  dur: 35,  desc: "Técnica para pele negra e pelo crespo: máquina, esfoliação e navalha só no contorno." },
  { id: "deg-barba",  cat: "barba",   nome: "Degradê na barba",                preco: 45,  dur: 30,  desc: "A costeleta desce em degradê e se funde com o corte." },
  { id: "pig-barba",  cat: "barba",   nome: "Pigmentação de barba",            preco: 40,  dur: 20,  desc: "Preenche falhas e define o desenho." },

  /* ---- Afro ---- */
  { id: "afro",       cat: "afro",    nome: "Corte afro / Black power",        preco: 55,  dur: 45,  desc: "Volume moldado na tesoura e garfo, com ou sem taper." },
  { id: "twist",      cat: "afro",    nome: "Twist de esponja",                preco: 60,  dur: 40,  desc: "Torções no topo com esponja, combinando com degradê." },
  { id: "nago",       cat: "afro",    nome: "Tranças nagô",                    preco: 80,  dur: 90,  desc: "Tranças rentes, retas ou desenhadas." },
  { id: "dreads",     cat: "afro",    nome: "Manutenção de dreads",            preco: 80,  dur: 90,  desc: "Retoque de raiz e acabamento." },
  { id: "regua",      cat: "afro",    nome: "Na régua (line up)",              preco: 20,  dur: 15,  desc: "Contorno perfeito de testa e têmporas." },

  /* ---- Platinado & cor ---- */
  { id: "nevou",      cat: "quimica", nome: "Nevou / Platinado + Corte",       preco: 120, dur: 150, desc: "Descoloração global e matização, com corte. Sem progressiva." },
  { id: "nevou-barba",cat: "quimica", nome: "Nevou / Platinado + Corte + Barba", preco: 130, dur: 180, desc: "Platinado, corte e barba desenhada. Sem progressiva." },
  { id: "luzes",      cat: "quimica", nome: "Luzes + Corte",                   preco: 80,  dur: 90,  desc: "Mechas descoloridas no topo, com corte." },
  { id: "progressiva",cat: "quimica", nome: "Progressiva / Selagem",           preco: 80,  dur: 90,  desc: "Reduz volume e frizz. Serviço separado do platinado." },
  { id: "pig-cabelo", cat: "quimica", nome: "Pigmentação capilar",             preco: 40,  dur: 20,  desc: "Realça o degradê e disfarça falhas." },

  /* ---- Extras ---- */
  { id: "freestyle",  cat: "extras",  nome: "Risco / Freestyle",               preco: 15,  dur: 10,  desc: "Desenho na lateral (valor do risco simples)." },
  { id: "sobr-riscada", cat: "extras", nome: "Sobrancelha riscada (adicional)", preco: 10, dur: 5,   desc: "1 a 3 riscos na navalha, somado a outro serviço." },
  { id: "hidratacao", cat: "extras",  nome: "Hidratação",                      preco: 30,  dur: 20,  desc: "Recomendada para cachos e crespos." },
  { id: "cera",       cat: "extras",  nome: "Depilação nariz / orelha",        preco: 20,  dur: 10,  desc: "Com cera." },
];

const TIPOS_CABELO = [
  { id: "liso",     nome: "Liso" },
  { id: "ondulado", nome: "Ondulado" },
  { id: "cacheado", nome: "Cacheado (3A–3C)" },
  { id: "crespo",   nome: "Crespo (4A–4C)" },
];

/* Catálogo de estilos */
const ESTILOS = [
  { nome: "Low fade",          grupo: "Degradê",    tipos: ["liso","ondulado","cacheado","crespo"], servico: "degrade",   desc: "Degradê baixo, perto da orelha. Discreto e o mais pedido." },
  { nome: "Mid fade",          grupo: "Degradê",    tipos: ["liso","ondulado","cacheado","crespo"], servico: "degrade",   desc: "Transição na altura das têmporas. O equilíbrio clássico." },
  { nome: "High fade",         grupo: "Degradê",    tipos: ["liso","ondulado","cacheado","crespo"], servico: "degrade",   desc: "Degradê sobe até perto do topo. Visual marcante." },
  { nome: "Skin fade",         grupo: "Degradê",    tipos: ["liso","ondulado","cacheado","crespo"], servico: "navalhado", desc: "Base zerada na navalha, pele aparecendo." },
  { nome: "Taper fade", foto: "img/corte-taper.jpg",        grupo: "Degradê",    tipos: ["cacheado","crespo","ondulado"],        servico: "degrade",   desc: "Só costeletas e nuca degradadas. Valoriza cachos e crespos." },
  { nome: "Burst fade",        grupo: "Degradê",    tipos: ["liso","ondulado","cacheado","crespo"], servico: "degrade",   desc: "Meia-lua ao redor da orelha. Combina com mullet e moicano." },
  { nome: "Corte americano",   grupo: "Clássico",   tipos: ["liso","ondulado"],                     servico: "degrade",   desc: "Laterais em fade e topo médio. Líder no Brasil." },
  { nome: "Crop texturizado",  grupo: "Clássico",   tipos: ["liso","ondulado","cacheado"],          servico: "degrade",   desc: "Franja curta texturizada com laterais em fade. Tendência 2026." },
  { nome: "Social",            grupo: "Clássico",   tipos: ["liso","ondulado"],                     servico: "social",    desc: "Laterais curtas e topo penteável." },
  { nome: "Buzz cut",          grupo: "Clássico",   tipos: ["liso","ondulado","cacheado","crespo"], servico: "social",    desc: "Máquina uniforme no topo com degradê nas laterais." },
  { nome: "Pompadour",         grupo: "Clássico",   tipos: ["liso","ondulado"],                     servico: "tesoura",   desc: "Volume alto na frente, finalizado com pomada." },
  { nome: "Mullet moderno",    grupo: "Brasileiro", tipos: ["liso","ondulado","cacheado"],          servico: "degrade",   desc: "Curto na frente e laterais, longo na nuca. Com pezinho é assinatura." },
  { nome: "Nevou",             grupo: "Brasileiro", tipos: ["liso","ondulado","cacheado","crespo"], servico: "nevou",     desc: "Platinado quase branco, geralmente com degradê." },
  { nome: "Luzes",             grupo: "Brasileiro", tipos: ["ondulado","cacheado","crespo"],        servico: "luzes",     desc: "Reflexo no topo — destaca o cacho." },
  { nome: "Freestyle", foto: "img/corte-risco.jpg",         grupo: "Brasileiro", tipos: ["liso","ondulado","cacheado","crespo"], servico: "degrade",   desc: "Degradê com riscos e desenhos na lateral, feitos na navalha. Risco: + R$ 15." },
  { nome: "Corte disfarçado",  grupo: "Quebrada SP", tipos: ["liso","ondulado","cacheado","crespo"], servico: "disfarcado", desc: "Topo cheio e degradê suave até a nuca na navalha. O queridinho da quebrada." },
  { nome: "Corte do Jaca", foto: "img/corte-jaca-x.jpg",     grupo: "Quebrada SP", tipos: ["liso","ondulado","cacheado","crespo"], servico: "jaca",       desc: "Mid fade a dois dedos da orelha + risco freestyle. Do Jacarezinho para as barbearias de SP." },
  { nome: "Degradê navalhado", grupo: "Quebrada SP", tipos: ["liso","ondulado","cacheado","crespo"], servico: "deg-naval",  desc: "Fade finalizado na navalha, pele aparecendo na base." },
  { nome: "Mullet chavoso",    grupo: "Quebrada SP", tipos: ["liso","ondulado","cacheado"],          servico: "mullet-ch",  desc: "Mullet com burst fade e pezinho na régua, estilo MC do funk." },
  { nome: "Cabelo blindado",   grupo: "Quebrada SP", tipos: ["liso","ondulado"],                     servico: "blindado",   desc: "Topete alto e firme, criado na periferia paulista." },
  { nome: "Nevou com risco", foto: "img/corte-nevou-x.jpg",   grupo: "Quebrada SP", tipos: ["liso","ondulado","cacheado","crespo"], servico: "nevou",      desc: "Platinado branco com degradê e risco na lateral." },
  { nome: "Sobrancelha riscada", grupo: "Quebrada SP", tipos: ["liso","ondulado","cacheado","crespo"], servico: "so-sobrancelha", desc: "1, 2 ou 3 riscos na navalha. Combina com o degradê." },
  { nome: "Black power",       grupo: "Afro",       tipos: ["crespo","cacheado"],                   servico: "afro",      desc: "Volume natural arredondado, moldado na tesoura." },
  { nome: "Afro com taper",    grupo: "Afro",       tipos: ["crespo","cacheado"],                   servico: "afro",      desc: "Volume no topo, laterais e nuca degradadas." },
  { nome: "High top",          grupo: "Afro",       tipos: ["crespo"],                              servico: "afro",      desc: "Topo alto e reto, laterais em fade. Precisão total." },
  { nome: "Caesar",            grupo: "Afro",       tipos: ["crespo","cacheado"],                   servico: "social",    desc: "Curto e uniforme com franja reta e régua." },
  { nome: "360 waves",         grupo: "Afro",       tipos: ["crespo"],                              servico: "social",    desc: "Ondas em espiral: corte curto uniforme + escovação e durag." },
  { nome: "Twist de esponja",  grupo: "Afro",       tipos: ["crespo"],                              servico: "twist",     desc: "Torções definidas no topo com degradê nas laterais." },
  { nome: "Dreads",            grupo: "Afro",       tipos: ["crespo","cacheado"],                   servico: "dreads",    desc: "Início e manutenção de locs; com ou sem degradê." },
  { nome: "Tranças nagô",      grupo: "Afro",       tipos: ["crespo","cacheado"],                   servico: "nago",      desc: "Tranças rentes ao couro, retas ou desenhadas." },
];

/* Planos de assinatura (valores provisórios) */
const PLANOS = [
  { id: "avulso", nome: "Avulso", icone: "user", desc: "Para quem vem de vez em quando e quer liberdade total.",
    preco: 50, sufixo: "por corte", nota: "Sem mensalidade", cta: "Agendar agora", destaque: false,
    info: "Pague só quando vier. Sem fidelidade.",
    itens: ["Qualquer barbeiro da casa", "Ficha técnica do seu corte salva", "Lembrete de retorno no WhatsApp"] },
  { id: "clube", nome: "Clube Corte", icone: "star", desc: "Para quem não deixa o degradê crescer.",
    preco: 99, sufixo: "por mês", nota: "Cancele quando quiser", cta: "Assinar o Clube", destaque: true,
    info: "Cortes ilimitados. Sai mais barato a partir do 2º corte no mês.",
    itens: ["Cortes ilimitados (terça a quinta)", "Pezinho e sobrancelha inclusos", "Prioridade nos horários de sexta e sábado", "10% off em produtos"] },
  { id: "premium", nome: "Clube Corte + Barba", icone: "crown", desc: "O pacote completo para quem cuida do visual toda semana.",
    preco: 159, sufixo: "por mês", nota: "Cancele quando quiser", cta: "Assinar o Premium", destaque: false,
    info: "Corte e barba ilimitados em todos os dias de funcionamento.",
    itens: ["Corte e barba ilimitados (todos os dias)", "1 barboterapia por mês", "15% off em química (nevou, luzes)", "Agendamento prioritário com seu barbeiro"] },
];

/* Fotos da capa (passam em sequência). Adicione mais caminhos aqui. */
const HERO_FOTOS = [
  { src: "img/hero-maos.jpg", alt: "Mãos tatuadas de barbeiro segurando tesoura e pente" },
];
/* Para colocar foto em um corte do catálogo, adicione  foto: "img/nome.jpg"  no item de ESTILOS. */

/* Proprietário (aparece na seção "Sobre a casa") */
const DONO = {
  nome: "",                       // ex.: "Messias" — vazio mostra só o cargo
  cargo: "Fundador & barbeiro",
  foto: "img/dono-poltrona.jpg",
  foto2: "img/dono-maquina.jpg",
};


/* Banco online (Supabase). A chave abaixo é pública por natureza:
   a segurança vem das regras de acesso (RLS) configuradas no banco. */
const SUPABASE = {
  url: "https://wgxpfgigwmixejzisooc.supabase.co",
  chave: "sb_publishable_bmuRh4EF0ZETRxdEHhlGzA_vdFamszO",
};
