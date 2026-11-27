// =====================================================================
// enviar-codigo: o cidadão pede um código para confirmar o contato (RF-AUT-01).
//
// Entrada (JSON): { submission_id, channel: "email", contact }
// Saída:          { ok: true, expira_em_segundos }
//
// O código NUNCA volta na resposta: só chega ao contato informado. O banco
// guarda só o hash dele (ver _shared/codigo.ts).
// =====================================================================
import { gerarCodigo, hashCodigo } from "../_shared/codigo.ts";
import { ErroNegocio } from "../_shared/erros.ts";
import { chaveDoCliente, envolver, exigirEmail, exigirUuid, limitar, lerJson, responder } from "../_shared/http.ts";
import { emailDoCodigo } from "../_shared/mensagens.ts";
import type { Servico } from "../_shared/servico.ts";

const VALIDADE_SEGUNDOS = 600; // 10 minutos

export function criarHandler(svc: Servico) {
  return envolver(svc, async (req) => {
    const corpo = await lerJson(req);
    const submissionId = exigirUuid(corpo.submission_id);

    // SMS e WhatsApp só existem se o custo for aceito (DEP-03). Por enquanto, só e-mail.
    if (corpo.channel === "sms" || corpo.channel === "whatsapp") throw new ErroNegocio("canal_indisponivel");
    if (corpo.channel !== "email") throw new ErroNegocio("dados_invalidos");
    const contato = exigirEmail(corpo.contact);

    // Limite por pessoa (IP) aqui; o banco ainda limita por contato e por tentativa.
    await limitar(svc, `ip-codigo:${await chaveDoCliente(req)}`, 20, 3600);

    const codigo = gerarCodigo();
    const hash = await hashCodigo(svc.config.pimenta, submissionId, contato, codigo);
    const permitido = await svc.rpc<boolean>("api_start_verification", {
      p_purpose: "envio", p_subject: submissionId, p_channel: "email",
      p_contact: contato, p_code_hash: hash, p_ttl_seconds: VALIDADE_SEGUNDOS,
    });
    if (!permitido) throw new ErroNegocio("limite_excedido");

    const { assunto, texto, html } = emailDoCodigo(codigo, VALIDADE_SEGUNDOS / 60);
    try {
      await svc.enviarEmail(contato, assunto, texto, html);
    } catch (e) {
      console.error("falha ao enviar o código:", e); // o detalhe fica só no log
      throw new ErroNegocio("envio_falhou");
    }
    return responder(req, svc, 200, { ok: true, expira_em_segundos: VALIDADE_SEGUNDOS });
  });
}
