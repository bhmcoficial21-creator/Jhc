"""Monta o pacote de entrega (pasta dist/ + entrega/alongamento-estatico.zip).
- copia só a área de membros (sem página de vendas, docs ou scripts)
- converte as imagens PNG em WebP (bem mais leves no celular)
- cria index.html (cópia de membros.html) para hospedagem
Uso: python3 -I scripts/empacotar.py"""
import os, re, shutil, zipfile
from PIL import Image

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DIST = os.path.join(RAIZ, "dist")
ENTREGA = os.path.join(RAIZ, "entrega")

def juntar(*p): return os.path.join(RAIZ, *p)

if os.path.isdir(DIST):
    shutil.rmtree(DIST)
os.makedirs(os.path.join(DIST, "assets", "img"))
os.makedirs(ENTREGA, exist_ok=True)

for f in ["membros.html", "guia.html"]:
    shutil.copy(juntar(f), os.path.join(DIST, f))
for f in ["style.css", "efeitos.css", "ui.css", "entrada.css", "capas.css",
          "guias.js", "imagens.js", "progresso.js", "agenda.js", "cards.js", "ui.js",
          "efeitos.js", "entrada.js", "logo-pontos.js", "carregando.js", "simbolo.png"]:
    shutil.copy(juntar("assets", f), os.path.join(DIST, "assets", f))

antes = depois = 0
for f in sorted(os.listdir(juntar("assets", "img"))):
    origem = juntar("assets", "img", f)
    antes += os.path.getsize(origem)
    if f.lower().endswith(".png"):
        im = Image.open(origem).convert("RGB")
        if im.width > 1000:
            im = im.resize((1000, round(im.height * 1000 / im.width)), Image.LANCZOS)
        destino = os.path.join(DIST, "assets", "img", f[:-4] + ".webp")
        im.save(destino, "WEBP", quality=80, method=6)
    else:
        destino = os.path.join(DIST, "assets", "img", f)
        shutil.copy(origem, destino)
    depois += os.path.getsize(destino)

# os nomes das imagens no mapa passam de .png para .webp
p = os.path.join(DIST, "assets", "imagens.js")
s = open(p, encoding="utf-8").read()
open(p, "w", encoding="utf-8").write(s.replace(".png", ".webp"))
shutil.copy(os.path.join(DIST, "membros.html"), os.path.join(DIST, "index.html"))

# confere que tudo que as páginas pedem existe
faltando = []
for h in ["membros.html", "guia.html", "index.html"]:
    t = open(os.path.join(DIST, h), encoding="utf-8").read()
    for ref in re.findall(r'(?:src|href)="(assets/[^"]+)"', t):
        if not os.path.exists(os.path.join(DIST, ref)): faltando.append((h, ref))
imgs_js = open(p, encoding="utf-8").read()
for ref in set(re.findall(r'"([a-z0-9_-]+\.(?:webp|png|jpg))"', imgs_js)):
    if not os.path.exists(os.path.join(DIST, "assets", "img", ref)): faltando.append(("imagens.js", ref))

zp = os.path.join(ENTREGA, "alongamento-estatico.zip")
with zipfile.ZipFile(zp, "w", zipfile.ZIP_DEFLATED) as z:
    for pasta, _, arqs in os.walk(DIST):
        for a in arqs:
            c = os.path.join(pasta, a)
            z.write(c, os.path.relpath(c, DIST))
print("imagens: %.1f MB -> %.1f MB" % (antes / 1e6, depois / 1e6))
print("zip: %.1f MB" % (os.path.getsize(zp) / 1e6), "| arquivos faltando:", faltando)
