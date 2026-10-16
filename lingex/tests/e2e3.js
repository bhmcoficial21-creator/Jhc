const L=require('./lib.js');
(async()=>{
 const b=await L.chromium.launch(); const out=[]; const ok=(c,m)=>{out.push((c?'OK   ':'FALHA ')+m); if(!c) process.exitCode=1;};
 const openChat=async page=>{await page.evaluate(()=>document.getElementById('duvidaFab').click()); await page.waitForTimeout(300);};
 const ask=async(page,txt)=>{await page.fill('#duvidaInput',txt); await page.evaluate(()=>document.getElementById('duvidaSendBtn').click()); await page.waitForTimeout(500);
   return page.evaluate(()=>{const m=[...document.querySelectorAll('#duvidaMessages .duvida-msg')];return {last:m[m.length-1].textContent.replace(/\s+/g,' '),n:m.length,btnOk:!document.getElementById('duvidaSendBtn').disabled,listen:!!m[m.length-1].querySelector('button')}});};

 // ---- NEXUS ----
 const cases=[
  ['proxy ok',{proxy:{status:200,body:{text:'Você pode dizer "Could I have the check, please?" — natural.'}}},r=>/Could I have/.test(r.last)&&r.listen],
  ['405 (sem PHP / pré-visualização)',{},r=>/não foi encontrada aqui/.test(r.last)],
  ['sem chave',{proxy:{status:500,body:{error:'not_configured'}}},r=>/falta colocar a chave/.test(r.last)],
  ['chave recusada',{proxy:{status:401,body:{error:'anthropic_error',detail:'invalid x-api-key'}}},r=>/chave de IA do site foi recusada/.test(r.last)],
  ['modelo inexistente',{proxy:{status:404,body:{error:'anthropic_error',detail:'model: x not found'}}},r=>/modelo de IA/.test(r.last)],
  ['sem saldo',{proxy:{status:400,body:{error:'anthropic_error',detail:'credit balance is too low'}}},r=>/sem saldo/.test(r.last)],
  ['rota claude.ai (sample)',{claude:true,proxy:{status:405,body:'x',raw:true}},r=>/Resposta via claude.ai/.test(r.last)&&r.listen],
 ];
 for(const [name,opt,check] of cases){
  const {page,errs,posted}=await L.newPage(b,opt); await L.onboard(page,'ESTADOS UNIDOS'); await openChat(page);
  const r=await ask(page,'Bom dia quero um sorvete de baunilha meu mano');
  ok(check(r)&&r.btnOk&&errs.length===0,`Nexus [${name}] -> "${r.last.slice(0,95)}"`);
  if(name==='proxy ok'){ const body=JSON.parse(posted[0]); ok(body.messages.length===1&&/Nexus/.test(body.messages[0].content)&&/baunilha/.test(body.messages[0].content),'proxy recebeu contexto da Nexus + pergunta');
    const notes=await page.evaluate(()=>document.querySelectorAll('.duvida-msg.system-note').length);
    await page.evaluate(()=>document.getElementById('duvidaBack').click()); await openChat(page); await page.evaluate(()=>document.getElementById('duvidaBack').click()); await openChat(page);
    ok(await page.evaluate(()=>document.querySelectorAll('.duvida-msg.system-note').length)===1,'boas-vindas da Nexus aparece 1 vez só ao reabrir várias vezes');
    // segunda pergunta mantém histórico
    const r2=await ask(page,'e como digo sorvete?'); const body2=JSON.parse(posted[1]); ok(body2.messages.length===3,'2ª pergunta manda histórico (3 msgs): '+body2.messages.length);
    // chat dentro da tela (sem teclado)
    const geo=await page.evaluate(()=>{const c=document.getElementById('duvidaChat').getBoundingClientRect(),i=document.getElementById('duvidaInputRow').getBoundingClientRect();return {top:c.top,bottom:c.bottom,ih:innerHeight,inputBottom:i.bottom,sw:document.documentElement.scrollWidth,iw:innerWidth}});
    ok(geo.top===0&&Math.abs(geo.bottom-geo.ih)<1&&geo.inputBottom<=geo.ih+0.5&&geo.sw<=geo.iw,'chat ocupa a tela toda e a barra de digitar fica visível: '+JSON.stringify(geo));
  }
  await page.context().close();
 }

 // ---- MICROFONE ----
 { const {page,errs,posted}=await L.newPage(b,{proxy:{status:200,body:{text:'Diga "One vanilla ice cream, please."'}}});
   await page.addInitScript(()=>{const F=function(){window.__rec=this;this.start=()=>{window.__started=this.lang};this.stop=()=>{this.onend&&this.onend()}};Object.defineProperty(window,'webkitSpeechRecognition',{value:F,configurable:true});Object.defineProperty(window,'SpeechRecognition',{value:F,configurable:true});});
   await L.onboard(page,'ESTADOS UNIDOS'); await openChat(page);
   await page.evaluate(()=>document.getElementById('duvidaMicBtn').click());
   ok(await page.evaluate(()=>window.__started)==='pt-BR'&&await page.evaluate(()=>document.getElementById('duvidaMicBtn').classList.contains('listening')),'mic: começa a ouvir em pt-BR e botão fica vermelho');
   await page.evaluate(()=>{__rec.onresult({results:[[{transcript:'quero um sorvete'}]]});__rec.onresult({results:[[{transcript:'quero um sorvete de baunilha'}]]});});
   ok(await page.inputValue('#duvidaInput')==='quero um sorvete de baunilha','mic: texto transcrito aparece na caixa (sem enviar nada)');
   ok(posted.length===0,'mic: nada foi enviado ao servidor antes de tocar em ➤');
   await page.evaluate(()=>document.getElementById('duvidaSendBtn').click()); await page.waitForTimeout(400);
   ok(!(await page.evaluate(()=>document.getElementById('duvidaMicBtn').classList.contains('listening'))),'mic: para de ouvir ao enviar');
   const body=JSON.parse(posted[0]); ok(/sorvete de baunilha/.test(body.messages[0].content),'mic: o texto ditado foi o enviado');
   const btn=page.locator('#duvidaMessages button',{hasText:'Ouvir'}); await btn.first().click({force:true});
   ok((await page.evaluate(()=>window.__spoken)).includes('One vanilla ice cream, please.'),'🔊 fala a frase em inglês da resposta');
   ok(errs.length===0,'mic: sem erros de JS '+JSON.stringify(errs)); await page.context().close(); }

 // ---- USUÁRIO GRÁTIS: 4 grátis + paywall ----
 { const {page,errs}=await L.newPage(b); await L.onboard(page,'ESTADOS UNIDOS'); await L.tab(page,'tabSituacoes');
   for(let i=0;i<4;i++){ await L.openTrail(page,i); await page.waitForTimeout(100); const lines=await L.readLines(page); await L.listenAll(page);
     await page.evaluate(()=>document.getElementById('situCompleteBtn').click()); const r=await L.solveMastery(page,lines);
     if(!/concluída/.test(r.big)) ok(false,'grátis '+i+' não aprovou');
     await page.evaluate(()=>{document.getElementById('mastery').classList.remove('visible');document.getElementById('situBack').click();}); }
   const st=await L.trailBtns(page); ok(st.slice(0,4).every(x=>x.includes('done'))&&st[4].includes('premium'),'grátis: 4 concluídas e a 5ª é premium -> '+st.slice(0,6).join(' | '));
   await L.openTrail(page,4); await page.waitForTimeout(150);
   const pw=await page.evaluate(()=>({d:document.getElementById('situPaywall').style.display,t:document.getElementById('situPaywallTitle').textContent,s:document.getElementById('situPaywallSub').textContent,l:document.getElementById('situLines').style.display}));
   ok(pw.d==='block'&&pw.l==='none'&&/premium/i.test(pw.t)&&/Perfil/.test(pw.s)&&!/ainda não existe/.test(pw.s),'paywall da 5ª: "'+pw.s.slice(0,100)+'"');
   const bonus=st[st.length-1]; ok(bonus.includes('locked'),'bônus segue trancado: '+bonus);
   ok(errs.length===0,'grátis: sem erros JS'); await page.context().close(); }

 // ---- APARELHO SEM VOZ ----
 { const {page,errs}=await L.newPage(b,{tts:false}); await L.onboard(page,'JAPÃO'); await L.tab(page,'tabSituacoes');
   await L.openTrail(page,0); await page.waitForTimeout(100); const lines=await L.readLines(page);
   ok(/Fazer o teste/.test(await page.evaluate(()=>document.getElementById('situCompleteBtn').textContent)),'sem voz: não exige ouvir (botão já liberado)');
   await page.evaluate(()=>document.getElementById('situCompleteBtn').click()); await page.waitForTimeout(100);
   const kinds=await page.evaluate(()=>document.getElementById('masteryPrompt').textContent);
   const r=await L.solveMastery(page,lines); ok(/concluída/.test(r.big)&&errs.length===0,'sem voz (ja-JP): teste resolve por leitura -> '+r.big+' | primeira pergunta: '+kinds);
   await page.context().close(); }

 // ---- PROGRESSO ANTIGO RESTAURADO (salvo antes do teste existir) ----
 { const seed=JSON.stringify({v:1,variant:'en-US',objectives:['viajar'],level:'A1',completed:{cafe:true,aeroporto:true},viewed:{cafe:true,aeroporto:true},skillPoints:{}});
   const {page,errs}=await L.newPage(b,{seed}); await page.goto('https://lingex.test/'); await page.waitForTimeout(3200);
   const homeVisible=await page.evaluate(()=>document.getElementById('home').classList.contains('visible'));
   await L.tab(page,'tabSituacoes'); const st=await L.trailBtns(page);
   ok(homeVisible&&st[0].includes('done')&&st[1].includes('done')&&st[2].includes('next'),'progresso antigo restaurado: '+st.slice(0,4).join(' | ')+' (home='+homeVisible+')'); await page.context().close(); }

 console.log(out.join('\n')); await b.close();
})().catch(e=>{console.error('ERRO',e.stack||e.message);process.exit(1)});
