import { test } from "node:test";
import assert from "node:assert/strict";
import { agruparPorArea, filtrarPublicas } from "../../site/js/dominio/mapa.js";

const agora = new Date("2026-11-27T15:00:00-03:00");
const lista = [
  { id: "a", bairroId: 1, etapa: "recebida", recebidaEm: "2026-11-27T00:10:00-03:00", lat: -7.4, lng: -35.1 },
  { id: "b", bairroId: 2, etapa: "atendida", recebidaEm: "2026-11-22T10:00:00-03:00", lat: -7.4, lng: -35.1 },
  { id: "c", bairroId: 1, etapa: "em_analise", recebidaEm: "2026-10-01T10:00:00-03:00", lat: -7.41, lng: -35.1 },
];
const ids = (filtros) => filtrarPublicas(lista, filtros, agora).map((d) => d.id);

test("sem filtro mostra todas", () => assert.deepEqual(ids({}), ["a", "b", "c"]));

test("período usa o dia de Itambé e os últimos dias", () => {
  assert.deepEqual(ids({ periodo: "hoje" }), ["a"]);
  assert.deepEqual(ids({ periodo: "7" }), ["a", "b"]);
  assert.deepEqual(ids({ periodo: "30" }), ["a", "b"]);
});

test("localidade e etapa se somam", () => {
  assert.deepEqual(ids({ bairroId: "1" }), ["a", "c"]);
  assert.deepEqual(ids({ etapas: ["atendida", "em_analise"] }), ["b", "c"]);
  assert.deepEqual(ids({ bairroId: "1", etapas: ["atendida"] }), []);
});

test("denúncias da mesma área viram um só ponto no mapa", () => {
  const areas = agruparPorArea(lista);
  assert.equal(areas.length, 2);
  assert.deepEqual(areas[0].denuncias.map((d) => d.id), ["a", "b"]);
});
