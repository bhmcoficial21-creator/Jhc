-- Esquema sugerido para guardar o progresso no Supabase (seção 14.3 e 14.4).
-- Login por e-mail (link mágico) via Supabase Auth. Dados de saúde: coletar só o necessário (LGPD).

create table if not exists perfis (
  user_id uuid primary key references auth.users on delete cascade,
  nome text,
  regioes text[] not null default '{}',
  regiao_foco text not null,
  intensidade_inicial smallint check (intensidade_inicial between 0 and 10),
  trilha text not null,
  inicio_trabalho time default '09:00',
  fim_trabalho time default '18:00',
  intervalo_min smallint default 50,
  data_inicio date not null default current_date,
  criado_em timestamptz default now()
);

create table if not exists dias (
  user_id uuid references auth.users on delete cascade,
  dia smallint check (dia between 1 and 21),
  noite text check (noite in ('bem', 'mais_ou_menos', 'horrivel')),
  semaforo text check (semaforo in ('verde', 'amarelo', 'vermelho')),
  caotico boolean default false,
  pausas smallint default 0,
  pilar_movimento boolean default false,
  pilar_sono boolean default false,
  pilar_alimentacao boolean default false,
  tarefa boolean default false,
  revisao smallint,
  feito boolean default false,
  escala_dor smallint check (escala_dor between 0 and 10), -- só nos dias 1, 11 e 21
  atualizado_em timestamptz default now(),
  primary key (user_id, dia)
);

-- Preenchida pelo webhook da Cakto (compra aprovada)
create table if not exists compras (
  email text not null,
  produto text not null check (produto in ('principal', 'bump1', 'bump2', 'bump3', 'upsell', 'downsell')),
  pedido_cakto text,
  criado_em timestamptz default now(),
  primary key (email, produto)
);

alter table perfis enable row level security;
alter table dias enable row level security;
alter table compras enable row level security;

create policy "dono le e grava o perfil" on perfis for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "dono le e grava os dias" on dias for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "dono le as proprias compras" on compras for select using (email = auth.jwt() ->> 'email');
