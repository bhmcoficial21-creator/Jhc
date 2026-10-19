/* Imagens e lances PROVISÓRIOS, usados enquanto você não coloca os arquivos reais.
   Tudo em tons de cinza. Pode apagar este arquivo depois de subir suas fotos e vídeos
   (se apagar, remova também a linha <script> dele no index.html). */
window.JSDPlaceholders = (function () {
  function lum(hex) {
    const n = parseInt(hex.replace("#", ""), 16);
    return (0.2126 * (n >> 16) + 0.7152 * ((n >> 8) & 255) + 0.0722 * (n & 255)) / 255;
  }
  function grey(v) { const c = Math.round(60 + v * 170); return `rgb(${c},${c},${c})`; }

  /* Camisa ilustrativa. view: front | back | detail */
  function jersey(p, view) {
    const base = lum((p.colors[0] || { hex: "#888888" }).hex);
    const a = grey(Math.min(1, base + 0.12)), b = grey(Math.max(0, base - 0.1));
    const abbr = p.team.split(" ").map(w => w[0]).join("").slice(0, 3).toUpperCase();
    const vb = view === "detail" ? "150 80 300 300" : "0 0 600 720";
    const front = view !== "back";
    const body = p.type === "Shorts"
      ? `<path d="M150 200h300l30 330H320l-20-150-20 150H120z" fill="url(#g)"/><path d="M150 200h300" stroke="#fff" stroke-opacity=".5" stroke-width="8"/>`
      : `<path d="M205 120 120 150 40 290l70 40 40-60v370h300V270l40 60 70-40-80-140-85-30c-25 40-165 40-190 0z" fill="url(#g)" stroke="#fff" stroke-opacity=".25"/>
         <path d="${front ? "M205 120c25 50 165 50 190 0" : "M205 120c25 20 165 20 190 0"}" fill="none" stroke="#fff" stroke-opacity=".7" stroke-width="7"/>`;
    const label = front && p.type !== "Shorts"
      ? `<text x="300" y="360" text-anchor="middle" font-family="Georgia,serif" font-style="italic" font-size="64" fill="#000" fill-opacity=".5">${abbr}</text>
         <text x="300" y="396" text-anchor="middle" font-family="Georgia,serif" font-size="15" letter-spacing="6" fill="#000" fill-opacity=".45">JSD</text>` : "";
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb}" width="600" height="720">
      <defs><linearGradient id="g" x1="0" x2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient>
      <radialGradient id="r" cx=".5" cy=".4" r=".85"><stop offset="0" stop-color="#2c2c2c"/><stop offset="1" stop-color="#0a0a0a"/></radialGradient></defs>
      <rect x="-50" y="-50" width="900" height="900" fill="url(#r)"/>${body}${label}</svg>`;
    return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
  }

  /* Lance provisório desenhado em canvas (3 variações). t em segundos, d duração. */
  function drawDribble(ctx, w, h, idx, t, d) {
    const p = Math.min(1, t / d);
    ctx.fillStyle = "#101010"; ctx.fillRect(0, 0, w, h);
    const g = ctx.createRadialGradient(w / 2, h * 0.4, 5, w / 2, h * 0.5, w);
    g.addColorStop(0, "#3a3a3a"); g.addColorStop(1, "#0b0b0b");
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = "rgba(255,255,255,.12)"; ctx.lineWidth = 2;
    ctx.strokeRect(w * 0.08, h * 0.08, w * 0.84, h * 0.84);
    ctx.beginPath(); ctx.arc(w / 2, h / 2, w * 0.18, 0, 7); ctx.stroke();
    const path = [
      q => ({ x: w * (0.14 + 0.72 * q), y: h * (0.5 + 0.22 * Math.sin(q * 14)) }),                      // zigue-zague
      q => ({ x: w * (0.5 + 0.3 * Math.cos(q * 9 - 1)), y: h * (0.5 + 0.3 * Math.sin(q * 9 - 1)) }),    // pedalada em círculo
      q => ({ x: w * (0.14 + 0.72 * q), y: h * (0.72 - 0.5 * Math.sin(q * Math.PI)) })                  // chapéu em arco
    ][idx % 3];
    ctx.lineCap = "round";
    for (let i = 0; i < 26; i++) {
      const q = Math.max(0, p - i * 0.012), a = path(q);
      ctx.fillStyle = `rgba(255,255,255,${0.5 - i * 0.02})`;
      ctx.beginPath(); ctx.arc(a.x, a.y, Math.max(2, w * 0.03 - i * 0.7), 0, 7); ctx.fill();
    }
    const b = path(p), r = w * 0.05;
    ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc(b.x, b.y, r, 0, 7); ctx.fill();
    ctx.fillStyle = "#000"; ctx.beginPath(); ctx.arc(b.x, b.y, r * 0.38, 0, 7); ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,.7)"; ctx.font = `${Math.max(9, w * 0.055)}px Inter, sans-serif`;
    ctx.textAlign = "center"; ctx.fillText("LANCE " + (idx % 3 + 1) + " · PROVISÓRIO", w / 2, h * 0.93);
  }

  /* Modelo 360° provisório (canvas): a = ângulo em radianos. */
  function drawSpin(ctx, w, h, a, tint) {
    ctx.fillStyle = "#0e0e0e"; ctx.fillRect(0, 0, w, h);
    const g = ctx.createRadialGradient(w / 2, h * 0.4, 10, w / 2, h * 0.5, w * 0.8);
    g.addColorStop(0, "#343434"); g.addColorStop(1, "#0a0a0a");
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    const c = Math.cos(a), s = Math.sin(a), k = w / 600, cx = w / 2;
    ctx.save(); ctx.translate(cx, h * 0.06); ctx.scale(k, k);
    const tw = 110 + 100 * Math.abs(c);                       // meia-largura do tronco
    const shade = 150 + 60 * c + 20 * s, col = `rgb(${shade * tint | 0},${shade * tint | 0},${shade * tint | 0})`;
    ctx.fillStyle = "#2b2b2b"; ctx.beginPath(); ctx.ellipse(0, 70, 52, 62, 0, 0, 7); ctx.fill(); // cabeça
    ctx.fillStyle = "#111"; ctx.beginPath(); ctx.ellipse(c > 0 ? 8 * s : -8 * s, 48, 58, 40, 0, Math.PI, 0); ctx.fill();
    ctx.fillStyle = col;
    ctx.beginPath(); ctx.moveTo(-tw * 0.55, 150); ctx.quadraticCurveTo(0, 125, tw * 0.55, 150);
    ctx.lineTo(tw, 190); ctx.lineTo(tw * 0.9, 560); ctx.lineTo(-tw * 0.9, 560); ctx.lineTo(-tw, 190); ctx.closePath(); ctx.fill();
    const sl = 70 * Math.abs(s) + 20;                         // mangas aparecem de lado
    ctx.fillStyle = `rgb(${(shade * 0.82) | 0},${(shade * 0.82) | 0},${(shade * 0.82) | 0})`;
    ctx.beginPath(); ctx.moveTo(-tw, 170); ctx.lineTo(-tw - sl, 290); ctx.lineTo(-tw + 10, 300); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(tw, 170); ctx.lineTo(tw + sl, 290); ctx.lineTo(tw - 10, 300); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,.7)"; ctx.lineWidth = 7; ctx.beginPath();
    ctx.moveTo(-tw * 0.4, 142); ctx.quadraticCurveTo(0, c > 0 ? 190 : 150, tw * 0.4, 142); ctx.stroke();
    ctx.restore();
    ctx.fillStyle = "rgba(255,255,255,.55)"; ctx.font = `${Math.max(10, w * 0.03)}px Inter, sans-serif`; ctx.textAlign = "center";
    ctx.fillText("MODELO PROVISÓRIO · ADICIONE AS FOTOS 360°", cx, h * 0.96);
  }

  return { jersey, drawDribble, drawSpin };
})();
