"""Converte assets/logo.jpg em pontos (assets/logo-pontos.js) para a animação de entrada.
Uso: python3 -I scripts/gerar-pontos.py"""
import json, random
from PIL import Image

random.seed(7)
im = Image.open("assets/logo.jpg").convert("L")
W, H = im.size
px = im.load()
LIMIAR = 200  # o símbolo é mais escuro que o fundo branco
ESPACO = 3.9 # distância entre pontos, em pixels da imagem original (menor = mais pontos)

# caixa do símbolo, ignorando a moldura clara da borda
margem = 12
xs, ys = [], []
for y in range(margem, H - margem):
    for x in range(margem, W - margem):
        if px[x, y] < LIMIAR:
            xs.append(x); ys.append(y)
x0, x1, y0, y1 = min(xs), max(xs), min(ys), max(ys)
bw, bh = x1 - x0 + 1, y1 - y0 + 1
escala = 1000 / max(bw, bh)

pts = []
y = y0
while y <= y1:
    x = x0
    while x <= x1:
        jx = x + random.uniform(-1.4, 1.4)
        jy = y + random.uniform(-1.4, 1.4)
        ix, iy = int(round(jx)), int(round(jy))
        if margem <= ix < W - margem and margem <= iy < H - margem and px[ix, iy] < LIMIAR:
            pts.append(round((jx - x0) * escala))
            pts.append(round((jy - y0) * escala))
        x += ESPACO
    y += ESPACO

saida = {"w": round(bw * escala), "h": round(bh * escala), "p": pts}
with open("assets/logo-pontos.js", "w") as f:
    f.write("// Gerado por scripts/gerar-pontos.py a partir de assets/logo.jpg\n")
    f.write("window.LOGO_PONTOS=" + json.dumps(saida, separators=(",", ":")) + ";\n")
print("caixa", bw, bh, "| pontos:", len(pts) // 2)
