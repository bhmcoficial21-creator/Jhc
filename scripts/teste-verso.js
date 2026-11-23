// node scripts/teste-verso.js <pasta-de-saida> — confere que todo cartão tem foto no verso
const { chromium } = require("playwright"); const path = require("path"); const fs = require("fs"); const out = process.argv[2];
const u = f => "file://" + path.join(__dirname, "..", f);
(async () => {
  const w = {}; new Function("window", fs.readFileSync(path.join(__dirname, "../assets/guias.js"), "utf8"))(w);
  const ids = w.MODULOS.flatMap(m => m.guias.map(g => g.id));
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 430, height: 900 } });
  const errs = []; p.on("pageerror", e => errs.push(e.message));
  await p.addInitScript(() => { try { sessionStorage.setItem("entrou", "1"); } catch (e) {} });
  let flips = 0, fotos = 0, quebradas = 0;
  for (const id of ids) {
    await p.goto(u("guia.html?g=" + id)); await p.waitForTimeout(700);
    const r = await p.evaluate(() => ({ f: document.querySelectorAll(".flip").length, i: document.querySelectorAll(".flip .bimg").length,
      q: [...document.querySelectorAll(".flip .bimg img")].filter(x => x.complete && !x.naturalWidth).length }));
    flips += r.f; fotos += r.i; quebradas += r.q;
    if (r.f !== r.i) console.log("sem foto no verso:", id, r.f - r.i);
  }
  console.log("cartões:", flips, "| com foto no verso:", fotos, "| imagens quebradas:", quebradas);
  await p.goto(u("guia.html?g=sos-pescoco-ombros")); await p.waitForTimeout(3600);
  const f = (await p.$$(".flip"))[2]; await f.scrollIntoViewIfNeeded(); await p.waitForTimeout(2200); await f.screenshot({ path: out + "/v1.png" });
  await p.goto(u("guia.html?g=extra-tronco-peito")); await p.waitForTimeout(3600);
  const g2 = (await p.$$(".flip"))[0]; await g2.scrollIntoViewIfNeeded(); await p.waitForTimeout(2200); await g2.screenshot({ path: out + "/v2.png" });
  console.log("erros", errs); await b.close();
})();
