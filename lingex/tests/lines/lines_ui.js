const L=require('../lib.js'); const fs=require('fs');
const ALL=JSON.parse(fs.readFileSync(__dirname+'/all.json','utf8'));
const MARKERS=['ESTADOS UNIDOS','REINO UNIDO','FRANÇA','ITÁLIA','ESPANHA','CANADÁ','NIGÉRIA','ÁFRICA DO SUL','MÉXICO','ARGENTINA','JAPÃO','CHINA','RÚSSIA','EGITO'];
async function runOne(b,marker,opt){
  const res={marker,opt,variant:null,probs:[],lines:0,plays:0,situs:0};
  const {page,errs}=await L.newPage(b,{premium:true});
  await page.addInitScript(()=>{ window.__utt=[];
    const fake={getVoices:()=>[],speak:u=>{window.__spoken.push(u.text);window.__utt.push({t:u.text,l:u.lang,r:u.rate});},cancel(){},addEventListener(){},removeEventListener(){}};
    Object.defineProperty(window,'speechSynthesis',{value:fake,configurable:true,writable:true}); });
  try{
    const o=await L.onboard(page,marker,opt);
    if(opt>0&&opt>=o.sheet){await page.context().close();return null;}
    await L.tab(page,'tabPerfil');
    const dest=await page.evaluate(()=>document.getElementById('perfilDestino').textContent);
    res.variant=(dest.match(/\(([^)]+)\)/)||[])[1]||dest;
    const exp=ALL[res.variant]; if(!exp){res.probs.push('variante sem dados: '+res.variant);return res;}
    await L.tab(page,'tabSituacoes'); await page.waitForTimeout(200);
    const n=(await L.trailBtns(page)).length; res.total=n;
    const expSits=exp.list.concat(exp.bonus?[exp.bonus]:[]);
    if(n!==expSits.length) res.probs.push(`trilha tem ${n} situacoes, esperado ${expSits.length}`);
    for(let i=0;i<Math.min(n,expSits.length);i++){
      const es=expSits[i]; await L.openTrail(page,i); await page.waitForTimeout(100);
      const dom=await page.evaluate(()=>[...document.querySelectorAll('#situLines .situ-line')].map(d=>{const m=d.querySelector('.sl-main');return{txt:m.textContent,lang:m.lang,dir:m.dir,pron:d.querySelector('.sl-pron').textContent,pt:d.querySelector('.sl-trans').textContent,sp:d.className.includes('you')?'you':'them',btns:[...d.querySelectorAll('.sl-controls button')].map(x=>x.textContent.trim()),vis:d.offsetHeight>0&&m.offsetHeight>0}}));
      if(dom.length!==es.lines.length){res.probs.push(`${es.id}: ${dom.length} falas na tela, esperado ${es.lines.length}`);continue;}
      for(let k=0;k<dom.length;k++){
        const e=es.lines[k],d=dom[k]; res.lines++;
        const tag=`${es.id}#${k}`;
        if(d.txt!==e.txt) res.probs.push(`${tag}: texto difere`);
        if(d.pron!==(e.pron||'')) res.probs.push(`${tag}: pron difere`);
        if(d.pt!==e.pt) res.probs.push(`${tag}: pt difere`);
        if(d.sp!==e.sp) res.probs.push(`${tag}: falante difere`);
        if(d.lang!==res.variant) res.probs.push(`${tag}: lang="${d.lang}"`);
        if(res.variant==='ar-EG'&&d.dir!=='rtl') res.probs.push(`${tag}: sem rtl`);
        if(!d.vis) res.probs.push(`${tag}: invisivel`);
        if(!d.btns.some(x=>/Ouvir/.test(x))||!d.btns.some(x=>/Devagar/.test(x))) res.probs.push(`${tag}: faltam botoes de audio ${d.btns}`);
        if(e.sp==='you'&&!d.btns.some(x=>/Gravar/.test(x))) res.probs.push(`${tag}: falta Gravar`);
        // toca normal e devagar
        for(const [kind,rate] of [['Ouvir',1],['Devagar',0.55]]){
          await page.evaluate(({k,kind})=>{const div=document.querySelectorAll('#situLines .situ-line')[k];[...div.querySelectorAll('.sl-controls button')].find(b=>b.textContent.includes(kind)).click();},{k,kind});
          const u=await page.evaluate(()=>window.__utt[window.__utt.length-1]);
          res.plays++;
          if(!u||u.t!==e.txt) res.probs.push(`${tag} ${kind}: voz recebeu "${u&&u.t}"`);
          else if(u.l!==res.variant) res.probs.push(`${tag} ${kind}: lang voz ${u.l}`);
          else if(Math.abs(u.r-rate)>0.001) res.probs.push(`${tag} ${kind}: rate ${u.r}`);
        }
      }
      // botão do teste agora liberado?
      const lbl=await page.evaluate(()=>document.getElementById('situCompleteBtn').textContent);
      if(!/Fazer o teste/.test(lbl)) res.probs.push(`${es.id}: apos ouvir tudo botao diz "${lbl}"`);
      // passa no teste para destravar a proxima
      await page.evaluate(()=>document.getElementById('situCompleteBtn').click()); await page.waitForTimeout(100);
      const r=await L.solveMastery(page,es.lines);
      if(!/concluída/.test(r.big)) res.probs.push(`${es.id}: teste nao aprovou: ${r.big}`); else res.situs++;
      await page.evaluate(()=>{document.getElementById('mastery').classList.remove('visible');document.getElementById('situBack').click();}); await page.waitForTimeout(60);
    }
  }catch(e){res.probs.push('EXCECAO: '+e.message.slice(0,200));}
  if(errs.length) res.probs.push('JS: '+errs.join(' | ').slice(0,200));
  await page.context().close(); return res;
}
(async()=>{
 const b=await L.chromium.launch(); const jobs=[]; for(const m of MARKERS) for(const o of [0,1,2]) jobs.push([m,o]);
 const out=[]; let k=0; async function w(){while(k<jobs.length){const [m,o]=jobs[k++];const r=await runOne(b,m,o);if(r)out.push(r);}}
 await Promise.all([w(),w(),w(),w()]);
 const seen={};let bad=0,tl=0,tp=0;
 out.sort((a,c)=>(a.variant||'').localeCompare(c.variant||''));
 for(const r of out){ if(!r.variant) continue; if(seen[r.variant]){ if(r.probs.length)console.log('dup',r.variant,r.probs.slice(0,3)); continue;} seen[r.variant]=1; tl+=r.lines;tp+=r.plays;
   console.log(`${r.probs.length?'FALHA':'OK   '} ${r.variant.padEnd(6)} (${r.marker}#${r.opt}) falas ${r.lines} | audios ${r.plays} | testes aprovados ${r.situs}/${r.total}`);
   r.probs.slice(0,10).forEach(p=>console.log('     - '+p)); if(r.probs.length)bad++; }
 console.log('\nVariantes:',Object.keys(seen).length,'| falas conferidas:',tl,'| audios tocados:',tp,'| variantes com falha:',bad);
 await b.close(); process.exit(bad?1:0);})();
