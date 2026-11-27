// Prévia do mapa na tela Início; se algo falhar, a ilustração continua no lugar.
import { listarDenunciasPublicas } from "../servicos/mapa.js";
import { CENTRO_DO_MAPA } from "../dominio/denuncia.js";

async function mostrarPrevia() {
  if (!window.L) return;
  const caixa = document.getElementById("mapaInicio");
  caixa.replaceChildren();
  const mapa = window.L.map(caixa, {
    zoomControl: false, dragging: false, touchZoom: false, scrollWheelZoom: false,
    doubleClickZoom: false, boxZoom: false, keyboard: false,
  }).setView(CENTRO_DO_MAPA, 13);
  mapa.attributionControl.setPrefix(false);
  window.L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", { attribution: "© OpenStreetMap" })
    .addTo(mapa);

  const pontos = (await listarDenunciasPublicas()).map((d) => [d.lat, d.lng]);
  pontos.forEach((ponto) => window.L.circleMarker(ponto, {
    radius: 6, color: "#ffffff", weight: 2, fillColor: "#ff0000", fillOpacity: 1, interactive: false,
  }).addTo(mapa));
  if (pontos.length) mapa.fitBounds(pontos, { maxZoom: 14, padding: [16, 16] });
}

// sem os dados publicados, o mapa aparece sem marcadores
mostrarPrevia().catch(() => {});
