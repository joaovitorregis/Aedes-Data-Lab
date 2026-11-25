// Regras e palavras da ocorrência usadas na área do agente.
// Não dependem de tela nem de rede (docs/ARCHITECTURE.md, seção 4); o servidor confere tudo de novo.

export const ETAPAS = { recebida: "Recebida", em_analise: "Em análise", atendida: "Atendida", encerrada: "Encerrada" };
export const ORIGENS = { cidadao: "Cidadão", agente: "Agente" };
export const ACESSOS = {
  com_acesso: "Com acesso", fechado: "Imóvel fechado", recusado: "Morador recusou", nao_localizado: "Local não encontrado",
};
export const LOCAIS_DO_FOCO = {
  residencia: "Residência", comercio: "Comércio", terreno_baldio: "Terreno baldio", outro: "Outro local",
};
export const RECIPIENTES = {
  pneus: "Pneus",
  baldes_bacias_caixas: "Baldes, bacias ou caixas-d’água",
  vasos_pratos: "Vasos de planta ou pratos de vaso",
  piscinas: "Piscinas",
  lonas_coberturas: "Lonas ou coberturas que acumulam água",
  lixo_entulho: "Lixo ou entulho",
  pocas_alagados: "Poças ou áreas alagadas",
  outro_recipiente: "Outro recipiente ou estrutura",
  nao_identificado: "Não foi possível identificar",
};
export const LARVAS = { sim: "Sim", nao: "Não", nao_sei: "Não sei" };
export const ACOES_NO_LOCAL = {
  orientacao: "Orientação ao morador",
  deposito_eliminado: "Depósito eliminado",
  larvicida_aplicado: "Larvicida aplicado",
  amostra_coletada: "Amostra coletada",
  pedido_bloqueio_fumace: "Pedido de bloqueio ou fumacê",
};

const FUSO = "America/Recife";
const DIA_MS = 86_400_000;
export const DIAS_NA_LIXEIRA = 30;

const formatadorDia = new Intl.DateTimeFormat("en-CA", { timeZone: FUSO, year: "numeric", month: "2-digit", day: "2-digit" });
const formatadorHora = new Intl.DateTimeFormat("pt-BR", { timeZone: FUSO, hour: "2-digit", minute: "2-digit" });

// "AAAA-MM-DD" no fuso de Itambé.
export const dataLocal = (instante) => formatadorDia.format(new Date(instante));
export const hojeLocal = (agora = new Date()) => dataLocal(agora);
const utc = (dia) => Date.parse(`${dia}T00:00:00Z`);
export const diasEntre = (de, ate) => Math.round((utc(ate) - utc(de)) / DIA_MS);
export const somarDias = (dia, n) => new Date(utc(dia) + n * DIA_MS).toISOString().slice(0, 10);
export const formatarData = (dia) => dia.split("-").reverse().join("/");
export const formatarDiaMes = (dia) => formatarData(dia).slice(0, 5);
export const formatarDataHora = (instante) => `${formatarData(dataLocal(instante))} · ${formatadorHora.format(new Date(instante))}`;

export const diasAberta = (o, hoje = hojeLocal()) => Math.max(0, diasEntre(dataLocal(o.received_at), hoje));
export const emAberto = (o) => o.stage === "recebida" || o.stage === "em_analise";
export const arquivada = (o) => o.publication === "arquivada";

export function prazoDaLixeira(arquivadaEm, agora = new Date()) {
  const ate = somarDias(dataLocal(arquivadaEm), DIAS_NA_LIXEIRA);
  const restam = diasEntre(hojeLocal(agora), ate);
  const vencido = agora.getTime() - new Date(arquivadaEm).getTime() > DIAS_NA_LIXEIRA * DIA_MS;
  return { ate, diasRestantes: Math.max(0, restam), vencido };
}

export function filtrar(lista, f = {}) {
  const numero = (f.protocolo ?? "").trim().toLowerCase();
  const passa = (o) => {
    const recebida = dataLocal(o.received_at);
    return (!numero || o.protocol.toLowerCase().includes(numero))
      && (!f.bairro || o.neighborhood_id === Number(f.bairro))
      && (!f.etapas?.length || f.etapas.includes(o.stage))
      && (!f.origem || o.origin === f.origem)
      && (!f.de || recebida >= f.de)
      && (!f.ate || recebida <= f.ate)
      && (!f.semAcesso || (o.stage === "em_analise" && o.failed_attempts > 0));
  };
  const sentido = f.ordem === "recentes" ? -1 : 1;
  return lista.filter(passa).sort((a, b) => sentido * (new Date(a.received_at) - new Date(b.received_at)));
}

export const resumo = (lista) => ({
  recebidas: lista.filter((o) => o.stage === "recebida").length,
  emAnalise: lista.filter((o) => o.stage === "em_analise").length,
  semAcesso: lista.filter((o) => o.stage === "em_analise" && o.failed_attempts > 0).length,
});

// O que o detalhe oferece em cada situação (RF-AGE-01).
export function acoesDaOcorrencia(o) {
  const principal = o.stage === "recebida" ? "iniciar_analise" : o.stage === "em_analise" ? "registrar_visita" : null;
  const outras = [
    ...(o.stage === "em_analise" ? ["observacao"] : []),
    "corrigir",
    arquivada(o) ? "voltar_ao_mapa" : "arquivar",
  ];
  return { principal, podeEncerrar: o.stage === "em_analise" && o.failed_attempts >= 3, outras };
}

const maiuscula = (t) => t.charAt(0).toUpperCase() + t.slice(1);
// O formulário do cidadão grava o texto da opção; a visita grava um código.
export const rotuloRecipiente = (codigo) => RECIPIENTES[codigo] ?? maiuscula(String(codigo));

export const idValido = (id) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id ?? "");

// Passos do histórico, do mais novo ao mais antigo. `autores` liga id de usuário a nome.
export function linhaDoTempo(eventos, { autores = {}, nomeDoCidadao = "", origem = "cidadao" } = {}) {
  const quem = (id) => autores[id] ?? "Agente";
  const passo = (e) => {
    const nome = quem(e.author_id);
    const novo = e.new_value ?? {};
    switch (e.event_type) {
      case "recebida":
        return origem === "agente" ? null : { titulo: `${nomeDoCidadao || "Cidadão"} fez a denúncia`, detalhe: "Cidadão" };
      case "analise_iniciada":
        return { titulo: `${nome} iniciou a análise`, detalhe: "Agente" };
      case "visita_registrada": {
        if (novo.access && novo.access !== "com_acesso") {
          return { titulo: `${nome} registrou visita sem acesso`,
            detalhe: `Agente · ${ACESSOS[novo.access].toLowerCase()} · ${novo.failed_attempts}ª tentativa` };
        }
        return { titulo: `${nome} registrou visita com acesso`,
          detalhe: origem === "agente" ? "Agente · ocorrência criada e Atendida" : "Agente · ocorrência Atendida" };
      }
      case "observacao":
        return { titulo: `${nome} anotou uma observação`, detalhe: `Agente · ${e.reason}` };
      case "encerrada_sem_acesso":
        return { titulo: `${nome} encerrou sem acesso`, detalhe: `Agente · ${e.reason}` };
      case "arquivada":
        return { titulo: `${nome} arquivou ${origem === "agente" ? "a ocorrência" : "a denúncia"}`, detalhe: `Agente · ${e.reason}` };
      case "voltou_ao_mapa":
        return { titulo: `${nome} devolveu ao mapa`, detalhe: "Agente" };
      case "correcao":
        return { titulo: e.author_id ? `${nome} corrigiu os dados` : `${nomeDoCidadao || "Cidadão"} corrigiu os dados`,
          detalhe: `${e.author_id ? "Agente" : "Cidadão"} · ${e.reason}` };
      default:
        return null; // "publicada" é passo do sistema, não de uma pessoa.
    }
  };
  return [...eventos]
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at) || b.id - a.id)
    .map((e) => { const p = passo(e); return p && { ...p, quando: e.created_at }; })
    .filter(Boolean);
}

export function formatarTelefone(digitos = "") {
  const d = digitos.replace(/\D/g, "");
  if (d.length < 10) return digitos;
  return `(${d.slice(0, 2)}) ${d.slice(2, -4)}-${d.slice(-4)}`;
}
