// Gera prévias em PNG: node scripts/previa.js <pasta-de-saida>
const { chromium } = require("playwright"); const path = require("path"); const out = process.argv[2];
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 430, height: 900 }, deviceScaleFactor: 2 });
  const u = f => "file://" + path.join(__dirname, "..", f);
  await p.goto(u("index.html")); await p.screenshot({ path: out + "/1-pagina-de-vendas.png", fullPage: true });
  await p.goto(u("membros.html")); await p.screenshot({ path: out + "/2-area-de-membros.png", fullPage: true });
  await p.goto(u("guia.html?g=sos-pescoco-ombros")); await p.screenshot({ path: out + "/3-guia-pescoco-ombros.png", fullPage: true });
  await b.close();
})();
