// =====================================================================
// denuncia.js (serviço) — tudo que a tela "Registrar foco" pede ao servidor.
// =====================================================================
import { chamarFuncao, lerTabela } from "./api.js";

// Os 15 bairros e as categorias vêm do banco, para a tela não ficar com listas fixas.
export const listarBairros = () => lerTabela("neighborhoods?select=id,name&order=name");
export const listarCategorias = () => lerTabela("categories?select=id,code,label&order=id");

// Pede o código de confirmação por e-mail. Resposta: { ok: true, expira_em_segundos }.
export const enviarCodigo = (submissionId, email) =>
  chamarFuncao("enviar-codigo", { submission_id: submissionId, channel: "email", contact: email });

// Confere o código. Resposta: { confirmed: true | false }.
export const confirmarCodigo = (submissionId, email, codigo) =>
  chamarFuncao("confirmar-codigo", { submission_id: submissionId, contact: email, code: codigo });

// Correção pelo cidadão: o código vai para o contato confirmado e a autorização vale uma vez.
export const pedirCodigoCorrecao = (protocol) =>
  chamarFuncao("acesso-correcao", { acao: "solicitar", protocol });
export const confirmarCodigoCorrecao = (protocol, code) =>
  chamarFuncao("acesso-correcao", { acao: "confirmar", protocol, code });
export const salvarCorrecao = (token, changes, reason) =>
  chamarFuncao("acesso-correcao", { acao: "salvar", token, changes, reason });

// Salva a denúncia (dados + 1 a 3 fotos).
// Resposta: { protocol, publication: "publicada" | "pendente", already_existed }.
// `submissionId` é o que torna o reenvio seguro: se a pessoa tocar duas vezes, ou a
// internet cair no meio, o servidor devolve o MESMO protocolo em vez de criar outra.
export function salvarDenuncia(dados, fotos) {
  const form = new FormData();
  form.append("dados", JSON.stringify(dados));
  fotos.forEach((foto) => form.append("fotos", foto));
  return chamarFuncao("salvar-denuncia", form);
}
