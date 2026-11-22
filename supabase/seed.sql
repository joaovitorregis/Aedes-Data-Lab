-- =====================================================================
-- seed.sql: dados FICTÍCIOS para desenvolver e testar telas.
--
-- QUANDO RODA: só no banco LOCAL (comando "supabase db reset", que precisa
-- de Docker) e nos testes automáticos. NUNCA vai para o Supabase na nuvem:
-- "supabase db push --remote" aplica só as migrations, não este arquivo.
-- Mesmo assim, nada aqui é dado real: nomes, e-mails (".invalid" não existe
-- na internet) e telefones são inventados.
--
-- O que cria: 7 denúncias em etapas diferentes, algumas publicadas no mapa.
-- Os bairros já existem (migration 1) e as categorias, na migration 2.
-- =====================================================================

do $$
declare
  v        record;
  v_id     uuid;
  v_cell   record;
  v_pub    text[];
begin
  for v in
    select * from (values
      -- n, lat,      lng,      bairro, categoria, descrição,                                   etapa,        tentativas, publicar
      (1, -7.4105::float8, -35.1052::float8, 1, 1, 'Pneus velhos com água parada no quintal.',        'recebida',   0, true),
      (2, -7.4118::float8, -35.1031::float8, 2, 1, 'Caixa d''água sem tampa no terreno baldio.',      'recebida',   0, true),
      (3, -7.4090::float8, -35.1070::float8, 3, 2, 'Piscina abandonada com água esverdeada.',         'em_analise', 1, true),
      (4, -7.4132::float8, -35.1015::float8, 1, 1, 'Calha entupida acumulando água da chuva.',        'em_analise', 3, true),
      (5, -7.4075::float8, -35.1088::float8, 4, 1, 'Vasos de plantas com pratinho cheio de água.',    'atendida',   0, true),
      (6, -7.4150::float8, -35.1000::float8, 5, 1, 'Entulho com garrafas e lonas acumulando água.',   'encerrada',  3, true),
      (7, -7.4060::float8, -35.1100::float8, 2, 1, 'Denúncia ainda sem publicação no mapa.',          'recebida',   0, false)
    ) as t(n, lat, lng, bairro, categoria, descricao, etapa, tentativas, publicar)
  loop
    select * into v_cell from internal.grid_cell(v.lat, v.lng);

    insert into public.reports (
      submission_id, protocol, origin, location_lat, location_lng, cell_ix, cell_iy,
      neighborhood_id, category_id, description, focus_location, water_present,
      containers, larvae, stage, failed_attempts)
    values (
      gen_random_uuid(), internal.next_protocol(), 'cidadao', v.lat, v.lng, v_cell.ix, v_cell.iy,
      v.bairro, v.categoria, v.descricao, 'terreno_baldio', true,
      array['pneus'], 'nao_sei', v.etapa::public.report_stage, v.tentativas)
    returning id into v_id;

    insert into public.report_private (
      report_id, name, email, phone, address, reference, confirmed_channel, confirmed_contact)
    values (
      v_id, 'Morador Ficticio ' || v.n, 'morador' || v.n || '@exemplo.invalid',
      '8190000000' || v.n, 'Rua Ficticia, ' || (v.n * 10), 'perto do ponto ' || v.n,
      'email', 'morador' || v.n || '@exemplo.invalid');

    insert into public.report_photos (report_id, position, original_path)
    values (v_id, 1, 'seed/original-' || v.n || '.jpg');

    insert into public.report_events (report_id, event_type) values (v_id, 'recebida');

    if v.publicar then
      v_pub := array['seed/publica-' || v.n || '.jpg'];
      update public.reports
         set publication = 'publicada', publication_version = 1
       where id = v_id;
      perform internal.upsert_public_report(v_id, v_pub);
    end if;
  end loop;
end;
$$;
