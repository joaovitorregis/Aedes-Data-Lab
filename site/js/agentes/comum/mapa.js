// Mapa (Leaflet + OpenStreetMap), carregado só nas telas que usam mapa.
import { CENTRO_DO_MAPA, TERRITORIO } from "../../dominio/denuncia.js";
import { el } from "./ui.js";

const VERSAO = "https://unpkg.com/leaflet@1.9.4/dist";
const CORES = { recebida: "#7a5200", em_analise: "#1f5a7a", atendida: "#2f6b3f", encerrada: "#4a4f4b" };
let carga = null;

function inserir(tag, atributos) {
  return new Promise((ok, falha) => {
    const no = el(tag, { ...atributos, crossorigin: "" });
    no.addEventListener("load", ok);
    no.addEventListener("error", () => { no.remove(); falha(new Error("mapa indisponível")); });
    document.head.append(no);
  });
}

export function carregarLeaflet() {
  carga ??= Promise.all([
    inserir("link", { rel: "stylesheet", href: `${VERSAO}/leaflet.css`, integrity: "sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=" }),
    inserir("script", { src: `${VERSAO}/leaflet.js`, integrity: "sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=" }),
  ]).then(() => window.L).catch((e) => { carga = null; throw e; });
  return carga;
}

export const corDaEtapa = (etapa) => CORES[etapa];

export async function criarMapa(destino, { centro = CENTRO_DO_MAPA, zoom = 13 } = {}) {
  const L = await carregarLeaflet();
  const mapa = L.map(destino, { attributionControl: true }).setView([centro.lat, centro.lng], zoom);
  L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19, attribution: "© OpenStreetMap",
  }).addTo(mapa);
  // A caixa pode ainda estar ganhando tamanho (diálogo abrindo, aba trocando).
  requestAnimationFrame(() => mapa.invalidateSize());
  return { L, mapa };
}

export function marcador(L, ponto, { etapa = "em_analise", selecionado = false, titulo = "" } = {}) {
  return L.circleMarker([ponto.lat, ponto.lng], {
    radius: selecionado ? 12 : 9, color: "#ffffff", weight: selecionado ? 4 : 2,
    fillColor: CORES[etapa], fillOpacity: 1,
  }).bindTooltip(titulo, { direction: "top", offset: [0, -8] });
}

// Mapa parado, para mostrar um ponto no detalhe.
export async function mapaDoPonto(destino, ponto, etapa) {
  try {
    const { L, mapa } = await criarMapa(destino, { centro: ponto, zoom: 16 });
    mapa.scrollWheelZoom.disable();
    marcador(L, ponto, { etapa, selecionado: true }).addTo(mapa);
  } catch {
    destino.replaceChildren(el("p", { class: "mapa__falha" }, "O mapa não carregou. Use “Como chegar”."));
  }
}

// Mapa para escolher um ponto: toque move o marcador. `aoMudar` recebe { lat, lng }.
export async function mapaDeEscolha(destino, { ponto = null, aoMudar }) {
  const { L, mapa } = await criarMapa(destino, { centro: ponto ?? CENTRO_DO_MAPA, zoom: ponto ? 16 : 13 });
  mapa.setMaxBounds([[TERRITORIO.latMin - 0.1, TERRITORIO.lngMin - 0.1], [TERRITORIO.latMax + 0.1, TERRITORIO.lngMax + 0.1]]);
  let atual = null;
  const definir = (p, { centralizar = false } = {}) => {
    atual?.remove();
    atual = marcador(L, p, { etapa: "atendida", selecionado: true }).addTo(mapa);
    if (centralizar) mapa.setView([p.lat, p.lng], 17);
    aoMudar(p);
  };
  if (ponto) atual = marcador(L, ponto, { etapa: "atendida", selecionado: true }).addTo(mapa);
  const arredondar = (n) => Number(n.toFixed(6));
  mapa.on("click", (e) => definir({ lat: arredondar(e.latlng.lat), lng: arredondar(e.latlng.lng) }));
  // Teclado: Enter marca o centro do mapa (as setas movem o mapa).
  mapa.on("keypress", (e) => {
    if (e.originalEvent.key !== "Enter") return;
    const c = mapa.getCenter();
    definir({ lat: arredondar(c.lat), lng: arredondar(c.lng) });
  });
  return { definir, mapa };
}
