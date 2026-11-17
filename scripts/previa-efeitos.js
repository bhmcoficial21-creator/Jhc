// node scripts/previa-efeitos.js <pasta-de-saida>  — prévia dos efeitos na área de membros
const { chromium } = require("playwright"); const path = require("path"); const out = process.argv[2];
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 430, height: 900 }, deviceScaleFactor: 2 });
  const errs = []; p.on("pageerror", e => errs.push(e.message));
  const u = f => "file://" + path.join(__dirname, "..", f);
  await p.goto(u("membros.html")); await p.waitForTimeout(2500); await p.screenshot({ path: out + "/m1-membros.png" });
  await p.goto(u("guia.html?g=sos-lombar")); await p.waitForTimeout(2500); await p.screenshot({ path: out + "/m2-guia.png" });
  await p.goto(u("guia.html?g=sos-lombar&export=1")); console.log("cards no modo exportar:", (await p.$$(".card")).length, "| erros", errs);
  await b.close();
})();
