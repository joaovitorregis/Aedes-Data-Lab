// Filtros de Ocorrências (RF-AGE-01) traduzidos para a consulta paginada ao banco.
// Só entram valores conhecidos: o que vem do endereço da página não vai cru para a consulta.
import { ETAPAS, ORIGENS, somarDias } from "./ocorrencia.js";

// Itambé não tem horário de verão: o dia começa às 00:00 de UTC−3.
const inicioDoDia = (dia) => `${dia}T00:00:00-03:00`;
const ehDia = (t) => /^\d{4}-\d{2}-\d{2}$/.test(t ?? "");

export function consultaDaLista(f = {}) {
  const filtros = [];
  const protocolo = (f.protocolo ?? "").replace(/[^a-z0-9-]/gi, "");
  if (protocolo) filtros.push(`protocol=ilike.*${protocolo}*`);
  if (Number(f.bairro) > 0) filtros.push(`neighborhood_id=eq.${Number(f.bairro)}`);
  const etapas = (f.etapas ?? []).filter((e) => Object.hasOwn(ETAPAS, e));
  if (etapas.length) filtros.push(`stage=in.(${etapas.join(",")})`);
  if (Object.hasOwn(ORIGENS, f.origem ?? "")) filtros.push(`origin=eq.${f.origem}`);
  if (ehDia(f.de)) filtros.push(`received_at=gte.${inicioDoDia(f.de)}`);
  if (ehDia(f.ate)) filtros.push(`received_at=lt.${inicioDoDia(somarDias(f.ate, 1))}`);
  if (f.semAcesso) filtros.push("stage=eq.em_analise", "failed_attempts=gt.0");
  const sentido = f.ordem === "recentes" ? "desc" : "asc";
  return { filtros, ordem: `received_at.${sentido},id.${sentido}` };
}

// Os três números do topo, sempre dentro do recorte filtrado (D54).
export function consultasDoResumo(f = {}) {
  const { filtros } = consultaDaLista(f);
  return {
    recebidas: [...filtros, "stage=eq.recebida"],
    emAnalise: [...filtros, "stage=eq.em_analise"],
    semAcesso: [...filtros, "stage=eq.em_analise", "failed_attempts=gt.0"],
  };
}

export const temFiltro = (f) => consultaDaLista(f).filtros.length > 0;
