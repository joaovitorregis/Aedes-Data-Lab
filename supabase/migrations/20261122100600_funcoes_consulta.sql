-- =====================================================================
-- Migration 7 de 7: correção de campos, lixeira, código de confirmação e
-- leituras do agente
--
-- Para a Edge Function (só service_role):
--   api_correct_fields_agent / api_correct_fields_citizen   (RF-COR-01)
--   api_find_report_for_correction / api_get_report_for_citizen   (D42)
--   api_start_verification / api_confirm_verification / api_hit_rate_limit
--   api_trash_due / api_purge_report / api_pending_public_cleanup  (D44)
--   api_pending_publication                                       (D14)
--
-- Para o navegador do AGENTE logado (authenticated, e o banco confere o papel):
--   agent_nearby_reports     outras ocorrências num raio de 150 m (D34)
--   agent_queue_summary      resumo da fila (RF-AGE-01)
-- =====================================================================

-- ---------------------------------------------------------------------
-- Correção de campos (RF-COR-01). Núcleo compartilhado pelo agente e pelo cidadão.
--
-- p_changes é um objeto JSON só com os campos a mudar, com os nomes das colunas:
--   reports:        location_lat, location_lng, neighborhood_id, category_id, description,
--                   focus_location, focus_location_other, water_present, containers, larvae,
--                   place_address, place_reference (esses dois só em ocorrência de agente)
--   report_private: name, phone, email, address, reference
--   só o cidadão:   noticed_since, other_evidence
-- Qualquer outro nome é recusado (campo_desconhecido): etapa, publicação,
-- protocolo etc. NUNCA mudam por correção.
-- O contato CONFIRMADO não muda aqui (D42): só a equipe, direto no Supabase.
-- Guarda no histórico: valor antigo, valor novo, motivo e autor.
-- ---------------------------------------------------------------------
create or replace function internal.apply_corrections(
  p_report_id uuid, p_author uuid, p_changes jsonb, p_reason text, p_is_agent boolean,
  p_expected_version integer default null)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  r             public.reports%rowtype;
  pr            public.report_private%rowtype;
  v_has_private boolean;
  v_all         jsonb;
  k             text;
  v_old         jsonb := '{}'::jsonb;
  v_new         jsonb := '{}'::jsonb;
  v_lat         double precision;
  v_lng         double precision;
  v_cell        record;
  v_reports_keys text[] := array['location_lat','location_lng','neighborhood_id','category_id',
    'description','focus_location','focus_location_other','water_present','containers','larvae'];
  v_place_keys   text[] := array['place_address','place_reference'];
  v_citizen_keys text[] := array['noticed_since','other_evidence'];
  v_private_keys text[] := array['name','phone','email','address','reference'];
begin
  if length(trim(coalesce(p_reason, ''))) = 0 then raise exception 'motivo_obrigatorio'; end if;
  if length(trim(p_reason)) > 500 then raise exception 'dados_invalidos: motivo com ate 500 caracteres'; end if;
  if jsonb_typeof(p_changes) is distinct from 'object' or p_changes = '{}'::jsonb then
    raise exception 'dados_invalidos: nenhuma alteracao';
  end if;

  select * into r from public.reports where id = p_report_id for update;
  if not found then raise exception 'denuncia_nao_encontrada'; end if;

  -- Versão esperada (opcional): a tela diz qual versão viu. Se a denúncia já mudou
  -- (outra correção, outra ação), recusa. Para o cidadão isto torna a autorização
  -- de edição de USO ÚNICO: ela carrega a versão da emissão, e cada correção
  -- soma 1, então a mesma autorização não vale uma segunda vez.
  if p_expected_version is not null and r.version <> p_expected_version then
    raise exception 'versao_desatualizada';
  end if;

  -- O cidadão só corrige enquanto Recebida; depois disso, pede ao agente (D26).
  if not p_is_agent and r.stage <> 'recebida' then raise exception 'etapa_invalida'; end if;

  select * into pr from public.report_private where report_id = r.id;
  v_has_private := found;
  v_all := to_jsonb(r) || coalesce(to_jsonb(pr), '{}'::jsonb);

  -- Confere CADA campo antes de gravar qualquer coisa.
  for k in select jsonb_object_keys(p_changes) loop
    if k = any (v_reports_keys) then
      null;
    elsif k = any (v_place_keys) then
      if r.origin <> 'agente' then raise exception 'campo_nao_aplicavel: %', k; end if;
    elsif k = any (v_citizen_keys) then
      -- "Há quanto tempo percebeu" e "outra evidência": só o cidadão informa.
      if p_is_agent then raise exception 'campo_nao_editavel: %', k; end if;
    elsif k = any (v_private_keys) then
      if not v_has_private then raise exception 'campo_nao_aplicavel: %', k; end if;
      -- O contato que foi confirmado por código não muda aqui.
      if (k = 'email' and pr.confirmed_channel = 'email')
         or (k = 'phone' and pr.confirmed_channel in ('sms', 'whatsapp')) then
        raise exception 'contato_confirmado_nao_editavel';
      end if;
    else
      raise exception 'campo_desconhecido: %', k;
    end if;
    v_old := v_old || jsonb_build_object(k, v_all -> k);
    v_new := v_new || jsonb_build_object(k, p_changes -> k);
  end loop;

  -- Ponto novo: passa de novo pela validação de território e refaz a célula.
  v_lat := case when p_changes ? 'location_lat' then (p_changes ->> 'location_lat')::double precision else r.location_lat end;
  v_lng := case when p_changes ? 'location_lng' then (p_changes ->> 'location_lng')::double precision else r.location_lng end;
  if (p_changes ? 'location_lat' or p_changes ? 'location_lng')
     and (v_lat is null or v_lng is null or not internal.in_territory(v_lat, v_lng)) then
    raise exception 'fora_do_territorio';
  end if;
  select * into v_cell from internal.grid_cell(v_lat, v_lng);

  -- "case when chave presente" = muda só o que veio; o resto continua igual.
  update public.reports set
    location_lat = v_lat, location_lng = v_lng, cell_ix = v_cell.ix, cell_iy = v_cell.iy,
    neighborhood_id = case when p_changes ? 'neighborhood_id' then (p_changes ->> 'neighborhood_id')::bigint else neighborhood_id end,
    category_id = case when p_changes ? 'category_id' then (p_changes ->> 'category_id')::smallint else category_id end,
    description = case when p_changes ? 'description' then p_changes ->> 'description' else description end,
    focus_location = case when p_changes ? 'focus_location' then nullif(p_changes ->> 'focus_location', '')::public.focus_location else focus_location end,
    focus_location_other = case when p_changes ? 'focus_location_other' then nullif(p_changes ->> 'focus_location_other', '') else focus_location_other end,
    water_present = case when p_changes ? 'water_present' then (p_changes ->> 'water_present')::boolean else water_present end,
    containers = case when p_changes ? 'containers' then internal.json_text_array(p_changes -> 'containers') else containers end,
    larvae = case when p_changes ? 'larvae' then nullif(p_changes ->> 'larvae', '')::public.larvae_answer else larvae end,
    place_address = case when p_changes ? 'place_address' then p_changes ->> 'place_address' else place_address end,
    place_reference = case when p_changes ? 'place_reference' then nullif(p_changes ->> 'place_reference', '') else place_reference end,
    noticed_since = case when p_changes ? 'noticed_since' then nullif(p_changes ->> 'noticed_since', '') else noticed_since end,
    other_evidence = case when p_changes ? 'other_evidence' then nullif(p_changes ->> 'other_evidence', '') else other_evidence end,
    version = version + 1, updated_at = now()
  where id = r.id;

  if v_has_private then
    update public.report_private set
      name = case when p_changes ? 'name' then p_changes ->> 'name' else name end,
      phone = case when p_changes ? 'phone' then p_changes ->> 'phone' else phone end,
      email = case when p_changes ? 'email' then lower(p_changes ->> 'email') else email end,
      address = case when p_changes ? 'address' then p_changes ->> 'address' else address end,
      reference = case when p_changes ? 'reference' then nullif(p_changes ->> 'reference', '') else reference end
    where report_id = r.id;
  end if;

  insert into public.report_events (report_id, event_type, author_id, reason, old_value, new_value)
  values (r.id, 'correcao', p_author, trim(p_reason), v_old, v_new);

  -- Já publicada? Atualiza a versão pública (sem dados privados). Arquivada: continua fora.
  perform internal.sync_public_report(r.id);

  return jsonb_build_object('version', r.version + 1);
end;
$$;

create or replace function public.api_correct_fields_agent(
  p_agent uuid, p_report_id uuid, p_changes jsonb, p_reason text, p_expected_version integer default null)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform internal.require_agent(p_agent);
  return internal.apply_corrections(p_report_id, p_agent, p_changes, p_reason, true, p_expected_version);
end;
$$;

-- O cidadão NÃO tem login. A Edge Function só chama esta função depois de
-- conferir o código enviado ao contato confirmado e de emitir uma autorização
-- temporária ligada A ESTA denúncia (D42). Por isso aqui não há id de agente:
-- o autor do evento fica nulo (= cidadão).
create or replace function public.api_correct_fields_citizen(
  p_report_id uuid, p_changes jsonb, p_reason text, p_expected_version integer default null)
returns jsonb
language sql
security definer
set search_path = ''
as $$
  select internal.apply_corrections(p_report_id, null, p_changes, p_reason, false, p_expected_version);
$$;

-- ---------------------------------------------------------------------
-- Acesso do cidadão à correção (D42)
-- ---------------------------------------------------------------------

-- Dado o protocolo, diz para qual contato CONFIRMADO o código deve ser enviado.
-- Devolve nulo se o protocolo não existe ou não tem cidadão (denúncia de agente).
-- A Edge Function dá a MESMA resposta ao visitante nos dois casos, para não
-- revelar quais protocolos existem.
create or replace function public.api_find_report_for_correction(p_protocol text)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object('report_id', r.id, 'channel', rp.confirmed_channel,
                            'contact', rp.confirmed_contact)
    from public.reports r
    join public.report_private rp on rp.report_id = r.id
   where r.protocol = upper(trim(p_protocol));
$$;

-- O que o cidadão enxerga para editar a PRÓPRIA denúncia: só o que ele mesmo
-- informou, mais a etapa. Sem histórico, visitas, notas, autor, tentativas.
create or replace function public.api_get_report_for_citizen(p_report_id uuid)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
      'report_id', r.id, 'protocol', r.protocol, 'stage', r.stage, 'version', r.version,
      'can_edit', r.stage = 'recebida',
      'location_lat', r.location_lat, 'location_lng', r.location_lng,
      'neighborhood_id', r.neighborhood_id, 'category_id', r.category_id,
      'description', r.description, 'focus_location', r.focus_location,
      'focus_location_other', r.focus_location_other, 'water_present', r.water_present,
      'containers', r.containers, 'larvae', r.larvae,
      'noticed_since', r.noticed_since, 'other_evidence', r.other_evidence,
      'name', rp.name, 'phone', rp.phone, 'email', rp.email,
      'address', rp.address, 'reference', rp.reference,
      'confirmed_channel', rp.confirmed_channel)
    from public.reports r
    join public.report_private rp on rp.report_id = r.id
   where r.id = p_report_id;
$$;

-- ---------------------------------------------------------------------
-- Código de confirmação: envoltórios das funções de "internal", para a Edge
-- Function chamar por rpc (o esquema internal não é exposto).
-- ---------------------------------------------------------------------
create or replace function public.api_start_verification(
  p_purpose text, p_subject text, p_channel public.contact_channel,
  p_contact text, p_code_hash text, p_ttl_seconds integer default 600)
returns boolean
language sql
security definer
set search_path = ''
as $$
  select internal.start_verification(p_purpose, p_subject, p_channel, p_contact, p_code_hash, p_ttl_seconds);
$$;

create or replace function public.api_confirm_verification(
  p_purpose text, p_subject text, p_contact text, p_code_hash text)
returns boolean
language sql
security definer
set search_path = ''
as $$
  select internal.confirm_verification(p_purpose, p_subject, p_contact, p_code_hash);
$$;

create or replace function public.api_hit_rate_limit(p_key text, p_max integer, p_window_seconds integer)
returns boolean
language sql
security definer
set search_path = ''
as $$
  select internal.hit_rate_limit(p_key, p_max, p_window_seconds);
$$;

-- ---------------------------------------------------------------------
-- Lixeira de 30 dias (D44). A rotina diária (Edge Function limpar-lixeira):
--   1. api_trash_due        lista o que venceu, com TODOS os caminhos de foto;
--   2. apaga os arquivos dos dois buckets;
--   3. api_purge_report     só então apaga o registro (cascata leva dados
--                           privados, fotos, visitas e histórico).
-- A ordem importa: arquivos primeiro. Se o passo 2 falhar, o registro continua
-- no banco e a rotina tenta de novo no dia seguinte, sem "foto órfã".
-- ---------------------------------------------------------------------
create or replace function public.api_trash_due()
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(jsonb_agg(jsonb_build_object(
    'report_id', r.id,
    'original_paths', (select coalesce(jsonb_agg(ph.original_path), '[]'::jsonb)
                         from public.report_photos ph where ph.report_id = r.id),
    'public_paths', (select coalesce(jsonb_agg(ph.public_path), '[]'::jsonb)
                       from public.report_photos ph
                      where ph.report_id = r.id and ph.public_path is not null)
  )), '[]'::jsonb)
  from public.reports r
  where r.publication = 'arquivada' and r.archived_at <= now() - interval '30 days';
$$;

create or replace function public.api_purge_report(p_report_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  r public.reports%rowtype;
begin
  select * into r from public.reports where id = p_report_id for update;
  if not found then raise exception 'denuncia_nao_encontrada'; end if;
  -- Confere DE NOVO o prazo: a Edge Function não decide sozinha o que apagar.
  if r.publication <> 'arquivada' or r.archived_at > now() - interval '30 days' then
    raise exception 'nao_vencida';
  end if;

  -- Códigos de confirmação guardam o contato do morador: saem junto.
  delete from public.contact_verifications where subject in (r.submission_id::text, r.protocol);
  -- A cascata das chaves estrangeiras leva report_private, report_photos,
  -- report_visits, report_events e public_reports.
  delete from public.reports where id = r.id;
  return jsonb_build_object('purged', true);
end;
$$;

-- Arquivadas cujas fotos PÚBLICAS ainda constam no banco: a remoção do bucket
-- não foi confirmada. A rotina diária tenta de novo.
create or replace function public.api_pending_public_cleanup()
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(jsonb_agg(jsonb_build_object('report_id', x.report_id, 'public_paths', x.paths)), '[]'::jsonb)
    from (
      select ph.report_id, jsonb_agg(ph.public_path) as paths
        from public.report_photos ph
        join public.reports r on r.id = ph.report_id
       where r.publication = 'arquivada' and ph.public_path is not null
       group by ph.report_id
    ) x;
$$;

-- Denúncias gravadas cuja publicação ainda não aconteceu (D14, RF-DEN-05).
-- A rotina diária refaz o tratamento das fotos e publica usando O MESMO
-- registro. Ignora as dos últimos 2 minutos: podem estar sendo publicadas agora.
create or replace function public.api_pending_publication()
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(jsonb_agg(jsonb_build_object(
    'report_id', r.id,
    'original_paths', (select coalesce(jsonb_agg(ph.original_path order by ph.position), '[]'::jsonb)
                         from public.report_photos ph where ph.report_id = r.id)
  )), '[]'::jsonb)
  from public.reports r
  where r.publication = 'pendente' and r.received_at < now() - interval '2 minutes';
$$;

-- Caminhos das fotos ORIGINAIS (bucket privado), na ordem. Usado ao voltar ao
-- mapa: a Edge Function refaz a versão pública a partir deles.
create or replace function public.api_get_original_paths(p_report_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not exists (select 1 from public.reports where id = p_report_id) then
    raise exception 'denuncia_nao_encontrada';
  end if;
  return (select coalesce(jsonb_agg(original_path order by position), '[]'::jsonb)
            from public.report_photos where report_id = p_report_id);
end;
$$;

-- Checagem PRÉVIA de "voltar ao mapa": confere papel, estado e prazo SEM mudar nada.
-- A Edge Function chama antes de gerar as fotos públicas, para não gastar trabalho
-- (nem mexer em arquivos) numa ação que o banco vai recusar.
create or replace function public.api_check_restore(p_agent uuid, p_report_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  r public.reports%rowtype;
begin
  perform internal.require_agent(p_agent);
  select * into r from public.reports where id = p_report_id;
  if not found then raise exception 'denuncia_nao_encontrada'; end if;
  if r.publication = 'publicada' then return jsonb_build_object('ok', true, 'already', true); end if;
  if r.publication <> 'arquivada' then raise exception 'nao_arquivada'; end if;
  if r.archived_at < now() - interval '30 days' then raise exception 'fora_do_prazo'; end if;
  return jsonb_build_object('ok', true, 'already', false);
end;
$$;

-- ---------------------------------------------------------------------
-- Leituras do agente logado (chamadas direto do navegador, com o login dele).
-- "security definer" + require_agent(auth.uid()): o banco confere o papel a
-- cada chamada. Visitante (anon) nem consegue executar.
-- ---------------------------------------------------------------------

-- Outras ocorrências num raio de 150 m do ponto exato (D34). Mostra só
-- protocolo, data, etapa e distância; nada do morador. Denúncias arquivadas
-- (lixeira) ficam de fora. Cada uma continua sendo uma ocorrência separada:
-- não há fusão automática.
create or replace function public.agent_nearby_reports(p_report_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  r public.reports%rowtype;
begin
  perform internal.require_agent((select auth.uid()));
  select * into r from public.reports where id = p_report_id;
  if not found then raise exception 'denuncia_nao_encontrada'; end if;

  return coalesce((
    select jsonb_agg(jsonb_build_object(
             'report_id', o.id, 'protocol', o.protocol, 'received_at', o.received_at,
             'stage', o.stage, 'distance_m', round(o.d::numeric, 1)) order by o.d)
      from (
        select x.*, internal.distance_m(r.location_lat, r.location_lng, x.location_lat, x.location_lng) as d
          from public.reports x
         where x.id <> r.id and x.publication <> 'arquivada'
      ) o
     where o.d <= 150
  ), '[]'::jsonb);
end;
$$;

-- Resumo da fila: respeita os mesmos filtros da lista (bairro, período de
-- recebimento, origem). "em_analise_sem_acesso" = em análise com pelo menos
-- uma tentativa sem acesso (D54).
create or replace function public.agent_queue_summary(
  p_neighborhood bigint default null, p_from date default null,
  p_to date default null, p_origin text default null)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  perform internal.require_agent((select auth.uid()));
  return (
    select jsonb_build_object(
      'recebida', count(*) filter (where stage = 'recebida'),
      'em_analise', count(*) filter (where stage = 'em_analise'),
      'em_analise_sem_acesso', count(*) filter (where stage = 'em_analise' and failed_attempts >= 1))
      from public.reports
     where (p_neighborhood is null or neighborhood_id = p_neighborhood)
       and (p_from is null or (received_at at time zone 'America/Recife')::date >= p_from)
       and (p_to is null or (received_at at time zone 'America/Recife')::date <= p_to)
       and (p_origin is null or origin::text = p_origin)
  );
end;
$$;

-- ---------------------------------------------------------------------
-- Permissões
-- ---------------------------------------------------------------------
revoke all on function internal.apply_corrections(uuid, uuid, jsonb, text, boolean, integer) from public;
grant execute on function internal.apply_corrections(uuid, uuid, jsonb, text, boolean, integer) to service_role;

-- Só o servidor (service_role):
revoke all on function public.api_correct_fields_agent(uuid, uuid, jsonb, text, integer) from public, anon, authenticated;
revoke all on function public.api_correct_fields_citizen(uuid, jsonb, text, integer) from public, anon, authenticated;
revoke all on function public.api_find_report_for_correction(text) from public, anon, authenticated;
revoke all on function public.api_get_report_for_citizen(uuid) from public, anon, authenticated;
revoke all on function public.api_start_verification(text, text, public.contact_channel, text, text, integer) from public, anon, authenticated;
revoke all on function public.api_confirm_verification(text, text, text, text) from public, anon, authenticated;
revoke all on function public.api_hit_rate_limit(text, integer, integer) from public, anon, authenticated;
revoke all on function public.api_trash_due() from public, anon, authenticated;
revoke all on function public.api_purge_report(uuid) from public, anon, authenticated;
revoke all on function public.api_pending_public_cleanup() from public, anon, authenticated;
revoke all on function public.api_pending_publication() from public, anon, authenticated;
revoke all on function public.api_get_original_paths(uuid) from public, anon, authenticated;
revoke all on function public.api_check_restore(uuid, uuid) from public, anon, authenticated;

grant execute on function public.api_correct_fields_agent(uuid, uuid, jsonb, text, integer) to service_role;
grant execute on function public.api_correct_fields_citizen(uuid, jsonb, text, integer) to service_role;
grant execute on function public.api_find_report_for_correction(text) to service_role;
grant execute on function public.api_get_report_for_citizen(uuid) to service_role;
grant execute on function public.api_start_verification(text, text, public.contact_channel, text, text, integer) to service_role;
grant execute on function public.api_confirm_verification(text, text, text, text) to service_role;
grant execute on function public.api_hit_rate_limit(text, integer, integer) to service_role;
grant execute on function public.api_trash_due() to service_role;
grant execute on function public.api_purge_report(uuid) to service_role;
grant execute on function public.api_pending_public_cleanup() to service_role;
grant execute on function public.api_pending_publication() to service_role;
grant execute on function public.api_get_original_paths(uuid) to service_role;
grant execute on function public.api_check_restore(uuid, uuid) to service_role;

-- Agente logado (o banco ainda confere o papel dentro da função):
revoke all on function public.agent_nearby_reports(uuid) from public, anon;
revoke all on function public.agent_queue_summary(bigint, date, date, text) from public, anon;
grant execute on function public.agent_nearby_reports(uuid) to authenticated, service_role;
grant execute on function public.agent_queue_summary(bigint, date, date, text) to authenticated, service_role;
