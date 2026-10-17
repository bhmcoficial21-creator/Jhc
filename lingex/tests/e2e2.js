const L=require('./lib.js');
const MARKERS=['ESTADOS UNIDOS','REINO UNIDO','FRANÇA','ITÁLIA','ESPANHA','CANADÁ','NIGÉRIA','ÁFRICA DO SUL','MÉXICO','ARGENTINA','JAPÃO','CHINA','RÚSSIA','EGITO','BRASIL'];
async function runOne(b,marker,opt){
  const res={marker,opt,variant:null,probs:[],done:0,kinds:{}};
  const {page,errs}=await L.newPage(b,{premium:true});
  try{
    const o=await L.onboard(page,marker,opt);
    if(opt>0&&opt>=o.sheet){await page.context().close();return null;}
    await L.tab(page,'tabPerfil');
    const dest=await page.evaluate(()=>document.getElementById('perfilDestino').textContent);
    res.variant=(dest.match(/\(([^)]+)\)/)||[])[1]||dest;
    await L.tab(page,'tabSituacoes'); await page.waitForTimeout(200);
    const n=(await L.trailBtns(page)).length;
    const noContent=await page.evaluate(()=>/ainda/i.test(document.getElementById('situTrilhaWrap').textContent)&&!document.querySelector('.trail-node-btn'));
    if(n===0||noContent){res.noContent=true;await page.context().close();return res;}
    res.total=n;
    for(let i=0;i<n;i++){
      const st=(await L.trailBtns(page))[i];
      if(i<n-1 && !/next|^\s*$/.test(st)) res.probs.push(`situ ${i}: estado inesperado "${st}" (premium ativo)`);
      await L.openTrail(page,i); await page.waitForTimeout(120);
      const lines=await L.readLines(page);
      if(!lines.length){res.probs.push(`situ ${i}: sem falas (bloqueada?)`);break;}
      await L.listenAll(page);
      await page.evaluate(()=>document.getElementById('situCompleteBtn').click()); await page.waitForTimeout(100);
      if(!(await page.evaluate(()=>document.getElementById('mastery').classList.contains('visible')))){res.probs.push(`situ ${i}: teste nao abriu`);break;}
      // checagem estrutural das perguntas
      const qn=parseInt((await page.evaluate(()=>document.getElementById('masteryProgress').textContent)).match(/de (\d+)/)[1]);
      if(qn<6||qn>9) res.probs.push(`situ ${i}: ${qn} perguntas (esperado 6-9)`);
      const r=await L.solveMastery(page,lines);
      if(!/concluída/.test(r.big)) res.probs.push(`situ ${i}: nao aprovou resolvendo certo: ${r.big}`);
      else res.done++;
      await page.evaluate(()=>{const c=document.getElementById('mastery');c.classList.remove('visible');document.getElementById('situBack').click();});
      await page.waitForTimeout(80);
    }
    // todas concluídas -> bônus destravado
    const st2=await L.trailBtns(page);
    res.bonus=st2[st2.length-1];
    res.trail=st2.filter(x=>x.includes('done')).length+'/'+st2.length+' done';
  }catch(e){res.probs.push('EXCECAO: '+e.message.slice(0,160));}
  if(errs.length) res.probs.push('JS: '+errs.join(' | ').slice(0,200));
  await page.context().close(); return res;
}
(async()=>{
 const b=await L.chromium.launch();
 const jobs=[]; for(const m of MARKERS) for(const o of [0,1,2]) jobs.push([m,o]);
 const results=[]; let k=0;
 async function worker(){ while(k<jobs.length){ const [m,o]=jobs[k++]; const r=await runOne(b,m,o); if(r) results.push(r);} }
 await Promise.all([worker(),worker(),worker(),worker()]);
 results.sort((a,c)=>(a.marker+a.opt).localeCompare(c.marker+c.opt));
 const seen={}; let bad=0;
 for(const r of results){
   const tag=`${r.marker}#${r.opt} -> ${r.variant}`;
   if(r.noContent){console.log('SEM CONTEÚDO (esperado p/ Brasil):',tag);continue;}
   seen[r.variant]=1;
   const line=`${r.probs.length?'FALHA':'OK   '} ${tag} | concluídas ${r.done}/${r.total} | bônus: "${r.bonus}" | ${r.trail}`;
   console.log(line); r.probs.forEach(p=>console.log('      - '+p)); if(r.probs.length) bad++;
 }
 console.log('\nVariantes testadas:',Object.keys(seen).length,Object.keys(seen).sort().join(', '),'| com falha:',bad);
 await b.close(); process.exit(bad?1:0);
})();
