// Tela: acesso do agente.
import { avisoNaTela, botao, comEnvio, el } from "./comum/ui.js";
import { campoTexto, mostrarErros, valorDe } from "./comum/campos.js";
import { ROTAS } from "./comum/moldura.js";
import { entrar, sessaoAtual } from "../servicos/sessao.js";

if (sessaoAtual()) location.replace(ROTAS.ocorrencias);

const enviar = botao("Entrar", { tipo: "submit", classe: "botao--largo" });
const falha = el("p", { class: "erro-geral", role: "alert", hidden: true });
const senha = campoTexto("senha", "Senha", { tipo: "password", autocomplete: "current-password", placeholder: "Digite sua senha" });
const entrada = senha.querySelector("input");
const mostrar = el("button", {
  type: "button", class: "mostrar-senha", "aria-pressed": "false",
  onclick: () => {
    const escondida = entrada.type === "password";
    entrada.type = escondida ? "text" : "password";
    mostrar.textContent = escondida ? "Ocultar" : "Mostrar";
    mostrar.setAttribute("aria-pressed", String(escondida));
  },
}, "Mostrar");
const caixaDaSenha = el("div", { class: "senha" });
entrada.replaceWith(caixaDaSenha);
caixaDaSenha.append(entrada, mostrar);

const form = el("form", { novalidate: true },
  campoTexto("email", "E-mail", { tipo: "email", autocomplete: "username", placeholder: "Digite seu e-mail", inputmode: "email" }),
  senha, falha, enviar);

form.addEventListener("submit", async (evento) => {
  evento.preventDefault();
  falha.hidden = true;
  const email = valorDe(form, "email").trim();
  const chave = valorDe(form, "senha");
  const erros = {};
  if (!email) erros.email = "Informe o e-mail.";
  if (!chave) erros.senha = "Informe a senha.";
  if (!mostrarErros(form, erros)) return;
  await comEnvio(enviar, async () => {
    try {
      await entrar(email, chave);
      location.replace(ROTAS.ocorrencias);
    } catch (e) {
      falha.textContent = e.message;
      falha.hidden = false;
    }
  }, "Entrando…");
});

const motivo = new URLSearchParams(location.search).get("motivo");
document.querySelector("main").replaceChildren(
  el("div", { class: "acesso" },
    el("p", { class: "acesso__selo" }, "Portal técnico"),
    el("h1", {}, "Aedes Datalab"),
    el("p", { class: "apoio" }, "Acesso restrito ao agente de endemias"),
    motivo === "sessao" && avisoNaTela({ titulo: "Sua sessão terminou", texto: "Entre de novo para continuar.", tom: "alerta" }),
    motivo === "acesso" && avisoNaTela({ titulo: "Acesso desativado", texto: "Fale com a equipe do projeto.", tom: "alerta" }),
    el("div", { class: "cartao" }, el("h2", {}, "Agente"), el("p", { class: "apoio" }, "Consulte e trate as ocorrências enviadas pelo site.")),
    form));
