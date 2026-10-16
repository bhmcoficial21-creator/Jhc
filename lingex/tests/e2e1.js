const L=require('./lib.js');
(async()=>{
 const b=await L.chromium.launch(); const out=[]; const ok=(c,m)=>{out.push((c?'OK   ':'FALHA ')+m); if(!c) process.exitCode=1;};
 const {page,errs}=await L.newPage(b);
 await L.onboard(page,'ESTADOS UNIDOS'); await L.tab(page,'tabSituacoes'); await page.waitForTimeout(300);
 let st=await L.trailBtns(page);
 ok(st[0].includes('next')&&st[1].includes('blocked')&&st[2].includes('blocked'),'trilha: 1ª "next", demais bloqueadas -> '+st.slice(0,6).join(' | '));
 // situação 2 bloqueada por ordem
 await L.openTrail(page,1); await page.waitForTimeout(200);
 const blk=await page.evaluate(()=>({pw:document.getElementById('situPaywall').style.display,t:document.getElementById('situPaywallTitle').textContent,s:document.getElementById('situPaywallSub').textContent,lines:document.getElementById('situLines').style.display,btn:document.getElementById('situCompleteBtn').style.display}));
 ok(blk.pw==='block'&&blk.lines==='none'&&blk.btn==='none'&&/Passe no teste/.test(blk.t),'situação 2 trancada por ordem: "'+blk.t+'" / '+blk.s.slice(0,70));
 await page.evaluate(()=>document.getElementById('situBack').click());
 // situação 1: tenta concluir sem ouvir
 await L.openTrail(page,0); await page.waitForTimeout(200);
 const lines=await L.readLines(page);
 ok(lines.length===3,'situação 1 tem '+lines.length+' falas');
 let btn=await page.evaluate(()=>document.getElementById('situCompleteBtn').textContent);
 ok(/Ouça as falas.*0\/3/.test(btn),'botão antes de ouvir: '+btn);
 await page.evaluate(()=>document.getElementById('situCompleteBtn').click()); await page.waitForTimeout(200);
 ok(!(await page.evaluate(()=>document.getElementById('mastery').classList.contains('visible'))),'teste NÃO abre sem ouvir as falas');
 ok(/faltam 3/.test(await page.evaluate(()=>document.getElementById('toast').textContent)),'toast avisa que faltam 3');
 await L.listenAll(page); await page.waitForTimeout(200);
 btn=await page.evaluate(()=>document.getElementById('situCompleteBtn').textContent);
 ok(/Fazer o teste/.test(btn),'botão depois de ouvir: '+btn);
 // abre teste e FALHA de propósito (2 erros)
 await page.evaluate(()=>document.getElementById('situCompleteBtn').click()); await page.waitForTimeout(300);
 ok(await page.evaluate(()=>document.getElementById('mastery').classList.contains('visible')),'teste abriu');
 const nq=await page.evaluate(()=>document.getElementById('masteryProgress').textContent);
 let r=await L.solveMastery(page,lines,{wrongCount:2});
 ok(/Ainda não/.test(r.big),'2 erros -> reprovado: '+r.big+' | '+r.sub.slice(0,60));
 st=await L.trailBtns(page);
 ok(!st[0].includes('done')&&st[1].includes('blocked'),'situação 1 NÃO concluída e 2 continua trancada após reprovar');
 // tentar de novo e passar
 await page.evaluate(()=>[...document.querySelectorAll('#masterySummary .cta')][0].click()); await page.waitForTimeout(200);
 r=await L.solveMastery(page,lines,{wrongCount:1});
 ok(/concluída/.test(r.big),'1 erro (limite) -> aprovado: '+r.big+' | '+r.sub.slice(0,70));
 st=await L.trailBtns(page);
 ok(st[0].includes('done')&&st[1].includes('next'),'trilha após aprovar: '+st.slice(0,4).join(' | '));
 // próxima abre direto
 await page.evaluate(()=>[...document.querySelectorAll('#masterySummary .cta')][0].click()); await page.waitForTimeout(300);
 ok(await page.evaluate(()=>document.getElementById('situTitle').textContent.includes('No aeroporto')),'botão "Próxima" abriu No aeroporto');
 // persistência
 await page.reload(); await page.waitForTimeout(1500);
 await L.tab(page,'tabSituacoes'); st=await L.trailBtns(page);
 ok(st[0].includes('done')&&st[1].includes('next'),'após recarregar a página o progresso permanece: '+st.slice(0,3).join(' | '));
 ok(errs.length===0,'sem erros de JS: '+JSON.stringify(errs));
 console.log(out.join('\n')); await b.close();
})().catch(e=>{console.error('ERRO',e.message);process.exit(1)});
