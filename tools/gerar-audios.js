/* Gera os áudios do guia por voz pela API do ElevenLabs.
   Uso:  ELEVENLABS_API_KEY=xxxx node tools/gerar-audios.js
   - Lê docs/roteiro-audios.json (gerado por tools/roteiro-audios.js)
   - Grava assets/audio/<voz>/<id>.mp3
   - Pula os arquivos que já existem: pode rodar de novo se parar no meio.
   Vozes aprovadas: masculina = Adrian Miles · feminina = Marianne (Meditação). */
const fs = require("fs");
const path = require("path");

const VOZES = { masculina: "DMVZPgiYpSwCZvrG69rt", feminina: "mJqP14JQFEK0PojR5lfV" };
const MODELO = process.env.ELEVENLABS_MODEL || "eleven_v3";
const CHAVE = process.env.ELEVENLABS_API_KEY || "chave-injetada-pelo-proxy";
const RAIZ = path.join(__dirname, "..");
const roteiro = JSON.parse(fs.readFileSync(path.join(RAIZ, "docs", "roteiro-audios.json"), "utf8"));
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));

async function gerar(item, tentativa = 1) {
  const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${VOZES[item.voz]}?output_format=mp3_44100_128`, {
    method: "POST",
    headers: { "xi-api-key": CHAVE, "Content-Type": "application/json", Accept: "audio/mpeg" },
    body: JSON.stringify({ text: item.texto, model_id: MODELO, language_code: "pt" })
  });
  if (res.status === 429 && tentativa <= 5) { await esperar(5000 * tentativa); return gerar(item, tentativa + 1); }
  if (!res.ok) throw new Error(`${res.status} ${(await res.text()).slice(0, 200)}`);
  return Buffer.from(await res.arrayBuffer());
}

(async () => {
  let feitos = 0, pulados = 0;
  for (const item of roteiro) {
    const destino = path.join(RAIZ, "assets", "audio", item.voz, `${item.id}.mp3`);
    if (fs.existsSync(destino)) { pulados++; continue; }
    fs.mkdirSync(path.dirname(destino), { recursive: true });
    try {
      fs.writeFileSync(destino, await gerar(item));
      feitos++;
      console.log(`✓ ${item.voz}/${item.id}.mp3`);
    } catch (e) {
      console.error(`✗ ${item.voz}/${item.id}: ${e.message}`);
      if (/quota|credits|401/.test(e.message)) { console.error("Parando: sem créditos ou chave inválida."); break; }
    }
  }
  console.log(`Feitos agora: ${feitos} · já existiam: ${pulados} · total no roteiro: ${roteiro.length}`);
})();
