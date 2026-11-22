-- =====================================================================
-- Migration 6 de 7: ações do agente
--
--   api_start_analysis          Recebida -> Em análise            (RF-AGE-02)
--   api_register_visit          visita com ou sem acesso          (RF-AGE-03)
--   api_add_note                observação interna                (RF-AGE-05)
--   api_close_without_access    encerrar após 3 tentativas        (RF-AGE-07)
--   api_archive_report          arquivar = lixeira de 30 dias     (RF-AGE-04)
--   api_clear_public_photo_paths  confirma que as fotos públicas foram apagadas
--   api_restore_to_map          voltar ao mapa                    (RF-AGE-06)
--   api_create_agent_report     foco em local sem denúncia        (RF-AGE-10)
--
-- Padrão de TODAS (o mesmo da migration 5):
--   * ficam em "public" com prefixo api_ e só o service_role executa;
--   * o primeiro parâmetro é o id do agente. A Edge Function valida o login e
--     o passa; o banco confere o papel DE NOVO em profiles (require_agent);
--   * "for update" trava a ocorrência durante a ação: duas pessoas agindo ao
--     mesmo tempo ficam em fila e não se sobrescrevem;
--   * CONCORRÊNCIA OTIMISTA: a tela diz a versão que viu (p_version). Se a
--     ocorrência já mudou, a ação é recusada (versao_desatualizada). Toda
--     mudança de etapa soma 1 na versão (ARCHITECTURE 7.3, RNF-09);
--   * REPETIR a ação (clique duplo, reenvio por queda de rede) não duplica
--     evento nem visita: devolve o resultado já gravado (AC-10).
-- =====================================================================

-- ---------------------------------------------------------------------
-- Iniciar análise
-- ---------------------------------------------------------------------
create or replace function public.api_start_analysis(p_agent uuid, p_report_id uuid, p_version integer)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  r public.reports%rowtype;
begin
  perform internal.require_agent(p_agent);

  select * into r from public.reports where id = p_report_id for update;
  if not found then raise exception 'denuncia_nao_encontrada'; end if;

  -- Já está em análise: clique repetido. Não grava evento de novo.
  if r.stage = 'em_analise' then
    return jsonb_build_object('changed', false, 'stage', r.stage, 'version', r.version);
  end if;
  if r.stage <> 'recebida' then raise exception 'etapa_invalida'; end if;
  if r.version <> p_version then raise exception 'versao_desatualizada'; end if;

  update public.reports
     set stage = 'em_analise', version = version + 1, updated_at = now()
   where id = r.id;
  insert into public.report_events (report_id, event_type, author_id, old_value, new_value)
  values (r.id, 'analise_iniciada', p_agent,
          jsonb_build_object('stage', 'recebida'), jsonb_build_object('stage', 'em_analise'));
  perform internal.sync_public_report(r.id);

  return jsonb_build_object('changed', true, 'stage', 'em_analise', 'version', r.version + 1);
end;
$$;

-- ---------------------------------------------------------------------
-- Registrar visita
-- p_visit: id (gerado no aparelho), visited_on, access, focus_location,
--   focus_location_other, water_present, containers[], larvae, actions[], notes.
-- Os campos obrigatórios de cada tipo de visita são conferidos pelas
-- CONSTRAINTS da tabela report_visits (o banco recusa visita incompleta).
-- ---------------------------------------------------------------------
create or replace function public.api_register_visit(
  p_agent uuid, p_report_id uuid, p_version integer, p_visit jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  r         public.reports%rowtype;
  v_id      uuid := (p_visit ->> 'id')::uuid;
  v_access  public.visit_access := (p_visit ->> 'access')::public.visit_access;
  v_date    date := (p_visit ->> 'visited_on')::date;
  v_today   date := (now() at time zone 'America/Recife')::date;
  v_stage   public.report_stage;
  v_failed  integer;
begin
  perform internal.require_agent(p_agent);
  if v_id is null or v_access is null then raise exception 'dados_invalidos'; end if;

  select * into r from public.reports where id = p_report_id for update;
  if not found then raise exception 'denuncia_nao_encontrada'; end if;

  -- Reenvio da mesma visita (o id nasce no aparelho): devolve o que já foi gravado.
  if exists (select 1 from public.report_visits where id = v_id) then
    if exists (select 1 from public.report_visits where id = v_id and report_id = r.id) then
      return jsonb_build_object('already_existed', true, 'stage', r.stage,
                                'version', r.version, 'failed_attempts', r.failed_attempts);
    end if;
    raise exception 'dados_invalidos: id da visita ja usado';
  end if;

  if r.stage <> 'em_analise' then raise exception 'etapa_invalida'; end if;
  if r.version <> p_version then raise exception 'versao_desatualizada'; end if;

  -- Data: não pode ser futura nem anterior ao recebimento (datas no fuso de Recife).
  if v_date is null or v_date > v_today
     or v_date < (r.received_at at time zone 'America/Recife')::date then
    raise exception 'data_invalida';
  end if;

  insert into public.report_visits (
    id, report_id, visited_on, access, focus_location, focus_location_other,
    water_present, containers, larvae, actions, notes, author_id)
  values (
    v_id, r.id, v_date, v_access,
    nullif(p_visit ->> 'focus_location', '')::public.focus_location,
    nullif(p_visit ->> 'focus_location_other', ''),
    (p_visit ->> 'water_present')::boolean,
    internal.json_text_array(p_visit -> 'containers'),
    nullif(p_visit ->> 'larvae', '')::public.larvae_answer,
    internal.json_text_array(p_visit -> 'actions'),
    nullif(p_visit ->> 'notes', ''), p_agent);

  -- Com acesso: Atendida. Sem acesso: continua em análise e soma uma tentativa.
  if v_access = 'com_acesso' then
    v_stage := 'atendida';
    v_failed := r.failed_attempts;
  else
    v_stage := r.stage;
    v_failed := r.failed_attempts + 1;
  end if;

  update public.reports
     set stage = v_stage, failed_attempts = v_failed, version = version + 1, updated_at = now()
   where id = r.id;

  insert into public.report_events (report_id, event_type, author_id, old_value, new_value)
  values (r.id, 'visita_registrada', p_agent,
          jsonb_build_object('stage', r.stage),
          jsonb_build_object('stage', v_stage, 'access', v_access, 'visit_id', v_id,
                             'failed_attempts', v_failed));
  perform internal.sync_public_report(r.id);

  return jsonb_build_object('already_existed', false, 'stage', v_stage,
                            'version', r.version + 1, 'failed_attempts', v_failed);
end;
$$;

-- ---------------------------------------------------------------------
-- Observação interna (só em análise). Não muda etapa nem versão.
-- ---------------------------------------------------------------------
create or replace function public.api_add_note(p_agent uuid, p_report_id uuid, p_text text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  r public.reports%rowtype;
begin
  perform internal.require_agent(p_agent);
  if length(trim(coalesce(p_text, ''))) not between 1 and 500 then
    raise exception 'dados_invalidos: observacao de 1 a 500 caracteres';
  end if;

  select * into r from public.reports where id = p_report_id for update;
  if not found then raise exception 'denuncia_nao_encontrada'; end if;
  if r.stage <> 'em_analise' then raise exception 'etapa_invalida'; end if;

  insert into public.report_events (report_id, event_type, author_id, reason)
  values (r.id, 'observacao', p_agent, trim(p_text));
  return jsonb_build_object('ok', true);
end;
$$;

-- ---------------------------------------------------------------------
-- Encerrar sem acesso: só com 3 ou mais tentativas, e só quando o agente decide.
-- ---------------------------------------------------------------------
create or replace function public.api_close_without_access(p_agent uuid, p_report_id uuid, p_version integer)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  r public.reports%rowtype;
begin
  perform internal.require_agent(p_agent);

  select * into r from public.reports where id = p_report_id for update;
  if not found then raise exception 'denuncia_nao_encontrada'; end if;

  -- Clique repetido: já foi encerrada por esta ação.
  if r.stage = 'encerrada' and exists (
       select 1 from public.report_events
        where report_id = r.id and event_type = 'encerrada_sem_acesso') then
    return jsonb_build_object('changed', false, 'stage', r.stage, 'version', r.version);
  end if;

  if r.stage <> 'em_analise' then raise exception 'etapa_invalida'; end if;
  if r.failed_attempts < 3 then raise exception 'tentativas_insuficientes'; end if;
  if r.version <> p_version then raise exception 'versao_desatualizada'; end if;

  update public.reports
     set stage = 'encerrada', version = version + 1, updated_at = now()
   where id = r.id;
  insert into public.report_events (report_id, event_type, author_id, reason, old_value, new_value)
  values (r.id, 'encerrada_sem_acesso', p_agent,
          'Sem acesso após ' || r.failed_attempts || ' tentativas',
          jsonb_build_object('stage', 'em_analise'), jsonb_build_object('stage', 'encerrada'));
  perform internal.sync_public_report(r.id);

  return jsonb_build_object('changed', true, 'stage', 'encerrada', 'version', r.version + 1);
end;
$$;

-- ---------------------------------------------------------------------
-- Arquivar (a "lixeira" de 30 dias, D44/D48/D49)
--   * exige motivo e confirmação, em qualquer etapa;
--   * tira a linha pública do mapa NA HORA;
--   * Recebida/Em análise viram Encerrada; Atendida/Encerrada mantêm a etapa;
--   * devolve os caminhos das fotos PÚBLICAS para a Edge Function apagar do
--     bucket. Os caminhos continuam gravados em report_photos até a Edge
--     Function confirmar a remoção (api_clear_public_photo_paths). Se a
--     remoção falhar, a rotina diária tenta de novo: nenhuma foto pública
--     fica "esquecida" (a foto sair do ar é regra do PRD, RNF-06).
-- ---------------------------------------------------------------------
create or replace function public.api_archive_report(
  p_agent uuid, p_report_id uuid, p_reason text, p_confirmed boolean)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  r       public.reports%rowtype;
  v_stage public.report_stage;
  v_paths text[];
begin
  perform internal.require_agent(p_agent);
  if length(trim(coalesce(p_reason, ''))) = 0 then raise exception 'motivo_obrigatorio'; end if;
  if length(trim(p_reason)) > 500 then raise exception 'dados_invalidos: motivo com ate 500 caracteres'; end if;
  if p_confirmed is distinct from true then raise exception 'confirmacao_obrigatoria'; end if;

  select * into r from public.reports where id = p_report_id for update;
  if not found then raise exception 'denuncia_nao_encontrada'; end if;

  -- Já arquivada: clique repetido, não duplica o evento.
  if r.publication = 'arquivada' then
    return jsonb_build_object('already_archived', true, 'public_photo_paths', '[]'::jsonb);
  end if;

  v_stage := case when r.stage in ('recebida', 'em_analise') then 'encerrada'::public.report_stage
                  else r.stage end;

  select coalesce(array_agg(public_path order by position) filter (where public_path is not null), '{}')
    into v_paths from public.report_photos where report_id = r.id;

  update public.reports
     set publication = 'arquivada', archived_at = now(), archive_reason = trim(p_reason),
         publication_version = publication_version + 1,
         stage = v_stage, version = version + 1, updated_at = now()
   where id = r.id;
  delete from public.public_reports where report_id = r.id;

  insert into public.report_events (report_id, event_type, author_id, reason, old_value, new_value)
  values (r.id, 'arquivada', p_agent, trim(p_reason),
          jsonb_build_object('stage', r.stage, 'publication', r.publication),
          jsonb_build_object('stage', v_stage, 'publication', 'arquivada'));

  return jsonb_build_object('already_archived', false, 'public_photo_paths', to_jsonb(v_paths));
end;
$$;

-- Chamada pela Edge Function DEPOIS de apagar as fotos públicas do bucket.
create or replace function public.api_clear_public_photo_paths(p_report_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not exists (select 1 from public.reports where id = p_report_id and publication = 'arquivada') then
    raise exception 'nao_arquivada';
  end if;
  update public.report_photos set public_path = null where report_id = p_report_id;
  return jsonb_build_object('cleared', true);
end;
$$;

-- ---------------------------------------------------------------------
-- Voltar ao mapa: ação explícita, só dentro dos 30 dias, muda só a visibilidade.
-- A Edge Function refaz as fotos públicas a partir dos ORIGINAIS (que
-- continuam no bucket privado) e passa os novos caminhos aqui.
-- ---------------------------------------------------------------------
create or replace function public.api_restore_to_map(p_agent uuid, p_report_id uuid, p_photo_paths jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  r       public.reports%rowtype;
  v_paths text[] := internal.json_text_array(p_photo_paths);
begin
  perform internal.require_agent(p_agent);
  if cardinality(v_paths) > 3 then raise exception 'fotos_invalidas'; end if;

  select * into r from public.reports where id = p_report_id for update;
  if not found then raise exception 'denuncia_nao_encontrada'; end if;

  if r.publication = 'publicada' then
    return jsonb_build_object('restored', false, 'reason', 'ja_publicada');
  end if;
  if r.publication <> 'arquivada' then raise exception 'nao_arquivada'; end if;
  if r.archived_at < now() - interval '30 days' then raise exception 'fora_do_prazo'; end if;

  update public.reports
     set publication = 'publicada', archived_at = null, archive_reason = null,
         publication_version = publication_version + 1, updated_at = now()
   where id = r.id;
  perform internal.upsert_public_report(r.id, v_paths);

  insert into public.report_events (report_id, event_type, author_id, old_value, new_value)
  values (r.id, 'voltou_ao_mapa', p_agent,
          jsonb_build_object('publication', 'arquivada'), jsonb_build_object('publication', 'publicada'));

  return jsonb_build_object('restored', true);
end;
$$;

-- ---------------------------------------------------------------------
-- Foco em local sem denúncia (RF-AGE-10)
-- Nasce ATENDIDA, origem "agente", com UMA visita com acesso. Não tem dados
-- do morador nem código de confirmação. O nome do agente fica em
-- reports.author_id (privado) e nunca vai para public_reports (D50).
-- p: submission_id, lat, lng, neighborhood_id, category_id, description,
--    place_address, place_reference, photos[], visit{...} (mesmo formato da visita).
-- ---------------------------------------------------------------------
create or replace function public.api_create_agent_report(p_agent uuid, p jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_sub       uuid := (p ->> 'submission_id')::uuid;
  v_visit     jsonb := p -> 'visit';
  v_existing  public.reports%rowtype;
  v_lat       double precision := (p ->> 'lat')::double precision;
  v_lng       double precision := (p ->> 'lng')::double precision;
  v_cell      record;
  v_photos    text[];
  v_date      date := (v_visit ->> 'visited_on')::date;
  v_today     date := (now() at time zone 'America/Recife')::date;
  v_report_id uuid;
  v_protocol  text;
  v_i         integer;
begin
  perform internal.require_agent(p_agent);
  if v_sub is null or v_visit is null or (v_visit ->> 'id') is null then
    raise exception 'dados_invalidos';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(v_sub::text, 0));
  select * into v_existing from public.reports where submission_id = v_sub;
  if found then
    return jsonb_build_object('report_id', v_existing.id, 'protocol', v_existing.protocol,
                              'already_existed', true, 'publication', v_existing.publication);
  end if;

  if v_lat is null or v_lng is null or not internal.in_territory(v_lat, v_lng) then
    raise exception 'fora_do_territorio';
  end if;

  v_photos := internal.json_text_array(p -> 'photos');
  if cardinality(v_photos) not between 1 and 3 then raise exception 'fotos_invalidas'; end if;

  if v_date is null or v_date > v_today then raise exception 'data_invalida'; end if;

  select * into v_cell from internal.grid_cell(v_lat, v_lng);
  v_protocol := internal.next_protocol();

  -- As respostas do foco vêm da visita (D53: mesmo formulário do cidadão).
  insert into public.reports (
    submission_id, protocol, origin, author_id, location_lat, location_lng, cell_ix, cell_iy,
    neighborhood_id, category_id, description, place_address, place_reference,
    focus_location, focus_location_other, water_present, containers, larvae, stage)
  values (
    v_sub, v_protocol, 'agente', p_agent, v_lat, v_lng, v_cell.ix, v_cell.iy,
    (p ->> 'neighborhood_id')::bigint, (p ->> 'category_id')::smallint, p ->> 'description',
    p ->> 'place_address', nullif(p ->> 'place_reference', ''),
    nullif(v_visit ->> 'focus_location', '')::public.focus_location,
    nullif(v_visit ->> 'focus_location_other', ''),
    (v_visit ->> 'water_present')::boolean,
    internal.json_text_array(v_visit -> 'containers'),
    nullif(v_visit ->> 'larvae', '')::public.larvae_answer,
    'atendida')
  returning id into v_report_id;

  for v_i in 1 .. cardinality(v_photos) loop
    insert into public.report_photos (report_id, position, original_path)
    values (v_report_id, v_i, v_photos[v_i]);
  end loop;

  -- A visita é sempre COM acesso (não existe pergunta de acesso aqui, PRD 8.1).
  insert into public.report_visits (
    id, report_id, visited_on, access, focus_location, focus_location_other,
    water_present, containers, larvae, actions, notes, author_id)
  values (
    (v_visit ->> 'id')::uuid, v_report_id, v_date, 'com_acesso',
    nullif(v_visit ->> 'focus_location', '')::public.focus_location,
    nullif(v_visit ->> 'focus_location_other', ''),
    (v_visit ->> 'water_present')::boolean,
    internal.json_text_array(v_visit -> 'containers'),
    nullif(v_visit ->> 'larvae', '')::public.larvae_answer,
    internal.json_text_array(v_visit -> 'actions'),
    nullif(v_visit ->> 'notes', ''), p_agent);

  insert into public.report_events (report_id, event_type, author_id)
  values (v_report_id, 'recebida', p_agent);
  insert into public.report_events (report_id, event_type, author_id, new_value)
  values (v_report_id, 'visita_registrada', p_agent,
          jsonb_build_object('stage', 'atendida', 'access', 'com_acesso'));

  return jsonb_build_object('report_id', v_report_id, 'protocol', v_protocol,
                            'already_existed', false, 'publication', 'pendente');
end;
$$;

-- ---------------------------------------------------------------------
-- Permissões: revoga de todos e libera SÓ para service_role.
-- ---------------------------------------------------------------------
revoke all on function public.api_start_analysis(uuid, uuid, integer) from public, anon, authenticated;
revoke all on function public.api_register_visit(uuid, uuid, integer, jsonb) from public, anon, authenticated;
revoke all on function public.api_add_note(uuid, uuid, text) from public, anon, authenticated;
revoke all on function public.api_close_without_access(uuid, uuid, integer) from public, anon, authenticated;
revoke all on function public.api_archive_report(uuid, uuid, text, boolean) from public, anon, authenticated;
revoke all on function public.api_clear_public_photo_paths(uuid) from public, anon, authenticated;
revoke all on function public.api_restore_to_map(uuid, uuid, jsonb) from public, anon, authenticated;
revoke all on function public.api_create_agent_report(uuid, jsonb) from public, anon, authenticated;

grant execute on function public.api_start_analysis(uuid, uuid, integer) to service_role;
grant execute on function public.api_register_visit(uuid, uuid, integer, jsonb) to service_role;
grant execute on function public.api_add_note(uuid, uuid, text) to service_role;
grant execute on function public.api_close_without_access(uuid, uuid, integer) to service_role;
grant execute on function public.api_archive_report(uuid, uuid, text, boolean) to service_role;
grant execute on function public.api_clear_public_photo_paths(uuid) to service_role;
grant execute on function public.api_restore_to_map(uuid, uuid, jsonb) to service_role;
grant execute on function public.api_create_agent_report(uuid, jsonb) to service_role;
