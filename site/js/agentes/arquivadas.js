// Tela: Arquivadas, as ocorrências fora do mapa que ainda estão na lixeira (RF-AGE-11).
import { botao, carregando, el, icone, telaDeErro, vazio } from "./comum/ui.js";
import { ROTAS, montarPagina, tratarErroDeSessao } from "./comum/moldura.js";
import { desenharPaginas } from "./comum/paginacao.js";
import { listarArquivadas, listarBairros } from "../servicos/agente.js";
import { dataLocal, formatarDiaMes, textoDoPrazo } from "../dominio/ocorrencia.js";

const ESPERA_DA_BUSCA_MS = 350;

function cartao(o, bairros) {
  return el("li", {}, el("a", { class: "cartao ocorrencia", href: ROTAS.detalhe(o.id) },
    el("div", { class: "ocorrencia__topo" }, el("strong", {}, o.protocol),
      el("span", { class: "etiqueta etiqueta--arquivada" }, textoDoPrazo(o.archived_at))),
    el("div", { class: "ocorrencia__meta" },
      [bairros.get(o.neighborhood_id), `arquivada em ${formatarDiaMes(dataLocal(o.archived_at))}`].filter(Boolean).join(" · ")),
    el("p", { class: "ocorrencia__motivo" }, `Motivo: ${o.archive_reason}`)));
}

async function iniciar() {
  const principal = montarPagina();
  if (!principal) return;
  principal.replaceChildren(carregando());
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
  let protocolo = new URLSearchParams(location.search).get("protocolo") ?? "";
  let espera = null;
  let desenho = 0;
  const area = el("div", {});
  const contagem = el("p", { class: "so-leitor", role: "status" });
  const busca = el("input", {
    type: "search", value: protocolo, placeholder: "Buscar protocolo", "aria-label": "Buscar protocolo",
    oninput: (e) => {
      clearTimeout(espera);
      espera = setTimeout(() => mudar(e.target.value), ESPERA_DA_BUSCA_MS);
    },
  });

  function mudar(texto) {
    protocolo = texto;
    history.replaceState(null, "", protocolo ? `?${new URLSearchParams({ protocolo })}` : location.pathname);
    desenhar();
  }

  function limpar() {
    clearTimeout(espera);
    busca.value = "";
    mudar("");
  }

  async function desenhar() {
    const vez = ++desenho;
    area.replaceChildren(carregando("Carregando arquivadas…"));
    let pagina;
    try {
      pagina = await listarArquivadas({ protocolo });
    } catch (e) {
      if (vez !== desenho || tratarErroDeSessao(e)) return;
      area.replaceChildren();
      telaDeErro(area, { aoTentar: desenhar });
      return;
    }
    if (vez !== desenho) return;
    contagem.textContent = `${pagina.total} ${pagina.total === 1 ? "arquivada" : "arquivadas"}`;
    if (!pagina.total) {
      area.replaceChildren(protocolo
        ? vazio("Nada com esse protocolo", "Confira o número.", botao("Limpar busca", { variante: "secundario", ao: limpar }))
        : vazio("Nenhuma ocorrência arquivada", "O que for arquivado aparece aqui por 30 dias."));
      return;
    }
    desenharPaginas(area, {
      itens: pagina.itens, total: pagina.total, cartao: (o) => cartao(o, bairros),
      buscar: (inicio) => listarArquivadas({ protocolo }, { inicio }), vigente: () => vez === desenho,
    });
  }

  principal.replaceChildren(
    el("a", { class: "voltar", href: ROTAS.ocorrencias }, icone("voltar"), "Ocorrências"),
    el("h1", {}, "Arquivadas"),
    el("p", { class: "apoio" }, "Fora do mapa público. Podem voltar em até 30 dias."),
    el("div", { class: "busca-linha" }, el("div", { class: "busca" }, icone("busca"), busca)),
    contagem, area);
  desenhar();
}

iniciar();
