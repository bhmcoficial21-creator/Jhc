// Universo 3D da entrada: WebGL ligado, fallback 2D sem WebGL, e arrasto mexendo no céu.
const {chromium}=require('/opt/node22/lib/node_modules/playwright');
const fs=require('fs'),path=require('path');
const ROOT=path.resolve(__dirname,'..');
const out=[]; const ok=(c,m)=>{out.push((c?'OK   ':'FALHA ')+m); if(!c) process.exitCode=1;};
async function open(b,{webgl=true}={}){
  const ctx=await b.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
  const page=await ctx.newPage(); const errs=[], reqs=[];
  page.on('pageerror',e=>errs.push(e.message)); page.on('console',m=>{if(m.type()==='error'&&!/Failed to load resource/.test(m.text()))errs.push(m.text())});
  if(!webgl) await page.addInitScript(()=>{const g=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(t,...a){return /webgl/.test(t)?null:g.call(this,t,...a)};});
  await page.route('https://lingex.test/**',async r=>{
    let u=new URL(r.request().url()).pathname; reqs.push(u); if(u==='/')u='/index.html';
    const f=path.join(ROOT,u); if(fs.existsSync(f)&&u!=='/nexus_proxy.php') return r.fulfill({path:f});
    return r.fulfill({status:404,body:''});
  });
  await page.goto('https://lingex.test/'); await page.waitForSelector('#welcome.visible',{timeout:9000});
  return {page,errs,reqs};
}
// brilho médio + variação numa faixa do topo (fora do globo)
async function stats(page){
  const buf=await page.screenshot({clip:{x:0,y:0,width:390,height:90}});
  return page.evaluate(async b64=>{const im=new Image();im.src='data:image/png;base64,'+b64;await im.decode();
    const c=document.createElement('canvas');c.width=im.width;c.height=im.height;const x=c.getContext('2d');x.drawImage(im,0,0);
    const d=x.getImageData(0,0,c.width,c.height).data;let s=0,s2=0,n=d.length/4;for(let i=0;i<d.length;i+=4){const v=(d[i]+d[i+1]+d[i+2])/3;s+=v;s2+=v*v;}
    const m=s/n;return {mean:m,sd:Math.sqrt(Math.max(0,s2/n-m*m))};},buf.toString('base64'));
}
(async()=>{
  const b=await chromium.launch({args:['--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
  { // WebGL ligado
    const {page,errs,reqs}=await open(b); await page.waitForTimeout(1500);
    const glOn=await page.evaluate(()=>{const c=document.getElementById('sky');return !!c&&c.width>0});
    ok(glOn,'canvas do céu existe e foi dimensionado');
    ok(reqs.some(u=>/nebula-(4k|2k)\.jpg$/.test(u)),'textura HD da nebulosa foi pedida: '+reqs.filter(u=>/nebula/.test(u)).join(','));
    const s0=await stats(page); ok(s0.sd>4,'céu 3D tem textura (desvio '+s0.sd.toFixed(1)+')');
    await page.click('#startBtn'); await page.waitForTimeout(1400);
    const a=await page.screenshot({clip:{x:0,y:600,width:390,height:244}});
    await page.mouse.move(300,400); await page.mouse.down(); for(let i=0;i<14;i++){await page.mouse.move(300-i*14,400);await page.waitForTimeout(16);} await page.mouse.up(); await page.waitForTimeout(500);
    const c=await page.screenshot({clip:{x:0,y:600,width:390,height:244}});
    ok(!a.equals(c),'arrastar no destino mexe no céu');
    const sizes=await page.evaluate(()=>({iw:innerWidth,sw:document.documentElement.scrollWidth,wide:[...document.querySelectorAll('body *')].filter(e=>e.getBoundingClientRect().right>390.5).slice(0,4).map(e=>e.tagName+'#'+e.id+'.'+e.className+' r='+Math.round(e.getBoundingClientRect().right))}));
    ok(sizes.sw<=sizes.iw&&sizes.iw===390,'sem estouro horizontal: '+JSON.stringify(sizes));
    ok(errs.length===0,'WebGL: sem erros JS '+JSON.stringify(errs));
  }
  { // sem WebGL: cai no fundo 2D antigo e o app continua
    const {page,errs}=await open(b,{webgl:false}); await page.waitForTimeout(800);
    const s0=await stats(page); ok(s0.mean>2,'fallback 2D pinta o fundo (brilho '+s0.mean.toFixed(1)+')');
    await page.click('#startBtn'); await page.waitForTimeout(1400);
    const n=await page.evaluate(()=>document.querySelectorAll('#markers button').length); ok(n>0,'fallback: marcadores de país existem ('+n+')');
    ok(errs.length===0,'sem WebGL: sem erros JS '+JSON.stringify(errs));
  }
  console.log(out.join('\n')); await b.close();
})();
