// node scripts/teste-entrada.js <pasta-de-saida>
const { chromium } = require("playwright"); const path = require("path"); const out = process.argv[2];
(async () => {
  const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 430, height: 900 }, deviceScaleFactor: 1, hasTouch: true });
  const p = await ctx.newPage(); const errs = []; p.on("pageerror", e => errs.push(e.message));
  await p.goto("file://" + path.join(__dirname, "..", "membros.html"));
  let n = 0; for (const t of [400, 900, 900, 1000]) { await p.waitForTimeout(t); await p.screenshot({ path: `${out}/en${++n}.png` }); }
  await p.waitForTimeout(800); await p.screenshot({ path: `${out}/en5-pronto.png` });
  await p.mouse.move(215, 280); await p.mouse.move(215, 300, { steps: 4 }); await p.waitForTimeout(120); await p.screenshot({ path: `${out}/en6-toque.png` });
  await p.waitForTimeout(1500); await p.mouse.click(215, 700); await p.waitForTimeout(1200);
  console.log("entrada removida:", !(await p.evaluate(() => document.documentElement.classList.contains("entrada"))), "| erros", errs);
  await p.screenshot({ path: `${out}/en7-lista.png` });
  await p.reload(); await p.waitForTimeout(500);
  console.log("2ª visita sem entrada:", !(await p.evaluate(() => document.documentElement.classList.contains("entrada"))));
  await b.close();
})();
