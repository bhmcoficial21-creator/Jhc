# Robô do WhatsApp (Fase 2)

O robô faz a prospecção inteira sem você precisar estar presente:

1. **Busca** os comércios com menos de 50 avaliações (Places API), uma vez por semana.
2. **Dispara** a primeira mensagem com um modelo aprovado pela Meta, em horário comercial e com limite diário.
3. **Conversa** com quem responde (IA da Anthropic), tira dúvidas e, quando o cliente quer comprar, manda o **link de pagamento** (Pix ou cartão, Mercado Pago).
4. Quando o **pagamento é aprovado**, o lead vira **vendido sozinho**: guarda a data, as avaliações no dia da venda e gera o link de avaliação para gravar na plaquinha.
5. Quem pede para sair vira **não contatar** na hora e nunca mais recebe mensagem.

Você acompanha tudo no **painel web** (`web/index.html`), pode ler as conversas e assumir qualquer uma.

```
pg_cron ──► buscar-leads ──► Places API ──► tabela leads
pg_cron ──► disparar ──► WhatsApp (modelo) ──► cliente
cliente ──► whatsapp-webhook ──► IA (Claude) ──► resposta / link de pagamento
Mercado Pago ──► mercadopago-webhook ──► lead "vendido"
painel web ──► painel (API com token)
```

## Antes de ligar: o risco que você escolheu

A Meta exige **opt-in** (permissão) antes de mensagens de marketing. Mandar o modelo para números tirados do Google Maps **descumpre essa regra**. Se muita gente bloquear ou denunciar, a Meta baixa a nota de qualidade do número, reduz o limite de envios ou **bloqueia o número**. O robô tenta diminuir esse risco, mas não elimina:

| Proteção | Padrão |
|---|---|
| Robô começa **desligado** | liga pelo painel |
| Limite de primeiras mensagens por dia | 15 |
| Mensagens por rodada (a cada 20 min) | 3, com 3 a 7 s entre elas |
| Horário / dias | 9h às 18h, segunda a sábado |
| Uma única mensagem por lead (e por número) | sempre |
| "Sair", "não quero", "pare"... → não contatar, sem passar pela IA | sempre |
| Botão "Não tenho interesse" no modelo | recomendado |
| Pausa automática: ≥ 10% de pedidos para sair em 7 dias (com 10+ envios) | sempre |
| Pausa automática: 2 bloqueios/recusas da Meta em 7 dias | sempre |
| Pausa automática: alerta de qualidade do número | sempre |

**Use um número só para isso**, não o seu número pessoal. Mudar os valores fica na tabela `config` do Supabase.

Pela LGPD, a mensagem precisa dizer quem você é, por que está escrevendo e como sair. O modelo abaixo já faz isso.

## Passo a passo

### 1. WhatsApp Cloud API (Meta)

1. Em <https://business.facebook.com>, crie (ou use) um **Business Manager** e verifique a empresa.
2. Em <https://developers.facebook.com>, crie um app do tipo **Business** e adicione o produto **WhatsApp**.
3. Adicione um **número novo** (que não esteja em uso no WhatsApp do celular) e anote o **Phone number ID**.
4. Gere um **token permanente** (usuário do sistema com permissão `whatsapp_business_messaging`).
5. Anote o **App Secret** (Configurações › Básico).
6. Crie o **modelo de mensagem** (categoria *Marketing*, idioma *Portuguese (BR)*). Sugestão:

   > Olá, {{1}}! Sou [SEU NOME], aqui da região do Rio Pequeno. Trabalho com plaquinhas NFC: o cliente encosta o celular e já abre a página de avaliação de vocês no Google. Posso te mostrar como funciona?
   >
   > Rodapé: *Não quer receber? Toque em "Não tenho interesse".*
   >
   > Botões de resposta rápida: **Quero saber mais** · **Não tenho interesse**

   `{{1}}` recebe o nome do comércio. Espere a aprovação.

### 2. Mercado Pago

1. Em <https://www.mercadopago.com.br/developers>, crie uma aplicação (Checkout Pro).
2. Anote o **Access Token de produção**.
3. Em *Webhooks*, cadastre a URL `https://SEU-PROJETO.supabase.co/functions/v1/mercadopago-webhook`, evento **Pagamentos**, e anote a **assinatura secreta**.

### 3. Anthropic (IA)

Crie uma chave em <https://console.anthropic.com>. O robô usa o modelo `claude-opus-5-5`, com fallback automático no servidor se o modelo recusar alguma resposta.

### 4. Supabase

```bash
supabase link --project-ref SEU-PROJETO
supabase db push                       # cria as tabelas (migrations/)
supabase secrets set \
  ANTHROPIC_API_KEY=... \
  WHATSAPP_TOKEN=... WHATSAPP_PHONE_NUMBER_ID=... WHATSAPP_APP_SECRET=... \
  WHATSAPP_VERIFY_TOKEN=uma-frase-que-voce-inventa \
  WHATSAPP_TEMPLATE=nome_do_modelo WHATSAPP_TEMPLATE_LANG=pt_BR \
  WHATSAPP_TEMPLATE_PREVIEW="Olá, {nome}! Sou ..., aqui da região do Rio Pequeno..." \
  MP_ACCESS_TOKEN=... MP_WEBHOOK_SECRET=... \
  PLACES_API_KEY=... \
  CRON_SECRET=$(openssl rand -hex 24) PAINEL_TOKEN=$(openssl rand -hex 24) \
  PAINEL_ORIGEM=https://seu-painel.netlify.app
supabase functions deploy
```

Depois, ajuste a tabela **config** (Table Editor): em `produto`, preencha `preco` (ex.: `49.9`), `prazo_entrega` e `vendedor`. **Sem preço, o robô não gera link de pagamento e passa a conversa para você.**

### 5. Webhook do WhatsApp

No app da Meta, em WhatsApp › Configuração:

- URL de callback: `https://SEU-PROJETO.supabase.co/functions/v1/whatsapp-webhook`
- Token de verificação: o mesmo `WHATSAPP_VERIFY_TOKEN`
- Assine os campos **messages** e **phone_number_quality_update**

### 6. Agendamentos (pg_cron)

No SQL Editor do Supabase (troque `SEU-PROJETO` e o segredo):

```sql
create extension if not exists pg_cron;
create extension if not exists pg_net;
select vault.create_secret('COLE_O_CRON_SECRET', 'cron_secret');

-- Primeiras mensagens: a cada 20 minutos (a função confere horário e limites).
select cron.schedule('disparar-whatsapp', '*/20 * * * *', $$
  select net.http_post(
    url := 'https://SEU-PROJETO.supabase.co/functions/v1/disparar',
    headers := jsonb_build_object('Content-Type', 'application/json',
      'x-cron-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'cron_secret')),
    body := '{}'::jsonb, timeout_milliseconds := 60000);
$$);

-- Busca de leads: segunda-feira, 8h17 em São Paulo (11h17 UTC).
select cron.schedule('buscar-leads', '17 11 * * 1', $$
  select net.http_post(
    url := 'https://SEU-PROJETO.supabase.co/functions/v1/buscar-leads',
    headers := jsonb_build_object('Content-Type', 'application/json',
      'x-cron-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'cron_secret')),
    body := '{}'::jsonb, timeout_milliseconds := 120000);
$$);
```

### 7. Painel web

Publique a pasta `web/` (ex.: arrastando no Netlify). Abra, informe a URL do projeto e o `PAINEL_TOKEN`. Para ligar o robô, use a chave **Robô do WhatsApp**.

## Testar antes de ligar o disparo

1. Com o robô **desligado**, mande uma mensagem do seu celular para o número do robô: ele responde (é você quem iniciou a conversa).
2. Escreva "quero 2" e veja se o link de pagamento chega. Pague R$ 1 de teste (ou use as credenciais de teste do Mercado Pago) e confira o lead virar **vendido** no painel.
3. Escreva "sair" e veja o lead virar **não contatar**.
4. Só depois ligue o disparo, com limite baixo (ex.: 5 por dia) na primeira semana.

## Custos (confira os valores atuais)

- **WhatsApp:** cada modelo de marketing entregue é cobrado pela Meta (tabela por país). As respostas dentro da janela de 24 h depois da mensagem do cliente não são cobradas como marketing.
- **IA:** cada resposta do robô é uma chamada à API da Anthropic (centavos por conversa).
- **Places API:** igual à Fase 1 (cerca de 1.000 chamadas grátis por mês).
- **Mercado Pago:** taxa por venda.

## Dados e termos

- Tudo fica no Supabase, com RLS ligado e sem acesso público: só as funções (com a service role) leem e escrevem, e o painel passa pela função `painel`, que exige o token.
- O texto do Google (nome, telefone, endereço) tem limites de cache pelos termos da Google Maps Platform. Revise os termos e, se precisar, limpe os campos de leads antigos que nunca responderam.
- Oriente quem compra: **não** pode oferecer brinde ou desconto em troca de avaliação, nem pedir avaliação só para quem ficou satisfeito. O robô também explica isso.
