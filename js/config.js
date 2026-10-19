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
       Cada lance usa `youtube: "ID"` (+ start/end em segundos) OU `src` (arquivo MP4).
       src = vídeo completo · srcMobile = versão leve (usada no celular) · tone = índice em `tones` */
    videos: [
      { src: "assets/video/lance-1.mp4", srcMobile: "assets/video/lance-1-leve.mp4", poster: "assets/video/lance-1.jpg", label: "Lance 01", tone: 0 },
      { src: "assets/video/lance-2.mp4", srcMobile: "assets/video/lance-2-leve.mp4", poster: "assets/video/lance-2.jpg", label: "Lance 02", tone: 1 },
      { src: "assets/video/lance-3.mp4", srcMobile: "assets/video/lance-3-leve.mp4", poster: "assets/video/lance-3.jpg", label: "Lance 03", tone: 2 }
      // Para usar YouTube no lugar de arquivo: { youtube: "ID", start: 0, end: 10, label: "Lance 01", tone: 0 }
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

  /* ---------- VISOR 3D (frente e verso) ----------
     Em cada produto, use  view3d: { front: "foto-da-frente.jpg", back: "foto-das-costas.jpg" }
     Sem `front`, usa a primeira foto do produto. Sem `back`, o verso é o selo do cofre JSD™.
     Dica: fotos da peça esticada, em fundo liso, na proporção 5:6, funcionam melhor. */

  /* ---------- VISUALIZADOR 360° (fotos em sequência, opcional) ----------
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
     [{ src, alt }] (vazio = imagem provisória gerada pelo site) ·  unavailable: tamanhos sem estoque */
  products: [
    {
      "id": "argentina-messi",
    "view3d": {"frontLabel": "Costas"},
      "name": "Camisa Argentina — Despedida do Messi",
      "team": "Seleção Argentina",
      "group": "Seleções",
      "type": "Camisa",
      "price": 300,
      "badge": "",
      "featured": true,
      "sizes": [
        "P",
        "M",
        "G",
        "GG",
        "XG"
      ],
      "unavailable": [],
      "colors": [
        {
          "name": "Azul-celeste",
          "hex": "#75aadb"
        },
        {
          "name": "Branco",
          "hex": "#f5f5f5"
        }
      ],
      "images": [
        {
          "src": "assets/produtos/argentina-messi.jpg",
          "alt": "Costas da camisa da Argentina com o nome MESSI e o número 10 em dourado sobre as listras celeste e branca"
        }
      ],
      "composition": "Tecido esportivo leve. Consulte a composição exata pelo WhatsApp.",
      "description": "A última camiseta. Listras celeste e branca, com MESSI e o número 10 em dourado nas costas."
    },
    {
      "id": "noruega-26-27",
      "name": "Camisa Nike Seleção Noruega 26/27",
      "team": "Seleção Noruega",
      "group": "Seleções",
      "type": "Camisa",
      "price": 250,
      "badge": "Novo",
      "featured": true,
      "sizes": [
        "P",
        "M",
        "G",
        "GG",
        "XG"
      ],
      "unavailable": [],
      "colors": [
        {
          "name": "Vermelho",
          "hex": "#c8102e"
        },
        {
          "name": "Azul",
          "hex": "#14214d"
        }
      ],
      "images": [
        {
          "src": "assets/produtos/noruega.jpg",
          "alt": "Quatro camisas Nike da Seleção da Noruega 26/27 dobradas, vermelhas com cruz azul e branca e escudo da federação"
        }
      ],
      "composition": "Tecido esportivo leve. Consulte a composição exata pelo WhatsApp.",
      "description": "A camisa da Noruega 26/27 da Nike, com a cruz nórdica em azul-marinho texturizado e escudo da federação. Pronta entrega."
    },
    {
      "id": "holanda-copa-2026",
      "name": "Camisa Nike Seleção Holandesa",
      "team": "Seleção Holandesa",
      "group": "Seleções",
      "type": "Camisa",
      "price": 250,
      "badge": "Novo",
      "featured": false,
      "sizes": [
        "P",
        "M",
        "G",
        "GG",
        "XG"
      ],
      "unavailable": [],
      "colors": [
        {
          "name": "Laranja",
          "hex": "#f26a1b"
        }
      ],
      "images": [
        {
          "src": "assets/produtos/holanda.jpg",
          "alt": "Camisa laranja Nike da Seleção Holandesa com patch da Copa do Mundo 2026 e número 10 nas costas"
        }
      ],
      "composition": "Tecido esportivo leve. Consulte a composição exata pelo WhatsApp.",
      "description": "O icônico uniforme laranja, com patch da Copa do Mundo 2026, escudo do leão e número 10."
    },
    {
      "id": "portugal-cr7",
      "name": "Camisa Puma Seleção Portugal — CR7",
      "team": "Seleção Portugal",
      "group": "Seleções",
      "type": "Camisa",
      "price": 180,
      "badge": "",
      "featured": false,
      "sizes": [
        "P",
        "M",
        "G",
        "GG",
        "XG"
      ],
      "unavailable": [],
      "colors": [
        {
          "name": "Vinho",
          "hex": "#9b1c26"
        }
      ],
      "images": [
        {
          "src": "assets/produtos/portugal-cr7.jpg",
          "alt": "Camisa Puma vermelha da Seleção Portuguesa com número 7 branco e escudo da federação"
        }
      ],
      "composition": "Tecido esportivo leve. Consulte a composição exata pelo WhatsApp.",
      "description": "The Last Dance. Camisa vermelha da Puma, com o número 7 em branco e gola em V com detalhe verde."
    },
    {
      "id": "arsenal-home",
      "name": "Camisa Adidas Arsenal",
      "team": "Arsenal",
      "group": "Clubes da Europa",
      "type": "Camisa",
      "price": 180,
      "badge": "",
      "featured": false,
      "sizes": [
        "P",
        "M",
        "G",
        "GG",
        "XG"
      ],
      "unavailable": [],
      "colors": [
        {
          "name": "Vermelho",
          "hex": "#d71920"
        },
        {
          "name": "Branco",
          "hex": "#f5f5f5"
        }
      ],
      "images": [
        {
          "src": "assets/produtos/arsenal.jpg",
          "alt": "Camisa vermelha e branca do Arsenal da Adidas com patrocínio Emirates"
        }
      ],
      "composition": "Tecido esportivo leve. Consulte a composição exata pelo WhatsApp.",
      "description": "Vermelha com mangas brancas e três listras vinho, da Adidas, com o patrocínio Emirates Fly Better."
    },
    {
      "id": "chelsea-munique-2012",
      "name": "Camisa Retrô Chelsea — Final Munique 2012",
      "team": "Chelsea",
      "group": "Clubes da Europa",
      "type": "Camisa",
      "price": 180,
      "badge": "",
      "featured": false,
      "sizes": [
        "P",
        "M",
        "G",
        "GG",
        "XG"
      ],
      "unavailable": [],
      "colors": [
        {
          "name": "Azul",
          "hex": "#1f4bd8"
        }
      ],
      "images": [
        {
          "src": "assets/produtos/chelsea-2012.jpg",
          "alt": "Camisa retrô azul do Chelsea da Adidas, com a inscrição Final Munique 2012 e patrocínio Samsung"
        }
      ],
      "composition": "Tecido esportivo leve. Consulte a composição exata pelo WhatsApp.",
      "description": "Azul intenso e clássico, com detalhes brancos que marcaram uma geração. Referência à final de Munique, em 2012."
    },
    {
      "id": "portugal-away",
      "name": "Camisa Puma Seleção Portugal — Preta",
      "team": "Seleção Portugal",
      "group": "Seleções",
      "type": "Camisa",
      "price": 250,
      "badge": "Novo",
      "featured": false,
      "sizes": [
        "P",
        "M",
        "G",
        "GG",
        "XG"
      ],
      "unavailable": [],
      "colors": [
        {
          "name": "Preto",
          "hex": "#000000"
        }
      ],
      "images": [
        {
          "src": "assets/produtos/portugal-away.jpg",
          "alt": "Camisa preta da Puma da Seleção Portuguesa com número 8 em bege"
        }
      ],
      "composition": "Tecido esportivo leve. Consulte a composição exata pelo WhatsApp.",
      "description": "A camisa preta da Seleção Portuguesa, da Puma, com números em bege e escudo da federação."
    },
    {
      "id": "espanha-away-26-27",
      "name": "Camisa Adidas Seleção Espanhola Away 26/27",
      "team": "Seleção Espanhola",
      "group": "Seleções",
      "type": "Camisa",
      "price": 250,
      "badge": "Novo",
      "featured": true,
      "sizes": [
        "P",
        "M",
        "G",
        "GG",
        "XG"
      ],
      "unavailable": [],
      "colors": [
        {
          "name": "Branco",
          "hex": "#f5f5f5"
        },
        {
          "name": "Vinho",
          "hex": "#6b1f2a"
        }
      ],
      "images": [
        {
          "src": "assets/produtos/espanha-away.jpg",
          "alt": "Camisa branca Away da Seleção Espanhola da Adidas, com gola vinho e dourada e escudo da federação"
        }
      ],
      "composition": "Tecido esportivo leve. Consulte a composição exata pelo WhatsApp.",
      "description": "Away 26/27 em branco com trevo Originals, gola em vinho e dourado, listras vinho e tecido texturizado."
    },
    {
      "id": "argentina-away-26-27",
      "name": "Camisa Adidas Seleção Argentina Away 26/27",
      "team": "Seleção Argentina",
      "group": "Seleções",
      "type": "Camisa",
      "price": 250,
      "badge": "Novo",
      "featured": true,
      "sizes": [
        "P",
        "M",
        "G",
        "GG",
        "XG"
      ],
      "unavailable": [],
      "colors": [
        {
          "name": "Preto",
          "hex": "#000000"
        },
        {
          "name": "Azul",
          "hex": "#2a3fd0"
        }
      ],
      "images": [
        {
          "src": "assets/produtos/argentina-away.jpg",
          "alt": "Camisa preta Away da Seleção Argentina da Adidas, com grafismos em azul e patch de campeão mundial 2022"
        }
      ],
      "composition": "Tecido esportivo leve. Consulte a composição exata pelo WhatsApp.",
      "description": "Away 26/27 preta com grafismos em azul e branco, patch de campeão mundial 2022 e três estrelas no escudo da AFA."
    },
    {
      "id": "franca-away-26-27",
      "name": "Camisa Nike Seleção Francesa Away 26/27",
      "team": "Seleção Francesa",
      "group": "Seleções",
      "type": "Camisa",
      "price": 250,
      "badge": "Novo",
      "featured": true,
      "sizes": [
        "P",
        "M",
        "G",
        "GG",
        "XG"
      ],
      "unavailable": [],
      "colors": [
        {
          "name": "Verde",
          "hex": "#9fd6bf"
        }
      ],
      "images": [
        {
          "src": "assets/produtos/franca-away-1.jpg",
          "alt": "Camisa verde-menta Away da Seleção Francesa da Nike com galo bordado e duas estrelas"
        },
        {
          "src": "assets/produtos/franca-away-2.jpg",
          "alt": "Detalhe do símbolo da Nike bordado na camisa verde-menta da França"
        }
      ],
      "composition": "Tecido esportivo leve. Consulte a composição exata pelo WhatsApp.",
      "description": "Away 26/27 em verde-menta com tecido texturizado, galo da FFF bordado e símbolo da Nike em destaque."
    },
    {
      "id": "lakers-city-75",
      "name": "Regata Lakers City Edition 75th Diamond",
      "team": "Los Angeles Lakers",
      "group": "Basquete",
      "type": "Regata",
      "price": 180,
      "badge": "",
      "featured": false,
      "sizes": [
        "P",
        "M",
        "G",
        "GG",
        "XG"
      ],
      "unavailable": [],
      "colors": [
        {
          "name": "Roxo",
          "hex": "#552583"
        }
      ],
      "images": [
        {
          "src": "assets/produtos/lakers-regata.jpg",
          "alt": "Regata roxa do Los Angeles Lakers City Edition 75th Diamond, com número 6"
        }
      ],
      "composition": "Tecido esportivo leve. Consulte a composição exata pelo WhatsApp.",
      "description": "Regata de basquete inspirada na história da franquia. City Edition 75th Diamond, que celebra os 75 anos da NBA."
    },
    {
      "id": "brasil-jordan-ii-26-27",
      "name": "Camisa Jordan Seleção Brasileira II 26/27",
      "team": "Seleção Brasil",
      "group": "Seleções",
      "type": "Camisa",
      "price": 250,
      "badge": "Novo",
      "featured": true,
      "sizes": [
        "P",
        "M",
        "G",
        "GG",
        "XG"
      ],
      "unavailable": [],
      "colors": [
        {
          "name": "Azul",
          "hex": "#1a2fa0"
        }
      ],
      "images": [
        {
          "src": "assets/produtos/brasil-ii.jpg",
          "alt": "Camisa II azul da Jordan da Seleção Brasileira 26/27, com escudo da CBF e símbolo Jumpman"
        }
      ],
      "composition": "Tecido esportivo leve. Consulte a composição exata pelo WhatsApp.",
      "description": "A segunda camisa da Seleção Brasileira 26/27, da Jordan, em azul com estampa digital e detalhes em verde-limão."
    },
    {
      "id": "corinthians-iii-all-black",
      "name": "Camisa Nike Corinthians III All Black 24/25",
      "team": "Corinthians",
      "group": "Clubes do Brasil",
      "type": "Camisa",
      "price": 180,
      "badge": "",
      "featured": false,
      "sizes": [
        "P",
        "M",
        "G",
        "GG",
        "XG"
      ],
      "unavailable": [],
      "colors": [
        {
          "name": "Preto",
          "hex": "#000000"
        }
      ],
      "images": [
        {
          "src": "assets/produtos/corinthians-iii.jpg",
          "alt": "Detalhe do escudo do Corinthians em preto sobre preto na camisa III All Black 24/25"
        }
      ],
      "composition": "Tecido esportivo leve. Consulte a composição exata pelo WhatsApp.",
      "description": "A terceira camisa 24/25 toda preta, com escudo em relevo tom sobre tom."
    }
  ],

  /* ---------- MENU (grupos) ----------
     Os times são lidos automaticamente dos produtos (campo `group`). */
  menuTypes: ["Camisa", "Regata"],

  /* ---------- TEXTOS ---------- */
  copy: {
    marquee: "Private • Vault Drop",
    vaultTitle: "Saiu do cofre",
    vaultText: "Peças em destaque do drop atual. Deslize para ver cada uma.",
    viewerTitle: "Gire a peça",
    viewerText: "Arraste para virar a camisa e ver a frente e o verso.",
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
