"""Converte as ilustrações dos exercícios para WebP leve (até 900 px).

Uso:  python3 tools/otimizar-imagens.py
Lê assets/img/exercicios/*.png e grava <mesmo-nome>.webp ao lado.
O painel usa o .webp. Os .png originais podem ficar fora do site publicado.
"""
from pathlib import Path
from PIL import Image

PASTA = Path(__file__).resolve().parent.parent / "assets" / "img" / "exercicios"
MAX = 900

for png in sorted(PASTA.glob("*.png")):
    destino = png.with_suffix(".webp")
    img = Image.open(png).convert("RGB")
    img.thumbnail((MAX, MAX))
    img.save(destino, "WEBP", quality=80, method=6)
    print(f"{png.name:32} {png.stat().st_size // 1024:5} KB -> {destino.name} {destino.stat().st_size // 1024:4} KB")
