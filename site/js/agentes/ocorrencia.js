// Tela: detalhe da ocorrência e suas ações (RF-AGE-01 a 07).
import {
  avisoNaTela, botao, carregando, comEnvio, dados, el, etiqueta, etiquetasDaOcorrencia, folha, guardarRecado, icone,
  secao, telaDeErro, vazio,
} from "./comum/ui.js";
import { campoLongo, mostrarErros, valorDe } from "./comum/campos.js";
import { ROTAS, irPara, montarPagina, tratarErroDeSessao } from "./comum/moldura.js";
import { mapaDoPonto } from "./comum/mapa.js";
import {
  arquivarOcorrencia, encerrarSemAcesso, enderecoDaFoto, iniciarAnalise, listarBairros, listarCategorias,
  listarOcorrenciasProximas, nomesDosAutores, obterOcorrencia, registrarObservacao, voltarAoMapa,
} from "../servicos/agente.js";
import { campoTravado } from "../dominio/correcao.js";
import { resumoDaVisita } from "../dominio/visita.js";
import {
  ETAPAS, LARVAS, LOCAIS_DO_FOCO, acoesDaOcorrencia, arquivada, dataLocal, diasAberta, formatarData, formatarDataHora,
  formatarTelefone, linhaDoTempo, prazoDaLixeira, rotuloRecipiente, visitasDoDetalhe,
} from "../dominio/ocorrencia.js";

const id = new URLSearchParams(location.search).get("id");

const nomeDe = (o) => (o.origin === "agente" ? "ocorrência" : "denúncia");
const desatualizada = (e) => ["versao_desatualizada", "etapa_invalida"].includes(e.codigo);

// Envia uma ação feita numa caixa; o texto digitado continua lá se algo falhar.
function caixaDeAcao({ titulo, corpo, confirmar, variante = "principal", cancelar = "Cancelar", enviar, recado, validar }) {
  const falha = el("p", { class: "erro-geral", role: "alert", hidden: true });
  const atualizar = botao("Atualizar a tela", { variante: "texto", ao: () => location.reload() });
  atualizar.hidden = true;
  const principal = botao(confirmar, { variante, classe: "botao--cresce", ao: () => comEnvio(principal, async () => {
    falha.hidden = true;
    if (validar && !validar()) return;
    try {
      const resposta = await enviar();
      guardarRecado(typeof recado === "function" ? recado(resposta) : recado);
      location.reload();
    } catch (e) {
      if (tratarErroDeSessao(e)) return;
      falha.textContent = e.message;
      falha.hidden = false;
      atualizar.hidden = !desatualizada(e);
    }
  }) });
  const caixa = folha({
    titulo,
    corpo: [corpo, falha, atualizar],
    acoes: [botao(cancelar, { variante: "secundario", ao: () => caixa.fechar() }), principal],
  });
}

function observar(o) {
  const form = el("form", { onsubmit: (e) => e.preventDefault() },
    campoLongo("texto", "Observação", { maxlength: 500, dica: "Não aparece no mapa." }));
  caixaDeAcao({
    titulo: "Observação interna", corpo: form, confirmar: "Salvar",
    validar: () => mostrarErros(form, valorDe(form, "texto").trim() ? {} : { texto: "Escreva a observação." }),
    enviar: () => registrarObservacao(o.id, valorDe(form, "texto").trim()),
    recado: { titulo: "Observação salva", texto: "Ela fica no histórico, só para a equipe." },
  });
}

function arquivar(o) {
  const aberta = o.stage === "recebida" || o.stage === "em_analise";
  const form = el("form", { onsubmit: (e) => e.preventDefault() },
    el("p", {}, aberta
      ? "A ocorrência fica Encerrada e sai do mapa público. Pode voltar ao mapa em até 30 dias; depois disso é apagada."
      : "A ocorrência sai do mapa público e a etapa não muda. Pode voltar ao mapa em até 30 dias; depois disso é apagada, com as visitas."),
    campoLongo("motivo", "Motivo", { maxlength: 480, linhas: 2 }));
  caixaDeAcao({
    titulo: `Arquivar ${nomeDe(o)}`, corpo: form, confirmar: "Arquivar", variante: "perigo",
    validar: () => mostrarErros(form, valorDe(form, "motivo").trim() ? {} : { motivo: "Informe o motivo." }),
    enviar: () => arquivarOcorrencia(o.id, valorDe(form, "motivo").trim()),
    recado: (r) => ({ tom: "arquivada", titulo: `${nomeDe(o) === "denúncia" ? "Denúncia arquivada" : "Ocorrência arquivada"}`,
      texto: r?.remocao_pendente ? "Já saiu do mapa. A remoção das fotos públicas será concluída em seguida." : "Fora do mapa público." }),
  });
}

function voltar(o) {
  caixaDeAcao({
    titulo: "Voltar ao mapa?",
    corpo: el("p", {}, `A ${nomeDe(o)} volta a aparecer no mapa público. A etapa não muda.`),
    confirmar: "Voltar ao mapa",
    enviar: () => voltarAoMapa(o.id),
    recado: { titulo: "De volta ao mapa", texto: "A etapa continua a mesma." },
  });
}

function encerrar(o) {
  caixaDeAcao({
    titulo: "Encerrar sem acesso?",
    corpo: el("p", {}, `Foram ${o.failed_attempts} tentativas. A ocorrência fica Encerrada e não reabre.`),
    cancelar: "Tentar de novo", confirmar: "Encerrar", variante: "perigo",
    enviar: () => encerrarSemAcesso(o.id, o.version),
    recado: { titulo: "Ocorrência encerrada", texto: `Sem acesso após ${o.failed_attempts} tentativas.` },
  });
}

function outrasAcoes(o) {
  const OPCOES = {
    observacao: ["balao", "Adicionar observação", () => observar(o)],
    corrigir: ["lapis", "Corrigir dados", () => irPara(ROTAS.correcao(o.id))],
    arquivar: ["caixa", `Arquivar ${nomeDe(o)}`, () => arquivar(o), "perigo"],
    voltar_ao_mapa: ["mapa", "Voltar ao mapa", () => voltar(o)],
  };
  const caixa = folha({
    titulo: "Outras ações",
    corpo: el("div", { class: "cartao menu__lista" }, acoesDaOcorrencia(o).outras.map((nome) => {
      const [desenho, texto, acao, tom] = OPCOES[nome];
      return el("button", { type: "button", class: `menu__item${tom ? " menu__item--perigo" : ""}`,
        onclick: () => { caixa.fechar(); acao(); } }, icone(desenho), el("span", {}, el("strong", {}, texto)), icone("seguir"));
    })),
  });
}

function acoesPrincipais(o, principalDaPagina) {
  const { principal, podeEncerrar } = acoesDaOcorrencia(o);
  if (principal === "iniciar_analise") {
    const comecar = botao("Iniciar análise", { classe: "botao--largo", ao: () => comEnvio(comecar, async () => {
      try {
        await iniciarAnalise(o.id, o.version);
        irPara(ROTAS.visita(o.id));
      } catch (e) {
        if (tratarErroDeSessao(e)) return;
        if (desatualizada(e)) {
          guardarRecado({ tom: "alerta", titulo: "A ocorrência mudou", texto: e.message });
          location.reload();
          return;
        }
        telaDeErro(principalDaPagina, { aoTentar: () => comecar.click(),
          texto: e.codigo === "sem_conexao" ? undefined : e.message });
      }
    }) });
    return [comecar];
  }
  if (principal === "registrar_visita") {
    return [
      el("a", { class: "botao botao--principal botao--largo", href: ROTAS.visita(o.id) }, icone("prancheta"),
        el("span", {}, o.failed_attempts > 0 ? "Registrar nova visita" : "Registrar visita")),
      podeEncerrar && botao("Encerrar sem acesso", { variante: "contorno-perigo", classe: "botao--largo", ao: () => encerrar(o) }),
    ];
  }
  return [];
}

function ampliar(endereco, legenda) {
  folha({ titulo: legenda, corpo: el("img", { class: "foto-ampliada", src: endereco, alt: legenda }) })
    .elemento.classList.add("folha--foto");
}

// As fotos são privadas: cada uma é baixada com o login do agente.
function fotos(o) {
  if (!o.fotos.length) return null;
  const grande = el("div", { class: "fotos__principal" }, carregando("Carregando fotos…"));
  const miniaturas = el("div", { class: "fotos__miniaturas" });
  const total = `${o.fotos.length} ${o.fotos.length === 1 ? "foto enviada" : "fotos enviadas"}`;
  const carregar = async () => {
    grande.replaceChildren(carregando("Carregando fotos…"));
    miniaturas.replaceChildren();
    try {
      const enderecos = await Promise.all(o.fotos.map(enderecoDaFoto));
      const botaoDaFoto = (src, i) => el("button", { type: "button", "aria-label": `Ampliar foto ${i + 1}`,
        onclick: () => ampliar(src, `Foto ${i + 1} do foco`) }, el("img", { src, alt: `Foto ${i + 1} do foco` }));
      grande.replaceChildren(botaoDaFoto(enderecos[0], 0));
      miniaturas.replaceChildren(...enderecos.slice(1).map((src, i) => botaoDaFoto(src, i + 1)),
        el("span", {}, total));
    } catch (e) {
      if (tratarErroDeSessao(e)) return;
      grande.replaceChildren(vazio("As fotos não carregaram", "", botao("Tentar de novo", { variante: "secundario", ao: carregar })));
    }
  };
  carregar();
  return el("div", { class: "fotos" }, grande, miniaturas);
}

function respostas(o) {
  const agua = o.water_present === true ? "Sim" : o.water_present === false ? "Não" : "Não sei";
  const foco = o.focus_location === "outro" ? o.focus_location_other : LOCAIS_DO_FOCO[o.focus_location];
  return secao("Respostas", dados([
    ["Onde está o foco?", foco ?? "Não informado"],
    ["Há água acumulada?", agua],
    ["Em que recipiente ou estrutura?", o.containers?.length ? o.containers.map(rotuloRecipiente).join(" · ") : "Não informado"],
    ["Viu larvas ou pupas?", LARVAS[o.larvae] ?? "Não informado"],
    o.origin === "cidadao" && ["Percebeu há quanto tempo?", o.noticed_since || "Não informado"],
    o.origin === "cidadao" && ["Outra evidência · só a equipe vê", o.other_evidence || "Não informada"],
  ]));
}

function quem(o, autores) {
  if (o.origin === "agente") {
    return secao("Quem registrou", dados([
      ["Agente", autores[o.author_id] ?? "Agente"], ["Como", "Visita em local sem denúncia"],
    ]));
  }
  const p = o.privado;
  if (!p) return secao("Quem denunciou", el("p", { class: "apoio" }, "Dados de contato indisponíveis."));
  const confirmado = campoTravado(p.confirmed_channel);
  const selo = (campo) => confirmado === campo && etiqueta("Confirmado", "confirmado", "certo");
  return secao("Quem denunciou", dados([
    ["Nome", p.name],
    ["Telefone", el("span", { class: "dado-com-acao" }, el("span", {}, formatarTelefone(p.phone), selo("telefone")),
      el("a", { class: "botao-icone botao-icone--borda", href: `tel:+55${p.phone}`, "aria-label": `Ligar para ${p.name}` }, icone("ligar")))],
    ["E-mail", el("span", { class: "dado-com-acao" }, el("a", { href: `mailto:${p.email}` }, p.email), selo("email"))],
  ]));
}

function local(o, bairro) {
  const endereco = o.origin === "agente" ? o.place_address : o.privado?.address;
  const referencia = o.origin === "agente" ? o.place_reference : o.privado?.reference;
  const mapa = el("div", { class: "mapa mapa--detalhe" });
  const secaoDoLocal = secao("Local", mapa, dados([
    ["Bairro", bairro], ["Endereço", endereco || "Não informado"], ["Referência", referencia || "Não informada"],
  ]), el("a", {
    class: "botao botao--secundario botao--largo", target: "_blank", rel: "noopener",
    href: `https://www.google.com/maps/dir/?api=1&destination=${o.location_lat},${o.location_lng}`,
  }, icone("rota"), el("span", {}, "Como chegar")));
  // O mapa só é criado depois que a caixa está na página.
  queueMicrotask(() => mapaDoPonto(mapa, { lat: o.location_lat, lng: o.location_lng }, o.stage));
  return secaoDoLocal;
}

function proximas(lista) {
  if (!lista.length) return null;
  return el("section", { class: "bloco" }, el("h2", {}, "Ocorrências próximas"),
    el("div", { class: "cartao menu__lista" }, lista.map((p) => el("a", { class: "menu__item", href: ROTAS.detalhe(p.report_id) },
      icone("mapa"), el("span", {}, el("strong", {}, p.protocol),
        el("small", {}, `Outra ocorrência a ${Math.round(p.distance_m)} m · ${ETAPAS[p.stage]} · ${formatarData(dataLocal(p.received_at))}`)),
      icone("seguir")))));
}

function subtitulo(o) {
  const recebida = formatarData(dataLocal(o.received_at));
  const origem = o.origin === "agente" ? `Registrada por agente em ${recebida}` : `Denúncia de cidadão · recebida em ${recebida}`;
  if (arquivada(o)) return `${origem} · arquivada em ${formatarData(dataLocal(o.archived_at))} · fora do mapa público`;
  if (o.stage === "recebida" || o.stage === "em_analise") {
    const dias = diasAberta(o);
    return `${origem} · aberta há ${dias} ${dias === 1 ? "dia" : "dias"}`;
  }
  return origem;
}

function faixaDaArquivada(o) {
  if (!arquivada(o)) return null;
  const prazo = prazoDaLixeira(o.archived_at);
  return avisoNaTela({
    tom: "arquivada",
    titulo: nomeDe(o) === "denúncia" ? "Denúncia arquivada" : "Ocorrência arquivada",
    texto: prazo.vencido
      ? "O prazo de 30 dias terminou; o registro será apagado."
      : `Fora do mapa público. Pode voltar ao mapa até ${formatarData(prazo.ate)} (faltam ${prazo.diasRestantes} dias); depois disso é apagada. Motivo: ${o.archive_reason}`,
  });
}

async function iniciar() {
  const principal = montarPagina();
  if (!principal) return;
  principal.replaceChildren(carregando("Abrindo a ocorrência…"));
  let o;
  let perto;
  let bairros;
  let categorias;
  let autores;
  try {
    [o, perto, bairros, categorias, autores] = await Promise.all([
      obterOcorrencia(id), listarOcorrenciasProximas(id), listarBairros(), listarCategorias(), nomesDosAutores(),
    ]);
  } catch (e) {
    if (tratarErroDeSessao(e)) return;
    principal.replaceChildren();
    if (e.codigo === "denuncia_nao_encontrada" || !id) {
      principal.append(vazio("Ocorrência não encontrada", "Ela pode ter sido removida da lixeira.",
        el("a", { class: "botao botao--secundario", href: ROTAS.ocorrencias }, "Voltar às ocorrências")));
      return;
    }
    telaDeErro(principal, { aoTentar: () => location.reload() });
    return;
  }

  document.title = `${o.protocol} | Aedes Lab · Agente`;
  const passos = linhaDoTempo(o.eventos, { autores, nomeDoCidadao: o.privado?.name, origem: o.origin });
  const visitas = visitasDoDetalhe(o.visitas);
  const concluida = o.stage === "atendida" ? "Atendida não reabre nem aceita nova visita."
    : o.stage === "encerrada" ? "Encerrada não reabre nem aceita visita." : null;

  principal.replaceChildren(...[
    el("div", { class: "barra-detalhe" },
      el("a", { class: "voltar", href: ROTAS.ocorrencias, onclick: (e) => {
        // Volta mantendo os filtros quando se veio da lista.
        if (document.referrer.includes("/agentes/ocorrencias")) { e.preventDefault(); history.back(); }
      } }, icone("voltar"), "Ocorrências"),
      botao("Outras ações", { variante: "secundario", icone: "mais", classe: "botao-acoes", ao: () => outrasAcoes(o) })),
    faixaDaArquivada(o),
    el("h1", {}, o.protocol),
    el("div", { class: "etiquetas" }, etiquetasDaOcorrencia(o)),
    el("p", { class: "apoio" }, subtitulo(o)),
    concluida && el("p", { class: "apoio" }, concluida),
    el("div", { class: "acoes-principais" }, acoesPrincipais(o, principal)),
    fotos(o),
    secao("Relato", dados([
      ["Categoria", categorias.find((c) => c.id === o.category_id)?.label ?? "Não informada"], ["Descrição", o.description],
    ])),
    respostas(o),
    local(o, bairros.find((b) => b.id === o.neighborhood_id)?.name ?? ""),
    quem(o, autores),
    visitas.length > 0 && secao(visitas.length === 1 ? "Visita registrada" : "Visitas registradas",
      visitas.map((v) => dados(resumoDaVisita(v)))),
    proximas(perto),
    secao("Histórico", el("ol", { class: "historico" }, passos.map((p) => el("li", {},
      el("strong", {}, p.titulo), el("span", {}, p.detalhe), el("time", { datetime: p.quando }, formatarDataHora(p.quando)))))),
  ].filter(Boolean));
}

iniciar();
