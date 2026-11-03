/* Brass Brew · copo desenhado por código
   - BB.vessel.svg(item)      → SVG do copo/garrafa com as camadas dos ingredientes
   - BB.vessel.fill(svgEl)    → enche camada por camada, estilo stop motion
   - BB.vessel.tilt(wrapEl)   → arrastar inclina em 3D, o líquido fica nivelado e balança */
window.BB = window.BB || {};

(function () {
  'use strict';
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let uidSeq = 0;

  /* Formas (viewBox 0 0 200 300). top/bottom = área que o líquido ocupa. */
  const SHAPES = {
    baixo: {
      inner: 'M44 108 L156 108 L151 262 Q150 272 140 272 L60 272 Q50 272 49 262 Z',
      extra: '<path d="M49 266 L151 266 L150 282 Q149 288 141 288 L59 288 Q51 288 50 282 Z" class="v-glass-solid"/>',
      top: 124, bottom: 272,
    },
    long: {
      inner: 'M62 30 L138 30 L134 272 Q134 280 126 280 L74 280 Q66 280 66 272 Z',
      extra: '<path d="M66 274 L134 274 L133 288 Q133 292 127 292 L73 292 Q67 292 67 288 Z" class="v-glass-solid"/>',
      top: 48, bottom: 280,
    },
    taca: {
      inner: 'M40 50 L160 50 Q164 148 100 172 Q36 148 40 50 Z',
      extra: '<rect x="96" y="170" width="8" height="96" rx="3" class="v-glass-solid"/><ellipse cx="100" cy="270" rx="46" ry="9" class="v-glass-solid"/>',
      top: 66, bottom: 172,
    },
    garrafa: {
      inner: 'M84 26 L116 26 L116 74 Q158 96 158 138 L158 268 Q158 282 144 282 L56 282 Q42 282 42 268 L42 138 Q42 96 84 74 Z',
      extra: '<rect x="80" y="8" width="40" height="24" rx="5" class="v-cap"/><rect x="80" y="26" width="40" height="5" class="v-cap-ring"/>',
      top: 104, bottom: 282,
    },
  };

  /* Pseudo-aleatório com semente, para o desenho ser sempre igual */
  function rng(seed) {
    let s = 0;
    for (const ch of seed) s = (s * 31 + ch.charCodeAt(0)) >>> 0;
    return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
  }

  function lighten(hex, amt) {
    const n = parseInt(hex.slice(1), 16);
    const f = (c) => Math.round(c + (255 - c) * amt);
    return `rgb(${f(n >> 16)},${f((n >> 8) & 255)},${f(n & 255)})`;
  }

  function pieces(tipo, cor, y, h, r) {
    const out = [];
    const count = { rodela: 7, casca: 6, cubo: 10, gelo: 7, folha: 9, nibs: 40, fatia: 7, espuma: 34 }[tipo] || 0;
    for (let i = 0; i < count; i++) {
      const x = 20 + r() * 160;
      const cy = y + 4 + r() * Math.max(4, h - 8);
      const rot = Math.round(r() * 360);
      switch (tipo) {
        case 'rodela': {
          const rr = 11 + r() * 5;
          out.push(`<g transform="translate(${x} ${cy}) rotate(${rot})"><circle r="${rr}" fill="${cor}"/><circle r="${rr * 0.72}" fill="${lighten(cor, 0.45)}"/><path d="M0 ${-rr * 0.7} V${rr * 0.7} M${-rr * 0.7} 0 H${rr * 0.7}" stroke="${cor}" stroke-width="1.5"/></g>`);
          break;
        }
        case 'casca':
          out.push(`<rect x="-18" y="-4" width="36" height="8" rx="4" fill="${cor}" transform="translate(${x} ${cy}) rotate(${rot})"/>`);
          break;
        case 'cubo':
          out.push(`<rect x="-8" y="-8" width="16" height="16" rx="2" fill="${cor}" stroke="${lighten(cor, 0.4)}" stroke-width="1.5" transform="translate(${x} ${cy}) rotate(${rot})"/>`);
          break;
        case 'gelo':
          out.push(`<rect x="-13" y="-13" width="26" height="26" rx="6" fill="rgba(235,248,252,.62)" stroke="rgba(255,255,255,.9)" stroke-width="1.5" transform="translate(${x} ${cy}) rotate(${rot})"/>`);
          break;
        case 'folha':
          out.push(`<g transform="translate(${x} ${cy}) rotate(${rot})"><ellipse rx="14" ry="6.5" fill="${cor}"/><path d="M-13 0 H13" stroke="${lighten(cor, 0.4)}" stroke-width="1.2"/></g>`);
          break;
        case 'nibs':
          out.push(`<circle cx="${x}" cy="${cy}" r="${2.4 + r() * 2.2}" fill="${cor}"/>`);
          break;
        case 'fatia':
          out.push(`<g transform="translate(${x} ${cy}) rotate(${rot})"><path d="M0 -14 L13 10 L-13 10 Z" fill="${cor}"/><path d="M-13 10 L13 10" stroke="#3f8a3a" stroke-width="4" stroke-linecap="round"/><circle cx="-2" cy="2" r="1.5" fill="#2a1a12"/><circle cx="3" cy="-3" r="1.5" fill="#2a1a12"/></g>`);
          break;
        case 'espuma':
          out.push(`<circle cx="${x}" cy="${cy}" r="${6 + r() * 6}" fill="${cor}" stroke="rgba(0,0,0,.05)"/>`);
          break;
      }
    }
    return out.join('');
  }

  function svg(item) {
    const shape = SHAPES[item.copo] || SHAPES.baixo;
    const id = 'v' + ++uidSeq;
    const r = rng(item.id);
    const head = (shape.bottom - shape.top) * 0.04;
    const top = shape.top + head;
    const total = shape.bottom - top;

    // Sem ingredientes confirmados: uma camada única, na cor do drink
    const lista = item.ingredientes && item.ingredientes.length
      ? item.ingredientes.map((n) => ({ nome: n, ...(BB.camadas[n.toLowerCase()] || { cor: item.cor, tipo: 'liquido' }) }))
      : [{ nome: item.nome, cor: item.cor, tipo: 'liquido' }];

    // Primeiro ingrediente no fundo. Pedaços ganham camada um pouco menor.
    const pesos = lista.map((l) => (l.tipo === 'liquido' ? 1.2 : 0.8));
    const soma = pesos.reduce((a, b) => a + b, 0);
    let y = shape.bottom;
    const layers = lista.map((l, i) => {
      const h = (pesos[i] / soma) * total;
      y -= h;
      const yy = y;
      const isLiquid = l.tipo === 'liquido';
      const bg = isLiquid ? l.cor : item.cor;
      return `<g class="v-layer" data-i="${i}">
        <rect x="-160" y="${yy.toFixed(1)}" width="520" height="${(h + 1.5).toFixed(1)}" fill="${bg}" ${isLiquid ? '' : 'opacity=".55"'}/>
        ${isLiquid ? `<rect x="-160" y="${yy.toFixed(1)}" width="520" height="2.5" fill="rgba(255,255,255,.28)"/>` : pieces(l.tipo, l.cor, yy, h, r)}
      </g>`;
    }).join('');

    return `<svg class="vessel" viewBox="0 0 200 300" role="img" aria-label="${item.nome}">
      <defs>
        <clipPath id="${id}-clip"><path d="${shape.inner}"/></clipPath>
        <linearGradient id="${id}-glass" x1="0" x2="1">
          <stop offset="0" stop-color="#fff" stop-opacity=".28"/><stop offset=".18" stop-color="#fff" stop-opacity=".06"/>
          <stop offset=".8" stop-color="#fff" stop-opacity=".03"/><stop offset="1" stop-color="#fff" stop-opacity=".22"/>
        </linearGradient>
      </defs>
      <ellipse cx="100" cy="294" rx="70" ry="5" fill="rgba(0,0,0,.28)"/>
      ${shape.extra}
      <path d="${shape.inner}" fill="rgba(255,255,255,.08)"/>
      <g clip-path="url(#${id}-clip)">
        <g class="v-liquid">${layers}</g>
        <path d="${shape.inner}" fill="url(#${id}-glass)"/>
        <rect x="52" y="0" width="9" height="300" fill="rgba(255,255,255,.22)" transform="skewX(-4)"/>
      </g>
      <path d="${shape.inner}" fill="none" stroke="rgba(255,255,255,.75)" stroke-width="3.5" stroke-linejoin="round"/>
    </svg>`;
  }

  /* Enche camada por camada: cada uma "cai" no lugar em passos (stop motion) */
  function fill(svgEl, { delay = 150 } = {}) {
    const layers = svgEl.querySelectorAll('.v-layer');
    layers.forEach((l) => l.getAnimations().forEach((a) => a.cancel()));
    if (reduceMotion) return;
    layers.forEach((l, i) => {
      l.animate([
        { transform: 'translateY(-170px)', opacity: 0 },
        { opacity: 1, offset: 0.25 },
        { transform: 'translateY(6px)', offset: 0.85 },
        { transform: 'translateY(0)', opacity: 1 },
      ], { duration: 520, delay: delay + i * 380, easing: 'steps(5, end)', fill: 'backwards' });
    });
  }

  /* Inclinação 3D com mola: o copo volta balançando e o líquido fica nivelado com atraso */
  function tilt(wrap) {
    const svgEl = wrap.querySelector('svg');
    const liquid = svgEl && svgEl.querySelector('.v-liquid');
    let a = 0, va = 0, l = 0, vl = 0, drag = null, raf = 0, active = false, t0 = performance.now();
    let moved = false;

    function frame(now) {
      const dt = 1 / 60;
      const idle = !drag && !reduceMotion ? Math.sin((now - t0) / 900) * 2.2 : 0;
      if (!drag) { va += (-(a - idle) * 90 - va * 9) * dt; a += va * dt; }
      vl += ((-a - l) * 60 - vl * 4.5) * dt; l += vl * dt;
      wrap.style.transform = `rotateY(${(a * 0.9).toFixed(2)}deg) rotateZ(${a.toFixed(2)}deg)`;
      if (liquid) liquid.setAttribute('transform', `rotate(${l.toFixed(2)} 100 160)`);
      if (active) raf = requestAnimationFrame(frame);
    }
    function start() { if (!active) { active = true; raf = requestAnimationFrame(frame); } }
    function stop() { active = false; cancelAnimationFrame(raf); }

    wrap.addEventListener('pointerdown', (e) => {
      drag = { x: e.clientX, a0: a }; moved = false;
      wrap.setPointerCapture(e.pointerId);
      start();
    });
    wrap.addEventListener('pointermove', (e) => {
      if (!drag) return;
      const dx = e.clientX - drag.x;
      if (Math.abs(dx) > 4) moved = true;
      const na = Math.max(-32, Math.min(32, drag.a0 + dx * 0.25));
      va = (na - a) * 60; a = na;
    });
    const end = () => { drag = null; };
    wrap.addEventListener('pointerup', end);
    wrap.addEventListener('pointercancel', end);

    return { start, stop, wasDrag: () => moved };
  }

  BB.vessel = { svg, fill, tilt };
})();
