// Testes das ações do agente: análise, visita, observação, encerrar, arquivar, voltar ao mapa,
// e registro de foco em local sem denúncia.
import { criarBanco, como, esperaErro, teste, igual, verdade, payloadValido, api, randomUUID,
         criarAgente, novaDenuncia, hojeRecife, visitaValida } from './helpers.mjs';

const db = await criarBanco();
const q = async (sql, p = []) => (await db.query(sql, p)).rows;
const erro = (fn, ...args) => {
  const marcas = args.map((_, i) => `$${i + 1}`).join(', ');
  return esperaErro(db, 'service_role', null, `select public.${fn}(${marcas})`,
    args.map((a) => (typeof a === 'object' && a !== null ? JSON.stringify(a) : a)));
};
const agente = await criarAgente(db);
const inativo = await criarAgente(db, { ativo: false, nome: 'Agente Revogado' });

// Leva uma denúncia até "em análise" e devolve a versão atual.
async function emAnalise(opts) {
  const d = await novaDenuncia(db, opts);
  await api(db, 'api_start_analysis', agente, d.id, 1);
  return { ...d, version: 2 };
}

// ---------- quem pode ----------
await teste('visitante e usuário logado NÃO chamam ações do agente', async () => {
  const d = await novaDenuncia(db);
  for (const papel of ['anon', 'authenticated']) {
    const msg = await esperaErro(db, papel, agente, 'select public.api_start_analysis($1, $2, 1)', [agente, d.id]);
    verdade(/permission denied/i.test(msg), msg);
  }
});

await teste('conta sem papel de agente ou revogada é recusada (nao_autorizado)', async () => {
  const d = await novaDenuncia(db);
  const msg1 = await erro('api_start_analysis', randomUUID(), d.id, 1);
  verdade(msg1.includes('nao_autorizado'), msg1);
  const msg2 = await erro('api_start_analysis', inativo, d.id, 1);
  verdade(msg2.includes('nao_autorizado'), msg2);
});

// ---------- iniciar análise ----------
await teste('iniciar análise: recebida -> em análise, versão sobe, evento com autor', async () => {
  const d = await novaDenuncia(db);
  const r = await api(db, 'api_start_analysis', agente, d.id, 1);
  igual([r.changed, r.stage, r.version], [true, 'em_analise', 2]);
  const ev = await q("select author_id from public.report_events where report_id=$1 and event_type='analise_iniciada'", [d.id]);
  igual(ev.length, 1);
  igual(ev[0].author_id, agente);
});

await teste('clique repetido em iniciar análise não duplica o evento', async () => {
  const d = await novaDenuncia(db);
  await api(db, 'api_start_analysis', agente, d.id, 1);
  const again = await api(db, 'api_start_analysis', agente, d.id, 1);
  igual(again.changed, false);
  igual((await q("select count(*)::int n from public.report_events where report_id=$1 and event_type='analise_iniciada'", [d.id]))[0].n, 1);
});

await teste('tela desatualizada (versão errada) é recusada', async () => {
  const d = await novaDenuncia(db);
  const msg = await erro('api_start_analysis', agente, d.id, 99);
  verdade(msg.includes('versao_desatualizada'), msg);
});

await teste('etapa mostrada no mapa acompanha a mudança de etapa', async () => {
  const d = await novaDenuncia(db, { publicar: true });
  await api(db, 'api_start_analysis', agente, d.id, 1);
  igual((await q('select stage from public.public_reports where report_id=$1', [d.id]))[0].stage, 'em_analise');
});

// ---------- visita ----------
await teste('visita COM acesso: etapa vira atendida e o mapa acompanha', async () => {
  const d = await emAnalise({ publicar: true });
  const v = await visitaValida(db);
  const r = await api(db, 'api_register_visit', agente, d.id, d.version, v);
  igual([r.stage, r.already_existed], ['atendida', false]);
  igual((await q('select stage from public.public_reports where report_id=$1', [d.id]))[0].stage, 'atendida');
  igual((await q('select author_id from public.report_visits where id=$1', [v.id]))[0].author_id, agente);
});

await teste('visita SEM acesso: continua em análise e soma uma tentativa', async () => {
  const d = await emAnalise();
  const v = await visitaValida(db, { access: 'fechado', focus_location: null, water_present: null, containers: [], larvae: null, actions: [] });
  const r = await api(db, 'api_register_visit', agente, d.id, d.version, v);
  igual([r.stage, r.failed_attempts], ['em_analise', 1]);
});

await teste('reenvio da MESMA visita (mesmo id) não duplica nem soma tentativa', async () => {
  const d = await emAnalise();
  const v = await visitaValida(db, { access: 'recusado', focus_location: null, water_present: null, containers: [], larvae: null, actions: [] });
  await api(db, 'api_register_visit', agente, d.id, d.version, v);
  const again = await api(db, 'api_register_visit', agente, d.id, d.version, v);
  igual(again.already_existed, true);
  igual((await q('select count(*)::int n from public.report_visits where report_id=$1', [d.id]))[0].n, 1);
  igual((await q('select failed_attempts from public.reports where id=$1', [d.id]))[0].failed_attempts, 1);
});

await teste('visita só em ocorrência em análise (recebida é recusada)', async () => {
  const d = await novaDenuncia(db);
  const msg = await erro('api_register_visit', agente, d.id, 1, await visitaValida(db));
  verdade(msg.includes('etapa_invalida'), msg);
});

await teste('data da visita: futura e anterior ao recebimento são recusadas', async () => {
  const d = await emAnalise();
  for (const dias of [1, -2]) {
    const v = await visitaValida(db, { visited_on: await hojeRecife(db, dias) });
    const msg = await erro('api_register_visit', agente, d.id, d.version, v);
    verdade(msg.includes('data_invalida'), `${dias}: ${msg}`);
  }
});

await teste('visita com acesso incompleta (sem larvas) ou com água sem recipiente é recusada pelo banco', async () => {
  const d = await emAnalise();
  const m1 = await erro('api_register_visit', agente, d.id, d.version, await visitaValida(db, { larvae: null }));
  verdade(/visits_with_access_complete/.test(m1), m1);
  const m2 = await erro('api_register_visit', agente, d.id, d.version, await visitaValida(db, { containers: [] }));
  verdade(/visits_water_needs_container/.test(m2), m2);
  igual((await q('select stage from public.reports where id=$1', [d.id]))[0].stage, 'em_analise');
});

await teste('Atendida não reabre nem aceita nova visita', async () => {
  const d = await emAnalise();
  await api(db, 'api_register_visit', agente, d.id, d.version, await visitaValida(db));
  const msg = await erro('api_register_visit', agente, d.id, 3, await visitaValida(db));
  verdade(msg.includes('etapa_invalida'), msg);
});

// ---------- observação ----------
await teste('observação: só em análise, guarda autor, não muda a etapa', async () => {
  const d = await emAnalise();
  await api(db, 'api_add_note', agente, d.id, 'Voltar na sexta, morador viajou.');
  const ev = await q("select author_id, reason from public.report_events where report_id=$1 and event_type='observacao'", [d.id]);
  igual(ev, [{ author_id: agente, reason: 'Voltar na sexta, morador viajou.' }]);
  igual((await q('select stage from public.reports where id=$1', [d.id]))[0].stage, 'em_analise');
  const r = await novaDenuncia(db);
  const msg = await erro('api_add_note', agente, r.id, 'texto');
  verdade(msg.includes('etapa_invalida'), msg);
});

// ---------- encerrar sem acesso ----------
await teste('encerrar sem acesso: exige 3 tentativas; depois vira encerrada; não reabre', async () => {
  const d = await emAnalise({ publicar: true });
  const sem = async () => visitaValida(db, { access: 'nao_localizado', focus_location: null, water_present: null, containers: [], larvae: null, actions: [] });
  let ver = d.version;
  for (let i = 1; i <= 2; i++) { const r = await api(db, 'api_register_visit', agente, d.id, ver, await sem()); ver = r.version; }
  const msg = await erro('api_close_without_access', agente, d.id, ver);
  verdade(msg.includes('tentativas_insuficientes'), msg);
  const r3 = await api(db, 'api_register_visit', agente, d.id, ver, await sem());
  const fim = await api(db, 'api_close_without_access', agente, d.id, r3.version);
  igual([fim.changed, fim.stage], [true, 'encerrada']);
  igual((await q('select stage from public.public_reports where report_id=$1', [d.id]))[0].stage, 'encerrada');
  const again = await api(db, 'api_close_without_access', agente, d.id, r3.version);
  igual(again.changed, false);
  igual((await q("select count(*)::int n from public.report_events where report_id=$1 and event_type='encerrada_sem_acesso'", [d.id]))[0].n, 1);
  const m2 = await erro('api_register_visit', agente, d.id, fim.version, await sem());
  verdade(m2.includes('etapa_invalida'), m2);
});

// ---------- arquivar ----------
await teste('arquivar exige motivo e confirmação', async () => {
  const d = await novaDenuncia(db, { publicar: true });
  const m1 = await erro('api_archive_report', agente, d.id, '   ', true);
  verdade(m1.includes('motivo_obrigatorio'), m1);
  const m2 = await erro('api_archive_report', agente, d.id, 'denúncia falsa', false);
  verdade(m2.includes('confirmacao_obrigatoria'), m2);
});

await teste('arquivar recebida: vira encerrada, sai do mapa, devolve fotos públicas a apagar', async () => {
  const d = await novaDenuncia(db, { publicar: true });
  const r = await api(db, 'api_archive_report', agente, d.id, 'denúncia falsa', true);
  igual(r.already_archived, false);
  igual(r.public_photo_paths, ['pub/1.jpg', 'pub/2.jpg']);
  const [rep] = await q('select stage, publication, archive_reason from public.reports where id=$1', [d.id]);
  igual(rep, { stage: 'encerrada', publication: 'arquivada', archive_reason: 'denúncia falsa' });
  igual((await q('select count(*)::int n from public.public_reports where report_id=$1', [d.id]))[0].n, 0);
  igual((await como(db, 'anon', null, 'select count(*)::int n from public.public_reports where report_id=$1', [d.id])).rows[0].n, 0);
});

await teste('arquivar repetido não duplica o evento', async () => {
  const d = await novaDenuncia(db, { publicar: true });
  await api(db, 'api_archive_report', agente, d.id, 'motivo', true);
  const again = await api(db, 'api_archive_report', agente, d.id, 'motivo', true);
  igual(again.already_archived, true);
  igual((await q("select count(*)::int n from public.report_events where report_id=$1 and event_type='arquivada'", [d.id]))[0].n, 1);
});

await teste('arquivar atendida mantém a etapa atendida', async () => {
  const d = await emAnalise({ publicar: true });
  await api(db, 'api_register_visit', agente, d.id, d.version, await visitaValida(db));
  await api(db, 'api_archive_report', agente, d.id, 'foto inadequada', true);
  igual((await q('select stage, publication from public.reports where id=$1', [d.id]))[0], { stage: 'atendida', publication: 'arquivada' });
});

await teste('tarefa ANTIGA de publicação não reexibe denúncia arquivada', async () => {
  const d = await novaDenuncia(db);
  await api(db, 'api_archive_report', agente, d.id, 'motivo', true);
  const r = await api(db, 'api_publish_report', d.id, ['pub/x.jpg']);
  igual(r.published, false);
  igual((await q('select count(*)::int n from public.public_reports where report_id=$1', [d.id]))[0].n, 0);
});

await teste('arquivada não aceita visita nem iniciar análise', async () => {
  const d = await novaDenuncia(db);
  await api(db, 'api_archive_report', agente, d.id, 'motivo', true);
  const msg = await erro('api_start_analysis', agente, d.id, 2);
  verdade(msg.includes('etapa_invalida'), msg);
});

await teste('após o arquivamento, limpar caminhos públicos só é aceito em denúncia arquivada', async () => {
  const d = await novaDenuncia(db, { publicar: true });
  const msg = await erro('api_clear_public_photo_paths', d.id);
  verdade(msg.includes('nao_arquivada'), msg);
  await api(db, 'api_archive_report', agente, d.id, 'motivo', true);
  await api(db, 'api_clear_public_photo_paths', d.id);
  igual((await q('select count(*)::int n from public.report_photos where report_id=$1 and public_path is not null', [d.id]))[0].n, 0);
});

// ---------- voltar ao mapa ----------
await teste('voltar ao mapa: dentro de 30 dias, mantém a etapa e registra o evento', async () => {
  const d = await emAnalise({ publicar: true });
  await api(db, 'api_archive_report', agente, d.id, 'revisar', true);
  const r = await api(db, 'api_restore_to_map', agente, d.id, ['pub/n1.jpg']);
  igual(r.restored, true);
  const [rep] = await q('select stage, publication, archived_at from public.reports where id=$1', [d.id]);
  igual([rep.stage, rep.publication, rep.archived_at], ['encerrada', 'publicada', null]);
  igual((await q('select photo_paths from public.public_reports where report_id=$1', [d.id]))[0].photo_paths, ['pub/n1.jpg']);
  igual((await q("select count(*)::int n from public.report_events where report_id=$1 and event_type='voltou_ao_mapa'", [d.id]))[0].n, 1);
});

await teste('voltar ao mapa fora dos 30 dias ou sem estar arquivada é recusado', async () => {
  const d = await novaDenuncia(db);
  const m1 = await erro('api_restore_to_map', agente, d.id, []);
  verdade(m1.includes('nao_arquivada'), m1);
  await api(db, 'api_archive_report', agente, d.id, 'motivo', true);
  await db.query("update public.reports set archived_at = now() - interval '31 days' where id=$1", [d.id]);
  const m2 = await erro('api_restore_to_map', agente, d.id, []);
  verdade(m2.includes('fora_do_prazo'), m2);
});

// ---------- foco em local sem denúncia (RF-AGE-10) ----------
function focoAgente(v, extra = {}) {
  return {
    submission_id: randomUUID(), lat: -7.4120, lng: -35.1040, neighborhood_id: 2, category_id: 1,
    description: 'Calha entupida com água parada.', place_address: 'Rua do Comércio, 45',
    place_reference: 'ao lado da escola', photos: ['orig/ag1.jpg'], visit: v, ...extra,
  };
}

await teste('agente registra foco: nasce atendida, origem agente, com 1 visita, sem dados do morador', async () => {
  const v = await visitaValida(db);
  const r = await api(db, 'api_create_agent_report', agente, focoAgente(v));
  verdade(/^AED-\d{4}-\d{6}$/.test(r.protocol), r.protocol);
  const [rep] = await q('select origin, stage, author_id, publication from public.reports where id=$1', [r.report_id]);
  igual(rep, { origin: 'agente', stage: 'atendida', author_id: agente, publication: 'pendente' });
  igual((await q('select count(*)::int n from public.report_visits where report_id=$1', [r.report_id]))[0].n, 1);
  igual((await q('select count(*)::int n from public.report_private where report_id=$1', [r.report_id]))[0].n, 0);
});

await teste('foco do agente publicado mostra origem agente e NÃO mostra o nome do agente', async () => {
  const r = await api(db, 'api_create_agent_report', agente, focoAgente(await visitaValida(db)));
  await api(db, 'api_publish_report', r.report_id, ['pub/ag.jpg']);
  const [linha] = await q('select * from public.public_reports where report_id=$1', [r.report_id]);
  igual(linha.origin, 'agente');
  verdade(!('author_id' in linha), 'public_reports não pode ter autor');
});

await teste('foco do agente: reenvio não duplica; ponto fora do território e sem foto são recusados', async () => {
  const p = focoAgente(await visitaValida(db));
  const a = await api(db, 'api_create_agent_report', agente, p);
  const b = await api(db, 'api_create_agent_report', agente, p);
  igual([b.report_id, b.already_existed], [a.report_id, true]);
  igual((await q('select count(*)::int n from public.report_visits where report_id=$1', [a.report_id]))[0].n, 1);
  const m1 = await erro('api_create_agent_report', agente, focoAgente(await visitaValida(db), { lat: -23.5, lng: -46.6 }));
  verdade(m1.includes('fora_do_territorio'), m1);
  const m2 = await erro('api_create_agent_report', agente, focoAgente(await visitaValida(db), { photos: [] }));
  verdade(m2.includes('fotos_invalidas'), m2);
});

await teste('só agente cria foco: conta sem papel é recusada', async () => {
  const msg = await erro('api_create_agent_report', randomUUID(), focoAgente(await visitaValida(db)));
  verdade(msg.includes('nao_autorizado'), msg);
});

await teste('histórico (report_events) não pode ser alterado nem pelo dono do banco', async () => {
  const d = await novaDenuncia(db);
  let falhou = false;
  try { await db.query("update public.report_events set reason='x' where report_id=$1", [d.id]); } catch { falhou = true; }
  verdade(falhou, 'update em report_events deveria falhar');
});
