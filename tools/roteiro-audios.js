/* Gera docs/roteiro-audios.json: o texto falado de cada áudio do guia por voz.
   Uso: node tools/roteiro-audios.js
   Cada voz grava só os exercícios das trilhas dela (config.js > vozes),
   mais as falas comuns. Arquivo final: assets/audio/<voz>/<id>.mp3 */
global.window = {};
require("../assets/js/config.js");
require("../assets/js/data.js");
const fs = require("fs");
const path = require("path");
const C = window.RELIGAR_CONFIG, D = window.RELIGAR_DADOS;

// Textos ajustados para a fala (sem símbolos, números por extenso quando soa melhor)
const ESPECIAL = {
  "respira": "Vamos começar. Três respirações profundas. Inspire pelo nariz... e solte o ar devagar pela boca, deixando os ombros caírem a cada saída do ar.",
  "respiracao-4-6": "Agora: respiração quatro, seis. Inspire contando até quatro... e solte o ar contando até seis. A saída mais longa avisa o corpo que ele pode relaxar.",
  "regra-20-20-20": "Agora: descanso dos olhos. Tire os olhos da tela e olhe para algo bem longe, a uns seis metros, por vinte segundos. Deixe o rosto e a testa relaxarem.",
  "deslizamento-tendoes": "Agora: deslizamento dos tendões. Mão aberta... gancho... punho fechado... mão reta... e punho reto. Passe por cada posição devagar. Cinco sequências."
};
const COMUNS = {
  "_faltam10": "Faltam dez segundos.",
  "_pronto": "Pronto. Como você está agora?",
  "_pausafeita": "Pausa feita. Seu corpo agradece.",
  "_reposiciona": "Reposiciona. Ajuste a postura e, se puder, levante.",
  "_respira3": "Respira. Três respirações profundas, soltando os ombros na saída do ar."
};

function falado(id) {
  if (ESPECIAL[id]) return ESPECIAL[id];
  const e = D.ex(id);
  const passos = e.passos
    .replace(/→/g, ", depois")
    .replace(/ \+ /g, " e ")
    .replace(/["“”]/g, "")
    .replace(/\b(\d+) segundos\b/g, "$1 segundos");
  return `Agora: ${e.nome.toLowerCase().replace(/ \+ /g, " e ")}. ${passos}`;
}

const porVoz = { masculina: new Set(), feminina: new Set() };
for (const [t, formatos] of Object.entries(D.PROTOCOLOS))
  for (const lista of Object.values(formatos)) lista.forEach(([id]) => porVoz[C.vozes[t]].add(id));
for (const s of D.SNACKS) {
  const vozes = s.zona ? [C.vozes[s.zona]] : ["masculina", "feminina"];
  vozes.forEach((v) => s.passos.forEach(([id]) => porVoz[v].add(id)));
}

const roteiro = [];
for (const voz of ["masculina", "feminina"]) {
  for (const id of porVoz[voz]) roteiro.push({ voz, id, texto: falado(id) });
  for (const [id, texto] of Object.entries(COMUNS)) roteiro.push({ voz, id, texto });
}
const destino = path.join(__dirname, "..", "docs", "roteiro-audios.json");
fs.writeFileSync(destino, JSON.stringify(roteiro, null, 2));
const chars = roteiro.reduce((s, r) => s + r.texto.length, 0);
console.log(`${roteiro.length} áudios · ${chars} caracteres · masculina ${roteiro.filter((r) => r.voz === "masculina").length} · feminina ${roteiro.filter((r) => r.voz === "feminina").length}`);
