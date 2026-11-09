/* =========================================================
   CONFIGURAÇÃO GERAL
   Troque aqui preços, links de checkout (Cakto) e textos fixos.
   ========================================================= */
window.RELIGAR_CONFIG = {
  marca: "Religar",
  slogan: "Autocuidado que cabe na vida real",
  produto: "Desafio Corpo Descongelado 30 Dias",

  // Links de checkout da Cakto (preencher quando os produtos forem criados)
  checkout: {
    principal: "#checkout-cakto-principal",
    upsell: "#checkout-cakto-upsell-religar-60",
    downsell: "#checkout-cakto-downsell-religar-60-essencial"
  },

  precos: {
    principal: 29.9,
    ancora: 97,           // "parece um produto de R$ 97"
    bump1: 9.9,
    bump2: 12.9,
    bump3: 14.9,
    upsell: 67,
    downsell: 37
  },

  garantiaDias: 7,        // confirmar prazo com a Cakto/dono do projeto

  // Painel do desafio
  intervaloPadraoMin: 50, // Regra 50/2
  duracaoPausaSeg: 120,
  pausasMinimasDia: 4,
  pausasMinimasDiaCaotico: 2,
  totalDias: 30,

  // Voz de cada trilha (guia por voz). Cada trilha fica com UMA voz só,
  // para não misturar dentro do mesmo protocolo. Os áudios ficam em
  // assets/audio/<voz>/<id-do-exercicio>.mp3
  // masculina = Adrian Miles · feminina = Marianne (ElevenLabs)
  vozes: {
    lombar: "masculina",   // Coluna e Lombar
    cervical: "masculina", // Cervical, Ombros e Trapézio
    punho: "feminina",     // Braços, Antebraços e Punhos
    joelhos: "feminina"    // Quadril, Joelhos e Pés
  },
  diasRevisao: [1, 3, 7, 14, 21, 30],
  diasForcaSemana4: [23, 26, 29],

  // Modo de teste: permite simular compras de bônus e avançar dias no painel.
  // DESLIGAR (false) antes de publicar.
  modoTeste: true
};

window.formatarPreco = (v) =>
  "R$ " + v.toFixed(2).replace(".", ",");
