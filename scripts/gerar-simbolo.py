"""Gera assets/simbolo.png (símbolo transparente, em teal) a partir de assets/logo.jpg.
Uso: python3 -I scripts/gerar-simbolo.py"""
from PIL import Image
im = Image.open("assets/logo.jpg").convert("L")
W, H = im.size
m = 12
px = im.load()
xs, ys = [], []
for y in range(m, H - m):
    for x in range(m, W - m):
        if px[x, y] < 200:
            xs.append(x); ys.append(y)
box = (min(xs), min(ys), max(xs) + 1, max(ys) + 1)
g = im.crop(box)
# alpha: escuro = opaco, claro = transparente
a = g.point(lambda v: 255 if v <= 110 else (0 if v >= 225 else int((225 - v) * 255 / 115)))
out = Image.new("RGBA", g.size, (47, 163, 152, 0))
out.putalpha(a)
out = out.resize((360, round(360 * g.size[1] / g.size[0])), Image.LANCZOS)
out.save("assets/simbolo.png", optimize=True)
print(out.size)
