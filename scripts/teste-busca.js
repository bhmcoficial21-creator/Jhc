// node scripts/teste-busca.js <pasta-de-saida>
const { chromium } = require("playwright"); const path = require("path"); const out = process.argv[2];
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 430, height: 900 }, deviceScaleFactor: 2 });
  const errs = []; p.on("pageerror", e => errs.push(e.message));
  await p.goto("file://" + path.join(__dirname, "..", "membros.html")); await p.waitForTimeout(1200);
  await p.screenshot({ path: out + "/b1-vazio.png", clip: { x: 0, y: 0, width: 430, height: 420 } });
  await p.fill("#q", "gato"); await p.waitForTimeout(500);
  console.log("gato →", await p.$$eval("#res a.guia", a => a.map(x => x.textContent.replace(/\s+/g, " ").trim())));
  await p.fill("#q", "pescoco"); console.log("pescoco (sem acento) →", (await p.$$("#res a.guia")).length);
  await p.fill("#q", "xyzabc"); console.log("sem resultado →", (await p.textContent("#res")).trim().slice(0, 40));
  await p.fill("#q", "ombros"); await p.waitForTimeout(300); await p.screenshot({ path: out + "/b2-resultados.png" });
  await p.click("#filter-icon"); console.log("limpou → lista visível:", await p.$eval("#app", e => e.style.display !== "none"));
  await p.fill("#q", "Joelhos ao peito"); await p.click("#res a.guia");
  await p.waitForURL(/guia\.html/); await p.waitForTimeout(2600);
  console.log("url", p.url().split("/").pop(), "| scrollY", await p.evaluate(() => Math.round(scrollY)));
  console.log("erros", errs); await b.close();
})();
