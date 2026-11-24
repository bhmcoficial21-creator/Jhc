// node scripts/teste-unico.js <pasta-com-o-html> <saida> — testa o arquivo único sozinho
const { chromium } = require("playwright"); const path = require("path"); const fs = require("fs");
const dir = process.argv[2], out = process.argv[3], nome = "alongamento-estatico.html";
const U = q => "file://" + path.join(dir, nome) + (q || "");
(async () => {
  const w = {}; new Function("window", fs.readFileSync(path.join(__dirname, "../dist/assets/guias.js"), "utf8"))(w);
  const ids = w.MODULOS.flatMap(m => m.guias.map(g => g.id));
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 430, height: 900 } });
  const errs = [], falhas = []; p.on("pageerror", e => errs.push(e.message));
  p.on("requestfailed", r => falhas.push(r.url().slice(-60))); p.on("response", r => { if (r.status() >= 400) falhas.push(r.url().slice(-60)); });
  await p.addInitScript(() => { try { sessionStorage.setItem("entrou", "1"); } catch (e) {} });

  await p.goto(U()); await p.waitForTimeout(3300);
  console.log("lista: capas", (await p.$$(".capa-mod")).length, "| guias", (await p.$$("a.guia")).length, "| capas quebradas:", await p.$$eval(".capa-mod img", i => i.filter(x => !x.complete || !x.naturalWidth).length));
  await p.screenshot({ path: out + "/u1-lista.png" });

  // toque num guia → abre o guia dentro do mesmo arquivo
  await p.click('a.guia[href="?g=sos-lombar"]'); await p.waitForURL(/\?g=sos-lombar/); await p.waitForTimeout(3600);
  console.log("guia aberto:", p.url().split("/").pop(), "| cartões:", (await p.$$(".flip")).length, "| agenda:", !!(await p.$("#agenda .agenda")));
  await p.screenshot({ path: out + "/u2-guia.png" });
  // voltar
  await p.click('header.top a[href="?"]'); await p.waitForTimeout(3300);
  console.log("voltou para a lista:", (await p.$$("a.guia")).length, "guias | url:", p.url().split("/").pop());
  // busca → abre direto no cartão
  await p.fill("#q", "gato"); await p.waitForTimeout(300);
  const href = await p.$eval("#res a.guia", a => a.getAttribute("href")); console.log("busca 'gato' → link:", href);
  await p.click("#res a.guia"); await p.waitForTimeout(4200);
  console.log("cartão aberto pela busca:", await p.$$eval(".flip.virado", f => f.length));
  // todos os guias abrem com imagens
  let total = 0, quebradas = 0;
  for (const id of ids) {
    await p.goto(U("?g=" + id)); await p.waitForTimeout(700);
    const r = await p.evaluate(() => [...document.images].map(i => i.complete && i.naturalWidth > 0)); total += r.length; quebradas += r.filter(x => !x).length;
  }
  console.log("guias:", ids.length, "| imagens:", total, "| quebradas:", quebradas, "| falhas de rede:", [...new Set(falhas)].slice(0, 3), "| erros:", errs);
  await b.close();
})();
