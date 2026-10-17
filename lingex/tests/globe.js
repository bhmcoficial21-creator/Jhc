const L=require('./lib.js');
(async()=>{
 const b=await L.chromium.launch(); let worst=0, samples=0, hiddenMax=0;
 for(const vp of [[320,568],[390,844],[430,932]]){
  const {page,errs}=await L.newPage(b,{vp});
  await page.goto('https://lingex.test/'); await page.waitForSelector('#welcome.visible',{timeout:9000}); await page.click('#startBtn'); await page.waitForTimeout(800);
  for(let k=0;k<30;k++){
    await page.waitForTimeout(700);
    const r=await page.evaluate(()=>{
      const ls=[...document.querySelectorAll('.marker-label')].filter(e=>+e.style.opacity>0).map(e=>({n:e.textContent,r:e.getBoundingClientRect()}));
      let worst=0,pair='';
      for(let i=0;i<ls.length;i++)for(let j=i+1;j<ls.length;j++){const a=ls[i].r,c=ls[j].r;const ox=Math.min(a.right,c.right)-Math.max(a.left,c.left),oy=Math.min(a.bottom,c.bottom)-Math.max(a.top,c.top);if(ox>0&&oy>0){const f=ox*oy/Math.min(a.width*a.height,c.width*c.height);if(f>worst){worst=f;pair=ls[i].n+'/'+ls[j].n;}}}
      return {worst,pair,shown:ls.length};
    });
    samples++; if(r.worst>worst){worst=r.worst;} if(r.worst>0.31) console.log(`  [${vp}] sobreposição ${Math.round(r.worst*100)}% ${r.pair}`);
  }
  // país ainda tocável: escolher EGITO funciona
  await page.evaluate(()=>[...document.querySelectorAll('#markers button')].find(b=>b.getAttribute('aria-label')==='EGITO').click()); await page.waitForTimeout(300);
  const ok=await page.evaluate(()=>/Egito/i.test(document.getElementById('countryName').textContent));
  console.log(`${vp.join('x')}: pior sobreposição visível ${Math.round(worst*100)}% em ${samples} amostras | tocar em Egito seleciona: ${ok} | erros JS: ${errs.length}`);
  await page.context().close(); worst=0;samples=0;
 }
 await b.close();
})();
