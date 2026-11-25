// Tela: Ocorrências (lista, mapa e filtros). Os filtros ficam no endereço, para o "voltar" mantê-los.
import {
  botao, carregando, el, etiqueta, etiquetaDaEtapa, etiquetaDaOrigem, folha, icone, telaDeErro, vazio,
} from "./comum/ui.js";
import { campoSelecao, campoTexto, grupoDeOpcoes, valorDe, valoresDe } from "./comum/campos.js";
import { ROTAS, montarPagina, tratarErroDeSessao } from "./comum/moldura.js";
import { criarMapa, marcador } from "./comum/mapa.js";
import { desenharPaginas } from "./comum/paginacao.js";
import { listarBairros, listarOcorrencias, pontosDoMapa, resumoDasOcorrencias } from "../servicos/agente.js";
import { ETAPAS, dataLocal, diasAberta, formatarDiaMes } from "../dominio/ocorrencia.js";
import { temFiltro } from "../dominio/lista.js";

const ESPERA_DA_BUSCA_MS = 350;

function lerFiltros() {
  const q = new URLSearchParams(location.search);
  return {
    protocolo: q.get("protocolo") ?? "",
    bairro: q.get("bairro") ?? "",
    etapas: q.getAll("etapa"),
    origem: q.get("origem") ?? "",
    de: q.get("de") ?? "",
    ate: q.get("ate") ?? "",
    semAcesso: q.get("semAcesso") === "1",
    ordem: q.get("ordem") ?? "antigas",
    vista: q.get("vista") === "mapa" ? "mapa" : "lista",
  };
}

function gravarFiltros(f) {
  const q = new URLSearchParams();
  for (const chave of ["protocolo", "bairro", "origem", "de", "ate"]) if (f[chave]) q.set(chave, f[chave]);
  f.etapas.forEach((e) => q.append("etapa", e));
  if (f.semAcesso) q.set("semAcesso", "1");
  if (f.ordem !== "antigas") q.set("ordem", f.ordem);
  if (f.vista !== "lista") q.set("vista", f.vista);
  history.replaceState(null, "", q.size ? `?${q}` : location.pathname);
}

const quantosFiltros = (f) =>
  [f.bairro, f.etapas.length, f.de, f.ate, f.semAcesso, f.ordem !== "antigas"].filter(Boolean).length;

function cartao(o, bairros) {
  const aberta = o.stage === "recebida" || o.stage === "em_analise";
  const quando = o.origin === "agente" ? "visita do agente"
    : aberta ? `há ${diasAberta(o)} ${diasAberta(o) === 1 ? "dia" : "dias"}` : null;
  return el("li", {}, el("a", { class: "cartao ocorrencia", href: ROTAS.detalhe(o.id) },
    el("div", { class: "ocorrencia__topo" }, el("strong", {}, o.protocol), etiquetaDaEtapa(o)),
    el("div", { class: "ocorrencia__meta" }, etiquetaDaOrigem(o),
      el("span", {}, [bairros.get(o.neighborhood_id), formatarDiaMes(dataLocal(o.received_at)), quando].filter(Boolean).join(" · "))),
    o.stage === "em_analise" && o.failed_attempts > 0 && el("div", { class: "ocorrencia__extras" },
      etiqueta(`Sem acesso · ${o.failed_attempts} ${o.failed_attempts === 1 ? "tentativa" : "tentativas"}`, "sem-acesso"))));
}

async function iniciar() {
  const principal = montarPagina();
  if (!principal) return;
  principal.replaceChildren(carregando("Carregando ocorrências…"));
  let listaDeBairros;
  try {
    listaDeBairros = await listarBairros();
  } catch (e) {
    if (tratarErroDeSessao(e)) return;
    principal.replaceChildren();
    telaDeErro(principal, { aoTentar: () => location.reload() });
    return;
  }

  const bairros = new Map(listaDeBairros.map((b) => [b.id, b.name]));
  let filtros = lerFiltros();
  let espera = null;
  let mapa = null;
  let desenho = 0;

  const resumoNaTela = el("dl", { class: "cartao resumo", "aria-live": "polite" });
  const contagem = el("p", { class: "so-leitor", role: "status" });
  const area = el("div", {});
  const selo = el("span", { class: "botao-filtros__selo", hidden: true });
  const busca = el("input", {
    type: "search", value: filtros.protocolo, placeholder: "Buscar protocolo", "aria-label": "Buscar protocolo",
    oninput: (e) => {
      // Espera a pessoa parar de digitar para não pedir a cada letra.
      clearTimeout(espera);
      espera = setTimeout(() => mudar({ protocolo: e.target.value }), ESPERA_DA_BUSCA_MS);
    },
  });

  const alternancia = (nome, rotulo, opcoes, estilo) => {
    const grupo = grupoDeOpcoes(nome, rotulo, opcoes, { valor: filtros[nome], estilo, rotuloOculto: true });
    grupo.addEventListener("change", (e) => mudar({ [nome]: e.target.value }));
    return grupo;
  };
  const vista = alternancia("vista", "Ver como", [["lista", "Lista"], ["mapa", "Mapa"]], "segmentos");
  const origem = alternancia("origem", "Origem", [["", "Todas"], ["cidadao", "Cidadão"], ["agente", "Agente"]], "chips");

  function mudar(parte) {
    filtros = { ...filtros, ...parte };
    gravarFiltros(filtros);
    desenhar();
  }

  function limpar() {
    clearTimeout(espera);
    busca.value = "";
    origem.querySelector('input[value=""]').checked = true;
    mudar({ protocolo: "", bairro: "", etapas: [], origem: "", de: "", ate: "", semAcesso: false, ordem: "antigas" });
  }

  function abrirFiltros() {
    const form = el("form", { class: "filtros" },
      campoSelecao("bairro", "Bairro", listaDeBairros.map((b) => [b.id, b.name]), { valor: filtros.bairro, vazio: "Todos os bairros" }),
      grupoDeOpcoes("etapa", "Etapa", Object.entries(ETAPAS), { valor: filtros.etapas, multiplo: true }),
      grupoDeOpcoes("origem", "Origem", [["", "Todas"], ["cidadao", "Cidadão"], ["agente", "Agente"]], { valor: filtros.origem }),
      el("div", { class: "lado-a-lado" },
        campoTexto("de", "Recebida a partir de", { tipo: "date", valor: filtros.de }),
        campoTexto("ate", "Até", { tipo: "date", valor: filtros.ate })),
      grupoDeOpcoes("ordem", "Ordem", [["antigas", "Mais antigas"], ["recentes", "Mais recentes"]], { valor: filtros.ordem, estilo: "segmentos" }),
      el("label", { class: "interruptor" }, el("span", {}, "Só com tentativa sem acesso"),
        el("input", { type: "checkbox", name: "semAcesso", role: "switch", checked: filtros.semAcesso })));
    const aplicar = () => {
      const o = valorDe(form, "origem");
      origem.querySelector(`input[value="${o}"]`).checked = true;
      mudar({
        bairro: valorDe(form, "bairro"), etapas: valoresDe(form, "etapa"), origem: o,
        de: valorDe(form, "de"), ate: valorDe(form, "ate"), ordem: valorDe(form, "ordem"),
        semAcesso: valorDe(form, "semAcesso") === "on",
      });
      caixa.fechar();
    };
    form.addEventListener("submit", (e) => { e.preventDefault(); aplicar(); });
    const caixa = folha({
      titulo: "Filtros",
      corpo: form,
      acoes: [
        botao("Limpar", { variante: "secundario", ao: () => { limpar(); caixa.fechar(); } }),
        botao("Aplicar", { classe: "botao--cresce", ao: aplicar }),
      ],
    });
  }

  async function desenharMapa(itens, vez) {
    const caixaDoMapa = el("div", { class: "mapa mapa--lista" });
    const selecionada = el("div", { "aria-live": "polite" });
    area.classList.add("area--mapa");
    area.replaceChildren(caixaDoMapa, selecionada);
    try {
      const { L, mapa: novo } = await criarMapa(caixaDoMapa);
      if (vez !== desenho) { novo.remove(); return; }
      mapa = novo;
      let anterior = null;
      const escolher = (o, ponto) => {
        anterior?.setStyle({ weight: 2 }).setRadius(9);
        anterior = ponto.setStyle({ weight: 4 }).setRadius(12);
        selecionada.replaceChildren(el("div", { class: "cartao ponto-escolhido" },
          el("div", {}, el("strong", {}, o.protocol),
            el("p", {}, `${ETAPAS[o.stage]} · feita por ${o.origin === "agente" ? "agente" : "cidadão"} · ${bairros.get(o.neighborhood_id)}`)),
          el("a", { class: "botao botao--principal", href: ROTAS.detalhe(o.id) }, "Abrir")));
      };
      const pontos = itens.map((o) => {
        const p = marcador(L, { lat: o.location_lat, lng: o.location_lng },
          { etapa: o.stage, titulo: `${o.protocol} · ${ETAPAS[o.stage]}` }).addTo(mapa);
        p.on("click", () => escolher(o, p));
        return p;
      });
      if (pontos.length) {
        mapa.fitBounds(L.featureGroup(pontos).getBounds().pad(0.2), { maxZoom: 16 });
        escolher(itens[0], pontos[0]);
      }
    } catch {
      if (vez !== desenho) return;
      area.classList.remove("area--mapa");
      area.replaceChildren(vazio("O mapa não carregou", "Confira a internet. A lista continua disponível.",
        botao("Tentar de novo", { variante: "secundario", ao: desenhar })));
    }
  }

  function mostrarResumo(resumo) {
    resumoNaTela.replaceChildren(...[["recebidas", "Recebidas"], ["emAnalise", "Em análise"], ["semAcesso", "Sem acesso"]]
      .map(([chave, rotulo]) => el("div", {}, el("dt", {}, rotulo),
        el("dd", {}, Number.isFinite(resumo?.[chave]) ? String(resumo[chave]) : "–"))));
  }

  const semNada = () => (temFiltro(filtros)
    ? vazio("Nada com esses filtros", "Mude a busca ou os filtros.",
      botao("Limpar filtros", { variante: "secundario", ao: limpar }))
    : vazio("Nenhuma ocorrência ainda", "As denúncias enviadas pelo site aparecem aqui."));

  async function desenhar() {
    const vez = ++desenho;
    mapa?.remove();
    mapa = null;
    area.classList.remove("area--mapa");
    area.replaceChildren(carregando("Carregando ocorrências…"));
    const noMapa = filtros.vista === "mapa";
    let resumo;
    let resultado;
    try {
      [resumo, resultado] = await Promise.all([
        resumoDasOcorrencias(filtros), noMapa ? pontosDoMapa(filtros) : listarOcorrencias(filtros),
      ]);
    } catch (e) {
      if (vez !== desenho || tratarErroDeSessao(e)) return;
      // Erro nunca aparece como zero.
      mostrarResumo(null);
      area.replaceChildren();
      telaDeErro(area, { aoTentar: desenhar });
      return;
    }
    if (vez !== desenho) return; // os filtros mudaram enquanto carregava
    const total = noMapa ? resultado.length : resultado.total;
    mostrarResumo(resumo);
    contagem.textContent = `${total} ${total === 1 ? "ocorrência" : "ocorrências"}`;
    selo.textContent = quantosFiltros(filtros);
    selo.hidden = !quantosFiltros(filtros);
    if (!total) area.replaceChildren(semNada());
    else if (noMapa) desenharMapa(resultado, vez);
    else {
      desenharPaginas(area, {
        itens: resultado.itens, total, cartao: (o) => cartao(o, bairros),
        buscar: (inicio) => listarOcorrencias(filtros, { inicio }), vigente: () => vez === desenho,
      });
    }
  }

  principal.replaceChildren(
    el("div", { class: "titulo-com-acao" }, el("h1", {}, "Ocorrências"), el("a", { class: "ligacao", href: ROTAS.relatorio }, "Relatório")),
    resumoNaTela,
    el("div", { class: "controles" },
      el("div", { class: "busca-linha" },
        el("div", { class: "busca" }, icone("busca"), busca),
        el("button", { type: "button", class: "botao-filtros", "aria-label": "Filtros", onclick: abrirFiltros }, icone("filtros"), selo)),
      vista, origem),
    contagem, area);
  desenhar();
}

iniciar();
