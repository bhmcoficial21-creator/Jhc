/* Brass Brew · cardápio digital
   Etapa 1: entrada (letreiro) e tela inicial. */
(function () {
  'use strict';

  const $ = (id) => document.getElementById(id);
  const body = document.body;
  const sign = $('sign');
  const screen = $('screen');
  const track = $('track');
  const bars = $('bars');
  const word = $('word');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Mesa (vem de ?mesa=) e saudação ---------- */
  const mesaParam = new URLSearchParams(location.search).get('mesa');
  const mesa = mesaParam && /^\d{1,3}$/.test(mesaParam) ? mesaParam.padStart(2, '0') : null;
  $('mesa').textContent = mesa || '—';
  document.querySelectorAll('.js-mesa').forEach((el) => { el.textContent = mesa || 'sua'; });

  const h = new Date().getHours();
  $('greeting').textContent = h >= 5 && h < 12 ? 'Bom dia' : h >= 12 && h < 18 ? 'Boa tarde' : 'Boa noite';

  document.querySelectorAll('.reveal').forEach((el, i) => el.style.setProperty('--i', i));

  /* ---------- Entrada ---------- */
  const running = [];
  let finished = false;

  const anim = (el, keyframes, options) => {
    if (finished) throw new Error('intro encerrada'); // interrompe a sequência (tratado no .catch)
    const a = el.animate(keyframes, { fill: 'forwards', ...options });
    running.push(a);
    return a.finished;
  };

  // Na entrada o letreiro fica no centro da tela; depois sobe para o lugar dele no início.
  function centerOffset() {
    const r = sign.getBoundingClientRect();
    return window.innerHeight / 2 - (r.top + r.height / 2);
  }
  function placeSignCentered() {
    sign.style.transform = ''; // mede sem o deslocamento anterior
    sign.style.transform = `translate3d(0, ${centerOffset()}px, 0) scale(1.04)`;
  }

  async function playIntro() {
    placeSignCentered();
    window.addEventListener('resize', onResizeIntro);

    const w = screen.clientWidth;
    track.innerHTML = '<span>Brass Brew</span>';
    const nameW = track.scrollWidth;

    // 1. O nome gigante atravessa o letreiro e vai apagando no fim
    const slide = anim(track, [
      { transform: `translate3d(${w * 0.95}px, -50%, 0)`, opacity: 1, offset: 0 },
      { opacity: 1, offset: 0.55 },
      { transform: `translate3d(${-(nameW - w * 0.4)}px, -50%, 0)`, opacity: 0.18, offset: 1 },
    ], { duration: 2300, easing: 'cubic-bezier(.3,.55,.35,1)' });

    // 2. As três barras aparecem no centro enquanto o nome sai
    await wait(1350);
    anim(bars, [{ opacity: 0 }, { opacity: 1 }], { duration: 200 });
    await slide;
    anim(track, [{ opacity: 0.18 }, { opacity: 0 }], { duration: 250 });

    // 3. Barras piscam em sequência, como um carregamento
    const barEls = bars.querySelectorAll('i');
    await Promise.all([...barEls].map((b, i) =>
      anim(b, [{ opacity: 1 }, { opacity: 0.15 }, { opacity: 1 }], { duration: 420, delay: i * 120, iterations: 2 })
    ));
    await anim(bars, [{ opacity: 1, transform: 'translate(-50%,-50%) scale(1)' }, { opacity: 0, transform: 'translate(-50%,-50%) scale(.6)' }], { duration: 180, easing: 'ease-in' });

    // 4. Palavra final entra com um "tranco" de letreiro
    await anim(word, [
      { opacity: 0, transform: 'scale(1.25)', filter: 'blur(6px)' },
      { opacity: 1, transform: 'scale(1)', filter: 'blur(0)' },
    ], { duration: 420, easing: 'cubic-bezier(.2,1.4,.4,1)' });
    await wait(650);
    await anim(word, [{ opacity: 1 }, { opacity: 0 }], { duration: 220 });

    finish();
  }

  function onResizeIntro() { if (!finished) placeSignCentered(); }

  // Estado final: letreiro com a faixa contínua do Brass, e o resto do início entra
  function finish() {
    if (finished) return;
    finished = true;
    window.removeEventListener('resize', onResizeIntro);
    running.forEach((a) => a.cancel());
    [bars, word].forEach((el) => { el.style.opacity = 0; });

    startLoop();

    const from = sign.style.transform;
    sign.style.transform = '';
    if (from && !reduceMotion) {
      sign.animate([{ transform: from }, { transform: 'none' }], { duration: 850, easing: 'cubic-bezier(.16,1,.3,1)' });
    }
    body.classList.remove('is-intro');
    body.classList.add('is-ready');
  }

  function startLoop() {
    if (reduceMotion) {
      track.classList.remove('is-loop');
      track.innerHTML = '<span>Brass Brew</span>';
      track.style.left = '50%';
      track.style.fontSize = '25cqh';
      track.style.transform = 'translate3d(-50%, -50%, 0)';
      track.style.opacity = 1;
      return;
    }
    const unit = '<span>Brass Brew</span><span class="star">✦</span><span>Doses &amp; Drinks</span><span class="star">✦</span>';
    track.classList.add('is-loop');
    track.innerHTML = unit;
    const unitW = track.scrollWidth;
    const copies = Math.ceil(screen.clientWidth / unitW) + 1;
    track.innerHTML = unit.repeat(copies + 1);
    track.style.setProperty('--loop-width', unitW + 'px');
    track.style.setProperty('--loop-duration', (unitW / 55).toFixed(1) + 's');
    track.style.opacity = 1;
    track.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 500 });
  }

  const wait = (ms) => new Promise((r) => setTimeout(r, ms));

  $('skip').addEventListener('click', finish);
  sign.addEventListener('click', () => { if (!finished) finish(); });

  // Centraliza já, antes da fonte carregar, para o letreiro não "pular" do topo
  if (!reduceMotion) placeSignCentered();

  const fontsReady = document.fonts ? Promise.race([document.fonts.ready, wait(1500)]) : Promise.resolve();
  // Quem abre direto num drink (link compartilhado) não vê a entrada
  const direto = /^#drinks?\//.test(location.hash);
  if (direto) finish();

  fontsReady.then(() => {
    if (reduceMotion || finished) finish();
    else playIntro().catch(finish); // animação cancelada pelo "Pular" cai aqui
  });

  /* ---------- Ações da tela inicial ---------- */
  const toastEl = $('toast');
  let toastTimer;
  window.BB = window.BB || {};
  BB.toast = toast;
  function toast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.add('is-on');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove('is-on'), 2600);
  }

  $('btnCall').addEventListener('click', () => {
    $('btnCall').hidden = true;
    $('callSent').hidden = false;
    if (navigator.vibrate) navigator.vibrate(30);
  });
  $('btnCancel').addEventListener('click', () => {
    $('callSent').hidden = true;
    $('btnCall').hidden = false;
    toast('Chamado cancelado');
  });
  $('btnBill').addEventListener('click', () => toast('Conta solicitada. O garçom já traz para você.'));
  $('btnDrinks').addEventListener('click', () => { location.hash = '#drinks/novos'; });
})();
