// Testes de ponta a ponta das Edge Functions, com banco de verdade (ver ambiente.ts).
import assert from "node:assert/strict";
import { criarHandler as enviarCodigo } from "../enviar-codigo/handler.ts";
import { criarHandler as confirmarCodigo } from "../confirmar-codigo/handler.ts";
import { criarHandler as salvarDenuncia } from "../salvar-denuncia/handler.ts";
import { criarHandler as acessoCorrecao } from "../acesso-correcao/handler.ts";
import { criarHandler as agente } from "../agente/handler.ts";
import { criarHandler as rotina } from "../rotina-diaria/handler.ts";
import { codigoDoEmail, criarAmbiente, dadosDenuncia, jpegDeTeste, novoIp, pedidoForm, pedidoJson } from "./ambiente.ts";

const opcoes = { sanitizeOps: false, sanitizeResources: false };
const amb = await criarAmbiente();
const { db, svc, buckets, emails, falhas, tokens } = amb;
const h = {
  enviar: enviarCodigo(svc), confirmar: confirmarCodigo(svc), salvar: salvarDenuncia(svc),
  correcao: acessoCorrecao(svc), agente: agente(svc), rotina: rotina(svc),
};
const uuid = () => crypto.randomUUID();
const publicos = () => [...buckets.get("fotos-publicas")!.keys()];
const originais = () => [...buckets.get("fotos-originais")!.keys()];
const contar = async (sql: string, params: unknown[] = []) => ((await db.query<{ n: number }>(sql, params)).rows[0]).n;

// Agente e usuário comum (sem perfil de agente), com "logins" de teste.
const idAgente = uuid(), idComum = uuid();
await db.query("insert into auth.users (id, email) values ($1,'ag@t'), ($2,'comum@t')", [idAgente, idComum]);
await db.query("insert into public.profiles (id, display_name) values ($1, 'Agente Teste')", [idAgente]);
tokens.set("jwt-agente", idAgente);
tokens.set("jwt-comum", idComum);

// Percorre o fluxo do cidadão: pede código, confirma e envia. Devolve a resposta do envio.
// Cada fluxo usa um e-mail novo: o banco limita a 5 pedidos de código por contato a cada 10 minutos.
let contadorEmail = 0;
async function enviarDenuncia(extraDados: Record<string, unknown> = {}, fotos?: Uint8Array[]) {
  const sid = uuid();
  const ip = novoIp();
  const email = `pessoa${++contadorEmail}@exemplo.com`;
  const rEnv = await h.enviar(pedidoJson({ submission_id: sid, channel: "email", contact: email }, { ip }));
  assert.equal(rEnv.status, 200);
  const cod = codigoDoEmail(emails.at(-1)!.texto);
  const rConf = await h.confirmar(pedidoJson({ submission_id: sid, contact: email, code: cod }, { ip }));
  assert.deepEqual(await rConf.json(), { confirmed: true });
  const dados = dadosDenuncia(sid, { email, confirmed_contact: email, ...extraDados });
  const resp = await h.salvar(pedidoForm({ dados: JSON.stringify(dados) }, fotos ?? [await jpegDeTeste(), await jpegDeTeste()], { ip }));
  return { sid, ip, resp, corpo: await resp.json() };
}

Deno.test("fluxo completo do cidadão: código -> confirmação -> envio -> publicada", opcoes, async () => {
  const antes = publicos().length;
  const { corpo, resp } = await enviarDenuncia();
  assert.equal(resp.status, 201);
  assert.match(corpo.protocol, /^AED-\d{4}-\d{6}$/);
  assert.equal(corpo.publication, "publicada");
  assert.equal(corpo.already_existed, false);
  assert.equal(publicos().length, antes + 2);
  const r = await db.query("select count(*)::int n from public.public_reports where photo_paths <> '{}'");
  assert.ok((r.rows[0] as { n: number }).n >= 1);
});

Deno.test("PRIVACIDADE: a foto pública não tem o EXIF (GPS) da original", opcoes, async () => {
  const comGps = await jpegDeTeste(80, 60, "GPS-SENTINELA-LAT-7.41");
  const { corpo } = await enviarDenuncia({}, [comGps]);
  assert.equal(corpo.publication, "publicada");
  const texto = (b: Uint8Array) => new TextDecoder("latin1").decode(b);
  const orig = [...buckets.get("fotos-originais")!.entries()].find(([, b]) => texto(b).includes("GPS-SENTINELA"));
  assert.ok(orig, "o original guarda o EXIF (só agentes leem esse bucket)");
  for (const [, bytes] of buckets.get("fotos-publicas")!) assert.ok(!texto(bytes).includes("GPS-SENTINELA"), "vazou EXIF na foto pública");
});

Deno.test("o código nunca aparece na resposta e o banco só guarda o hash", opcoes, async () => {
  const sid = uuid();
  const r = await h.enviar(pedidoJson({ submission_id: sid, channel: "email", contact: `ana${++contadorEmail}@exemplo.com` }));
  const texto = await r.text();
  const cod = codigoDoEmail(emails.at(-1)!.texto);
  assert.ok(!texto.includes(cod));
  const linhas = await db.query("select code_hash from public.contact_verifications where subject=$1", [sid]);
  assert.equal(linhas.rows.length, 1);
  assert.ok(!(linhas.rows[0] as { code_hash: string }).code_hash.includes(cod));
});

Deno.test("código errado não confirma; sem confirmar o envio é recusado e não deixa foto solta", opcoes, async () => {
  const sid = uuid(), ip = novoIp(), email = `errado${++contadorEmail}@exemplo.com`;
  await h.enviar(pedidoJson({ submission_id: sid, channel: "email", contact: email }, { ip }));
  const errado = await h.confirmar(pedidoJson({ submission_id: sid, contact: email, code: "000000" }, { ip }));
  assert.deepEqual(await errado.json(), { confirmed: false });
  const antes = originais().length;
  const r = await h.salvar(pedidoForm({ dados: JSON.stringify(dadosDenuncia(sid, { email, confirmed_contact: email })) }, [await jpegDeTeste()], { ip }));
  assert.equal(r.status, 403);
  assert.equal((await r.json()).erro.codigo, "contato_nao_confirmado");
  assert.equal(originais().length, antes, "originais enviados deveriam ter sido removidos");
});

Deno.test("reenvio da mesma denúncia devolve o mesmo protocolo (200, já existia)", opcoes, async () => {
  const { sid, ip, corpo } = await enviarDenuncia();
  const email = (await db.query<{ email: string }>("select rp.email from public.report_private rp join public.reports r on r.id=rp.report_id where r.protocol=$1", [corpo.protocol])).rows[0].email;
  const r2 = await h.salvar(pedidoForm({ dados: JSON.stringify(dadosDenuncia(sid, { email, confirmed_contact: email })) }, [await jpegDeTeste(), await jpegDeTeste()], { ip }));
  const c2 = await r2.json();
  assert.equal(r2.status, 200);
  assert.equal(c2.protocol, corpo.protocol);
  assert.equal(c2.already_existed, true);
});

Deno.test("arquivo que não é foto, zero fotos e quatro fotos são recusados", opcoes, async () => {
  const sid = uuid(), ip = novoIp();
  const f = (n: number) => Promise.all(Array.from({ length: n }, () => jpegDeTeste()));
  let r = await h.salvar(pedidoForm({ dados: JSON.stringify(dadosDenuncia(sid)) }, [new TextEncoder().encode("<html>não é foto</html>")], { ip }));
  assert.equal((await r.json()).erro.codigo, "foto_invalida");
  r = await h.salvar(pedidoForm({ dados: JSON.stringify(dadosDenuncia(sid)) }, [], { ip }));
  assert.equal((await r.json()).erro.codigo, "fotos_invalidas");
  r = await h.salvar(pedidoForm({ dados: JSON.stringify(dadosDenuncia(sid)) }, await f(4), { ip }));
  assert.equal((await r.json()).erro.codigo, "fotos_invalidas");
});

Deno.test("o navegador não escolhe protocolo, etapa nem origem (campos extras são descartados)", opcoes, async () => {
  const { corpo } = await enviarDenuncia({ protocol: "AED-1999-000001", stage: "atendida", origin: "agente", publication: "arquivada" });
  const r = await db.query("select stage, origin, publication, protocol from public.reports where protocol=$1", [corpo.protocol]);
  assert.deepEqual(r.rows[0], { stage: "recebida", origin: "cidadao", publication: "publicada", protocol: corpo.protocol });
});

Deno.test("limite de repetição: o 21º pedido de código do mesmo IP leva 429", opcoes, async () => {
  const ip = novoIp();
  let ultimo = 0;
  for (let i = 0; i < 21; i++) {
    const r = await h.enviar(pedidoJson({ submission_id: uuid(), channel: "email", contact: `pessoa${i}@exemplo.com` }, { ip }));
    ultimo = r.status;
  }
  assert.equal(ultimo, 429);
});

Deno.test("canal SMS/WhatsApp ainda indisponível (DEP-03)", opcoes, async () => {
  const r = await h.enviar(pedidoJson({ submission_id: uuid(), channel: "sms", contact: "81999998888" }));
  assert.equal(r.status, 503);
});

Deno.test("CORS: OPTIONS responde 204 e GET é recusado (405)", opcoes, async () => {
  assert.equal((await h.salvar(new Request("http://x/", { method: "OPTIONS" }))).status, 204);
  assert.equal((await h.salvar(new Request("http://x/", { method: "GET" }))).status, 405);
});

// ---------------- correção pelo cidadão ----------------
Deno.test("correção do cidadão: resposta igual para protocolo inexistente; token de uso único", opcoes, async () => {
  const { corpo } = await enviarDenuncia();
  const protocolo = corpo.protocol as string;

  const nEmails = emails.length;
  const rNao = await h.correcao(pedidoJson({ acao: "solicitar", protocol: "AED-2026-999999" }));
  assert.equal(emails.length, nEmails, "protocolo inexistente não pode enviar e-mail");
  const rSim = await h.correcao(pedidoJson({ acao: "solicitar", protocol: protocolo }));
  assert.equal(emails.length, nEmails + 1);
  assert.deepEqual(await rNao.json(), await rSim.json(), "as duas respostas precisam ser idênticas");

  const cod = codigoDoEmail(emails.at(-1)!.texto);
  const ruim = await h.correcao(pedidoJson({ acao: "confirmar", protocol: protocolo, code: "000000" }));
  assert.deepEqual(await ruim.json(), { confirmed: false });
  const boa = await (await h.correcao(pedidoJson({ acao: "confirmar", protocol: protocolo, code: cod }))).json();
  assert.equal(boa.confirmed, true);
  assert.ok(boa.token);
  for (const proibida of ["events", "visits", "author_id", "failed_attempts"]) assert.ok(!(proibida in boa.report));

  const salvar = (token: string, extra = {}) =>
    h.correcao(pedidoJson({ acao: "salvar", token, changes: { noticed_since: "três dias", ...extra }, reason: "ajuste do cidadão" }));
  const ok = await salvar(boa.token);
  assert.equal(ok.status, 200);
  const reuso = await salvar(boa.token);
  assert.equal(reuso.status, 409);
  assert.equal((await reuso.json()).erro.codigo, "versao_desatualizada");

  const adulterado = await salvar(boa.token.slice(0, -3) + "abc");
  assert.equal(adulterado.status, 403);
});

Deno.test("cidadão não troca o contato confirmado, nem corrige depois de iniciada a análise", opcoes, async () => {
  const { corpo } = await enviarDenuncia();
  const pegarToken = async () => {
    await h.correcao(pedidoJson({ acao: "solicitar", protocol: corpo.protocol }));
    const cod = codigoDoEmail(emails.at(-1)!.texto);
    return (await (await h.correcao(pedidoJson({ acao: "confirmar", protocol: corpo.protocol, code: cod }))).json()).token as string;
  };
  const t1 = await pegarToken();
  const r1 = await h.correcao(pedidoJson({ acao: "salvar", token: t1, changes: { email: "outro@exemplo.com" }, reason: "x" }));
  assert.equal((await r1.json()).erro.codigo, "contato_confirmado_nao_editavel");

  const t2 = await pegarToken();
  const id = (await db.query("select id, version from public.reports where protocol=$1", [corpo.protocol])).rows[0] as { id: string; version: number };
  await h.agente(pedidoJson({ acao: "iniciar_analise", report_id: id.id, version: id.version }, { jwt: "jwt-agente" }));
  const r2 = await h.correcao(pedidoJson({ acao: "salvar", token: t2, changes: { description: "novo texto" }, reason: "x" }));
  assert.equal(r2.status, 409);
});

// ---------------- área do agente ----------------
Deno.test("agente: sem login, com login desconhecido ou sem papel de agente é recusado", opcoes, async () => {
  const corpo = { acao: "iniciar_analise", report_id: uuid(), version: 1 };
  assert.equal((await h.agente(pedidoJson(corpo))).status, 401);
  assert.equal((await h.agente(pedidoJson(corpo, { jwt: "jwt-que-nao-existe" }))).status, 401);
  const { corpo: d } = await enviarDenuncia();
  const rep = (await db.query("select id from public.reports where protocol=$1", [d.protocol])).rows[0] as { id: string };
  const r = await h.agente(pedidoJson({ acao: "iniciar_analise", report_id: rep.id, version: 1 }, { jwt: "jwt-comum" }));
  assert.equal(r.status, 403);
  const estado = await db.query("select stage from public.reports where id=$1", [rep.id]);
  assert.equal((estado.rows[0] as { stage: string }).stage, "recebida", "usuário sem papel não pode mudar nada");
});

Deno.test("agente: análise -> visita -> atendida; arquivar apaga fotos públicas; voltar ao mapa as refaz", opcoes, async () => {
  const { corpo } = await enviarDenuncia();
  const rep = (await db.query("select id from public.reports where protocol=$1", [corpo.protocol])).rows[0] as { id: string };
  const jwt = "jwt-agente";
  const chama = async (c: Record<string, unknown>) => {
    const r = await h.agente(pedidoJson(c, { jwt }));
    return { status: r.status, corpo: await r.json() };
  };

  const a1 = await chama({ acao: "iniciar_analise", report_id: rep.id, version: 1 });
  assert.equal(a1.corpo.stage, "em_analise");

  const hoje = (await db.query("select ((now() at time zone 'America/Recife')::date)::text d")).rows[0] as { d: string };
  const visita = { id: uuid(), visited_on: hoje.d, access: "com_acesso", focus_location: "residencia", water_present: true,
    containers: ["pneus"], larvae: "sim", actions: ["orientacao"], notes: "ok", stage: "ignorado" };
  const a2 = await chama({ acao: "registrar_visita", report_id: rep.id, version: a1.corpo.version, visita });
  assert.equal(a2.corpo.stage, "atendida");

  const meus = () => publicos().filter((p) => p.startsWith(rep.id));
  assert.equal(meus().length, 2);

  const a3 = await chama({ acao: "arquivar", report_id: rep.id, motivo: "foto inadequada", confirmado: true });
  assert.equal(a3.corpo.remocao_pendente, false);
  assert.equal(meus().length, 0, "fotos públicas precisam sair do bucket");
  const pubDepois = await db.query("select count(*)::int n from public.public_reports where report_id=$1", [rep.id]);
  assert.equal((pubDepois.rows[0] as { n: number }).n, 0);

  const repetido = await chama({ acao: "arquivar", report_id: rep.id, motivo: "foto inadequada", confirmado: true });
  assert.equal(repetido.status, 200, "arquivar de novo é clique repetido, não erro");
  assert.equal(repetido.corpo.already_archived, true);
  assert.equal(await contar("select count(*)::int n from public.report_events where report_id=$1 and event_type='arquivada'", [rep.id]), 1);

  const a4 = await chama({ acao: "voltar_ao_mapa", report_id: rep.id });
  assert.equal(a4.corpo.restored, true);
  assert.equal(meus().length, 2);
  const etapa = await db.query("select stage, publication from public.reports where id=$1", [rep.id]);
  assert.deepEqual(etapa.rows[0], { stage: "atendida", publication: "publicada" });
});

Deno.test("agente: arquivar sem motivo ou sem confirmação é recusado", opcoes, async () => {
  const { corpo } = await enviarDenuncia();
  const rep = (await db.query("select id from public.reports where protocol=$1", [corpo.protocol])).rows[0] as { id: string };
  const r1 = await h.agente(pedidoJson({ acao: "arquivar", report_id: rep.id, motivo: "   ", confirmado: true }, { jwt: "jwt-agente" }));
  assert.equal((await r1.json()).erro.codigo, "motivo_obrigatorio");
  const r2 = await h.agente(pedidoJson({ acao: "arquivar", report_id: rep.id, motivo: "falsa", confirmado: false }, { jwt: "jwt-agente" }));
  assert.equal((await r2.json()).erro.codigo, "confirmacao_obrigatoria");
});

Deno.test("agente: registrar foco em local sem denúncia (com fotos) nasce atendida e publicada", opcoes, async () => {
  const hoje = (await db.query("select ((now() at time zone 'America/Recife')::date)::text d")).rows[0] as { d: string };
  const dados = {
    submission_id: uuid(), lat: -7.412, lng: -35.104, neighborhood_id: 2, category_id: 1,
    description: "Calha entupida.", place_address: "Rua do Comércio, 45", place_reference: "ao lado da escola",
    visit: { id: uuid(), visited_on: hoje.d, focus_location: "residencia", water_present: true, containers: ["pneus"], larvae: "nao", actions: ["deposito_eliminado"] },
  };
  const f = pedidoForm({ acao: "criar_ocorrencia", dados: JSON.stringify(dados) }, [await jpegDeTeste()], { jwt: "jwt-agente" });
  const r = await h.agente(f);
  const c = await r.json();
  assert.equal(r.status, 201);
  assert.equal(c.publication, "publicada");
  const rep = await db.query("select origin, stage from public.reports where id=$1", [c.report_id]);
  assert.deepEqual(rep.rows[0], { origin: "agente", stage: "atendida" });
  const pub = await db.query("select origin from public.public_reports where report_id=$1", [c.report_id]);
  assert.deepEqual(pub.rows[0], { origin: "agente" });
});

// ---------------- rotina diária ----------------
Deno.test("rotina diária: exige a senha", opcoes, async () => {
  assert.equal((await h.rotina(pedidoJson({}))).status, 401);
  assert.equal((await h.rotina(new Request("http://x/", { method: "POST", headers: { authorization: "Bearer errada" } }))).status, 401);
});

const rodarRotina = async () => {
  const r = await h.rotina(new Request("http://x/", { method: "POST", headers: { authorization: "Bearer senha-da-rotina" } }));
  assert.equal(r.status, 200);
  return await r.json();
};

Deno.test("rotina diária: refaz a publicação que tinha ficado pendente (D14)", opcoes, async () => {
  falhas.publicoSubir = true;
  const { corpo } = await enviarDenuncia();
  falhas.publicoSubir = false;
  assert.equal(corpo.publication, "pendente");
  assert.match(corpo.protocol, /^AED-/, "o protocolo é entregue mesmo com a publicação pendente");
  await db.query("update public.reports set received_at = now() - interval '10 minutes' where protocol=$1", [corpo.protocol]);
  const resumo = await rodarRotina();
  assert.ok(resumo.publicadas >= 1);
  const r = await db.query("select publication from public.reports where protocol=$1", [corpo.protocol]);
  assert.deepEqual(r.rows[0], { publication: "publicada" });
});

Deno.test("rotina diária: remove da lixeira o que passou de 30 dias (arquivos e registro)", opcoes, async () => {
  const { corpo } = await enviarDenuncia();
  const rep = (await db.query("select id from public.reports where protocol=$1", [corpo.protocol])).rows[0] as { id: string };
  await h.agente(pedidoJson({ acao: "arquivar", report_id: rep.id, motivo: "improcedente", confirmado: true }, { jwt: "jwt-agente" }));
  const doReport = (m: Map<string, Uint8Array>) => [...m.keys()].filter((k) => k.startsWith(rep.id));
  assert.equal(doReport(buckets.get("fotos-publicas")!).length, 0);

  const sub = (await db.query("select submission_id from public.reports where id=$1", [rep.id])).rows[0] as { submission_id: string };
  const orig = [...buckets.get("fotos-originais")!.keys()].filter((k) => k.startsWith(sub.submission_id));
  assert.ok(orig.length > 0, "originais ainda existem durante a lixeira");

  // ainda no prazo: a rotina não apaga
  await rodarRotina();
  assert.equal(await contar("select count(*)::int n from public.reports where id=$1", [rep.id]), 1);

  await db.query("update public.reports set archived_at = now() - interval '31 days' where id=$1", [rep.id]);
  const resumo = await rodarRotina();
  assert.ok(resumo.lixeira_removidas >= 1);
  assert.equal(await contar("select count(*)::int n from public.reports where id=$1", [rep.id]), 0);
  assert.equal(await contar("select count(*)::int n from public.report_private where report_id=$1", [rep.id]), 0);
  assert.equal([...buckets.get("fotos-originais")!.keys()].filter((k) => k.startsWith(sub.submission_id)).length, 0);
});
