-- Replays 3D de treino com bola (conteúdo editável no admin; o roteiro completo fica em `data`)
create table public.replays (
  id text primary key,
  title text not null,
  category text not null check (category in ('drible','marcacao','desmarque','chute','conducao')),
  level int not null default 1,
  published boolean not null default true,
  data jsonb not null,
  updated_at timestamptz not null default now()
);
alter table public.replays enable row level security;
create policy rp_read on public.replays for select using (public.is_admin() or (public.has_access() and published));
create policy rp_admin on public.replays for all using (public.is_admin()) with check (public.is_admin());
