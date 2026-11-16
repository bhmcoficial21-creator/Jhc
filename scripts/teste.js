// Teste rápido: node scripts/teste.js <pasta-de-saida>
const { chromium } = require("playwright"); const path = require("path"); const out = process.argv[2] || ".";
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 430, height: 900 } }); const errs = [];
  p.on("pageerror", e => errs.push(e.message));
  const u = f => "file://" + path.join(__dirname, "..", f);
  await p.goto(u("membros.html")); console.log("guias", (await p.$$(".guia")).length);
  await p.goto(u("guia.html?g=sos-lombar")); console.log("cards", (await p.$$(".card")).length); await p.screenshot({ path: out + "/g.png" });
  await p.goto(u("index.html")); await p.screenshot({ path: out + "/i.png" }); console.log("erros", errs); await b.close();
})();
