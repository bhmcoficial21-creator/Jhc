"""Gera 2 arquivos HTML independentes (sem zip, sem pasta assets) a partir de dist/:
  entrega/index.html  (área de membros)   entrega/guia.html  (guias)
Cada um leva CSS, JS e imagens embutidos. Rode antes: python3 -I scripts/empacotar.py
Uso: python3 -I scripts/arquivos-unicos.py"""
import base64, os, re, mimetypes

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
    t = ler("assets", nome)
    return t.replace('url("img/mascote.jpg")', 'url("%s")' % MASCOTE)

def js(nome):
    t = ler("assets", nome)
    # imagens montadas em tempo de execução passam a vir do mapa embutido
    t = re.sub(r"assets/img/\$\{([^}]+)\}", r"${__u(\1)}", t)
    t = t.replace("assets/simbolo.png", SIMBOLO)
    assert "</script" not in t.lower(), nome
    return t

def imagens_usadas(pagina):
    if pagina == "membros.html":
        return [f for f in os.listdir(os.path.join(DIST, "assets", "img")) if f.startswith("capa-")]
    mapa = ler("assets", "imagens.js")
    nomes = set(re.findall(r'"([a-z0-9_-]+\.(?:webp|png|jpg))"', mapa))
    return sorted(n for n in nomes if os.path.exists(os.path.join(DIST, "assets", "img", n)))

def construir(pagina, destino):
    h = ler(pagina)
    h = re.sub(r'<link rel="stylesheet" href="assets/([^"]+)">', lambda m: "<style>" + css(m.group(1)) + "</style>", h)
    h = re.sub(r'<script src="assets/([^"]+)"></script>', lambda m: "<script>" + js(m.group(1)) + "</script>", h)
    h = re.sub(r"assets/img/\$\{([^}]+)\}", r"${__u(\1)}", h)
    mapa = "{" + ",".join('"%s":"%s"' % (n, uri("assets", "img", n)) for n in imagens_usadas(pagina)) + "}"
    prelude = "<script>window.__IMGS=%s;window.__u=function(n){return (window.__IMGS&&window.__IMGS[n])||('assets/img/'+n)};</script>" % mapa
    h = h.replace("<head>", "<head>" + prelude, 1)
    h = h.replace("membros.html", "index.html")  # a área de membros passa a ser o index.html
    open(os.path.join(SAIDA, destino), "w", encoding="utf-8").write(h)
    return os.path.getsize(os.path.join(SAIDA, destino))

os.makedirs(SAIDA, exist_ok=True)
a = construir("membros.html", "index.html")
b = construir("guia.html", "guia.html")
print("index.html: %.2f MB | guia.html: %.2f MB" % (a / 1e6, b / 1e6))
