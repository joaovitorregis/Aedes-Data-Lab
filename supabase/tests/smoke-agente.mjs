// =====================================================================
// smoke-agente.mjs — teste de fumaça das Edge Functions `agente` e `rotina-diaria`
// no projeto REAL DE TESTE (nunca rode apontando para produção).
//
// Como rodar (Node 20+, sem instalar nada):
//   node supabase/tests/smoke-agente.mjs
//
// O que ele faz:
//   1. Tenta usar a função `agente` sem login e só com a chave pública: tem que ser recusado.
//   2. Entra como agente (e-mail + senha digitados no terminal; a senha fica oculta).
//   3. Pega uma denúncia de teste, inicia a análise, anota, arquiva e volta ao mapa,
//      conferindo a cada passo se ela some e reaparece no mapa público.
//   4. (Opcional) chama a `rotina-diaria` com o CRON_SECRET.
//
// Segurança: a senha e o token NUNCA são impressos nem gravados em arquivo.
// =====================================================================
import readline from "node:readline";

const URL_PADRAO = "https://rmpdhfvxjgtvsxiudkfk.supabase.co"; // projeto "Aedes data lab - teste"
const PROTOCOLO_TESTE = "AED-2026-000002"; // denúncia fictícia criada no teste

// ---------- entrada no terminal ----------
const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: true });
let mudo = false;
const escreverOriginal = rl._writeToOutput.bind(rl);
// Quando "mudo" está ligado, não mostra o que a pessoa digita (para senhas).
rl._writeToOutput = (texto) => { if (!mudo) escreverOriginal(texto); };

function perguntar(texto, { oculto = false } = {}) {
  return new Promise((resolve) => {
    rl.question(texto, (resposta) => { mudo = false; if (oculto) console.log(""); resolve(resposta.trim()); });
    mudo = oculto; // liga o modo oculto depois de mostrar a pergunta
  });
}

// ---------- relatório ----------
let falhas = 0;
function ver(ok, texto, detalhe = "") {
  if (!ok) falhas++;
  console.log(`${ok ? "  ✔" : "  ✘"} ${texto}${detalhe ? `  → ${detalhe}` : ""}`);
}

async function chamar(url, opcoes = {}) {
  const r = await fetch(url, opcoes);
  let corpo = null;
  try { corpo = await r.json(); } catch { /* resposta sem JSON */ }
  return { status: r.status, corpo };
}

async function main() {
  const base = (await perguntar(`URL do projeto [${URL_PADRAO}]: `)) || URL_PADRAO;
  if (!base.includes("rmpdhfvxjgtvsxiudkfk")) {
    console.log("Este script só roda no projeto de teste (rmpdhfvxjgtvsxiudkfk). Abortando.");
    return;
  }
  const chave = await perguntar("Chave pública (publishable/anon) do projeto de teste: ");
  const email = await perguntar("E-mail do agente: ");
  const senha = await perguntar("Senha (não aparece enquanto digita): ", { oculto: true });
  // O CRON_SECRET pode vir da variável de ambiente (evita problema de colagem no terminal):
  //   $env:CRON_SECRET = $s ; node supabase\tests\smoke-agente.mjs
  const cron = process.env.CRON_SECRET
    || await perguntar("CRON_SECRET (Enter para pular a rotina-diaria): ", { oculto: true });

  const fn = (nome) => `${base}/functions/v1/${nome}`;
  const json = (corpo, token) => ({
    method: "POST",
    headers: { "Content-Type": "application/json", apikey: chave, Authorization: `Bearer ${token}` },
    body: JSON.stringify(corpo),
  });

  // ---- 1. Quem NÃO é agente tem que ser recusado ----
  console.log("\n1) Acesso negado a quem não é agente");
  let r = await chamar(fn("agente"), { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" });
  ver(r.status === 401 || r.status === 403, "sem login é recusado", `HTTP ${r.status}`);
  r = await chamar(fn("agente"), json({ acao: "iniciar_analise" }, chave));
  ver(r.status === 401 || r.status === 403, "só com a chave pública é recusado", `HTTP ${r.status}`);

  // ---- 2. Login do agente ----
  console.log("\n2) Login do agente");
  r = await chamar(`${base}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: { "Content-Type": "application/json", apikey: chave },
    body: JSON.stringify({ email, password: senha }),
  });
  const token = r.corpo?.access_token;
  ver(r.status === 200 && !!token, "login aceito", `HTTP ${r.status}`);
  if (!token) { console.log("Sem token, não dá para continuar."); return; }

  // tk = null  ->  chamada anônima (só a chave pública, sem Authorization), como um visitante.
  const rest = (caminho, tk = token) => chamar(`${base}/rest/v1/${caminho}`, {
    headers: tk ? { apikey: chave, Authorization: `Bearer ${tk}` } : { apikey: chave },
  });

  // ---- 3. Ações do agente ----
  console.log(`\n3) Ações do agente na denúncia ${PROTOCOLO_TESTE}`);
  r = await rest(`reports?select=id,version,stage,publication&protocol=eq.${PROTOCOLO_TESTE}`);
  const den = r.corpo?.[0];
  ver(!!den, "agente consegue ler a denúncia (RLS de leitura)", den ? `etapa ${den.stage}, publicação ${den.publication}` : `HTTP ${r.status}`);
  if (!den) return;
  const id = den.id;

  // O mapa público é lido SEM login, como qualquer visitante.
  const noMapa = async () => (await rest(`public_reports?select=report_id&report_id=eq.${id}`, null)).corpo?.length > 0;

  if (den.publication === "arquivada") {
    console.log("  (a denúncia já estava arquivada; vou direto para 'voltar ao mapa')");
  } else {
    let etapa = den.stage;
    if (etapa === "recebida") {
      r = await chamar(fn("agente"), json({ acao: "iniciar_analise", report_id: id, version: den.version }, token));
      ver(r.status === 200, "iniciar análise", `HTTP ${r.status} ${r.status === 200 ? "" : JSON.stringify(r.corpo)}`);
      if (r.status === 200) etapa = "em_analise";
    }
    // Observação só é aceita em "recebida" ou "em_analise". Depois de arquivar, a denúncia fica
    // "encerrada" e não aceita mais; por isso, em rodadas repetidas, este passo é pulado.
    if (etapa === "em_analise" || etapa === "recebida") {
      r = await chamar(fn("agente"), json({ acao: "adicionar_observacao", report_id: id, texto: "Observação de teste (smoke)." }, token));
      ver(r.status === 200, "adicionar observação", `HTTP ${r.status} ${r.status === 200 ? "" : JSON.stringify(r.corpo)}`);
    } else {
      console.log(`  (observação pulada: etapa atual é "${etapa}")`);
    }

    r = await chamar(fn("agente"), json({ acao: "arquivar", report_id: id, motivo: "Teste de fumaça", confirmado: true }, token));
    ver(r.status === 200, "arquivar", `HTTP ${r.status} ${JSON.stringify(r.corpo)}`);
    ver(!(await noMapa()), "denúncia SAIU do mapa público");
  }

  r = await chamar(fn("agente"), json({ acao: "voltar_ao_mapa", report_id: id }, token));
  ver(r.status === 200, "voltar ao mapa", `HTTP ${r.status} ${JSON.stringify(r.corpo)}`);
  ver(await noMapa(), "denúncia VOLTOU ao mapa público");

  // As fotos públicas regeneradas têm que abrir sem login.
  r = await rest(`report_photos?select=public_path&report_id=eq.${id}&public_path=not.is.null`);
  for (const f of r.corpo ?? []) {
    const resp = await fetch(`${base}/storage/v1/object/public/fotos-publicas/${f.public_path}`);
    ver(resp.status === 200, `foto pública abre sem login (${f.public_path})`, `HTTP ${resp.status}`);
  }

  // ---- 4. Rotina diária ----
  console.log("\n4) rotina-diaria");
  r = await chamar(fn("rotina-diaria"), json({}, token));
  ver(r.status === 401 || r.status === 403, "token de agente NÃO serve para a rotina", `HTTP ${r.status}`);
  if (cron) {
    // (a) como o agendador de verdade faz: só Authorization, sem o cabeçalho apikey
    r = await chamar(fn("rotina-diaria"), { method: "POST", headers: { Authorization: `Bearer ${cron}` } });
    ver(r.status === 200, "rotina com CRON_SECRET (só Authorization)", `HTTP ${r.status} ${JSON.stringify(r.corpo)}`);
    // (b) com o cabeçalho apikey junto, como o navegador mandaria
    r = await chamar(fn("rotina-diaria"), json({}, cron));
    ver(r.status === 200, "rotina com CRON_SECRET (com apikey)", `HTTP ${r.status} ${JSON.stringify(r.corpo)}`);
  } else {
    console.log("  (pulado: sem CRON_SECRET)");
  }

  console.log(falhas === 0 ? "\nTudo certo ✔" : `\n${falhas} verificação(ões) falharam ✘ — copie a saída acima e me mande.`);
}

main().catch((e) => { console.error("Erro inesperado:", e.message); process.exitCode = 1; }).finally(() => rl.close());
