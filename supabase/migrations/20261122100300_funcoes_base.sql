-- =====================================================================
-- Migration 4 de 7: funções utilitárias (esquema internal)
--
-- Todas rodam só com a chave de serviço (service_role), chamadas pelas
-- Edge Functions. Nenhuma é liberada para anon nem authenticated.
--
--   internal.grid_cell        célula da grade fixa de 200 m (D43, ADR-013)
--   internal.in_territory     o ponto está dentro de Itambé/PE?
--   internal.distance_m       distância entre dois pontos, em metros
--   internal.next_protocol    gera o protocolo
--   internal.hit_rate_limit   limite de repetição (RNF-08)
--   internal.start_verification / confirm_verification
--                              código de confirmação do contato (RF-AUT-01)
-- =====================================================================

-- ---------------------------------------------------------------------
-- Grade fixa de 200 m.
-- Como funciona: dividimos o mapa em quadrados de ~200 m. Cada ponto cai em
-- UM quadrado (ix, iy). O mapa público mostra o CENTRO do quadrado, então
-- o ponto exato nunca sai do banco privado.
--   1 grau de latitude  ~ 111.320 m
--   1 grau de longitude ~ 111.320 m * cos(latitude)
-- Usamos uma latitude de referência fixa (Itambé ~ -7,41) para a grade ser
-- sempre a MESMA, qualquer que seja o ponto ("grade fixa").
-- ---------------------------------------------------------------------
create or replace function internal.grid_cell(p_lat double precision, p_lng double precision)
returns table (ix integer, iy integer, center_lat double precision, center_lng double precision)
language sql
immutable
set search_path = ''
as $$
  with const as (
    select
      200.0 / 111320.0 as step_lat,
      200.0 / (111320.0 * cos(radians(-7.41))) as step_lng
  ),
  cell as (
    select
      floor(p_lng / step_lng)::integer as ix,
      floor(p_lat / step_lat)::integer as iy,
      step_lat, step_lng
    from const
  )
  select
    ix, iy,
    (iy + 0.5) * step_lat,
    (ix + 0.5) * step_lng
  from cell;
$$;

-- ---------------------------------------------------------------------
-- Território de Itambé/PE.
-- ATENÇÃO: é um retângulo PROVISÓRIO ao redor do município. O contorno real
-- depende de DEP-01 (ainda pendente). Quando o contorno chegar, só esta
-- função muda; o resto do sistema continua igual.
-- ---------------------------------------------------------------------
create or replace function internal.in_territory(p_lat double precision, p_lng double precision)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select p_lat between -7.56 and -7.26
     and p_lng between -35.25 and -34.95;
$$;

-- Distância entre dois pontos (fórmula de Haversine), em metros.
-- Usada para achar ocorrências num raio de 150 m (D34), sem precisar do PostGIS.
create or replace function internal.distance_m(
  lat1 double precision, lng1 double precision,
  lat2 double precision, lng2 double precision
) returns double precision
language sql
immutable
set search_path = ''
as $$
  select 2 * 6371000 * asin(sqrt(
    power(sin(radians(lat2 - lat1) / 2), 2)
    + cos(radians(lat1)) * cos(radians(lat2)) * power(sin(radians(lng2 - lng1) / 2), 2)
  ));
$$;

-- Protocolo: AED-ANO-NÚMERO (ex.: AED-2026-000123).
-- O número vem de uma sequência, então nunca repete.
create or replace function internal.next_protocol()
returns text
language sql
volatile
set search_path = ''
as $$
  select 'AED-' || to_char(now() at time zone 'America/Recife', 'YYYY') || '-'
         || lpad(nextval('public.report_protocol_seq')::text, 6, '0');
$$;

-- ---------------------------------------------------------------------
-- Limite de repetição (RNF-08).
-- Conta quantas vezes uma "chave" (ex.: e-mail + ação) foi usada na janela de
-- tempo atual. Devolve TRUE se ainda pode, FALSE se estourou o limite.
-- ---------------------------------------------------------------------
create or replace function internal.hit_rate_limit(
  p_key text, p_max integer, p_window_seconds integer
) returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_window timestamptz;
  v_hits integer;
begin
  -- Arredonda "agora" para o começo da janela (ex.: de 10 em 10 minutos).
  v_window := to_timestamp(floor(extract(epoch from now()) / p_window_seconds) * p_window_seconds);

  insert into public.rate_limits (key, window_start, hits)
  values (p_key, v_window, 1)
  on conflict (key, window_start) do update set hits = public.rate_limits.hits + 1
  returning hits into v_hits;

  -- Limpeza simples: apaga janelas com mais de um dia.
  delete from public.rate_limits where window_start < now() - interval '1 day';

  return v_hits <= p_max;
end;
$$;

-- ---------------------------------------------------------------------
-- Código de confirmação.
-- A Edge Function gera o código, manda ao contato e entrega aqui só o HASH.
-- ---------------------------------------------------------------------

-- Registra um novo código. Antes, invalida os anteriores da mesma tentativa
-- e confere o limite de pedidos/reenvios.
create or replace function internal.start_verification(
  p_purpose text, p_subject text, p_channel public.contact_channel,
  p_contact text, p_code_hash text, p_ttl_seconds integer default 600
) returns boolean
language plpgsql
security definer
set search_path = ''
as $$
begin
  -- No máximo 5 pedidos por contato a cada 10 minutos e 10 por hora por tentativa.
  if not internal.hit_rate_limit('codigo:' || p_purpose || ':' || lower(p_contact), 5, 600)
     or not internal.hit_rate_limit('codigo-tentativa:' || p_subject, 10, 3600) then
    return false;
  end if;

  -- O código antigo deixa de valer: só o mais recente funciona.
  update public.contact_verifications
     set expires_at = now()
   where purpose = p_purpose and subject = p_subject and confirmed_at is null and expires_at > now();

  insert into public.contact_verifications (purpose, subject, channel, contact, code_hash, expires_at)
  values (p_purpose, p_subject, p_channel, lower(p_contact), p_code_hash,
          now() + make_interval(secs => p_ttl_seconds));
  return true;
end;
$$;

-- Confere o código digitado. Devolve TRUE e marca como confirmado se:
--   - existe um código vigente para aquela tentativa e contato;
--   - não passou de 5 erros;
--   - o hash confere.
-- Cada erro soma uma tentativa; no quinto erro o código morre.
create or replace function internal.confirm_verification(
  p_purpose text, p_subject text, p_contact text, p_code_hash text
) returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v public.contact_verifications%rowtype;
begin
  select * into v
    from public.contact_verifications
   where purpose = p_purpose and subject = p_subject and contact = lower(p_contact)
     and confirmed_at is null and expires_at > now()
   order by created_at desc
   limit 1
   for update;

  if not found then
    return false;
  end if;

  if v.attempts >= 5 then
    return false;
  end if;

  if v.code_hash = p_code_hash then
    update public.contact_verifications set confirmed_at = now() where id = v.id;
    return true;
  end if;

  update public.contact_verifications set attempts = attempts + 1 where id = v.id;
  return false;
end;
$$;

-- ---------------------------------------------------------------------
-- Utilitários usados pelas funções de negócio (migrations 5, 6 e 7)
-- ---------------------------------------------------------------------

-- Recusa quem não é agente ativo. A Edge Function já validou o login (JWT) e
-- passa o id do usuário; aqui o banco CONFERE DE NOVO o papel na tabela
-- profiles. Assim, mesmo uma chamada direta ao serviço não passa (defesa em
-- camadas, SECURITY.md).
create or replace function internal.require_agent(p_agent uuid)
returns void
language plpgsql
stable
set search_path = ''
as $$
begin
  if p_agent is null or not internal.is_agent(p_agent) then
    raise exception 'nao_autorizado';
  end if;
end;
$$;

-- Converte um array JSON (["a","b"]) em text[] do Postgres. Aceita nulo e
-- qualquer coisa que não seja array (vira lista vazia).
create or replace function internal.json_text_array(p jsonb)
returns text[]
language sql
immutable
set search_path = ''
as $$
  select coalesce(array_agg(x order by ord), '{}')
    from jsonb_array_elements_text(
           case when jsonb_typeof(p) = 'array' then p else '[]'::jsonb end
         ) with ordinality as t(x, ord);
$$;

-- Cria ou atualiza a versão PÚBLICA da denúncia (a linha de public_reports) e
-- registra o caminho público de cada foto. Só o que o PRD autoriza: o ponto
-- exato NÃO entra, vai o centro da célula de 200 m.
create or replace function internal.upsert_public_report(p_report_id uuid, p_paths text[])
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  r      public.reports%rowtype;
  v_cell record;
begin
  select * into r from public.reports where id = p_report_id;
  select * into v_cell from internal.grid_cell(r.location_lat, r.location_lng);

  insert into public.public_reports (
    report_id, neighborhood_id, category_id, description, received_at, stage, origin,
    cell_ix, cell_iy, cell_center_lat, cell_center_lng, photo_paths)
  values (
    r.id, r.neighborhood_id, r.category_id, r.description, r.received_at, r.stage, r.origin,
    v_cell.ix, v_cell.iy, v_cell.center_lat, v_cell.center_lng, p_paths)
  on conflict (report_id) do update set
    description = excluded.description, stage = excluded.stage,
    category_id = excluded.category_id, neighborhood_id = excluded.neighborhood_id,
    cell_ix = excluded.cell_ix, cell_iy = excluded.cell_iy,
    cell_center_lat = excluded.cell_center_lat, cell_center_lng = excluded.cell_center_lng,
    photo_paths = excluded.photo_paths;

  update public.report_photos ph set public_path = p_paths[ph.position]
   where ph.report_id = r.id;
end;
$$;

-- Se a denúncia JÁ está no mapa, copia para a versão pública o que mudou
-- (etapa, descrição, categoria, bairro, célula). Não cria linha nova e não
-- mexe em fotos. Sem linha pública (pendente/arquivada) não faz nada.
create or replace function internal.sync_public_report(p_report_id uuid)
returns void
language sql
security definer
set search_path = ''
as $$
  update public.public_reports pr
     set stage = r.stage, description = r.description, category_id = r.category_id,
         neighborhood_id = r.neighborhood_id,
         cell_ix = g.ix, cell_iy = g.iy,
         cell_center_lat = g.center_lat, cell_center_lng = g.center_lng
    from public.reports r, lateral internal.grid_cell(r.location_lat, r.location_lng) g
   where pr.report_id = r.id and r.id = p_report_id;
$$;

-- Só a chave de serviço executa estas funções.
revoke all on function internal.grid_cell(double precision, double precision) from public;
revoke all on function internal.in_territory(double precision, double precision) from public;
revoke all on function internal.distance_m(double precision, double precision, double precision, double precision) from public;
revoke all on function internal.next_protocol() from public;
revoke all on function internal.hit_rate_limit(text, integer, integer) from public;
revoke all on function internal.start_verification(text, text, public.contact_channel, text, text, integer) from public;
revoke all on function internal.confirm_verification(text, text, text, text) from public;
revoke all on function internal.block_event_update() from public;
revoke all on function internal.require_agent(uuid) from public;
revoke all on function internal.json_text_array(jsonb) from public;
revoke all on function internal.upsert_public_report(uuid, text[]) from public;
revoke all on function internal.sync_public_report(uuid) from public;

grant execute on function internal.grid_cell(double precision, double precision) to service_role;
grant execute on function internal.in_territory(double precision, double precision) to service_role;
grant execute on function internal.distance_m(double precision, double precision, double precision, double precision) to service_role;
grant execute on function internal.next_protocol() to service_role;
grant execute on function internal.hit_rate_limit(text, integer, integer) to service_role;
grant execute on function internal.start_verification(text, text, public.contact_channel, text, text, integer) to service_role;
grant execute on function internal.confirm_verification(text, text, text, text) to service_role;
grant execute on function internal.require_agent(uuid) to service_role;
grant execute on function internal.json_text_array(jsonb) to service_role;
grant execute on function internal.upsert_public_report(uuid, text[]) to service_role;
grant execute on function internal.sync_public_report(uuid) to service_role;
