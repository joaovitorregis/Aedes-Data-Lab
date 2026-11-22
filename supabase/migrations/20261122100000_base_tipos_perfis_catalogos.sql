-- =====================================================================
-- Migration 1 de 7: base do backend do Aedes Data Lab
--
-- O que esta migration faz:
--   1. Cria o esquema "internal", onde ficam as funções de negócio.
--      Ele NÃO é exposto pela API pública: o navegador nunca chama essas
--      funções direto. Só as Edge Functions (com a chave de serviço) chamam.
--   2. Cria os tipos fixos (enums) usados nas tabelas.
--   3. Cria a tabela "profiles" (quem é agente) e a função is_agent().
--   4. Cria o catálogo de categorias (versionado, para preservar registros antigos).
--
-- Referências: docs/ARCHITECTURE.md (seção 6), docs/SECURITY.md (seções 2 e 4).
-- =====================================================================

-- Tabelas novas NÃO herdam acesso do visitante nem do usuário logado.
-- Cada migration libera de forma explícita o que cada perfil pode ver.
-- (SECURITY.md seção 4: "tabela nova sem política é tratada como erro")
alter default privileges in schema public revoke all on tables from anon, authenticated;
alter default privileges in schema public revoke all on sequences from anon, authenticated;
alter default privileges in schema public revoke all on functions from anon, authenticated;

-- Esquema das funções de negócio. Nada aqui é liberado para anon/authenticated.
create schema if not exists internal;
revoke all on schema internal from public, anon, authenticated;
grant usage on schema internal to service_role;

-- ---------------------------------------------------------------------
-- Tipos fixos (enums). Um enum só aceita os valores listados, então o
-- banco recusa qualquer valor inventado (ex.: etapa "qualquer_coisa").
-- ---------------------------------------------------------------------

-- Etapas da ocorrência (PRD): Recebida -> Em análise -> Atendida ou Encerrada.
create type public.report_stage as enum ('recebida', 'em_analise', 'atendida', 'encerrada');

-- Estado de publicação no mapa. É independente da etapa (ARCHITECTURE 7.1).
--   pendente  = gravada, mas a versão pública ainda não foi gerada
--   publicada = visível no mapa
--   arquivada = fora do mapa (lixeira de 30 dias, ADR-017)
create type public.publication_state as enum ('pendente', 'publicada', 'arquivada');

-- Quem criou a ocorrência. O mapa público mostra só "cidadão" ou "agente".
create type public.report_origin as enum ('cidadao', 'agente');

-- Resultado do acesso na visita (PRD 8.1).
create type public.visit_access as enum ('com_acesso', 'fechado', 'recusado', 'nao_localizado');

-- Onde está o foco (PRD 8.1).
create type public.focus_location as enum ('residencia', 'comercio', 'terreno_baldio', 'outro');

-- Larvas ou pupas na água (PRD 8.1).
create type public.larvae_answer as enum ('sim', 'nao', 'nao_sei');

-- Canal escolhido para confirmar o contato (D45). SMS e WhatsApp só ativam
-- se o custo for aceitável (DEP-03); o tipo já os prevê.
create type public.contact_channel as enum ('email', 'sms', 'whatsapp');

-- ---------------------------------------------------------------------
-- profiles: quem é agente autorizado.
-- O papel NUNCA vem de um dado que o usuário consiga editar (SECURITY.md 4).
-- Só a equipe do projeto mexe nesta tabela, direto no Supabase (D22).
-- ---------------------------------------------------------------------
create table public.profiles (
  -- Mesmo id do usuário no Supabase Auth. Se o usuário for apagado, o perfil vai junto.
  id uuid primary key references auth.users (id) on delete cascade,
  -- Só existe o papel "agente" na V1 (não há administrador, D22).
  role text not null default 'agente' check (role = 'agente'),
  -- Conta revogada = active false. Perde o acesso na próxima operação (RF-AUT-02).
  active boolean not null default true,
  -- Nome mostrado para a equipe na linha do tempo. NUNCA vai para o mapa público (D50).
  display_name text not null check (length(trim(display_name)) between 2 and 80),
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- O usuário logado pode ler só a PRÓPRIA linha (para a interface saber se é agente).
-- Ninguém escreve pelo navegador: não existe política de insert/update/delete.
create policy "agente le o proprio perfil"
  on public.profiles for select
  to authenticated
  using (id = (select auth.uid()));

grant select on public.profiles to authenticated;
grant all on public.profiles to service_role;

-- is_agent(): "este usuário é um agente ativo?"
--   security definer = roda com os direitos do dono da função, para conseguir
--   ler profiles mesmo dentro de uma política de RLS de outra tabela.
--   set search_path = '' = impede que alguém engane a função criando objetos
--   com o mesmo nome em outro esquema (boa prática do Supabase).
create or replace function internal.is_agent(p_user uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = p_user
      and p.active
      and p.role = 'agente'
  );
$$;

-- As políticas de RLS rodam como o usuário logado, então ele precisa poder
-- EXECUTAR is_agent() (e só ela) e ENXERGAR o esquema internal para chamá-la.
revoke all on function internal.is_agent(uuid) from public;
grant execute on function internal.is_agent(uuid) to authenticated, service_role;
grant usage on schema internal to authenticated;

-- ---------------------------------------------------------------------
-- categories: catálogo de categorias de foco.
-- Versionado de forma simples: uma categoria nunca é apagada, só desativada
-- (active = false). Assim denúncias antigas continuam apontando para ela.
-- ATENÇÃO: lista PROVISÓRIA. O catálogo oficial depende de DEP-01.
-- ---------------------------------------------------------------------
create table public.categories (
  id smallint generated always as identity primary key,
  -- Código estável, usado pelo site e pelas funções. O rótulo pode mudar.
  code text not null unique check (code ~ '^[a-z0-9_]+$'),
  label text not null,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.categories enable row level security;

create policy "leitura publica de categorias"
  on public.categories for select
  to anon, authenticated
  using (true);

grant select on public.categories to anon, authenticated;
grant all on public.categories to service_role;

insert into public.categories (code, label) values
  ('pneus',            'Pneus'),
  ('baldes_caixas',    'Baldes, bacias ou caixas-d''água'),
  ('vasos_pratos',     'Vasos de planta ou pratos de vaso'),
  ('piscinas',         'Piscinas'),
  ('lonas_coberturas', 'Lonas ou coberturas que acumulam água'),
  ('lixo_entulho',     'Lixo ou entulho'),
  ('pocas_alagados',   'Poças ou áreas alagadas'),
  ('outro',            'Outro recipiente ou estrutura');
