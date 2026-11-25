import { test } from "node:test";
import assert from "node:assert/strict";
import { alteracoes, separarEndereco, validarCorrecao, valoresIniciais } from "../../site/js/dominio/correcao.js";

const cidadao = {
  origin: "cidadao", location_lat: -7.41, location_lng: -35.1, neighborhood_id: 7, category_id: 1,
  description: "Pneus com água.", focus_location: "residencia", focus_location_other: null, water_present: true,
  containers: ["pneus"], larvae: "nao_sei", place_address: null, place_reference: null,
  privado: { name: "José Carlos", phone: "81900000000", email: "jose@exemplo.invalid",
    address: "Rua da Aurora, 123", reference: "portão azul", confirmed_channel: "email" },
};
const agente = {
  ...cidadao, origin: "agente", privado: null, place_address: "Rua das Flores, 15", place_reference: "padaria",
};

test("separa rua e número no último separador", () => {
  assert.deepEqual(separarEndereco("Rua A, bloco 2, 45"), { rua: "Rua A, bloco 2", numero: "45" });
  assert.deepEqual(separarEndereco("Sítio Novo"), { rua: "Sítio Novo", numero: "" });
});

test("sem mudança não há o que salvar", () => {
  const v = valoresIniciais(cidadao);
  assert.deepEqual(alteracoes(cidadao, v).changes, {});
});

test("envia só o campo que mudou e mostra antes e depois", () => {
  const v = { ...valoresIniciais(cidadao), numero: "132" };
  const r = alteracoes(cidadao, v);
  assert.deepEqual(r.changes, { address: "Rua da Aurora, 132" });
  assert.deepEqual(r.linhas, [{ campo: "Endereço", antes: "Rua da Aurora, 123", depois: "Rua da Aurora, 132" }]);
});

test("em ocorrência de agente, o endereço vai para os campos do local", () => {
  const v = { ...valoresIniciais(agente), numero: "51", referencia: "mercado" };
  assert.deepEqual(alteracoes(agente, v).changes, { place_address: "Rua das Flores, 51", place_reference: "mercado" });
});

test("o contato confirmado nunca é enviado", () => {
  const v = { ...valoresIniciais(cidadao), email: "outro@exemplo.invalid", telefone: "(81) 91111-2222" };
  assert.deepEqual(alteracoes(cidadao, v).changes, { phone: "81911112222" });
});

test("tirar a água também limpa os recipientes", () => {
  const v = { ...valoresIniciais(cidadao), agua: "nao" };
  const { changes } = alteracoes(cidadao, v);
  assert.equal(changes.water_present, false);
  assert.deepEqual(changes.containers, []);
});

test("mover o ponto envia as duas coordenadas", () => {
  const v = { ...valoresIniciais(cidadao), ponto: { lat: -7.4102, lng: -35.1 } };
  assert.deepEqual(alteracoes(cidadao, v).changes, { location_lat: -7.4102, location_lng: -35.1 });
});

test("exige motivo, alguma mudança e dados válidos", () => {
  const v = valoresIniciais(cidadao);
  assert.ok(validarCorrecao(cidadao, v, "motivo").geral);
  const w = { ...v, rua: "", telefone: "123", ponto: { lat: -8.05, lng: -34.9 } };
  const e = validarCorrecao(cidadao, w, "");
  assert.deepEqual(Object.keys(e).sort(), ["motivo", "ponto", "rua", "telefone"]);
});
