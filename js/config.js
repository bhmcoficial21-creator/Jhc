/* ==========================================================================
   JSD™ — CONFIGURAÇÃO ÚNICA DO SITE
   Tudo que você precisa trocar (marca, fotos, vídeos, produtos, textos)
   está neste arquivo. Veja o README.md para o passo a passo.
   ========================================================================== */
window.JSD_CONFIG = {

  /* ---------- MARCA ---------- */
  brand: {
    name: "JSD",
    tm: "™",
    tagline: "Private • Vault Drop",
    instagram: "jsd_pvd",
    logo: "assets/logo.svg" // troque pelo seu logo (SVG, PNG ou WebP, formato quadrado)
  },

  /* ---------- CONTATO ---------- */
  contact: {
    whatsapp: "5500000000000",        // [número] só dígitos: 55 + DDD + número
    whatsappDisplay: "(00) 00000-0000",
    note: "Atendimento por mensagem, direto com a equipe JSD."
  },

  /* ---------- LOJA ---------- */
  store: {
    freeShippingFrom: 299,   // R$ [valor] do frete grátis
    pixDiscount: 0.10,       // 10% de desconto no Pix
    pageSize: 8,             // peças por página em "Carregar mais"
    announcements: [
      "Frete grátis acima de R$ 299",
      "10% off no Pix em todos os lançamentos",
      "Drops limitados saindo do cofre"
    ]
  },

  /* ---------- ABERTURA (HERO) ----------
     Troque as imagens por fotos reais (JPG/WebP). Use duas versões da MESMA foto:
     retrato 9:16 e paisagem 16:9. O `mask` é o contorno da "janela" nas costas da
     camisa, em % da imagem (x, y). Ajuste os pontos até casar com o contorno real.
     Dica: abra o site com ?mask=1 para ver o contorno desenhado. */
  hero: {
    alt: "Modelo de costas com camisa amarela de seleção brasileira, sentado diante de um estádio moderno à noite, com arquibancadas cheias e refletores acesos.",
    portrait: {
      image: "assets/hero-portrait.svg",
      ratio: 9 / 16,
      mask: [[36.7, 61.6], [63.3, 61.6], [64.7, 74.4], [50, 75.9], [35.3, 74.4]]
    },
    landscape: {
      image: "assets/hero-landscape.svg",
      ratio: 16 / 9,
      mask: [[44.75, 49.9], [55.25, 49.9], [55.78, 65.9], [50, 67.8], [44.2, 65.9]]
    },
    /* A janela aceita quantos lances você quiser: basta adicionar/remover itens.
       src = vídeo completo · srcMobile = versão leve (usada no celular) · tone = índice em `tones` */
    videos: [
      { src: "assets/video/lance-1.mp4", srcMobile: "assets/video/lance-1-leve.mp4", poster: "", label: "Lance 01 · Drible curto", tone: 0 },
      { src: "assets/video/lance-2.mp4", srcMobile: "assets/video/lance-2-leve.mp4", poster: "", label: "Lance 02 · Pedalada",     tone: 1 },
      { src: "assets/video/lance-3.mp4", srcMobile: "assets/video/lance-3-leve.mp4", poster: "", label: "Lance 03 · Chapéu",       tone: 2 }
    ],
    placeholderSeconds: 4,   // duração dos lances provisórios (quando o arquivo não existe)
    videoGrayscale: true,    // mantém o vídeo em preto e branco (amarelo da camisa fica o único ponto de cor)
    /* Tom da luz do estádio a cada lance. Mantidos em tons neutros (branco/prata).
       Para um brilho colorido, use RGB, ex.: glow: "255,200,0". */
    tones: [
      { glow: "255,255,255", glowAlpha: 0.55, beamAngle: -8,  brightness: 1.00, contrast: 1.05, spotX: "50%" },
      { glow: "200,205,215", glowAlpha: 0.40, beamAngle: 7,   brightness: 0.86, contrast: 1.20, spotX: "24%" },
      { glow: "240,240,240", glowAlpha: 0.70, beamAngle: -20, brightness: 1.10, contrast: 0.98, spotX: "76%" }
    ]
  },

  /* ---------- VISUALIZADOR 360° ----------
     Coloque as fotos em assets/360/<id-do-produto>/01.jpg … 36.jpg
     Sem fotos, o site mostra um modelo giratório provisório. */
  viewer360: {
    framePattern: "assets/360/{id}/{n}.jpg", // {n} = 01, 02 …
    frameCount: 36
  },

  /* ---------- FILTROS / TABELAS ---------- */
  sizes: ["P", "M", "G", "GG", "XG"],
  sizeChart: { // medidas em cm
    unit: "cm",
    columns: ["Largura (peito)", "Comprimento", "Manga"],
    rows: {
      P:  [50, 70, 20],
      M:  [53, 72, 21],
      G:  [56, 74, 22],
      GG: [59, 76, 23],
      XG: [62, 78, 24]
    },
    note: "Medidas da peça, tiradas com ela esticada sobre uma superfície plana. Pode haver variação de 1 a 2 cm."
  },

  /* ---------- PRODUTOS ----------
     badge: "Novo" | "Edição limitada" | "Esgotado" | "" ·  images: lista de fotos
     (vazio = imagem provisória gerada pelo site) ·  unavailable: tamanhos sem estoque */
  products: [
    { id: "selecao-brasil-i", name: "Camisa Seleção Brasil I", team: "Seleção Brasil", group: "Seleções", type: "Camisa",
      price: 349.90, badge: "Novo", featured: true, sizes: ["P","M","G","GG","XG"], unavailable: ["XG"],
      colors: [{ name: "Amarelo", hex: "#f2c500" }], images: [],
      composition: "100% poliéster reciclado, malha respirável com acabamento a laser na gola.",
      description: "A camisa principal da seleção, de caimento reto e toque leve. Peça lisa nas costas, sem escudo bordado em destaque." },
    { id: "selecao-brasil-ii", name: "Camisa Seleção Brasil II", team: "Seleção Brasil", group: "Seleções", type: "Camisa",
      price: 349.90, badge: "Edição limitada", featured: true, sizes: ["P","M","G","GG","XG"], unavailable: ["P"],
      colors: [{ name: "Azul", hex: "#16408f" }], images: [],
      composition: "100% poliéster, malha dry com gola em ribana.",
      description: "A segunda camisa em azul profundo, lote numerado e quantidade reduzida." },
    { id: "argentina-i", name: "Camisa Seleção Argentina I", team: "Seleção Argentina", group: "Seleções", type: "Camisa",
      price: 339.90, badge: "", featured: true, sizes: ["P","M","G","GG","XG"], unavailable: [],
      colors: [{ name: "Branco", hex: "#f5f5f5" }, { name: "Azul", hex: "#75aadb" }], images: [],
      composition: "100% poliéster, malha dry com ventilação nas laterais.",
      description: "Listras clássicas com tecnologia de secagem rápida, perfeita para jogo e para o dia a dia." },
    { id: "franca-i", name: "Camisa Seleção França I", team: "Seleção França", group: "Seleções", type: "Camisa",
      price: 339.90, badge: "Novo", featured: false, sizes: ["P","M","G","GG","XG"], unavailable: ["GG"],
      colors: [{ name: "Azul", hex: "#16408f" }], images: [],
      composition: "100% poliéster, malha leve.",
      description: "Azul marinho de corte atlético, com gola careca em ribana e acabamento limpo." },
    { id: "flamengo-i", name: "Camisa Flamengo I", team: "Flamengo", group: "Clubes do Brasil", type: "Camisa",
      price: 319.90, badge: "", featured: true, sizes: ["P","M","G","GG","XG"], unavailable: [],
      colors: [{ name: "Vermelho", hex: "#c8102e" }, { name: "Preto", hex: "#000000" }], images: [],
      composition: "100% poliéster, listras em sublimação.",
      description: "Listras rubro-negras em malha respirável, pensada para arquibancada e rua." },
    { id: "corinthians-i", name: "Camisa Corinthians I", team: "Corinthians", group: "Clubes do Brasil", type: "Camisa",
      price: 319.90, badge: "", featured: false, sizes: ["P","M","G","GG","XG"], unavailable: ["P","XG"],
      colors: [{ name: "Branco", hex: "#f5f5f5" }], images: [],
      composition: "100% poliéster, malha dry.",
      description: "Branca, limpa e de caimento solto, com gola em V e detalhes preto e branco." },
    { id: "palmeiras-i", name: "Camisa Palmeiras I", team: "Palmeiras", group: "Clubes do Brasil", type: "Camisa",
      price: 319.90, badge: "Novo", featured: false, sizes: ["P","M","G","GG","XG"], unavailable: [],
      colors: [{ name: "Verde", hex: "#006437" }], images: [],
      composition: "100% poliéster, malha texturizada.",
      description: "Verde intenso com textura sutil no tecido e gola polo." },
    { id: "real-madrid-i", name: "Camisa Real Madrid I", team: "Real Madrid", group: "Clubes da Europa", type: "Camisa",
      price: 369.90, badge: "Edição limitada", featured: false, sizes: ["P","M","G","GG","XG"], unavailable: [],
      colors: [{ name: "Branco", hex: "#f5f5f5" }], images: [],
      composition: "100% poliéster reciclado.",
      description: "Branca clássica com acabamento premium e costas totalmente lisas." },
    { id: "barcelona-i", name: "Camisa Barcelona I", team: "Barcelona", group: "Clubes da Europa", type: "Camisa",
      price: 369.90, badge: "", featured: false, sizes: ["P","M","G","GG","XG"], unavailable: ["G"],
      colors: [{ name: "Azul", hex: "#16408f" }, { name: "Vermelho", hex: "#a50044" }], images: [],
      composition: "100% poliéster, listras em jacquard.",
      description: "Listras largas em jacquard, tecido leve e elástico." },
    { id: "regata-brasil-treino", name: "Regata Treino Seleção Brasil", team: "Seleção Brasil", group: "Seleções", type: "Regata",
      price: 199.90, badge: "", featured: false, sizes: ["P","M","G","GG","XG"], unavailable: [],
      colors: [{ name: "Amarelo", hex: "#f2c500" }, { name: "Preto", hex: "#000000" }], images: [],
      composition: "100% poliéster, cavas rebaixadas.",
      description: "Regata de treino com cavas amplas e tecido que seca rápido." },
    { id: "jaqueta-brasil", name: "Jaqueta Corta-vento Seleção Brasil", team: "Seleção Brasil", group: "Seleções", type: "Jaqueta",
      price: 449.90, badge: "Esgotado", featured: false, sizes: ["P","M","G","GG","XG"], unavailable: ["P","M","G","GG","XG"],
      colors: [{ name: "Preto", hex: "#000000" }], images: [],
      composition: "100% poliamida, forro de malha, ziper frontal.",
      description: "Jaqueta corta-vento leve e dobrável, com capuz embutido na gola." },
    { id: "shorts-brasil-treino", name: "Shorts Treino Seleção Brasil", team: "Seleção Brasil", group: "Seleções", type: "Shorts",
      price: 179.90, badge: "Novo", featured: false, sizes: ["P","M","G","GG","XG"], unavailable: [],
      colors: [{ name: "Preto", hex: "#000000" }, { name: "Branco", hex: "#f5f5f5" }], images: [],
      composition: "100% poliéster, cós com elástico e cordão.",
      description: "Shorts de treino leve com bolsos laterais e cós ajustável." }
  ],

  /* ---------- MENU (grupos) ----------
     Os times são lidos automaticamente dos produtos (campo `group`). */
  menuTypes: ["Camisa", "Regata", "Jaqueta", "Shorts"],

  /* ---------- TEXTOS ---------- */
  copy: {
    marquee: "Private • Vault Drop",
    vaultTitle: "Saiu do cofre",
    vaultText: "Peças em destaque do drop atual. Deslize para ver cada uma.",
    viewerTitle: "Gire a peça",
    viewerText: "Arraste para girar 360° e veja o caimento de todos os lados.",
    collectionTitle: "A coleção",
    collectionText: "Filtre por time, peça, tamanho e cor.",
    aboutTitle: "Sobre a JSD™",
    aboutParagraphs: [
      "A JSD™ nasceu de uma ideia simples: lançamento bom não se espalha, se guarda. Tudo que chega à loja sai de um cofre, em lotes pequenos e numerados.",
      "Trabalhamos com camisas de times e peças esportivas escolhidas uma a uma, com atenção ao caimento, ao tecido e ao acabamento. Cada drop tem poucas unidades e, quando um tamanho acaba, ele pode não voltar.",
      "Seu pedido é fechado direto com a equipe pelo WhatsApp: você monta a sacola no site e a mensagem já vai pronta, com peças, tamanhos e valores."
    ],
    aboutPillars: [
      { t: "Lotes pequenos", d: "Poucas unidades por peça e por tamanho." },
      { t: "Acabamento limpo", d: "Costas lisas, gola reforçada, costuras alinhadas." },
      { t: "Atendimento direto", d: "Da escolha do tamanho ao envio, pelo WhatsApp." }
    ],
    shippingNote: "Prazo e valor do frete são combinados no WhatsApp, de acordo com o seu CEP. Frete grátis acima do valor mínimo informado na sacola."
  }
};
