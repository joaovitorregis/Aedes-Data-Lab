// Regras do mapa público: filtros por localidade, período e etapa.
import { dataLocal } from "./ocorrencia.js";

const DIA_MS = 86_400_000;

export function filtrarPublicas(lista, { periodo = "", bairroId = "", etapas = [] } = {}, agora = new Date()) {
  const recente = (recebidaEm) => {
    if (periodo === "hoje") return dataLocal(recebidaEm) === dataLocal(agora);
    return !periodo || agora - new Date(recebidaEm) <= Number(periodo) * DIA_MS;
  };
  return lista.filter((d) =>
    recente(d.recebidaEm)
    && (!bairroId || String(d.bairroId) === String(bairroId))
    && (!etapas.length || etapas.includes(d.etapa)));
}

// O mapa só conhece o centro da célula: quem está na mesma área divide o ponto.
export function agruparPorArea(lista) {
  const areas = new Map();
  for (const denuncia of lista) {
    const chave = `${denuncia.lat},${denuncia.lng}`;
    if (!areas.has(chave)) areas.set(chave, { lat: denuncia.lat, lng: denuncia.lng, denuncias: [] });
    areas.get(chave).denuncias.push(denuncia);
  }
  return [...areas.values()];
}
