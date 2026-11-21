// Renderiza os cards (1080x1920 em cqw). Uso: renderCards(guia, el)
function esc(s){return String(s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]))}
function cardHTML(c,gid){
  switch(c.t){
  case "capa": return `<div class="card capa"><div class="kick">Destrava · Alongamento estático</div><h3>${esc(c.titulo)}</h3>${IMG_CAPA[c.titulo]?`<div class="foto"><img src="assets/img/${IMG_CAPA[c.titulo]}" alt=""></div>`:""}<p class="meta">${esc(c.tempo)} · ${esc(c.para)}</p></div>`;
  case "ex": return `<div class="card"><div class="kick">Movimento</div><h3>${esc(c.nome)}</h3>${c.medida?`<div class="big">${esc(c.medida)}</div>`:""}<div class="foto${IMG_LADO.includes(c.nome)?" lado":""}">${(IMG_EX[gid+"|"+c.nome]||IMG_EX[c.nome])?[].concat(IMG_EX[gid+"|"+c.nome]||IMG_EX[c.nome]).map(f=>`<img src="assets/img/${f}" alt="${esc(c.nome)}">`).join(""):`[${esc(c.foto)}]`}</div><p class="desc">${esc(c.desc)}</p><p class="resp">💨 ${esc(c.resp)}</p></div>`;
  case "erro": return `<div class="card seg"><div class="big">${c.n}</div><h3>${esc(c.titulo)}</h3></div>`;
  case "fecha-seg": return `<div class="card seg"><h3>Sinais de procurar um profissional</h3><p class="desc">Dor aguda, formigamento, perda de força ou dor após queda.</p></div>`;
  case "checklist": return `<div class="card"><div class="kick">Checklist de Bolso</div><h3>90 s de manhã · 90 s à noite</h3><p class="desc"><b>Manhã:</b></p><ol><li>Recolher o queixo</li><li>Gato-camelo sentado</li><li>Panturrilha</li></ol><p class="desc"><b>Noite:</b></p><ol><li>Joelhos ao peito</li><li>Respiração lenta</li><li>Alongar pescoço</li></ol><p class="peq">${esc(AVISO)}</p></div>`;
  }
}
function renderCards(g, el){
  const cards = [...g.cards];
  if (g.cards[0].t !== "checklist") cards.push({t:"seg-fixo"},{t:"fim-fixo"});
  el.innerHTML = cards.map((c,i)=>{
    let h = c.t==="seg-fixo" ? `<div class="card seg"><h3>Desconforto leve é normal.</h3><p class="desc">Dor aguda, formigamento ou perda de força: pare e procure um profissional.</p></div>`
          : c.t==="fim-fixo" ? `<div class="card fim"><h3 style="font-size:11cqw">Pronto.<br>Repita sempre que a fisgada voltar.</h3><p class="peq">${esc(AVISO)}</p></div>`
          : cardHTML(c,g.id);
    return h.replace(/<div class="card([^"]*)">/, `<div class="card$1" data-i="${i+1}"><span class="n">${i+1}/${cards.length}</span>`);
  }).join("");
}
