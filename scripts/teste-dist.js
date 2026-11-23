// node scripts/teste-dist.js — abre o pacote dist/ e confere imagens, guias e funcionamento
const { chromium } = require("playwright"); const path = require("path"); const fs = require("fs");
const D = f => "file://" + path.join(__dirname, "..", "dist", f);
(async () => {
  const w = {}; new Function("window", fs.readFileSync(path.join(__dirname, "../dist/assets/guias.js"), "utf8"))(w);
  const ids = w.MODULOS.flatMap(m => m.guias.map(g => g.id));
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 430, height: 900 } });
  const errs = [], falhas = []; p.on("pageerror", e => errs.push(e.message));
  p.on("requestfailed", r => falhas.push(r.url().split("/dist/")[1]));
  p.on("response", r => { if (r.status() >= 400) falhas.push(r.url()); });
  await p.addInitScript(() => { try { sessionStorage.setItem("entrou", "1"); } catch (e) {} });
  await p.goto(D("index.html")); await p.waitForTimeout(3000);
  console.log("index: capas", (await p.$$(".capa-mod")).length, "| guias", (await p.$$("a.guia")).length, "| agenda na home:", !!(await p.$("#agenda")));
  let imgs = 0, quebradas = [];
  for (const id of ids) {
    await p.goto(D("guia.html?g=" + id)); await p.waitForTimeout(900);
    const r = await p.evaluate(() => [...document.images].map(i => ({ s: i.getAttribute("src"), ok: i.complete && i.naturalWidth > 0 })));
    imgs += r.length; r.filter(x => !x.ok).forEach(x => quebradas.push(id + ": " + x.s));
  }
  console.log("guias:", ids.length, "| imagens vistas:", imgs, "| quebradas:", quebradas.length, quebradas.slice(0, 5));
  console.log("requisições com falha:", [...new Set(falhas)].slice(0, 5), "| erros de script:", errs);
  await b.close();
})();
