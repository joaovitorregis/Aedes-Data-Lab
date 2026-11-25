// Cabeçalho, menu, proteção de página e envios pendentes: o que toda tela do agente tem.
import { botao, el, icone, folha, guardarRecado, avisoNaTela, lerRecado } from "./ui.js";
import { conferirAcesso, sair, sessaoAtual } from "../../servicos/sessao.js";
import { descartarPendente, listarPendentes, reenviarPendentes } from "../../servicos/fila.js";

export const ROTAS = {
  login: "/agentes",
  ocorrencias: "/agentes/ocorrencias",
  arquivadas: "/agentes/arquivadas",
  detalhe: (id) => `/agentes/ocorrencia?id=${encodeURIComponent(id)}`,
  visita: (id) => (id ? `/agentes/visita?id=${encodeURIComponent(id)}` : "/agentes/visita"),
  localNovo: "/agentes/visita?local=novo",
  correcao: (id) => `/agentes/correcao?id=${encodeURIComponent(id)}`,
  relatorio: "/agentes/relatorio",
};

export const irPara = (rota) => location.assign(rota);

const paraOLogin = (motivo) => location.replace(motivo ? `${ROTAS.login}?motivo=${motivo}` : ROTAS.login);

const itemDoMenu = (rota, nome, titulo, descricao) => el("a", { class: "menu__item", href: rota },
  icone(nome), el("span", {}, el("strong", {}, titulo), el("small", {}, descricao)), icone("seguir"));

function iniciais(nome) {
  const partes = nome.trim().split(/\s+/);
  return `${partes[0][0]}${partes.length > 1 ? partes.at(-1)[0] : ""}`.toUpperCase();
}

async function encerrar() {
  const pendentes = await listarPendentes(sessaoAtual()?.usuario.id).catch(() => []);
  const fim = async () => { await sair(); paraOLogin(); };
  if (!pendentes.length) return fim();
  const caixa = folha({
    titulo: "Sair com envios pendentes?",
    corpo: el("p", {}, `${pendentes.length === 1 ? "Há 1 visita não enviada" : `Há ${pendentes.length} visitas não enviadas`}. `
      + "Elas continuam neste aparelho e são enviadas quando você entrar de novo."),
    acoes: [
      botao("Ficar", { variante: "secundario", ao: () => caixa.fechar() }),
      botao("Sair", { variante: "perigo", ao: fim }),
    ],
  });
  return undefined;
}

function abrirMenu(sessao) {
  const menu = el("dialog", { class: "menu", "aria-label": "Menu" });
  menu.append(
    el("div", { class: "menu__topo" }, el("span", {}, "Menu"),
      el("button", { type: "button", class: "botao-icone", "aria-label": "Fechar menu", onclick: () => menu.close() }, icone("fechar"))),
    el("div", { class: "menu__pessoa" }, el("span", { class: "avatar", "aria-hidden": "true" }, iniciais(sessao.nome)),
      el("div", {}, el("strong", {}, sessao.nome), el("small", {}, "Agente de endemias · Itambé-PE"))),
    el("nav", { class: "cartao menu__lista" },
      itemDoMenu(ROTAS.ocorrencias, "lista", "Ocorrências", "Lista e mapa"),
      itemDoMenu(ROTAS.arquivadas, "caixa", "Arquivadas", "Fora do mapa, por 30 dias"),
      itemDoMenu(ROTAS.visita(), "prancheta", "Registrar visita", "Em denúncia ou em local com foco"),
      itemDoMenu(ROTAS.relatorio, "documento", "Relatório", "Para o supervisor")),
    botao("Sair", { variante: "sair", icone: "sair", ao: () => { menu.close(); encerrar(); } }),
  );
  menu.addEventListener("close", () => menu.remove());
  menu.addEventListener("click", (e) => { if (e.target === menu) menu.close(); });
  document.body.append(menu);
  menu.showModal();
}

// No computador o menu fica à vista no cabeçalho; no celular, atrás dos três traços.
function navegacao() {
  const aqui = location.pathname.replace(/\.html$/, "");
  const item = (rota, texto, ...tambem) => el("a",
    { href: rota, "aria-current": [rota, ...tambem].includes(aqui) && "page" }, texto);
  return el("nav", { class: "topo__nav", "aria-label": "Área do agente" },
    item(ROTAS.ocorrencias, "Ocorrências", "/agentes/ocorrencia", "/agentes/correcao"),
    item(ROTAS.arquivadas, "Arquivadas"),
    item(ROTAS.visita(), "Registrar visita"),
    item(ROTAS.relatorio, "Relatório"),
    botao("Sair", { variante: "sair", icone: "sair", ao: encerrar }));
}

function cabecalho(sessao) {
  return el("header", { class: "topo" },
    el("a", { class: "topo__marca", href: ROTAS.ocorrencias },
      el("img", { src: "/assets/imagens/logo-aedes-datalab.jpeg", alt: "", width: "40", height: "40" }),
      el("span", {}, el("strong", {}, "Aedes Lab"), el("small", {}, "Área do agente"))),
    navegacao(),
    el("button", { type: "button", class: "botao-menu", "aria-label": "Abrir menu", onclick: () => abrirMenu(sessao) }, icone("menu")));
}

// Faixa com o que ainda não foi enviado, e o que o servidor recusou (RF-AGE-03).
async function mostrarPendentes(area, sessao) {
  const pendentes = await listarPendentes(sessao.usuario.id);
  area.replaceChildren(...pendentes.map((p) => el("div", { class: `recado recado--${p.recusa ? "alerta" : "espera"}` },
    icone("alerta"),
    el("div", {},
      el("strong", {}, p.recusa ? "Visita recusada" : "Visita aguardando envio"),
      el("p", {}, `${p.protocolo ?? "Local sem denúncia"}. ${p.recusa ?? "Será enviada quando a internet voltar."}`),
      el("div", { class: "recado__acoes" },
        !p.recusa && botao("Enviar agora", { variante: "secundario", ao: () => enviarFila(area, sessao) }),
        p.recusa && p.reportId && el("a", { class: "ligacao", href: ROTAS.detalhe(p.reportId) }, "Ver ocorrência"),
        botao("Descartar", { variante: "texto", ao: () => confirmarDescarte(p, area, sessao) }))))));
}

function confirmarDescarte(pendente, area, sessao) {
  const caixa = folha({
    titulo: "Descartar a visita?",
    corpo: el("p", {}, "O que foi preenchido será apagado deste aparelho."),
    acoes: [
      botao("Cancelar", { variante: "secundario", ao: () => caixa.fechar() }),
      botao("Descartar", { variante: "perigo", ao: async () => {
        await descartarPendente(pendente.id);
        caixa.fechar();
        mostrarPendentes(area, sessao);
      } }),
    ],
  });
}

async function enviarFila(area, sessao) {
  const enviados = await reenviarPendentes(sessao.usuario.id);
  const recado = { titulo: "Visita enviada", texto: "O que estava guardado no aparelho foi registrado." };
  // Recarrega para mostrar o estado novo, mas nunca por cima de algo que a pessoa está preenchendo.
  if (enviados > 0 && !document.querySelector("main form, dialog[open]")) {
    guardarRecado(recado);
    location.reload();
    return;
  }
  await mostrarPendentes(area, sessao);
  if (enviados > 0) area.append(avisoNaTela(recado));
}

// Monta a página protegida e devolve o <main>. Sem sessão, volta para o login.
export function montarPagina() {
  const sessao = sessaoAtual();
  if (!sessao) {
    paraOLogin();
    return null;
  }
  const principal = document.querySelector("main");
  const pendentes = el("div", { class: "pendentes" });
  const recado = lerRecado();
  principal.before(cabecalho(sessao), pendentes);
  if (recado) pendentes.after(el("div", { class: "pendentes" }, avisoNaTela(recado)));

  // Voltar pelo navegador depois de sair não pode mostrar a tela guardada.
  window.addEventListener("pageshow", (e) => { if (e.persisted && !sessaoAtual()) paraOLogin(); });
  window.addEventListener("online", () => enviarFila(pendentes, sessao));
  (navigator.onLine ? enviarFila(pendentes, sessao) : mostrarPendentes(pendentes, sessao)).catch(() => {});
  principal.atualizarPendentes = () => mostrarPendentes(pendentes, sessao);
  // Sem internet a conferência é ignorada: o banco continua recusando quem perdeu o acesso.
  conferirAcesso()
    .then((ativo) => { if (!ativo) sair().finally(() => paraOLogin("acesso")); })
    .catch(tratarErroDeSessao);
  return principal;
}

// Erro de carregamento: sessão vencida volta ao login; o resto usa a tela única.
export function tratarErroDeSessao(erro) {
  if (erro?.codigo !== "sessao_expirada" && erro?.status !== 401) return false;
  sair().finally(() => paraOLogin("sessao"));
  return true;
}
