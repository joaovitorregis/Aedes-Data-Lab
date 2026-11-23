// =====================================================================
// Ajudas compartilhadas pelos testes: criar o banco, trocar de papel, asserções.
//
// Como usar (na pasta supabase/tests):
//   npm install        (uma vez; instala o PGlite)
//   npm test
//
// O que faz:
//   1. Cria um banco vazio e instala a simulação do Supabase (stubs_supabase.sql).
//   2. Aplica TODAS as migrations de supabase/migrations, em ordem.
//   3. Roda os testes de cada arquivo *.test.mjs desta pasta.
// =====================================================================
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';

const aqui = dirname(fileURLToPath(import.meta.url));
// PGLITE_PATH deixa rodar mesmo sem "npm install" nesta pasta (uso em CI/automação).
const { PGlite } = await import(process.env.PGLITE_PATH ?? '@electric-sql/pglite');

export async function criarBanco({ comSeed = false } = {}) {
  const db = new PGlite();
  await db.exec(readFileSync(join(aqui, 'stubs_supabase.sql'), 'utf8'));
  const pasta = join(aqui, '..', 'migrations');
  for (const arq of readdirSync(pasta).filter((f) => f.endsWith('.sql')).sort()) {
    try {
      await db.exec(readFileSync(join(pasta, arq), 'utf8'));
    } catch (e) {
      throw new Error(`Falha na migration ${arq}: ${e.message}`);
    }
  }
  if (comSeed) await db.exec(readFileSync(join(aqui, '..', 'seed.sql'), 'utf8'));
  return db;
}

// Executa SQL "como" um papel. Ex.: await como(db, 'anon', null, 'select 1')
// Sempre volta ao papel de dono no fim, mesmo se der erro.
export async function como(db, papel, usuario, sql, params = []) {
  await db.exec(`reset role; select set_config('request.jwt.claim.sub', '${usuario ?? ''}', false); set role ${papel};`);
  try {
    return await db.query(sql, params);
  } finally {
    await db.exec('reset role;');
  }
}

// Espera que o SQL FALHE. Devolve a mensagem de erro, ou lança se passar.
export async function esperaErro(db, papel, usuario, sql, params = []) {
  try {
    await como(db, papel, usuario, sql, params);
  } catch (e) {
    return e.message;
  }
  throw new Error(`Deveria ter falhado, mas passou: ${sql}`);
}

let total = 0, falhas = 0;
export async function teste(nome, fn) {
  total++;
  try {
    await fn();
    console.log(`  ok   ${nome}`);
  } catch (e) {
    falhas++;
    console.log(`  FALHA ${nome}\n        ${e.message}`);
  }
}
export function igual(a, b, msg = '') {
  if (JSON.stringify(a) !== JSON.stringify(b)) throw new Error(`${msg} esperado ${JSON.stringify(b)}, veio ${JSON.stringify(a)}`);
}
export function verdade(c, msg = 'condição falsa') { if (!c) throw new Error(msg); }


// ---------------------------------------------------------------------
// Dados de apoio para os testes de denúncia
// ---------------------------------------------------------------------
import { randomUUID } from 'node:crypto';
export { randomUUID };

// Denúncia válida de cidadão. Cada teste muda só o que quer testar.
export function payloadValido(extra = {}) {
  return {
    submission_id: randomUUID(),
    lat: -7.4105, lng: -35.1052,
    neighborhood_id: 1, category_id: 1,
    description: 'Pneus com água parada no quintal ao lado.',
    focus_location: 'terreno_baldio', water_present: true,
    containers: ['pneus'], larvae: 'nao_sei',
    noticed_since: 'uma semana',
    name: 'Maria da Silva', email: 'maria@exemplo.com', phone: '81999998888',
    address: 'Rua das Flores, 120', reference: 'perto da padaria',
    confirmed_channel: 'email', confirmed_contact: 'maria@exemplo.com',
    photos: ['orig/a.jpg', 'orig/b.jpg'],
    ...extra,
  };
}

// Simula o cidadão ter digitado o código certo (linha confirmada em contact_verifications).
export async function confirmarContato(db, submissionId, contato, canal = 'email') {
  await db.query(
    `insert into public.contact_verifications (purpose, subject, channel, contact, code_hash, expires_at, confirmed_at)
     values ('envio', $1, $2, lower($3), 'hash', now() + interval '10 minutes', now())`,
    [submissionId, canal, contato]);
}

// Cria um usuário (agente ativo ou não) e devolve o id.
export async function criarAgente(db, { ativo = true, nome = 'Agente Teste' } = {}) {
  const id = randomUUID();
  await db.query('insert into auth.users (id, email) values ($1, $2)', [id, `${id}@agente.teste`]);
  await db.query('insert into public.profiles (id, display_name, active) values ($1, $2, $3)', [id, nome, ativo]);
  return id;
}

// Chama uma função api_* como service_role, passando um jsonb.
export async function api(db, fn, ...args) {
  const marcas = args.map((_, i) => `$${i + 1}`).join(', ');
  const r = await como(db, 'service_role', null, `select public.${fn}(${marcas}) as r`,
    args.map((a) => (typeof a === 'object' && a !== null ? JSON.stringify(a) : a)));
  return r.rows[0].r;
}

// Cria uma denúncia de cidadão pronta (gravada e, se pedido, publicada). Devolve { id, protocol, version }.
export async function novaDenuncia(db, { publicar = false, extra = {} } = {}) {
  const p = payloadValido(extra);
  await confirmarContato(db, p.submission_id, p.confirmed_contact);
  const r = await api(db, 'api_save_report', p);
  if (publicar) await api(db, 'api_publish_report', r.report_id, ['pub/1.jpg', 'pub/2.jpg']);
  return { id: r.report_id, protocol: r.protocol };
}

// Data de hoje no fuso de Recife (a mesma regra que o banco usa), como texto AAAA-MM-DD.
export async function hojeRecife(db, somaDias = 0) {
  const r = await db.query(`select ((now() at time zone 'America/Recife')::date + $1::int)::text d`, [somaDias]);
  return r.rows[0].d;
}

// Visita COM acesso válida; cada teste muda o que quer.
export async function visitaValida(db, extra = {}) {
  return {
    id: randomUUID(), visited_on: await hojeRecife(db), access: 'com_acesso',
    focus_location: 'residencia', water_present: true, containers: ['pneus'],
    larvae: 'sim', actions: ['orientacao'], notes: 'Moradora colaborou.', ...extra,
  };
}

export function resumo() {
  console.log(`\n${total - falhas}/${total} testes passaram`);
  return falhas;
}
