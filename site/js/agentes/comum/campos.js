// Campos de formulário. Cada campo fica numa caixa com data-campo, onde o erro aparece.
import { el } from "./ui.js";

const caixa = (nome, ...conteudo) =>
  el("div", { class: "campo", "data-campo": nome }, conteudo,
    el("p", { class: "campo__erro", id: `erro-${nome}`, hidden: true }));

const dica = (texto) => texto && el("p", { class: "campo__dica" }, texto);

export function campoTexto(nome, rotulo, { valor = "", tipo = "text", dica: ajuda, ...resto } = {}) {
  return caixa(nome,
    el("label", { for: `c-${nome}` }, rotulo),
    el("input", { id: `c-${nome}`, name: nome, type: tipo, value: valor, "aria-describedby": `erro-${nome}`, ...resto }),
    dica(ajuda));
}

export function campoLongo(nome, rotulo, { valor = "", dica: ajuda, linhas = 3, ...resto } = {}) {
  const area = el("textarea", { id: `c-${nome}`, name: nome, rows: linhas, "aria-describedby": `erro-${nome}`, ...resto });
  area.value = valor;
  return caixa(nome, el("label", { for: `c-${nome}` }, rotulo), area, dica(ajuda));
}

export function campoSelecao(nome, rotulo, opcoes, { valor = "", vazio = "Escolha" } = {}) {
  const selecao = el("select", { id: `c-${nome}`, name: nome, "aria-describedby": `erro-${nome}` },
    vazio !== null && el("option", { value: "" }, vazio),
    opcoes.map(([v, texto]) => el("option", { value: v }, texto)));
  selecao.value = valor;
  return caixa(nome, el("label", { for: `c-${nome}` }, rotulo), selecao);
}

// Opções de toque. estilo: "chips" | "segmentos" | "lista". multiplo vira caixas de seleção.
export function grupoDeOpcoes(nome, rotulo, opcoes, { valor, multiplo = false, estilo = "chips", rotuloOculto = false } = {}) {
  const marcados = new Set([].concat(valor ?? []));
  return caixa(nome,
    el("fieldset", { "aria-describedby": `erro-${nome}` },
      el("legend", { class: rotuloOculto && "so-leitor" }, rotulo),
      el("div", { class: `opcoes opcoes--${estilo}` }, opcoes.map(([v, texto]) =>
        el("label", { class: "opcao" },
          el("input", { type: multiplo ? "checkbox" : "radio", name: nome, value: v, checked: marcados.has(v) }),
          el("span", {}, texto))))));
}

export const valorDe = (form, nome) => new FormData(form).get(nome) ?? "";
export const valoresDe = (form, nome) => new FormData(form).getAll(nome);

function limparErro(evento) {
  const campo = evento.target.closest?.("[data-campo]");
  const aviso = campo?.querySelector(":scope > .campo__erro");
  if (!aviso) return;
  aviso.hidden = true;
  campo.querySelectorAll("[aria-invalid]").forEach((c) => c.removeAttribute("aria-invalid"));
}

export function mostrarErros(form, erros) {
  // O aviso some assim que a pessoa mexe no campo.
  form.addEventListener("input", limparErro);
  form.addEventListener("change", limparErro);
  let primeiro = null;
  for (const campo of form.querySelectorAll("[data-campo]")) {
    const mensagem = erros[campo.dataset.campo] ?? "";
    const aviso = campo.querySelector(":scope > .campo__erro");
    aviso.textContent = mensagem;
    aviso.hidden = !mensagem;
    campo.querySelectorAll("input, select, textarea").forEach((c) => c.setAttribute("aria-invalid", String(Boolean(mensagem))));
    if (mensagem && !primeiro) primeiro = campo;
  }
  if (primeiro) {
    primeiro.scrollIntoView({ behavior: "smooth", block: "center" });
    primeiro.querySelector("input, select, textarea, button")?.focus({ preventScroll: true });
  }
  return !primeiro;
}
