// Mapa público: lê só os dados publicados e mostra a área aproximada.
import { listarDenunciasPublicas } from "../servicos/mapa.js";
import { listarBairros, listarCategorias } from "../servicos/denuncia.js";
import { agruparPorArea, filtrarPublicas } from "../dominio/mapa.js";
import { CENTRO_DO_MAPA, dentroDoTerritorio } from "../dominio/denuncia.js";
import { ETAPAS, dataLocal, formatarData } from "../dominio/ocorrencia.js";

const ORIGEM = { cidadao: "Feita por cidadão", agente: "Feita por agente" };
const $ = (id) => document.getElementById(id);
const filtros = $("filtros");
const formFiltros = filtros.querySelector("form");

let denuncias = [];
let carregado = false;
let bairros = new Map();
let categorias = new Map();
let mapa = null;
let camada = null;
let voce = null;

function elemento(tag, texto, classe) {
  const novo = document.createElement(tag);
  if (texto) novo.textContent = texto;
  if (classe) novo.className = classe;
  return novo;
}

// primeira foto, ou um quadro neutro se não houver ou não carregar
function foto(d) {
  const quadro = elemento("div", "", "foto");
  if (d.fotos[0]) {
    const imagem = elemento("img");
    imagem.src = d.fotos[0];
    imagem.alt = "Foto da denúncia";
    imagem.loading = "lazy";
    imagem.addEventListener("error", () => imagem.remove());
    quadro.append(imagem);
  }
  if (d.fotos.length > 1) quadro.append(elemento("span", `+${d.fotos.length - 1}`, "mais-fotos"));
  return quadro;
}

// prévia curta de uma denúncia, mostrada no balão do mapa (PRD, RF-MAP-01)
function previa(d) {
  const etiquetas = elemento("div", "", "etiquetas");
  etiquetas.append(
    elemento("span", ETAPAS[d.etapa], `etiqueta etapa-${d.etapa}`),
    elemento("span", ORIGEM[d.origem] ?? "", "etiqueta"),
  );
  const texto = elemento("div", "", "texto");
  texto.append(
    elemento("h3", categorias.get(d.categoriaId) ?? "Ocorrência"),
    elemento("p", `${bairros.get(d.bairroId) ?? "Itambé"} · ${formatarData(dataLocal(d.recebidaEm))}`, "onde"),
    etiquetas,
    elemento("p", d.descricao, "descricao"),
  );
  const caixa = elemento("article", "", "previa");
  caixa.append(foto(d), texto);
  return caixa;
}

function lerFiltros() {
  const dados = new FormData(formFiltros);
  return { periodo: dados.get("periodo"), bairroId: dados.get("bairro"), etapas: dados.getAll("etapa") };
}

// o ponto do mapa também abre pelo teclado; Esc fecha e devolve o foco
function ligarTeclado(circulo, conteudo, rotulo) {
  const ponto = circulo.getElement();
  ponto.setAttribute("tabindex", "0");
  ponto.setAttribute("role", "button");
  ponto.setAttribute("aria-label", rotulo);
  ponto.addEventListener("keydown", (evento) => {
    if (evento.key !== "Enter" && evento.key !== " ") return;
    evento.preventDefault();
    circulo.openPopup();
    conteudo.focus({ preventScroll: true });
  });
  conteudo.tabIndex = -1;
  conteudo.addEventListener("keydown", (evento) => {
    if (evento.key !== "Escape") return;
    circulo.closePopup();
    ponto.focus({ preventScroll: true });
  });
}

function desenharMapa(lista) {
  if (!mapa) return;
  camada.clearLayers();
  for (const area of agruparPorArea(lista)) {
    const conteudo = elemento("div", "", "previas");
    conteudo.append(...area.denuncias.map(previa));
    const circulo = window.L.circle([area.lat, area.lng], { radius: 100, color: "#ff0000", fillOpacity: 0.35 })
      .bindPopup(conteudo, { maxWidth: 260, maxHeight: 280 })
      .addTo(camada);
    const [primeira] = area.denuncias;
    const local = bairros.get(primeira.bairroId) ?? "Itambé";
    ligarTeclado(circulo, conteudo, area.denuncias.length === 1
      ? `Abrir denúncia: ${categorias.get(primeira.categoriaId) ?? "Ocorrência"}, ${local}`
      : `Abrir ${area.denuncias.length} denúncias em ${local}`);
  }
}

function atualizar() {
  const escolha = lerFiltros();
  const total = [escolha.periodo, escolha.bairroId, escolha.etapas.length].filter(Boolean).length;
  $("filterCount").textContent = total;
  $("filterCount").hidden = total === 0;
  if (!carregado) return;

  const lista = filtrarPublicas(denuncias, escolha);
  desenharMapa(lista);

  let aviso = lista.length === 1 ? "1 denúncia no mapa." : `${lista.length} denúncias no mapa.`;
  if (!denuncias.length) aviso = "Ainda não há denúncias publicadas.";
  else if (!lista.length) aviso = "Nenhuma denúncia para estes filtros.";
  $("situacao").textContent = aviso;
}

async function carregar() {
  carregado = false;
  $("situacao").textContent = "Carregando denúncias...";
  $("tentarDeNovo").hidden = true;
  try {
    const [lista, listaBairros, listaCategorias] = await Promise.all(
      [listarDenunciasPublicas(), listarBairros(), listarCategorias()]);
    denuncias = lista;
    bairros = new Map(listaBairros.map((b) => [b.id, b.name]));
    categorias = new Map(listaCategorias.map((c) => [c.id, c.label]));
    $("filtroBairro").replaceChildren(new Option("Todas as localidades", ""),
      ...listaBairros.map((b) => new Option(b.name, b.id)));
    carregado = true;
    atualizar();
  } catch {
    // erro nunca aparece como "zero denúncias"
    $("situacao").textContent = "Não foi possível carregar as denúncias.";
    $("tentarDeNovo").hidden = false;
  }
}

function iniciarMapa() {
  if (!window.L) {
    $("avisoLocal").textContent = "O mapa não carregou. Confira a internet e recarregue a página.";
    return;
  }
  mapa = window.L.map("mapa").setView(CENTRO_DO_MAPA, 14);
  window.L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: "&copy; OpenStreetMap",
  }).addTo(mapa);
  camada = window.L.layerGroup().addTo(mapa);
}

// a localização só é pedida quando a pessoa toca no botão
function centralizar() {
  const falha = () => { $("avisoLocal").textContent = "Não foi possível obter a sua localização."; };
  if (!mapa || !navigator.geolocation) return falha();
  navigator.geolocation.getCurrentPosition(({ coords }) => {
    const ponto = [coords.latitude, coords.longitude];
    $("avisoLocal").textContent = dentroDoTerritorio(...ponto) ? "" : "Você está fora de Itambé.";
    voce?.remove();
    voce = window.L.marker(ponto).addTo(mapa).bindPopup("Você está aqui");
    mapa.setView(ponto, 17);
  }, falha, { timeout: 10000 });
}

for (const [etapa, rotulo] of Object.entries(ETAPAS)) {
  const label = elemento("label");
  const caixa = elemento("input");
  caixa.type = "checkbox";
  caixa.name = "etapa";
  caixa.value = etapa;
  label.append(caixa, elemento("span", rotulo));
  $("filtroEtapas").append(label);
}

$("openFilters").addEventListener("click", () => filtros.showModal());
filtros.addEventListener("click", (evento) => { if (evento.target === filtros) filtros.close(); });
formFiltros.addEventListener("change", atualizar);
formFiltros.addEventListener("reset", () => setTimeout(atualizar, 0));
$("centerMap").addEventListener("click", centralizar);
$("tentarDeNovo").addEventListener("click", carregar);

iniciarMapa();
carregar();
