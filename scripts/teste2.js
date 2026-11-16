// Uso: node scripts/teste2.js <saida> <guia> <indice-do-card>
const { chromium } = require("playwright"); const path = require("path");
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1080, height: 1920 } });
  await p.goto("file://" + path.join(__dirname, "../guia.html") + `?g=${process.argv[3]}&export=1`);
  const c = await p.$$(".card"); await c[+process.argv[4]].screenshot({ path: process.argv[2] + "/c.png" }); console.log(c.length); await b.close();
})();
