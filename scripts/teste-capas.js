// node scripts/teste-capas.js <pasta-de-saida>
const { chromium } = require("playwright"); const path = require("path"); const out = process.argv[2];
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 430, height: 900 }, deviceScaleFactor: 1 });
  const errs = []; p.on("pageerror", e => errs.push(e.message));
  await p.addInitScript(() => { try { sessionStorage.setItem("entrou", "1"); } catch (e) {} });
  await p.goto("file://" + path.join(__dirname, "..", "membros.html")); await p.waitForTimeout(800);
  const capas = await p.$$(".capa-mod"); console.log("capas:", capas.length);
  let i = 0;
  for (const c of capas) { await c.scrollIntoViewIfNeeded(); await p.waitForTimeout(2600); await c.screenshot({ path: `${out}/cp${++i}.png` }); }
  console.log("imagens quebradas:", await p.$$eval(".capa-mod img", im => im.filter(x => !x.naturalWidth).length), "| erros", errs);
  await b.close();
})();
