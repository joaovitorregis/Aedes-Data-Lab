// Tela: relatório do período para o supervisor (RF-AGE-08).
import { avisoNaTela, botao, carregando, comEnvio, el, etiqueta, folha, icone, telaDeErro } from "./comum/ui.js";
import { campoSelecao, campoTexto, grupoDeOpcoes, valorDe } from "./comum/campos.js";
import { ROTAS, montarPagina, tratarErroDeSessao } from "./comum/moldura.js";
import { gerarPdf, gerarWord } from "./relatorio-arquivo.js";
import { dadosRelatorio, listarBairros } from "../servicos/agente.js";
import { sessaoAtual } from "../servicos/sessao.js";
import { formatarData, formatarDiaMes, hojeLocal } from "../dominio/ocorrencia.js";
import { nomeDoArquivo, periodoDoRelatorio } from "../dominio/relatorio.js";

const LINHAS_NA_PREVIA = 5;

const cartaoCom = (titulo, lateral, ...conteudo) => el("section", { class: "cartao previa" },
  el("div", { class: "previa__topo" }, el("h2", {}, titulo), el("span", {}, lateral)), conteudo);

const mais = (total, mostradas) => total > mostradas
  && el("p", { class: "campo__dica" }, `Mais ${total - mostradas} no arquivo.`);

function previaDoResumo(r, periodo) {
  const n = r.resumo;
  const grupo = (titulo, itens) => el("div", { class: "numeros" }, el("h3", {}, titulo),
    el("dl", {}, itens.map(([rotulo, valor]) => el("div", {}, el("dt", {}, rotulo), el("dd", {}, String(valor))))));
  return cartaoCom("Resumo", `${formatarDiaMes(periodo.de)} a ${formatarData(periodo.ate)}`,
    grupo("Entraram no período", [["De cidadãos", n.cidadaos], ["De agentes", n.agentes], ["Visitas feitas", n.visitas]]),
    grupo("Como terminaram", [["Atendidas", n.atendidas], ["Encerradas sem acesso", n.encerradasSemAcesso], ["Arquivadas", n.arquivadas]]),
    grupo("Em aberto e achados", [["Tentativas sem acesso", n.tentativasSemAcesso], ["Pendentes", n.pendentes], ["Com larvas", n.comLarvas]]));
}

function previaDosBairros(r) {
  const total = (b) => b.entraram + b.visitas + b.atendidas + b.pendentes;
  const ordenados = [...r.porBairro].sort((a, b) => total(b) - total(a));
  const principais = ordenados.filter((b) => total(b) > 0).slice(0, LINHAS_NA_PREVIA);
  const resto = ordenados.filter((b) => !principais.includes(b));
  const soma = (c) => resto.reduce((t, b) => t + b[c], 0);
  const linhas = [...principais, ...(resto.length ? [{
    bairro: `Outros ${resto.length} bairros`, entraram: soma("entraram"), visitas: soma("visitas"),
    atendidas: soma("atendidas"), pendentes: soma("pendentes"),
  }] : [])];
  return cartaoCom("Por bairro", `${r.porBairro.length} ${r.porBairro.length === 1 ? "bairro" : "bairros"}`,
    el("table", {},
      el("thead", {}, el("tr", {}, [["Bairro", "Bairro"], ["Entr.", "Entraram"], ["Vis.", "Visitas"], ["Atend.", "Atendidas"], ["Pend.", "Pendentes"]]
        .map(([curto, completo]) => el("th", { scope: "col", title: completo }, curto)))),
      el("tbody", {}, linhas.map((b) => el("tr", {}, el("th", { scope: "row" }, b.bairro),
        [b.entraram, b.visitas, b.atendidas, b.pendentes].map((v) => el("td", {}, String(v))))))));
}

function previaDasVisitas(r) {
  const lista = r.visitas.slice(-LINHAS_NA_PREVIA);
  return cartaoCom("Visitas do período", String(r.visitas.length),
    lista.length
      ? el("ul", { class: "linhas" }, lista.map((v) => el("li", {},
        el("div", {}, el("strong", {}, `${formatarDiaMes(v.data)} · ${v.protocolo}`),
          el("small", {}, [v.bairro, v.atendida ? v.foco : v.acesso, v.larvas === "Sim" && "com larvas", v.porAgente && "feita por agente"]
            .filter(Boolean).join(" · "))),
        etiqueta(v.atendida ? "Atendida" : "Sem acesso", v.atendida ? "atendida" : "sem-acesso"))))
      : el("p", { class: "apoio" }, "Nenhuma visita no período."),
    mais(r.visitas.length, lista.length));
}

function previaDosRecipientes(r) {
  const maior = r.recipientes[0]?.visitas ?? 0;
  return cartaoCom("Recipientes com água", "nas visitas com acesso",
    r.recipientes.length
      ? el("ul", { class: "barras" }, r.recipientes.map((x) => el("li", {}, el("span", {}, x.nome),
        el("progress", { value: x.visitas, max: maior, "aria-label": `${x.nome}: ${x.visitas}` }), el("strong", {}, String(x.visitas)))))
      : el("p", { class: "apoio" }, "Nenhum recipiente registrado."));
}

function previaDosPendentes(r) {
  const lista = r.pendentes.slice(0, LINHAS_NA_PREVIA);
  return cartaoCom("Pendentes no fim do período", String(r.pendentes.length),
    lista.length
      ? el("ul", { class: "linhas" }, lista.map((p) => el("li", {}, el("div", {}, el("strong", {}, p.protocolo),
        el("small", {}, [p.bairro, p.etapa, `${p.diasAberta} dias`,
          p.tentativas > 0 && `${p.tentativas} ${p.tentativas === 1 ? "tentativa" : "tentativas"} sem acesso`].filter(Boolean).join(" · "))))))
      : el("p", { class: "apoio" }, "Nenhuma pendência."),
    mais(r.pendentes.length, lista.length));
}

function baixar(endereco, nome) {
  const link = el("a", { href: endereco, download: nome });
  document.body.append(link);
  link.click();
  link.remove();
}

async function iniciar() {
  const principal = montarPagina();
  if (!principal) return;
  principal.replaceChildren(carregando());
  let bairros;
  try {
    bairros = await listarBairros();
  } catch (e) {
    if (tratarErroDeSessao(e)) return;
    principal.replaceChildren();
    telaDeErro(principal, { aoTentar: () => location.reload() });
    return;
  }

  const hoje = hojeLocal();
  const previa = el("div", { class: "previas", "aria-live": "polite" });
  const gerar = botao("Gerar relatório", { icone: "baixar", classe: "botao--largo" });
  const falha = el("p", { class: "erro-geral", role: "alert", hidden: true });
  const datas = el("div", { class: "lado-a-lado", hidden: true },
    campoTexto("de", "Data de início", { tipo: "date", max: hoje }), campoTexto("ate", "Data de fim", { tipo: "date", max: hoje }));
  const form = el("form", { class: "formulario", onsubmit: (e) => e.preventDefault() },
    grupoDeOpcoes("periodo", "Período",
      [["esta_semana", "Esta semana"], ["semana_passada", "Semana passada"], ["este_mes", "Este mês"], ["datas", "Datas"]],
      { valor: "esta_semana" }),
    datas,
    campoSelecao("bairro", "Bairro", bairros.map((b) => [b.id, b.name]), { vazio: "Todos os bairros" }),
    grupoDeOpcoes("formato", "Formato", [["pdf", "PDF"], ["docx", "Word"]], { valor: "pdf", estilo: "segmentos" }));

  let atual = null;
  let pedido = 0;
  async function atualizar() {
    const vez = ++pedido;
    const tipo = valorDe(form, "periodo");
    datas.hidden = tipo !== "datas";
    const periodo = periodoDoRelatorio(tipo, hoje, valorDe(form, "de"), valorDe(form, "ate"));
    const bairroId = valorDe(form, "bairro") ? Number(valorDe(form, "bairro")) : null;
    atual = null;
    gerar.disabled = true;
    falha.hidden = true;
    if (!periodo) {
      previa.replaceChildren(el("p", { class: "apoio" }, "Escolha a data de início e a de fim, até hoje."));
      return;
    }
    previa.replaceChildren(carregando("Montando a prévia…"));
    try {
      const relatorio = await dadosRelatorio({ periodo, bairroId, bairros });
      if (vez !== pedido) return;
      atual = { relatorio, periodo, bairro: bairros.find((b) => b.id === bairroId)?.name ?? "todos" };
      previa.replaceChildren(...[
        !relatorio.visitas.length && avisoNaTela({ titulo: "Nenhuma visita no período", texto: "O arquivo sai com esse aviso.", tom: "alerta" }),
        previaDoResumo(relatorio, periodo), previaDosBairros(relatorio), previaDasVisitas(relatorio),
        previaDosRecipientes(relatorio), previaDosPendentes(relatorio),
        el("p", { class: "campo__dica" }, "O arquivo tem espaço para as assinaturas do agente e do supervisor. Não traz nome, e-mail nem telefone de moradores."),
      ].filter(Boolean));
      gerar.disabled = false;
    } catch (e) {
      if (vez !== pedido || tratarErroDeSessao(e)) return;
      previa.replaceChildren();
      telaDeErro(previa, { aoTentar: atualizar });
    }
  }
  form.addEventListener("change", (e) => { if (e.target.name !== "formato") atualizar(); });

  gerar.addEventListener("click", () => comEnvio(gerar, async () => {
    if (!atual) return;
    falha.hidden = true;
    const formato = valorDe(form, "formato");
    try {
      const meta = {
        periodo: `${formatarData(atual.periodo.de)} a ${formatarData(atual.periodo.ate)}`,
        bairro: atual.bairro, agente: sessaoAtual().nome, geradoEm: formatarData(hojeLocal()),
      };
      const arquivo = await (formato === "pdf" ? gerarPdf : gerarWord)(atual.relatorio, meta);
      const nome = nomeDoArquivo(atual.periodo, formato);
      const endereco = URL.createObjectURL(arquivo);
      baixar(endereco, nome);
      const caixa = folha({
        titulo: "Relatório gerado",
        corpo: el("a", { class: "ligacao", href: endereco, download: nome }, nome),
        acoes: [
          botao("Fechar", { variante: "secundario", ao: () => caixa.fechar() }),
          el("a", { class: "botao botao--principal botao--cresce", href: ROTAS.ocorrencias }, "Voltar às ocorrências"),
        ],
        aoFechar: () => URL.revokeObjectURL(endereco),
      });
    } catch {
      falha.textContent = "Não foi possível gerar o arquivo. Confira a internet e tente de novo.";
      falha.hidden = false;
    }
  }, "Gerando…"));

  principal.replaceChildren(
    el("a", { class: "voltar", href: ROTAS.ocorrencias }, icone("voltar"), "Ocorrências"),
    el("h1", {}, "Relatório"),
    el("p", { class: "apoio" }, "Para enviar ao supervisor"),
    form, previa, falha, gerar);
  atualizar();
}

iniciar();
