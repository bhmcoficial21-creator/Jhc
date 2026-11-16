// Auditoria: node scripts/auditar.js — lista arquivos ausentes, imagens sem uso e cards ainda sem foto
const fs = require("fs"), path = require("path"); const root = path.join(__dirname, "..");
const w = {}; for (const f of ["guias.js", "imagens.js"]) new Function("window", fs.readFileSync(path.join(root, "assets", f), "utf8"))(w);
const files = new Set(fs.readdirSync(path.join(root, "assets/img"))); const used = new Set(); const vazios = [];
for (const m of w.MODULOS) for (const g of m.guias) for (const c of g.cards) {
  if (c.t === "ex") { const v = w.IMG_EX[g.id + "|" + c.nome] || w.IMG_EX[c.nome]; if (!v) vazios.push(`${g.titulo} › ${c.nome}`); else [].concat(v).forEach(x => used.add(x)); }
}
Object.values(w.IMG_CAPA).forEach(x => used.add(x));
const ausentes = [...used].filter(x => !files.has(x)); const semUso = [...files].filter(x => !used.has(x));
console.log("usadas:", used.size, "| ausentes:", ausentes, "| sem uso:", semUso, "\nsem foto (" + vazios.length + "):\n" + vazios.join("\n"));
