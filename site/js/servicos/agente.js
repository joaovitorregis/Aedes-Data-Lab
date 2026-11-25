// Contratos da área do agente (docs/ARCHITECTURE.md, seção 5).
// Leituras vão direto ao banco com o login (o RLS decide); escritas passam pela Edge Function `agente`.
import { ErroApi } from "./api.js";
import { baixarArquivoPrivado, contar, pedirComLogin, pedirPagina } from "./api-agente.js";
import { sessaoAtual, tokenValido } from "./sessao.js";
import { idValido } from "../dominio/ocorrencia.js";
import { consultaDaLista, consultasDoResumo } from "../dominio/lista.js";
import { montarRelatorio } from "../dominio/relatorio.js";

export { listarBairros, listarCategorias } from "./denuncia.js";

const PAGINA = 1000;
export const OCORRENCIAS_POR_PAGINA = 20;

async function comToken(pedido) {
  try {
    return await pedido(await tokenValido());
  } catch (e) {
    if (e.status !== 401 || e.codigo === "sessao_expirada") throw e;
    // O token pode ter vencido no caminho: renova uma vez e repete.
    return pedido(await tokenValido({ forcarRenovacao: true }));
  }
}

const comLogin = (caminho, opcoes) => comToken((token) => pedirComLogin(caminho, token, opcoes));

const ler = (consulta) => comLogin(`/rest/v1/${consulta}`);

// A API devolve no máximo 1000 linhas por pedido.
async function lerTudo(consulta) {
  const linhas = [];
  for (let inicio = 0; ; inicio += PAGINA) {
    const parte = await ler(`${consulta}&limit=${PAGINA}&offset=${inicio}`);
    linhas.push(...parte);
    if (parte.length < PAGINA) return linhas;
  }
}

const agir = (corpo) => comLogin("/functions/v1/agente", { method: "POST", corpo });

const COLUNAS_DA_LISTA =
  "id,protocol,origin,stage,publication,neighborhood_id,received_at,failed_attempts,archived_at,location_lat,location_lng";

const consultaDeOcorrencias = (colunas, filtros, resto = []) =>
  `reports?${[`select=${colunas}`, ...filtros, ...resto].join("&")}`;

// Uma página da lista, já filtrada e ordenada pelo banco (RNF-07).
export async function listarOcorrencias(escolhidos = {}, { inicio = 0 } = {}) {
  const { filtros, ordem } = consultaDaLista(escolhidos);
  const consulta = consultaDeOcorrencias(COLUNAS_DA_LISTA, filtros,
    [`order=${ordem}`, `limit=${OCORRENCIAS_POR_PAGINA}`, `offset=${inicio}`]);
  try {
    const { linhas, total } = await comToken((token) => pedirPagina(`/rest/v1/${consulta}`, token));
    return { itens: linhas, total };
  } catch (e) {
    // A página pedida deixou de existir (outra pessoa mexeu na lista).
    if (e.status === 416) return { itens: [], total: inicio };
    throw e;
  }
}

// Resumo do mesmo recorte da lista (D54), só com contagens.
export async function resumoDasOcorrencias(escolhidos = {}) {
  const consultas = Object.entries(consultasDoResumo(escolhidos));
  const totais = await Promise.all(consultas.map(([, filtros]) =>
    comToken((token) => contar(`/rest/v1/${consultaDeOcorrencias("id", filtros)}`, token))));
  return Object.fromEntries(consultas.map(([nome], i) => [nome, totais[i]]));
}

// O mapa precisa de todos os pontos do recorte; vêm em lotes e só com as colunas que ele usa.
export function pontosDoMapa(escolhidos = {}) {
  const { filtros, ordem } = consultaDaLista(escolhidos);
  return lerTudo(consultaDeOcorrencias("id,protocol,origin,stage,neighborhood_id,location_lat,location_lng",
    filtros, [`order=${ordem}`]));
}

export const ocorrenciasEmAnalise = () => lerTudo(consultaDeOcorrencias(
  "id,protocol,neighborhood_id,failed_attempts", ["stage=eq.em_analise"], ["order=received_at.asc,id.asc"]));

const naoEncontrada = () => new ErroApi("denuncia_nao_encontrada", "Ocorrência não encontrada.", 404);

export async function obterOcorrencia(id) {
  if (!idValido(id)) throw naoEncontrada(); // endereço digitado errado ou cortado
  const chave = encodeURIComponent(id);
  const [[ocorrencia], [privado], fotos, visitas, eventos] = await Promise.all([
    ler(`reports?select=*&id=eq.${chave}`),
    ler(`report_private?select=*&report_id=eq.${chave}`),
    ler(`report_photos?select=position,original_path&report_id=eq.${chave}&order=position.asc`),
    ler(`report_visits?select=*&report_id=eq.${chave}&order=created_at.asc`),
    ler(`report_events?select=*&report_id=eq.${chave}&order=created_at.asc`),
  ]);
  if (!ocorrencia) throw naoEncontrada();
  return { ...ocorrencia, privado: privado ?? null, fotos: fotos.map((f) => f.original_path), visitas, eventos };
}

// Nome de quem fez cada passo. Se a função do banco não responder, aparece ao menos o próprio nome
// e os demais ficam como "Agente": o detalhe não deixa de abrir por causa disso.
export async function nomesDosAutores() {
  const sessao = sessaoAtual();
  const proprio = sessao ? { [sessao.usuario.id]: sessao.nome } : {};
  try {
    const nomes = await comLogin("/rest/v1/rpc/agent_profile_names", { method: "POST", corpo: {} });
    return { ...proprio, ...nomes };
  } catch (e) {
    if (e.codigo === "sessao_expirada") throw e;
    return proprio;
  }
}

// Endereço temporário (só neste aparelho) de uma foto privada.
export async function enderecoDaFoto(caminho) {
  return URL.createObjectURL(await baixarArquivoPrivado("fotos-originais", caminho, await tokenValido()));
}

export const listarOcorrenciasProximas = (id) =>
  comLogin("/rest/v1/rpc/agent_nearby_reports", { method: "POST", corpo: { p_report_id: id } });

export const iniciarAnalise = (id, versao) => agir({ acao: "iniciar_analise", report_id: id, version: versao });
export const registrarVisita = (id, versao, visita) =>
  agir({ acao: "registrar_visita", report_id: id, version: versao, visita });
export const registrarObservacao = (id, texto) => agir({ acao: "adicionar_observacao", report_id: id, texto });
export const encerrarSemAcesso = (id, versao) => agir({ acao: "encerrar_sem_acesso", report_id: id, version: versao });
export const arquivarOcorrencia = (id, motivo) =>
  agir({ acao: "arquivar", report_id: id, motivo, confirmado: true });
export const voltarAoMapa = (id) => agir({ acao: "voltar_ao_mapa", report_id: id });
export const corrigirCamposDenuncia = (id, changes, reason, versao) =>
  agir({ acao: "corrigir", report_id: id, changes, reason, version: versao });

export function registrarFocoSemDenuncia(dados, fotos) {
  const form = new FormData();
  form.append("acao", "criar_ocorrencia");
  form.append("dados", JSON.stringify(dados));
  fotos.forEach((foto, i) => form.append("fotos", foto, `foto-${i + 1}.jpg`));
  return agir(form);
}

// Dados do relatório. De report_private pede SÓ o endereço: nome, e-mail e telefone nunca são lidos (D32).
export async function dadosRelatorio({ periodo, bairroId, bairros }) {
  const [ocorrencias, visitas, eventos, enderecos] = await Promise.all([
    lerTudo("reports?select=id,protocol,origin,stage,publication,neighborhood_id,received_at,archived_at,place_address&order=id.asc"),
    lerTudo("report_visits?select=id,report_id,visited_on,access,focus_location,focus_location_other,containers,larvae,actions,notes&order=id.asc"),
    // Só os passos que contam. Eventos de correção guardam dados do morador e ficam de fora.
    lerTudo("report_events?select=id,report_id,event_type,created_at,old_value,new_value&event_type=in.(analise_iniciada,encerrada_sem_acesso,arquivada)&order=id.asc"),
    lerTudo("report_private?select=report_id,address&order=report_id.asc"),
  ]);
  return montarRelatorio({
    ocorrencias, visitas, eventos, bairros, periodo, bairroId,
    enderecos: Object.fromEntries(enderecos.map((e) => [e.report_id, e.address])),
  });
}
