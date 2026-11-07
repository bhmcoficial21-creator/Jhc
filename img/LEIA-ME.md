# Pasta de fotos — Chefiinho das Grifes

Coloque aqui as fotos em **WebP, proporção 4:5**, mínimo 2000px no lado maior.
Enquanto o arquivo não existir, o site mostra um cenário provisório (concreto + arara ou vitrine LED) com "foto em breve".

## Nomes esperados pelo `loja.html`
| Arquivo | Onde aparece |
|---|---|
| `hero.webp` | Banner principal |
| `cat-tenis.webp`, `cat-camisetas.webp`, `cat-conjuntos.webp`, `cat-acessorios.webp` | Categorias da home |
| `look-1.webp` … `look-3.webp` | Looks prontos |
| `ig-1.webp` … `ig-6.webp` | Grade do Instagram |
| `<produto>-<cor>.webp` | Foto da cor (ex.: `am270-preto.webp`) |
| `<produto>-<cor>-modelo.webp` | Modelo IA vestindo → campo `modeloIA` |

Para mais fotos por cor, basta adicionar no array `fotos:[...]` da cor no `loja.html`.
