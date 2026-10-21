-- VÁRZEA PRO — schema, funções de acesso e RLS
create extension if not exists pgcrypto;

-- ---------- Admin e configuração ----------
create table public.admins (email text primary key);
-- >>> Depois de aplicar: insert into public.admins values ('seu@email.com');

create table public.app_config (
  id int primary key default 1 check (id = 1),
  phase_number int not null default 1,
  phase_name text not null default 'PREÇO DE LANÇAMENTO',
  monthly_price numeric(8,2) not null default 18.90,
  annual_price numeric(8,2) not null default 189.00,
  monthly_url text not null default '',
  annual_url text not null default '',
  manage_url text not null default '',
  whatsapp text not null default '',
  show_launch_badge boolean not null default true,
  show_price_rise_notice boolean not null default true,
  updated_at timestamptz not null default now()
);
insert into public.app_config (id) values (1);

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.admins a where lower(a.email) = lower(coalesce(auth.jwt() ->> 'email', '')));
$$;

-- ---------- Assinaturas ----------
create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  email text not null unique,
  plan text not null check (plan in ('mensal','anual')),
  status text not null check (status in ('active','past_due','canceled','refunded')),
  period_end timestamptz,
  manual_override text check (manual_override in ('grant','revoke')),
  price_phase int not null default 1,        -- fase de preço em que o aluno assinou (preço mantido)
  provider text, provider_ref text,
  canceled_at timestamptz, started_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on public.subscriptions (user_id);

-- Regra única de acesso (espelhada em src/lib/access.ts e na Edge Function)
create or replace function public.sub_access(s public.subscriptions) returns boolean
language sql stable as $$
  select case
    when s.manual_override = 'revoke' then false
    when s.manual_override = 'grant' then true
    when s.status = 'refunded' then false
    when s.status = 'active' then s.period_end is null or s.period_end + interval '3 days' >= now()
    when s.status = 'canceled' then s.period_end is not null and s.period_end >= now()
    when s.status = 'past_due' then s.period_end is not null and s.period_end + interval '3 days' >= now()
    else false end;
$$;

create or replace function public.my_subscription() returns public.subscriptions
language sql stable security definer set search_path = public as $$
  select s.* from public.subscriptions s
  where s.user_id = auth.uid() or lower(s.email) = lower(coalesce(auth.jwt() ->> 'email',''))
  order by s.updated_at desc limit 1;
$$;

create or replace function public.has_access() returns boolean
language sql stable security definer set search_path = public as $$
  select public.is_admin() or coalesce((select public.sub_access(s) from public.my_subscription() s), false);
$$;

create or replace function public.is_annual() returns boolean
language sql stable security definer set search_path = public as $$
  select public.is_admin() or coalesce((select public.sub_access(s) and s.plan = 'anual' from public.my_subscription() s), false);
$$;

-- vincula assinatura comprada antes do cadastro
create or replace function public.link_subscription() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  update public.subscriptions set user_id = new.id where lower(email) = lower(new.email) and user_id is null;
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.link_subscription();

-- ---------- Perfil ----------
create table public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  position text check (position in ('goleiro','zagueiro','lateral','meia','atacante')),
  level text check (level in ('iniciante','intermediario','avancado')),
  days_per_week int check (days_per_week in (2,3,4)),
  locations text[] not null default '{}',
  field_type text check (field_type in ('sintetico','grama','terra')),
  home_space text check (home_space in ('2x2','3x3','mais')),
  equipment jsonb not null default '{}',     -- {casa:[], academia:[], campo:[]}
  health_pain boolean not null default false,
  health_areas text[] not null default '{}',
  caution boolean not null default false,    -- sem saltos até confirmar liberação
  pain_block boolean not null default false, -- dor no fim do treino: sem saltos até melhorar
  birth_year int, guardian_ok boolean not null default false,
  terms_accepted_at timestamptz, health_consent_at timestamptz,
  onboarded boolean not null default false,
  last_access_check timestamptz,
  created_at timestamptz not null default now()
);

-- ---------- Conteúdo (editável no admin) ----------
create table public.exercises (
  id text primary key,
  name text not null,
  category text not null,                    -- aquecimento|alongamento|pliometria|agilidade|jogo|prevencao|academia|campo|habilidade|posicao|movimento
  kind text not null default 'fisico' check (kind in ('fisico','habilidade')),
  objective text not null default '',
  steps text[] not null default '{}',
  mistakes text[] not null default '{}',
  min_level int not null default 1,          -- nível mínimo do aluno (1-4)
  locations text[] not null default '{casa}',
  equipment text[] not null default '{}',
  min_space text not null default '2x2',
  is_jump boolean not null default false,
  injury_risk boolean not null default false,
  beginner_error text,
  levels jsonb not null default '[]',        -- [{n:1,name,desc}]
  alternatives jsonb not null default '{}',  -- {casa:id, academia:id, campo:id}
  positions text[] not null default '{}',
  annual_only boolean not null default false,
  needs_supervision boolean not null default false,
  box_height_cm int,
  anim_url text, camera_angle text default 'lateral', xray_joint text,
  image_url text, video_url text, motion text,
  timed_secs int,                            -- alongamento/habilidade cronometrada
  circuit jsonb,                             -- mapa de cones
  routine jsonb,                             -- sequência [{ex,secs,rest}] (ex.: domínio de bola em 3 min)
  credit text,
  updated_at timestamptz not null default now()
);

create table public.programs (
  id text primary key,
  name text not null,
  description text not null default '',
  order_idx int not null default 1,
  release_month int not null default 0,      -- libera X meses após o início da assinatura
  annual_only boolean not null default false,
  published boolean not null default true,
  weeks jsonb not null default '[]',
  updated_at timestamptz not null default now()
);

create table public.lessons (
  id text primary key,
  order_idx int not null,
  title text not null,
  positions text[] not null default '{}',    -- vazio = todas
  minutes int not null default 3,
  summary text not null default '',
  situation text not null default '', error_text text not null default '', right_text text not null default '',
  board jsonb,
  published boolean not null default true,
  reviewed boolean not null default false,
  updated_at timestamptz not null default now()
);
create table public.quiz_questions (
  id text primary key,
  lesson_id text references public.lessons(id) on delete cascade,
  prompt text not null,
  board jsonb not null,
  answer jsonb not null,                     -- {x,y,r} em metros
  explanation text not null default ''
);
create table public.missions (
  id text primary key,
  title text not null, body text not null default '',
  positions text[] not null default '{}', lesson_id text references public.lessons(id) on delete set null
);
create table public.guide_pages (
  id text primary key,
  kind text not null check (kind in ('guia','planner','posjogo','preseason','aquecimento_jogo')),
  title text not null, order_idx int not null default 1,
  body text not null default '',
  steps jsonb not null default '[]'          -- [{ex:'id', secs:30, side:true}]
);
create table public.references_links (
  id uuid primary key default gen_random_uuid(),
  title text not null, url text not null, author text not null, note text not null default ''
);

-- ---------- Dados do aluno ----------
create table public.user_programs (
  user_id uuid not null references auth.users(id) on delete cascade,
  program_id text not null references public.programs(id) on delete cascade,
  started_at timestamptz not null default now(), completed_at timestamptz,
  primary key (user_id, program_id)
);
create table public.sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null default 'treino',
  program_id text, week int, workout_idx int,
  location text, effort int check (effort between 1 and 10),
  pain boolean not null default false, heavy boolean not null default false,
  duration_s int, completed_at timestamptz not null default now()
);
create index on public.sessions (user_id, completed_at desc);
create table public.exercise_progress (
  user_id uuid not null references auth.users(id) on delete cascade,
  exercise_id text not null,
  level int not null default 1, scores int[] not null default '{}', forced_level int,
  primary key (user_id, exercise_id)
);
create table public.tests (
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null check (kind in ('salto_horizontal','salto_vertical','agilidade')),
  phase int not null check (phase in (1,4,8)),
  value numeric not null, variant text,
  created_at timestamptz not null default now(),
  primary key (user_id, kind, phase)
);
create table public.season (
  user_id uuid primary key references auth.users(id) on delete cascade,
  mode text not null default 'custom' check (mode in ('custom','sabado','domingo')),
  game_dates date[] not null default '{}', final_date date
);
create table public.daily_checks (
  user_id uuid not null references auth.users(id) on delete cascade,
  day date not null, feel int check (feel between 1 and 5), pain boolean not null default false,
  primary key (user_id, day)
);
create table public.postgame (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  day date not null default current_date, feel int check (feel between 1 and 5),
  pain boolean not null default false, severe boolean not null default false
);
create table public.quiz_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  lesson_id text not null, correct int not null, total int not null,
  created_at timestamptz not null default now()
);
create table public.mission_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  mission_id text not null, day date not null default current_date,
  result text not null check (result in ('sim','mais_ou_menos','nao'))
);

-- ---------- RLS ----------
do $$ declare t text; begin
  foreach t in array array['admins','app_config','subscriptions','profiles','exercises','programs','lessons','quiz_questions','missions','guide_pages','references_links','user_programs','sessions','exercise_progress','tests','season','daily_checks','postgame','quiz_attempts','mission_logs']
  loop execute format('alter table public.%I enable row level security', t); end loop; end $$;

create policy admins_admin on public.admins for all using (public.is_admin()) with check (public.is_admin());
create policy cfg_read on public.app_config for select using (true);
create policy cfg_admin on public.app_config for all using (public.is_admin()) with check (public.is_admin());
create policy sub_self on public.subscriptions for select using (user_id = auth.uid() or public.is_admin());
create policy sub_admin on public.subscriptions for all using (public.is_admin()) with check (public.is_admin());

-- conteúdo: só com assinatura ativa; conteúdo exclusivo só no anual; escrita só admin
create policy ex_read on public.exercises for select using (public.is_admin() or (public.has_access() and (not annual_only or public.is_annual())));
create policy ex_admin on public.exercises for all using (public.is_admin()) with check (public.is_admin());
create policy pr_read on public.programs for select using (public.is_admin() or (public.has_access() and published and (not annual_only or public.is_annual())));
create policy pr_admin on public.programs for all using (public.is_admin()) with check (public.is_admin());
create policy ls_read on public.lessons for select using (public.is_admin() or (public.has_access() and published));
create policy ls_admin on public.lessons for all using (public.is_admin()) with check (public.is_admin());
create policy qz_read on public.quiz_questions for select using (public.has_access());
create policy qz_admin on public.quiz_questions for all using (public.is_admin()) with check (public.is_admin());
create policy ms_read on public.missions for select using (public.has_access());
create policy ms_admin on public.missions for all using (public.is_admin()) with check (public.is_admin());
create policy gp_read on public.guide_pages for select using (public.is_admin() or (public.has_access() and (kind = 'aquecimento_jogo' or public.is_annual())));
create policy gp_admin on public.guide_pages for all using (public.is_admin()) with check (public.is_admin());
create policy rf_read on public.references_links for select using (public.has_access());
create policy rf_admin on public.references_links for all using (public.is_admin()) with check (public.is_admin());

-- dados do aluno: cada um vê e grava só o seu (gravar exige assinatura ativa); admin lê tudo para métricas
do $$ declare t text; begin
  foreach t in array array['profiles','user_programs','sessions','exercise_progress','tests','season','daily_checks','postgame','quiz_attempts','mission_logs']
  loop
    execute format('create policy %I_own_read on public.%I for select using (user_id = auth.uid() or public.is_admin())', t, t);
    execute format('create policy %I_own_write on public.%I for all using (user_id = auth.uid() and public.has_access()) with check (user_id = auth.uid() and public.has_access())', t, t);
  end loop; end $$;
create policy prof_admin_write on public.profiles for update using (public.is_admin());
create policy xp_admin_write on public.exercise_progress for all using (public.is_admin()) with check (public.is_admin());
-- o perfil precisa ser gravável no onboarding mesmo antes de qualquer checagem fina:
create policy prof_self_insert on public.profiles for insert with check (user_id = auth.uid());
create policy prof_self_update on public.profiles for update using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ---------- Storage das animações GLB / imagens ----------
insert into storage.buckets (id, name, public) values ('animations','animations', true) on conflict do nothing;
create policy anim_read on storage.objects for select using (bucket_id = 'animations');
create policy anim_admin on storage.objects for all using (bucket_id = 'animations' and public.is_admin()) with check (bucket_id = 'animations' and public.is_admin());
