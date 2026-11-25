// =====================================================================
// salvar-denuncia: recebe a denúncia do cidadão (RF-DEN-01 a RF-DEN-05).
//
// Entrada: multipart/form-data com
//   dados  = JSON com os campos da denúncia (ver CAMPOS abaixo)
//   fotos  = de 1 a 3 arquivos JPEG/PNG
// Saída (201, ou 200 se o envio já tinha sido gravado):
//   { protocol, publication: "publicada" | "pendente", already_existed }
//
// Ordem das etapas (ARCHITECTURE 5): valida -> grava originais no bucket
// privado -> banco grava tudo numa transação e gera o protocolo -> só então
// trata e publica as fotos. Falha ANTES da gravação = nenhum protocolo.
// Falha DEPOIS = protocolo entregue com "publicação pendente" (D14).
// =====================================================================
import { ErroNegocio } from "../_shared/erros.ts";
import { gravarOriginais, lerDadosDoForm, lerFotos, publicar } from "../_shared/fotos.ts";
import { chaveDoCliente, envolver, escolher, exigirUuid, limitar, responder } from "../_shared/http.ts";
import { BUCKET_ORIGINAIS, type Servico } from "../_shared/servico.ts";

// Só estes campos passam do navegador para o banco. O resto é descartado:
// o navegador não escolhe protocolo, etapa, origem, autor nem os caminhos das fotos.
const CAMPOS = [
  "submission_id", "lat", "lng", "neighborhood_id", "category_id", "description",
  "focus_location", "focus_location_other", "water_present", "containers", "larvae",
  "noticed_since", "other_evidence", "name", "email", "phone", "address", "reference",
  "confirmed_channel", "confirmed_contact",
];

export function criarHandler(svc: Servico) {
  return envolver(svc, async (req) => {
    if (!(req.headers.get("content-type") ?? "").startsWith("multipart/form-data")) throw new ErroNegocio("json_invalido");
    await limitar(svc, `ip-denuncia:${await chaveDoCliente(req)}`, 10, 3600);

    const form = await req.formData();
    const dados = lerDadosDoForm(form);
    const tentativa = exigirUuid(dados.submission_id);
    const fotos = await lerFotos(form);

    const originais = await gravarOriginais(svc, tentativa, fotos);
    let r: { report_id: string; protocol: string; already_existed: boolean; publication: string };
    try {
      r = await svc.rpc("api_save_report", { p: { ...escolher(dados, CAMPOS), photos: originais } });
    } catch (e) {
      // Não gravou: não deixa foto solta no bucket privado.
      await svc.armazenamento.remover(BUCKET_ORIGINAIS, originais).catch(() => {});
      throw e;
    }

    // Já publicada num envio anterior? Não refaz. Senão, tenta (de novo) publicar.
    const publication = r.publication === "publicada" ? "publicada" : await publicar(svc, r.report_id, originais);
    return responder(req, svc, r.already_existed ? 200 : 201, {
      protocol: r.protocol, publication, already_existed: r.already_existed,
    });
  });
}
