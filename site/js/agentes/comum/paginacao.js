// Lista de cartões em páginas, com "Carregar mais" (Ocorrências e Arquivadas).
import { botao, comEnvio, el } from "./ui.js";
import { tratarErroDeSessao } from "./moldura.js";

// `buscar(inicio)` devolve { itens, total }; `vigente()` diz se a pessoa ainda está no mesmo recorte.
export function desenharPaginas(destino, { itens, total, cartao, buscar, vigente }) {
  const falha = el("p", { class: "erro-geral", role: "alert", hidden: true },
    "Não foi possível carregar mais. Confira a internet e tente de novo.");
  const mais = total > itens.length && botao(`Carregar mais (${total - itens.length})`,
    { variante: "secundario", classe: "botao--largo", ao: () => comEnvio(mais, async () => {
      falha.hidden = true;
      try {
        const proxima = await buscar(itens.length);
        if (!vigente()) return;
        const vistas = new Set(itens.map((o) => o.id));
        const novas = proxima.itens.filter((o) => !vistas.has(o.id));
        // Sem novidade, o total recebido encerra o botão.
        desenharPaginas(destino, {
          itens: [...itens, ...novas], total: novas.length ? proxima.total : itens.length, cartao, buscar, vigente,
        });
      } catch (e) {
        if (tratarErroDeSessao(e)) return;
        falha.hidden = false;
      }
    }, "Carregando…") });
  destino.replaceChildren(...[el("ul", { class: "ocorrencias" }, itens.map(cartao)), falha, mais].filter(Boolean));
}
