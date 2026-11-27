// Regras do registro de visita (PRD 8.1, RF-AGE-03 e RF-AGE-10).
import { dentroDoTerritorio } from "./denuncia.js";
import {
  ACESSOS, ACOES_NO_LOCAL, LARVAS, LOCAIS_DO_FOCO, formatarData, rotuloRecipiente,
} from "./ocorrencia.js";

export const LIMITE_OBSERVACOES = 500;
export const LIMITE_DESCRICAO = 1000;

function validarData(data, { recebidaEm, hoje }) {
  if (!data) return "Informe a data da visita.";
  if (data > hoje) return "A data não pode ser futura.";
  if (recebidaEm && data < recebidaEm) return "A data não pode ser anterior ao recebimento.";
  return "";
}

// Respostas sobre o que foi encontrado, obrigatórias quando houve acesso.
function errosDoAtendimento(f) {
  const e = {};
  if (!f.foco) e.foco = "Escolha onde está o foco.";
  if (f.foco === "outro" && !f.focoOutro?.trim()) e.focoOutro = "Diga qual é o outro local.";
  if (!f.agua) e.agua = "Diga se há água acumulada.";
  if (f.agua === "sim" && !f.recipientes?.length) e.recipientes = "Marque pelo menos um recipiente.";
  if (!f.larvas) e.larvas = "Diga se há larvas ou pupas.";
  if (!f.acoes?.length) e.acoes = "Marque o que foi feito no local.";
  return e;
}

const errosDeTexto = (f) =>
  (f.observacoes?.trim().length ?? 0) > LIMITE_OBSERVACOES
    ? { observacoes: `Use até ${LIMITE_OBSERVACOES} caracteres.` } : {};

export function validarVisita(f, regras) {
  const e = { ...errosDeTexto(f) };
  const data = validarData(f.data, regras);
  if (data) e.data = data;
  if (!f.acesso) e.acesso = "Escolha o acesso ao local.";
  return f.acesso === "com_acesso" ? { ...e, ...errosDoAtendimento(f) } : e;
}

export function montarVisita(f, id) {
  const base = { id, visited_on: f.data, access: f.acesso };
  const notes = f.observacoes?.trim() || null;
  if (f.acesso !== "com_acesso") return { ...base, notes };
  return {
    ...base,
    focus_location: f.foco,
    focus_location_other: f.foco === "outro" ? f.focoOutro.trim().slice(0, 120) : null,
    water_present: f.agua === "sim",
    containers: f.agua === "sim" ? [...f.recipientes] : [],
    larvae: f.larvas,
    actions: [...f.acoes],
    notes,
  };
}

export function resumoDaVisita(v) {
  const linhas = [["Data", formatarData(v.visited_on)], ["Acesso", ACESSOS[v.access]]];
  if (v.access === "com_acesso") {
    linhas.push(
      ["Onde está o foco", v.focus_location === "outro" ? v.focus_location_other : LOCAIS_DO_FOCO[v.focus_location]],
      ["Há água acumulada", v.water_present ? "Sim" : "Não"],
    );
    if (v.containers.length) linhas.push(["Recipientes com água", v.containers.map(rotuloRecipiente).join(" · ")]);
    linhas.push(["Larvas ou pupas", LARVAS[v.larvae]], ["O que foi feito", v.actions.map((a) => ACOES_NO_LOCAL[a]).join(" · ")]);
  }
  if (v.notes) linhas.push(["Observações", v.notes]);
  return linhas;
}

export const efeitoDaVisita = (acesso, tentativas) => acesso === "com_acesso"
  ? "A ocorrência ficará Atendida e não poderá ser reaberta."
  : `A ocorrência continua Em análise. Esta é a ${tentativas + 1}ª tentativa sem acesso.`;

// Foco encontrado em local sem denúncia: vira ocorrência de agente, já Atendida.
export function validarFoco(f, { hoje }) {
  const e = { ...errosDoAtendimento(f), ...errosDeTexto(f) };
  const data = validarData(f.data, { hoje });
  if (data) e.data = data;
  if (!f.bairroId) e.bairroId = "Escolha o bairro.";
  if ((f.rua?.trim().length ?? 0) < 3) e.rua = "Informe a rua, avenida ou logradouro.";
  if (!f.categoriaId) e.categoriaId = "Escolha o que foi encontrado.";
  if (!f.descricao?.trim()) e.descricao = "Descreva o que você observou.";
  else if (f.descricao.trim().length > LIMITE_DESCRICAO) e.descricao = `Use até ${LIMITE_DESCRICAO} caracteres.`;
  if (!f.ponto) e.ponto = "Marque o foco no mapa.";
  else if (!dentroDoTerritorio(f.ponto.lat, f.ponto.lng)) e.ponto = "O ponto está fora de Itambé.";
  if (!f.fotos?.length) e.fotos = "Anexe pelo menos uma foto do foco.";
  else if (f.fotos.length > 3) e.fotos = "Envie no máximo 3 fotos.";
  return e;
}

export function montarFoco(f, { submissionId, visitaId }) {
  return {
    submission_id: submissionId,
    lat: f.ponto.lat,
    lng: f.ponto.lng,
    neighborhood_id: Number(f.bairroId),
    category_id: Number(f.categoriaId),
    description: f.descricao.trim(),
    place_address: [f.rua.trim(), f.numero?.trim()].filter(Boolean).join(", ").slice(0, 200),
    place_reference: f.referencia?.trim().slice(0, 200) || null,
    visit: montarVisita({ ...f, acesso: "com_acesso" }, visitaId),
  };
}
