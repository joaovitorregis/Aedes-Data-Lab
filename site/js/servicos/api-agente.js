// Chamadas de rede da área do agente (as que usam login). Fica separado de api.js,
// que atende a área do cidadão, para que uma área não mude o comportamento da outra.
import { ErroApi } from "./api.js";
import { CHAVE_PUBLICA, SUPABASE_URL } from "./config.js";

const MENSAGEM_PADRAO = "Não foi possível concluir agora. Tente de novo em instantes.";
const SEM_CONEXAO = "Sem conexão com o servidor. Confira a internet e tente de novo.";

async function enviar(url, opcoes) {
  try {
    return await fetch(url, opcoes);
  } catch {
    // fetch só lança quando não chegou ao servidor (sem internet, bloqueio de CORS...).
    throw new ErroApi("sem_conexao", SEM_CONEXAO);
  }
}

// As funções respondem { erro: { codigo, mensagem } }; o Auth e o banco usam outros formatos.
async function pedir(url, opcoes) {
  const resposta = await enviar(url, opcoes);
  let corpo = null;
  try { corpo = await resposta.json(); } catch { /* resposta sem JSON */ }
  if (!resposta.ok) {
    const codigo = corpo?.erro?.codigo ?? "erro_desconhecido";
    throw new ErroApi(codigo, corpo?.erro?.mensagem ?? MENSAGEM_PADRAO, resposta.status);
  }
  return corpo;
}

// Troca e-mail e senha (ou o refresh_token) por uma sessão no Supabase Auth.
export function pedirSessao(tipo, corpo) {
  return pedir(`${SUPABASE_URL}/auth/v1/token?grant_type=${tipo}`, {
    method: "POST",
    headers: { apikey: CHAVE_PUBLICA, "Content-Type": "application/json" },
    body: JSON.stringify(corpo),
  });
}

// `caminho` começa depois do endereço do projeto, ex.: "/rest/v1/reports?select=id".
export function pedirComLogin(caminho, token, { method = "GET", corpo } = {}) {
  const ehForm = corpo instanceof FormData;
  return pedir(`${SUPABASE_URL}${caminho}`, {
    method,
    headers: {
      apikey: CHAVE_PUBLICA,
      Authorization: `Bearer ${token}`,
      ...(corpo === undefined || ehForm ? {} : { "Content-Type": "application/json" }),
    },
    body: corpo === undefined || ehForm ? corpo : JSON.stringify(corpo),
  });
}

// Baixa um arquivo do bucket privado (as fotos originais, que só o agente lê).
export async function baixarArquivoPrivado(bucket, caminho, token) {
  const resposta = await enviar(`${SUPABASE_URL}/storage/v1/object/authenticated/${bucket}/${caminho}`, {
    headers: { apikey: CHAVE_PUBLICA, Authorization: `Bearer ${token}` },
  });
  if (!resposta.ok) throw new ErroApi("foto_indisponivel", "Não foi possível abrir a foto.", resposta.status);
  return resposta.blob();
}
