// Quem já tem progresso: "Começar" refaz país/objetivo/nível; "Continuar de onde parei" vai à Home.
const L=require('./lib.js');
(async()=>{
 const b=await L.chromium.launch(); const out=[]; const ok=(c,m)=>{out.push((c?'OK   ':'FALHA ')+m); if(!c) process.exitCode=1;};
 const seed=JSON.stringify({v:1,variant:'en-US',objectives:['viajar'],level:'A1',completed:{cafe:true,aeroporto:true},viewed:{cafe:true,aeroporto:true}});
 { // refazer com o MESMO idioma: progresso fica
   const {page,errs}=await L.newPage(b,{seed}); await page.goto('https://lingex.test/'); await page.waitForSelector('#welcome.visible',{timeout:12000}); await page.waitForTimeout(400);
   await page.click('#startBtn'); await page.waitForTimeout(1500);
   const names=await page.evaluate(()=>[...document.querySelectorAll('#markers button')].map(b=>b.getAttribute('aria-label')));
   ok(names.length>=14,'"Começar" abre a escolha de país ('+names.length+' países)');
   const idx=names.findIndex(n=>n==='ESTADOS UNIDOS'); await page.evaluate(i=>document.querySelectorAll('#markers button')[i].click(),idx); await page.waitForTimeout(400);
   if(await page.evaluate(()=>document.getElementById('clusterSheet').classList.contains('visible'))) await page.evaluate(()=>document.getElementById('clusterOptions').children[0].click());
   await page.evaluate(()=>document.getElementById('confirmBtn').click()); await page.waitForTimeout(1600);
   ok(await page.evaluate(()=>document.getElementById('objContinueBtn').disabled),'objetivo começa em branco (Continuar desabilitado)');
   const objs=await page.evaluate(()=>[...document.querySelectorAll('#objList .obj-label')].map(e=>e.textContent));
   ok(objs.length>=4&&objs.some(o=>/Trabalhar/.test(o))&&objs.some(o=>/Viajar/.test(o)),'objetivos (trabalho, viagem…) disponíveis: '+objs.join(' | '));
   await page.evaluate(()=>{document.getElementById('objList').children[1].click();document.getElementById('objContinueBtn').click()}); await page.waitForTimeout(400);
   const lv=await page.evaluate(()=>[...document.querySelectorAll('#lvlList > *')].map(e=>e.textContent.replace(/\s+/g,' ').trim().slice(0,28)));
   ok(lv.length>=3,'níveis (iniciante…) disponíveis: '+lv.join(' | '));
   await page.evaluate(()=>{document.getElementById('lvlList').children[0].click();document.getElementById('nivelContinueBtn').click()}); await page.waitForTimeout(500);
   await page.evaluate(()=>document.getElementById('companionContinueBtn').click()); await page.waitForTimeout(300);
   await page.evaluate(()=>document.getElementById('resumoCta').click()); await page.waitForTimeout(600);
   await L.tab(page,'tabSituacoes'); const st=await L.trailBtns(page);
   ok(st[0].includes('done')&&st[1].includes('done'),'mesmo idioma: progresso mantido '+st.slice(0,3).join(' | '));
   ok(await page.evaluate(()=>/Trabalhar/.test(document.getElementById('perfilObjetivo').textContent)),'novo objetivo aplicado');
   ok(errs.length===0,'sem erros JS '+JSON.stringify(errs)); await page.context().close();
 }
 { // refazer com OUTRO idioma: progresso do anterior não vale
   const {page,errs}=await L.newPage(b,{seed}); await page.goto('https://lingex.test/'); await page.waitForSelector('#welcome.visible',{timeout:12000}); await page.waitForTimeout(400);
   await page.click('#startBtn'); await page.waitForTimeout(1500);
   const names=await page.evaluate(()=>[...document.querySelectorAll('#markers button')].map(b=>b.getAttribute('aria-label')));
   const idx=names.findIndex(n=>n==='JAPÃO'); await page.evaluate(i=>document.querySelectorAll('#markers button')[i].click(),idx); await page.waitForTimeout(400);
   await page.evaluate(()=>document.getElementById('confirmBtn').click()); await page.waitForTimeout(1600);
   await page.evaluate(()=>{document.getElementById('objList').children[0].click();document.getElementById('objContinueBtn').click()}); await page.waitForTimeout(400);
   await page.evaluate(()=>{document.getElementById('lvlList').children[0].click();document.getElementById('nivelContinueBtn').click()}); await page.waitForTimeout(500);
   await page.evaluate(()=>document.getElementById('companionContinueBtn').click()); await page.waitForTimeout(300);
   await page.evaluate(()=>document.getElementById('resumoCta').click()); await page.waitForTimeout(600);
   await L.tab(page,'tabSituacoes'); const st=await L.trailBtns(page);
   ok(st[0].includes('next')&&!st[0].includes('done'),'outro idioma: começa do zero '+st.slice(0,3).join(' | '));
   ok(errs.length===0,'sem erros JS '+JSON.stringify(errs)); await page.context().close();
 }
 console.log(out.join('\n')); await b.close();
})();
