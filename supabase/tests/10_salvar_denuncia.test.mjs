// Testes de api_save_report (gravar denúncia) e api_publish_report (publicar no mapa).
import { criarBanco, como, esperaErro, teste, igual, verdade, payloadValido, confirmarContato, api, randomUUID } from './helpers.mjs';

const db = await criarBanco();
const q = async (sql, p = []) => (await db.query(sql, p)).rows;

// ---------- quem pode chamar ----------
await teste('visitante (anon) NÃO pode chamar api_save_report', async () => {
  const p = payloadValido();
  const msg = await esperaErro(db, 'anon', null, 'select public.api_save_report($1::jsonb)', [JSON.stringify(p)]);
  verdade(/permission denied|permiss/i.test(msg), msg);
});

await teste('usuário logado (authenticated) NÃO pode chamar api_save_report', async () => {
  const p = payloadValido();
  const msg = await esperaErro(db, 'authenticated', randomUUID(), 'select public.api_save_report($1::jsonb)', [JSON.stringify(p)]);
  verdade(/permission denied|permiss/i.test(msg), msg);
});

// ---------- gravação ----------
await teste('grava a denúncia válida: protocolo, etapa recebida, publicação pendente', async () => {
  const p = payloadValido();
  await confirmarContato(db, p.submission_id, p.email);
  const r = await api(db, 'api_save_report', p);
  verdade(/^AED-\d{4}-\d{6}$/.test(r.protocol), `protocolo ${r.protocol}`);
  igual(r.already_existed, false);
  const [rep] = await q('select stage, publication, origin, version from public.reports where id = $1', [r.report_id]);
  igual(rep, { stage: 'recebida', publication: 'pendente', origin: 'cidadao', version: 1 });
  igual((await q('select count(*)::int n from public.report_photos where report_id = $1', [r.report_id]))[0].n, 2);
  igual((await q('select email from public.report_private where report_id = $1', [r.report_id]))[0].email, 'maria@exemplo.com');
  igual((await q("select count(*)::int n from public.report_events where report_id = $1 and event_type = 'recebida'", [r.report_id]))[0].n, 1);
});

await teste('calcula a célula da grade de 200 m no servidor', async () => {
  const p = payloadValido();
  await confirmarContato(db, p.submission_id, p.email);
  const r = await api(db, 'api_save_report', p);
  const [rep] = await q('select cell_ix, cell_iy from public.reports where id = $1', [r.report_id]);
  const [g] = await q('select ix, iy from internal.grid_cell($1, $2)', [p.lat, p.lng]);
  igual([rep.cell_ix, rep.cell_iy], [g.ix, g.iy]);
});

await teste('reenvio do MESMO submission_id não duplica e devolve o mesmo protocolo', async () => {
  const p = payloadValido();
  await confirmarContato(db, p.submission_id, p.email);
  const a = await api(db, 'api_save_report', p);
  const b = await api(db, 'api_save_report', p);
  igual(b.protocol, a.protocol);
  igual(b.report_id, a.report_id);
  igual(b.already_existed, true);
  igual((await q('select count(*)::int n from public.reports where submission_id = $1', [p.submission_id]))[0].n, 1);
});

// ---------- recusas ----------
await teste('recusa se o contato NÃO foi confirmado por código', async () => {
  const p = payloadValido();
  const msg = await esperaErro(db, 'service_role', null, 'select public.api_save_report($1::jsonb)', [JSON.stringify(p)]);
  verdade(msg.includes('contato_nao_confirmado'), msg);
});

await teste('recusa se o contato enviado é diferente do que foi confirmado', async () => {
  const p = payloadValido();
  await confirmarContato(db, p.submission_id, 'outro@exemplo.com');
  const msg = await esperaErro(db, 'service_role', null, 'select public.api_save_report($1::jsonb)', [JSON.stringify(p)]);
  verdade(msg.includes('contato_nao_confirmado'), msg);
});

await teste('recusa ponto fora do território', async () => {
  const p = payloadValido({ lat: -23.55, lng: -46.63 });
  await confirmarContato(db, p.submission_id, p.email);
  const msg = await esperaErro(db, 'service_role', null, 'select public.api_save_report($1::jsonb)', [JSON.stringify(p)]);
  verdade(msg.includes('fora_do_territorio'), msg);
});

await teste('recusa zero fotos e mais de três fotos', async () => {
  for (const fotos of [[], ['a', 'b', 'c', 'd']]) {
    const p = payloadValido({ photos: fotos });
    await confirmarContato(db, p.submission_id, p.email);
    const msg = await esperaErro(db, 'service_role', null, 'select public.api_save_report($1::jsonb)', [JSON.stringify(p)]);
    verdade(msg.includes('fotos_invalidas'), msg);
  }
});

await teste('recusa dados inválidos (telefone com letras) e não deixa nada pela metade', async () => {
  const p = payloadValido({ phone: 'abc' });
  await confirmarContato(db, p.submission_id, p.email);
  const msg = await esperaErro(db, 'service_role', null, 'select public.api_save_report($1::jsonb)', [JSON.stringify(p)]);
  verdade(/phone/i.test(msg), `esperava erro do telefone, veio: ${msg}`);
  igual((await q('select count(*)::int n from public.reports where submission_id = $1', [p.submission_id]))[0].n, 0);
});

// ---------- publicação ----------
await teste('publica: cria a versão pública SEM ponto exato, protocolo ou dados pessoais', async () => {
  const p = payloadValido();
  await confirmarContato(db, p.submission_id, p.email);
  const r = await api(db, 'api_save_report', p);
  const pub = await api(db, 'api_publish_report', r.report_id, ['pub/a.jpg', 'pub/b.jpg']);
  igual(pub.published, true);
  const [linha] = await q('select * from public.public_reports where report_id = $1', [r.report_id]);
  igual(linha.photo_paths, ['pub/a.jpg', 'pub/b.jpg']);
  igual(linha.origin, 'cidadao');
  verdade(Math.abs(linha.cell_center_lat - p.lat) < 0.0025, 'centro da célula perto do ponto');
  verdade(linha.cell_center_lat !== p.lat, 'o centro NÃO pode ser o ponto exato');
  const colunas = Object.keys(linha);
  for (const proibida of ['protocol', 'location_lat', 'location_lng', 'author_id', 'name', 'email', 'phone', 'address']) {
    verdade(!colunas.includes(proibida), `public_reports não pode ter ${proibida}`);
  }
  igual((await q('select publication from public.reports where id = $1', [r.report_id]))[0].publication, 'publicada');
});

await teste('publicar de novo não duplica nem dá erro', async () => {
  const p = payloadValido();
  await confirmarContato(db, p.submission_id, p.email);
  const r = await api(db, 'api_save_report', p);
  await api(db, 'api_publish_report', r.report_id, ['pub/a.jpg']);
  const again = await api(db, 'api_publish_report', r.report_id, ['pub/a.jpg']);
  igual(again.published, true);
  igual((await q('select count(*)::int n from public.public_reports where report_id = $1', [r.report_id]))[0].n, 1);
});

await teste('visitante lê o mapa, mas NÃO lê as tabelas privadas', async () => {
  igual((await como(db, 'anon', null, 'select count(*)::int n from public.public_reports')).rows[0].n > 0, true);
  for (const t of ['reports', 'report_private', 'report_photos', 'report_visits', 'report_events', 'contact_verifications', 'rate_limits']) {
    const msg = await esperaErro(db, 'anon', null, `select * from public.${t}`);
    verdade(/permission denied/i.test(msg), `${t}: ${msg}`);
  }
});
