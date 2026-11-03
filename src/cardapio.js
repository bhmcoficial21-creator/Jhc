/* Brass Brew · Doses e Drinks: grade colorida, lista simples, busca e reels.
   Rotas: #drinks/<categoria>  ·  #drink/<id> */
window.BB = window.BB || {};

(function () {
  'use strict';
  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const menu = $('menu');
  const tabs = $('menuTabs');
  const content = $('menuContent');
  const search = $('menuSearch');
  const reel = $('reel');
  const reelTrack = $('reelTrack');
  const home = $('home');

  const cat = (id) => BB.categorias.find((c) => c.id === id);
  const itensDe = (c) => BB.itens.filter((i) => i.categoria === c);
  let catAtual = 'exclusivos';
  let sacola = 0;

  /* ---------- Visual do drink: foto (quando houver) ou copo desenhado ---------- */
  function visual(item) {
    if (item.foto) return `<img class="vessel vessel--foto" src="${esc(item.foto)}" alt="${esc(item.nome)}" draggable="false">`;
    return BB.vessel.svg(item);
  }

  /* ---------- Abas ---------- */
  tabs.innerHTML = BB.categorias.map((c) =>
    `<button class="tab" type="button" role="tab" data-cat="${c.id}">${esc(c.nome)}</button>`).join('');
  tabs.addEventListener('click', (e) => {
    const b = e.target.closest('.tab');
    if (b) { search.value = ''; location.hash = '#drinks/' + b.dataset.cat; }
  });

  /* ---------- Grade (categorias com reels) e lista (doses, garrafas...) ---------- */
  function card(item) {
    const selo = item.selos[0] ? `<span class="card__badge">${esc(item.selos[0])}</span>` : '';
    return `<button class="card" type="button" data-id="${item.id}" style="--c:${item.cor}">
      <span class="card__name">${esc(item.nome)}</span>
      ${selo}
      <span class="card__visual">${visual(item)}</span>
      <span class="card__foot"><span class="card__price">${BB.preco(item.preco)}</span><span class="card__go" aria-hidden="true">→</span></span>
    </button>`;
  }
  function row(item) {
    const c = cat(item.categoria);
    const sub = [item.detalhe, search.value ? c.nome : null].filter(Boolean).join(' · ');
    return `<li class="row">
      <span class="row__text"><span class="row__name">${esc(item.nome)}</span>${sub ? `<span class="row__sub">${esc(sub)}</span>` : ''}</span>
      <span class="row__price">${BB.preco(item.preco)}</span>
      <button class="row__add" type="button" data-add="${item.id}" aria-label="Adicionar ${esc(item.nome)}">+</button>
    </li>`;
  }
  function renderList(itens) {
    const comReels = itens.filter((i) => cat(i.categoria).reels);
    const simples = itens.filter((i) => !cat(i.categoria).reels);
    let html = '';
    if (comReels.length) html += `<div class="grid">${comReels.map(card).join('')}</div>`;
    if (simples.length) html += `<ul class="rows">${simples.map(row).join('')}</ul>`;
    if (!html) html = `<p class="empty">Nada encontrado para “${esc(search.value)}”.</p>`;
    content.innerHTML = html;
    // pequena entrada em sequência dos cartões
    if (!reduceMotion) content.querySelectorAll('.card, .row').forEach((el, i) =>
      el.animate([{ opacity: 0, transform: 'translateY(16px)' }, { opacity: 1, transform: 'none' }],
        { duration: 420, delay: i * 45, easing: 'cubic-bezier(.16,1,.3,1)', fill: 'backwards' }));
  }
  function showCategory(id) {
    catAtual = cat(id) ? id : 'exclusivos';
    tabs.querySelectorAll('.tab').forEach((t) => t.setAttribute('aria-selected', t.dataset.cat === catAtual));
    const ativo = tabs.querySelector(`[data-cat="${catAtual}"]`);
    if (ativo) ativo.scrollIntoView({ inline: 'center', block: 'nearest', behavior: reduceMotion ? 'auto' : 'smooth' });
    renderList(itensDe(catAtual));
  }

  search.addEventListener('input', () => {
    const q = search.value.trim().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
    if (!q) return showCategory(catAtual);
    const norm = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
    renderList(BB.itens.filter((i) => norm(i.nome).includes(q) || (i.ingredientes || []).some((g) => norm(g).includes(q))));
  });

  content.addEventListener('click', (e) => {
    const add = e.target.closest('[data-add]');
    if (add) return adicionar(BB.itens.find((i) => i.id === add.dataset.add));
    const c = e.target.closest('.card');
    if (c) openDrink(c.dataset.id, c);
  });

  /* ---------- Reels ---------- */
  let slides = [];
  let observer;

  function slide(item, idx, total) {
    const c = cat(item.categoria);
    const meta = [c.nome, item.volume].filter(Boolean).join(' · ');
    const chips = (item.ingredientes || []).map((g) => {
      const cor = (BB.camadas[g.toLowerCase()] || {}).cor || item.cor;
      return `<li class="chip"><i style="background:${cor}"></i>${esc(g)}</li>`;
    }).join('');
    const aviso = BB.statusTexto[item.status.ingredientes];
    const nomeFaixa = `<span>${esc(item.nome)}</span><span class="o">${esc(item.nome)}</span>`.repeat(3);
    return `<article class="slide" data-id="${item.id}" style="--c:${item.cor}">
      <div class="slide__bg" aria-hidden="true">
        <div class="slide__run">${nomeFaixa}</div>
        <div class="slide__run slide__run--rev">${nomeFaixa}</div>
      </div>
      <div class="slide__stage">
        <div class="vessel-wrap" data-tilt>${visual(item)}</div>
        <p class="slide__hint">Arraste o copo · toque para encher de novo</p>
      </div>
      <div class="slide__info">
        <p class="slide__meta">${esc(meta)}${item.selos.length ? ` · <b>${esc(item.selos.join(' · '))}</b>` : ''}</p>
        <h2 class="slide__name">${esc(item.nome)}</h2>
        ${item.perfil ? `<p class="slide__perfil">${esc(item.perfil)}</p>` : ''}
        ${chips ? `<ul class="chips">${chips}</ul>` : ''}
        ${aviso ? `<p class="slide__status">${esc(aviso)}</p>` : ''}
        <div class="slide__buy">
          <span class="slide__price">${BB.preco(item.preco)}</span>
          <button class="btn-add" type="button" data-add="${item.id}">Adicionar</button>
        </div>
        ${idx < total - 1 ? '<p class="slide__next">Deslize para o próximo ↑</p>' : ''}
      </div>
    </article>`;
  }

  function buildReel(catId) {
    const itens = itensDe(catId);
    reelTrack.innerHTML = itens.map((it, i) => slide(it, i, itens.length)).join('');
    $('reelCat').textContent = cat(catId).nome;
    if (observer) observer.disconnect();
    slides = [...reelTrack.querySelectorAll('.slide')].map((el) => {
      const wrap = el.querySelector('[data-tilt]');
      const s = { el, wrap, tilt: BB.vessel.tilt(wrap), seen: false };
      wrap.addEventListener('click', () => {
        if (s.tilt.wasDrag()) return;
        const svg = wrap.querySelector('svg');
        if (svg) BB.vessel.fill(svg, { delay: 0 });
      });
      return s;
    });
    observer = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        const s = slides.find((x) => x.el === en.target);
        if (!s) return;
        if (en.isIntersecting) {
          s.tilt.start();
          const svg = s.wrap.querySelector('svg');
          if (svg) BB.vessel.fill(svg);
          if (!reduceMotion) s.wrap.animate([{ scale: 0.86, translate: '0 30px' }, { scale: 1.03, offset: 0.6 }, { scale: 1, translate: '0 0' }],
            { duration: 650, easing: 'cubic-bezier(.2,1.2,.4,1)' }); // "splash" leve ao entrar
          const idx = slides.indexOf(s);
          $('reelCount').textContent = `${idx + 1}/${slides.length}`;
          history.replaceState(null, '', '#drink/' + s.el.dataset.id);
        } else {
          s.tilt.stop();
        }
      });
    }, { root: reelTrack, threshold: 0.6 });
    slides.forEach((s) => observer.observe(s.el));
  }

  reelTrack.addEventListener('click', (e) => {
    const add = e.target.closest('[data-add]');
    if (add) adicionar(BB.itens.find((i) => i.id === add.dataset.add));
  });
  $('reelClose').addEventListener('click', () => { location.hash = '#drinks/' + catAtual; });
  $('menuBack').addEventListener('click', () => { location.hash = ''; });

  function adicionar(item) {
    if (!item) return;
    sacola++;
    document.querySelectorAll('.js-bag').forEach((b) => { b.textContent = sacola; b.hidden = false; });
    BB.toast(`${item.nome} adicionado · a sacola chega na próxima etapa`);
  }

  /* ---------- Rotas e troca de tela ---------- */
  let reelCat = null;

  function openDrink(id, fromCard) {
    const go = () => { location.hash = '#drink/' + id; };
    if (fromCard && document.startViewTransition && !reduceMotion) {
      const v = fromCard.querySelector('.card__visual');
      v.style.viewTransitionName = 'drink';
      const t = document.startViewTransition(() => { go(); route(); });
      t.finished.finally(() => { v.style.viewTransitionName = ''; });
    } else go();
  }

  function show(view) {
    home.hidden = view !== 'home';
    menu.hidden = view !== 'menu';
    reel.hidden = view !== 'reel';
    document.body.dataset.view = view;
    if (view !== 'reel') slides.forEach((s) => s.tilt.stop());
  }

  function route() {
    const h = location.hash.slice(1);
    const [tipo, valor] = h.split('/');
    if (tipo === 'drinks') {
      show('menu');
      if (!search.value) showCategory(valor);
      window.scrollTo(0, 0);
    } else if (tipo === 'drink') {
      const item = BB.itens.find((i) => i.id === valor);
      if (!item || !cat(item.categoria).reels) { location.hash = '#drinks/' + catAtual; return; }
      catAtual = item.categoria;
      show('reel');
      if (reelCat !== item.categoria || !reelTrack.children.length) { buildReel(item.categoria); reelCat = item.categoria; }
      const target = reelTrack.querySelector(`[data-id="${item.id}"]`);
      reelTrack.scrollTo({ top: target.offsetTop, behavior: 'instant' });
      const wrap = target.querySelector('.vessel-wrap');
      wrap.style.viewTransitionName = 'drink';
      setTimeout(() => { wrap.style.viewTransitionName = ''; }, 600);
    } else {
      show('home');
    }
  }

  window.addEventListener('hashchange', route);
  BB.route = route;
})();
