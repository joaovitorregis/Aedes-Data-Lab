// =====================================================================
// api.js — o único lugar que faz chamadas de rede ao Supabase.
// As telas NUNCA chamam fetch direto (docs/RULES.md): elas usam os serviços,
// e os serviços usam este arquivo.
//
// Usamos fetch puro (sem a biblioteca supabase-js): o site é estático, não tem
// etapa de build, e só precisamos de duas coisas: chamar Edge Functions e ler
// duas tabelas públicas.
// =====================================================================
import { CHAVE_PUBLICA, SUPABASE_URL } from "./config.js";

// Erro com um código estável (para a tela decidir o que mostrar) e uma
// mensagem em português (para mostrar à pessoa).
export class ErroApi extends Error {
  constructor(codigo, mensagem, status = 0) {
    super(mensagem);
    this.codigo = codigo;
    this.status = status;
  }
}

const MENSAGEM_PADRAO = "Não foi possível concluir agora. Tente de novo em instantes.";

// As funções respondem { erro: { codigo, mensagem } } (ou { erro: "codigo", mensagem }).
async function ler(resposta) {
  let corpo = null;
  try { corpo = await resposta.json(); } catch { /* resposta sem JSON */ }
  if (!resposta.ok) {
    const e = corpo?.erro;
    const codigo = typeof e === "string" ? e : e?.codigo ?? "erro_desconhecido";
    const mensagem = (typeof e === "object" ? e?.mensagem : corpo?.mensagem) ?? MENSAGEM_PADRAO;
    throw new ErroApi(codigo, mensagem, resposta.status);
  }
  return corpo;
}

async function pedir(url, opcoes) {
  try {
    return await ler(await fetch(url, opcoes));
  } catch (e) {
    if (e instanceof ErroApi) throw e;
    // fetch só lança quando não chegou ao servidor (sem internet, bloqueio de CORS...).
    throw new ErroApi("sem_conexao", "Sem conexão com o servidor. Confira a internet e tente de novo.");
  }
}

// Chama uma Edge Function. `corpo` pode ser um objeto (vira JSON) ou um FormData (fotos).
export function chamarFuncao(nome, corpo) {
  const ehForm = corpo instanceof FormData;
  return pedir(`${SUPABASE_URL}/functions/v1/${nome}`, {
    method: "POST",
    headers: { apikey: CHAVE_PUBLICA, ...(ehForm ? {} : { "Content-Type": "application/json" }) },
    body: ehForm ? corpo : JSON.stringify(corpo),
  });
}

// Lê uma tabela pública pela API REST. Quem decide o que pode ser lido é o RLS do banco.
export function lerTabela(caminho) {
  return pedir(`${SUPABASE_URL}/rest/v1/${caminho}`, { headers: { apikey: CHAVE_PUBLICA } });
}

// Endereço de uma foto do bucket público (fotos já sem metadados).
export function urlFotoPublica(caminho) {
  return `${SUPABASE_URL}/storage/v1/object/public/fotos-publicas/${caminho}`;
}
