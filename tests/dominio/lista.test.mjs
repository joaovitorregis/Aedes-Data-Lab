import { test } from "node:test";
import assert from "node:assert/strict";
import { consultaDaLista, consultaDasArquivadas, consultasDoResumo, temFiltro } from "../../site/js/dominio/lista.js";

test("sem filtros pede tudo que não está arquivado, da mais antiga para a mais nova", () => {
  assert.deepEqual(consultaDaLista({}), { filtros: ["publication=neq.arquivada"], ordem: "received_at.asc,id.asc" });
  assert.equal(consultaDaLista({ ordem: "recentes" }).ordem, "received_at.desc,id.desc");
});

test("busca pelo protocolo aceita só o final do número e ignora símbolos", () => {
  assert.deepEqual(consultaDaLista({ protocolo: " 112 " }).filtros, ["publication=neq.arquivada", "protocol=ilike.*112*"]);
  assert.deepEqual(consultaDaLista({ protocolo: "AED-1&stage=eq.x%" }).filtros, ["publication=neq.arquivada", "protocol=ilike.*AED-1stageeqx*"]);
  assert.deepEqual(consultaDaLista({ protocolo: "***" }).filtros, ["publication=neq.arquivada"]);
});

test("bairro, etapas e origem viram filtros do banco", () => {
  assert.deepEqual(consultaDaLista({ bairro: "7", etapas: ["recebida", "em_analise"], origem: "cidadao" }).filtros,
    ["publication=neq.arquivada", "neighborhood_id=eq.7", "stage=in.(recebida,em_analise)", "origin=eq.cidadao"]);
});

test("valor desconhecido no endereço da página é ignorado", () => {
  assert.deepEqual(consultaDaLista({ bairro: "x", etapas: ["apagada"], origem: "outro", de: "ontem" }).filtros, ["publication=neq.arquivada"]);
});

test("o período vale pelo dia de Itambé, incluindo o último dia inteiro", () => {
  assert.deepEqual(consultaDaLista({ de: "2026-11-01", ate: "2026-11-30" }).filtros,
    ["publication=neq.arquivada", "received_at=gte.2026-11-01T00:00:00-03:00", "received_at=lt.2026-12-01T00:00:00-03:00"]);
});

test("sem acesso é Em análise com pelo menos uma tentativa", () => {
  assert.deepEqual(consultaDaLista({ semAcesso: true }).filtros, ["publication=neq.arquivada", "stage=eq.em_analise", "failed_attempts=gt.0"]);
});

test("o resumo conta dentro do mesmo recorte da lista", () => {
  const r = consultasDoResumo({ bairro: "7" });
  assert.deepEqual(r.recebidas, ["publication=neq.arquivada", "neighborhood_id=eq.7", "stage=eq.recebida"]);
  assert.deepEqual(r.emAnalise, ["publication=neq.arquivada", "neighborhood_id=eq.7", "stage=eq.em_analise"]);
  assert.deepEqual(r.semAcesso, ["publication=neq.arquivada", "neighborhood_id=eq.7", "stage=eq.em_analise", "failed_attempts=gt.0"]);
});

test("diz se há algum filtro, para escolher a mensagem de lista vazia", () => {
  assert.equal(temFiltro({ ordem: "recentes", etapas: [] }), false);
  assert.equal(temFiltro({ origem: "agente" }), true);
});

test("Arquivadas mostra só a lixeira, a arquivada mais recente primeiro", () => {
  assert.deepEqual(consultaDasArquivadas({}),
    { filtros: ["publication=eq.arquivada"], ordem: "archived_at.desc,id.desc" });
  assert.deepEqual(consultaDasArquivadas({ protocolo: " 6& " }).filtros,
    ["publication=eq.arquivada", "protocol=ilike.*6*"]);
});
