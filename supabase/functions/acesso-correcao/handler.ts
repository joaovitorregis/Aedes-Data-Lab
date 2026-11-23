// =====================================================================
// acesso-correcao: o cidadão corrige a PRÓPRIA denúncia, sem ter conta (D42, RF-COR-01).
//
// Três ações (campo "acao" do JSON):
//
//   solicitar  { acao, protocol }
//       Envia um código ao contato que foi CONFIRMADO no envio da denúncia.
//       A resposta é SEMPRE a mesma ({ ok: true }), exista o protocolo ou não,
//       para ninguém descobrir quais protocolos existem. Protocolo, e-mail ou
//       telefone digitados, sozinhos, nunca liberam acesso.
//
//   confirmar  { acao, protocol, code }
//       Confere o código. Se estiver certo, devolve { confirmed: true, token, report }:
//       um token temporário (15 min), restrito a ESTA denúncia e de uso único
//       (ver _shared/token.ts), e a visão do cidadão sobre ela. Se não,
//       { confirmed: false }, igual para protocolo inexistente.
//
//   salvar     { acao, token, changes, reason }
//       Aplica a correção. O banco confere de novo: etapa Recebida, versão
//       esperada e campos permitidos. O contato confirmado nunca muda aqui.
// =====================================================================
import { gerarCodigo, hashCodigo } from "../_shared/codigo.ts";
import { ErroNegocio } from "../_shared/erros.ts";
import { chaveDoCliente, envolver, exigirTexto, limitar, lerJson, responder } from "../_shared/http.ts";
import { emailDoCodigo } from "../_shared/mensagens.ts";
import type { Servico } from "../_shared/servico.ts";
import { emitirToken, verificarToken } from "../_shared/token.ts";

const VALIDADE_CODIGO_SEGUNDOS = 600;
const VALIDADE_TOKEN_SEGUNDOS = 900;
const PROTOCOLO = /^AED-\d{4}-\d{6}$/;

interface Contato { report_id: string; channel: string; contact: string }

export function criarHandler(svc: Servico) {
  return envolver(svc, async (req) => {
    const corpo = await lerJson(req);
    const ip = await chaveDoCliente(req);

    switch (corpo.acao) {
      case "solicitar": {
        await limitar(svc, `ip-correcao:${ip}`, 10, 3600);
        const protocolo = exigirTexto(corpo.protocol, 40).trim().toUpperCase();
        // Mesmo para protocolo inválido ou inexistente a resposta é igual.
        const resposta = () => responder(req, svc, 200, { ok: true });
        if (!PROTOCOLO.test(protocolo)) return resposta();

        const alvo = await svc.rpc<Contato | null>("api_find_report_for_correction", { p_protocol: protocolo });
        if (!alvo || alvo.channel !== "email") return resposta(); // SMS/WhatsApp: DEP-03

        const codigo = gerarCodigo();
        const hash = await hashCodigo(svc.config.pimenta, protocolo, alvo.contact, codigo);
        const permitido = await svc.rpc<boolean>("api_start_verification", {
          p_purpose: "correcao", p_subject: protocolo, p_channel: "email",
          p_contact: alvo.contact, p_code_hash: hash, p_ttl_seconds: VALIDADE_CODIGO_SEGUNDOS,
        });
        if (permitido) {
          const { assunto, texto, html } = emailDoCodigo(codigo, VALIDADE_CODIGO_SEGUNDOS / 60);
          // Falha de envio não muda a resposta (senão revelaria que o protocolo existe).
          await svc.enviarEmail(alvo.contact, assunto, texto, html).catch((e) => console.error("falha ao enviar o código:", e));
        }
        return resposta();
      }

      case "confirmar": {
        const protocolo = exigirTexto(corpo.protocol, 40).trim().toUpperCase();
        if (typeof corpo.code !== "string" || !/^\d{6}$/.test(corpo.code)) throw new ErroNegocio("dados_invalidos");
        await limitar(svc, `ip-correcao-confirma:${ip}`, 30, 3600);
        await limitar(svc, `protocolo-correcao-confirma:${protocolo}`, 15, 3600);

        const alvo = PROTOCOLO.test(protocolo)
          ? await svc.rpc<Contato | null>("api_find_report_for_correction", { p_protocol: protocolo })
          : null;
        if (!alvo) return responder(req, svc, 200, { confirmed: false });

        const hash = await hashCodigo(svc.config.pimenta, protocolo, alvo.contact, corpo.code);
        const ok = await svc.rpc<boolean>("api_confirm_verification", {
          p_purpose: "correcao", p_subject: protocolo, p_contact: alvo.contact, p_code_hash: hash,
        });
        if (!ok) return responder(req, svc, 200, { confirmed: false });

        const report = await svc.rpc<{ version: number }>("api_get_report_for_citizen", { p_report_id: alvo.report_id });
        const token = await emitirToken(svc.config.segredoToken, { rid: alvo.report_id, ver: report.version }, VALIDADE_TOKEN_SEGUNDOS);
        return responder(req, svc, 200, { confirmed: true, token, report });
      }

      case "salvar": {
        const payload = await verificarToken(svc.config.segredoToken, exigirTexto(corpo.token, 2000));
        if (!payload) throw new ErroNegocio("autorizacao_invalida");
        if (typeof corpo.changes !== "object" || corpo.changes === null || Array.isArray(corpo.changes)) {
          throw new ErroNegocio("dados_invalidos");
        }
        const r = await svc.rpc<{ version: number }>("api_correct_fields_citizen", {
          p_report_id: payload.rid, p_changes: corpo.changes, p_reason: exigirTexto(corpo.reason, 500),
          // Uso único: o token vale só para a versão em que foi emitido.
          p_expected_version: payload.ver,
        });
        return responder(req, svc, 200, { ok: true, version: r.version });
      }

      default:
        throw new ErroNegocio("acao_desconhecida");
    }
  });
}
