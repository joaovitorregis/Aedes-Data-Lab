// Login do agente (RF-AUT-02). O papel é conferido no banco; esconder uma tela não protege nada.
import { ErroApi } from "./api.js";
import { pedirComLogin, pedirSessao } from "./api-agente.js";

const CHAVE = "aedes.agente.sessao";
const MARGEM_MS = 60_000;
let renovando = null;

export function sessaoAtual() {
  try {
    return JSON.parse(localStorage.getItem(CHAVE));
  } catch {
    return null;
  }
}

function guardar(resposta, nome) {
  const sessao = {
    token: resposta.access_token,
    renovacao: resposta.refresh_token,
    expiraEm: Date.now() + resposta.expires_in * 1000,
    usuario: { id: resposta.user.id, email: resposta.user.email },
    nome,
  };
  localStorage.setItem(CHAVE, JSON.stringify(sessao));
  return sessao;
}

export const esquecerSessao = () => localStorage.removeItem(CHAVE);

const sessaoExpirada = () => new ErroApi("sessao_expirada", "Sua sessão terminou. Entre de novo.", 401);

// O RLS deixa cada pessoa ler só o próprio perfil: sem perfil ativo, não é agente.
async function perfilAtivo(usuarioId, token) {
  const [perfil] = await pedirComLogin(`/rest/v1/profiles?select=display_name,active&id=eq.${usuarioId}`, token);
  return perfil?.active ? perfil : null;
}

export async function entrar(email, senha) {
  let resposta;
  try {
    resposta = await pedirSessao("password", { email: email.trim(), password: senha });
  } catch (e) {
    if (e.status === 400 || e.status === 401) throw new ErroApi("login_invalido", "E-mail ou senha incorretos.", e.status);
    throw e;
  }
  const perfil = await perfilAtivo(resposta.user.id, resposta.access_token);
  if (!perfil) {
    throw new ErroApi("sem_acesso", "Esta conta não tem acesso de agente. Fale com a equipe do projeto.", 403);
  }
  return guardar(resposta, perfil.display_name);
}

async function renovar(sessao) {
  try {
    return guardar(await pedirSessao("refresh_token", { refresh_token: sessao.renovacao }), sessao.nome);
  } catch (e) {
    if (e.status >= 400 && e.status < 500) {
      esquecerSessao();
      throw sessaoExpirada();
    }
    throw e; // sem internet: mantém a sessão para tentar depois
  }
}

// Devolve um token que ainda vale, renovando quando está perto de vencer.
export async function tokenValido({ forcarRenovacao = false } = {}) {
  const sessao = sessaoAtual();
  if (!sessao) throw sessaoExpirada();
  if (!forcarRenovacao && sessao.expiraEm - Date.now() > MARGEM_MS) return sessao.token;
  renovando ??= renovar(sessao).finally(() => { renovando = null; });
  return (await renovando).token;
}

// Conta desativada depois do login para de operar (RF-AUT-02).
export async function conferirAcesso() {
  const token = await tokenValido();
  return Boolean(await perfilAtivo(sessaoAtual().usuario.id, token));
}

export async function sair() {
  const sessao = sessaoAtual();
  esquecerSessao();
  sessionStorage.clear();
  if (!sessao) return;
  try {
    await pedirComLogin("/auth/v1/logout", sessao.token, { method: "POST" });
  } catch {
    // Sem internet a sessão local já foi apagada, que é o que protege este aparelho.
  }
}
