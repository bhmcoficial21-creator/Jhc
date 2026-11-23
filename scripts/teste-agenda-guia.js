// node scripts/teste-agenda-guia.js <pasta-de-saida>
const { chromium } = require("playwright"); const path = require("path"); const out = process.argv[2];
const u = f => "file://" + path.join(__dirname, "..", f);
(async () => {
  const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 430, height: 900 }, deviceScaleFactor: 1, hasTouch: true });
  const p = await ctx.newPage(); const errs = []; p.on("pageerror", e => errs.push(e.message));
  await p.addInitScript(() => { try { sessionStorage.setItem("entrou", "1"); } catch (e) {} });

  await p.goto(u("membros.html")); await p.waitForTimeout(3300);
  console.log("home: agenda presente?", !!(await p.$("#agenda")), "| itens da barra:", await p.$$eval(".ae-nav a", a => a.map(x => x.getAttribute("aria-label")).join(",")));

  await p.goto(u("guia.html?g=sos-lombar")); await p.waitForTimeout(3600);
  const ordem = await p.evaluate(() => { const c = document.querySelector("#cards").getBoundingClientRect().bottom, a = document.querySelector("#agenda").getBoundingClientRect().top; return a >= c - 1; });
  console.log("agenda depois dos cards:", ordem, "| itens da barra:", await p.$$eval(".ae-nav a", a => a.map(x => x.getAttribute("aria-label")).join(",")));
  console.log("cabeçalho:", (await p.textContent(".agenda-t")).trim());
  const cards = await p.$$(".card.seg.mascote"); console.log("card do mascote:", cards.length);
  await cards[0].scrollIntoViewIfNeeded(); await p.waitForTimeout(2300); await cards[0].screenshot({ path: out + "/m1-mascote.png" });

  // concluir um exercício atualiza a contagem, mas NÃO marca o dia sozinho
  const f = (await p.$$(".flip"))[0]; await f.scrollIntoViewIfNeeded(); await p.waitForTimeout(2200);
  await f.click({ position: { x: 100, y: 200 } }); await p.waitForTimeout(800);
  await p.locator(".flip.virado .conc").first().click(); await p.waitForTimeout(600);
  console.log("após concluir 1:", (await p.textContent(".agenda-t")).replace(/\s+/g, " ").trim(), "| dia marcado sozinho?", await p.evaluate(() => !!localStorage.getItem("ae:dias") && localStorage.getItem("ae:dias") !== "{}"));
  await p.click(".ae-nav a[data-ir='agenda']"); await p.waitForTimeout(1200);
  await p.locator(".dia.hoje").click(); await p.waitForTimeout(500);
  await p.screenshot({ path: out + "/m2-agenda-fim.png" });
  console.log("hoje marcado:", await p.locator(".dia.hoje input").isChecked(), "| salvo:", await p.evaluate(() => localStorage.getItem("ae:dias")));

  await p.goto(u("guia.html?g=bonus-checklist-bolso")); await p.waitForTimeout(3000);
  console.log("guia sem exercícios: agenda presente?", !!(await p.$("#agenda")));
  console.log("erros", errs); await b.close();
})();
