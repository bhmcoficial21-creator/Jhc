// Exporta cada card em PNG 1080x1920: node scripts/exportar.js  (precisa de playwright)
const { chromium } = require("playwright"); const path = require("path"); const fs = require("fs");
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1080, height: 1920 } });
  const ids = (await (async()=>{ const src = fs.readFileSync(path.join(__dirname,"../assets/guias.js"),"utf8"); const w={}; new Function("window",src)(w); return w.MODULOS.flatMap(m=>m.guias.map(g=>g.id)); })());
  for (const id of ids) {
    await p.goto("file://" + path.join(__dirname, "../guia.html") + `?g=${id}&export=1`);
    const cards = await p.$$(".card"); fs.mkdirSync(path.join(__dirname,"../export",id),{recursive:true});
    for (let i=0;i<cards.length;i++) await cards[i].screenshot({ path: path.join(__dirname,"../export",id,`${String(i+1).padStart(2,"0")}.png`) });
    console.log(id, cards.length);
  }
  await b.close();
})();
