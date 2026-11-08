/* Entrada do site:
   gradiente "prisma" animado (WebGL) → título sobe → o boneco caminha na direção da câmera
   → batida (clarão + título pulsa + pose) → o site abre por um círculo a partir do boneco. */
(function () {
  const el = document.getElementById("pageLoader");
  if (!el) return;
  const reduz = matchMedia("(prefers-reduced-motion: reduce)").matches;
  document.documentElement.classList.add("is-loading");
  let visto = false;
  try { visto = sessionStorage.getItem("ld-visto") === "1"; sessionStorage.setItem("ld-visto", "1"); } catch {}

  /* ---------- Gradiente prisma (shader) ---------- */
  const cv = document.getElementById("inGrad");
  let gl = null, rodando = true;
  try { gl = cv.getContext("webgl", { antialias: false, premultipliedAlpha: false }); } catch {}
  if (gl) {
    const vs = "attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}";
    const fs = `precision mediump float;
      uniform vec2 r; uniform float t;
      vec3 pal(float x){ return .5+.5*cos(6.2831*(x+vec3(.0,.33,.67))); }
      void main(){
        vec2 uv = gl_FragCoord.xy / r; vec2 p = (gl_FragCoord.xy - .5*r) / min(r.x, r.y);
        float a = t*.12;
        for (int i = 1; i < 5; i++) {
          float fi = float(i);
          p += vec2(.6/fi*sin(fi*p.y*1.6 + a*1.7 + .3*fi), .45/fi*cos(fi*p.x*1.4 - a*1.3));
        }
        vec3 c = pal(p.x*.32 + p.y*.18 + a*.35);
        c = mix(c, vec3(.06,.02,.16), .35);
        float v = smoothstep(1.25, .2, length((uv-.5)*vec2(1.,1.2)));
        c *= .35 + .75*v;
        c = pow(c, vec3(1.15));
        gl_FragColor = vec4(c, 1.);
      }`;
    const sh = (tp, src) => { const s = gl.createShader(tp); gl.shaderSource(s, src); gl.compileShader(s); return s; };
    const pr = gl.createProgram();
    gl.attachShader(pr, sh(gl.VERTEX_SHADER, vs)); gl.attachShader(pr, sh(gl.FRAGMENT_SHADER, fs)); gl.linkProgram(pr);
    if (gl.getProgramParameter(pr, gl.LINK_STATUS)) {
      gl.useProgram(pr);
      const b = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
      const loc = gl.getAttribLocation(pr, "p"); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
      const uR = gl.getUniformLocation(pr, "r"), uT = gl.getUniformLocation(pr, "t");
      const tam = () => { const d = Math.min(devicePixelRatio || 1, 1.5) * 0.6; cv.width = innerWidth * d; cv.height = innerHeight * d; gl.viewport(0, 0, cv.width, cv.height); };
      tam(); addEventListener("resize", tam);
      const t0 = performance.now();
      (function quadro(agora) {
        if (!rodando) return;
        gl.uniform2f(uR, cv.width, cv.height); gl.uniform1f(uT, reduz ? 0 : (agora - t0) / 1000);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        requestAnimationFrame(quadro);
      })(t0);
    } else gl = null;
  }
  if (!gl) cv.style.background = "radial-gradient(70% 60% at 30% 30%, #6d28d9, transparent), radial-gradient(60% 60% at 75% 70%, #ec4899, transparent), radial-gradient(60% 60% at 70% 20%, #2563eb, transparent), #0b0518";

  /* ---------- Linha do tempo ---------- */
  let carregado = document.readyState === "complete";
  if (!carregado) addEventListener("load", () => (carregado = true));
  setTimeout(() => (carregado = true), 7000);

  const curto = visto || reduz;
  const T = curto ? { walk: 0, hit: 150, out: 900 } : { walk: 450, hit: 3150, out: 4300 };
  const add = (c) => el.classList.add(c);
  requestAnimationFrame(() => add("is-on"));
  if (!curto) setTimeout(() => add("is-walk"), T.walk);
  else el.querySelector(".in-walker").style.cssText = "opacity:1;transform:none;filter:none";
  setTimeout(() => { el.classList.remove("is-walk"); add("is-hit"); if (navigator.vibrate) try { navigator.vibrate(18); } catch {} }, T.hit);

  let saiu = false;
  function sair() {
    if (saiu) return; saiu = true;
    add("is-out");
    document.documentElement.classList.remove("is-loading");
    dispatchEvent(new Event("barbeskin:pronto"));
    setTimeout(() => { rodando = false; el.remove(); }, 950);
  }
  const tentar = () => (carregado ? sair() : setTimeout(tentar, 120));
  setTimeout(tentar, T.out);   // sai no tempo certo, mas só depois de a página ter carregado
  document.getElementById("inSkip").addEventListener("click", sair);
})();
