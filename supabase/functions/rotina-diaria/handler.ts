// =====================================================================
// rotina-diaria: a faxina automática (D44, RF-DEN-05, RNF-06). Roda 1x por dia.
//
//   1. Fotos públicas "esquecidas": denúncias arquivadas cujas fotos públicas
//      ainda constam no banco (a remoção anterior falhou) -> apaga e confirma.
//   2. Lixeira: arquivadas há mais de 30 dias -> apaga os ARQUIVOS (originais e
//      públicos) e SÓ DEPOIS o registro (dados privados, visitas e histórico).
//   3. Publicações pendentes: denúncias gravadas cuja publicação falhou -> tenta
//      de novo, com o mesmo registro.
//
// Não é aberta ao público: exige o cabeçalho "Authorization: Bearer <CRON_SECRET>".
// Cada item roda isolado: um erro não impede os demais.
//
// Entrada: POST sem corpo. Saída: contagens do que foi feito e de quantos falharam.
// =====================================================================
import { ErroNegocio } from "../_shared/erros.ts";
import { publicar } from "../_shared/fotos.ts";
import { envolver, responder } from "../_shared/http.ts";
import { BUCKET_ORIGINAIS, BUCKET_PUBLICO, type Servico } from "../_shared/servico.ts";

// Compara dois textos sem pressa variável (evita descobrir o segredo pelo tempo de resposta).
function iguais(a: string, b: string): boolean {
  const ea = new TextEncoder().encode(a), eb = new TextEncoder().encode(b);
  let diferenca = ea.length ^ eb.length;
  for (let i = 0; i < Math.max(ea.length, eb.length); i++) diferenca |= (ea[i] ?? 0) ^ (eb[i] ?? 0);
  return diferenca === 0;
}

export function criarHandler(svc: Servico) {
  return envolver(svc, async (req) => {
    const cabecalho = req.headers.get("authorization") ?? "";
    const enviado = cabecalho.toLowerCase().startsWith("bearer ") ? cabecalho.slice(7).trim() : "";
    // Segredo vazio na configuração = rotina desligada (nunca aceita "sem senha").
    if (!svc.config.segredoRotina || !iguais(enviado, svc.config.segredoRotina)) throw new ErroNegocio("rotina_nao_autorizada");

    const resumo = { fotos_publicas_removidas: 0, lixeira_removidas: 0, publicadas: 0, falhas: 0 };

    // 1) fotos públicas de arquivadas
    const pendentesLimpeza = await svc.rpc<{ report_id: string; public_paths: string[] }[]>("api_pending_public_cleanup", {});
    for (const item of pendentesLimpeza) {
      try {
        await svc.armazenamento.remover(BUCKET_PUBLICO, item.public_paths);
        await svc.rpc("api_clear_public_photo_paths", { p_report_id: item.report_id });
        resumo.fotos_publicas_removidas++;
      } catch (e) { console.error("limpeza pública falhou:", item.report_id, e); resumo.falhas++; }
    }

    // 2) lixeira vencida: arquivos primeiro, registro depois
    const vencidas = await svc.rpc<{ report_id: string; original_paths: string[]; public_paths: string[] }[]>("api_trash_due", {});
    for (const item of vencidas) {
      try {
        await svc.armazenamento.remover(BUCKET_ORIGINAIS, item.original_paths);
        await svc.armazenamento.remover(BUCKET_PUBLICO, item.public_paths);
        await svc.rpc("api_purge_report", { p_report_id: item.report_id });
        resumo.lixeira_removidas++;
      } catch (e) { console.error("remoção da lixeira falhou:", item.report_id, e); resumo.falhas++; }
    }

    // 3) publicações pendentes
    const pendentes = await svc.rpc<{ report_id: string; original_paths: string[] }[]>("api_pending_publication", {});
    for (const item of pendentes) {
      if (await publicar(svc, item.report_id, item.original_paths) === "publicada") resumo.publicadas++;
      else resumo.falhas++;
    }

    return responder(req, svc, 200, resumo);
  });
}
