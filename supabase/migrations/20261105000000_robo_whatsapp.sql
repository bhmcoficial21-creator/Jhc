-- Robô de prospecção: leads, conversas, configuração e uso da Places API.
-- Todas as tabelas têm RLS ligado e NENHUMA política: só as Edge Functions
-- (com a service role key) leem e escrevem. O painel web passa pela função "painel".

create table if not exists public.leads (
  place_id            text primary key,              -- id do Google (pode ser guardado sem limite)
  nome                text not null default '',
  endereco            text,
  bairro_busca        text,
  categoria           text,
  avaliacoes          integer not null default 0,
  nota                numeric(2,1),
  telefone            text,
  whatsapp            text,                          -- 55 + DDD + número, só dígitos
  provavel_whatsapp   boolean not null default false,
  maps_url            text,
  site                text,
  status              text not null default 'novo'
                      check (status in ('novo','contatado','respondeu','interessado','vendido','nao_contatar')),
  robo_pausado        boolean not null default false, -- true = um humano assumiu a conversa
  observacoes         text,
  encontrado_em       timestamptz not null default now(),
  atualizado_em       timestamptz not null default now(),
  primeira_msg_em     timestamptz,                   -- quando o robô mandou o primeiro modelo
  data_ultimo_contato timestamptz,
  ultima_msg_cliente  timestamptz,                   -- abre a janela de 24 h para texto livre
  optout_em           timestamptz,
  pagamento_link      text,
  pagamento_ref       text,
  pagamento_id        text,
  data_venda          timestamptz,
  avaliacoes_na_venda integer,
  link_avaliacao      text
);

create index if not exists leads_status_idx on public.leads (status);
create index if not exists leads_whatsapp_idx on public.leads (whatsapp);
create index if not exists leads_disparo_idx on public.leads (status, provavel_whatsapp, encontrado_em)
  where status = 'novo';

create table if not exists public.mensagens (
  id             bigint generated always as identity primary key,
  place_id       text not null references public.leads (place_id) on delete cascade,
  direcao        text not null check (direcao in ('entrada','saida')),
  autor          text not null default 'robo' check (autor in ('cliente','robo','humano','sistema')),
  texto          text not null default '',
  wa_message_id  text unique,
  entrega        text,                               -- sent | delivered | read | failed
  erro           text,
  criado_em      timestamptz not null default now()
);
create index if not exists mensagens_lead_idx on public.mensagens (place_id, criado_em);

-- Configuração editável (uma linha por chave, valor em JSON).
create table if not exists public.config (
  chave  text primary key,
  valor  jsonb not null
);

insert into public.config (chave, valor) values
  ('robo_ativo',      'false'),                         -- começa DESLIGADO
  ('limite_diario',   '15'),
  ('lote_por_rodada', '3'),
  ('hora_inicio',     '9'),
  ('hora_fim',        '18'),
  ('dias_semana',     '[1,2,3,4,5,6]'),
  ('cidade',          '"São Paulo - SP"'),
  ('bairros',         '["Rio Pequeno","Jaguaré","Jardim Bonfiglioli","Vila São Francisco"]'),
  ('segmentos',       '["salão de beleza","barbearia","pizzaria","restaurante","loja"]'),
  ('limite_avaliacoes',        '50'),
  ('max_paginas_busca',        '3'),
  ('limite_mensal_places',     '900'),
  ('produto', '{"nome":"Plaquinha NFC de avaliação Google","preco":0,"descricao":"Plaquinha com NFC e QR code: o cliente encosta o celular e abre direto a página de avaliação da empresa no Google.","prazo_entrega":"","vendedor":"[SEU NOME]","regiao":"Rio Pequeno"}')
on conflict (chave) do nothing;

create table if not exists public.places_uso (
  mes        text primary key,                        -- AAAA-MM
  chamadas   integer not null default 0
);

-- Incremento atômico do contador da Places API.
create or replace function public.places_uso_incrementar(p_mes text)
returns integer language sql as $$
  insert into public.places_uso (mes, chamadas) values (p_mes, 1)
  on conflict (mes) do update set chamadas = public.places_uso.chamadas + 1
  returning chamadas;
$$;

-- Eventos de segurança (bloqueios, alertas de qualidade, pausas automáticas).
create table if not exists public.eventos (
  id         bigint generated always as identity primary key,
  tipo       text not null,
  detalhe    text,
  criado_em  timestamptz not null default now()
);

alter table public.leads      enable row level security;
alter table public.mensagens  enable row level security;
alter table public.config     enable row level security;
alter table public.places_uso enable row level security;
alter table public.eventos    enable row level security;

revoke execute on function public.places_uso_incrementar(text) from public, anon, authenticated;
