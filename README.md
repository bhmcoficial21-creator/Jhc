# Prospecção para plaquinhas NFC de avaliação Google

Encontra automaticamente, via Google Places API (New), estabelecimentos com **poucas avaliações**
no Google (padrão: menos de 50) e organiza tudo numa planilha com botão de WhatsApp de mensagem
pronta. O objetivo é oferecer plaquinhas NFC que levam o cliente direto à página de avaliação.

> O número de avaliações serve só para achar oportunidades. Não diz nada sobre a qualidade do lugar.

Há duas versões:

- **Fase 1, planilha (`apps-script/`):** busca e organiza os leads, e você envia cada mensagem pelo botão de WhatsApp.
- **Fase 2, robô (`supabase/` + `web/`):** busca, manda a primeira mensagem, conversa com IA, envia o link de pagamento e marca a venda sozinho quando o pagamento cai. Tem painel web e pausas automáticas de segurança. Guia completo: **[docs/robo-whatsapp.md](docs/robo-whatsapp.md)**.

## O que o MVP faz

- Busca por **segmento × bairro** (ex.: `barbearia Rio Pequeno, São Paulo - SP`), com paginação.
- Mantém só `userRatingCount < limite`. Lugar sem avaliações conta como 0.
- Elimina duplicados pelo `place_id`, já que bairros vizinhos devolvem os mesmos lugares.
- Grava na aba **Leads**: nome, endereço, avaliações, nota, telefone, site e os links abaixo:
  - **WhatsApp** (`wa.me/55…?text=…`) quando o número parece celular (DDD + 9 dígitos começando com 9);
  - **Ligar** (`tel:`) quando é fixo;
  - **Maps**.
- Buscar de novo **atualiza** os dados do Google e **preserva** status, datas e observações.
- Status: `novo`, `contatado`, `respondeu`, `interessado`, `vendido`, `nao_contatar`.
  - Ao mudar o status, a data do último contato é preenchida automaticamente.
  - `vendido` gera o **link de avaliação** (`https://search.google.com/local/writereview?placeid=…`)
    para gravar na tag NFC ou virar QR code. Também guarda quantas avaliações o lugar tinha na
    venda, para comparar depois.
  - `nao_contatar` tira o lead da lista e guarda o `place_id` na aba **Nao contatar**. Esse lugar
    **nunca mais aparece** nas buscas.
- **Painel** (menu *Prospecção › Abrir painel*): barra lateral com quantos leads **chegaram**
  (foram encontrados pela busca) e quantos foram **convertidos** (marcados como `vendido`) nos últimos
  7 dias, 30 dias ou 12 semanas. Mostra também a variação em relação ao período anterior, um gráfico
  por dia ou semana, o funil por status, a taxa de conversão geral e os botões *Buscar leads*,
  *Atualizar painel* e *Ver leads*.
  O visual vem do cartão "Performance Analytics" do Uiverse.io (themrsami, MIT).
- Proteção de custo: limite de chamadas por execução e limite mensal (contador próprio).
- Limpeza: apaga o conteúdo vindo do Google das linhas sem atualização há mais de N dias e mantém
  só o `place_id` e os seus dados.

### O envio é sempre manual

O sistema **encontra e organiza**. **Quem envia a mensagem é você**, uma conversa por vez: toque em
"WhatsApp", revise o texto e envie. Não há disparo automático, por dois motivos:

- **Meta / WhatsApp:** mensagens de marketing sem opt-in podem levar ao bloqueio do número.
- **LGPD:** a prospecção B2B pode se apoiar no legítimo interesse (art. 7º, IX e art. 10), desde
  que haja transparência (dizer quem é e por que está escrevendo) e opção de sair. A mensagem
  padrão já diz como sair, e o status `nao_contatar` cumpre esse pedido.

## Instalação

### 1. Google Cloud

1. Crie um projeto em <https://console.cloud.google.com/> e associe uma **conta de faturamento**.
2. Ative a **Places API (New)** em *APIs e serviços › Biblioteca*.
3. Crie uma **chave de API** em *Credenciais*. Em *Restrições de API*, permita **só a Places API (New)**.
   Restrição por site (HTTP referrer) não funciona com Apps Script.
4. **Configure orçamento e alertas** (*Faturamento › Orçamentos e alertas*). Também vale limitar a
   cota diária da Places API em *Cotas*.

> **Custo (2026):** o field mask usa `userRatingCount`, `rating`, telefone e `websiteUri`. Esses
> campos ativam o SKU **Text Search Enterprise**: cerca de 1.000 chamadas grátis por mês, depois
> uns US$ 35 a cada 1.000. Cada página de resultados (até 20 lugares) é uma chamada. Exemplo:
> 4 bairros × 5 segmentos × 3 páginas = até 60 chamadas por busca completa. O limite mensal padrão
> da planilha é 900. Confira sempre os preços atuais.

### 2. Planilha + script

1. Crie uma planilha nova no Google Sheets.
2. Vá em *Extensões › Apps Script*.
3. Copie `apps-script/Code.gs` e `apps-script/Utils.gs` para dois arquivos de script com esses nomes,
   e `apps-script/Painel.html` para um arquivo **HTML** chamado `Painel`.
4. Em *Configurações do projeto*, marque "Mostrar arquivo de manifesto `appsscript.json`" e cole o
   conteúdo de `apps-script/appsscript.json`.
5. Salve e recarregue a planilha. Vai aparecer o menu **Prospecção**.

Se preferir, use o [clasp](https://github.com/google/clasp) (`clasp create --type sheets --rootDir apps-script`, depois `clasp push`).

### 3. Primeiro uso

1. **Prospecção › 1. Preparar planilha**: cria as abas `Config`, `Leads` e `Nao contatar`.
2. Na aba **Config**, ajuste bairros, segmentos e parâmetros, e **troque `[SEU NOME]`**.
3. **Prospecção › 2. Configurar chave da API**: a chave fica em `PropertiesService`, nunca na planilha
   nem no código.
4. **Prospecção › Buscar leads**.

### Parâmetros (aba Config)

| Parâmetro | Padrão |
|---|---|
| Cidade | São Paulo - SP |
| Limite de avaliações (menor que) | 50 |
| Máx. páginas por busca (20 resultados cada) | 3 |
| Máx. chamadas da API por execução | 60 |
| Limite mensal de chamadas da API | 900 |
| Seu nome | [SEU NOME] |
| Mensagem do WhatsApp | variáveis `{nome}`, `{avaliacoes}`, `{bairro}`, `{seu_nome}` |
| Dias para limpar dados do Google | 30 |

Se mudar a mensagem, use **Prospecção › Regerar links**.

## Termos do Google Maps Platform

- O `place_id` pode ser guardado sem restrição. Os outros conteúdos da API têm limites de cache.
  O script não pede coordenadas.
- A coluna `atualizado_em` mostra quando os dados foram obtidos. **Limpar dados antigos do Google**
  apaga nome, endereço, telefone etc. das linhas antigas e mantém o `place_id` e os seus dados. Para
  ver os dados de novo, selecione as linhas e use **Atualizar detalhes dos leads selecionados**
  (Place Details, uma chamada por linha).
- A aba Leads mostra a atribuição "Dados de estabelecimentos: Google Maps".
- **Revise os [termos atuais](https://cloud.google.com/maps-platform/terms/maps-service-terms/) antes de usar comercialmente.**

## Oriente seus clientes (políticas do Google)

Quem compra a plaquinha **não deve** oferecer brindes ou descontos em troca de avaliações, nem pedir
avaliação só a quem ficou satisfeito. As políticas do Google proíbem as duas coisas.

## Desenvolvimento

As funções puras ficam em `apps-script/Utils.gs` (planilha) e `supabase/functions/_shared/core.ts`
(robô) e são testadas com Node (22.18 ou mais novo, que roda TypeScript direto):

```bash
npm test
```

## Próximas fases

3. **Pós-venda:** QR code do link de avaliação para cada cliente e acompanhamento de avaliações
   antes e depois (`avaliacoes_na_venda` já é guardado).
