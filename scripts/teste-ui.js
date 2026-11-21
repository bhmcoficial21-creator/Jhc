// node scripts/teste-ui.js <pasta-de-saida>
const { chromium } = require("playwright"); const path = require("path"); const out = process.argv[2];
const u = f => "file://" + path.join(__dirname, "..", f);
(async () => {
  const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 430, height: 900 }, deviceScaleFactor: 1, hasTouch: true });
  const p = await ctx.newPage(); const errs = []; p.on("pageerror", e => errs.push(e.message));
  await p.addInitScript(() => { try { sessionStorage.setItem("entrou", "1"); } catch (e) {} });

  // carregando
  await p.goto(u("membros.html"), { waitUntil: "commit" }); await p.waitForTimeout(350);
  await p.screenshot({ path: out + "/u1-carregando.png" });
  await p.waitForTimeout(2800);
  console.log("carregando removido:", !(await p.$("#carregando")));

  // tema + nav
  await p.screenshot({ path: out + "/u2-claro.png" });
  await p.click(".theme-switch__container"); await p.waitForTimeout(900);
  console.log("tema:", await p.evaluate(() => document.documentElement.getAttribute("data-theme")), "| salvo:", await p.evaluate(() => localStorage.getItem("ae:tema")));
  await p.screenshot({ path: out + "/u3-escuro.png" });
  await p.hover('.ae-nav a[data-ir="buscar"]'); await p.waitForTimeout(500);
  await p.screenshot({ path: out + "/u4-nav.png", clip: { x: 0, y: 700, width: 430, height: 200 } });

  // guia: cartão que vira + concluir
  await p.goto(u("guia.html?g=sos-lombar")); await p.waitForTimeout(3600);
  const flips = await p.$$(".flip"); console.log("cartões que viram:", flips.length);
  await flips[0].scrollIntoViewIfNeeded(); await p.waitForTimeout(2200);
  await p.screenshot({ path: out + "/u5-verso.png" });
  await flips[0].click({ position: { x: 100, y: 200 } }); await p.waitForTimeout(900);
  await p.screenshot({ path: out + "/u6-frente.png" });
  await p.locator(".flip.virado .conc").first().click(); await p.waitForTimeout(1000);
  await p.screenshot({ path: out + "/u7-concluido.png" });
  console.log("salvo:", await p.evaluate(() => localStorage.getItem("ae:feitos")));
  await p.reload(); await p.waitForTimeout(3500);
  console.log("marcado após recarregar:", await p.$eval(".conc input", i => i.checked));

  // lista com progresso
  await p.goto(u("membros.html")); await p.waitForTimeout(3500);
  console.log("progresso:", (await p.textContent("#progresso")).replace(/\s+/g, " ").trim());
  await p.screenshot({ path: out + "/u8-lista-escura.png" });

  // exportação continua plana
  await p.goto(u("guia.html?g=sos-lombar&export=1")); await p.waitForTimeout(800);
  console.log("export → flip:", (await p.$$(".flip")).length, "| conc:", (await p.$$(".conc")).length, "| carregando:", (await p.$$("#carregando")).length, "| cards:", (await p.$$(".card")).length);
  console.log("erros", errs); await b.close();
})();
