const {chromium}=require('/opt/node22/lib/node_modules/playwright');
(async()=>{const b=await chromium.launch();const p=await b.newPage();
await p.goto('file:///tmp/claude-0/jt/lines/probe.html');await p.waitForTimeout(800);
const d=await p.evaluate(()=>{const out={};const L=window.__L;
 Object.keys(L.SITU_LIBRARY).forEach(v=>{const r=L.buildSituationsFor(v);out[v]={list:r.list,bonus:r.bonus};});return out;});
require('fs').writeFileSync('/tmp/claude-0/jt/lines/all.json',JSON.stringify(d,null,1));
console.log(Object.keys(d).map(v=>v+':'+d[v].list.length+(d[v].bonus?'+b':'')).join(' '));
await b.close();})();
