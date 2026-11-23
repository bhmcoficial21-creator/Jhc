// node scripts/teste-agenda.js <pasta-de-saida>
const { chromium } = require("playwright"); const path = require("path"); const out = process.argv[2];
const u = f => "file://" + path.join(__dirname, "..", f);
(async () => {
  const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 430, height: 900 }, deviceScaleFactor: 1, hasTouch: true });
  const p = await ctx.newPage(); const errs = []; p.on("pageerror", e => errs.push(e.message));
  await p.addInitScript(() => { try { sessionStorage.setItem("entrou", "1"); } catch (e) {} });
  await p.goto(u("membros.html")); await p.waitForTimeout(3500);

  // barra de pesquisa
  await p.screenshot({ path: out + "/a1-busca.png", clip: { x: 0, y: 100, width: 430, height: 200 } });
  await p.fill("#q", "gato"); await p.waitForTimeout(300);
  console.log("busca 'gato':", await p.$$eval("#res a.guia", a => a.length));
  await p.click("#filter-icon"); await p.waitForTimeout(300);
  console.log("limpou:", (await p.inputValue("#q")) === "", "| lista visível:", await p.$eval("#app", e => e.style.display !== "none"));

  // agenda
  const mes = await p.textContent(".agenda .mes"); console.log("mês:", mes);
  console.log("cabeçalho:", await p.$$eval(".agenda .sem", s => s.map(x => x.textContent).join(",")));
  await p.locator("#agenda").scrollIntoViewIfNeeded(); await p.waitForTimeout(1800);
  const hoje = await p.locator(".dia.hoje input"); await p.locator(".dia.hoje").click(); await p.waitForTimeout(400);
  console.log("hoje marcado:", await hoje.isChecked(), "| resumo:", (await p.textContent(".agenda .resumo")).trim());
  await p.screenshot({ path: out + "/a2-agenda.png" });
  await p.click('.agenda button[data-v="1"]'); await p.waitForTimeout(300);
  console.log("próximo mês:", await p.textContent(".agenda .mes"), "| dias liberados:", await p.$$eval(".dia:not(.futuro)", d => d.length));
  await p.click('.agenda button[data-v="-1"]'); await p.click('.agenda button[data-v="-1"]'); await p.waitForTimeout(300);
  console.log("mês anterior:", await p.textContent(".agenda .mes"));
  console.log("salvo:", await p.evaluate(() => localStorage.getItem("ae:dias")));

  // concluir exercício marca o dia + nova caixa
  await p.evaluate(() => localStorage.removeItem("ae:dias"));
  await p.goto(u("guia.html?g=sos-lombar")); await p.waitForTimeout(3600);
  const f = (await p.$$(".flip"))[0]; await f.scrollIntoViewIfNeeded(); await p.waitForTimeout(2200);
  await f.click({ position: { x: 100, y: 200 } }); await p.waitForTimeout(800);
  await p.locator(".flip.virado .conc").first().click(); await p.waitForTimeout(700);
  await p.screenshot({ path: out + "/a3-feito.png" });
  console.log("dia de hoje na agenda:", await p.evaluate(() => !!JSON.parse(localStorage.getItem("ae:dias") || "{}")[(d => d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"))(new Date())]));
  await p.goto(u("membros.html")); await p.waitForTimeout(3500);
  await p.locator("#agenda").scrollIntoViewIfNeeded(); await p.waitForTimeout(1500);
  await p.screenshot({ path: out + "/a4-agenda-escuro.png" });
  console.log("erros", errs); await b.close();
})();
