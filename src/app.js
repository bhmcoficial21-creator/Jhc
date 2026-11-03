/* Brass Brew · cardápio digital
   Início: capa com os drinks, aba da marca que abre o painel de categorias, chamar garçom. */
(function () {
  'use strict';

  window.BB = window.BB || {};
  const $ = (id) => document.getElementById(id);
  const body = document.body;
  const tab = $('brandTab');
  const panel = $('panel');
  const panelList = $('panelList');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const ease = 'cubic-bezier(.76,0,.24,1)';

  /* ---------- Mesa (vem de ?mesa=) ---------- */
  const mesaParam = new URLSearchParams(location.search).get('mesa');
  const mesa = mesaParam && /^\d{1,3}$/.test(mesaParam) ? mesaParam.padStart(2, '0') : null;
  $('mesa').textContent = mesa || '—';
  document.querySelectorAll('.js-mesa').forEach((el) => { el.textContent = mesa || 'sua'; });

  /* ---------- Painel: nasce da aba e cobre a tela ---------- */
  panelList.innerHTML = BB.categorias.map((c, i) =>
    `<li><button class="panel__item" type="button" data-cat="${c.id}">${i === 0 ? '<i aria-hidden="true">·</i> ' : ''}${c.nome}${i === 0 ? ' <i aria-hidden="true">·</i>' : ''}</button></li>`).join('');

  function clipFromTab() {
    const r = tab.getBoundingClientRect();
    return `inset(${r.top}px ${innerWidth - r.right}px ${innerHeight - r.bottom}px ${r.left}px round 0 0 14px 14px)`;
  }
  const OPEN = 'inset(0px 0px 0px 0px round 0 0 0px 0px)';
  let isOpen = false;

  function openPanel({ intro = false } = {}) {
    isOpen = true;
    panel.classList.add('is-open');
    tab.setAttribute('aria-expanded', 'true');
    if (reduceMotion || intro) { panel.style.clipPath = OPEN; return Promise.resolve(); }
    const a = panel.animate([{ clipPath: clipFromTab() }, { clipPath: OPEN }], { duration: 620, easing: ease, fill: 'forwards' });
    panel.querySelectorAll('.panel__item, .panel__link').forEach((el, i) =>
      el.animate([{ transform: 'translateY(110%)', opacity: 0 }, { transform: 'none', opacity: 1 }],
        { duration: 520, delay: 260 + i * 55, easing: 'cubic-bezier(.16,1,.3,1)', fill: 'backwards' }));
    return a.finished.then(() => {
      panel.style.clipPath = OPEN; a.cancel();
      const first = panel.querySelector('.panel__item');
      if (first) first.focus({ preventScroll: true });
    });
  }
  function closePanel({ duration = 560 } = {}) {
    isOpen = false;
    tab.setAttribute('aria-expanded', 'false');
    const done = () => { panel.classList.remove('is-open'); panel.style.clipPath = ''; };
    if (reduceMotion) { done(); return Promise.resolve(); }
    const a = panel.animate([{ clipPath: OPEN }, { clipPath: clipFromTab() }], { duration, easing: ease, fill: 'forwards' });
    return a.finished.then(() => { done(); a.cancel(); });
  }

  tab.addEventListener('click', () => { if (!body.classList.contains('is-intro')) (isOpen ? closePanel() : openPanel()); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && isOpen) { closePanel(); tab.focus(); } });
  panel.addEventListener('click', (e) => {
    const item = e.target.closest('[data-cat]');
    if (item) { closePanel({ duration: 380 }).then(() => { location.hash = '#drinks-' + item.dataset.cat; }); return; }
    const act = e.target.closest('[data-act]');
    if (act) closePanel().then(() => (act.dataset.act === 'call' ? chamar() : pedirConta()));
  });

  /* ---------- Entrada ----------
     1. o painel da marca cobre a tela  2. recolhe para dentro da aba
     3. o título sobe linha a linha     4. os drinks entram quadro a quadro (stop motion) */
  function revealHero() {
    body.classList.remove('is-intro');
    if (reduceMotion) return;
    document.querySelectorAll('.hero__title .line > span').forEach((el, i) =>
      el.animate([{ transform: 'translateY(105%)' }, { transform: 'none' }],
        { duration: 760, delay: i * 110, easing: 'cubic-bezier(.16,1,.3,1)', fill: 'backwards' }));
    document.querySelectorAll('.hero__drinks .d').forEach((el, i) =>
      el.animate([
        { translate: '0 60%', rotate: '-6deg', opacity: 0 },
        { opacity: 1, offset: 0.3 },
        { translate: '0 -4%', rotate: '2deg', offset: 0.8 },
        { translate: '0 0', rotate: '0deg', opacity: 1 },
      ], { duration: 640, delay: 380 + i * 150, easing: 'steps(6, end)', fill: 'backwards' }));
    document.querySelectorAll('.hero__side, .actions').forEach((el, i) =>
      el.animate([{ opacity: 0, transform: 'translateY(10px)' }, { opacity: 1, transform: 'none' }],
        { duration: 500, delay: 700 + i * 80, easing: 'ease-out', fill: 'backwards' }));
  }

  function intro() {
    const direto = /^#drinks?-/.test(location.hash);
    if (direto || reduceMotion) { isOpen = false; panel.classList.remove('is-open', 'is-intro'); panel.style.clipPath = ''; revealHero(); return; }
    if (!reduceMotion) document.querySelectorAll('.panel__intro > *').forEach((el, i) =>
      el.animate([{ transform: 'translateY(40px)', opacity: 0 }, { transform: 'none', opacity: 1 }],
        { duration: 520, delay: i * 90, easing: 'cubic-bezier(.16,1,.3,1)', fill: 'backwards' }));
    setTimeout(() => {
      closePanel({ duration: 820 }).then(() => panel.classList.remove('is-intro'));
      setTimeout(revealHero, 160);
    }, 1150);
  }

  // Já começa coberto pelo painel da marca, antes mesmo da fonte carregar
  isOpen = true;
  panel.classList.add('is-open', 'is-intro');
  panel.style.clipPath = OPEN;
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  const fontsReady = document.fonts ? Promise.race([document.fonts.ready, wait(1200)]) : Promise.resolve();
  fontsReady.then(intro);

  /* ---------- Ações ---------- */
  const toastEl = $('toast');
  let toastTimer;
  function toast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.add('is-on');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove('is-on'), 2600);
  }
  BB.toast = toast;

  function chamar() {
    $('callRow').hidden = true;
    $('callSent').hidden = false;
    if (navigator.vibrate) navigator.vibrate(30);
  }
  function pedirConta() { toast('Conta solicitada. O garçom já traz para você.'); }

  $('btnCall').addEventListener('click', chamar);
  $('btnCancel').addEventListener('click', () => {
    $('callSent').hidden = true;
    $('callRow').hidden = false;
    toast('Chamado cancelado');
  });
  $('btnBill').addEventListener('click', pedirConta);
  $('btnDrinks').addEventListener('click', () => { location.hash = '#drinks-' + BB.categorias[0].id; });
})();
