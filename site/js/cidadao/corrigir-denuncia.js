// Correção pelo cidadão: protocolo, código por e-mail, antes e depois.
import {
  confirmarCodigoCorrecao, listarBairros, listarCategorias, pedirCodigoCorrecao, salvarCorrecao,
} from "../servicos/denuncia.js";
import {
  alteracoesDoCidadao, comoOcorrencia, validarCorrecaoDoCidadao, valoresIniciais,
} from "../dominio/correcao.js";
import { CENTRO_DO_MAPA, dentroDoTerritorio } from "../dominio/denuncia.js";
import { ETAPAS, LARVAS, LOCAIS_DO_FOCO, RECIPIENTES, rotuloRecipiente } from "../dominio/ocorrencia.js";

const TEMPOS = ["Hoje", "Há alguns dias", "Há uma semana", "Há mais de uma semana", "Não sei informar"];
const CAMPOS = ["rua", "numero", "referencia", "descricao", "foco", "focoOutro", "agua", "larvas",
  "nome", "telefone", "email", "tempo", "outraEvidencia"];

const $ = (id) => document.getElementById(id);

let protocolo = "";
let autorizacao = ""; // vale 15 minutos e uma única correção
let denuncia = null;
let listas = { bairros: [], categorias: [] };
let ponto = null;
let mapa = null;
let marcador = null;

function mostrar(tela) {
  document.querySelectorAll("[data-tela]").forEach((parte) => { parte.hidden = parte.dataset.tela !== tela; });
  window.scrollTo({ top: 0 });
}

// trava o botão enquanto o servidor não responde
async function aguardando(botao, tarefa) {
  botao.disabled = true;
  try {
    await tarefa();
  } finally {
    botao.disabled = false;
  }
}

function recomecar(aviso = "") {
  autorizacao = "";
  denuncia = null;
  $("codigo").value = "";
  $("erroProtocolo").textContent = aviso;
  mostrar("protocolo");
}

function bloquear(etapa) {
  $("motivoBloqueio").textContent = etapa
    ? `Ela está na etapa ${ETAPAS[etapa]}.`
    : "O atendimento já começou.";
  mostrar("bloqueada");
}

// ---------- protocolo e código ----------

async function pedirCodigo(evento) {
  evento.preventDefault();
  if (!$("protocolo").reportValidity()) return;
  protocolo = $("protocolo").value.trim().toUpperCase();
  await aguardando(evento.submitter, async () => {
    try {
      await pedirCodigoCorrecao(protocolo);
      $("erroCodigo").textContent = "";
      mostrar("codigo");
    } catch (erro) {
      $("erroProtocolo").textContent = erro.message;
    }
  });
}

async function confirmar(evento) {
  evento.preventDefault();
  const codigo = $("codigo").value.trim();
  if (!/^\d{6}$/.test(codigo)) {
    $("erroCodigo").textContent = "Digite os seis números do código.";
    return;
  }
  await aguardando(evento.submitter, async () => {
    try {
      const resposta = await confirmarCodigoCorrecao(protocolo, codigo);
      if (!resposta.confirmed) {
        $("erroCodigo").textContent = "Código incorreto ou vencido. Confira ou peça outro.";
        return;
      }
      if (!resposta.report.can_edit) return bloquear(resposta.report.stage);
      const [bairros, categorias] = await Promise.all([listarBairros(), listarCategorias()]);
      listas = { bairros, categorias };
      autorizacao = resposta.token;
      denuncia = resposta.report;
      preencher();
    } catch (erro) {
      $("erroCodigo").textContent = erro.message;
    }
  });
}

// ---------- formulário ----------

const opcoes = (select, pares) => $(select).replaceChildren(...pares.map(([valor, texto]) => new Option(texto, valor)));

function preencher() {
  const valores = {
    ...valoresIniciais(comoOcorrencia(denuncia)),
    tempo: denuncia.noticed_since ?? "",
    outraEvidencia: denuncia.other_evidence ?? "",
  };
  opcoes("bairro", listas.bairros.map((b) => [b.id, b.name]));
  opcoes("categoria", listas.categorias.map((c) => [c.id, c.label]));
  opcoes("foco", [["", "Não informado"], ...Object.entries(LOCAIS_DO_FOCO)]);
  opcoes("larvas", [["", "Não informado"], ...Object.entries(LARVAS)]);
  const tempos = [...new Set(["", ...TEMPOS, valores.tempo])];
  opcoes("tempo", tempos.map((t) => [t, t || "Não informado"]));

  // mantém também um código antigo que não esteja na lista atual
  const codigos = [...new Set([...Object.keys(RECIPIENTES), ...valores.recipientes])];
  $("recipientes").querySelectorAll("label").forEach((l) => l.remove());
  $("recipientes").append(...codigos.map((codigo) => {
    const label = document.createElement("label");
    label.className = "option";
    const caixa = document.createElement("input");
    caixa.type = "checkbox";
    caixa.name = "recipiente";
    caixa.value = codigo;
    caixa.checked = valores.recipientes.includes(codigo);
    label.append(caixa, ` ${rotuloRecipiente(codigo)}`);
    return label;
  }));

  CAMPOS.forEach((campo) => { $(campo).value = valores[campo]; });
  $("bairro").value = valores.bairroId;
  $("categoria").value = valores.categoriaId;
  $("motivo").value = "";
  $("erroDados").textContent = "";
  $("identificacao").textContent = `Denúncia ${protocolo}`;
  $("campoFocoOutro").hidden = valores.foco !== "outro";
  mostrar("dados");
  desenharPonto(valores.ponto);
}

function lerFormulario() {
  const valores = Object.fromEntries(CAMPOS.map((campo) => [campo, $(campo).value]));
  return {
    ...valores,
    bairroId: $("bairro").value,
    categoriaId: $("categoria").value,
    recipientes: [...document.querySelectorAll("input[name=recipiente]:checked")].map((c) => c.value),
    ponto,
  };
}

function revisar(evento) {
  evento.preventDefault();
  if (!$("formCorrecao").reportValidity()) return;
  const dados = lerFormulario();
  const erros = Object.values(validarCorrecaoDoCidadao(denuncia, dados, $("motivo").value));
  $("erroDados").textContent = erros.join(" ");
  if (erros.length) return;

  const { linhas } = alteracoesDoCidadao(denuncia, dados, listas);
  $("alteracoes").replaceChildren(...linhas.map(({ campo, antes, depois }) => {
    const linha = document.createElement("p");
    const nome = document.createElement("strong");
    nome.textContent = `${campo}: `;
    linha.append(nome, `${antes} → ${depois}`);
    return linha;
  }));
  $("erroSalvar").textContent = "";
  mostrar("revisao");
}

async function salvar() {
  await aguardando($("salvar"), async () => {
    try {
      const { changes } = alteracoesDoCidadao(denuncia, lerFormulario(), listas);
      await salvarCorrecao(autorizacao, changes, $("motivo").value.trim());
      autorizacao = "";
      mostrar("salvo");
    } catch (erro) {
      if (erro.codigo === "etapa_invalida") return bloquear();
      if (["autorizacao_invalida", "versao_desatualizada"].includes(erro.codigo)) {
        return recomecar("A autorização expirou ou a denúncia mudou. Peça um novo código.");
      }
      $("erroSalvar").textContent = erro.message;
    }
  });
}

// ---------- mapa ----------

function desenharPonto(inicial) {
  ponto = inicial;
  if (!window.L) {
    $("erroMapa").textContent = "O mapa não carregou. Os outros dados podem ser corrigidos.";
    return;
  }
  if (!mapa) {
    mapa = window.L.map("map").setView(CENTRO_DO_MAPA, 14);
    window.L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap",
    }).addTo(mapa);
    mapa.on("click", (evento) => moverPonto(evento.latlng));
  }
  marcador?.remove();
  marcador = window.L.marker(inicial, { draggable: true, alt: "Local do foco" }).addTo(mapa);
  marcador.on("dragend", () => moverPonto(marcador.getLatLng()));
  mapa.invalidateSize();
  mapa.setView(inicial, 16);
}

function moverPonto({ lat, lng }) {
  const dentro = dentroDoTerritorio(lat, lng);
  $("erroMapa").textContent = dentro ? "" : "Este ponto está fora de Itambé.";
  if (dentro) ponto = { lat, lng };
  marcador.setLatLng(ponto);
}

// ---------- botões ----------

$("formProtocolo").addEventListener("submit", pedirCodigo);
$("formCodigo").addEventListener("submit", confirmar);
$("formCorrecao").addEventListener("submit", revisar);
$("salvar").addEventListener("click", salvar);
$("outroProtocolo").addEventListener("click", () => recomecar());
$("cancelar").addEventListener("click", () => recomecar());
$("voltarDados").addEventListener("click", () => mostrar("dados"));
$("foco").addEventListener("change", () => { $("campoFocoOutro").hidden = $("foco").value !== "outro"; });
