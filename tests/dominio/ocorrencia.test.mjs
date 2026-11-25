import { test } from "node:test";
import assert from "node:assert/strict";
import {
  acoesDaOcorrencia, dataLocal, diasAberta, idValido, linhaDoTempo, prazoDaLixeira, rotuloRecipiente, visitasDoDetalhe,
} from "../../site/js/dominio/ocorrencia.js";

const oc = (extra) => ({
  id: "1", protocol: "AED-2026-000001", origin: "cidadao", stage: "recebida", publication: "publicada",
  neighborhood_id: 1, received_at: "2026-11-08T12:14:00Z", failed_attempts: 0, archived_at: null, ...extra,
});

test("a data usa o fuso de Itambé, não o do aparelho", () => {
  // 01:30 em UTC ainda é o dia anterior em Pernambuco (UTC-3).
  assert.equal(dataLocal("2026-11-09T01:30:00Z"), "2026-11-08");
});

test("dias em aberto contam dias do calendário até hoje", () => {
  assert.equal(diasAberta(oc(), "2026-11-15"), 7);
});

test("Recebida só oferece iniciar a análise", () => {
  const a = acoesDaOcorrencia(oc());
  assert.equal(a.principal, "iniciar_analise");
  assert.equal(a.podeEncerrar, false);
  assert.deepEqual(a.outras, ["corrigir", "arquivar"]);
});

test("Encerrar sem acesso só aparece com três tentativas", () => {
  assert.equal(acoesDaOcorrencia(oc({ stage: "em_analise", failed_attempts: 2 })).podeEncerrar, false);
  const a = acoesDaOcorrencia(oc({ stage: "em_analise", failed_attempts: 3 }));
  assert.equal(a.podeEncerrar, true);
  assert.equal(a.principal, "registrar_visita");
  assert.deepEqual(a.outras, ["observacao", "corrigir", "arquivar"]);
});

test("ocorrência concluída não tem ação de atendimento", () => {
  for (const stage of ["atendida", "encerrada"]) {
    assert.equal(acoesDaOcorrencia(oc({ stage })).principal, null);
  }
});

test("arquivada troca Arquivar por Voltar ao mapa", () => {
  const a = acoesDaOcorrencia(oc({ stage: "encerrada", publication: "arquivada", archived_at: "2026-11-15T13:00:00Z" }),
    new Date("2026-11-20T13:00:00Z"));
  assert.deepEqual(a.outras, ["corrigir", "voltar_ao_mapa"]);
});

test("o prazo da lixeira termina 30 dias depois do arquivamento", () => {
  const p = prazoDaLixeira("2026-11-15T13:00:00Z", new Date("2026-11-20T13:00:00Z"));
  assert.deepEqual(p, { ate: "2026-12-15", diasRestantes: 25, vencido: false });
  assert.equal(prazoDaLixeira("2026-10-01T13:00:00Z", new Date("2026-11-20T13:00:00Z")).vencido, true);
});

test("recipiente conhece os códigos da visita e deixa passar os textos do cidadão", () => {
  assert.equal(rotuloRecipiente("baldes_bacias_caixas"), "Baldes, bacias ou caixas-d’água");
  assert.equal(rotuloRecipiente("lata ou garrafa"), "Lata ou garrafa");
});

test("linha do tempo mostra quem fez cada passo, do mais novo ao mais antigo", () => {
  const eventos = [
    { id: 1, event_type: "recebida", author_id: null, created_at: "2026-11-02T11:31:00Z" },
    { id: 2, event_type: "publicada", author_id: null, created_at: "2026-11-02T11:32:00Z" },
    { id: 3, event_type: "analise_iniciada", author_id: "eu", created_at: "2026-11-03T12:10:00Z" },
    { id: 4, event_type: "visita_registrada", author_id: "outro", created_at: "2026-11-04T17:30:00Z",
      new_value: { access: "fechado", failed_attempts: 1, stage: "em_analise" } },
  ];
  const t = linhaDoTempo(eventos, { autores: { eu: "Marina Souza" }, nomeDoCidadao: "Ana Lúcia" });
  assert.deepEqual(t.map((p) => p.titulo), [
    "Agente registrou visita sem acesso", "Marina Souza iniciou a análise", "Ana Lúcia fez a denúncia",
  ]);
  assert.equal(t[0].detalhe, "Agente · imóvel fechado · 1ª tentativa");
});

test("em ocorrência de agente, a criação aparece junto da visita", () => {
  const eventos = [
    { id: 1, event_type: "recebida", author_id: "eu", created_at: "2026-11-12T18:10:00Z" },
    { id: 2, event_type: "visita_registrada", author_id: "eu", created_at: "2026-11-12T18:10:00Z",
      new_value: { access: "com_acesso", stage: "atendida" } },
  ];
  const t = linhaDoTempo(eventos, { autores: { eu: "Marina Souza" }, origem: "agente" });
  assert.deepEqual(t.map((p) => p.titulo), ["Marina Souza registrou visita com acesso"]);
  assert.equal(t[0].detalhe, "Agente · ocorrência criada e Atendida");
});

test("só um identificador no formato do banco é aceito", () => {
  assert.equal(idValido("8317f8f5-db7e-4267-809e-ae4d25023a40"), true);
  for (const ruim of ["", null, "qualquer", "8317f8f5", "8317f8f5-db7e-4267-809e-ae4d25023a40&x=1"]) {
    assert.equal(idValido(ruim), false, String(ruim));
  }
});

test("depois dos 30 dias da lixeira não oferece mais voltar ao mapa", () => {
  const velha = oc({ stage: "encerrada", publication: "arquivada", archived_at: "2026-10-01T13:00:00Z" });
  assert.deepEqual(acoesDaOcorrencia(velha, new Date("2026-11-20T13:00:00Z")).outras, ["corrigir"]);
});

test("o detalhe mostra todas as visitas, também as sem acesso, da mais nova à mais antiga", () => {
  const visitas = [
    { id: "a", visited_on: "2026-11-04", access: "fechado", notes: "Portão trancado.", created_at: "2026-11-04T17:00:00Z" },
    { id: "c", visited_on: "2026-11-07", access: "com_acesso", created_at: "2026-11-07T17:00:00Z" },
    { id: "b", visited_on: "2026-11-07", access: "recusado", created_at: "2026-11-07T12:00:00Z" },
  ];
  assert.deepEqual(visitasDoDetalhe(visitas).map((v) => v.id), ["c", "b", "a"]);
  assert.equal(visitas[0].id, "a", "não altera a lista recebida");
});
