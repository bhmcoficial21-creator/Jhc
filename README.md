# Barbe Skin — site de agendamento

Site da barbearia **Barbe Skin**, com tabela de preços, catálogo de estilos (incluindo afro e brasileiros), barbeiros, horários e agendamento online.

## Páginas
- `index.html`: site público e agendamento em 4 passos (serviços → barbeiro → dia e hora → dados)
- `entrar.html`: login e cadastro do cliente (obrigatório para confirmar agendamento ou assinar plano)
- `agenda.html`: área do barbeiro (agenda do dia por barbeiro, status, faturamento, ficha técnica do cliente)

## Onde editar
- **Preços, serviços, barbeiros, horários, endereço, WhatsApp:** `js/data.js`
- **Planos de assinatura:** `PLANOS` em `js/data.js`
- **Fotos da capa:** `HERO_FOTOS` em `js/data.js` (arquivos em `img/`). Fotos dos cortes: campo `foto` em cada item de `ESTILOS`
- **Cores:** variáveis no topo de `css/style.css` (azul-marinho `--navy`, vermelho `--accent`, fundo `--bg`)

## Rodar localmente
```bash
python3 -m http.server 8000
# abra http://localhost:8000
```

## Status
Versão de demonstração: contas e agendamentos ficam salvos no navegador (localStorage). O próximo passo é ligar o Supabase para sincronizar a agenda entre clientes e barbeiros.

Pesquisa de mercado e guia de cortes: [`docs/pesquisa-barbearia.md`](docs/pesquisa-barbearia.md)
