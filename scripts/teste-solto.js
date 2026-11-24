// node scripts/teste-solto.js <pasta-com-index.html-e-guia.html> <saida> — testa os 2 arquivos sozinhos
const { chromium } = require("playwright"); const path = require("path"); const fs = require("fs");
const dir = process.argv[2], out = process.argv[3];
const U = f => "file://" + path.join(dir, f);
(async () => {
  const w = {}; new Function("window", fs.readFileSync(path.join(__dirname, "../dist/assets/guias.js"), "utf8"))(w);
  const ids = w.MODULOS.flatMap(m => m.guias.map(g => g.id));
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 430, height: 900 } });
  const errs = [], falhas = []; p.on("pageerror", e => errs.push(e.message));
  p.on("requestfailed", r => falhas.push(r.url().slice(-60))); p.on("response", r => { if (r.status() >= 400) falhas.push(r.url().slice(-60)); });
  await p.addInitScript(() => { try { sessionStorage.setItem("entrou", "1"); } catch (e) {} });
  await p.goto(U("index.html")); await p.waitForTimeout(3200);
  console.log("index: capas", (await p.$$(".capa-mod")).length, "| guias", (await p.$$("a.guia")).length,
    "| capas quebradas:", await p.$$eval(".capa-mod img", i => i.filter(x => !x.complete || !x.naturalWidth).length));
  await p.screenshot({ path: out + "/s1-index.png" });
  // clicar num guia a partir do index (navegação entre os dois arquivos)
  await p.click('a.guia[href="guia.html?g=sos-lombar"]'); await p.waitForURL(/guia\.html/); await p.waitForTimeout(3500);
  console.log("abriu guia pelo clique:", p.url().split("/").pop(), "| cartões:", (await p.$$(".flip")).length);
  await p.click(".ae-nav a[data-ir='inicio']").catch(() => {});
  let quebradas = 0, total = 0;
  for (const id of ids) {
    await p.goto(U("guia.html?g=" + id)); await p.waitForTimeout(700);
    const r = await p.evaluate(() => [...document.images].map(i => i.complete && i.naturalWidth > 0));
    total += r.length; quebradas += r.filter(x => !x).length;
  }
  await p.goto(U("guia.html?g=sos-lombar")); await p.waitForTimeout(3500);
  const c = await p.$(".card.seg.mascote"); await c.scrollIntoViewIfNeeded(); await p.waitForTimeout(2300); await c.screenshot({ path: out + "/s2-mascote.png" });
  console.log("guias:", ids.length, "| imagens:", total, "| quebradas:", quebradas, "| requisições com falha:", [...new Set(falhas)].slice(0, 3), "| erros:", errs);
  await b.close();
})();
