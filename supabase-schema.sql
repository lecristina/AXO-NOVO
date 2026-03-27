-- =====================================================
-- Axolutions – Supabase Schema
-- Execute este SQL no SQL Editor do Supabase
-- =====================================================

-- Posts (Blog)
create table if not exists posts (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  excerpt     text default '',
  content     text default '',
  category    text default '',
  date        text default '',
  image       text default '',
  og_image    text default '',
  featured    boolean default false,
  created_at  timestamptz default now()
);

-- Projetos
create table if not exists projects (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  description text default '',
  category    text default '',
  techs       jsonb default '[]',
  image       text default '',
  cover       text default '',
  gif         text default '',
  link        text default '',
  client      text default '',
  date        text default '',
  status      text default 'published',
  content     text default '',
  gallery     jsonb default '[]',
  created_at  timestamptz default now()
);

-- Equipe
create table if not exists team (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  role        text default '',
  bio         text default '',
  image       text default '',
  banner      text default '',
  linkedin    text default '',
  github      text default '',
  instagram   text default '',
  created_at  timestamptz default now()
);

-- Depoimentos
create table if not exists testimonials (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  role        text default '',
  "text"      text default '',
  rating      integer default 5,
  image       text default '',
  created_at  timestamptz default now()
);

-- Configurações (linha única)
create table if not exists settings (
  id          uuid primary key default gen_random_uuid(),
  data        jsonb default '{}',
  updated_at  timestamptz default now()
);

-- Empresas do carrossel
create table if not exists companies (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  image       text default '',
  created_at  timestamptz default now()
);

-- =====================================================
-- Row Level Security – permite acesso anônimo total
-- (a proteção é feita pela senha do painel admin)
-- =====================================================
alter table posts       enable row level security;
alter table projects    enable row level security;
alter table team        enable row level security;
alter table testimonials enable row level security;
alter table settings    enable row level security;
alter table companies   enable row level security;

create policy "anon_all" on posts        for all to anon using (true) with check (true);
create policy "anon_all" on projects     for all to anon using (true) with check (true);
create policy "anon_all" on team         for all to anon using (true) with check (true);
create policy "anon_all" on testimonials for all to anon using (true) with check (true);
create policy "anon_all" on settings     for all to anon using (true) with check (true);
create policy "anon_all" on companies    for all to anon using (true) with check (true);

-- =====================================================
-- Migrations (run only if tables already exist)
-- =====================================================
alter table posts    add column if not exists featured  boolean default false;
alter table projects add column if not exists cover     text default '';
alter table projects add column if not exists gif       text default '';
alter table projects add column if not exists position  integer default 0;
alter table companies add column if not exists position integer default 0;

-- =====================================================
-- Storage – bucket "agent" (execute no SQL Editor)
-- =====================================================
-- 1. Criar bucket público (só precisa rodar uma vez)
insert into storage.buckets (id, name, public)
values ('agent', 'agent', true)
on conflict (id) do update set public = true;

-- 2. Permitir upload anônimo (admin usa anon key)
create policy "anon_upload" on storage.objects
  for insert to anon
  with check (bucket_id = 'agent');

-- 3. Permitir leitura pública
create policy "public_read" on storage.objects
  for select to anon
  using (bucket_id = 'agent');

-- 4. Permitir sobrescrever (upsert)
create policy "anon_update" on storage.objects
  for update to anon
  using (bucket_id = 'agent');

-- 5. Permitir deletar
create policy "anon_delete" on storage.objects
  for delete to anon
  using (bucket_id = 'agent');
