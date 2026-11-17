// node scripts/previa-efeitos.js <pasta-de-saida>
const { chromium } = require("playwright"); const path = require("path"); const out = process.argv[2];
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 430, height: 900 }, deviceScaleFactor: 2 });
  const errs = []; p.on("pageerror", e => errs.push(e.message));
  const u = f => "file://" + path.join(__dirname, "..", f);
  await p.goto(u("index.html")); await p.waitForTimeout(300); await p.screenshot({ path: out + "/e1-inicio-blur.png" });
  await p.waitForTimeout(2500); await p.screenshot({ path: out + "/e2-hero.png" });
  await p.goto(u("membros.html")); await p.waitForTimeout(2500); await p.screenshot({ path: out + "/e3-membros.png", clip: { x: 0, y: 0, width: 430, height: 300 } });
  console.log("erros", errs); await b.close();
})();
