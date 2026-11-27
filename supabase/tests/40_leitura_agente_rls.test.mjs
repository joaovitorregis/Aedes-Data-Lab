// Testes de leitura: RLS das tabelas operacionais e funções de leitura do agente
// (ocorrências próximas num raio de 150 m e resumo da fila).
import { criarBanco, como, esperaErro, teste, igual, verdade, api, randomUUID, criarAgente, novaDenuncia } from './helpers.mjs';

const db = await criarBanco();
const agente = await criarAgente(db);
const inativo = await criarAgente(db, { ativo: false, nome: 'Agente Revogado' });
const comum = randomUUID(); // usuário logado SEM perfil de agente
await db.query('insert into auth.users (id, email) values ($1, $2)', [comum, 'comum@teste']);

const a = await novaDenuncia(db, { publicar: true });
const b = await novaDenuncia(db, { extra: { lat: -7.4105 + 0.0009 } });           // ~100 m ao norte
const c = await novaDenuncia(db, { extra: { lat: -7.4105 + 0.0045 } });           // ~500 m
await db.query("insert into public.report_private (report_id, name, email, phone, address, confirmed_channel, confirmed_contact) select id,'x','x@x.com','81999990000','rua x','email','x@x.com' from public.reports where false");

// ---------- RLS: quem lê as tabelas operacionais ----------
for (const t of ['reports', 'report_private', 'report_photos', 'report_visits', 'report_events']) {
  await teste(`agente ativo LÊ ${t}`, async () => {
    const r = await como(db, 'authenticated', agente, `select count(*)::int n from public.${t}`);
    if (t === 'report_visits') igual(r.rows[0].n, 0); else verdade(r.rows[0].n > 0, `${t} deveria ter linhas`);
  });
  await teste(`usuário logado SEM papel de agente vê ZERO linhas em ${t}`, async () => {
    igual((await como(db, 'authenticated', comum, `select count(*)::int n from public.${t}`)).rows[0].n, 0);
  });
  await teste(`agente REVOGADO vê ZERO linhas em ${t}`, async () => {
    igual((await como(db, 'authenticated', inativo, `select count(*)::int n from public.${t}`)).rows[0].n, 0);
  });
}

await teste('ninguém grava direto nas tabelas (nem agente logado): insert/update/delete negados', async () => {
  for (const sql of [
    "insert into public.reports (submission_id) values (gen_random_uuid())",
    "update public.reports set stage = 'atendida'",
    'delete from public.reports',
    "update public.public_reports set description = 'x'",
    'delete from public.public_reports',
  ]) {
    const msg = await esperaErro(db, 'authenticated', agente, sql);
    verdade(/permission denied/i.test(msg), `${sql}: ${msg}`);
  }
});

await teste('perfil: usuário só lê o PRÓPRIO perfil', async () => {
  const r = await como(db, 'authenticated', agente, 'select id from public.profiles');
  igual(r.rows.map((x) => x.id), [agente]);
});

await teste('bairros e categorias: leitura pública; escrita negada', async () => {
  igual((await como(db, 'anon', null, 'select count(*)::int n from public.neighborhoods')).rows[0].n, 16);
  verdade((await como(db, 'anon', null, 'select count(*)::int n from public.categories')).rows[0].n > 0);
  const msg = await esperaErro(db, 'anon', null, "insert into public.neighborhoods (name) values ('Invasão')");
  verdade(/permission denied/i.test(msg), msg);
});

// ---------- fotos originais no Storage ----------
await teste('fotos originais (bucket privado): só agente ativo lê; visitante não', async () => {
  await db.query("insert into storage.objects (bucket_id, name) values ('fotos-originais', 'orig/z.jpg')");
  igual((await como(db, 'authenticated', agente, "select count(*)::int n from storage.objects where bucket_id='fotos-originais'")).rows[0].n, 1);
  igual((await como(db, 'authenticated', comum, "select count(*)::int n from storage.objects where bucket_id='fotos-originais'")).rows[0].n, 0);
  igual((await como(db, 'anon', null, "select count(*)::int n from storage.objects where bucket_id='fotos-originais'")).rows[0].n, 0);
});

await teste('bucket público: ninguém LISTA os arquivos (sem política de leitura em storage.objects)', async () => {
  await db.query("insert into storage.objects (bucket_id, name) values ('fotos-publicas', 'pub/z.jpg')");
  igual((await como(db, 'anon', null, "select count(*)::int n from storage.objects where bucket_id='fotos-publicas'")).rows[0].n, 0);
});

// ---------- ocorrências próximas (150 m) ----------
await teste('ocorrências próximas: só as dentro de 150 m, sem a própria', async () => {
  const r = await como(db, 'authenticated', agente, 'select public.agent_nearby_reports($1) as r', [a.id]);
  const lista = r.rows[0].r;
  igual(lista.map((x) => x.report_id), [b.id]);
  verdade(lista[0].distance_m > 50 && lista[0].distance_m < 150, `distância ${lista[0].distance_m}`);
  for (const k of ['protocol', 'received_at', 'stage']) verdade(k in lista[0], `falta ${k}`);
  for (const proibida of ['name', 'email', 'phone', 'address', 'location_lat']) verdade(!(proibida in lista[0]), `${proibida} vazou`);
});

await teste('ocorrências próximas: usuário sem papel de agente é recusado; visitante nem executa', async () => {
  const m1 = await esperaErro(db, 'authenticated', comum, 'select public.agent_nearby_reports($1)', [a.id]);
  verdade(m1.includes('nao_autorizado'), m1);
  const m2 = await esperaErro(db, 'anon', null, 'select public.agent_nearby_reports($1)', [a.id]);
  verdade(/permission denied/i.test(m2), m2);
});

// ---------- resumo da fila ----------
await teste('resumo da fila: conta recebidas, em análise e em análise com tentativa sem acesso', async () => {
  const d = await novaDenuncia(db);
  await api(db, 'api_start_analysis', agente, d.id, 1);
  const r = (await como(db, 'authenticated', agente, 'select public.agent_queue_summary() as r')).rows[0].r;
  verdade(r.recebida >= 3, `recebida ${r.recebida}`);
  igual(r.em_analise, 1);
  igual(r.em_analise_sem_acesso, 0);
  const m = await esperaErro(db, 'authenticated', comum, 'select public.agent_queue_summary()');
  verdade(m.includes('nao_autorizado'), m);
});

await teste('resumo da fila respeita o filtro de bairro', async () => {
  const r = (await como(db, 'authenticated', agente, 'select public.agent_queue_summary(2) as r')).rows[0].r;
  igual([r.recebida, r.em_analise], [0, 0]);
});
