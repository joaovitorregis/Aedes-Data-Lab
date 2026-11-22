-- =====================================================================
-- Migration 5 de 7: funções da denúncia do cidadão
--
--   public.api_save_report     grava a denúncia (idempotente) e devolve o protocolo
--   public.api_publish_report  cria a versão pública (a que aparece no mapa)
--
-- POR QUE ESTAS FUNÇÕES FICAM EM "public" E NÃO EM "internal"?
-- A API do Supabase (PostgREST) só enxerga funções de esquemas expostos, e
-- "internal" não é exposto de propósito. Então a Edge Function chama estas
-- funções por supabase.rpc('api_save_report', ...). Elas ficam em "public",
-- mas o EXECUTE é liberado SÓ para service_role: o navegador (anon e
-- authenticated) recebe "permission denied" se tentar chamar (ADR-008).
-- O prefixo "api_" avisa: função de negócio, só para o servidor.
--
-- "security definer" = a função roda com os poderes do dono (quem criou),
-- e não de quem chamou. É o que permite gravar nas tabelas fechadas.
-- "set search_path = ''" = obriga a escrever o esquema em todo nome
-- (public.reports), o que impede um ataque de "esquema falso".
-- =====================================================================

-- ---------------------------------------------------------------------
-- api_save_report: grava a denúncia inteira numa única transação.
-- Se qualquer passo falhar, NADA fica gravado (não existe denúncia pela
-- metade) e nenhum protocolo é entregue (ARCHITECTURE 5, RF-DEN-04).
--
-- Entrada (jsonb): submission_id, lat, lng, neighborhood_id, category_id,
--   description, focus_location, focus_location_other, water_present,
--   containers[], larvae, noticed_since, other_evidence, name, email, phone,
--   address, reference, confirmed_channel, confirmed_contact, photos[]
--   (caminhos das fotos ORIGINAIS no bucket privado).
-- Saída (jsonb): { report_id, protocol, already_existed, publication }
-- ---------------------------------------------------------------------
create or replace function public.api_save_report(p jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_sub        uuid;
  v_existing   public.reports%rowtype;
  v_lat        double precision;
  v_lng        double precision;
  v_cell       record;
  v_photos     text[];
  v_channel    public.contact_channel;
  v_contact    text;
  v_expected   text;
  v_report_id  uuid;
  v_protocol   text;
  v_i          integer;
begin
  v_sub := (p ->> 'submission_id')::uuid;
  if v_sub is null then
    raise exception 'dados_invalidos: submission_id obrigatorio';
  end if;

  -- Trava por tentativa: se o mesmo envio chegar duas vezes AO MESMO TEMPO
  -- (clique duplo), a segunda chamada espera a primeira terminar e então cai
  -- no "já existe" abaixo, em vez de tentar gravar de novo.
  perform pg_advisory_xact_lock(hashtextextended(v_sub::text, 0));

  -- Idempotência: o mesmo envio devolve a MESMA denúncia (ADR-007).
  select * into v_existing from public.reports where submission_id = v_sub;
  if found then
    return jsonb_build_object(
      'report_id', v_existing.id, 'protocol', v_existing.protocol,
      'already_existed', true, 'publication', v_existing.publication);
  end if;

  -- Ponto dentro do território (RF-DEN-01).
  v_lat := (p ->> 'lat')::double precision;
  v_lng := (p ->> 'lng')::double precision;
  if v_lat is null or v_lng is null or not internal.in_territory(v_lat, v_lng) then
    raise exception 'fora_do_territorio';
  end if;

  -- De uma a três fotos (RF-DEN-03).
  if jsonb_typeof(p -> 'photos') is distinct from 'array' then
    raise exception 'fotos_invalidas';
  end if;
  select coalesce(array_agg(x order by ord), '{}') into v_photos
    from jsonb_array_elements_text(p -> 'photos') with ordinality as t(x, ord);
  if cardinality(v_photos) not between 1 and 3 then
    raise exception 'fotos_invalidas';
  end if;

  -- O contato precisa ter sido confirmado por código para ESTA tentativa, há
  -- no máximo 1 hora, e ser o mesmo contato informado (RF-AUT-01). Sem isto o
  -- servidor recusa, mesmo que alguém chame a função sem passar pela tela.
  v_channel := (p ->> 'confirmed_channel')::public.contact_channel;
  v_contact := lower(p ->> 'confirmed_contact');
  -- Contato esperado: o e-mail (canal e-mail) ou o telefone (SMS/WhatsApp).
  if v_channel = 'email' then
    v_expected := lower(p ->> 'email');
  else
    v_expected := p ->> 'phone';
  end if;

  if v_contact is null or v_contact is distinct from v_expected then
    raise exception 'contato_nao_confirmado';
  end if;

  if not exists (
       select 1 from public.contact_verifications cv
        where cv.purpose = 'envio' and cv.subject = v_sub::text
          and cv.channel = v_channel and cv.contact = v_contact
          and cv.confirmed_at is not null
          and cv.confirmed_at > now() - interval '1 hour') then
    raise exception 'contato_nao_confirmado';
  end if;

  -- A grade de 200 m é calculada AQUI, no servidor; o navegador não decide.
  select * into v_cell from internal.grid_cell(v_lat, v_lng);

  -- O protocolo só nasce junto com a gravação completa.
  v_protocol := internal.next_protocol();

  insert into public.reports (
    submission_id, protocol, origin, location_lat, location_lng, cell_ix, cell_iy,
    neighborhood_id, category_id, description,
    focus_location, focus_location_other, water_present, containers, larvae,
    noticed_since, other_evidence)
  values (
    v_sub, v_protocol, 'cidadao', v_lat, v_lng, v_cell.ix, v_cell.iy,
    (p ->> 'neighborhood_id')::bigint, (p ->> 'category_id')::smallint, p ->> 'description',
    nullif(p ->> 'focus_location', '')::public.focus_location,
    nullif(p ->> 'focus_location_other', ''),
    (p ->> 'water_present')::boolean,
    coalesce((select array_agg(x) from jsonb_array_elements_text(
      case when jsonb_typeof(p -> 'containers') = 'array' then p -> 'containers' else '[]'::jsonb end) x), '{}'),
    nullif(p ->> 'larvae', '')::public.larvae_answer,
    nullif(p ->> 'noticed_since', ''), nullif(p ->> 'other_evidence', ''))
  returning id into v_report_id;

  insert into public.report_private (
    report_id, name, email, phone, address, reference, confirmed_channel, confirmed_contact)
  values (
    v_report_id, p ->> 'name', lower(p ->> 'email'), p ->> 'phone', p ->> 'address',
    nullif(p ->> 'reference', ''), v_channel, v_contact);

  for v_i in 1 .. cardinality(v_photos) loop
    insert into public.report_photos (report_id, position, original_path)
    values (v_report_id, v_i, v_photos[v_i]);
  end loop;

  insert into public.report_events (report_id, event_type) values (v_report_id, 'recebida');

  return jsonb_build_object(
    'report_id', v_report_id, 'protocol', v_protocol,
    'already_existed', false, 'publication', 'pendente');
end;
$$;

-- ---------------------------------------------------------------------
-- api_publish_report: cria (ou atualiza) a versão pública da denúncia.
-- Roda depois que as fotos tratadas (sem EXIF) foram para o bucket público.
--
-- Regra de ouro (PRD 10.2): uma tarefa de publicação ANTIGA nunca desfaz um
-- arquivamento. Por isso, denúncia arquivada NÃO é publicada por aqui; só a
-- ação explícita "voltar ao mapa" (migration 6) a devolve.
--
-- Saída: { published: true|false, reason? }
-- ---------------------------------------------------------------------
create or replace function public.api_publish_report(p_report_id uuid, p_photo_paths jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  r        public.reports%rowtype;
  v_paths  text[];
begin
  -- "for update" trava a linha: publicar e arquivar ao mesmo tempo ficam em fila.
  select * into r from public.reports where id = p_report_id for update;
  if not found then
    raise exception 'denuncia_nao_encontrada';
  end if;

  if r.publication = 'arquivada' then
    return jsonb_build_object('published', false, 'reason', 'arquivada');
  end if;

  if jsonb_typeof(p_photo_paths) is distinct from 'array' then
    raise exception 'fotos_invalidas';
  end if;
  select coalesce(array_agg(x order by ord), '{}') into v_paths
    from jsonb_array_elements_text(p_photo_paths) with ordinality as t(x, ord);
  if cardinality(v_paths) > 3 then
    raise exception 'fotos_invalidas';
  end if;

  -- Cria/atualiza a linha pública (sem ponto exato) e guarda o caminho de cada foto.
  perform internal.upsert_public_report(r.id, v_paths);

  -- Só registra a decisão (e muda a versão) na primeira publicação.
  if r.publication = 'pendente' then
    update public.reports
       set publication = 'publicada', publication_version = publication_version + 1,
           updated_at = now()
     where id = r.id;
    insert into public.report_events (report_id, event_type) values (r.id, 'publicada');
  end if;

  return jsonb_build_object('published', true);
end;
$$;

-- Só a chave de serviço executa. Revogamos de todos e liberamos para um.
revoke all on function public.api_save_report(jsonb) from public, anon, authenticated;
revoke all on function public.api_publish_report(uuid, jsonb) from public, anon, authenticated;
grant execute on function public.api_save_report(jsonb) to service_role;
grant execute on function public.api_publish_report(uuid, jsonb) to service_role;
