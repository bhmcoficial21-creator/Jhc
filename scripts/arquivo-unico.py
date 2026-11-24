"""Gera UM único HTML com a área de membros e os guias dentro: entrega/alongamento-estatico.html
O arquivo escolhe o que mostrar pelo endereço: sem "?g=" mostra a lista; com "?g=sos-lombar" mostra o guia.
Os links usam "?..." e por isso funcionam com qualquer nome de arquivo.
Rode antes: python3 -I scripts/empacotar.py     Uso: python3 -I scripts/arquivo-unico.py"""
import base64, json, mimetypes, os, re

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DIST = os.path.join(RAIZ, "dist")
SAIDA = os.path.join(RAIZ, "entrega")

def ler(*p): return open(os.path.join(DIST, *p), encoding="utf-8").read()
def uri(*p):
    c = os.path.join(DIST, *p)
    tipo = mimetypes.guess_type(c)[0] or ("image/webp" if c.endswith(".webp") else "application/octet-stream")
    return "data:%s;base64,%s" % (tipo, base64.b64encode(open(c, "rb").read()).decode())

SIMBOLO = uri("assets", "simbolo.png")
MASCOTE = uri("assets", "img", "mascote.jpg")

def css(nome):
    return ler("assets", nome).replace('url("img/mascote.jpg")', 'url("%s")' % MASCOTE)

def js(nome):
    t = ler("assets", nome)
    t = re.sub(r"assets/img/\$\{([^}]+)\}", r"${__u(\1)}", t)
    return t.replace("assets/simbolo.png", SIMBOLO)

def imagens_usadas(pagina):
    pasta = os.path.join(DIST, "assets", "img")
    if pagina == "membros.html":
        return [f for f in os.listdir(pasta) if f.startswith("capa-")]
    nomes = set(re.findall(r'"([a-z0-9_-]+\.(?:webp|png|jpg))"', ler("assets", "imagens.js")))
    return sorted(n for n in nomes if os.path.exists(os.path.join(pasta, n)))

def links(t):
    t = t.replace('a[href^="guia.html"],a[href^="membros.html"]', 'a[href^="?"]')
    t = t.replace('a[href="membros.html"]', 'a[href="?"]')
    t = t.replace("guia.html?", "?")
    t = t.replace("membros.html#", "?#")
    t = t.replace('"membros.html"', '"?"')
    return t

def pagina(nome):
    h = ler(nome)
    h = re.sub(r'<link rel="stylesheet" href="assets/([^"]+)">', lambda m: "<style>" + css(m.group(1)) + "</style>", h)
    h = re.sub(r'<script src="assets/([^"]+)"></script>', lambda m: "<script>" + js(m.group(1)) + "</script>", h)
    h = re.sub(r"assets/img/\$\{([^}]+)\}", r"${__u(\1)}", h)
    mapa = "{" + ",".join('"%s":"%s"' % (n, uri("assets", "img", n)) for n in imagens_usadas(nome)) + "}"
    h = h.replace("<head>", "<head><script>window.__IMGS=%s;window.__u=function(n){return (window.__IMGS&&window.__IMGS[n])||('assets/img/'+n)};</script>" % mapa, 1)
    h = links(h)
    assert "guia.html" not in h and "membros.html" not in h, nome
    return h

def literal(s):  # texto seguro para ficar dentro de <script>
    return json.dumps(s).replace("</", "<\\/")

membros, guia = pagina("membros.html"), pagina("guia.html")
saida = ('<!doctype html><html lang="pt-BR"><head><meta charset="utf-8">'
         '<meta name="viewport" content="width=device-width,initial-scale=1"><title>Alongamento Estático</title></head><body>'
         "<script>var M=" + literal(membros) + ",G=" + literal(guia) + ";"
         'var h=new URLSearchParams(location.search).get("g")?G:M;document.open();document.write(h);document.close();</script>'
         "</body></html>")
os.makedirs(SAIDA, exist_ok=True)
destino = os.path.join(SAIDA, "alongamento-estatico.html")
open(destino, "w", encoding="utf-8").write(saida)
print("alongamento-estatico.html: %.2f MB" % (os.path.getsize(destino) / 1e6))
