// =====================================================================
// mapa.js (serviço) — lê as denúncias PÚBLICAS para o mapa.
// A tabela public_reports só tem o que pode ser público: nunca o ponto exato,
// nem nome, e-mail, telefone ou endereço (PRD 8.1, SECURITY.md).
// =====================================================================
import { lerTabela, urlFotoPublica } from "./api.js";

const COLUNAS = "report_id,neighborhood_id,category_id,description,received_at,stage,cell_center_lat,cell_center_lng,photo_paths";

export async function listarDenunciasPublicas() {
  const linhas = await lerTabela(`public_reports?select=${COLUNAS}&order=received_at.desc&limit=1000`);
  return linhas.map((l) => ({
    id: l.report_id,
    bairroId: l.neighborhood_id,
    categoriaId: l.category_id,
    descricao: l.description,
    recebidaEm: l.received_at,
    etapa: l.stage,
    // O mapa desenha o CENTRO da célula de 200 m, não o ponto exato.
    lat: l.cell_center_lat,
    lng: l.cell_center_lng,
    fotos: (l.photo_paths ?? []).map(urlFotoPublica),
  }));
}
