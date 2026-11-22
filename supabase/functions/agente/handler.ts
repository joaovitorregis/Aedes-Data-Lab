// =====================================================================
// agente: todas as AÇÕES que mudam dados na área do agente (RF-AGE-02 a 07, RF-AGE-10, RF-COR-01).
//
// A leitura (fila, detalhe) o navegador faz direto no banco com o login do
// agente, protegido pelo RLS. Aqui ficam só as ESCRITAS (ADR-008).
//
// Segurança em camadas:
//   1. o navegador envia o login (JWT) no cabeçalho Authorization;
//   2. esta função confere o login com o Supabase Auth (usuarioDoToken);
//   3. o banco confere DE NOVO se aquele usuário é agente ativo (require_agent).
// A chave pública (anon) também é um JWT válido, mas NÃO identifica um usuário:
// o passo 2 a recusa (401) e o passo 3 recusaria de qualquer forma.
//
// Entrada JSON: { acao, ... }. Ações:
//   iniciar_analise      { report_id, version }
//   registrar_visita     { report_id, version, visita }
//   adicionar_observacao { report_id, texto }
//   encerrar_sem_acesso  { report_id, version }
//   arquivar             { report_id, motivo, confirmado }
//   voltar_ao_mapa       { report_id }
//   corrigir             { report_id, changes, reason, version? }
// Entrada multipart (foto): acao=criar_ocorrencia, dados (JSON), fotos (1 a 3)
// =====================================================================
import { ErroNegocio } from "../_shared/erros.ts";
import { gerarPublicas, gravarOriginais, lerDadosDoForm, lerFotos, publicar } from "../_shared/fotos.ts";
import { envolver, escolher, exigirInteiro, exigirTexto, exigirUuid, lerJson, responder } from "../_shared/http.ts";
import { BUCKET_ORIGINAIS, BUCKET_PUBLICO, type Servico } from "../_shared/servico.ts";

const CAMPOS_OCORRENCIA = [
  "submission_id", "lat", "lng", "neighborhood_id", "category_id", "description",
  "place_address", "place_reference",
];
const CAMPOS_VISITA = [
  "id", "visited_on", "access", "focus_location", "focus_location_other",
  "water_present", "containers", "larvae", "actions", "notes",
];

async function autenticar(req: Request, svc: Servico): Promise<string> {
  const cabecalho = req.headers.get("authorization") ?? "";
  const jwt = cabecalho.toLowerCase().startsWith("bearer ") ? cabecalho.slice(7).trim() : "";
  const id = jwt ? await svc.usuarioDoToken(jwt) : null;
  if (!id) throw new ErroNegocio("nao_autenticado");
  return id;
}

export function criarHandler(svc: Servico) {
  return envolver(svc, async (req) => {
    const agente = await autenticar(req, svc);
    const ok = (corpo: unknown, status = 200) => responder(req, svc, status, corpo);

    // ---- com fotos: registrar foco em local sem denúncia (RF-AGE-10) ----
    if ((req.headers.get("content-type") ?? "").startsWith("multipart/form-data")) {
      const form = await req.formData();
      if (form.get("acao") !== "criar_ocorrencia") throw new ErroNegocio("acao_desconhecida");
      const dados = lerDadosDoForm(form);
      const tentativa = exigirUuid(dados.submission_id);
      const visita = (typeof dados.visit === "object" && dados.visit !== null ? dados.visit : {}) as Record<string, unknown>;
      const fotos = await lerFotos(form);

      const originais = await gravarOriginais(svc, tentativa, fotos);
      let r: { report_id: string; protocol: string; already_existed: boolean; publication: string };
      try {
        r = await svc.rpc("api_create_agent_report", {
          p_agent: agente,
          p: { ...escolher(dados, CAMPOS_OCORRENCIA), visit: escolher(visita, CAMPOS_VISITA), photos: originais },
        });
      } catch (e) {
        await svc.armazenamento.remover(BUCKET_ORIGINAIS, originais).catch(() => {});
        throw e;
      }
      const publication = r.publication === "publicada" ? "publicada" : await publicar(svc, r.report_id, originais);
      return ok({ protocol: r.protocol, report_id: r.report_id, publication, already_existed: r.already_existed },
        r.already_existed ? 200 : 201);
    }

    // ---- ações em JSON ----
    const c = await lerJson(req);
    switch (c.acao) {
      case "iniciar_analise":
        return ok(await svc.rpc("api_start_analysis", {
          p_agent: agente, p_report_id: exigirUuid(c.report_id), p_version: exigirInteiro(c.version) }));

      case "registrar_visita":
        return ok(await svc.rpc("api_register_visit", {
          p_agent: agente, p_report_id: exigirUuid(c.report_id), p_version: exigirInteiro(c.version),
          p_visit: escolher((c.visita ?? {}) as Record<string, unknown>, CAMPOS_VISITA) }));

      case "adicionar_observacao":
        return ok(await svc.rpc("api_add_note", {
          p_agent: agente, p_report_id: exigirUuid(c.report_id), p_text: exigirTexto(c.texto, 500) }));

      case "encerrar_sem_acesso":
        return ok(await svc.rpc("api_close_without_access", {
          p_agent: agente, p_report_id: exigirUuid(c.report_id), p_version: exigirInteiro(c.version) }));

      case "corrigir":
        return ok(await svc.rpc("api_correct_fields_agent", {
          p_agent: agente, p_report_id: exigirUuid(c.report_id),
          p_changes: typeof c.changes === "object" && c.changes !== null ? c.changes : {},
          p_reason: exigirTexto(c.reason ?? "", 500),
          p_expected_version: c.version === undefined ? null : exigirInteiro(c.version) }));

      case "arquivar": {
        const id = exigirUuid(c.report_id);
        // 1) o banco decide e tira a denúncia do mapa NA HORA.
        const r = await svc.rpc<{ already_archived: boolean; public_photo_paths: string[] }>("api_archive_report", {
          p_agent: agente, p_report_id: id, p_reason: exigirTexto(c.motivo ?? "", 500), p_confirmed: c.confirmado === true });
        // 2) apaga as fotos públicas do bucket e 3) confirma ao banco. Se falhar, a
        //    denúncia JÁ está fora do mapa e a rotina diária repete a remoção.
        let remocao_pendente = false;
        try {
          await svc.armazenamento.remover(BUCKET_PUBLICO, r.public_photo_paths);
          if (!r.already_archived) await svc.rpc("api_clear_public_photo_paths", { p_report_id: id });
        } catch (e) {
          console.error("remoção das fotos públicas ficou pendente:", id, e);
          remocao_pendente = true;
        }
        return ok({ already_archived: r.already_archived, remocao_pendente });
      }

      case "voltar_ao_mapa": {
        const id = exigirUuid(c.report_id);
        // Checagem prévia: não gera foto nem mexe em arquivo se o banco vai recusar.
        const pre = await svc.rpc<{ already: boolean }>("api_check_restore", { p_agent: agente, p_report_id: id });
        if (pre.already) return ok({ restored: false, reason: "ja_publicada" });

        const originais = await svc.rpc<string[]>("api_get_original_paths", { p_report_id: id });
        const publicos = await gerarPublicas(svc, id, originais);
        try {
          return ok(await svc.rpc("api_restore_to_map", { p_agent: agente, p_report_id: id, p_photo_paths: publicos }));
        } catch (e) {
          // Só apaga o que acabou de enviar quando o banco confirma que a denúncia NÃO deve ficar publicada.
          const msg = (e as { message?: string }).message ?? "";
          if (msg.startsWith("fora_do_prazo") || msg.startsWith("nao_arquivada")) {
            await svc.armazenamento.remover(BUCKET_PUBLICO, publicos).catch(() => {});
          }
          throw e;
        }
      }

      default:
        throw new ErroNegocio("acao_desconhecida");
    }
  });
}
