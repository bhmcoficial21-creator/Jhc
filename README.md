# JSD™ — Private • Vault Drop

Site de e-commerce (HTML + CSS + JS puro, sem build). Para ver: `python3 -m http.server 8000` e abra `http://localhost:8000`.
Funciona em qualquer hospedagem estática (Netlify, GitHub Pages, Vercel…).

## O que trocar (tudo em `js/config.js`)
| O quê | Onde |
|---|---|
| Logo | `brand.logo` (coloque o arquivo em `assets/`) |
| WhatsApp, frete grátis, desconto Pix | `contact`, `store` |
| Foto da abertura (9:16 e 16:9) | `hero.portrait.image` / `hero.landscape.image` |
| Contorno da janela nas costas | `hero.*.mask` (pontos x,y em %). Abra `?mask=1` na URL para ver o contorno |
| Vídeos dos lances | `hero.videos` — adicione ou remova itens à vontade |
| Tom da luz a cada lance | `hero.tones` |
| Fotos 360° | `assets/360/<id-do-produto>/01.jpg … 36.jpg` |
| Produtos, preços, tamanhos, cores | `products` |
| Medidas | `sizeChart` |
| Textos | `copy` |

Vídeos: coloque em `assets/video/` (`lance-1.mp4`, `lance-1-leve.mp4` para o celular, etc.). Recomendado: MP4 H.264, sem áudio, quadrado ou 4:5, 3–6 s; versão leve com ~480 px e menos de 1 MB.
Enquanto os arquivos não existem, o site mostra lances e imagens provisórias (`js/placeholders.js`).

## Estrutura
`index.html` · `css/base.css` (cores e fontes) · `css/store.css` (loja) · `css/hero.css` (abertura) · `js/config.js` · `js/app.js` (rotas, coleção, sacola) · `js/hero.js` (abertura) · `js/viewer360.js` · `assets/`
