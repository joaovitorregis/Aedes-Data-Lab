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
const circulos = new Map();

function elemento(tag, texto, classe) {
  const novo = document.createElement(tag);
  if (texto) novo.textContent = texto;
  if (classe) novo.className = classe;
  return novo;
}

// prévia curta de uma denúncia (PRD, RF-MAP-01)
function previa(d) {
  const caixa = elemento("article", "", "previa");
  if (d.fotos[0]) {
    const foto = elemento("img");
    foto.src = d.fotos[0];
    foto.alt = "Foto da denúncia";
    foto.loading = "lazy";
    caixa.append(foto);
  }
  caixa.append(
    elemento("strong", categorias.get(d.categoriaId) ?? "Ocorrência"),
    elemento("span", `${bairros.get(d.bairroId) ?? "Itambé"} · ${formatarData(dataLocal(d.recebidaEm))}`),
    elemento("span", `${ETAPAS[d.etapa]} · ${ORIGEM[d.origem] ?? ""}`),
    elemento("p", d.descricao),
  );
  return caixa;
}

function lerFiltros() {
  const dados = new FormData(formFiltros);
  return { periodo: dados.get("periodo"), bairroId: dados.get("bairro"), etapas: dados.getAll("etapa") };
}

function desenharMapa(lista) {
  if (!mapa) return;
  camada.clearLayers();
  circulos.clear();
  for (const area of agruparPorArea(lista)) {
    const conteudo = elemento("div", "", "previas");
    conteudo.append(...area.denuncias.map(previa));
    const circulo = window.L.circle([area.lat, area.lng], { radius: 100, color: "#ff0000", fillOpacity: 0.35 })
      .bindPopup(conteudo, { maxWidth: 260, maxHeight: 280 })
      .addTo(camada);
    area.denuncias.forEach((d) => circulos.set(d.id, circulo));
  }
}

function desenharLista(lista) {
  $("resumo").replaceChildren(...Object.entries(ETAPAS).map(([etapa, rotulo]) =>
    elemento("p", `${rotulo}: ${lista.filter((d) => d.etapa === etapa).length}`)));

  $("occurrencesList").replaceChildren(...lista.map((d) => {
    const cartao = previa(d);
    cartao.classList.add("occurrence-card");
    if (mapa) {
      const ver = elemento("button", "Ver no mapa", "summary-button");
      ver.type = "button";
      ver.addEventListener("click", () => {
        $("mapa").scrollIntoView({ block: "center" });
        mapa.setView([d.lat, d.lng], 17);
        circulos.get(d.id)?.openPopup();
      });
      cartao.append(ver);
    }
    return cartao;
  }));
}

function atualizar() {
  const escolha = lerFiltros();
  const total = [escolha.periodo, escolha.bairroId, escolha.etapas.length].filter(Boolean).length;
  $("filterCount").textContent = total;
  $("filterCount").hidden = total === 0;
  if (!carregado) return;

  const lista = filtrarPublicas(denuncias, escolha);
  desenharMapa(lista);
  desenharLista(lista);
  if (!denuncias.length) $("situacao").textContent = "Ainda não há denúncias publicadas.";
  else if (!lista.length) $("situacao").textContent = "Nenhuma denúncia para estes filtros.";
  else $("situacao").textContent = lista.length === 1 ? "1 denúncia no mapa." : `${lista.length} denúncias no mapa.`;
}

async function carregar() {
  carregado = false;
  $("situacao").textContent = "Carregando denúncias...";
  $("tentarDeNovo").hidden = true;
  $("resumo").replaceChildren();
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
    $("avisoLocal").textContent = "O mapa não carregou. A lista continua disponível.";
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

function mostrarLista() {
  $("occurrencesSection").classList.add("visible");
  $("occurrencesSection").scrollIntoView({ block: "start" });
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
$("showOccurrences").addEventListener("click", mostrarLista);
$("centerMap").addEventListener("click", centralizar);
$("tentarDeNovo").addEventListener("click", carregar);

iniciarMapa();
carregar();
