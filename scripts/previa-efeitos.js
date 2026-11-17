// node scripts/previa-efeitos.js <pasta-de-saida> — sequência da revelação do card e da transição de página
const { chromium } = require("playwright"); const path = require("path"); const out = process.argv[2];
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 430, height: 900 }, deviceScaleFactor: 1 });
  const errs = []; p.on("pageerror", e => errs.push(e.message));
  const u = f => "file://" + path.join(__dirname, "..", f);
  await p.goto(u("membros.html")); await p.waitForTimeout(1500);
  await p.click('a[href="guia.html?g=sos-lombar"]'); // transição de página
  for (const [i, t] of [[1, 250], [2, 300], [3, 500]]) { await p.waitForTimeout(t); await p.screenshot({ path: `${out}/t${i}-transicao.png` }); }
  await p.waitForURL(/guia\.html/);
  for (const [i, t] of [[4, 150], [5, 250], [6, 400], [7, 500], [8, 900]]) { await p.waitForTimeout(t); await p.screenshot({ path: `${out}/t${i}-card.png` }); }
  await p.goto(u("guia.html?g=sos-lombar&export=1")); console.log("cards (modo exportar):", (await p.$$(".card")).length, "| rv:", (await p.$$(".rv")).length, "| erros", errs);
  await b.close();
})();
