// Registrar foco: a denúncia vai para o Supabase e aparece na área dos agentes.
import {
  confirmarCodigo, enviarCodigo, listarBairros, listarCategorias, salvarDenuncia,
} from "../servicos/denuncia.js";
import {
  CENTRO_DO_MAPA, LIMITES, dentroDoTerritorio, emailValido, montarDados, telefoneValido, validarFotos,
} from "../dominio/denuncia.js";
import { LARVAS, RECIPIENTES } from "../dominio/ocorrencia.js";
import { prepararFoto } from "./foto.js";

const $ = (id) => document.getElementById(id);
const form = $("denunciaForm");
const etapas = form.querySelectorAll(":scope > .step");
const marcas = document.querySelectorAll(".progress .step");

let etapaAtual = 0;
let envioId = crypto.randomUUID(); // o mesmo id nas novas tentativas não duplica a denúncia
let emailConfirmado = "";
let ponto = null;
let fotos = [];
let mapa = null;
let marcador = null;

// ---------- etapas ----------

function mostrarTela(tela) {
  form.hidden = tela !== "formulario";
  $("progresso").hidden = tela !== "formulario";
  $("voltarTopo").hidden = tela !== "formulario";
  $("successMessage").hidden = tela !== "sucesso";
  $("errorMessage").hidden = tela !== "erro";
  window.scrollTo({ top: 0 });
}

function mostrarEtapa(numero) {
  etapaAtual = numero;
  etapas.forEach((etapa, i) => etapa.classList.toggle("active", i === numero));
  marcas.forEach((marca, i) => marca.classList.toggle("active", i <= numero));
  $("etapaTexto").textContent = `Etapa ${numero + 1} de 4`;
  mostrarTela("formulario");
  if (numero === 0) mapa?.invalidateSize();
}

function mostrarParte(id) {
  for (const parte of ["dadosPessoais", "escolhaCanal", "confirmacaoEmail"]) $(parte).hidden = parte !== id;
  window.scrollTo({ top: 0 });
}

function camposValidos(area) {
  for (const campo of area.querySelectorAll("input:not([type=file]), select, textarea")) {
    // só espaços conta como vazio
    if (campo.required && campo.type !== "checkbox" && !campo.value.trim()) campo.value = "";
    if (!campo.checkValidity()) {
      campo.reportValidity();
      return false;
    }
  }
  return true;
}

function avancar() {
  if (etapaAtual === 0) {
    if (!camposValidos(etapas[0])) return;
    if (!ponto) {
      $("erroMapa").textContent = "Marque no mapa o local do foco.";
      return;
    }
    mostrarEtapa(1);
  } else if (etapaAtual === 1) {
    if (!camposValidos(etapas[1])) return;
    $("erroFotos").textContent = validarFotos(fotos);
    if (!$("erroFotos").textContent) mostrarEtapa(2);
  } else if (etapaAtual === 2) {
    conferirDados();
  }
}

function voltar() {
  if (etapaAtual === 0) return;
  if (etapaAtual === 3) mostrarParte("dadosPessoais");
  mostrarEtapa(etapaAtual - 1);
}

// ---------- listas ----------

function preencherLista(select, itens, texto) {
  select.replaceChildren(new Option("Selecione...", ""));
  itens.forEach((item) => select.add(new Option(texto(item), item.id)));
}

async function carregarListas() {
  $("erroListas").hidden = true;
  try {
    const [bairros, categorias] = await Promise.all([listarBairros(), listarCategorias()]);
    preencherLista($("bairro"), bairros, (b) => b.name);
    preencherLista($("categoria"), categorias, (c) => c.label);
  } catch {
    $("erroListas").hidden = false;
  }
}

function criarRecipientes() {
  for (const [codigo, rotulo] of Object.entries(RECIPIENTES)) {
    const label = document.createElement("label");
    label.className = "option";
    const caixa = document.createElement("input");
    caixa.type = "checkbox";
    caixa.name = "recipiente";
    caixa.value = codigo;
    label.append(caixa, ` ${rotulo}`);
    $("recipientes").append(label);
  }
}

// ---------- mapa ----------

function marcarPonto(lat, lng) {
  if (!dentroDoTerritorio(lat, lng)) {
    $("erroMapa").textContent = "Este ponto está fora de Itambé. Marque um local dentro do município.";
    if (marcador && ponto) marcador.setLatLng(ponto);
    return false;
  }
  ponto = { lat, lng };
  $("erroMapa").textContent = "";
  if (marcador) {
    marcador.setLatLng(ponto);
  } else {
    marcador = window.L.marker(ponto, { draggable: true, alt: "Local do foco" }).addTo(mapa);
    marcador.on("dragend", () => {
      const novo = marcador.getLatLng();
      marcarPonto(novo.lat, novo.lng);
    });
  }
  return true;
}

function iniciarMapa() {
  if (!window.L) {
    $("erroMapa").textContent = "O mapa não carregou. Confira a internet e recarregue a página.";
    return;
  }
  mapa = window.L.map("map").setView(CENTRO_DO_MAPA, 14);
  window.L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "&copy; OpenStreetMap",
  }).addTo(mapa);
  mapa.on("click", (evento) => marcarPonto(evento.latlng.lat, evento.latlng.lng));
}

// a localização só é pedida quando a pessoa toca no botão
function usarLocalizacao() {
  const falha = () => {
    $("erroMapa").textContent = "Não foi possível obter a localização. Marque o local no mapa.";
  };
  if (!mapa || !navigator.geolocation) return falha();
  navigator.geolocation.getCurrentPosition(({ coords }) => {
    if (marcarPonto(coords.latitude, coords.longitude)) mapa.setView(ponto, 17);
  }, falha, { enableHighAccuracy: true, timeout: 10000 });
}

// ---------- fotos ----------

function desenharFotos() {
  const cheio = fotos.length >= LIMITES.fotos;
  $("botaoCamera").disabled = cheio;
  $("botaoGaleria").disabled = cheio;
  $("listaFotos").replaceChildren(...fotos.map((foto, i) => {
    const item = document.createElement("li");
    const imagem = document.createElement("img");
    imagem.src = URL.createObjectURL(foto);
    imagem.alt = `Foto ${i + 1}`;
    imagem.onload = () => URL.revokeObjectURL(imagem.src);
    const remover = document.createElement("button");
    remover.type = "button";
    remover.className = "back-btn";
    remover.textContent = "Remover";
    remover.addEventListener("click", () => {
      fotos.splice(i, 1);
      $("erroFotos").textContent = "";
      desenharFotos();
    });
    item.append(imagem, remover);
    return item;
  }));
}

async function adicionarFotos(evento) {
  const escolhidas = [...evento.target.files];
  evento.target.value = "";
  if (!escolhidas.length) return;
  if (fotos.length + escolhidas.length > LIMITES.fotos) {
    $("erroFotos").textContent = `Envie no máximo ${LIMITES.fotos} fotos.`;
    return;
  }
  $("erroFotos").textContent = "Preparando a foto...";
  try {
    const prontas = await Promise.all(escolhidas.map(prepararFoto));
    fotos = [...fotos, ...prontas].slice(0, LIMITES.fotos);
    $("erroFotos").textContent = validarFotos(fotos);
  } catch {
    $("erroFotos").textContent = "Não foi possível abrir essa foto. Tire outra ou escolha um JPG ou PNG.";
  }
  desenharFotos();
}

// ---------- contato e código ----------

const emailDigitado = () => $("email").value.trim().toLowerCase();

function conferirDados() {
  $("email").setCustomValidity(emailValido($("email").value) ? "" : "Informe um e-mail válido.");
  $("telefone").setCustomValidity(telefoneValido($("telefone").value) ? "" : "Informe o telefone com DDD.");
  if (!camposValidos($("dadosPessoais"))) return;
  if (emailConfirmado === emailDigitado()) return abrirRevisao();
  $("emailCanal").textContent = emailDigitado();
  $("erroCanal").textContent = "";
  mostrarParte("escolhaCanal");
}

async function pedirCodigo(botao, aviso) {
  botao.disabled = true;
  aviso.textContent = "Enviando o código...";
  try {
    await enviarCodigo(envioId, emailDigitado());
    aviso.textContent = "";
    $("emailExibido").textContent = emailDigitado();
    $("codigoEmail").value = "";
    $("mensagemCodigo").textContent = "Código enviado. Ele vale por 10 minutos.";
    mostrarParte("confirmacaoEmail");
  } catch (erro) {
    aviso.textContent = erro.message;
  } finally {
    botao.disabled = false;
  }
}

async function conferirCodigo() {
  const codigo = $("codigoEmail").value.trim();
  if (!/^\d{6}$/.test(codigo)) {
    $("mensagemCodigo").textContent = "Digite os seis números do código.";
    return;
  }
  $("confirmarCodigo").disabled = true;
  try {
    const { confirmed } = await confirmarCodigo(envioId, emailDigitado(), codigo);
    if (!confirmed) {
      $("mensagemCodigo").textContent = "Código incorreto ou vencido. Confira ou peça outro.";
      return;
    }
    emailConfirmado = emailDigitado();
    abrirRevisao();
  } catch (erro) {
    $("mensagemCodigo").textContent = erro.message;
  } finally {
    $("confirmarCodigo").disabled = false;
  }
}

// ---------- revisão e envio ----------

const escolhido = (id) => $(id).selectedOptions[0]?.text ?? "";
const marcados = () => [...form.querySelectorAll("input[name=recipiente]:checked")].map((c) => c.value);

function escreverLinhas(destino, itens) {
  $(destino).replaceChildren(...itens.map(([rotulo, valor]) => {
    const linha = document.createElement("p");
    const nome = document.createElement("strong");
    nome.textContent = `${rotulo}: `;
    linha.append(nome, valor || "Não informado");
    return linha;
  }));
}

function abrirRevisao() {
  mostrarParte("dadosPessoais");
  escreverLinhas("revisaoPublica", [
    ["Bairro ou localidade", escolhido("bairro")],
    ["Categoria", escolhido("categoria")],
    ["Descrição", $("descricao").value.trim()],
    ["Fotos", String(fotos.length)],
    ["Localização", "Área aproximada"],
  ]);
  escreverLinhas("revisaoPrivada", [
    ["Nome", $("nome").value.trim()],
    ["E-mail (confirmado)", emailDigitado()],
    ["Telefone", $("telefone").value.trim()],
    ["Rua", $("logradouro").value.trim()],
    ["Número", $("semNumero").checked ? "Sem número" : $("numero").value.trim()],
    ["Referência", $("referencia").value.trim()],
    ["Tipo de local", escolhido("localFoco")],
    ["Tempo observado", $("tempo").value],
    ["Água acumulada", escolhido("agua")],
    ["Recipientes ou estruturas", marcados().map((codigo) => RECIPIENTES[codigo]).join(", ")],
    ["Larvas ou pupas", LARVAS[$("larvas").value]],
    ["Outra evidência", $("outraEvidencia").value.trim()],
    ["Ponto do foco", "Local exato marcado no mapa"],
  ]);
  mostrarEtapa(3);
}

function lerFormulario() {
  return montarDados({
    submissionId: envioId, lat: ponto.lat, lng: ponto.lng,
    bairroId: $("bairro").value, categoriaId: $("categoria").value, descricao: $("descricao").value,
    localFoco: $("localFoco").value, localFocoRotulo: escolhido("localFoco"),
    agua: $("agua").value, recipientes: marcados(), larvas: $("larvas").value,
    tempo: $("tempo").value, outraEvidencia: $("outraEvidencia").value,
    nome: $("nome").value, email: $("email").value, telefone: $("telefone").value,
    logradouro: $("logradouro").value, semNumero: $("semNumero").checked,
    numero: $("numero").value, referencia: $("referencia").value,
  });
}

async function enviar(evento) {
  evento.preventDefault();
  if (etapaAtual !== 3 || $("enviar").disabled || !camposValidos(etapas[3])) return;

  $("enviar").disabled = true;
  $("enviar").textContent = "Enviando...";
  try {
    const resposta = await salvarDenuncia(lerFormulario(), fotos);
    limpar();
    $("protocolNumber").textContent = resposta.protocol;
    $("publicacao").textContent = resposta.publication === "publicada"
      ? "Denúncia recebida e publicada no mapa."
      : "Denúncia recebida; publicação no mapa pendente. Não é preciso enviar de novo.";
    mostrarTela("sucesso");
  } catch (erro) {
    if (erro.codigo === "contato_nao_confirmado") {
      emailConfirmado = "";
      mostrarEtapa(2);
      mostrarParte("escolhaCanal");
      $("erroCanal").textContent = erro.message;
      return;
    }
    $("motivoErro").textContent = erro.message;
    mostrarTela("erro");
  } finally {
    $("enviar").disabled = false;
    $("enviar").textContent = "Enviar denúncia";
  }
}

function limpar() {
  form.reset();
  fotos = [];
  ponto = null;
  marcador?.remove();
  marcador = null;
  emailConfirmado = "";
  envioId = crypto.randomUUID();
  $("numero").disabled = false;
  $("erroFotos").textContent = "";
  desenharFotos();
  mostrarParte("dadosPessoais");
}

// ---------- botões ----------

form.addEventListener("click", (evento) => {
  const acao = evento.target.closest("[data-acao]")?.dataset.acao;
  if (acao === "avancar") avancar();
  if (acao === "voltar") voltar();
});
// Enter nos campos avança em vez de enviar
form.addEventListener("keydown", (evento) => {
  if (evento.key !== "Enter" || evento.target.tagName !== "INPUT") return;
  evento.preventDefault();
  if (evento.target.id === "codigoEmail") conferirCodigo();
  else avancar();
});
form.addEventListener("submit", enviar);

$("voltarTopo").addEventListener("click", (evento) => {
  if (etapaAtual === 0) return;
  evento.preventDefault();
  voltar();
});
$("recarregarListas").addEventListener("click", carregarListas);
$("usarLocalizacao").addEventListener("click", usarLocalizacao);
$("semNumero").addEventListener("change", () => { $("numero").disabled = $("semNumero").checked; });
$("botaoCamera").addEventListener("click", () => $("camera").click());
$("botaoGaleria").addEventListener("click", () => $("fotos").click());
$("camera").addEventListener("change", adicionarFotos);
$("fotos").addEventListener("change", adicionarFotos);
$("receberEmail").addEventListener("click", () => pedirCodigo($("receberEmail"), $("erroCanal")));
$("reenviarCodigo").addEventListener("click", () => pedirCodigo($("reenviarCodigo"), $("mensagemCodigo")));
$("confirmarCodigo").addEventListener("click", conferirCodigo);
$("voltarDados").addEventListener("click", () => mostrarParte("dadosPessoais"));
$("trocarCanal").addEventListener("click", () => mostrarParte("escolhaCanal"));
$("tentarNovamente").addEventListener("click", () => {
  mostrarEtapa(3);
  form.requestSubmit($("enviar"));
});
$("voltarRevisao").addEventListener("click", () => mostrarEtapa(3));
$("cancelar").addEventListener("click", () => {
  if (!confirm("Tem certeza de que deseja cancelar a denúncia?")) return;
  limpar();
  mostrarEtapa(0);
});

criarRecipientes();
iniciarMapa();
carregarListas();
