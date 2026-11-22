// Testes de: correção de campos, código de confirmação (wrappers), consulta por protocolo,
// lixeira de 30 dias e remoção definitiva.
import { criarBanco, como, esperaErro, teste, igual, verdade, payloadValido, api, randomUUID,
         criarAgente, novaDenuncia, confirmarContato } from './helpers.mjs';

const db = await criarBanco();
const q = async (sql, p = []) => (await db.query(sql, p)).rows;
const erro = (fn, ...args) => {
  const marcas = args.map((_, i) => `$${i + 1}`).join(', ');
  return esperaErro(db, 'service_role', null, `select public.${fn}(${marcas})`,
    args.map((a) => (typeof a === 'object' && a !== null ? JSON.stringify(a) : a)));
};
const agente = await criarAgente(db);

// ---------- correção pelo agente ----------
await teste('agente corrige descrição: guarda antes/depois/motivo/autor, sobe a versão, mantém etapa e publicação', async () => {
  const d = await novaDenuncia(db, { publicar: true });
  const r = await api(db, 'api_correct_fields_agent', agente, d.id, { description: 'Texto corrigido.' }, 'removido dado pessoal');
  igual(r.version, 2);
  const [rep] = await q('select description, stage, publication from public.reports where id=$1', [d.id]);
  igual(rep, { description: 'Texto corrigido.', stage: 'recebida', publication: 'publicada' });
  const [ev] = await q("select author_id, reason, old_value, new_value from public.report_events where report_id=$1 and event_type='correcao'", [d.id]);
  igual(ev.author_id, agente);
  igual(ev.reason, 'removido dado pessoal');
  igual(ev.old_value, { description: 'Pneus com água parada no quintal ao lado.' });
  igual(ev.new_value, { description: 'Texto corrigido.' });
  igual((await q('select description from public.public_reports where report_id=$1', [d.id]))[0].description, 'Texto corrigido.');
});

await teste('correção exige motivo', async () => {
  const d = await novaDenuncia(db);
  const msg = await erro('api_correct_fields_agent', agente, d.id, { description: 'x' }, '  ');
  verdade(msg.includes('motivo_obrigatorio'), msg);
});

await teste('agente NÃO troca o contato confirmado, mas troca o outro contato', async () => {
  const d = await novaDenuncia(db);
  const msg = await erro('api_correct_fields_agent', agente, d.id, { email: 'novo@exemplo.com' }, 'pedido');
  verdade(msg.includes('contato_confirmado_nao_editavel'), msg);
  await api(db, 'api_correct_fields_agent', agente, d.id, { phone: '81988887777' }, 'telefone digitado errado');
  igual((await q('select phone from public.report_private where report_id=$1', [d.id]))[0].phone, '81988887777');
});

await teste('agente NÃO altera "há quanto tempo percebeu" nem campos desconhecidos', async () => {
  const d = await novaDenuncia(db);
  const m1 = await erro('api_correct_fields_agent', agente, d.id, { noticed_since: 'ontem' }, 'x');
  verdade(m1.includes('campo_nao_editavel'), m1);
  const m2 = await erro('api_correct_fields_agent', agente, d.id, { stage: 'atendida' }, 'x');
  verdade(m2.includes('campo_desconhecido'), m2);
  const m3 = await erro('api_correct_fields_agent', agente, d.id, { protocol: 'AED-2026-000001' }, 'x');
  verdade(m3.includes('campo_desconhecido'), m3);
});

await teste('ponto corrigido passa de novo pela validação de território e recalcula a célula', async () => {
  const d = await novaDenuncia(db, { publicar: true });
  const msg = await erro('api_correct_fields_agent', agente, d.id, { location_lat: -23.5, location_lng: -46.6 }, 'ponto errado');
  verdade(msg.includes('fora_do_territorio'), msg);
  const antes = (await q('select cell_ix, cell_iy from public.reports where id=$1', [d.id]))[0];
  await api(db, 'api_correct_fields_agent', agente, d.id, { location_lat: -7.4300, location_lng: -35.0800 }, 'ponto estava na rua errada');
  const dep = (await q('select cell_ix, cell_iy from public.reports where id=$1', [d.id]))[0];
  verdade(JSON.stringify(antes) !== JSON.stringify(dep), 'célula deveria mudar');
  const pub = (await q('select cell_ix, cell_iy from public.public_reports where report_id=$1', [d.id]))[0];
  igual(pub, dep);
});

await teste('corrigir denúncia arquivada não a devolve ao mapa', async () => {
  const d = await novaDenuncia(db, { publicar: true });
  await api(db, 'api_archive_report', agente, d.id, 'revisar', true);
  await api(db, 'api_correct_fields_agent', agente, d.id, { description: 'Revisada.' }, 'ajuste');
  igual((await q('select publication from public.reports where id=$1', [d.id]))[0].publication, 'arquivada');
  igual((await q('select count(*)::int n from public.public_reports where report_id=$1', [d.id]))[0].n, 0);
});

await teste('só agente corrige pela chamada de agente', async () => {
  const d = await novaDenuncia(db);
  const msg = await erro('api_correct_fields_agent', randomUUID(), d.id, { description: 'x' }, 'motivo');
  verdade(msg.includes('nao_autorizado'), msg);
});

// ---------- correção pelo cidadão ----------
await teste('cidadão corrige enquanto Recebida (inclui "há quanto tempo percebeu")', async () => {
  const d = await novaDenuncia(db);
  await api(db, 'api_correct_fields_citizen', d.id, { noticed_since: 'três dias', name: 'Maria S. Silva' }, 'ajuste do cidadão');
  const [rep] = await q('select noticed_since from public.reports where id=$1', [d.id]);
  igual(rep.noticed_since, 'três dias');
  igual((await q('select name from public.report_private where report_id=$1', [d.id]))[0].name, 'Maria S. Silva');
  const [ev] = await q("select author_id from public.report_events where report_id=$1 and event_type='correcao'", [d.id]);
  igual(ev.author_id, null);
});

await teste('cidadão é recusado depois do início da análise', async () => {
  const d = await novaDenuncia(db);
  await api(db, 'api_start_analysis', agente, d.id, 1);
  const msg = await erro('api_correct_fields_citizen', d.id, { description: 'novo' }, 'motivo');
  verdade(msg.includes('etapa_invalida'), msg);
});

await teste('cidadão também não troca o contato confirmado', async () => {
  const d = await novaDenuncia(db);
  const msg = await erro('api_correct_fields_citizen', d.id, { email: 'outro@exemplo.com' }, 'motivo');
  verdade(msg.includes('contato_confirmado_nao_editavel'), msg);
});

// ---------- acesso à correção: consulta por protocolo ----------
await teste('consulta por protocolo devolve o canal/contato confirmado; protocolo inexistente devolve nulo', async () => {
  const d = await novaDenuncia(db);
  const r = await api(db, 'api_find_report_for_correction', d.protocol);
  igual([r.report_id, r.channel, r.contact], [d.id, 'email', 'maria@exemplo.com']);
  igual(await api(db, 'api_find_report_for_correction', 'AED-2026-999999'), null);
});

await teste('visão do cidadão não traz histórico interno, visitas nem notas', async () => {
  const d = await novaDenuncia(db);
  await api(db, 'api_start_analysis', agente, d.id, 1);
  await api(db, 'api_add_note', agente, d.id, 'nota interna secreta');
  const v = await api(db, 'api_get_report_for_citizen', d.id);
  const txt = JSON.stringify(v);
  verdade(!txt.includes('secreta'), 'nota vazou');
  for (const proibida of ['events', 'visits', 'author_id', 'failed_attempts']) verdade(!(proibida in v), `${proibida} vazou`);
  igual(v.stage, 'em_analise');
  igual(v.description, 'Pneus com água parada no quintal ao lado.');
});

// ---------- código de confirmação ----------
await teste('código: certo confirma; errado 5 vezes invalida o código', async () => {
  const sub = randomUUID();
  igual(await api(db, 'api_start_verification', 'envio', sub, 'email', 'Joao@Exemplo.com', 'hashcerto', 600), true);
  igual(await api(db, 'api_confirm_verification', 'envio', sub, 'joao@exemplo.com', 'hashcerto'), true);
  const sub2 = randomUUID();
  await api(db, 'api_start_verification', 'envio', sub2, 'email', 'ana@exemplo.com', 'certo', 600);
  for (let i = 0; i < 5; i++) igual(await api(db, 'api_confirm_verification', 'envio', sub2, 'ana@exemplo.com', 'errado'), false);
  igual(await api(db, 'api_confirm_verification', 'envio', sub2, 'ana@exemplo.com', 'certo'), false, 'código deveria estar invalidado');
});

await teste('código: pedir novo invalida o anterior', async () => {
  const sub = randomUUID();
  await api(db, 'api_start_verification', 'envio', sub, 'email', 'bia@exemplo.com', 'velho', 600);
  await api(db, 'api_start_verification', 'envio', sub, 'email', 'bia@exemplo.com', 'novo', 600);
  igual(await api(db, 'api_confirm_verification', 'envio', sub, 'bia@exemplo.com', 'velho'), false);
  igual(await api(db, 'api_confirm_verification', 'envio', sub, 'bia@exemplo.com', 'novo'), true);
});

await teste('código: limite de pedidos por contato (6º pedido seguido é recusado)', async () => {
  const resultados = [];
  for (let i = 0; i < 6; i++) {
    resultados.push(await api(db, 'api_start_verification', 'envio', randomUUID(), 'email', 'spam@exemplo.com', `h${i}`, 600));
  }
  igual(resultados, [true, true, true, true, true, false]);
});

await teste('limite de repetição genérico (api_hit_rate_limit)', async () => {
  const k = `teste:${randomUUID()}`;
  igual([await api(db, 'api_hit_rate_limit', k, 2, 60), await api(db, 'api_hit_rate_limit', k, 2, 60), await api(db, 'api_hit_rate_limit', k, 2, 60)], [true, true, false]);
});

// ---------- lixeira ----------
await teste('lixeira: só denúncia arquivada há mais de 30 dias é listada; recente ou não arquivada, não', async () => {
  const velha = await novaDenuncia(db, { publicar: true });
  await api(db, 'api_archive_report', agente, velha.id, 'motivo', true);
  await db.query("update public.reports set archived_at = now() - interval '31 days' where id=$1", [velha.id]);
  const nova = await novaDenuncia(db, { publicar: true });
  await api(db, 'api_archive_report', agente, nova.id, 'motivo', true);
  const normal = await novaDenuncia(db, { publicar: true });
  const lista = await api(db, 'api_trash_due');
  const ids = lista.map((x) => x.report_id);
  verdade(ids.includes(velha.id), 'a velha deveria estar na lista');
  verdade(!ids.includes(nova.id) && !ids.includes(normal.id), 'recente/normal não podem estar');
  const item = lista.find((x) => x.report_id === velha.id);
  igual(item.original_paths.sort(), ['orig/a.jpg', 'orig/b.jpg']);
  igual(item.public_paths.sort(), ['pub/1.jpg', 'pub/2.jpg']);
});

await teste('remoção definitiva apaga TUDO da denúncia (privados, visitas, histórico, códigos)', async () => {
  const d = await novaDenuncia(db, { publicar: true });
  await api(db, 'api_start_analysis', agente, d.id, 1);
  await api(db, 'api_add_note', agente, d.id, 'nota');
  const sub = (await q('select submission_id from public.reports where id=$1', [d.id]))[0].submission_id;
  await api(db, 'api_archive_report', agente, d.id, 'motivo', true);
  await db.query("update public.reports set archived_at = now() - interval '31 days' where id=$1", [d.id]);
  igual((await api(db, 'api_purge_report', d.id)).purged, true);
  for (const t of ['reports', 'report_private', 'report_photos', 'report_events', 'public_reports', 'report_visits']) {
    const col = t === 'reports' ? 'id' : 'report_id';
    igual((await q(`select count(*)::int n from public.${t} where ${col}=$1`, [d.id]))[0].n, 0, t);
  }
  igual((await q('select count(*)::int n from public.contact_verifications where subject=$1', [sub]))[0].n, 0);
});

await teste('remoção definitiva é recusada se não venceu os 30 dias', async () => {
  const d = await novaDenuncia(db);
  const m1 = await erro('api_purge_report', d.id);
  verdade(m1.includes('nao_vencida'), m1);
  await api(db, 'api_archive_report', agente, d.id, 'motivo', true);
  const m2 = await erro('api_purge_report', d.id);
  verdade(m2.includes('nao_vencida'), m2);
});

await teste('fotos públicas de arquivadas que ainda constam no banco são listadas para nova tentativa de remoção', async () => {
  const d = await novaDenuncia(db, { publicar: true });
  await api(db, 'api_archive_report', agente, d.id, 'motivo', true);
  let lista = await api(db, 'api_pending_public_cleanup');
  verdade(lista.some((x) => x.report_id === d.id), 'deveria estar pendente');
  await api(db, 'api_clear_public_photo_paths', d.id);
  lista = await api(db, 'api_pending_public_cleanup');
  verdade(!lista.some((x) => x.report_id === d.id), 'não deveria mais estar pendente');
});

await teste('funções de servidor da migration 7 recusam anon e authenticated', async () => {
  for (const [fn, args] of [['api_trash_due', []], ['api_find_report_for_correction', ['AED-2026-000001']], ['api_hit_rate_limit', ['k', 1, 60]]]) {
    for (const papel of ['anon', 'authenticated']) {
      const marcas = args.map((_, i) => `$${i + 1}`).join(', ');
      const msg = await esperaErro(db, papel, agente, `select public.${fn}(${marcas})`, args);
      verdade(/permission denied/i.test(msg), `${fn}/${papel}: ${msg}`);
    }
  }
});

// ---------- versão esperada (concorrência / autorização de uso único) ----------
await teste('correção do cidadão com versão esperada: certa passa; a MESMA autorização não vale duas vezes', async () => {
  const d = await novaDenuncia(db);
  const msg = await erro('api_correct_fields_citizen', d.id, { description: 'a' }, 'motivo', 5);
  verdade(msg.includes('versao_desatualizada'), msg);
  const r = await api(db, 'api_correct_fields_citizen', d.id, { description: 'b' }, 'motivo', 1);
  igual(r.version, 2);
  const again = await erro('api_correct_fields_citizen', d.id, { description: 'c' }, 'motivo', 1);
  verdade(again.includes('versao_desatualizada'), again);
});

await teste('correção do agente com versão desatualizada é recusada', async () => {
  const d = await novaDenuncia(db);
  const msg = await erro('api_correct_fields_agent', agente, d.id, { description: 'x' }, 'motivo', 9);
  verdade(msg.includes('versao_desatualizada'), msg);
});

// ---------- publicações pendentes (D14: nova tentativa usa o mesmo registro) ----------
await teste('publicações pendentes: lista só as pendentes com mais de 2 minutos, com os originais', async () => {
  const recente = await novaDenuncia(db);
  const velha = await novaDenuncia(db);
  await db.query("update public.reports set received_at = now() - interval '5 minutes' where id=$1", [velha.id]);
  const publicada = await novaDenuncia(db, { publicar: true });
  await db.query("update public.reports set received_at = now() - interval '5 minutes' where id=$1", [publicada.id]);
  const lista = await api(db, 'api_pending_publication');
  const ids = lista.map((x) => x.report_id);
  verdade(ids.includes(velha.id), 'a pendente antiga deveria estar na lista');
  verdade(!ids.includes(recente.id), 'a recente pode ainda estar sendo publicada');
  verdade(!ids.includes(publicada.id), 'a publicada não entra');
  igual(lista.find((x) => x.report_id === velha.id).original_paths, ['orig/a.jpg', 'orig/b.jpg']);
});

// ---------- caminhos das fotos originais (usado ao voltar ao mapa) ----------
await teste('caminhos dos originais voltam na ordem das fotos; só o servidor chama', async () => {
  const d = await novaDenuncia(db);
  igual(await api(db, 'api_get_original_paths', d.id), ['orig/a.jpg', 'orig/b.jpg']);
  const msg = await esperaErro(db, 'authenticated', agente, 'select public.api_get_original_paths($1)', [d.id]);
  verdade(/permission denied/i.test(msg), msg);
  const m2 = await erro('api_get_original_paths', randomUUID());
  verdade(m2.includes('denuncia_nao_encontrada'), m2);
});

// ---------- checagem prévia de "voltar ao mapa" ----------
await teste('checagem prévia de voltar ao mapa: ok dentro do prazo; recusa pendente, vencida e quem não é agente', async () => {
  const publicada = await novaDenuncia(db, { publicar: true });
  igual(await api(db, 'api_check_restore', agente, publicada.id), { ok: true, already: true });

  const pendente = await novaDenuncia(db);
  const m1 = await erro('api_check_restore', agente, pendente.id);
  verdade(m1.includes('nao_arquivada'), m1);

  const arq = await novaDenuncia(db, { publicar: true });
  await api(db, 'api_archive_report', agente, arq.id, 'motivo', true);
  igual(await api(db, 'api_check_restore', agente, arq.id), { ok: true, already: false });
  await db.query("update public.reports set archived_at = now() - interval '31 days' where id=$1", [arq.id]);
  const m2 = await erro('api_check_restore', agente, arq.id);
  verdade(m2.includes('fora_do_prazo'), m2);

  const m3 = await erro('api_check_restore', randomUUID(), arq.id);
  verdade(m3.includes('nao_autorizado'), m3);
});
