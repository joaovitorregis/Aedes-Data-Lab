// Tela: registrar visita — onde foi, formulário e local sem denúncia (RF-AGE-03 e RF-AGE-10).
import { botao, carregando, comEnvio, dados, el, folha, guardarRecado, icone, telaDeErro, vazio } from "./comum/ui.js";
import { campoLongo, campoSelecao, campoTexto, grupoDeOpcoes, mostrarErros, valorDe, valoresDe } from "./comum/campos.js";
import { ROTAS, montarPagina, tratarErroDeSessao } from "./comum/moldura.js";
import { mapaDeEscolha } from "./comum/mapa.js";
import { prepararFoto } from "./comum/fotos.js";
import { listarBairros, listarCategorias, obterOcorrencia, todasAsOcorrencias } from "../servicos/agente.js";
import { descartarPendente, enviarPendente, guardarPendente } from "../servicos/fila.js";
import { sessaoAtual } from "../servicos/sessao.js";
import { vaiTentarDeNovo } from "../dominio/envio.js";
import { ACESSOS, ACOES_NO_LOCAL, LARVAS, LOCAIS_DO_FOCO, RECIPIENTES, dataLocal, hojeLocal } from "../dominio/ocorrencia.js";
import {
  LIMITE_DESCRICAO, LIMITE_OBSERVACOES, efeitoDaVisita, montarFoco, montarVisita, resumoDaVisita, validarFoco, validarVisita,
} from "../dominio/visita.js";

const parametros = new URLSearchParams(location.search);

const voltar = (rota, texto = "Voltar") => el("a", { class: "voltar", href: rota }, icone("voltar"), texto);
const parte = (titulo) => el("h2", { class: "rotulo-de-parte" }, titulo);

// Perguntas sobre o foco: as mesmas palavras do formulário do cidadão (D53).
const perguntaDoFoco = () => [
  grupoDeOpcoes("foco", "Onde está o foco?", Object.entries(LOCAIS_DO_FOCO)),
  campoTexto("focoOutro", "Qual é o outro local?", { maxlength: 120 }),
];
const perguntasDaAgua = () => [
  grupoDeOpcoes("agua", "Há água acumulada no local?", [["sim", "Sim"], ["nao", "Não"]], { estilo: "segmentos" }),
  grupoDeOpcoes("recipientes", "Em que tipo de recipiente ou estrutura a água está?", Object.entries(RECIPIENTES),
    { multiplo: true, estilo: "lista" }),
  grupoDeOpcoes("larvas", "Há larvas ou pupas na água?", Object.entries(LARVAS), { estilo: "segmentos" }),
];
const perguntaDasAcoes = () => grupoDeOpcoes("acoes", "O que você fez no local?", Object.entries(ACOES_NO_LOCAL),
  { multiplo: true, estilo: "lista" });
const observacoes = () => campoLongo("observacoes", "Observações internas",
  { maxlength: LIMITE_OBSERVACOES, placeholder: "Opcional" });

// Mostra só o que faz sentido para as respostas atuais.
function condicionar(form) {
  const ajustar = () => {
    const campo = (nome) => form.querySelector(`[data-campo="${nome}"]`);
    if (campo("focoOutro")) campo("focoOutro").hidden = valorDe(form, "foco") !== "outro";
    if (campo("recipientes")) campo("recipientes").hidden = valorDe(form, "agua") !== "sim";
  };
  form.addEventListener("change", ajustar);
  ajustar();
}

const lerRespostas = (form) => ({
  data: valorDe(form, "data"),
  foco: valorDe(form, "foco"),
  focoOutro: valorDe(form, "focoOutro"),
  agua: valorDe(form, "agua"),
  recipientes: valoresDe(form, "recipientes"),
  larvas: valorDe(form, "larvas"),
  acoes: valoresDe(form, "acoes"),
  observacoes: valorDe(form, "observacoes"),
});

// Caixa "Confira a visita": envia, guarda no aparelho se a rede falhar, ou mostra a recusa.
function conferir(principal, { linhas, efeito, pendente, aoEnviar }) {
  const falha = el("p", { class: "erro-geral", role: "alert", hidden: true });
  const verOcorrencia = pendente.reportId
    ? el("a", { class: "ligacao", href: ROTAS.detalhe(pendente.reportId), hidden: true }, "Ver ocorrência") : null;
  const concluir = async (resposta) => {
    await descartarPendente(pendente.id).catch(() => {});
    aoEnviar(resposta);
  };
  const guardarEAvisar = async (erro) => {
    let salvo = true;
    await guardarPendente(pendente).catch(() => { salvo = false; });
    const mostrar = () => telaDeErro(principal, {
      salvo: false,
      texto: salvo
        ? "Confira a internet e tente de novo. A visita fica guardada neste aparelho e é enviada quando a internet voltar."
        : "Confira a internet e tente de novo. O que você preencheu continua nesta tela.",
      aoTentar: async () => {
        try {
          await concluir(await enviarPendente(pendente));
        } catch (e) {
          if (tratarErroDeSessao(e)) return;
          if (vaiTentarDeNovo(e)) mostrar();
          else conferirRecusa(e);
        }
      },
    });
    if (erro) mostrar();
    principal.atualizarPendentes?.();
  };
  const conferirRecusa = (e) => {
    descartarPendente(pendente.id).catch(() => {});
    principal.atualizarPendentes?.();
    abrir(e.message);
  };

  function abrir(mensagem) {
    falha.textContent = mensagem ?? "";
    falha.hidden = !mensagem;
    if (verOcorrencia) verOcorrencia.hidden = !mensagem;
    const confirmar = botao("Confirmar", { classe: "botao--cresce", ao: () => comEnvio(confirmar, async () => {
      falha.hidden = true;
      try {
        await concluir(await enviarPendente(pendente));
      } catch (e) {
        if (vaiTentarDeNovo(e)) {
          caixa.fechar();
          await guardarEAvisar(e);
          if (e.codigo === "sessao_expirada") tratarErroDeSessao(e);
          return;
        }
        falha.textContent = e.message;
        falha.hidden = false;
        if (verOcorrencia) verOcorrencia.hidden = false;
      }
    }) });
    const caixa = folha({
      titulo: "Confira a visita",
      corpo: [dados(linhas), el("p", { class: "efeito" }, efeito), falha, verOcorrencia].filter(Boolean),
      acoes: [botao("Editar", { variante: "secundario", ao: () => caixa.fechar() }), confirmar],
    });
  }
  abrir();
}

async function ondeFoi(principal) {
  const [todas, bairros] = await Promise.all([todasAsOcorrencias(), listarBairros()]);
  const emAnalise = todas.filter((o) => o.stage === "em_analise");
  const nomes = new Map(bairros.map((b) => [b.id, b.name]));
  principal.replaceChildren(
    voltar(ROTAS.ocorrencias, "Ocorrências"),
    el("h1", {}, "Registrar visita"),
    el("p", { class: "apoio" }, "Onde foi a visita?"),
    el("a", { class: "cartao destaque", href: ROTAS.localNovo },
      el("span", { class: "destaque__icone" }, icone("adicionar")),
      el("span", {}, el("strong", {}, "Local sem denúncia"), el("small", {}, "Encontrei foco em um local não denunciado")),
      icone("seguir")),
    el("h2", { class: "rotulo-de-lista" }, "Denúncias em análise"),
    emAnalise.length
      ? el("div", { class: "cartao menu__lista" }, emAnalise.map((o) => el("a", { class: "menu__item", href: ROTAS.visita(o.id) },
        el("span", {}, el("strong", {}, o.protocol), el("small", {}, [nomes.get(o.neighborhood_id),
          o.failed_attempts > 0 && `${o.failed_attempts} ${o.failed_attempts === 1 ? "tentativa" : "tentativas"}`]
          .filter(Boolean).join(" · "))),
        icone("seguir"))))
      : vazio("Nenhuma denúncia em análise", "Inicie a análise pelo detalhe de uma denúncia recebida."),
  );
}

async function visitaDaDenuncia(principal, id) {
  const [o, bairros] = await Promise.all([obterOcorrencia(id), listarBairros()]);
  if (o.stage !== "em_analise") {
    principal.replaceChildren(vazio("Esta ocorrência não aceita visita",
      "A visita só é registrada em ocorrências Em análise.",
      el("a", { class: "botao botao--secundario", href: ROTAS.detalhe(o.id) }, "Ver ocorrência")));
    return;
  }
  const recebidaEm = dataLocal(o.received_at);
  const hoje = hojeLocal();
  const visitaId = crypto.randomUUID();
  const endereco = o.origin === "agente" ? o.place_address : o.privado?.address;
  const semAcesso = el("p", { class: "campo__dica", hidden: true },
    `Sem acesso: só data, motivo e observações. Esta será a ${o.failed_attempts + 1}ª tentativa.`);
  const comAcesso = el("div", { hidden: true }, perguntaDoFoco(), perguntasDaAgua(), perguntaDasAcoes());
  const revisar = botao("Revisar", { tipo: "submit", classe: "botao--largo" });
  const form = el("form", { class: "formulario", novalidate: true },
    campoTexto("data", "Data da visita", { tipo: "date", valor: hoje, min: recebidaEm, max: hoje }),
    grupoDeOpcoes("acesso", "Acesso ao local", Object.entries(ACESSOS)),
    comAcesso, observacoes(), semAcesso, revisar);
  form.addEventListener("change", () => {
    const acesso = valorDe(form, "acesso");
    comAcesso.hidden = acesso !== "com_acesso";
    semAcesso.hidden = !acesso || acesso === "com_acesso";
  });
  condicionar(form);

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const respostas = { ...lerRespostas(form), acesso: valorDe(form, "acesso") };
    if (!mostrarErros(form, validarVisita(respostas, { recebidaEm, hoje }))) return;
    const visita = montarVisita(respostas, visitaId);
    conferir(principal, {
      linhas: resumoDaVisita(visita),
      efeito: efeitoDaVisita(visita.access, o.failed_attempts),
      pendente: { id: visitaId, tipo: "visita", usuario: sessaoAtual().usuario.id, protocolo: o.protocol,
        reportId: o.id, versao: o.version, visita },
      aoEnviar: () => {
        guardarRecado(visita.access === "com_acesso"
          ? { titulo: "Visita registrada", texto: "A ocorrência está Atendida." }
          : { titulo: "Visita sem acesso registrada", texto: "A ocorrência continua Em análise." });
        location.replace(ROTAS.detalhe(o.id));
      },
    });
  });

  principal.replaceChildren(
    voltar(ROTAS.detalhe(o.id)),
    el("h1", {}, "Registrar visita"),
    el("p", { class: "apoio" }, [o.protocol, bairros.find((b) => b.id === o.neighborhood_id)?.name, endereco].filter(Boolean).join(" · ")),
    form);
}

function seletorDeFotos() {
  const fotos = [];
  const grade = el("div", { class: "fotos-escolhidas" });
  const aviso = el("p", { class: "campo__erro", role: "status", hidden: true });
  const entrada = el("input", { type: "file", accept: "image/*", multiple: true, class: "so-leitor", id: "c-fotos" });
  const desenhar = () => {
    grade.replaceChildren(
      ...fotos.map((f, i) => el("div", { class: "foto-escolhida" }, el("img", { src: f.url, alt: `Foto ${i + 1}` }),
        el("button", { type: "button", class: "botao-icone", "aria-label": `Remover foto ${i + 1}`, onclick: () => {
          URL.revokeObjectURL(fotos[i].url);
          fotos.splice(i, 1);
          desenhar();
        } }, icone("fechar")))),
      ...(fotos.length < 3 ? [el("label", { class: "adicionar-foto", for: "c-fotos" }, icone("adicionar"), "Adicionar")] : []));
  };
  entrada.addEventListener("change", async () => {
    aviso.hidden = true;
    for (const arquivo of [...entrada.files].slice(0, 3 - fotos.length)) {
      try {
        const blob = await prepararFoto(arquivo);
        fotos.push({ blob, url: URL.createObjectURL(blob) });
      } catch {
        aviso.textContent = `Não foi possível ler "${arquivo.name}". Use uma foto JPEG ou PNG.`;
        aviso.hidden = false;
      }
    }
    entrada.value = "";
    desenhar();
  });
  desenhar();
  const campo = el("div", { class: "campo", "data-campo": "fotos" },
    el("span", { class: "campo__rotulo" }, "Fotos do foco (1 a 3)"), entrada, grade, aviso,
    el("p", { class: "campo__erro", id: "erro-fotos", hidden: true }));
  return { campo, fotos: () => fotos.map((f) => f.blob) };
}

function seletorDePonto() {
  let ponto = null;
  let controle = null;
  const caixaDoMapa = el("div", { class: "mapa mapa--escolha" });
  const situacao = el("p", { class: "campo__dica", role: "status" }, "Toque no mapa para marcar o foco.");
  const marcar = (p) => {
    ponto = p;
    situacao.textContent = `Ponto marcado: ${p.lat.toFixed(5)}, ${p.lng.toFixed(5)}`;
  };
  const usarAparelho = botao("Usar localização do aparelho", { variante: "secundario", icone: "local", classe: "botao--largo", ao: () => {
    if (!navigator.geolocation) {
      situacao.textContent = "Este aparelho não informa a localização. Marque no mapa.";
      return;
    }
    situacao.textContent = "Procurando sua localização…";
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const p = { lat: Number(coords.latitude.toFixed(6)), lng: Number(coords.longitude.toFixed(6)) };
        if (controle) controle.definir(p, { centralizar: true });
        else marcar(p);
      },
      () => { situacao.textContent = "Não foi possível obter a localização. Permita o acesso ou marque no mapa."; },
      { enableHighAccuracy: true, timeout: 15_000 });
  } });
  const campo = el("div", { class: "campo", "data-campo": "ponto" },
    el("span", { class: "campo__rotulo" }, "Marque o foco no mapa"), caixaDoMapa, situacao, usarAparelho,
    el("p", { class: "campo__erro", id: "erro-ponto", hidden: true }));
  const montar = async () => {
    try {
      controle = await mapaDeEscolha(caixaDoMapa, { aoMudar: marcar });
    } catch {
      caixaDoMapa.replaceChildren(el("p", { class: "mapa__falha" }, "O mapa não carregou. Use a localização do aparelho."));
    }
  };
  return { campo, ponto: () => ponto, montar };
}

async function localSemDenuncia(principal) {
  const [bairros, categorias] = await Promise.all([listarBairros(), listarCategorias()]);
  const hoje = hojeLocal();
  const ids = { submissionId: crypto.randomUUID(), visitaId: crypto.randomUUID() };
  const fotos = seletorDeFotos();
  const ponto = seletorDePonto();
  const revisar = botao("Revisar", { tipo: "submit", classe: "botao--largo" });
  const form = el("form", { class: "formulario", novalidate: true },
    parte("Local"),
    campoSelecao("bairroId", "Bairro ou localidade", bairros.map((b) => [b.id, b.name])),
    el("div", { class: "lado-a-lado lado-a-lado--endereco" },
      campoTexto("rua", "Rua, avenida ou logradouro", { maxlength: 180 }),
      campoTexto("numero", "Número", { maxlength: 12 })),
    campoTexto("referencia", "Ponto de referência", { maxlength: 200 }),
    perguntaDoFoco(), ponto.campo,
    parte("Visita"),
    campoTexto("data", "Data da visita", { tipo: "date", valor: hoje, max: hoje }),
    parte("Foco"),
    campoSelecao("categoriaId", "O que você encontrou?", categorias.filter((c) => c.active !== false).map((c) => [c.id, c.label])),
    perguntasDaAgua(),
    campoLongo("descricao", "Descreva o que você observou",
      { maxlength: LIMITE_DESCRICAO, dica: "Este texto aparece no mapa. Não inclua nomes nem placas." }),
    fotos.campo,
    parte("Atendimento"),
    perguntaDasAcoes(), observacoes(), revisar);
  condicionar(form);

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const respostas = {
      ...lerRespostas(form),
      bairroId: valorDe(form, "bairroId"), rua: valorDe(form, "rua"), numero: valorDe(form, "numero"),
      referencia: valorDe(form, "referencia"), categoriaId: valorDe(form, "categoriaId"),
      descricao: valorDe(form, "descricao"), ponto: ponto.ponto(), fotos: fotos.fotos(),
    };
    if (!mostrarErros(form, validarFoco(respostas, { hoje }))) return;
    const pedido = montarFoco(respostas, ids);
    const bairro = bairros.find((b) => b.id === pedido.neighborhood_id)?.name;
    const foco = respostas.foco === "outro" ? respostas.focoOutro : LOCAIS_DO_FOCO[respostas.foco];
    const daVisita = resumoDaVisita(pedido.visit).filter(([rotulo]) => !["Acesso", "Onde está o foco"].includes(rotulo));
    conferir(principal, {
      linhas: [
        ["Local", [pedido.place_address, bairro, foco].filter(Boolean).join(" · ")],
        ["O que encontrou", categorias.find((c) => c.id === pedido.category_id)?.label],
        ["Descrição", pedido.description],
        ["Fotos", `${respostas.fotos.length} ${respostas.fotos.length === 1 ? "foto" : "fotos"}`],
        ...daVisita,
      ],
      efeito: "Será criada uma ocorrência feita por agente, já Atendida.",
      pendente: { id: ids.visitaId, tipo: "foco", usuario: sessaoAtual().usuario.id, protocolo: null,
        dados: pedido, fotos: respostas.fotos },
      aoEnviar: (r) => {
        guardarRecado({ titulo: "Ocorrência registrada", texto: r.publication === "publicada"
          ? `${r.protocol} está Atendida e no mapa.` : `${r.protocol} está Atendida. A publicação no mapa está pendente.` });
        location.replace(ROTAS.detalhe(r.report_id));
      },
    });
  });

  principal.replaceChildren(
    voltar(ROTAS.visita()),
    el("h1", {}, "Registrar visita"),
    el("p", { class: "apoio" }, "Local sem denúncia · registre quando encontrar foco"),
    form);
  ponto.montar();
}

async function iniciar() {
  const principal = montarPagina();
  if (!principal) return;
  principal.replaceChildren(carregando());
  try {
    if (parametros.get("local") === "novo") await localSemDenuncia(principal);
    else if (parametros.get("id")) await visitaDaDenuncia(principal, parametros.get("id"));
    else await ondeFoi(principal);
  } catch (e) {
    if (tratarErroDeSessao(e)) return;
    principal.replaceChildren();
    if (e.codigo === "denuncia_nao_encontrada") {
      principal.append(vazio("Ocorrência não encontrada", "",
        el("a", { class: "botao botao--secundario", href: ROTAS.ocorrencias }, "Voltar às ocorrências")));
      return;
    }
    telaDeErro(principal, { aoTentar: () => location.reload() });
  }
}

iniciar();
