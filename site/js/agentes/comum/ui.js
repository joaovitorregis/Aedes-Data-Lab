// Peças de interface da área do agente. Texto vindo do banco entra sempre como texto, nunca como HTML.
import { ETAPAS, ORIGENS, arquivada } from "../../dominio/ocorrencia.js";

export function el(tag, atributos = {}, ...filhos) {
  const no = document.createElement(tag);
  for (const [nome, valor] of Object.entries(atributos ?? {})) {
    if (valor === null || valor === undefined || valor === false) continue;
    if (nome.startsWith("on")) no.addEventListener(nome.slice(2).toLowerCase(), valor);
    else if (nome === "class") no.className = valor;
    else no.setAttribute(nome, valor === true ? "" : valor);
  }
  no.append(...filhos.flat(Infinity).filter((f) => f !== null && f !== undefined && f !== false));
  return no;
}

const TRACOS = {
  menu: "M4 6h16M4 12h16M4 18h16",
  fechar: "M18 6 6 18M6 6l12 12",
  voltar: "m15 18-6-6 6-6",
  seguir: "m9 18 6-6-6-6",
  baixo: "m6 9 6 6 6-6",
  mais: "M12 5v.01M12 12v.01M12 19v.01",
  adicionar: "M12 5v14M5 12h14",
  busca: "M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm10 2-4.3-4.3",
  filtros: "M4 6h16M7 12h10M10 18h4",
  lista: "M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01",
  prancheta: "M9 4h6v3H9zM9 5H6v16h12V5h-3m-6 9 2 2 4-4",
  documento: "M14 3H6v18h12V7l-4-4Zm0 0v4h4M9 13h6M9 17h6",
  sair: "M10 17l5-5-5-5M15 12H3M15 3h4v18h-4",
  pessoa: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-7 9a7 7 0 0 1 14 0",
  ligar: "M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2Z",
  rota: "M3 11 22 2l-9 19-2-8-8-2Z",
  mapa: "M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2Zm0 0v14m6-12v14",
  caixa: "M4 8h16v12H4zM3 4h18v4H3zm7 8h4",
  lapis: "M4 20h4L19 9l-4-4L4 16v4Zm9-13 4 4",
  balao: "M4 5h16v11H9l-5 4V5Z",
  certo: "m5 12 5 5 9-10",
  alerta: "M12 4 2 21h20L12 4Zm0 6v5m0 3v.01",
  cadeado: "M6 11h12v10H6zM8 11V8a4 4 0 0 1 8 0v3",
  local: "M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.800-7 11-7 11Zm0-8.500a2.500 2.500 0 1 0 0-5 2.500 2.500 0 0 0 0 5Z",
  calendario: "M4 6h16v15H4zM4 10h16M8 3v5m8-5v5",
  baixar: "M12 4v11m0 0-4-4m4 4 4-4M4 20h16",
};

export function icone(nome) {
  const NS = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(NS, "svg");
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("class", "icone");
  svg.setAttribute("aria-hidden", "true");
  svg.setAttribute("focusable", "false");
  const caminho = document.createElementNS(NS, "path");
  caminho.setAttribute("d", TRACOS[nome]);
  svg.append(caminho);
  return svg;
}

export function botao(texto, { variante = "principal", icone: nome, ao, tipo = "button", classe = "" } = {}) {
  return el("button", { type: tipo, class: `botao botao--${variante} ${classe}`.trim(), onclick: ao },
    nome && icone(nome), el("span", {}, texto));
}

export const etiqueta = (texto, tipo, nome) => el("span", { class: `etiqueta etiqueta--${tipo}` }, nome && icone(nome), texto);

export const etiquetaDaEtapa = (o) => etiqueta(ETAPAS[o.stage], o.stage);
export const etiquetaDaOrigem = (o) =>
  etiqueta(ORIGENS[o.origin], `origem-${o.origin}`, o.origin === "agente" ? "prancheta" : "pessoa");
export const etiquetasDaOcorrencia = (o, { comOrigem = true } = {}) => [
  etiquetaDaEtapa(o),
  o.stage === "em_analise" && o.failed_attempts > 0
    && etiqueta(`Sem acesso · ${o.failed_attempts} ${o.failed_attempts === 1 ? "tentativa" : "tentativas"}`, "sem-acesso"),
  arquivada(o) && etiqueta("Arquivada", "arquivada", "caixa"),
  comOrigem && etiquetaDaOrigem(o),
];

// Pares rótulo/valor (Relato, Respostas, Local, resumo da visita).
export const dados = (pares) => el("dl", { class: "dados" },
  pares.filter(Boolean).map(([rotulo, valor]) => el("div", {}, el("dt", {}, rotulo), el("dd", {}, valor))));

export const secao = (titulo, ...conteudo) =>
  el("section", { class: "bloco" }, el("h2", {}, titulo), el("div", { class: "cartao" }, conteudo));

export const carregando = (texto = "Carregando…") =>
  el("p", { class: "carregando", role: "status" }, el("span", { class: "giro", "aria-hidden": "true" }), texto);

export const avisoNaTela = ({ titulo, texto, tom = "ok" }) =>
  el("div", { class: `recado recado--${tom}`, role: "status" },
    icone(tom === "arquivada" ? "caixa" : tom === "alerta" ? "alerta" : "certo"),
    el("div", {}, el("strong", {}, titulo), texto && el("p", {}, texto)));

export function vazio(titulo, texto, acao) {
  return el("div", { class: "vazio" }, el("strong", {}, titulo), texto && el("p", {}, texto), acao);
}

// Tela única de erro (D55). O que estava preenchido continua na página, atrás dela.
export function telaDeErro(destino, { aoTentar, texto = "Confira a internet e tente de novo.", salvo = false } = {}) {
  const anteriores = [...destino.children].map((c) => [c, c.hidden]);
  anteriores.forEach(([c]) => { c.hidden = true; });
  const restaurar = () => {
    tela.remove();
    anteriores.forEach(([c, escondido]) => { c.hidden = escondido; });
  };
  const tela = el("div", { class: "tela-erro", role: "alert" },
    el("span", { class: "tela-erro__icone" }, icone("alerta")),
    el("h1", {}, "Não foi possível concluir"),
    el("p", {}, salvo ? `${texto} O que você preencheu continua salvo.` : texto),
    botao("Tentar de novo", { variante: "secundario", classe: "botao--largo", ao: () => { restaurar(); aoTentar?.(); } }),
    el("a", { class: "ligacao", href: "/agentes/ocorrencias" }, "Voltar às ocorrências"));
  destino.append(tela);
  tela.querySelector("button").focus();
  return restaurar;
}

// Caixa na parte de baixo da tela, sobre a tela de origem escurecida.
export function folha({ titulo, corpo = [], acoes = [], aoFechar }) {
  const id = `folha-${crypto.randomUUID()}`;
  const caixa = el("dialog", { class: "folha", "aria-labelledby": id });
  const fechar = () => caixa.close();
  caixa.append(...[
    el("div", { class: "folha__topo" }, el("h2", { id }, titulo),
      el("button", { type: "button", class: "botao-icone", "aria-label": "Fechar", onclick: fechar }, icone("fechar"))),
    el("div", { class: "folha__corpo" }, corpo),
    acoes.length > 0 && el("div", { class: "folha__acoes" }, acoes),
  ].filter(Boolean));
  caixa.addEventListener("close", () => { caixa.remove(); aoFechar?.(); });
  caixa.addEventListener("click", (e) => { if (e.target === caixa) fechar(); });
  document.body.append(caixa);
  caixa.showModal();
  return { elemento: caixa, fechar };
}

// Bloqueia o botão durante o envio para não repetir o pedido.
export async function comEnvio(botaoEnviar, acao, textoEnviando = "Enviando…") {
  if (botaoEnviar.disabled) return undefined;
  const rotulo = botaoEnviar.querySelector("span");
  const antes = rotulo.textContent;
  botaoEnviar.disabled = true;
  rotulo.textContent = textoEnviando;
  try {
    return await acao();
  } finally {
    botaoEnviar.disabled = false;
    rotulo.textContent = antes;
  }
}

// Recado que aparece na próxima página (ex.: "Visita registrada").
const CHAVE_DO_RECADO = "aedes.agente.recado";
export const guardarRecado = (recado) => sessionStorage.setItem(CHAVE_DO_RECADO, JSON.stringify(recado));
export function lerRecado() {
  const bruto = sessionStorage.getItem(CHAVE_DO_RECADO);
  sessionStorage.removeItem(CHAVE_DO_RECADO);
  return bruto ? JSON.parse(bruto) : null;
}
