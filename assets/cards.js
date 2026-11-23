// Renderiza os cards (1080x1920 em cqw). Uso: renderCards(guia, el)
function esc(s){return String(s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]))}
function cardHTML(c,gid,idx,plano){
  switch(c.t){
  case "capa": return `<div class="card capa"><div class="kick">Alongamento Estático</div><h3>${esc(c.titulo)}</h3>${IMG_CAPA[c.titulo]?`<div class="foto"><img src="assets/img/${IMG_CAPA[c.titulo]}" alt=""></div>`:""}<p class="meta">${esc(c.tempo)} · ${esc(c.para)}</p></div>`;
  case "ex": return `<div class="card"><div class="kick">Movimento</div><h3>${esc(c.nome)}</h3>${c.medida?`<div class="big">${esc(c.medida)}</div>`:""}<div class="foto${IMG_LADO.includes(c.nome)?" lado":""}">${(IMG_EX[gid+"|"+c.nome]||IMG_EX[c.nome])?[].concat(IMG_EX[gid+"|"+c.nome]||IMG_EX[c.nome]).map(f=>`<img src="assets/img/${f}" alt="${esc(c.nome)}">`).join(""):`[${esc(c.foto)}]`}</div><p class="desc">${esc(c.desc)}</p><div class="rodape"><p class="resp">💨 ${esc(c.resp)}</p>${plano?"":concluir(gid,idx)}</div></div>`;
  case "erro": return `<div class="card seg"><div class="big">${c.n}</div><h3>${esc(c.titulo)}</h3></div>`;
  case "fecha-seg": return `<div class="card seg"><h3>Sinais de procurar um profissional</h3><p class="desc">Dor aguda, formigamento, perda de força ou dor após queda.</p></div>`;
  case "checklist": return `<div class="card"><div class="kick">Checklist de Bolso</div><h3>90 s de manhã · 90 s à noite</h3><p class="desc"><b>Manhã:</b></p><ol><li>Recolher o queixo</li><li>Gato-camelo sentado</li><li>Panturrilha</li></ol><p class="desc"><b>Noite:</b></p><ol><li>Joelhos ao peito</li><li>Respiração lenta</li><li>Alongar pescoço</li></ol><p class="peq">${esc(AVISO)}</p></div>`;
  }
}
/* Botão concluir (Uiverse: gagan-gv/unlucky-yak-4), com o estado guardado no aparelho */
function concluir(gid,idx){
  const k=gid+"|"+idx, on=window.AE&&AE.feito(k);
  return `<label class="container conc"><input type="checkbox" data-k="${k}"${on?" checked":""}><div class="checkmark"></div><span>Concluir</span></label>`;
}
/* Cartão que vira (Uiverse: ElSombrero2/tricky-robin-67): frente com o nome, verso com o exercício */
function virar(c,h,gid){
  const imgs=[].concat(IMG_EX[gid+"|"+c.nome]||IMG_EX[c.nome]||[]);
  const lado=IMG_LADO.includes(c.nome), mostra=lado?imgs:imgs.slice(0,1);
  const foto=mostra.length?`<div class="bimg${lado?" lado":""}">${mostra.map(f=>`<img src="assets/img/${f}" alt="${esc(c.nome)}">`).join("")}</div>`
    :`<svg viewBox="0 0 24 24" fill="none" stroke="#8fe3d6" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="4.5" r="2.2"/><path d="M12 7v7M5 5l7 3 7-3M12 14l-4 7M12 14l4 7"/></svg>`;
  return `<div class="flip" tabindex="0" role="button" aria-label="Virar o cartão: ${esc(c.nome)}"><div class="content"><div class="back"><div class="back-content">${foto}<span class="bk">Movimento</span><strong class="bn">${esc(c.nome)}</strong>${c.medida?`<span class="bm">${esc(c.medida)}</span>`:""}<span class="bd">Toque para ver o exercício ›</span></div></div><div class="front">${h}</div></div></div>`;
}
function renderCards(g, el){
  const plano = document.body.classList.contains("export");
  const cards = [...g.cards];
  if (g.cards[0].t !== "checklist") cards.push({t:"seg-fixo"},{t:"fim-fixo"});
  el.innerHTML = cards.map((c,i)=>{
    let h = c.t==="seg-fixo" ? `<div class="card seg mascote"><h3>Desconforto leve é normal.</h3><p class="desc">Dor aguda, formigamento ou perda de força: pare e procure um profissional.</p></div>`
          : c.t==="fim-fixo" ? `<div class="card fim"><h3 style="font-size:11cqw">Pronto.<br>Repita sempre que a fisgada voltar.</h3><p class="peq">${esc(AVISO)}</p></div>`
          : cardHTML(c,g.id,i+1,plano);
    h = h.replace(/<div class="card([^"]*)">/, `<div class="card$1" data-i="${i+1}"><span class="n">${i+1}/${cards.length}</span>`);
    return (c.t==="ex" && !plano) ? virar(c,h,g.id) : h;
  }).join("");
}
