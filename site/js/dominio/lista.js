// Filtros de Ocorrências (RF-AGE-01) traduzidos para a consulta paginada ao banco.
// Só entram valores conhecidos: o que vem do endereço da página não vai cru para a consulta.
import { ETAPAS, ORIGENS, somarDias } from "./ocorrencia.js";

// Itambé não tem horário de verão: o dia começa às 00:00 de UTC−3.
const inicioDoDia = (dia) => `${dia}T00:00:00-03:00`;
const ehDia = (t) => /^\d{4}-\d{2}-\d{2}$/.test(t ?? "");

// Arquivadas têm tela própria: Ocorrências nunca as mostra (D57).
const FORA_DA_LIXEIRA = "publication=neq.arquivada";
const NA_LIXEIRA = "publication=eq.arquivada";

function filtroDoProtocolo(texto = "") {
  const limpo = texto.replace(/[^a-z0-9-]/gi, "");
  return limpo ? [`protocol=ilike.*${limpo}*`] : [];
}

// Só o que a pessoa escolheu na busca e nos filtros.
function filtrosEscolhidos(f) {
  const filtros = filtroDoProtocolo(f.protocolo);
  if (Number(f.bairro) > 0) filtros.push(`neighborhood_id=eq.${Number(f.bairro)}`);
  const etapas = (f.etapas ?? []).filter((e) => Object.hasOwn(ETAPAS, e));
  if (etapas.length) filtros.push(`stage=in.(${etapas.join(",")})`);
  if (Object.hasOwn(ORIGENS, f.origem ?? "")) filtros.push(`origin=eq.${f.origem}`);
  if (ehDia(f.de)) filtros.push(`received_at=gte.${inicioDoDia(f.de)}`);
  if (ehDia(f.ate)) filtros.push(`received_at=lt.${inicioDoDia(somarDias(f.ate, 1))}`);
  if (f.semAcesso) filtros.push("stage=eq.em_analise", "failed_attempts=gt.0");
  return filtros;
}

export function consultaDaLista(f = {}) {
  const sentido = f.ordem === "recentes" ? "desc" : "asc";
  return { filtros: [FORA_DA_LIXEIRA, ...filtrosEscolhidos(f)], ordem: `received_at.${sentido},id.${sentido}` };
}

export const consultaDasArquivadas = (f = {}) => ({
  filtros: [NA_LIXEIRA, ...filtroDoProtocolo(f.protocolo)], ordem: "archived_at.desc,id.desc",
});

// Os três números do topo, sempre dentro do recorte filtrado (D54).
export function consultasDoResumo(f = {}) {
  const { filtros } = consultaDaLista(f);
  return {
    recebidas: [...filtros, "stage=eq.recebida"],
    emAnalise: [...filtros, "stage=eq.em_analise"],
    semAcesso: [...filtros, "stage=eq.em_analise", "failed_attempts=gt.0"],
  };
}

export const temFiltro = (f) => filtrosEscolhidos(f).length > 0;
