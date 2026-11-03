/* Brass Brew · dados do cardápio (fonte única de verdade)
   Regras: nunca inventar ingrediente nem preço. O que não foi confirmado fica marcado em `status`.
   status.ingredientes: 'confirmado' | 'padrao' (receita clássica, falta confirmar) | 'base' (base clássica,
   versão da casa desconhecida) | 'pendente'
   preco: null = "Consulte" (nenhum preço confirmado até agora). */
window.BB = window.BB || {};

BB.categorias = [
  { id: 'novos', nome: 'Novos da Brass', reels: true },
  { id: 'exclusivos', nome: 'Exclusivos', reels: true },
  { id: 'engarrafados', nome: 'Engarrafados', reels: true },
  { id: 'classicos', nome: 'Clássicos', reels: true },
  { id: 'maquiados', nome: 'Maquiados', reels: true },
  { id: 'spritz', nome: 'Spritzzzz', reels: true },
  { id: 'doses', nome: 'Doses', reels: false },
  { id: 'garrafas', nome: 'Garrafas', reels: false },
  { id: 'combos', nome: 'Combos', reels: false },
  { id: 'sem-alcool', nome: 'Sem álcool', reels: false },
];

(function () {
  const drink = (o) => Object.assign({
    ingredientes: [], perfil: null, preco: null, volume: null, copo: 'baixo', cor: '#9a6a26',
    foto: null, fotoSite: null, selos: [], disponivel: true,
    status: { ingredientes: 'pendente', preco: 'pendente' },
  }, o);
  const st = (ingredientes) => ({ ingredientes, preco: 'pendente' });
  const simples = (categoria, nomes, extra = {}) => nomes.map((nome) => Object.assign({
    id: categoria + '-' + nome.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
    nome, categoria, preco: null, disponivel: true, status: { preco: 'pendente' },
  }, extra));

  BB.itens = [
    /* 3.0 Novos da Brass — confirmados pelo cardápio dguests (print de 03/11/2026): ingredientes, texto e preço.
       Fotos recortadas do print (fundo removido). Textos de Nó de Caju e Veraneio aparecem cortados no print. */
    drink({ id: 'brasa', nome: 'Brasa', categoria: 'novos', copo: 'long', cor: '#b86a12', selos: ['Novo'],
      ingredientes: ['rum Havana', 'manga', 'coentro'], perfil: 'Tropical, suculento e inesperado',
      preco: 45, foto: 'public/img/brasa.webp', status: { ingredientes: 'confirmado', preco: 'confirmado' } }),
    drink({ id: 'no-de-caju', nome: 'Nó de Caju', categoria: 'novos', copo: 'taca', cor: '#8e7a22', selos: ['Novo'],
      ingredientes: ['gin Beefeater', 'extrato de caju', 'vermute seco', 'angostura'], perfil: null, // texto cortado no print
      preco: 45, foto: 'public/img/no-de-caju.webp', status: { ingredientes: 'confirmado', preco: 'confirmado' } }),
    drink({ id: 'tangerina-spritz', nome: 'Tangerina Spritz', categoria: 'novos', copo: 'long', cor: '#c4621a', selos: ['Novo'],
      ingredientes: ['gin Beefeater', 'cordial de tangerina', 'angostura'], perfil: 'Cítrico, vivo e amargo delicado',
      preco: 45, foto: 'public/img/tangerina-spritz.webp', status: { ingredientes: 'confirmado', preco: 'confirmado' } }),
    drink({ id: 'veraneio', nome: 'Veraneio', categoria: 'novos', copo: 'taca', cor: '#a8283a', selos: ['Novo'],
      ingredientes: ['vinho rosé', 'acerola', 'bourbon whisky'], perfil: null, // texto cortado no print
      preco: 45, foto: 'public/img/veraneio.webp', status: { ingredientes: 'confirmado', preco: 'confirmado' } }),

    /* 3.1 Exclusivos — fotos do site oficial ainda não baixadas; ligação foto → drink deduzida pela ordem */
    drink({ id: 'raiz-da-serra', nome: 'Raiz da Serra', categoria: 'exclusivos', cor: '#8c5a24', selos: ['Exclusivo'],
      fotoSite: 'https://framerusercontent.com/images/l3kAB8kMArfCUyENwutVvet7W5k.jpg' }),
    drink({ id: 'studebaker', nome: 'Studebaker', categoria: 'exclusivos', cor: '#7a4a1c', selos: ['Exclusivo'],
      fotoSite: 'https://framerusercontent.com/images/5OWQYkjz0RlomycOeCyUkYD5BI0.jpg' }),
    drink({ id: 'areias', nome: 'Areias', categoria: 'exclusivos', cor: '#b78a4a', selos: ['Exclusivo'],
      fotoSite: 'https://framerusercontent.com/images/LSDSv8TSapSHTVbcUcP3kFRhk.jpg' }),
    drink({ id: 'aguas-brancas', nome: 'Águas Brancas', categoria: 'exclusivos', cor: '#6f7f80', selos: ['Exclusivo'],
      fotoSite: 'https://framerusercontent.com/images/c5MHuZPqF87Iavyrnpef6BNy6Gk.jpg' }),

    /* 3.2 Engarrafados — ingredientes confirmados; preço da matéria NÃO confirmado */
    drink({ id: 'serra-do-mar', nome: 'Serra do Mar', categoria: 'engarrafados', copo: 'garrafa', cor: '#d98a26',
      ingredientes: ['rum envelhecido', 'xarope de coco tostado', 'suco de abacaxi fresco'],
      perfil: 'Levemente doce, tropical', volume: '500 ml · serve 5', status: st('confirmado') }),
    drink({ id: 'santos-jundiai', nome: 'Santos-Jundiaí', categoria: 'engarrafados', copo: 'garrafa', cor: '#8a1d3c',
      ingredientes: ['vinho tinto', 'redução de frutas vermelhas', 'laranja', 'abacaxi', 'toque de amaro'],
      perfil: 'Refrescante, frutado', volume: '500 ml · serve 5', status: st('confirmado') }),
    drink({ id: 'mooca', nome: 'Mooca', categoria: 'engarrafados', copo: 'garrafa', cor: '#5a2a17',
      ingredientes: ['cachaça envelhecida', 'vermute tinto', 'Cynar', 'nibs de cacau'],
      perfil: 'Encorpado, notas de chocolate', volume: '500 ml · serve 5', status: st('confirmado') }),
    drink({ id: 'conde-matarazzo', nome: 'Conde Matarazzo', categoria: 'engarrafados', copo: 'garrafa', cor: '#e2475b',
      ingredientes: ['gin', 'Campari', 'vermute dry', 'vermute bianco', 'melancia'],
      perfil: 'Seco, leve amargor, refrescante', volume: '500 ml · serve 5', status: st('confirmado') }),

    /* 3.3 Clássicos — receita padrão, falta confirmar como o Brass faz */
    drink({ id: 'negroni', nome: 'Negroni', categoria: 'classicos', copo: 'baixo', cor: '#b3122e',
      ingredientes: ['gin', 'Campari', 'vermute tinto', 'casca de laranja'], status: st('padrao') }),
    drink({ id: 'rabo-de-galo-sour', nome: 'Rabo de Galo Sour', categoria: 'classicos', copo: 'baixo', cor: '#8b3a22',
      ingredientes: ['cachaça', 'vermute tinto', 'Cynar', 'limão', 'açúcar', 'clara'], status: st('padrao') }),
    drink({ id: 'caipirinha', nome: 'Caipirinha', categoria: 'classicos', copo: 'baixo', cor: '#9fb83a',
      ingredientes: ['cachaça', 'limão', 'açúcar', 'gelo'], status: st('padrao') }),
    drink({ id: 'caipiroska', nome: 'Caipiroska', categoria: 'classicos', copo: 'baixo', cor: '#7fa63c',
      ingredientes: ['vodka', 'limão', 'açúcar', 'gelo'], status: st('padrao') }),
    drink({ id: 'fitzgerald', nome: 'Fitzgerald', categoria: 'classicos', copo: 'baixo', cor: '#c9a63a',
      ingredientes: ['gin', 'limão-siciliano', 'xarope de açúcar', 'angostura'], status: st('padrao') }),
    drink({ id: 'gin-tonica', nome: 'Gin Tônica', categoria: 'classicos', copo: 'long', cor: '#3f8f86',
      ingredientes: ['gin', 'água tônica', 'limão ou especiarias'], status: st('padrao') }),

    /* 3.4 Clássicos maquiados — versão da casa desconhecida */
    drink({ id: 'old-fashioned', nome: 'Um Old Fashioned', categoria: 'maquiados', copo: 'baixo', cor: '#a8581c',
      ingredientes: ['bourbon', 'açúcar', 'angostura', 'casca de laranja'], status: st('base') }),
    drink({ id: 'seco-de-ervas', nome: 'Seco de Ervas', categoria: 'maquiados', copo: 'baixo', cor: '#5f7a3a' }),
    drink({ id: 'nosso-mojito', nome: 'Nosso Mojito', categoria: 'maquiados', copo: 'long', cor: '#3f9a5a',
      ingredientes: ['rum', 'hortelã', 'limão', 'açúcar', 'água com gás'], status: st('base') }),

    /* 3.5 Spritz */
    drink({ id: 'la-dona-mala-onda', nome: 'La Dona Mala Onda', categoria: 'spritz', copo: 'taca', cor: '#c2456a' }),
    drink({ id: 'il-vero-verde', nome: 'Il Vero Verde', categoria: 'spritz', copo: 'taca', cor: '#4f9a3a' }),
    drink({ id: 'tomatto', nome: 'Tomatto', categoria: 'spritz', copo: 'taca', cor: '#d4422c' }),
    drink({ id: 'spritz-classico', nome: 'Clássico', categoria: 'spritz', copo: 'taca', cor: '#f0641e',
      ingredientes: ['Aperol', 'espumante', 'água com gás', 'laranja'], status: st('padrao') }),

    /* 3.6 a 3.9 — lista simples */
    ...simples('doses', ['Cachaça Saliníssima', 'Cachaça Arbórea', 'Rum Bacardi', 'Cynar', 'Cinzano Rosso', 'Aperol', 'Amaro Ramazzotti']),
    ...simples('garrafas', ['Tequila José Cuervo Prata', 'Tequila José Cuervo Ouro', 'Vodka Ketel One', 'Whisky Jim Beam White',
      'Whisky Johnnie Walker Black Label', 'Whisky Glenlivet', 'Gin Beefeater', 'Gin Tanqueray', 'Campari']),
    ...simples('combos', ['Gin Beefeater', 'Gin Tanqueray', 'Vodka Ketel One', 'Whisky Jim Beam White',
      'Whisky Johnnie Walker Black Label', 'Whisky Glenlivet'], { detalhe: 'Garrafa + 6 energéticos' }),
    ...simples('sem-alcool', ['Red Bull Tradicional ou Tropical', 'Kiro', 'Baer Mate', 'Tônica Tradicional ou Zero', 'Água com ou sem gás']),
  ];
  // volume confirmado do Red Bull
  BB.itens.find((i) => i.nome.startsWith('Red Bull')).detalhe = '250 ml';

  /* Cores das camadas no desenho do copo (só visual).
     tipo 'liquido' = faixa lisa; os outros desenham pedaços (stop motion). */
  BB.camadas = {
    'rum havana': { cor: '#e8dcc0', tipo: 'liquido' },
    'manga': { cor: '#f4a81d', tipo: 'cubo' },
    'coentro': { cor: '#4f9a3a', tipo: 'folha' },
    'gin beefeater': { cor: '#e9efe2', tipo: 'liquido' },
    'extrato de caju': { cor: '#f1c84b', tipo: 'liquido' },
    'vermute seco': { cor: '#e6dcaa', tipo: 'liquido' },
    'cordial de tangerina': { cor: '#f59a23', tipo: 'liquido' },
    'vinho rosé': { cor: '#f19aa0', tipo: 'liquido' },
    'acerola': { cor: '#e0302f', tipo: 'liquido' },
    'bourbon whisky': { cor: '#b5651d', tipo: 'liquido' },
    'gin': { cor: '#e9efe2', tipo: 'liquido' },
    'campari': { cor: '#c8102e', tipo: 'liquido' },
    'vermute tinto': { cor: '#6e1423', tipo: 'liquido' },
    'vermute dry': { cor: '#e6dcaa', tipo: 'liquido' },
    'vermute bianco': { cor: '#f1e4bb', tipo: 'liquido' },
    'melancia': { cor: '#f0506e', tipo: 'fatia' },
    'laranja': { cor: '#f28c28', tipo: 'rodela' },
    'casca de laranja': { cor: '#f28c28', tipo: 'casca' },
    'rum envelhecido': { cor: '#a0521d', tipo: 'liquido' },
    'rum': { cor: '#e8dcc0', tipo: 'liquido' },
    'xarope de coco tostado': { cor: '#d9b98a', tipo: 'liquido' },
    'suco de abacaxi fresco': { cor: '#f6c744', tipo: 'liquido' },
    'abacaxi': { cor: '#f6c744', tipo: 'cubo' },
    'vinho tinto': { cor: '#5e0b1f', tipo: 'liquido' },
    'redução de frutas vermelhas': { cor: '#a3133b', tipo: 'liquido' },
    'toque de amaro': { cor: '#4a2412', tipo: 'liquido' },
    'cachaça envelhecida': { cor: '#c98b3a', tipo: 'liquido' },
    'cachaça': { cor: '#efe8cc', tipo: 'liquido' },
    'cynar': { cor: '#3b2a14', tipo: 'liquido' },
    'nibs de cacau': { cor: '#4b2a1a', tipo: 'nibs' },
    'limão': { cor: '#a9c83a', tipo: 'rodela' },
    'limão ou especiarias': { cor: '#a9c83a', tipo: 'rodela' },
    'açúcar': { cor: '#fbf4e2', tipo: 'nibs' },
    'clara': { cor: '#fffaf0', tipo: 'espuma' },
    'gelo': { cor: '#dff1f8', tipo: 'gelo' },
    'vodka': { cor: '#eef3f4', tipo: 'liquido' },
    'limão-siciliano': { cor: '#f2e36b', tipo: 'liquido' },
    'xarope de açúcar': { cor: '#f5e6bd', tipo: 'liquido' },
    'angostura': { cor: '#7a1e12', tipo: 'liquido' },
    'água tônica': { cor: '#e2f2ee', tipo: 'liquido' },
    'hortelã': { cor: '#3f9a4a', tipo: 'folha' },
    'água com gás': { cor: '#e6f5fa', tipo: 'liquido' },
    'aperol': { cor: '#f2611d', tipo: 'liquido' },
    'espumante': { cor: '#f1df98', tipo: 'liquido' },
    'bourbon': { cor: '#b5651d', tipo: 'liquido' },
  };

  BB.preco = (v) => (v == null ? 'Consulte' : v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }));
  BB.statusTexto = {
    confirmado: null,
    padrao: 'Receita clássica · a confirmar com o bar',
    base: 'Base clássica · versão da casa a confirmar',
    pendente: 'Ingredientes a confirmar com o bar',
  };
})();
