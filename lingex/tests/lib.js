const {chromium}=require('/opt/node22/lib/node_modules/playwright');
const fs=require('fs');
const HTML=()=>fs.readFileSync(''+require('path').resolve(__dirname,'../index.html')+'','utf8');
async function newPage(browser,{vp=[390,844],tts=true,premium=false,seed=null,proxy=null,claude=false}={}){
  const ctx=await browser.newContext({viewport:{width:vp[0],height:vp[1]},isMobile:true,hasTouch:true});
  const page=await ctx.newPage(); const errs=[]; page.on('pageerror',e=>errs.push(e.message)); page.on('console',m=>{if(m.type()==='error'&&!/Failed to load resource/.test(m.text()))errs.push('console:'+m.text())});
  const posted=[];
  await page.route('https://lingex.test/**',async r=>{
    const u=r.request().url();
    if(u.endsWith('nexus_proxy.php')){ posted.push(r.request().postData()); const p=proxy||{status:405,body:'x',raw:true};
      return r.fulfill({status:p.status,contentType:p.raw?'text/html':'application/json',body:p.raw?p.body:JSON.stringify(p.body)}); }
    return r.fulfill({contentType:'text/html',body:HTML()});
  });
  await page.addInitScript(({tts,premium,seed,claude})=>{
    window.__spoken=[];
    const def=(k,v)=>Object.defineProperty(window,k,{value:v,configurable:true,writable:true});
    if(tts){ const fake={getVoices:()=>[],speak:u=>{window.__spoken.push(u.text);},cancel(){},addEventListener(){},removeEventListener(){}}; def('speechSynthesis',fake); }
    else def('speechSynthesis',undefined);
    if(premium){ try{localStorage.setItem('lingex.paid',JSON.stringify({email:'aluno@example.com',checkedAt:Date.now()}));}catch(e){} }
    if(seed){ try{localStorage.setItem('lingex.v1',seed);}catch(e){} }
    if(claude){ window.claude={use:async n=>n==='sample'?async(msgs,o)=>({text:'Resposta via claude.ai: "Hello there"',truncated:false}):null}; }
  },{tts,premium,seed,claude});
  return {ctx,page,errs,posted};
}
async function onboard(page,markerName,optIdx=0){
  await page.goto('https://lingex.test/'); await page.waitForSelector('#welcome.visible',{timeout:9000}); await page.waitForTimeout(500);
  await page.click('#startBtn'); await page.waitForTimeout(1200);
  const names=await page.evaluate(()=>[...document.querySelectorAll('#markers button')].map(b=>b.getAttribute('aria-label')));
  const idx=names.findIndex(n=>n.toLowerCase()===markerName.toLowerCase()); if(idx<0) throw new Error('marcador '+markerName+' nao existe: '+names);
  await page.evaluate(i=>document.querySelectorAll('#markers button')[i].click(),idx); await page.waitForTimeout(500);
  const sheet=await page.evaluate(()=>{const s=document.getElementById('clusterSheet');return s&&s.classList.contains('visible')?[...document.getElementById('clusterOptions').children].length:0});
  if(sheet&&optIdx>=sheet) return {sheet}; // cluster menor que o índice pedido (depende da fase do globo): quem chamou pula
  if(sheet){ await page.evaluate(k=>document.getElementById('clusterOptions').children[k].click(),optIdx); await page.waitForTimeout(500); }
  await page.evaluate(()=>document.getElementById('confirmBtn').click()); await page.waitForTimeout(1500);
  await page.evaluate(()=>document.getElementById('objList').children[0].click());
  await page.evaluate(()=>document.getElementById('objContinueBtn').click()); await page.waitForTimeout(400);
  await page.evaluate(()=>document.getElementById('lvlList').children[0].click());
  await page.evaluate(()=>document.getElementById('nivelContinueBtn').click()); await page.waitForTimeout(400);
  await page.evaluate(()=>document.getElementById('companionContinueBtn').click()); await page.waitForTimeout(300);
  await page.evaluate(()=>document.getElementById('resumoCta').click()); await page.waitForTimeout(600);
  return {sheet};
}
const tab=(page,t)=>page.evaluate(t=>document.querySelector(`[data-tab="${t}"]`).click(),t);
const trailBtns=page=>page.evaluate(()=>[...document.querySelectorAll('#situTrilhaWrap .trail-node-btn')].map(b=>b.className.replace('trail-node-btn','').trim()));
const openTrail=(page,i)=>page.evaluate(i=>document.querySelectorAll('#situTrilhaWrap .trail-node-btn')[i].click(),i);
const readLines=page=>page.evaluate(()=>[...document.querySelectorAll('#situLines .situ-line')].map(d=>({txt:d.querySelector('.sl-main').textContent,pron:d.querySelector('.sl-pron').textContent,pt:d.querySelector('.sl-trans').textContent,sp:d.className.includes('you')?'you':'them'})));
const listenAll=page=>page.evaluate(()=>{[...document.querySelectorAll('#situLines .sl-controls button')].filter(b=>/Ouvir/.test(b.textContent)).forEach(b=>b.click());});
async function allLinesOfVariant(page){ /* pool completo: lê todas as situações abertas via lista de preview não é possível; usa só as da situação atual p/ resolver */ }
async function solveMastery(page,lines,{wrongCount=0}={}){
  let wrongLeft=wrongCount, n=0;
  while(true){
    const info=await page.evaluate(()=>({prompt:document.getElementById('masteryPrompt').textContent,
      hint:[...document.querySelectorAll('#masteryHint .th-text')].map(e=>e.textContent)[0]||'',
      opts:[...document.querySelectorAll('#masteryArea .treino-opt')].map(b=>b.dataset.value),
      isOrder:!!document.querySelector('#masteryArea .ord-answer'),
      spoken:window.__spoken[window.__spoken.length-1]||'',
      progress:document.getElementById('masteryProgress').textContent}));
    n++;
    let correct=null,words=null,line=null;
    if(/^Ouça/.test(info.prompt)){ line=lines.find(l=>l.txt===info.spoken); correct=line&&line.pt; }
    else if(/^Leia/.test(info.prompt)){ line=lines.find(l=>l.txt===info.hint); correct=line&&line.pt; }
    else if(/Como você diria/.test(info.prompt)){ line=lines.find(l=>l.pt===info.hint); correct=line&&line.txt; }
    else if(/Como se lê/.test(info.prompt)){ line=lines.find(l=>l.txt===info.hint); correct=line&&line.pron; }
    else if(/Monte a frase/.test(info.prompt)){ line=lines.find(l=>l.pt===info.hint); words=line&&line.txt.split(/\s+/).filter(Boolean); }
    if(!line) throw new Error('nao resolvi: '+JSON.stringify(info));
    const wrong=wrongLeft>0; if(wrong) wrongLeft--;
    if(info.isOrder){
      const seq=wrong? words.slice().reverse() : words;
      for(const w of seq){ await page.evaluate(w=>{const c=[...document.querySelectorAll('#masteryArea .ord-pool .ord-chip')].find(c=>c.textContent===w);c.click();},w); }
      if(wrong && seq.join(' ')===words.join(' ')){ /* palíndromo improvável */ }
      await page.evaluate(()=>[...document.querySelectorAll('#masteryArea .cta')][0].click());
    } else {
      const pick=wrong?info.opts.find(o=>o!==correct):correct;
      await page.evaluate(v=>[...document.querySelectorAll('#masteryArea .treino-opt')].find(b=>b.dataset.value===v).click(),pick);
    }
    const label=await page.evaluate(()=>document.getElementById('masteryNext').textContent);
    await page.evaluate(()=>document.getElementById('masteryNext').click());
    if(label==='Ver resultado') break;
    if(n>40) throw new Error('loop infinito');
  }
  return page.evaluate(()=>({big:document.querySelector('#masterySummary .ts-big').textContent,sub:document.querySelector('#masterySummary .ts-sub').textContent,btns:[...document.querySelectorAll('#masterySummary button')].map(b=>b.textContent.trim().slice(0,40))}));
}
module.exports={chromium,newPage,onboard,tab,trailBtns,openTrail,readLines,listenAll,solveMastery};
