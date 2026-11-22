-- =====================================================================
-- Simulação MÍNIMA do ambiente Supabase, só para rodar os testes num
-- Postgres puro (PGlite) sem Docker. NÃO é uma migration: nunca vai
-- para o banco real, onde tudo isto já existe.
-- =====================================================================

-- Papéis que o Supabase cria. "service_role" ignora o RLS (como na vida real).
create role anon nologin;
create role authenticated nologin;
create role service_role nologin bypassrls;

-- Esquema de autenticação com a tabela de usuários e a função auth.uid(),
-- que lê o usuário "logado" de uma configuração da sessão.
create schema auth;
create table auth.users (id uuid primary key default gen_random_uuid(), email text);
create function auth.uid() returns uuid
language sql stable as $$
  select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
$$;
grant usage on schema auth to anon, authenticated, service_role;
grant execute on function auth.uid() to anon, authenticated, service_role;
grant select on auth.users to service_role;

-- Esquema de arquivos (Storage) com as tabelas que as migrations usam.
create schema storage;
create table storage.buckets (
  id text primary key, name text not null, public boolean default false,
  file_size_limit bigint, allowed_mime_types text[]
);
create table storage.objects (
  id uuid primary key default gen_random_uuid(),
  bucket_id text references storage.buckets (id),
  name text
);
alter table storage.objects enable row level security;
grant usage on schema storage to anon, authenticated, service_role;
grant select on storage.objects to anon, authenticated;
grant all on storage.objects, storage.buckets to service_role;
