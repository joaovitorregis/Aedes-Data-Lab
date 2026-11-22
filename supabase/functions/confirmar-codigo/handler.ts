// =====================================================================
// confirmar-codigo: o cidadão digita o código recebido (RF-AUT-01).
//
// Entrada (JSON): { submission_id, contact, code }
// Saída:          { confirmed: true|false }
//
// O banco conta as tentativas erradas: no 5º erro o código morre e é preciso
// pedir outro (RNF-08). A confirmação fica gravada no banco; é ela que
// api_save_report confere na hora de gravar a denúncia.
// =====================================================================
import { hashCodigo } from "../_shared/codigo.ts";
import { ErroNegocio } from "../_shared/erros.ts";
import { chaveDoCliente, envolver, exigirEmail, exigirUuid, limitar, lerJson, responder } from "../_shared/http.ts";
import type { Servico } from "../_shared/servico.ts";

export function criarHandler(svc: Servico) {
  return envolver(svc, async (req) => {
    const corpo = await lerJson(req);
    const submissionId = exigirUuid(corpo.submission_id);
    const contato = exigirEmail(corpo.contact);
    if (typeof corpo.code !== "string" || !/^\d{6}$/.test(corpo.code)) throw new ErroNegocio("dados_invalidos");

    await limitar(svc, `ip-confirma:${await chaveDoCliente(req)}`, 40, 3600);

    const hash = await hashCodigo(svc.config.pimenta, submissionId, contato, corpo.code);
    const confirmed = await svc.rpc<boolean>("api_confirm_verification", {
      p_purpose: "envio", p_subject: submissionId, p_contact: contato, p_code_hash: hash,
    });
    return responder(req, svc, 200, { confirmed });
  });
}
