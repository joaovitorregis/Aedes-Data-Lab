// Tela: corrigir dados de uma ocorrência, com antes e depois e motivo (RF-COR-01).
import { botao, carregando, comEnvio, dados, el, folha, guardarRecado, icone, telaDeErro, vazio } from "./comum/ui.js";
import { campoLongo, campoSelecao, campoTexto, grupoDeOpcoes, mostrarErros, valorDe, valoresDe } from "./comum/campos.js";
import { ROTAS, montarPagina, tratarErroDeSessao } from "./comum/moldura.js";
import { mapaDeEscolha } from "./comum/mapa.js";
import { corrigirCamposDenuncia, listarBairros, listarCategorias, obterOcorrencia } from "../servicos/agente.js";
import { alteracoes, campoTravado, separarEndereco, validarCorrecao, valoresIniciais } from "../dominio/correcao.js";
import { dentroDoTerritorio } from "../dominio/denuncia.js";
import { LARVAS, LOCAIS_DO_FOCO, RECIPIENTES, rotuloRecipiente } from "../dominio/ocorrencia.js";

const id = new URLSearchParams(location.search).get("id");

function ajustarPosicao(atual, aoConfirmar) {
  let escolhido = atual;
  const caixaDoMapa = el("div", { class: "mapa mapa--escolha" });
  const situacao = el("p", { class: "campo__dica", role: "status" }, "Toque no mapa para mover o ponto. O endereço não muda.");
  const confirmar = botao("Confirmar posição", { classe: "botao--cresce", ao: () => {
    if (!dentroDoTerritorio(escolhido.lat, escolhido.lng)) {
      situacao.textContent = "O ponto está fora de Itambé. Escolha outro lugar.";
      return;
    }
    aoConfirmar(escolhido);
    caixa.fechar();
  } });
  const caixa = folha({
    titulo: "Ajustar posição",
    corpo: [caixaDoMapa, situacao],
    acoes: [botao("Cancelar", { variante: "secundario", ao: () => caixa.fechar() }), confirmar],
  });
  mapaDeEscolha(caixaDoMapa, { ponto: atual, aoMudar: (p) => { escolhido = p; } })
    .catch(() => { caixaDoMapa.replaceChildren(el("p", { class: "mapa__falha" }, "O mapa não carregou. Tente mais tarde.")); });
}

async function iniciar() {
  const principal = montarPagina();
  if (!principal) return;
  principal.replaceChildren(carregando());
  let o;
  let bairros;
  let categorias;
  try {
    [o, bairros, categorias] = await Promise.all([obterOcorrencia(id), listarBairros(), listarCategorias()]);
  } catch (e) {
    if (tratarErroDeSessao(e)) return;
    principal.replaceChildren();
    if (e.codigo === "denuncia_nao_encontrada" || !id) {
      principal.append(vazio("Ocorrência não encontrada", "",
        el("a", { class: "botao botao--secundario", href: ROTAS.ocorrencias }, "Voltar às ocorrências")));
      return;
    }
    telaDeErro(principal, { aoTentar: () => location.reload() });
    return;
  }

  const inicial = valoresIniciais(o);
  let ponto = inicial.ponto;
  const travado = campoTravado(o.privado?.confirmed_channel);
  const original = separarEndereco((o.origin === "cidadao" ? o.privado?.address : o.place_address) ?? "");
  // Recipientes escritos pelo cidadão continuam marcáveis ao lado da lista padrão.
  const recipientes = [...Object.entries(RECIPIENTES),
    ...inicial.recipientes.filter((r) => !RECIPIENTES[r]).map((r) => [r, rotuloRecipiente(r)])];

  const situacaoDoPonto = el("small", {}, "Ajustar posição");
  const cartaoDoPonto = el("div", { class: "campo", "data-campo": "ponto" },
    el("button", { type: "button", class: "cartao destaque", onclick: () => ajustarPosicao(ponto, (p) => {
      ponto = p;
      situacaoDoPonto.textContent = JSON.stringify(p) === JSON.stringify(inicial.ponto) ? "Ajustar posição" : "Posição alterada";
    }) }, el("span", { class: "destaque__icone" }, icone("local")),
    el("span", {}, el("strong", {}, "Ponto no mapa"), situacaoDoPonto), icone("seguir")),
    el("p", { class: "campo__erro", id: "erro-ponto", hidden: true }));

  const bloqueado = (campo) => (travado === campo ? { readonly: true, dica: "Contato confirmado: só a equipe do projeto altera." } : {});
  const falha = el("p", { class: "erro-geral", role: "alert", hidden: true });
  const form = el("form", { class: "formulario", novalidate: true },
    el("div", { class: "lado-a-lado lado-a-lado--endereco" },
      campoTexto("rua", "Rua", { valor: inicial.rua, maxlength: 180 }),
      campoTexto("numero", "Número", { valor: inicial.numero, maxlength: 12, dica: original.numero && `Antes: ${original.numero}` })),
    campoTexto("referencia", "Referência", { valor: inicial.referencia, maxlength: 200 }),
    campoSelecao("bairroId", "Bairro", bairros.map((b) => [b.id, b.name]), { valor: inicial.bairroId, vazio: null }),
    campoSelecao("categoriaId", "Categoria", categorias.map((c) => [c.id, c.label]), { valor: inicial.categoriaId, vazio: null }),
    campoLongo("descricao", "Descrição", { valor: inicial.descricao, maxlength: 1000 }),
    campoSelecao("foco", "Onde está o foco?", Object.entries(LOCAIS_DO_FOCO), { valor: inicial.foco, vazio: "Não informado" }),
    campoTexto("focoOutro", "Qual é o outro local?", { valor: inicial.focoOutro, maxlength: 120 }),
    campoSelecao("agua", "Há água acumulada?", [["sim", "Sim"], ["nao", "Não"]], { valor: inicial.agua, vazio: "Não sei" }),
    grupoDeOpcoes("recipientes", "Em que recipiente ou estrutura?", recipientes,
      { valor: inicial.recipientes, multiplo: true, estilo: "lista" }),
    campoSelecao("larvas", "Viu larvas ou pupas?", Object.entries(LARVAS), { valor: inicial.larvas, vazio: "Não informado" }),
    o.origin === "cidadao" && el("p", { class: "campo__dica" }, "Tempo e outra evidência: só o cidadão informa; o agente não altera."),
    cartaoDoPonto,
    o.privado && [
      campoTexto("nome", "Nome", { valor: inicial.nome, maxlength: 120 }),
      campoTexto("telefone", "Telefone", { valor: inicial.telefone, tipo: "tel", ...bloqueado("telefone") }),
      campoTexto("email", "E-mail", { valor: inicial.email, tipo: "email", ...bloqueado("email") }),
    ],
    campoLongo("motivo", "Motivo da correção", { maxlength: 480, linhas: 2 }),
    falha,
    botao("Revisar", { tipo: "submit", classe: "botao--largo" }));

  const outroLocal = form.querySelector('[data-campo="focoOutro"]');
  const ajustar = () => {
    outroLocal.hidden = valorDe(form, "foco") !== "outro";
    form.querySelector('[data-campo="recipientes"]').hidden = valorDe(form, "agua") === "nao";
  };
  form.addEventListener("change", ajustar);
  ajustar();

  // "Antes: …" só aparece depois que o número muda.
  const dicaDoNumero = form.querySelector('[data-campo="numero"] .campo__dica');
  if (dicaDoNumero) {
    dicaDoNumero.hidden = true;
    form.elements.numero.addEventListener("input", (e) => { dicaDoNumero.hidden = e.target.value.trim() === original.numero; });
  }

  const lerValores = () => {
    const campo = (nome, padrao = "") => (form.elements[nome] ? valorDe(form, nome) : padrao);
    return {
      rua: campo("rua"), numero: campo("numero"), referencia: campo("referencia"), bairroId: campo("bairroId"),
      categoriaId: campo("categoriaId"), descricao: campo("descricao"), foco: campo("foco"), focoOutro: campo("focoOutro"),
      agua: campo("agua"), recipientes: valoresDe(form, "recipientes"), larvas: campo("larvas"), ponto,
      nome: campo("nome", inicial.nome), telefone: campo("telefone", inicial.telefone), email: campo("email", inicial.email),
    };
  };

  form.addEventListener("submit", (evento) => {
    evento.preventDefault();
    falha.hidden = true;
    const valores = lerValores();
    const motivo = valorDe(form, "motivo").trim();
    const erros = validarCorrecao(o, valores, motivo);
    const semErroNosCampos = mostrarErros(form, erros);
    if (erros.geral) {
      falha.textContent = erros.geral;
      falha.hidden = false;
    }
    if (!semErroNosCampos || erros.geral) return;

    const { changes, linhas } = alteracoes(o, valores, { bairros, categorias });
    const recusa = el("p", { class: "erro-geral", role: "alert", hidden: true });
    const salvar = botao("Salvar", { classe: "botao--cresce", ao: () => comEnvio(salvar, async () => {
      recusa.hidden = true;
      try {
        await corrigirCamposDenuncia(o.id, changes, motivo, o.version);
        guardarRecado({ titulo: "Correção salva", texto: "O antes e o depois ficam no histórico." });
        location.replace(ROTAS.detalhe(o.id));
      } catch (e) {
        if (tratarErroDeSessao(e)) return;
        if (e.codigo === "sem_conexao" || e.status >= 500) {
          caixa.fechar();
          telaDeErro(principal, { salvo: true });
          return;
        }
        recusa.textContent = e.message;
        recusa.hidden = false;
      }
    }) });
    const caixa = folha({
      titulo: "Confira a correção",
      corpo: [
        linhas.map((l) => el("div", { class: "mudanca" }, el("h3", {}, l.campo),
          dados([["Antes", l.antes], ["Depois", l.depois]]))),
        dados([["Motivo", motivo]]),
        el("p", { class: "campo__dica" }, "Etapa e publicação não mudam."),
        recusa,
      ],
      acoes: [botao("Editar", { variante: "secundario", ao: () => caixa.fechar() }), salvar],
    });
  });

  principal.replaceChildren(
    el("a", { class: "voltar", href: ROTAS.detalhe(o.id) }, icone("voltar"), "Voltar"),
    el("h1", {}, "Corrigir dados"),
    el("p", { class: "apoio" }, `${o.protocol} · as mudanças ficam no histórico`),
    form);
}

iniciar();
