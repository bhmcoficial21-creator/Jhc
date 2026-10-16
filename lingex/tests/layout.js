const L=require('./lib.js');
const VPS={'320x568':[320,568],'375x667':[375,667],'390x844':[390,844],'430x932':[430,932]};
(async()=>{
 const b=await L.chromium.launch(); let bad=0;
 for(const [name,vp] of Object.entries(VPS)){
  const {page,errs}=await L.newPage(b,{vp,proxy:{status:200,body:{text:'Diga "Hello" assim.'}}});
  await L.onboard(page,'ESTADOS UNIDOS');
  const check=async(screen)=>{
    const r=await page.evaluate(()=>{
      const iw=innerWidth, ih=innerHeight; const probs=[];
      if(document.documentElement.scrollWidth>iw+1) probs.push('rolagem horizontal '+document.documentElement.scrollWidth+'>'+iw);
      // elementos visíveis cortados nas laterais
      const vis=[...document.querySelectorAll('button,p,span,h1,h2,input,textarea,svg text')].filter(e=>{const r=e.getBoundingClientRect(),cs=getComputedStyle(e);return r.width>0&&r.height>0&&cs.visibility!=='hidden'&&cs.opacity!=='0'&&e.offsetParent!==null||e.tagName==='text'});
      const clipped=vis.filter(e=>{const r=e.getBoundingClientRect();return r.right>iw+1||r.left<-1}).slice(0,4).map(e=>(e.className&&e.className.baseVal!==undefined?e.className.baseVal:e.className)+':'+(e.textContent||'').trim().slice(0,22));
      if(clipped.length) probs.push('cortado nas laterais: '+clipped.join(' | '));
      // alvos de toque pequenos (botões visíveis em tela, exceto tabs/marker-hit)
      const small=[...document.querySelectorAll('button')].filter(e=>{const r=e.getBoundingClientRect(),cs=getComputedStyle(e);return r.width>0&&r.height>0&&cs.visibility!=='hidden'&&e.offsetParent!==null&&!e.classList.contains('marker-hit')&&r.bottom>0&&r.top<ih&&(r.height<44||r.width<44)}).map(e=>e.textContent.trim().slice(0,20)+' '+Math.round(e.getBoundingClientRect().width)+'x'+Math.round(e.getBoundingClientRect().height));
      if(small.length) probs.push('alvos <44px: '+small.slice(0,5).join(', '));
      return probs;
    });
    if(r.length){bad++;console.log(`  [${name}] ${screen}: ${r.join(' ; ')}`);} 
  };
  await check('home/início');
  for(const [t,n] of [['tabMundo','seu mundo'],['tabSituacoes','situações'],['tabPraticar','praticar'],['tabPerfil','perfil']]){ await L.tab(page,t); await page.waitForTimeout(250); await check(n); }
  // radar: todos os textos dentro do viewBox
  await L.tab(page,'tabMundo'); await page.waitForTimeout(200);
  const radar=await page.evaluate(()=>{const s=document.getElementById('radarSvg'),vb=s.viewBox.baseVal;return [...s.querySelectorAll('text')].map(t=>{const b=t.getBBox();return {t:t.textContent,l:+(b.x-vb.x).toFixed(1),r:+((vb.x+vb.width)-(b.x+b.width)).toFixed(1)}}).filter(x=>x.l<0||x.r<0)});
  if(radar.length){bad++;console.log(`  [${name}] radar cortado:`,JSON.stringify(radar));}
  // situação + teste
  await L.tab(page,'tabSituacoes'); await L.openTrail(page,0); await page.waitForTimeout(200); await check('situação');
  const lines=await L.readLines(page); await L.listenAll(page);
  await page.evaluate(()=>document.getElementById('situCompleteBtn').click()); await page.waitForTimeout(200); await check('teste: pergunta');
  await page.screenshot({path:`/tmp/claude-0/jt/shots/t_${name}_q1.png`});
  // anda até a pergunta de ordenar e fotografa
  let shotOrder=false; for(let i=0;i<9&&!shotOrder;i++){
    const isOrder=await page.evaluate(()=>!!document.querySelector('#masteryArea .ord-answer'));
    if(isOrder){await check('teste: montar frase');await page.screenshot({path:`/tmp/claude-0/jt/shots/t_${name}_order.png`});shotOrder=true;break;}
    // responde certo e avança
    const info=await page.evaluate(()=>({prompt:document.getElementById('masteryPrompt').textContent,hint:[...document.querySelectorAll('#masteryHint .th-text')].map(e=>e.textContent)[0]||'',sp:window.__spoken.slice(-1)[0]||''}));
    let line,correct; if(/^Ouça/.test(info.prompt)){line=lines.find(l=>l.txt===info.sp);correct=line.pt;} else {line=lines.find(l=>l.pt===info.hint);correct=line&&line.txt;}
    await page.evaluate(v=>[...document.querySelectorAll('#masteryArea .treino-opt')].find(x=>x.dataset.value===v).click(),correct);
    if(i===0){await page.waitForTimeout(150);await check('teste: feedback');await page.screenshot({path:`/tmp/claude-0/jt/shots/t_${name}_fb.png`});}
    await page.evaluate(()=>document.getElementById('masteryNext').click());
  }
  // chat
  await page.evaluate(()=>{document.getElementById('mastery').classList.remove('visible');document.getElementById('situBack').click();});
  await page.evaluate(()=>document.getElementById('duvidaFab').click()); await page.waitForTimeout(500); await check('nexus');
  await page.fill('#duvidaInput','Como digo bom dia?'); await page.evaluate(()=>document.getElementById('duvidaSendBtn').click()); await page.waitForTimeout(400);
  await page.screenshot({path:`/tmp/claude-0/jt/shots/t_${name}_chat.png`});
  const geo=await page.evaluate(()=>{const i=document.getElementById('duvidaInputRow').getBoundingClientRect(),ta=document.getElementById('duvidaInput');return {inBottom:Math.round(i.bottom),ih:innerHeight,rows:Math.round(ta.getBoundingClientRect().height),ph:ta.placeholder}});
  if(geo.inBottom>geo.ih+1||geo.rows>60){bad++;console.log(`  [${name}] chat: barra fora da tela ou 2 linhas`,JSON.stringify(geo));}
  if(errs.length){bad++;console.log(`  [${name}] erros JS`,errs);}
  console.log(`${name}: auditoria concluída`);
  await page.context().close();
 }
 console.log('problemas de layout encontrados:',bad); await b.close();
})().catch(e=>{console.error('ERRO',e.stack||e.message);process.exit(1)});
