// Conquistas só destravam com prova: clicar/ouvir não ganha nada; provinha de escuta com 80%+ ganha.
const L=require('./lib.js');
(async()=>{
 const b=await L.chromium.launch(); const out=[]; const ok=(c,m)=>{out.push((c?'OK   ':'FALHA ')+m); if(!c) process.exitCode=1;};
 const {page,errs}=await L.newPage(b,{tts:false});     // sem voz: a frase aparece escrita na provinha
 await L.onboard(page,'ESTADOS UNIDOS');
 const earned=()=>page.evaluate(()=>document.querySelectorAll('#badgeGrid .badge.earned').length);
 const label=()=>page.evaluate(()=>document.getElementById('badgeLabel').textContent);
 await L.tab(page,'tabSituacoes'); await L.openTrail(page,0); await page.waitForTimeout(200);
 const lines=await L.readLines(page);
 // spam de ouvir/devagar/gravar não destrava nada
 await page.evaluate(()=>{for(let i=0;i<15;i++)document.querySelectorAll('#situLines .sl-controls button').forEach(x=>{if(/Ouvir|Devagar/.test(x.textContent))x.click()});});
 await page.evaluate(()=>document.getElementById('situBack').click());
 await L.tab(page,'tabPerfil'); await page.waitForTimeout(200);
 ok(await earned()===0,'ouvir/devagar 15x não destrava conquista: '+await label());
 const guide=await page.evaluate(()=>document.getElementById('guideMsg').textContent);
 ok(/provinha|situa|Pedir|abra/i.test(guide),'representante indica caminho com prova: "'+guide.slice(0,90)+'"');
 // provinha com respostas ERRADAS: não passa
 const runQuiz=async(wrong)=>{
   await L.tab(page,'tabPraticar'); await page.evaluate(()=>document.getElementById('treinoStartBtn').click()); await page.waitForTimeout(250);
   for(let i=0;i<8;i++){
     const st=await page.evaluate(()=>({sum:document.getElementById('treinoSummary').style.display==='block',hint:(document.querySelector('#treinoHint .th-text')||{}).textContent||'',opts:[...document.querySelectorAll('#treinoOptions .treino-opt')].map(b=>b.children[1].textContent)}));
     if(st.sum) break;
     const line=lines.find(l=>l.txt===st.hint); const right=line&&line.pt;
     const pick=wrong? st.opts.find(o=>o!==right) : right;
     await page.evaluate(p=>{[...document.querySelectorAll('#treinoOptions .treino-opt')].find(b=>b.children[1].textContent===p).click()},pick);
     await page.evaluate(()=>document.getElementById('treinoNext').click()); await page.waitForTimeout(120);
   }
   const txt=await page.evaluate(()=>document.getElementById('treinoSummary').textContent);
   await page.evaluate(()=>document.getElementById('treinoBack').click()); await page.waitForTimeout(150);
   return txt;
 };
 let t1=await runQuiz(true);
 await L.tab(page,'tabPerfil'); await page.waitForTimeout(200);
 ok(!/aprovada/.test(t1)&&await earned()===0,'provinha errando tudo NÃO destrava: "'+t1.slice(0,60)+'"');
 let t2=await runQuiz(false);
 await L.tab(page,'tabPerfil'); await page.waitForTimeout(200);
 ok(/aprovada/.test(t2),'provinha acertando é aprovada: "'+t2.slice(0,60)+'"');
 ok(await earned()>=2,'provinha aprovada destrava conquistas (Ouvido treinado + Ouvido afiado): '+await label());
 ok(errs.length===0,'sem erros JS '+JSON.stringify(errs));
 console.log(out.join('\n')); await b.close();
})();
