/* Gera docs/roteiro-audios.json: o roteiro falado do guia por voz, numerado
   na ordem de gravação (abertura, as 5 dores, falas comuns).
   Uso: node tools/roteiro-audios.js
   A locutora ou o locutor grava um arquivo por texto, com o nome = número
   (01, 02, ...). tools/importar-audios.py converte e coloca cada um em
   assets/audio/<voz>/<id>.mp3. */
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
  "deslizamento-tendoes": "Agora: deslizamento dos tendões. Mão aberta... gancho... punho fechado... mão reta... e punho reto. Passe por cada posição devagar. Cinco sequências.",
  "panturrilha": "Agora: elevação dos calcanhares. Suba na ponta dos pés e desça devagar. Quinze vezes. Sentado também vale."
};
const COMUNS = [
  ["_faltam10", "Faltam dez segundos."],
  ["_pronto", "Pronto. Como você está agora?"],
  ["_pausafeita", "Pausa feita. Seu corpo agradece."],
  ["_reposiciona", "Reposiciona. Ajuste a postura e, se puder, levante."],
  ["_respira3", "Respira. Três respirações profundas, soltando os ombros na saída do ar."]
];
const GRUPOS = {
  cervical: "Cervical, Ombros e Trapézio", punho: "Punhos, Antebraços e Braços",
  lombar: "Coluna e Lombar", joelhos: "Quadril e Joelhos", pes: "Pés e Calcanhar"
};

function falado(id) {
  if (ESPECIAL[id]) return ESPECIAL[id];
  const e = D.ex(id);
  const passos = e.passos.replace(/→/g, ", depois").replace(/ \+ /g, " e ").replace(/["“”]/g, "");
  return `Agora: ${e.nome.toLowerCase().replace(/ \+ /g, " e ")}. ${passos}`;
}

const roteiro = [];
for (const voz of [...new Set(Object.values(C.vozes))]) {
  const trilhas = Object.keys(D.TRILHAS_ZONA).filter((t) => C.vozes[t] === voz);
  const vistos = new Set();
  const add = (id, grupo, texto) => {
    if (vistos.has(id)) return;
    vistos.add(id);
    const n = roteiro.filter((r) => r.voz === voz).length + 1;
    roteiro.push({ voz, numero: String(n).padStart(2, "0"), id, grupo, texto: texto || falado(id) });
  };
  add("respira", "Abertura (toca no começo de todo exercício)");
  const gerais = ["respiracao-4-6", "regra-20-20-20"];
  for (const t of trilhas) {
    const ids = [];
    for (const f of ["sos1", "sos3", "matinal", "noturno"]) D.PROTOCOLOS[t][f].forEach(([id]) => ids.push(id));
    D.SNACKS.filter((s) => s.zona === t).forEach((s) => s.passos.forEach(([id]) => ids.push(id)));
    ids.filter((id) => id !== "respira" && !gerais.includes(id)).forEach((id) => add(id, GRUPOS[t]));
  }
  gerais.forEach((id) => add(id, "Respiração e olhos"));
  COMUNS.forEach(([id, texto]) => add(id, "Falas curtas", texto));
}
fs.writeFileSync(path.join(__dirname, "..", "docs", "roteiro-audios.json"), JSON.stringify(roteiro, null, 2));
const vozes = [...new Set(roteiro.map((r) => r.voz))];
console.log(vozes.map((v) => `${v}: ${roteiro.filter((r) => r.voz === v).length} gravações`).join(" · "));
